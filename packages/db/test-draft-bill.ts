import { prisma } from './src/index';

async function main() {
  const bill = await prisma.vendorBill.findFirst({ where: { status: 'DRAFT' } });
  console.log(bill ? bill.id : "NO DRAFT BILLS");
}
main().finally(() => prisma.$disconnect());
