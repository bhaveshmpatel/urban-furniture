import { prisma } from '@repo/db';
import Decimal from 'decimal.js';

export async function computeAchievedAmount(budgetId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { analyticAccount: true },
  });

  if (!budget) throw new Error("Budget not found");

  if (budget.status !== 'CONFIRMED' && budget.status !== 'REVISED' && budget.status !== 'CANCELLED') {
    return new Decimal(0);
  }

  const { analyticAccount, periodStart, periodEnd } = budget;

  if (analyticAccount.type === 'INCOME') {
    const lines = await prisma.customerInvoiceLine.findMany({
      where: {
        analyticAccountId: analyticAccount.id,
        invoice: {
          status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'PAID'] },
          invoiceDate: { gte: periodStart, lte: periodEnd },
        },
      },
    });

    return lines.reduce(
      (sum, line) => sum.plus(new Decimal(line.quantity.toString()).times(new Decimal(line.unitPrice.toString()))),
      new Decimal(0)
    );
  } else {
    const lines = await prisma.vendorBillLine.findMany({
      where: {
        analyticAccountId: analyticAccount.id,
        bill: {
          status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'PAID'] },
          invoiceDate: { gte: periodStart, lte: periodEnd },
        },
      },
    });

    return lines.reduce(
      (sum, line) => sum.plus(new Decimal(line.quantity.toString()).times(new Decimal(line.unitPrice.toString()))),
      new Decimal(0)
    );
  }
}

export async function reviseBudget(budgetId: string, newCommittedAmount: number) {
  return prisma.$transaction(async (tx) => {
    const original = await tx.budget.findUnique({ where: { id: budgetId } });
    if (!original) throw new Error("Budget not found");
    if (original.status !== 'CONFIRMED') throw new Error("Only CONFIRMED budgets can be revised");

    // mark original as REVISED
    await tx.budget.update({
      where: { id: budgetId },
      data: { status: 'REVISED' },
    });

    // create new DRAFT budget
    const newBudget = await tx.budget.create({
      data: {
        name: `${original.name} Revised`,
        periodStart: original.periodStart,
        periodEnd: original.periodEnd,
        committedAmount: newCommittedAmount,
        analyticAccountId: original.analyticAccountId,
        responsibleContactId: original.responsibleContactId,
        status: 'DRAFT',
        revisedFromId: original.id,
      },
    });

    return newBudget;
  });
}
