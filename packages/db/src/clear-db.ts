import { prisma } from "./index";


async function main() {
  console.log("Clearing DB...");
  await prisma.payment.deleteMany();
  await prisma.journalItem.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.vendorBillLine.deleteMany();
  await prisma.vendorBill.deleteMany();
  await prisma.customerInvoiceLine.deleteMany();
  await prisma.customerInvoice.deleteMany();
  await prisma.salesOrderLine.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.purchaseOrderLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.journal.deleteMany();
  await prisma.analyticAccount.deleteMany();
  await prisma.account.deleteMany();
  await prisma.product.deleteMany();
  await prisma.contact.deleteMany();
  console.log("DB Cleared!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
