import { prisma } from "./src/index";
async function main() {
  await prisma.account.deleteMany();
  console.log("Deleted all.");
  const res = await prisma.account.create({
    data: {
      code: "ACC-10000",
      name: "Account 0",
      type: "ASSET"
    }
  });
  console.log("Inserted!", res);
}
main().finally(() => prisma.$disconnect());
