import { prisma } from './src/index';
import { postFromCustomerInvoice } from '../core/src/posting';

async function main() {
  const invoice = await prisma.customerInvoice.findFirst();
  if (!invoice) return;
  try {
     const je = await postFromCustomerInvoice(invoice.id);
     console.log("Success Invoice Posting!", je);
  } catch (err) {
     console.error("Failed Invoice Posting:", err);
  }
}
main().finally(() => prisma.$disconnect());
