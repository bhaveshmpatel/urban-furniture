import { prisma } from '@repo/db';
import Decimal from 'decimal.js';

export async function computeAchievedAmount(budgetId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { analyticAccount: true },
  });

  if (!budget) throw new Error("Budget not found");

  if (budget.status !== 'CONFIRMED' && budget.status !== 'REVISED') {
    return new Decimal(0);
  }

  const { analyticAccount, periodStart, periodEnd } = budget;
  const periodEndAdjusted = new Date(periodEnd);
  periodEndAdjusted.setUTCHours(23, 59, 59, 999);

  if (budget.type === 'INCOME') {
    const lines = await prisma.customerInvoiceLine.findMany({
      where: {
        analyticAccountId: analyticAccount.id,
        invoice: {
          status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'PAID'] },
          invoiceDate: { gte: periodStart, lte: periodEndAdjusted },
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
          invoiceDate: { gte: periodStart, lte: periodEndAdjusted },
        },
      },
    });

    return lines.reduce(
      (sum, line) => sum.plus(new Decimal(line.quantity.toString()).times(new Decimal(line.unitPrice.toString()))),
      new Decimal(0)
    );
  }
}

export async function getBudgetAchievedDetail(budgetId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { analyticAccount: true },
  });

  if (!budget) throw new Error("Budget not found");

  const { analyticAccount, periodStart, periodEnd } = budget;
  const periodEndAdjusted = new Date(periodEnd);
  periodEndAdjusted.setUTCHours(23, 59, 59, 999);

  if (budget.type === 'INCOME') {
    return await prisma.customerInvoiceLine.findMany({
      where: {
        analyticAccountId: analyticAccount.id,
        invoice: {
          status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'PAID'] },
          invoiceDate: { gte: periodStart, lte: periodEndAdjusted },
        },
      },
      include: {
        invoice: true,
        product: true
      }
    });
  } else {
    return await prisma.vendorBillLine.findMany({
      where: {
        analyticAccountId: analyticAccount.id,
        bill: {
          status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'PAID'] },
          invoiceDate: { gte: periodStart, lte: periodEndAdjusted },
        },
      },
      include: {
        bill: true,
        product: true
      }
    });
  }
}

export async function reviseBudget(budgetId: string, newCommittedAmount: number) {
  return prisma.$transaction(async (tx) => {
    const original = await tx.budget.findUnique({ where: { id: budgetId }, include: { analyticAccount: true } });
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
        type: original.type,
        responsibleContactId: original.responsibleContactId,
        status: 'DRAFT',
        revisedFromId: original.id,
      },
    });

    return newBudget;
  });
}

export async function validateExpenseBudgetLimits(
  lines: { analyticAccountId: string | null; total: number }[],
  documentDate: Date
) {
  // Group requested amounts by analytic account
  const accountTotals = new Map<string, number>();
  for (const line of lines) {
    if (!line.analyticAccountId) continue;
    const current = accountTotals.get(line.analyticAccountId) || 0;
    accountTotals.set(line.analyticAccountId, current + line.total);
  }

  for (const [accountId, requestedAmount] of accountTotals.entries()) {
    // Find active expense budget for this account encompassing the document date
    const dateQuery = new Date(documentDate);
    // document date should be between periodStart and periodEndAdjusted.
    // For prisma query: periodStart <= dateQuery and periodEnd >= dateQuery (approximated, we'll check properly in memory)
    
    const activeBudgets = await prisma.budget.findMany({
      where: {
        analyticAccountId: accountId,
        type: 'EXPENSE',
        status: { in: ['CONFIRMED', 'REVISED'] },
        periodStart: { lte: dateQuery }
      }
    });

    // Filter memory for exact end boundary
    const budget = activeBudgets.find(b => {
      const pEnd = new Date(b.periodEnd);
      pEnd.setUTCHours(23, 59, 59, 999);
      return dateQuery <= pEnd;
    });

    if (budget) {
      const achieved = await computeAchievedAmount(budget.id);
      const remaining = Number(budget.committedAmount) - achieved.toNumber();
      
      if (requestedAmount > remaining) {
        const account = await prisma.analyticAccount.findUnique({ where: { id: accountId }});
        throw new Error(`Budget exceeded for ${account?.name || 'Account'}. Remaining budget is ${remaining.toLocaleString()}, but you requested ${requestedAmount.toLocaleString()}.`);
      }
    }
  }
}
