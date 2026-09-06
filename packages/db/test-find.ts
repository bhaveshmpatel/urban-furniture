import { prisma } from './src/index';
async function main() {
  const accounts = await prisma.account.findMany({ select: { code: true } });
  console.log("All codes:", accounts.map(a => a.code).filter(c => !c.startsWith('ACC-')));
}
main().finally(() => prisma.$disconnect());
