import { prisma } from './src/index';
async function main() {
  const acc = await prisma.account.findFirst();
  console.log("Found an account:", acc);
  const acc5000 = await prisma.account.findFirst({ where: { code: '5000' } });
  console.log("Account 5000:", acc5000);
}
main().finally(() => prisma.$disconnect());
