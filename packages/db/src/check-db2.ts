import { prisma } from './index.ts';
async function main() {
  console.log("Purchase Orders:", await prisma.purchaseOrder.count());
  console.log("Sales Orders:", await prisma.salesOrder.count());
}
main().finally(() => prisma.$disconnect());
