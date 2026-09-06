import { prisma } from './src/index';

async function main() {
  await prisma.$executeRawUnsafe(`
    UPDATE "Account" SET "isArchived" = false WHERE code IN ('1000', '1010', '1100', '1200', '2000', '2100', '3000', '3100', '4000', '5000', '5100');
  `);
  console.log("Unarchived the core accounts.");
}
main().finally(() => prisma.$disconnect());
