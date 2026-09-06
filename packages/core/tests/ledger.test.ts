import { describe, it, expect, mock, beforeEach } from 'bun:test';

// ---------------------------------------------------------------------------
// Mock @repo/db BEFORE importing the module under test
// ---------------------------------------------------------------------------

// We mock the entire module so `prisma` is our controlled object.
const mockFindMany    = mock((args?: any): Promise<any[]> => Promise.resolve([]));
const mockTransaction = mock(async (cb: (tx: unknown) => Promise<unknown>) =>
  cb(mockTx),
);

const mockCreate = mock((args?: any): Promise<any> =>
  Promise.resolve({
    id: 'je-test-001',
    journalId: 'journal-001',
    date: new Date('2026-01-01'),
    reference: 'TEST-REF',
    sourceType: null,
    sourceId: null,
    createdAt: new Date(),
    items: [
      {
        id: 'ji-001',
        journalEntryId: 'je-test-001',
        accountId: 'acc-001',
        debit: '500.00',
        credit: '0.00',
        analyticAccountId: null,
        account: { id: 'acc-001', name: 'Cash', type: 'ASSET', code: '1000' },
      },
      {
        id: 'ji-002',
        journalEntryId: 'je-test-001',
        accountId: 'acc-002',
        debit: '0.00',
        credit: '500.00',
        analyticAccountId: null,
        account: { id: 'acc-002', name: 'Revenue', type: 'INCOME', code: '4000' },
      },
    ],
  }),
);

// The mock transaction-client (tx) just exposes journalEntry.create
const mockTx = {
  journalEntry: { create: mockCreate },
};

// Mock the entire @repo/db module
mock.module('@repo/db', () => ({
  prisma: {
    account: { findMany: mockFindMany },
    $transaction: mockTransaction,
  },
}));

// NOW import the module under test (after mock.module registration)
const { postJournalEntry, LedgerError } = await import('../src/ledger.js');

// ---------------------------------------------------------------------------
// Test accounts used across tests
// ---------------------------------------------------------------------------

