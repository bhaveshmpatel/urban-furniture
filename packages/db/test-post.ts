import { prisma } from './src/index';
import { postFromVendorBill } from '../core/src/posting';

async function main() {
  const bill = await prisma.vendorBill.findFirst({ where: { status: 'CONFIRMED' } });
  if (!bill) {
     console.log("No confirmed bills to test.");
     return;
  }
  // Let's test the posting logic without blowing up the DB completely, or we can just try it.
  try {
     const je = await postFromVendorBill(bill.id);
     console.log("Success!", je);
  } catch (err) {
     console.error("Failed:", err);
  }
}
main().finally(() => prisma.$disconnect());
