# Urban Furniture — Accounting System
## Master Build Prompt for Production-Grade Backend

> Feed this file to an AI coding agent (or use it as the team's build doc) to scaffold and implement the backend, database, and API for the Urban Furniture accounting system. It assumes the stack below is fixed and non-negotiable for the hackathon timeline.

---
Also all the required are alredy downloaded use the skills as required

## 0. Stack & Repo Constraints

| Concern | Choice | Why |
|---|---|---|
| Monorepo | Turborepo (`apps/web`, `apps/api`) | Shared types/schema between frontend and backend, single install |
| Runtime/PM | Bun | Fast installs, fast dev-server restarts |
| Database | PostgreSQL, hosted locally|
| ORM | Prisma | Schema-first, `prisma studio` = free admin panel |
| Styling/UI | Tailwind + shadcn/ui | No hand-rolled forms/tables/dialogs |
| Validation | Zod + react-hook-form | Shared schemas client/server, pairs with Server Actions |
| Auth | NextAuth (Credentials provider) **or** a hand-rolled session-cookie service | Role stored as a field on `User` — no separate RBAC engine |
| Charts | Recharts | Balance Sheet / P&L visualizations |

Build **`apps/api`** as the source of truth for all business logic (Next.js Route Handlers or a standalone Hono/Express app — pick Route Handlers unless the team wants a fully decoupled API, since it avoids CORS/deploy friction in a 24h window). `apps/web` consumes it via typed fetch clients or Server Actions calling shared service functions directly from `packages/db` + `packages/core`.

Suggested package layout:
```
apps/
  web/            # Next.js app (Server Components + Server Actions + shadcn/ui)
  api/            # Route handlers (if decoupled) — otherwise fold into web/app/api
packages/
  db/             # Prisma schema, client, seed script
  core/           # Business logic: ledger posting, tax calc, report builders
  auth/           # session/JWT helpers, role guards
  validators/     # Zod schemas shared by forms + API
  ui/             # shared shadcn/ui components (optional)
```

---

## 1. Domain Understanding (what you are building)

Urban Furniture needs a **double-entry accounting system**, not just a CRUD invoicing tool. Every business event (a sale, a purchase, a payment) must ultimately produce a **balanced Journal Entry** (total Debits = total Credits) against the Chart of Accounts, because the Balance Sheet, P&L, and Budget Report are all *derived* from the Journal Entry ledger — they are never separately maintained tables of truth.

### 1.1 Actors & Permissions

| Role | Can do |
|---|---|
| **Admin** (Business Owner) | Full access: create/modify/archive all master data, record any transaction, view all reports, manage users |
| **Accountant** (Invoicing User) | Create master data (Contacts, Products, CoA, Journals, Budgets), record all transactions (PO/Bill, SO/Invoice, Payment), view all reports. Cannot manage other users. |
| **Contact User** (Customer/Vendor portal) | Auto-created alongside a Contact master record. Can only view **their own** invoices/bills and their paid/unpaid status, and make a payment against their own dues. No access to master data or reports. |
| **System** | Not a login role — represents automated validation, tax computation, ledger posting, and report generation triggered by the above actors' actions. |

Auth rules (from the UI mockups — enforce these server-side, not just in the form):
- Login ID: unique, 6–12 characters.
- Email: unique across users.
- Password: unique per policy — must contain a lowercase letter, an uppercase letter, a special character, and be more than 8 characters long. Hash with bcrypt/argon2; never store plaintext; "unique password" should be interpreted as "not reused" only if you have time — at minimum enforce the complexity rule.
- Signup page only ever creates an **Accountant** (invoicing user) account — Admin and Contact users are created by an Admin, not via public signup.
- Invalid login → generic error: "Invalid Login Id or Password" (do not leak which field was wrong).
- Forgot-password flow can be stubbed (token table + email log to console) given the 24h budget.

### 1.2 Core Concepts (must be modeled correctly, not glossed over)

1. **Chart of Accounts (CoA)** — the master list of ledger buckets. Every account has a `type`: `ASSET | LIABILITY | EQUITY | INCOME | EXPENSE`. Normal balance side (debit vs credit) is derived from type, not stored separately.
2. **Journal** — a named grouping/book of entries by transaction type (`SALES | PURCHASE | BANK | CASH | GENERAL`), each with default debit/credit accounts to speed up entry creation.
3. **Journal Entry** — the atomic, immutable accounting record. Has a date, reference, and 2+ **Journal Items** (lines), each pointing to one Account with either a debit or credit amount. **A Journal Entry must balance**: `SUM(debit) === SUM(credit)`. This is a DB-level and application-level invariant.
4. **Analytic Account** — a cost-center tag (project/department) that can be attached to journal items for management reporting; independent of the CoA.
5. **Budget** — planned amount for an Analytic Account over a Period, with a Responsible Person; Budget Report compares planned vs. actual (actual = sum of journal items tagged with that analytic account + period, filtered by income/expense type).
6. **Transaction documents** (PO, Vendor Bill, SO, Customer Invoice, Payment) are **not** themselves ledger entries — each one, on confirmation, generates a Journal Entry via a deterministic posting rule (see §3.3). Documents carry a lifecycle status (`DRAFT → CONFIRMED → (BILLED/INVOICED) → PAID`).

### 1.3 Key Business Flows

- **Purchase:** Purchase Order (draft, vendor+lines) → confirm → convert to Vendor Bill (adds invoice date, due date) → on Bill confirm, post `Dr Purchase Expense / Cr Creditors (Accounts Payable)` for the bill total (+ tax handling, see below) → register Payment (Cash/Bank) → on payment, post `Dr Creditors / Cr Cash-or-Bank`.
- **Sale:** Sales Order (draft, customer + lines + tax) → confirm → generate Customer Invoice → on invoice confirm, post `Dr Debtors (Accounts Receivable) / Cr Sales Income` (+ `Cr Tax Payable` if tax present) for invoice total → register Payment (Cash/Bank) → on payment, post `Dr Cash-or-Bank / Cr Debtors`.
- Partial payments must be supported: a Bill/Invoice can have many Payments; track `amount_paid` vs `amount_due`, and status transitions to `PAID` only when fully settled (or `PARTIALLY_PAID` in between).
- Every status-changing action must be **transactional** — document status update + ledger posting happen in one DB transaction, or neither happens.

### 1.4 Reports (all computed, never separately stored)

- **Balance Sheet**: as-of-date snapshot. `Assets = Liabilities + Equity (+ retained P&L)`, computed by summing journal item balances per account, grouped by account type, as of a given date.
- **Profit & Loss**: for a date range. `Net Profit = Total Income − Total Expenses`, from Income/Expense account balances in that range.
- **Budget Report**: for each Budget row, `Committed/Achieved = SUM(actual journal items tagged to that analytic account in that period)` vs `planned amount`; also needs Draft/Confirmed counts as seen in the dashboard mockup (All / Confirmed / Draft tallies for Sales, Purchase, and Budget "Achieved / Budget / Committed" tallies).

---

## 2. Deliverable: What the Coding Agent Must Produce

Work through these phases **in order**. Do not skip straight to UI — the ledger-posting engine is the hard, gradable part of this problem.

### Phase 1 — Repo & Infra Setup
1. Scaffold with `apps/web`, `packages/db`, `packages/core`, `packages/validators`, `packages/auth`.
2. Provision a free Neon/Supabase Postgres instance; put `DATABASE_URL` in `.env` (and `.env.example` committed).
3. Init Prisma in `packages/db`, point at that URL, configure `packages/db` as a workspace package exporting a singleton `PrismaClient`.
4. Configure Tailwind + shadcn/ui in `apps/web`. Install Zod + react-hook-form + `@hookform/resolvers`.
5. Set up NextAuth Credentials provider (or custom session-cookie service in `packages/auth`) with JWT/session containing `{ userId, role, contactId? }`.

### Phase 2 — Database Schema (Prisma)
Implement the schema in **§4** verbatim (adjust naming to team convention if needed, but preserve every relationship and constraint). Run `prisma migrate dev` and `prisma db seed` (seed script must create: 1 Admin, 1 Accountant, the CoA example accounts, 2 Journals — Sales & Purchase — with default accounts, the two example Contacts (Rahul Sharma vendor, Nimesh Pathak customer), and the four example Products).

### Phase 3 — Core Ledger Engine (`packages/core`)
Build this **before** any HTTP routes:
- `postJournalEntry(input)`: validates balance (debits === credits), validates every account exists and belongs to org, writes `JournalEntry` + `JournalItem[]` in one transaction, returns the entry.
- `postFromVendorBill(billId)`, `postFromCustomerInvoice(invoiceId)`, `postFromPayment(paymentId)`: pure functions that compute the correct debit/credit lines per §1.3 and call `postJournalEntry`.
- `computeBalanceSheet(asOfDate)`, `computeProfitAndLoss(fromDate, toDate)`, `computeBudgetReport(periodFilter?)`: pure read functions aggregating `JournalItem`s.
- Write unit tests for the posting engine first (balance invariant, correct account selection, partial payment math) — this is the part a judge/reviewer will stress-test.

### Phase 4 — API Layer
Implement REST endpoints per §5, each backed by the Phase-3 functions, each guarded by role middleware from `packages/auth`, each validating input with the Zod schemas from `packages/validators`.

### Phase 5 — Frontend Wiring (brief — web is not this prompt's focus)
## Design plan

**Grounding:** This is back-office bookkeeping software — the audience is an accountant/business owner doing daily data entry and reading financial statements, not a consumer product. The subject matter (double-entry ledgers, debit/credit columns, financial statements) has its own visual vocabulary: ruled columns, tabular alignment, precise numerals. I'm grounding the design there instead of generic SaaS.

**Color** (light theme):
- `#F6F7F5` — app background (cool neutral paper, not the cream/terracotta AI-default)
- `#FFFFFF` — surface/card
- `#14171A` — ink (primary text)
- `#5B6560` — muted slate (secondary text)
- `#1F5C4E` — ledger green (primary/brand — a nod to traditional green ledger paper, distinct from generic SaaS blue/indigo)
- `#DFE3E0` — hairline border
- `#B3261E` red / `#B7791F` amber — reserved only for debit-mismatch errors and draft/pending status

**Type:**
- **IBM Plex Serif** for page titles and section headers — gives institutional gravitas without going full "financial newspaper"
- **IBM Plex Sans** for UI, body, forms, nav — same type family as the serif (clearly related, clearly distinct)
- Tabular numerals (`font-variant-numeric: tabular-nums`) on every currency figure and table — functional, not decorative, since ledger columns must align

**Layout:** Left sidebar (module groups: Sales, Purchase, Accounting, Reports), persistent top bar with search + user menu. Left-aligned content, dense tables. Flat surfaces with 1px hairline borders and small (4–6px) radii instead of soft-shadow rounded cards — reads precise and ledger-like, not "soft consumer app."

**Principle:** Spend the one bold move on the sidebar's active-state and the debit/credit table styling (real ruled lines, right-aligned numerals) — everything else stays quiet and disciplined.

I reviewed this against the generic-AI-tells list: no cream+serif+terracotta, no near-black+neon, no identical-rounded-card-kit, no ALL-CAPS eyebrows, no arrow-suffixed buttons.

- Server Actions or fetch clients calling the API.
- shadcn/ui `DataTable` for master data lists, `Dialog`/`Sheet` for create/edit forms, `Tabs` for report periods, Recharts for BS/P&L visualization, dashboard tiles matching the mockup (All/Confirmed/Draft counts; Budget Achieved/Budget/Committed counts).

### Phase 6 — Hardening (if time remains)
- Rate limiting on `/auth/login`.
- Audit log table for master-data edits/archives.
- CSV export for reports.
- Soft-delete (`archivedAt`) instead of hard delete on all master data, enforced via Prisma middleware.

---

## 3. Non-Negotiable Business Rules (encode as validation, not comments)

1. A `JournalEntry`'s items must sum to zero net (total debit = total credit) — reject at the service layer with a typed error before hitting the DB, and additionally add a DB check via a trigger or a Postgres `CHECK`-style safeguard if the team has time (Prisma can't express cross-row sums natively, so this is enforced in `packages/core`, tested thoroughly).
2. Master data (Contact, Product, Account, Journal) is **never hard-deleted** once referenced by a transaction — archive (`isArchived: true`) instead, and block archiving if it would orphan open documents.
3. A Contact of type `CUSTOMER` or `VENDOR` may optionally have a linked `User` with role `CONTACT` — created at Contact-creation time if a login is requested for them. That `User.contactId` scopes their visibility (their bills/invoices only).
4. Documents move forward only: `DRAFT → CONFIRMED → (PARTIALLY_PAID) → PAID`, never backward. Cancellation is a separate explicit status (`CANCELLED`), not a delete.
5. Tax handling: each Sales Order / Invoice line may reference a tax rate (simple flat % is enough); tax amount posts to a dedicated `Tax Payable` (liability) account, not blended into Sales Income.
6. Login/Signup validation rules from §1.1 are enforced **server-side** in the Zod schema + a DB unique constraint — never trust client-side checks alone.

