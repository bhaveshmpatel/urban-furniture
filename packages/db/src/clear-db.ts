import { prisma } from "./index";

async function main() {
  console.log("Clearing DB...");
  await prisma.payment.deleteMany();
  await prisma.journalItem.deleteMany();
  await prisma.journalEntry.deleteMany();

  await prisma.vendorBillLine.deleteMany();
  await prisma.vendorBill.deleteMany();
  await prisma.purchaseOrderLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();

  await prisma.customerInvoiceLine.deleteMany();
  await prisma.customerInvoice.deleteMany();
  await prisma.salesOrderLine.deleteMany();
  await prisma.salesOrder.deleteMany();

  await prisma.budget.deleteMany();
  
  // Use raw SQL to bypass the soft-delete middleware so we can re-seed cleanly
  await prisma.$executeRawUnsafe('DELETE FROM "Journal"');
  await prisma.$executeRawUnsafe('DELETE FROM "AnalyticAccount"');
  await prisma.$executeRawUnsafe('DELETE FROM "Account"');
  await prisma.$executeRawUnsafe('DELETE FROM "Product"');
  await prisma.$executeRawUnsafe('DELETE FROM "Contact"');

  console.log("DB Cleared!");
}
main().finally(() => prisma.$disconnect());
