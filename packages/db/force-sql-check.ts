import { prisma } from './src/index';
async function main() {
  const result = await prisma.$queryRawUnsafe(`SELECT * FROM "Account" WHERE code = '5000'`);
  console.log("Raw query 5000:", result);
}
main().finally(() => prisma.$disconnect());
