import { prisma } from '@repo/db';
import Decimal from 'decimal.js';

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class LedgerError extends Error {
  constructor(
    public code: string,
    message: string,
    public meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'LedgerError';
  }
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface JournalItemInput {
  accountId: string;
  debit?: number | string;
  credit?: number | string;
  analyticAccountId?: string;
  contactId?: string;
}

export interface PostJournalEntryInput {
  journalId: string;
  date: Date;
  reference?: string;
  sourceType?: string;
  sourceId?: string;
  items: JournalItemInput[];
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Post a balanced double-entry journal entry.
 *
 * Rules enforced:
 * 1. Total debits must equal total credits (Decimal arithmetic — no float drift).
 * 2. The entry must not be zero-valued.
 * 3. All referenced accountIds must exist in the DB.
 * 4. JournalEntry + all JournalItems are written atomically in one transaction.
 */
export async function postJournalEntry(input: PostJournalEntryInput) {
  // ------------------------------------------------------------------
  // 1. Balance check
  // ------------------------------------------------------------------
  const totalDebit = input.items.reduce(
    (sum, i) => sum.plus(new Decimal(i.debit ?? 0)),
    new Decimal(0),
  );
  const totalCredit = input.items.reduce(
    (sum, i) => sum.plus(new Decimal(i.credit ?? 0)),
    new Decimal(0),
  );

  if (!totalDebit.equals(totalCredit)) {
    throw new LedgerError(
      'UNBALANCED_ENTRY',
      'Journal entry debits must equal credits',
      {
        debits: totalDebit.toFixed(2),
        credits: totalCredit.toFixed(2),
      },
    );
  }

  if (totalDebit.isZero()) {
    throw new LedgerError(
      'ZERO_ENTRY',
      'Journal entry must have non-zero amounts',
    );
  }

  // ------------------------------------------------------------------
  // 2. Validate all accounts exist
  // ------------------------------------------------------------------
  const accountIds = [...new Set(input.items.map((i) => i.accountId))];

  const accounts = await prisma.account.findMany({
    where: { id: { in: accountIds } },
    select: { id: true },
  });

  if (accounts.length !== accountIds.length) {
    const found = new Set(accounts.map((a) => a.id));
    const missing = accountIds.filter((id) => !found.has(id));
    throw new LedgerError(
      'INVALID_ACCOUNT',
      'One or more accounts not found',
      { missing },
    );
  }

  // ------------------------------------------------------------------
  // 3. Write atomically
  // ------------------------------------------------------------------
  return prisma.$transaction(async (tx) => {
    return tx.journalEntry.create({
      data: {
        journalId: input.journalId,
        date: input.date,
        reference: input.reference,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        status: (input as any).status || "POSTED",
        items: {
          create: input.items.map((item) => ({
            accountId: item.accountId,
            debit: item.debit ? new Decimal(item.debit).toFixed(2) : '0.00',
            credit: item.credit ? new Decimal(item.credit).toFixed(2) : '0.00',
            analyticAccountId: item.analyticAccountId ?? null,
            contactId: item.contactId ?? null,
          })),
        },
      },
      include: {
        items: {
          include: { account: true },
        },
      },
    });
  });
}
