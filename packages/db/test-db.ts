import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const po = await prisma.purchaseOrder.count();
  const so = await prisma.salesOrder.count();
  const vb = await prisma.vendorBill.count();
  const ci = await prisma.customerInvoice.count();
  console.log({ po, so, vb, ci });
}
main().finally(() => prisma.$disconnect());
