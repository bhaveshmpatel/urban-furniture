import { prisma } from "./packages/db/src/index";

async function main() {
  try {
    const journal = await prisma.journal.findFirst();
    const account = await prisma.account.findFirst();
    
    if (!journal || !account) throw new Error("No journal or account found");

    const data = await prisma.journalEntry.create({ 
      data: {
        journalId: journal.id,
        date: new Date(),
        reference: "TEST-CREATE",
        status: "DRAFT",
        items: {
          create: [{
            accountId: account.id,
            contactId: null,
            analyticAccountId: null,
            debit: 100,
            credit: 0
          }]
        }
      }
    });
    console.log("Success:", data);
  } catch(e) {
    console.error("Error:", e);
  }
}
main();
