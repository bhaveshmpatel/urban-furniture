import { prisma } from './src/index';
async function main() {
  const account = await prisma.account.findUnique({ where: { code: '5000' } });
  console.log("Account 5000:", account);
}
main().finally(() => prisma.$disconnect());
