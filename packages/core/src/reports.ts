import { prisma, AccountType } from '@repo/db';
import Decimal from 'decimal.js';
import { computeAchievedAmount } from './budget';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface AccountBalance {
  accountId: string;
  accountName: string;
  accountCode: string | null;
  accountType: AccountType;
  balance: string; // Decimal fixed to 2dp, serialised as string
}

export interface BalanceSheetResult {
  asOfDate: Date;
  assets: AccountBalance[];
  liabilities: AccountBalance[];
  equity: AccountBalance[];
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  /** Net profit for all time up to asOfDate = Σ INCOME − Σ EXPENSE */
  retainedEarnings: string;
  /** totalLiabilities + totalEquity + retainedEarnings — should equal totalAssets */
  totalLiabilitiesAndEquity: string;
}

export interface ProfitAndLossResult {
  fromDate: Date;
  toDate: Date;
  incomeAccounts: AccountBalance[];
  expenseAccounts: AccountBalance[];
  totalIncome: string;
  totalExpenses: string;
  netProfit: string;
}

export interface BudgetWithActual {
  budgetId: string;
  name: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  analyticAccountId: string;
  analyticAccountName: string;
  responsibleContactId: string;
  committedAmount: string;
  actualAmount: string;
  variance: string;         // planned − actual
  variancePercent: string;  // variance / planned × 100 (or '0.00' when planned = 0)
}

export interface BudgetReportResult {
  budgets: BudgetWithActual[];
  totalPlanned: string;
  totalActual: string;
}

export interface DashboardStatusCounts {
  DRAFT: number;
  CONFIRMED: number;
  PARTIALLY_PAID: number;
  PAID: number;
  CANCELLED: number;
}

