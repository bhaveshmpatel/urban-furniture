import { prisma } from './src/index';

async function main() {
  const journal = await prisma.journal.findFirst();
  const acc1 = await prisma.account.findFirst();
  const acc2 = await prisma.account.findFirst({ skip: 1 });
  
  try {
    const data = await prisma.journalEntry.create({ 
      data: {
        journalId: journal.id,
        date: new Date(),
        reference: "MANUAL-TEST",
        items: {
          create: [
            { accountId: acc1.id, debit: 100, credit: 0 },
            { accountId: acc2.id, debit: 0, credit: 100 }
          ]
        }
      }
    });
    console.log("Success:", data);
  } catch (err) {
    console.log("Failed:", err);
  }
}
main().finally(() => prisma.$disconnect());
