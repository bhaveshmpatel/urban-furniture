import { prisma } from './src/index';
import { postFromPayment } from '../core/src/posting';

async function main() {
  const payment = await prisma.payment.findFirst();
  if (!payment) {
     console.log("No payments to test.");
     return;
  }
  try {
     const je = await postFromPayment(payment.id);
     console.log("Success Payment Posting!", je);
  } catch (err) {
     console.error("Failed Payment Posting:", err);
  }
}
main().finally(() => prisma.$disconnect());