---

## 4. Database Schema (Prisma)

```prisma
// packages/db/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  ACCOUNTANT
  CONTACT
}

enum ContactType {
  CUSTOMER
  VENDOR
  BOTH
}

enum ProductType {
  GOODS
  SERVICE
  COMBO
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  INCOME
  EXPENSE
}

enum JournalType {
  SALES
  PURCHASE
  BANK
  CASH
  GENERAL
}

enum DocStatus {
  DRAFT
  CONFIRMED
  PARTIALLY_PAID
  PAID
  CANCELLED
}

enum PaymentMethod {
  CASH
  BANK
}

enum AnalyticType {
  INCOME
  EXPENSE
}

model User {
  id           String   @id @default(cuid())
  loginId      String   @unique
  email        String   @unique
  passwordHash String
  role         Role
  contact      Contact? @relation(fields: [contactId], references: [id])
  contactId    String?  @unique
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  budgetsOwned Budget[] @relation("BudgetResponsible")
}

model Contact {
  id          String       @id @default(cuid())
  name        String
  type        ContactType
  email       String?
  mobile      String?
  addressCity String?
  addressState String?
  addressPincode String?
  profileImageUrl String?
  isArchived  Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  user            User?
  purchaseOrders  PurchaseOrder[]
  vendorBills     VendorBill[]
  salesOrders     SalesOrder[]
  customerInvoices CustomerInvoice[]
  payments        Payment[]
}

model Product {
  id         String      @id @default(cuid())
  name       String
  type       ProductType
  salesPrice Decimal     @db.Decimal(14, 2)
  costPrice  Decimal     @db.Decimal(14, 2)
  category   String?
  isArchived Boolean     @default(false)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  purchaseOrderLines PurchaseOrderLine[]
  vendorBillLines    VendorBillLine[]
  salesOrderLines    SalesOrderLine[]
  invoiceLines       CustomerInvoiceLine[]
}

model Account {
  id         String      @id @default(cuid())
  name       String
  type       AccountType
  code       String?     @unique
  isArchived Boolean     @default(false)
  createdAt  DateTime    @default(now())

  journalItems      JournalItem[]
  journalsAsDefaultDebit  Journal[] @relation("DefaultDebitAccount")
  journalsAsDefaultCredit Journal[] @relation("DefaultCreditAccount")
}

model Journal {
  id                String      @id @default(cuid())
  name              String
  type              JournalType
  defaultDebitAccountId  String?
  defaultCreditAccountId String?
  defaultDebitAccount    Account? @relation("DefaultDebitAccount", fields: [defaultDebitAccountId], references: [id])
  defaultCreditAccount   Account? @relation("DefaultCreditAccount", fields: [defaultCreditAccountId], references: [id])
  createdAt         DateTime    @default(now())

  journalEntries JournalEntry[]
}

model JournalEntry {
  id          String   @id @default(cuid())
  journal     Journal  @relation(fields: [journalId], references: [id])
  journalId   String
  date        DateTime
  reference   String?
  sourceType  String?  // e.g. "VENDOR_BILL", "CUSTOMER_INVOICE", "PAYMENT"
  sourceId    String?  // id of the originating document, for traceability
  createdAt   DateTime @default(now())

  items JournalItem[]

  @@index([sourceType, sourceId])
}

model JournalItem {
  id                String        @id @default(cuid())
  journalEntry      JournalEntry  @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  journalEntryId    String
  account           Account       @relation(fields: [accountId], references: [id])
  accountId         String
  debit             Decimal       @default(0) @db.Decimal(14, 2)
  credit            Decimal       @default(0) @db.Decimal(14, 2)
  analyticAccount   AnalyticAccount? @relation(fields: [analyticAccountId], references: [id])
  analyticAccountId String?

  @@index([accountId])
  @@index([analyticAccountId])
}

model AnalyticAccount {
  id        String        @id @default(cuid())
  name      String
  type      AnalyticType
  createdAt DateTime      @default(now())

  journalItems JournalItem[]
  budgets      Budget[]
}

model Budget {
  id                String          @id @default(cuid())
  name              String
  period            String          // e.g. "2026-Q1" or store periodStart/periodEnd instead
  periodStart       DateTime
  periodEnd         DateTime
  plannedAmount     Decimal         @db.Decimal(14, 2)
  analyticAccount   AnalyticAccount @relation(fields: [analyticAccountId], references: [id])
  analyticAccountId String
  responsiblePerson User            @relation("BudgetResponsible", fields: [responsibleUserId], references: [id])
  responsibleUserId String
  createdAt         DateTime        @default(now())
}

model PurchaseOrder {
  id         String     @id @default(cuid())
  vendor     Contact    @relation(fields: [vendorId], references: [id])
  vendorId   String
  status     DocStatus  @default(DRAFT)
  orderDate  DateTime   @default(now())
  createdAt  DateTime   @default(now())

  lines PurchaseOrderLine[]
  bill  VendorBill?
}

model PurchaseOrderLine {
  id              String        @id @default(cuid())
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  purchaseOrderId String
  product         Product       @relation(fields: [productId], references: [id])
  productId       String
  quantity        Decimal       @db.Decimal(14, 2)
  unitPrice       Decimal       @db.Decimal(14, 2)
}

model VendorBill {
  id              String     @id @default(cuid())
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  purchaseOrderId String     @unique
  vendor          Contact    @relation(fields: [vendorId], references: [id])
  vendorId        String
  invoiceDate     DateTime
  dueDate         DateTime
  status          DocStatus  @default(DRAFT)
  totalAmount     Decimal    @db.Decimal(14, 2)
  amountPaid      Decimal    @default(0) @db.Decimal(14, 2)
  createdAt       DateTime   @default(now())

  lines    VendorBillLine[]
  payments Payment[]
}

model VendorBillLine {
  id           String     @id @default(cuid())
  bill         VendorBill @relation(fields: [billId], references: [id], onDelete: Cascade)
  billId       String
  product      Product    @relation(fields: [productId], references: [id])
  productId    String
  quantity     Decimal    @db.Decimal(14, 2)
  unitPrice    Decimal    @db.Decimal(14, 2)
}

model SalesOrder {
  id         String    @id @default(cuid())
  customer   Contact   @relation(fields: [customerId], references: [id])
  customerId String
  status     DocStatus @default(DRAFT)
  orderDate  DateTime  @default(now())
  createdAt  DateTime  @default(now())

  lines   SalesOrderLine[]
  invoice CustomerInvoice?
}

model SalesOrderLine {
  id           String     @id @default(cuid())
  salesOrder   SalesOrder @relation(fields: [salesOrderId], references: [id], onDelete: Cascade)
  salesOrderId String
  product      Product    @relation(fields: [productId], references: [id])
  productId    String
  quantity     Decimal    @db.Decimal(14, 2)
  unitPrice    Decimal    @db.Decimal(14, 2)
  taxPercent   Decimal    @default(0) @db.Decimal(5, 2)
}

model CustomerInvoice {
  id           String     @id @default(cuid())
  salesOrder   SalesOrder @relation(fields: [salesOrderId], references: [id])
  salesOrderId String     @unique
  customer     Contact    @relation(fields: [customerId], references: [id])
  customerId   String
  invoiceDate  DateTime
  dueDate      DateTime
  status       DocStatus  @default(DRAFT)
  totalAmount  Decimal    @db.Decimal(14, 2)
  taxAmount    Decimal    @default(0) @db.Decimal(14, 2)
  amountPaid   Decimal    @default(0) @db.Decimal(14, 2)
  createdAt    DateTime   @default(now())

  lines    CustomerInvoiceLine[]
  payments Payment[]
}

model CustomerInvoiceLine {
  id                String          @id @default(cuid())
  invoice           CustomerInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  invoiceId         String
  product           Product         @relation(fields: [productId], references: [id])
  productId         String
  quantity          Decimal         @db.Decimal(14, 2)
  unitPrice         Decimal         @db.Decimal(14, 2)
  taxPercent        Decimal         @default(0) @db.Decimal(5, 2)
}

model Payment {
  id                String           @id @default(cuid())
  contact           Contact          @relation(fields: [contactId], references: [id])
  contactId         String
  method            PaymentMethod
  amount            Decimal          @db.Decimal(14, 2)
  paymentDate        DateTime        @default(now())
  vendorBill        VendorBill?      @relation(fields: [vendorBillId], references: [id])
  vendorBillId      String?
  customerInvoice   CustomerInvoice? @relation(fields: [customerInvoiceId], references: [id])
  customerInvoiceId String?
  createdAt         DateTime         @default(now())

  @@index([vendorBillId])
  @@index([customerInvoiceId])
}
```