const MOCK_ACCOUNTS = [
  { id: 'acc-001', name: 'Cash',    type: 'ASSET',  code: '1000' },
  { id: 'acc-002', name: 'Revenue', type: 'INCOME', code: '4000' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('postJournalEntry', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockFindMany.mockReset();
    mockTransaction.mockReset();
    mockCreate.mockReset();

    // Restore default happy-path behaviour
    mockFindMany.mockImplementation((args?: any) => {
      const ids: string[] = args?.where?.id?.in ?? [];
      return Promise.resolve(MOCK_ACCOUNTS.filter((a) => ids.includes(a.id)));
    });

    mockCreate.mockImplementation((args?: any) =>
      Promise.resolve({
        id: 'je-test-001',
        journalId: 'journal-001',
        date: new Date('2026-01-01'),
        reference: 'TEST-REF',
        sourceType: null,
        sourceId: null,
        createdAt: new Date(),
        items: [
          {
            id: 'ji-001',
            journalEntryId: 'je-test-001',
            accountId: 'acc-001',
            debit: '500.00',
            credit: '0.00',
            analyticAccountId: null,
            account: MOCK_ACCOUNTS[0]!,
          },
          {
            id: 'ji-002',
            journalEntryId: 'je-test-001',
            accountId: 'acc-002',
            debit: '0.00',
            credit: '500.00',
            analyticAccountId: null,
            account: MOCK_ACCOUNTS[1]!,
          },
        ],
      }),
    );

    mockTransaction.mockImplementation(
      async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
    );
  });

  // -------------------------------------------------------------------------
  // 1. Balanced entry succeeds
  // -------------------------------------------------------------------------
  it('should succeed and return a journal entry for a balanced entry', async () => {
    const result = await postJournalEntry({
      journalId: 'journal-001',
      date: new Date('2026-01-01'),
      reference: 'TEST-REF',
      items: [
        { accountId: 'acc-001', debit: '500.00' },
        { accountId: 'acc-002', credit: '500.00' },
      ],
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('je-test-001');
    expect(result.items).toHaveLength(2);

    // Prisma transaction was called
    expect(mockTransaction).toHaveBeenCalledTimes(1);

    // journalEntry.create was called with correct shape
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const createArg = mockCreate.mock.calls[0]![0] as any;
    expect(createArg.data.journalId).toBe('journal-001');
    expect(createArg.data.items.create).toHaveLength(2);
  });

  // -------------------------------------------------------------------------
  // 2. Unbalanced entry throws LedgerError UNBALANCED_ENTRY
  // -------------------------------------------------------------------------
  it('should throw LedgerError with code UNBALANCED_ENTRY when debits ≠ credits', async () => {
    let error: unknown;

    try {
      await postJournalEntry({
        journalId: 'journal-001',
        date: new Date('2026-01-01'),
        items: [
          { accountId: 'acc-001', debit: '300.00' },
          { accountId: 'acc-002', credit: '500.00' },
        ],
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(LedgerError);
    const ledgerError = error as InstanceType<typeof LedgerError>;
    expect(ledgerError.code).toBe('UNBALANCED_ENTRY');
    expect(ledgerError.message).toBe('Journal entry debits must equal credits');
    expect(ledgerError.meta?.debits).toBe('300.00');
    expect(ledgerError.meta?.credits).toBe('500.00');

    // Should fail before hitting the DB
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 3. Zero amounts throw LedgerError ZERO_ENTRY
  // -------------------------------------------------------------------------
  it('should throw LedgerError with code ZERO_ENTRY when all amounts are zero', async () => {
    let error: unknown;

    try {
      await postJournalEntry({
        journalId: 'journal-001',
        date: new Date('2026-01-01'),
        items: [
          { accountId: 'acc-001', debit: '0' },
          { accountId: 'acc-002', credit: '0' },
        ],
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(LedgerError);
    const ledgerError = error as InstanceType<typeof LedgerError>;
    expect(ledgerError.code).toBe('ZERO_ENTRY');
    expect(ledgerError.message).toBe('Journal entry must have non-zero amounts');

    // Should fail before any DB access
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('should throw LedgerError ZERO_ENTRY when items have no debit/credit fields', async () => {
    let error: unknown;

    try {
      await postJournalEntry({
        journalId: 'journal-001',
        date: new Date('2026-01-01'),
        items: [
          { accountId: 'acc-001' }, // no debit or credit
          { accountId: 'acc-002' },
        ],
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(LedgerError);
    expect((error as InstanceType<typeof LedgerError>).code).toBe('ZERO_ENTRY');
  });

  // -------------------------------------------------------------------------
  // 4. Invalid account ID throws LedgerError INVALID_ACCOUNT
  // -------------------------------------------------------------------------
  it('should throw LedgerError with code INVALID_ACCOUNT when an account does not exist', async () => {
    // Mock returns only acc-001, not acc-999
    mockFindMany.mockImplementation(() =>
      Promise.resolve([MOCK_ACCOUNTS[0]]),
    );

    let error: unknown;

    try {
      await postJournalEntry({
        journalId: 'journal-001',
        date: new Date('2026-01-01'),
        items: [
          { accountId: 'acc-001', debit: '500.00' },
          { accountId: 'acc-999', credit: '500.00' }, // does not exist
        ],
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(LedgerError);
    const ledgerError = error as InstanceType<typeof LedgerError>;
    expect(ledgerError.code).toBe('INVALID_ACCOUNT');
    expect(ledgerError.message).toBe('One or more accounts not found');
    expect(ledgerError.meta?.missing).toEqual(['acc-999']);

    // DB was queried for accounts but transaction was NOT started
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('should throw LedgerError INVALID_ACCOUNT listing ALL missing ids', async () => {
    // Mock returns nothing (completely empty DB)
    mockFindMany.mockImplementation(() => Promise.resolve([]));

    let error: unknown;

    try {
      await postJournalEntry({
        journalId: 'journal-001',
        date: new Date('2026-01-01'),
        items: [
          { accountId: 'acc-aaa', debit: '250.00' },
          { accountId: 'acc-bbb', credit: '250.00' },
        ],
      });
    } catch (e) {
      error = e;
    }

    const ledgerError = error as InstanceType<typeof LedgerError>;
    expect(ledgerError.code).toBe('INVALID_ACCOUNT');
    // Both missing IDs reported
    const missing = ledgerError.meta?.missing as string[];
    expect(missing).toContain('acc-aaa');
    expect(missing).toContain('acc-bbb');
    expect(missing).toHaveLength(2);
  });

  // -------------------------------------------------------------------------
  // 5. Decimal precision — floating-point trap avoided
  // -------------------------------------------------------------------------
  it('should correctly validate entries that would fail with naive float arithmetic', async () => {
    // 0.1 + 0.2 === 0.3 is false in IEEE754 — Decimal must handle it
    const result = await postJournalEntry({
      journalId: 'journal-001',
      date: new Date('2026-01-01'),
      items: [
        { accountId: 'acc-001', debit: '0.10' },
        { accountId: 'acc-001', debit: '0.20' },
        { accountId: 'acc-002', credit: '0.30' },
      ],
    });

    expect(result).toBeDefined();
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });
});
