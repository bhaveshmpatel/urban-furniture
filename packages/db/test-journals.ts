import { prisma } from './src/index';
async function main() {
  const journals = await prisma.journal.findMany({ select: { type: true, name: true, defaultDebitAccountId: true } });
  console.log(journals);
}
main().finally(() => prisma.$disconnect());