Notes for the implementing agent:
- Every monetary column is `Decimal(14,2)` — never use `Float` for money.
- `JournalEntry.sourceType`/`sourceId` give full traceability from a ledger line back to the document that generated it — required for the audit trail and for report drill-down.
- `Payment` links to *either* a `VendorBill` *or* a `CustomerInvoice`, never both — enforce with a Zod-level XOR check, not a DB constraint (Prisma doesn't support conditional constraints cleanly).
- Add `@@map`/`code` fields freely if the team wants prettier table names; the relationships and enums above are the part that must not be simplified away.

---

## 5. API Surface (implement all, guard by role)

```
Auth
  POST   /api/auth/signup          (public — creates ACCOUNTANT only)
  POST   /api/auth/login
  POST   /api/auth/logout
  POST   /api/auth/forgot-password (stub)

Master Data                                    Roles
  GET/POST/PATCH   /api/contacts[/:id]          Admin, Accountant (own record: Contact)
  GET/POST/PATCH   /api/products[/:id]          Admin, Accountant
  GET/POST/PATCH   /api/accounts[/:id]          Admin, Accountant
  GET/POST/PATCH   /api/journals[/:id]          Admin, Accountant
  GET/POST/PATCH   /api/analytic-accounts[/:id] Admin, Accountant
  GET/POST/PATCH   /api/budgets[/:id]           Admin, Accountant

Transactions
  GET/POST/PATCH  /api/purchase-orders[/:id]
  POST            /api/purchase-orders/:id/confirm
  POST            /api/purchase-orders/:id/convert-to-bill
  GET/PATCH       /api/vendor-bills[/:id]
  POST            /api/vendor-bills/:id/confirm      → posts JournalEntry
  GET/POST/PATCH  /api/sales-orders[/:id]
  POST            /api/sales-orders/:id/confirm
  POST            /api/sales-orders/:id/generate-invoice
  GET/PATCH       /api/customer-invoices[/:id]
  POST            /api/customer-invoices/:id/confirm  → posts JournalEntry
  GET/POST         /api/payments                      → posts JournalEntry, updates doc status
    - Contact-role users: GET restricted to `contactId = session.contactId`

Reports
  GET /api/reports/balance-sheet?asOf=YYYY-MM-DD
  GET /api/reports/profit-and-loss?from=YYYY-MM-DD&to=YYYY-MM-DD
  GET /api/reports/budget?period=...
  GET /api/reports/dashboard    → the All/Confirmed/Draft + Achieved/Budget/Committed tile counts
```

Every mutating route: `zod.parse` → role guard → call into `packages/core` → return typed JSON. Never let a route handler compute ledger postings inline — that logic lives only in `packages/core` so it's unit-testable and reused by seed scripts/tests.

---

## 6. Suggested Build Order for a 24-Hour Clock

1. **Hr 0–2:** Repo scaffold, Prisma schema, migrate + seed, auth (signup/login working end to end).
2. **Hr 2–6:** Ledger engine (`postJournalEntry` + balance invariant tests) — get this rock-solid first.
3. **Hr 6–10:** Master data CRUD API + minimal admin UI (shadcn tables/forms) for Contacts, Products, CoA, Journals.
4. **Hr 10–15:** Purchase flow (PO → Bill → Payment) end to end, including posting.
5. **Hr 15–19:** Sales flow (SO → Invoice → Payment) end to end, including posting + tax.
6. **Hr 19–22:** Reports (Balance Sheet, P&L, Budget) + dashboard tiles + Recharts.
7. **Hr 22–24:** Contact-portal view (their invoices/bills + pay button), polish, demo data, deploy.

---

## 7. Acceptance Checklist

- [ ] Signup only creates Accountant users; Admin/Contact accounts are provisioned separately.
- [ ] Login rejects bad creds with the exact generic message from the mockup.
- [ ] Confirming a Vendor Bill produces a balanced Journal Entry with `sourceType = "VENDOR_BILL"`.
- [ ] Confirming a Customer Invoice produces a balanced Journal Entry, tax posted to Tax Payable if present.
- [ ] Registering a Payment updates `amountPaid` on the linked doc, flips status to `PARTIALLY_PAID`/`PAID` correctly, and posts the cash-movement Journal Entry.
- [ ] Balance Sheet totals satisfy `Assets = Liabilities + Equity` for the seeded data.
- [ ] P&L for a date range matches manually-computed Income − Expense from the seed transactions.
- [ ] Budget Report shows planned vs. actual per Analytic Account/period.
- [ ] A Contact-role user can log in and see only their own invoices/bills, and can trigger a payment on their own due document — nothing else.
- [ ] No master data row is ever hard-deleted once referenced by a transaction (archive flag only).
- [ ] All monetary fields are `Decimal`, never `Float`.
