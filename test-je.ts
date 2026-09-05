import { prisma } from "./packages/db/src/index";

async function main() {
  try {
    const data = await prisma.journalEntry.findMany({ 
      include: { journal: true, items: { include: { account: true, contact: true } } }, 
      orderBy: { date: 'desc' } 
    });
    console.log(data);
  } catch(e) {
    console.error(e);
  }
}
main();
