import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  const basePrisma = new PrismaClient({
    adapter,
    log: process.env["NODE_ENV"] === "development" ? ["query", "error", "warn"] : ["error"],
  });

  const archivedModels = ["Contact", "Product", "Account", "AnalyticAccount", "Journal"];

  prismaInstance = basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!archivedModels.includes(model)) {
            return query(args);
          }

          let isArchiving = false;
          let beforeState = null;
          let a = args as any;

          if (operation === "delete") {
            operation = "update" as any;
            a.data = { isArchived: true };
            isArchiving = true;
          } else if (operation === "deleteMany") {
            operation = "updateMany" as any;
            if (a.data) {
              a.data.isArchived = true;
            } else {
              a.data = { isArchived: true };
            }
            isArchiving = true;
          } else if (operation === "findUnique" || operation === "findFirst") {
            operation = "findFirst" as any;
            if (!a) a = { where: {} };
            if (!a.where) a.where = {};
            if (a.where.isArchived === undefined) {
              a.where.isArchived = false;
            }
          } else if (operation === "findMany" || operation === "count") {
            if (!a) a = { where: {} };
            if (!a.where) a.where = {};
            if (a.where.isArchived === undefined) {
              a.where.isArchived = false;
            }
          }

          if (operation === "update" || isArchiving) {
            try {
              if (a.where && a.where.id) {
                // @ts-ignore
                beforeState = await basePrisma[model].findFirst({
                  where: { id: a.where.id, isArchived: undefined }
                });
              }
            } catch (e) {}
          }

          const result = await (basePrisma as any)[model][operation](a);

          if (["create", "update"].includes(operation) || isArchiving) {
            let actionStr = operation === "create" ? "CREATE" : (isArchiving ? "ARCHIVE" : "UPDATE");
            if (operation === "update" && a.data?.isArchived === true) {
              actionStr = "ARCHIVE";
            }
            const entityId = result?.id;
            
            if (entityId) {
              // @ts-ignore
              basePrisma.auditLog.create({
                data: {
                  entity: model,
                  entityId,
                  action: actionStr,
                  before: beforeState ? JSON.parse(JSON.stringify(beforeState)) : undefined,
                  after: result ? JSON.parse(JSON.stringify(result)) : undefined,
                }
              }).catch(console.error);
            }
          }

          return result;
        }
      }
    }
  }) as any;
}

export const prisma = prismaInstance;

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
export default prisma;