export interface DashboardResult {
  salesOrders: DashboardStatusCounts;
  purchaseOrders: DashboardStatusCounts;
  customerInvoices: DashboardStatusCounts;
  vendorBills: DashboardStatusCounts;
  budgetSummary: {
    totalPlanned: string;
    totalActual: string;
    variancePercent: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Given raw Prisma aggregate rows (grouped by accountId), compute a
 * single Decimal balance applying the normal-balance sign convention:
 *
 *  ASSET   → debit − credit  (debit-normal)
 *  EXPENSE → debit − credit  (debit-normal)
 *  INCOME, LIABILITY, EQUITY → credit − debit  (credit-normal)
 */
function computeBalance(
  debitSum: Decimal,
  creditSum: Decimal,
  type: AccountType,
): Decimal {
  if (type === 'ASSET' || type === 'EXPENSE') {
    return debitSum.minus(creditSum);
  }
  return creditSum.minus(debitSum);
}

/** Zero-fill a status-count map from raw Prisma groupBy output. */
function fillStatusCounts(
  rows: Array<{ status: string; _count: { _all: number } }>,
): DashboardStatusCounts {
  const base: DashboardStatusCounts = {
    DRAFT: 0,
    CONFIRMED: 0,
    PARTIALLY_PAID: 0,
    PAID: 0,
    CANCELLED: 0,
  };
  for (const row of rows) {
    const key = row.status as keyof DashboardStatusCounts;
    if (key in base) base[key] = row._count._all;
  }
  return base;
}

// ---------------------------------------------------------------------------
// Balance Sheet
// ---------------------------------------------------------------------------

/**
 * Computes a Balance Sheet as of `asOfDate`.
 *
 * Only journal items whose parent JournalEntry.date ≤ asOfDate are
 * included.  Income and expense account balances are collapsed into a
 * single `retainedEarnings` figure.
 */
export async function computeBalanceSheet(
  asOfDate: Date,
): Promise<BalanceSheetResult> {
  // Fetch all accounts with their journal items filtered by date
  const accounts = await prisma.account.findMany({
    where: { isArchived: false },
    include: {
      journalItems: {
        where: {
          journalEntry: { date: { lte: asOfDate } },
        },
        select: { debit: true, credit: true },
      },
    },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  });

  const assets: AccountBalance[]      = [];
  const liabilities: AccountBalance[] = [];
  const equity: AccountBalance[]      = [];

  let totalAssets      = new Decimal(0);
  let totalLiabilities = new Decimal(0);
  let totalEquity      = new Decimal(0);
  let retainedEarnings = new Decimal(0); // net INCOME − EXPENSE

  for (const account of accounts) {
    const debitSum  = account.journalItems.reduce(
      (s, i) => s.plus(new Decimal(i.debit.toString())),
      new Decimal(0),
    );
    const creditSum = account.journalItems.reduce(
      (s, i) => s.plus(new Decimal(i.credit.toString())),
      new Decimal(0),
    );
    const balance = computeBalance(debitSum, creditSum, account.type);

    const entry: AccountBalance = {
      accountId:   account.id,
      accountName: account.name,
      accountCode: account.code,
      accountType: account.type,
      balance:     balance.toFixed(2),
    };

    switch (account.type) {
      case 'ASSET':
        assets.push(entry);
        totalAssets = totalAssets.plus(balance);
        break;
      case 'LIABILITY':
        liabilities.push(entry);
        totalLiabilities = totalLiabilities.plus(balance);
        break;
      case 'EQUITY':
        equity.push(entry);
        totalEquity = totalEquity.plus(balance);
        break;
      case 'INCOME':
        // credit-normal income increases retained earnings
        retainedEarnings = retainedEarnings.plus(balance);
        break;
      case 'EXPENSE':
        // debit-normal expenses decrease retained earnings
        retainedEarnings = retainedEarnings.minus(balance);
        break;
    }
  }

  const totalLiabilitiesAndEquity = totalLiabilities
    .plus(totalEquity)
    .plus(retainedEarnings);

  return {
    asOfDate,
    assets,
    liabilities,
    equity,
    totalAssets:               totalAssets.toFixed(2),
    totalLiabilities:          totalLiabilities.toFixed(2),
    totalEquity:               totalEquity.toFixed(2),
    retainedEarnings:          retainedEarnings.toFixed(2),
    totalLiabilitiesAndEquity: totalLiabilitiesAndEquity.toFixed(2),
  };
}

// ---------------------------------------------------------------------------
// Profit & Loss
// ---------------------------------------------------------------------------

/**
 * Computes a Profit & Loss statement for the given date range (inclusive).
 *
 * Only INCOME and EXPENSE accounts are included; balance-sheet accounts
 * are excluded.
 */
export async function computeProfitAndLoss(
  fromDate: Date,
  toDate: Date,
): Promise<ProfitAndLossResult> {
  const accounts = await prisma.account.findMany({
    where: {
      isArchived: false,
      type: { in: ['INCOME', 'EXPENSE'] },
    },
    include: {
      journalItems: {
        where: {
          journalEntry: {
            date: { gte: fromDate, lte: toDate },
          },
        },
        select: { debit: true, credit: true },
      },
    },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  });

  const incomeAccounts:  AccountBalance[] = [];
  const expenseAccounts: AccountBalance[] = [];

  let totalIncome   = new Decimal(0);
  let totalExpenses = new Decimal(0);

  for (const account of accounts) {
    const debitSum  = account.journalItems.reduce(
      (s, i) => s.plus(new Decimal(i.debit.toString())),
      new Decimal(0),
    );
    const creditSum = account.journalItems.reduce(
      (s, i) => s.plus(new Decimal(i.credit.toString())),
      new Decimal(0),
    );
    const balance = computeBalance(debitSum, creditSum, account.type);

    const entry: AccountBalance = {
      accountId:   account.id,
      accountName: account.name,
      accountCode: account.code,
      accountType: account.type,
      balance:     balance.toFixed(2),
    };

    if (account.type === 'INCOME') {
      incomeAccounts.push(entry);
      totalIncome = totalIncome.plus(balance);
    } else {
      expenseAccounts.push(entry);
      totalExpenses = totalExpenses.plus(balance);
    }
  }

  const netProfit = totalIncome.minus(totalExpenses);

  return {
    fromDate,
    toDate,
    incomeAccounts,
    expenseAccounts,
    totalIncome:   totalIncome.toFixed(2),
    totalExpenses: totalExpenses.toFixed(2),
    netProfit:     netProfit.toFixed(2),
  };
}

// ---------------------------------------------------------------------------
// Budget Report
// ---------------------------------------------------------------------------

/**
 * Computes a Budget vs Actual report.
 *
 * Actual amounts are derived from JournalItems tagged with the budget's
 * `analyticAccountId` where the JournalEntry.date falls within the budget
 * period.
 *
 * @param period  Optional period string filter, e.g. "2026-Q1".
 */
export async function computeBudgetReport(
  period?: string,
): Promise<BudgetReportResult> {
  const budgets = await prisma.budget.findMany({
    where: undefined,
    include: {
      analyticAccount: true,
      responsiblePerson: {
        select: { id: true, email: true },
      },
    },
    orderBy: [{ periodStart: 'asc' }, { name: 'asc' }],
  });

  // For each budget, aggregate actual spending from journal items
  const results: BudgetWithActual[] = await Promise.all(
    budgets.map(async (budget) => {
      // Sum all debit journal items tagged with this analytic account
      // in the "Q1".  We take abs(debit − credit) because
      // expense items are normally debit-normal and income items
      // are credit-normal; callers of this report typically care
      // about the magnitude of actual activity.
      const aggregate = await prisma.journalItem.aggregate({
        where: {
          analyticAccountId: budget.analyticAccountId,
          journalEntry: {
            date: {
              gte: budget.periodStart,
              lte: budget.periodEnd,
            },
          },
        },
        _sum: {
          debit:  true,
          credit: true,
        },
      });

      const actualDebit  = new Decimal(
        (aggregate._sum.debit  ?? 0).toString(),
      );
      const actualCredit = new Decimal(
        (aggregate._sum.credit ?? 0).toString(),
      );
      // Net actual = debit − credit for expense analytic accounts
      // and credit − debit for income analytic accounts
      const actualAmount =
        budget.analyticAccount.type === 'EXPENSE'
          ? actualDebit.minus(actualCredit)
          : actualCredit.minus(actualDebit);

      const planned  = new Decimal(budget.committedAmount.toString());
      const variance = planned.minus(actualAmount);
      const variancePercent = planned.isZero()
        ? new Decimal(0)
        : variance.div(planned).times(100);

      return {
        budgetId:            budget.id,
        name:                budget.name,
        period:              "Q1",
        periodStart:         budget.periodStart,
        periodEnd:           budget.periodEnd,
        analyticAccountId:   budget.analyticAccountId,
        analyticAccountName: budget.analyticAccount.name,
        responsibleContactId:   budget.responsibleContactId,
        committedAmount:       planned.toFixed(2),
        actualAmount:        actualAmount.toFixed(2),
        variance:            variance.toFixed(2),
        variancePercent:     variancePercent.toFixed(2),
      };
    }),
  );

  const totalPlanned = results.reduce(
    (s, b) => s.plus(new Decimal(b.committedAmount)),
    new Decimal(0),
  );
  const totalActual = results.reduce(
    (s, b) => s.plus(new Decimal(b.actualAmount)),
    new Decimal(0),
  );

  return {
    budgets:      results,
    totalPlanned: totalPlanned.toFixed(2),
    totalActual:  totalActual.toFixed(2),
  };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/**
 * Computes a high-level dashboard summary covering document counts by
 * status for all major document types and a budget overview.
 */
export async function computeDashboard(): Promise<DashboardResult & { monthlySales?: any[] }> {
  const [
    salesOrderRows,
    purchaseOrderRows,
    customerInvoiceRows,
    vendorBillRows,
    allInvoices,
    activeBudgets
  ] = await Promise.all([
    // Status counts
    prisma.salesOrder.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.purchaseOrder.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.customerInvoice.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.vendorBill.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    // Invoices for monthly sales
    prisma.customerInvoice.findMany({
      where: { status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'PAID'] } },
      select: { invoiceDate: true, totalAmount: true }
    }),
    // Active Budgets
    prisma.budget.findMany({
      where: { status: { in: ['CONFIRMED', 'REVISED'] } },
    })
  ]);
  
  // Calculate Planned vs Actual using the correct logic (which includes POs)
  let totalPlannedNum = 0;
  let totalActualNum = 0;
  
  for (const b of activeBudgets) {
    totalPlannedNum += Number(b.committedAmount || 0);
    const achieved = await computeAchievedAmount(b.id);
    totalActualNum += achieved.toNumber();
  }

  const totalPlanned = new Decimal(totalPlannedNum);
  const totalActual = new Decimal(totalActualNum);

  const variancePercent = totalPlanned.isZero()
    ? new Decimal(0)
    : totalPlanned.minus(totalActual).div(totalPlanned).times(100);

  // Group invoices by YYYY-MM
  const salesByMonth = allInvoices.reduce((acc: any, inv) => {
    const d = new Date(inv.invoiceDate);
    const month = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0');
    if (!acc[month]) acc[month] = 0;
    acc[month] += Number(inv.totalAmount);
    return acc;
  }, {});

  const monthlySales = Object.keys(salesByMonth).sort().map(month => {
    const [y, m] = month.split('-');
    const monthName = new Date(Number(y), Number(m)-1).toLocaleString('default', { month: 'short' });
    return {
      name: monthName + ' ' + y,
      sales: salesByMonth[month],
    };
  });

  return {
    salesOrders:      fillStatusCounts(salesOrderRows),
    purchaseOrders:   fillStatusCounts(purchaseOrderRows),
    customerInvoices: fillStatusCounts(customerInvoiceRows),
    vendorBills:      fillStatusCounts(vendorBillRows),
    budgetSummary: {
      totalPlanned:    totalPlanned.toFixed(2),
      totalActual:     totalActual.toFixed(2),
      variancePercent: variancePercent.toFixed(2),
    },
    monthlySales,
  };
}