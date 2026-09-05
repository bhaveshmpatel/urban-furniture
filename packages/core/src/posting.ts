import { prisma } from '@repo/db';
import Decimal from 'decimal.js';
import { postJournalEntry, LedgerError } from './ledger.js';

// ---------------------------------------------------------------------------
// Account code constants (fixed in seed data)
// ---------------------------------------------------------------------------

const ACCOUNT_CODES = {
  CASH: '1000',
  BANK: '1010',
  DEBTORS: '1100',         // Accounts Receivable
  CREDITORS: '2000',       // Accounts Payable
  TAX_PAYABLE: '2100',
  SALES_INCOME: '4000',
  PURCHASE_EXPENSE: '5000',
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAccountByCode(code: string) {
  const account = await prisma.account.findUnique({ where: { code } });
  if (!account) {
    throw new LedgerError(
      'ACCOUNT_NOT_FOUND',
      `Account with code ${code} not found`,
      { code },
    );
  }
  return account;
}

// ---------------------------------------------------------------------------
// Posting functions
// ---------------------------------------------------------------------------

/**
 * Purchase flow — posts a vendor bill as a journal entry.
 *
 * Accounting effect:
 *   Dr  Purchase Expense   (5000)
 *   Cr  Creditors/AP       (2000)
 */
export async function postFromVendorBill(billId: string) {
  const bill = await prisma.vendorBill.findUnique({
    where: { id: billId },
    include: { purchaseOrder: true },
  });
  if (!bill) throw new LedgerError('NOT_FOUND', 'Vendor bill not found', { billId });

  const journal = await prisma.journal.findFirst({ where: { type: 'PURCHASE' } });
  if (!journal) throw new LedgerError('NO_JOURNAL', 'Purchase journal not found');

  const [purchaseExpense, creditors] = await Promise.all([
    getAccountByCode(ACCOUNT_CODES.PURCHASE_EXPENSE),
    getAccountByCode(ACCOUNT_CODES.CREDITORS),
  ]);

  const total = new Decimal(bill.totalAmount.toString());

  return postJournalEntry({
    journalId: journal.id,
    date: bill.invoiceDate,
    reference: `BILL-${bill.id.slice(-8).toUpperCase()}`,
    sourceType: 'VENDOR_BILL',
    sourceId: bill.id,
    items: [
      { accountId: purchaseExpense.id, debit: total.toFixed(2) },
      { accountId: creditors.id,       credit: total.toFixed(2) },
    ],
  });
}

/**
 * Sales flow — posts a customer invoice as a journal entry.
 *
 * Accounting effect:
 *   Dr  Debtors/AR         (1100)   full invoice total
 *   Cr  Sales Income       (4000)   subtotal (excl. tax)
 *   Cr  Tax Payable        (2100)   tax portion (if > 0)
 */
export async function postFromCustomerInvoice(invoiceId: string) {
  const invoice = await prisma.customerInvoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) throw new LedgerError('NOT_FOUND', 'Customer invoice not found', { invoiceId });

  const journal = await prisma.journal.findFirst({ where: { type: 'SALES' } });
  if (!journal) throw new LedgerError('NO_JOURNAL', 'Sales journal not found');

  const [debtors, salesIncome, taxPayable] = await Promise.all([
    getAccountByCode(ACCOUNT_CODES.DEBTORS),
    getAccountByCode(ACCOUNT_CODES.SALES_INCOME),
    getAccountByCode(ACCOUNT_CODES.TAX_PAYABLE),
  ]);

  const total    = new Decimal(invoice.totalAmount.toString());
  const tax      = new Decimal(invoice.taxAmount.toString());
  const subtotal = total.minus(tax);

  const items: Parameters<typeof postJournalEntry>[0]['items'] = [
    { accountId: debtors.id,     debit:  total.toFixed(2) },
    { accountId: salesIncome.id, credit: subtotal.toFixed(2) },
  ];

  if (tax.greaterThan(0)) {
    items.push({ accountId: taxPayable.id, credit: tax.toFixed(2) });
  }

  return postJournalEntry({
    journalId: journal.id,
    date: invoice.invoiceDate,
    reference: `INV-${invoice.id.slice(-8).toUpperCase()}`,
    sourceType: 'CUSTOMER_INVOICE',
    sourceId: invoice.id,
    items,
  });
}

/**
 * Payment flow — posts a payment (outgoing or incoming) as a journal entry.
 *
 * Paying a vendor bill:
 *   Dr  Creditors/AP       (2000)
 *   Cr  Cash / Bank        (1000 / 1010)
 *
 * Receiving customer payment:
 *   Dr  Cash / Bank        (1000 / 1010)
 *   Cr  Debtors/AR         (1100)
 */
export async function postFromPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) throw new LedgerError('NOT_FOUND', 'Payment not found', { paymentId });

  const cashOrBankCode =
    payment.method === 'CASH' ? ACCOUNT_CODES.CASH : ACCOUNT_CODES.BANK;
  const journalType = payment.method === 'CASH' ? 'CASH' : 'BANK';

  const [cashOrBank, debtors, creditors, journal] = await Promise.all([
    getAccountByCode(cashOrBankCode),
    getAccountByCode(ACCOUNT_CODES.DEBTORS),
    getAccountByCode(ACCOUNT_CODES.CREDITORS),
    prisma.journal.findFirst({ where: { type: journalType } }),
  ]);

  if (!journal) {
    throw new LedgerError('NO_JOURNAL', `${journalType} journal not found`);
  }

  const amount = new Decimal(payment.amount.toString());

  const items: Parameters<typeof postJournalEntry>[0]['items'] =
    payment.vendorBillId
      ? [
          // Paying vendor: Dr Creditors / Cr Cash-or-Bank
          { accountId: creditors.id,  debit:  amount.toFixed(2) },
          { accountId: cashOrBank.id, credit: amount.toFixed(2) },
        ]
      : [
          // Receiving customer payment: Dr Cash-or-Bank / Cr Debtors
          { accountId: cashOrBank.id, debit:  amount.toFixed(2) },
          { accountId: debtors.id,    credit: amount.toFixed(2) },
        ];

  return postJournalEntry({
    journalId: journal.id,
    date: payment.paymentDate,
    reference: `PMT-${payment.id.slice(-8).toUpperCase()}`,
    sourceType: 'PAYMENT',
    sourceId: payment.id,
    items,
  });
}
