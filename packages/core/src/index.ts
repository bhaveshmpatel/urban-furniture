// Ledger engine
export {
  LedgerError,
  postJournalEntry,
  type JournalItemInput,
  type PostJournalEntryInput,
} from './ledger.js';

// Business-document posting
export {
  postFromVendorBill,
  postFromCustomerInvoice,
  postFromPayment,
} from './posting.js';

// Financial reports
export {
  computeBalanceSheet,
  computeProfitAndLoss,
  computeBudgetReport,
  computeDashboard,
  type AccountBalance,
  type BalanceSheetResult,
  type ProfitAndLossResult,
  type BudgetWithActual,
  type BudgetReportResult,
  type DashboardStatusCounts,
  type DashboardResult,
} from './reports.js';
