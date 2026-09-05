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
  
  prismaInstance = new PrismaClient({
    adapter,
    log: process.env["NODE_ENV"] === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = prismaInstance;

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
export default prisma;
