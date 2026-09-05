# Urban Furniture — Accounting System
## Full Phase-Wise Build Prompt (Turborepo: `web` + `api`)

> This is the complete, mockup-accurate build spec. It supersedes the first draft — this version incorporates every screen, field, button, and business rule visible in the Excalidraw mockup (login/signup, dashboard, master data list/kanban/form views, the full Budget lifecycle with revisions, PO→Bill and SO→Invoice flows with per-line Chart-of-Account + Analytic tagging, payment modals, manual Journal Entries, and the Balance Sheet / P&L / Budget reports with their exact computation formulas).
>
> Treat this file as the single source of truth. Build phase by phase, in order — each phase should be demo-able end-to-end (API + minimal UI) before moving to the next. Where the mockup is ambiguous, an explicit **Assumption** is called out so the team can confirm or override it, rather than silently guessing.

---

## 0. Architecture & Repo Layout

```
apps/
  web/                 # Next.js (App Router) — Server Components, Server Actions, shadcn/ui
    app/
      (auth)/login, signup, forgot-password
      (dashboard)/dashboard
      (masters)/contacts, products, analytics, chart-of-accounts, journals
      (budget)/budgets, budget-reports
      (purchase)/purchase-orders, vendor-bills
      (sales)/sales-orders, customer-invoices
      (accounting)/journal-entries
      (reports)/balance-sheet, profit-and-loss
      (portal)/my-invoices          # Contact/User role only
  api/                 # Route Handlers (colocate in web/app/api if not splitting a real second app)
packages/
  db/                  # Prisma schema + client + seed + sequence service
  core/                # Business logic: ledger posting, budget achievement calc, sequence numbers, reports
  auth/                # session/JWT, role guards, password policy
  validators/          # Zod schemas — one file per module, shared by forms and API routes
  ui/                  # shared shadcn/ui wrappers (DataTable, KanbanBoard, FormShell)
```

**Stack (fixed):** Bun (runtime + package manager) · Turborepo · PostgreSQL (Neon/Supabase) · Prisma · Tailwind + shadcn/ui · Zod + react-hook-form · NextAuth Credentials (or custom session cookie) · Recharts.

**Cross-cutting rule for every module below:** one `GET /list` endpoint powers *both* the List view and the Kanban view — Kanban is a client-side rendering choice (group by a status/type field), never a separate API. Every "New" button opens a blank Form view bound to the module's Zod schema; clicking an existing row opens the same Form pre-filled — so List, Kanban, and Form all share one create/update endpoint pair per module.

---

## Phase 1 — Auth & Roles

### Roles (exact from mockup)
| Role | Access |
|---|---|
| **Admin** | All access rights: master data, transactions, reports, user management |
| **Accountant** ("Invoicing User") | Create master data, record transactions (PO/Bill/SO/Invoice/Payment), create Journal Entries, view all reports. Cannot manage other users. |
| **User** (Contact login) | Can only see **their own** invoices/bills, filtered to paid/unpaid status, and can pay their dues directly from the portal. No access to anything else. |

### Screens & Rules
- **Create User** (Admin-only, internal): Name, Login id, E-mail id, Role (User/Administrator — extend to include Accountant), Password, Re-Enter Password, Create/Cancel.
- **Signup** (public): creates a `user` row. On success the created account is always the **Accountant** role — per mockup: *"When clicked on SignUp... only invoicing user will be create."*
- **Login**: Login Id + Password → on mismatch, show exactly **`"Invalid Login Id or Password"`** (generic — never reveal which field failed).
- **Validation (enforce server-side in Zod + DB constraints, identical for signup and admin-created users):**
  1. Login Id unique, 6–12 characters.
  2. Email unique across all users.
  3. Password: must contain a lowercase letter, an uppercase letter, a special character, length > 8 characters. Hash with bcrypt/argon2.
- **Forgot Password**: stub route — generate a reset token row + log the reset link to console/email transport; full email delivery is out of scope for the hackathon clock.
- Session/JWT payload: `{ userId, role, contactId? }`. `contactId` is only present for `User`-role accounts and is what scopes their portal queries.

### API
| Method | Route | Notes |
|---|---|---|
| POST | `/api/auth/signup` | Public. Forces `role = ACCOUNTANT`. |
| POST | `/api/auth/login` | Generic error on failure. |
| POST | `/api/auth/logout` | Clears session. |
| POST | `/api/auth/forgot-password` | Stub — creates reset token. |
| POST | `/api/users` | Admin-only. Creates Admin/Accountant/User(+linked Contact) accounts. |

### Acceptance
- [ ] Signup always produces an Accountant account, never Admin/User.
- [ ] Duplicate Login Id/Email rejected with a field-specific error at signup, but login failures never reveal which field was wrong.
- [ ] Password complexity enforced server-side even if the client-side form is bypassed.
- [ ] A `User`-role session's JWT carries `contactId`; requests without it can never hit the portal-scoped routes.

---

## Phase 2 — Database Schema (Prisma) & Sequences

This is the full schema — build it in one pass; every later phase depends on it.

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role { ADMIN ACCOUNTANT USER }

enum ContactType { CUSTOMER VENDOR BOTH }

enum ProductType { GOODS SERVICE COMBO }

// Balance-Sheet types: ASSET, LIABILITY, BANK, CASH, CAPITAL
// P&L types: INCOME, EXPENSE, OTHER_EXPENSE
enum AccountType { ASSET LIABILITY BANK CASH CAPITAL INCOME EXPENSE OTHER_EXPENSE }

enum JournalType { SALES PURCHASE BANK CASH GENERAL }

enum AnalyticType { INCOME EXPENSE }

enum BudgetStatus { DRAFT CONFIRMED REVISED CANCELLED }

enum DocStatus { DRAFT CONFIRMED PARTIALLY_PAID PAID CANCELLED }

enum JournalEntryStatus { DRAFT POSTED CANCELLED }

enum PaymentType { SEND RECEIVE }        // Send = pay a vendor bill, Receive = collect on a customer invoice
enum PaymentVia { CASH BANK }

model User {
  id           String   @id @default(cuid())
  name         String
  loginId      String   @unique
  email        String   @unique
  passwordHash String
  role         Role
  contact      Contact? @relation(fields: [contactId], references: [id])
  contactId    String?  @unique
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Contact {
  id             String      @id @default(cuid())
  name           String
  type           ContactType
  email          String?     @unique
  phone          String?
  street         String?
  city           String?
  state          String?
  country        String?
  pincode        String?
  profileImageUrl String?
  isArchived     Boolean     @default(false)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  user               User?
  purchaseOrders     PurchaseOrder[]
  vendorBills        VendorBill[]
  salesOrders        SalesOrder[]
  customerInvoices   CustomerInvoice[]
  payments           Payment[]
  budgetsResponsible Budget[]          @relation("BudgetResponsible")
  journalItems       JournalItem[]     // partner column on JE lines
}

model Product {
  id         String      @id @default(cuid())
  name       String
  type       ProductType
  category   String?          // free-text "many2one created on the fly" — see Phase 3 note
  salesPrice Decimal     @db.Decimal(14, 2)
  costPrice  Decimal     @db.Decimal(14, 2)
  imageUrl   String?
  isArchived Boolean     @default(false)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  purchaseOrderLines PurchaseOrderLine[]
  vendorBillLines    VendorBillLine[]
  salesOrderLines    SalesOrderLine[]
  invoiceLines       CustomerInvoiceLine[]
}

model AnalyticAccount {
  id        String       @id @default(cuid())
  name      String
  type      AnalyticType // Income -> tagged on Sales/Invoice lines; Expense -> tagged on Purchase/Bill lines
  isArchived Boolean     @default(false)
  createdAt DateTime     @default(now())

  purchaseOrderLines PurchaseOrderLine[]
  vendorBillLines    VendorBillLine[]
  salesOrderLines    SalesOrderLine[]
  invoiceLines       CustomerInvoiceLine[]
  budgets            Budget[]
}

model Account {
  id         String      @id @default(cuid())
  name       String
  type       AccountType
  isArchived Boolean     @default(false)
  createdAt  DateTime    @default(now())

  journalItems            JournalItem[]
  journalsAsDefaultDebit  Journal[]        @relation("DefaultDebitAccount")
  journalsAsDefaultCredit Journal[]        @relation("DefaultCreditAccount")
  vendorBillLines         VendorBillLine[]
  invoiceLines            CustomerInvoiceLine[]
}

model Journal {
  id                     String      @id @default(cuid())
  name                   String
  type                   JournalType
  defaultAccount         Account     @relation("DefaultDebitAccount", fields: [defaultAccountId], references: [id])
  defaultAccountId       String
  createdAt              DateTime    @default(now())

  journalEntries JournalEntry[]

  @@ignore // placeholder to remind: remove the unused "DefaultCreditAccount" relation name below if not needed
}

model JournalEntry {
  id             String             @id @default(cuid())
  journal        Journal            @relation(fields: [journalId], references: [id])
  journalId      String
  number         String?            // e.g. echoes the source doc number, or its own JE/2026/0001 sequence for manual entries
  accountingDate DateTime
  date           DateTime           @default(now())
  status         JournalEntryStatus @default(DRAFT)
  sourceType     String?            // "VENDOR_BILL" | "CUSTOMER_INVOICE" | "PAYMENT" | "MANUAL"
  sourceId       String?
  createdAt      DateTime           @default(now())

  items JournalItem[]

  @@index([sourceType, sourceId])
}

model JournalItem {
  id             String        @id @default(cuid())
  journalEntry   JournalEntry  @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  journalEntryId String
  account        Account       @relation(fields: [accountId], references: [id])
  accountId      String
  partner        Contact?      @relation(fields: [partnerId], references: [id])
  partnerId      String?
  debit          Decimal       @default(0) @db.Decimal(14, 2)
  credit         Decimal       @default(0) @db.Decimal(14, 2)

  @@index([accountId])
}

model Budget {
  id                    String       @id @default(cuid())
  name                  String       // on revision: keep original name, append " Revised"
  periodStart           DateTime
  periodEnd             DateTime
  analyticAccount       AnalyticAccount @relation(fields: [analyticAccountId], references: [id])
  analyticAccountId     String
  type                  AnalyticType // mirrors analyticAccount.type at creation time
  committedAmount       Decimal      @db.Decimal(14, 2)
  responsiblePerson     Contact      @relation("BudgetResponsible", fields: [responsibleContactId], references: [id])
  responsibleContactId  String
  status                BudgetStatus @default(DRAFT)
  revisedFrom           Budget?      @relation("BudgetRevision", fields: [revisedFromId], references: [id])
  revisedFromId         String?      @unique
  revisedTo             Budget?      @relation("BudgetRevision")
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  // achievedAmount / achievedPercent / amountToAchieve are ALWAYS COMPUTED — never stored (see Phase 4)
}

model PurchaseOrder {
  id        String      @id @default(cuid())
  number    String      @unique   // P00001, P00002, ...
  vendor    Contact     @relation(fields: [vendorId], references: [id])
  vendorId  String
  orderDate DateTime    @default(now())
  status    DocStatus   @default(DRAFT)
  createdAt DateTime    @default(now())

  lines PurchaseOrderLine[]
  bill  VendorBill?
}

model PurchaseOrderLine {
  id               String          @id @default(cuid())
  purchaseOrder    PurchaseOrder   @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  purchaseOrderId  String
  product          Product         @relation(fields: [productId], references: [id])
  productId        String
  analyticAccount  AnalyticAccount? @relation(fields: [analyticAccountId], references: [id])
  analyticAccountId String?
  quantity         Decimal         @db.Decimal(14, 2)
  unitPrice        Decimal         @db.Decimal(14, 2)
  // total = quantity * unitPrice, computed — do not persist a redundant column
}

model VendorBill {
  id              String      @id @default(cuid())
  number          String      @unique   // Bill/2026/0001
  reference       String?               // free-text vendor's own bill number, e.g. "ABC-26-001"
  purchaseOrder   PurchaseOrder? @relation(fields: [purchaseOrderId], references: [id])
  purchaseOrderId String?     @unique    // null when the bill is created fresh, without a PO
  vendor          Contact     @relation(fields: [vendorId], references: [id])
  vendorId        String
  billDate        DateTime
  dueDate         DateTime
  status          DocStatus   @default(DRAFT)
  createdAt       DateTime    @default(now())

  lines    VendorBillLine[]
  payments Payment[]

  // totalAmount / amountPaid / amountDue are COMPUTED from lines + linked payments (see Phase 5)
}

model VendorBillLine {
  id                String           @id @default(cuid())
  bill              VendorBill       @relation(fields: [billId], references: [id], onDelete: Cascade)
  billId            String
  product           Product          @relation(fields: [productId], references: [id])
  productId         String
  account           Account          @relation(fields: [accountId], references: [id])  // defaults to "Purchase Expense A/c"
  accountId         String
  analyticAccount   AnalyticAccount? @relation(fields: [analyticAccountId], references: [id])
  analyticAccountId String?
  quantity          Decimal          @db.Decimal(14, 2)
  unitPrice         Decimal          @db.Decimal(14, 2)
}

model SalesOrder {
  id        String    @id @default(cuid())
  number    String    @unique   // S00001, ...
  customer  Contact   @relation(fields: [customerId], references: [id])
  customerId String
  orderDate DateTime  @default(now())
  status    DocStatus @default(DRAFT)
  createdAt DateTime  @default(now())

  lines   SalesOrderLine[]
  invoice CustomerInvoice?
}

model SalesOrderLine {
  id                String           @id @default(cuid())
  salesOrder        SalesOrder       @relation(fields: [salesOrderId], references: [id], onDelete: Cascade)
  salesOrderId      String
  product           Product          @relation(fields: [productId], references: [id])
  productId         String
  analyticAccount   AnalyticAccount? @relation(fields: [analyticAccountId], references: [id])
  analyticAccountId String?
  quantity          Decimal          @db.Decimal(14, 2)
  unitPrice         Decimal          @db.Decimal(14, 2)
}

model CustomerInvoice {
  id           String      @id @default(cuid())
  number       String      @unique   // INV/2026/0001
  reference    String?
  salesOrder   SalesOrder? @relation(fields: [salesOrderId], references: [id])
  salesOrderId String?     @unique
  customer     Contact     @relation(fields: [customerId], references: [id])
  customerId   String
  invoiceDate  DateTime
  dueDate      DateTime
  status       DocStatus   @default(DRAFT)
  createdAt    DateTime    @default(now())

  lines    CustomerInvoiceLine[]
  payments Payment[]
}

model CustomerInvoiceLine {
  id                String           @id @default(cuid())
  invoice           CustomerInvoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  invoiceId         String
  product           Product          @relation(fields: [productId], references: [id])
  productId         String
  account           Account          @relation(fields: [accountId], references: [id])  // defaults to "Sales Income A/c"
  accountId         String
  analyticAccount   AnalyticAccount? @relation(fields: [analyticAccountId], references: [id])
  analyticAccountId String?
  quantity          Decimal          @db.Decimal(14, 2)
  unitPrice         Decimal          @db.Decimal(14, 2)
}

model Payment {
  id                String           @id @default(cuid())
  type              PaymentType      // SEND (vendor bill) | RECEIVE (customer invoice)
  via               PaymentVia       // CASH | BANK
  partner           Contact          @relation(fields: [partnerId], references: [id])
  partnerId         String
  amount            Decimal          @db.Decimal(14, 2)
  date              DateTime         @default(now())
  note              String?
  vendorBill        VendorBill?      @relation(fields: [vendorBillId], references: [id])
  vendorBillId      String?
  customerInvoice   CustomerInvoice? @relation(fields: [customerInvoiceId], references: [id])
  customerInvoiceId String?
  createdAt         DateTime         @default(now())

  @@index([vendorBillId])
  @@index([customerInvoiceId])
}

model DocumentSequence {
  id         String   @id @default(cuid())
  code       String   // "PO" | "SO" | "BILL" | "INVOICE"
  year       Int?     // null for PO/SO (not year-scoped), set for BILL/INVOICE
  lastNumber Int      @default(0)

  @@unique([code, year])
}
```

### Sequence formats (exact, from mockup)
| Doc | Format | Year-scoped? |
|---|---|---|
| Purchase Order | `P00001` | No — 5-digit, increments forever |
| Sales Order | `S00001` | No — 5-digit, increments forever |
| Vendor Bill | `Bill/2026/0001` | Yes — 4-digit, resets each calendar year |
| Customer Invoice | `INV/2026/0001` | Yes — 4-digit, resets each calendar year |

Implement `packages/core/sequence.ts`:
```ts
async function nextNumber(code: "PO"|"SO"|"BILL"|"INVOICE", date = new Date()): Promise<string> {
  const year = (code === "BILL" || code === "INVOICE") ? date.getFullYear() : null;
  // atomic upsert + increment inside a transaction (SELECT ... FOR UPDATE equivalent via Prisma's
  // interactive transaction, or an atomic `UPDATE ... SET lastNumber = lastNumber + 1 RETURNING`)
  // then format per the table above.
}
```
This must be **race-safe** — two simultaneous POs must never receive the same number. Use a single atomic UPDATE...RETURNING (raw SQL via `prisma.$queryRaw`) rather than read-then-write.

### Pre-configured seed data (must exist after `prisma db seed`)
- **Chart of Accounts:** Cash (CASH), Bank (BANK), Debtors (ASSET), Creditors (LIABILITY), Capital (CAPITAL), Sales Income (INCOME), Purchase Expense (EXPENSE), Other Expense (OTHER_EXPENSE).
- **Journals:** Sales → default account = Sales Income A/c; Purchase → default account = Purchase Expense A/c; Bank → default account = Bank A/c; Cash → default account = Cash A/c.
- **Contacts:** Vendor "Rahul Sharma", Customer "Nimesh Pathak" (from the original brief) — plus mockup examples "Open Wood" / "Joey Wills" as extra demo contacts.
- **Products:** Office Chair, Wooden Table, Sofa, Dining Table, Air Conditioner (Electronics/Goods, ₹25,000/₹15,000), Refrigerator (Electronics/Goods, ₹10,000/₹7,000).
- One Admin and one Accountant user.

---

## Phase 3 — Master Data Modules

General pattern for **every** module in this phase: List view (default, with Search) → Kanban view (toggle) → Form view (New = blank, click a row = pre-filled). "Back" always returns to the List. Deleting is never exposed in the UI — only Archive.

### 3.1 Contact
- **Form fields:** Contact Name, Upload Image, Phone, Email (unique, validated), Street, City, State, Country, Pincode.
- **List columns:** Select (checkbox), Image, Name, Email, Phone.
- **Kanban card:** Image, Name, Email, Phone.
- **Buttons:** New, Back, Confirm (save).

### 3.2 Product
- **Form fields:** Product Name, Category (many-to-one, but **creatable inline** — "Category can be created and saved on the fly": the category `<Select>` must include a "+ Create '{typed text}'" option that POSTs a new category value without leaving the form), Sales Price, Cost, Upload Image, Product Type (dropdown: Goods / Service / Combo).
- **List columns:** Select, Product, Category, Type, Sales Price, Cost.
- **Kanban card:** Image, Name, Sales Price, Cost.

> **Assumption:** the mockup treats Category as a plain string with inline-create UX rather than a full separate table (no dedicated Category master screen is shown). Implemented as `Product.category: String?` for speed; upgrade to a `Category` table only if time remains.

### 3.3 Analytic Account (Analyticals)
- **Form fields:** Analytic Account (name), Type (dropdown: Income / Expense).
- List + Kanban same pattern as above.
- Business rule to encode now (used everywhere later): *analytic accounts of type Income are tagged only on Sales Order / Customer Invoice lines; type Expense only on Purchase Order / Vendor Bill lines.* Validate this at the line-item API level (reject an Income analytic on a bill line, etc.).

### 3.4 Chart of Accounts
- **List columns:** Account Name, Type.
- **Type dropdown**, grouped exactly as the mockup shows:
  - *Balance Sheet section:* Asset, Liability, Bank, Capital, Cash
  - *Profit and Loss section:* Income, Expenses, Other Expenses *("just for heading selection — can be done from the orange part only")*
- All 8 seed accounts above are pre-configured; the screen still supports adding more (e.g. a second Bank account) via New.

### 3.5 Journals
- **List columns:** Journal Name, Type, Default Account.
- **Form fields:** Name, Journal Type (dropdown: Sales / Purchase / Bank / Cash), Default Account (many-to-one from Chart of Accounts).
- 4 seed journals pre-configured as in Phase 2.

### API (all of Phase 3)
```
GET/POST/PATCH  /api/contacts[/:id]
GET/POST/PATCH  /api/products[/:id]
GET/POST/PATCH  /api/analytic-accounts[/:id]
GET/POST/PATCH  /api/accounts[/:id]           (Chart of Accounts)
GET/POST/PATCH  /api/journals[/:id]
POST            /api/products/categories       (inline "create on the fly")
```
All guarded to Admin + Accountant. Archive via `PATCH { isArchived: true }` — block archiving a Contact/Product/Account/Journal that is referenced by a non-cancelled document.

### Acceptance
- [ ] Every master list can toggle List ⇄ Kanban without a different API call.
- [ ] Product category can be created inline mid-form without a page navigation.
- [ ] Chart of Accounts type options are grouped/labeled Balance Sheet vs P&L in the UI.
- [ ] Archiving a Contact used on an open Vendor Bill is blocked with a clear error.

---

## Phase 4 — Budget Module (full lifecycle)

This is the most stateful master-data-adjacent module — implement the state machine exactly.

### Fields (Form view)
| Field | Type | Notes |
|---|---|---|
| Budget Name | Text | Alphanumeric. **On Revise: keep the original name and append " Revised"** (e.g. "Project A" → "Project A Revised"). |
| Budget Period | Date range (Start Date, End Date) | e.g. "January 2026", 01/01/2026–31/01/2026 |
| Analytic (Analyticals) | Many-to-one → Analytic Account | |
| Type | Income / Expense | Auto-filled from the selected Analytic Account's type, read-only |
| Committed Amount | Monetary | The planned budget figure |
| Responsible | Many-to-one → **Contact** (not User) | *"Select from Contacts Created (open list of contacts created on click)"* |
| Achieved Amount | Monetary, **computed, visible only when status = Confirmed** | See formula below |
| Achieved % | Percent, **computed, visible only when Confirmed** | `(Achieved / Committed) * 100` |
| Amount to Achieve | Monetary, **computed, visible only when Confirmed** | `Committed − Achieved` |

### Achieved Amount computation (exact rule from mockup)
> "Search Analytical in Sales Invoice with name X, consider budget period, and compute total → set in Achieved Amount" (for Income-type budgets)
> "Search Analytical in Vendor Bills with name X, consider budget period, and compute total → set in Achieved Amount" (for Expense-type budgets)

Implement in `packages/core/budget.ts`:
```ts
async function computeAchievedAmount(budget) {
  if (budget.type === "INCOME") {
    // sum (quantity * unitPrice) across CustomerInvoiceLine
    // where line.analyticAccountId === budget.analyticAccountId
    // and invoice.status IN [CONFIRMED, PARTIALLY_PAID, PAID]
    // and invoice.invoiceDate BETWEEN budget.periodStart AND budget.periodEnd
  } else {
    // same but over VendorBillLine + VendorBill, status confirmed+
  }
}
```
Clicking the **Achieved Amount** figure in the UI opens a filtered list view of exactly the invoices/bills that fed that sum (same filter as above, rendered as a list).

### State machine (Menu & Stage Mapping — implement literally)
```
DRAFT --[Confirm]--> CONFIRMED --[Revise]--> (new Budget in DRAFT, linked via revisedFrom)
                                              (old Budget flips to REVISED, keeps a link forward to the new one)
DRAFT --[Cancel]--> CANCELLED
CONFIRMED --[Cancel]--> CANCELLED
```
- **New**: creates a fresh Budget in `DRAFT`.
- **Confirm**: only valid from `DRAFT`; moves to `CONFIRMED`; from this point Achieved Amount/%/Amount-to-Achieve become visible and are computed live on every read.
- **Revise**: only visible/valid from `CONFIRMED`. Creates a **new** Budget row (`DRAFT`) with the same Analytic/Responsible but an editable Committed Amount, named `"{original name} Revised"`, with `revisedFromId` pointing at the original. The original budget's status flips to `REVISED`. Both records must show a clickable link to the other ("Revision Of Original Budget" / "Revised With Revised Budget").
- **Cancel**: archives the budget (`CANCELLED`) — allowed from Draft or Confirmed.

### Budget Report (list + kanban)
- **List columns:** Budget (name), Start Date, End Date, Status, Pie Chart (Achieved vs Balance-to-achieve, per row — small inline donut).
- **Kanban card:** Budget name, Start Date, End Date — click opens the Form view.
- Pie chart data = `{ achieved: achievedAmount, balance: committedAmount - achievedAmount }`.

### API
```
GET/POST/PATCH  /api/budgets[/:id]
POST            /api/budgets/:id/confirm
POST            /api/budgets/:id/revise        → returns the new draft budget
POST            /api/budgets/:id/cancel
GET             /api/budgets/:id/achieved-detail   → list of invoices/bills backing the Achieved Amount
GET             /api/reports/budget                → list view data incl. pie-chart fields, filterable by status/period
```

### Acceptance
- [ ] Achieved/Achieved %/Amount-to-Achieve are absent from the payload for Draft budgets and present (computed) for Confirmed ones.
- [ ] Revise creates a linked pair (old→REVISED, new→DRAFT) and never mutates the original's Committed Amount.
- [ ] Revised budget name is exactly `"{original} Revised"`.
- [ ] Achieved Amount for an Income budget only sums Customer Invoice lines; for an Expense budget only Vendor Bill lines — cross-contamination is a bug.
- [ ] Achieved Amount click-through list matches the exact filter used to compute the sum.

---

## Phase 5 — Purchase Flow

### 5.1 Purchase Order
- **Header:** PO No. (auto: `nextNumber("PO")`), Vendor Name (Contact, many-to-one), PO Date.
- **Lines:** Sr. No., Product (many-to-one), Budget Analytics (Analytic Account, many-to-one, Expense-type only), Qty, Unit Price, Total (computed = Qty × Unit Price, client-displayed, never stored).
- **Buttons:** New, Confirm, Back, **Create Bill** (visible once Confirmed).
- Confirm: `DRAFT → CONFIRMED`. No ledger impact yet — a PO is a commitment, not an accounting event.

### 5.2 Vendor Bill
- **Header:** Vendor Bill No. (auto: `Bill/2026/0001`), Vendor Name, Bill Reference (free text, e.g. "ABC-26-001"), Status, Bill Date, Due Date.
- **If created via "Create Bill" from a PO:** vendor, product, price, and quantity lines are fetched/copied from the PO; show a clickable link back to the source PO. **If created fresh (no PO)**, hide that link entirely.
- **Lines:** Sr. No., Product, **Chart of Account** (many-to-one — defaults to "Purchase Expense A/c", editable), Budget Analytics, Qty, Unit Price, Total.
- **Footer (computed, never stored as raw columns beyond what payments imply):** Total = Σ line totals; Paid via Cash (Σ Payments where `via=CASH`); Paid via Bank (Σ Payments where `via=BANK`); **Amount Due = Total − Amount Paid**.
- **Buttons:** Cancel, **Pay** (opens the Bill Payment modal).
- **Confirm rule (critical accounting rule — from mockup, verbatim):**
  > "As soon as the vendor bill is confirmed, a journal entry would be created that would become visible in the Journal Entries section. For Vendor bill, the Purchase Chart of Account is always set by default. The Journal Entry should always be balanced — debit and credit totals must match."

  Posting logic on Vendor Bill confirm:
  ```
  Dr  <line.account>  (defaults to Purchase Expense A/c)     amount = line total, per line, same analytic tag copied onto the JournalItem is NOT modeled (analytics live on the source line, not the JE line, per schema)
  Cr  Creditors                                              amount = bill total
  ```
  Create the `JournalEntry` with `journal = Purchase Journal`, `status = POSTED`, `sourceType = "VENDOR_BILL"`, `sourceId = bill.id`, `accountingDate = bill.billDate`.

### 5.3 Bill Payment modal ("Pay" button)
| Field | Behavior |
|---|---|
| Payment Type | Fixed to `SEND` for a Vendor Bill payment (mockup shows Send/Receive selector generically — bill context defaults/locks it to Send) |
| Partner | Autofilled from the Bill's Vendor, read-only |
| Amount | Autofilled to the current Amount Due, editable (must support partial payments) |
| Date | Defaults to today |
| Payment Via | Defaults to Bank, selectable → Cash |
| Note | Free text |
| Buttons | Confirm, Cancel |

On Confirm:
1. Create `Payment { type: SEND, via, partnerId: vendor, amount, vendorBillId }`.
2. Post a Journal Entry: `Dr Creditors / Cr <Bank or Cash A/c per Payment Via>`, amount = payment amount, `journal = Bank or Cash Journal` accordingly, `sourceType = "PAYMENT"`.
3. Recompute Bill status: `amountPaid == 0 → CONFIRMED (unchanged)`, `0 < amountPaid < total → PARTIALLY_PAID`, `amountPaid >= total → PAID`.
4. After confirm, present **Print** and **Send (email)** options — Print can render a simple PDF/HTML receipt; Send can be stubbed (log/console) given the time budget.
5. Clicking through from the bill/payment to "Budget Analytic Report" opens the Budget Report **filtered to the analytic account(s) used on that bill's lines**.

### API
```
GET/POST/PATCH   /api/purchase-orders[/:id]
POST             /api/purchase-orders/:id/confirm
POST             /api/purchase-orders/:id/create-bill      → creates a VendorBill DRAFT pre-filled from the PO
GET/POST/PATCH   /api/vendor-bills[/:id]
POST             /api/vendor-bills/:id/confirm             → posts the Purchase JournalEntry
POST             /api/vendor-bills/:id/cancel
POST             /api/vendor-bills/:id/pay                 → the Bill Payment modal's submit; posts the cash-movement JournalEntry
GET              /api/vendor-bills/:id/budget-report        → the "open Budget Analytic Report" link target
```

### Acceptance
- [ ] PO numbers are strictly sequential and gap-free under concurrent creation (test with parallel requests).
- [ ] Confirming a Vendor Bill created fresh (no PO) never shows a "source PO" link in the UI payload.
- [ ] Confirming a Vendor Bill always produces a balanced JournalEntry; reject the confirm attempt (with an error) if a manual override somehow made lines not sum correctly — should be structurally impossible, but assert it.
- [ ] Partial payment correctly moves status to `PARTIALLY_PAID` and Amount Due reflects the remainder.
- [ ] Paying in full moves status to `PAID` and the Pay button becomes disabled/hidden in the UI.

---

## Phase 6 — Sales Flow

Mirror of Phase 5 with Debtors/Sales Income instead of Creditors/Purchase Expense.

### 6.1 Sales Order
- **Header:** SO No. (auto: `S00001`), Customer Name, SO Date.
- **Lines:** same shape as PO lines (Product, Budget Analytics — Income-type only, Qty, Unit Price, Total).
- **Buttons:** Confirm, **Create Invoice** (visible once Confirmed).

### 6.2 Customer Invoice
- **Header:** Customer Invoice No. (auto: `INV/2026/0001`), Customer Name, Invoice Reference, Status, Invoice Date, Due Date.
- If generated from an SO: copy customer/product/price/qty, show link back to SO; hide the link if created fresh.
- **Lines:** Product, **Chart of Accounts** (defaults to "Sales Income A/c"), Budget Analytics, Qty, Unit Price, Total.
- **Footer:** Total, Paid via Cash, Paid via Bank, Amount Due = Total − Amount Paid.
- **Confirm rule (verbatim business rule):**
  > "As soon as the Customer Invoice is confirmed, a journal entry would be created, visible in Journal Entries. For Customer Invoice, the Sales Chart of Account is always set by default. The Journal Entry must always be balanced."

  Posting logic:
  ```
  Dr  Debtors                                    amount = invoice total
  Cr  <line.account>  (defaults to Sales Income A/c)   amount = line total, per line
  ```
  `journal = Sales Journal`, `sourceType = "CUSTOMER_INVOICE"`.

### 6.3 Invoice Payment modal ("Pay" button)
Same shape as the Bill Payment modal, but `type = RECEIVE`:
1. Create `Payment { type: RECEIVE, via, partnerId: customer, amount, customerInvoiceId }`.
2. Post: `Dr <Bank or Cash A/c per Payment Via> / Cr Debtors`.
3. Recompute Invoice status exactly as Phase 5 §5.3 step 3.
4. Print/Send options after confirm.
5. "Open the Budget Analytic Report used in the Bill" applies identically here (Invoice → its lines' analytic accounts).

### API
```
GET/POST/PATCH   /api/sales-orders[/:id]
POST             /api/sales-orders/:id/confirm
POST             /api/sales-orders/:id/create-invoice
GET/POST/PATCH   /api/customer-invoices[/:id]
POST             /api/customer-invoices/:id/confirm         → posts the Sales JournalEntry
POST             /api/customer-invoices/:id/cancel
POST             /api/customer-invoices/:id/pay
GET              /api/customer-invoices/:id/budget-report
```

### Acceptance
Same checklist as Phase 5, mirrored for the sales side, plus:
- [ ] Debtors is debited (not credited) on invoice confirm — the mirror-image mistake (crediting Debtors) is the single most common bug here; write a unit test asserting the exact debit/credit sides.

---

## Phase 7 — Journals & Journal Entries (manual + system-generated, unified)

### Journal Entries List view
- **Columns:** Date, Number, Partner, Journal, Total, Status (`Posted` / `Draft`).
- Every row here can be either system-generated (from a Bill/Invoice/Payment confirm — created directly as `POSTED`) or manually created by an Accountant.

### Manual Journal Entry Form
- **Header:** Accounting Date, Journal (many-to-one, selection from the 4 seeded journals + any custom ones), Date.
- **Lines table:** Account (Chart of Accounts, many-to-one), Partner (Contact, many-to-one, optional), Debit, Credit.
- **Buttons:** New, **Post**, Cancel, Back — and for an already-posted entry: **Reset to Draft** (per the "Demo Journal Entry" screen, which also shows a **Pay** button — treat that as a shortcut into the Payment modal when the entry's originating document supports it; skip if out of scope for time).
- **Blocking validation:** if `Σ debit !== Σ credit`, block the Post action with a visible warning — do not silently round or auto-balance.
- Manual entries start life as `DRAFT` and only move to `POSTED` via the explicit Post action; system-generated entries (from Bill/Invoice/Payment confirms) are created directly as `POSTED` since their source document's own Confirm action is the user's intent to post.
- **Reset to Draft** on a posted entry: allowed for corrections; flips back to `DRAFT` (does not delete/reverse — the team can add a reversing-entry pattern later if time allows, but for the hackathon a direct status flip plus an audit-log row is sufficient).

### API
```
GET/POST/PATCH   /api/journal-entries[/:id]
POST             /api/journal-entries/:id/post        → validates balance, sets status=POSTED
POST             /api/journal-entries/:id/reset-to-draft
POST             /api/journal-entries/:id/cancel
```

### Acceptance
- [ ] Attempting to Post an unbalanced entry returns a 4xx with a clear message and does not mutate status.
- [ ] System-generated entries from Bill/Invoice/Payment confirms appear in this list immediately, correctly attributed (Partner, Journal, Total, Status=Posted).
- [ ] Reset to Draft is blocked on `CANCELLED` entries.

---

## Phase 8 — Reports & Dashboard

### 8.1 Profit & Loss Report
- **Header:** Year selector (e.g. 2026), Print (PDF download), Back.
- **Sections & exact computation:**
  | Line | Formula |
  |---|---|
  | Income → Income from Sales | Σ of all `INCOME`-type account balances (credit − debit) in the period |
  | Expenses → Purchase Expense | Σ of `EXPENSE`-type account balances (debit − credit) |
  | Expenses → Other Expense | Σ of `OTHER_EXPENSE`-type account balances |
  | **Net Income** | `Income − Expenses` (i.e. Income − (Purchase Expense + Other Expense)) |

### 8.2 Balance Sheet
- **Header:** Year selector, Print, Back.
- **Assets:** Bank, Cash, Debtors (i.e. all accounts of type `BANK`, `CASH`, `ASSET`) — grouped/listed individually by account name, summed to **Total Assets**.
- **Liabilities:** Creditors, Capital (types `LIABILITY`, `CAPITAL`) — summed to **Total Liabilities**.
- **Invariant to display/verify:** `Total Assets === Total Liabilities` (Capital absorbs retained P&L — if it doesn't balance, surface the discrepancy rather than hiding it; this is the system's built-in double-entry sanity check).

### 8.3 Budget Report
Covered in Phase 4 — list/kanban with pie chart, reused here as the standalone Reports-menu entry point (same endpoint, different nav location).

### 8.4 Dashboard
Tiles from the mockup, each clickable through to the underlying list, filtered:
| Tile group | Counts shown |
|---|---|
| Sales | All / Confirmed / Draft (counts of Sales Orders by status) |
| Purchase | All / Confirmed / Draft (counts of Purchase Orders by status) |
| Budget | All / Achieved / Budget / Committed |

> **Assumption (flag for stakeholder confirmation):** the mockup's Budget tile labels don't map 1:1 to the `BudgetStatus` enum. Implement as: **All** = total non-cancelled budgets; **Budget** = count in `DRAFT`; **Committed** = count in `CONFIRMED`; **Achieved** = count in `CONFIRMED` where computed `achievedPercent >= 100`. Confirm with the team/judges and adjust the query in `packages/core/dashboard.ts` if a different definition is intended — it's isolated to one function.

Also render quick-access menu tiles exactly matching the mockup's IA:
```
Sales     → Sales Order, Sale Invoice, Receipt
Purchase  → Purchase Order, Purchase Bill, Payment
Account   → Contact, Product, Analyticals, Analytical Budget, Chart of Account, Journals, Journal Entries
Report    → Balancesheet, Profit and Loss, Budget Report
```

### API
```
GET /api/reports/profit-and-loss?year=2026
GET /api/reports/profit-and-loss/pdf?year=2026     → streamed PDF
GET /api/reports/balance-sheet?year=2026
GET /api/reports/balance-sheet/pdf?year=2026
GET /api/reports/dashboard
```

### Acceptance
- [ ] P&L Net Income for the seeded demo data matches a manual hand-calculation.
- [ ] Balance Sheet Total Assets equals Total Liabilities for the seeded data (or the discrepancy is visibly surfaced, not swallowed).
- [ ] PDF export renders the same figures shown on screen (no separate/divergent computation path — the PDF route calls the same `packages/core` report functions as the JSON route).
- [ ] Dashboard tiles' counts match a direct DB query for the same filters.

---

## Phase 9 — Contact Portal (`User` role)

- On login as a `User`, land on **My Invoices/Bills** — a single list, scoped server-side to `WHERE contactId = session.contactId`, showing status filterable to Paid/Unpaid.
- Each row can be opened (read-only document view) and, if unpaid/partially paid, has a **Pay** button that opens the same Payment modal from Phase 5/6 (pre-locked Partner = self, cannot be changed).
- No access to any master data, other contacts' documents, journals, or reports — enforce with the same role-guard middleware used everywhere else, not a UI-only hide.

### API
```
GET  /api/portal/my-documents         → scoped union of the caller's VendorBills/CustomerInvoices where they are the linked Contact... 
                                          (in practice a Contact is usually either a Customer or Vendor, so this mostly returns one type,
                                           but a `BOTH`-type contact should see both)
POST /api/portal/pay                  → same handler as vendor-bills/:id/pay or customer-invoices/:id/pay, with partner forcibly = session.contactId
```

### Acceptance
- [ ] A `User` session hitting any master-data or report endpoint gets 403, not a filtered empty result — fail closed.
- [ ] A `User` can only pay documents belonging to their own linked Contact, verified server-side even if the client sends another contact's document id.

---

## Phase 10 — Hardening (time-permitting)

- Rate limit `/api/auth/login`.
- Audit-log table (`who / what / when / before / after`) for master-data edits, archives, and Journal Entry Reset-to-Draft.
- CSV export alongside PDF for reports.
- Soft-archive enforced via a Prisma middleware (`$use`) rather than repeated manual checks in every route.
- Seed script idempotency (`upsert` everywhere) so re-running it during the hackathon never duplicates the pre-configured Chart of Accounts/Journals.

---

## Build-Order Summary (hour-budget suggestion for a 24h clock)

| Hrs | Phase |
|---|---|
| 0–2 | Phase 0 (repo/infra) + Phase 1 (auth) |
| 2–5 | Phase 2 (schema, migrations, seed, sequence service) |
| 5–9 | Phase 3 (all master data, List/Kanban/Form pattern established once, reused) |
| 9–13 | Phase 4 (Budget lifecycle — get Revise right, it's the trickiest state machine) |
| 13–17 | Phase 5 (Purchase: PO → Bill → Payment → Journal posting) |
| 17–20 | Phase 6 (Sales: SO → Invoice → Payment → Journal posting) |
| 20–22 | Phase 7 (Journal Entries screen, manual entry + Post/Reset) |
| 22–23.5 | Phase 8 (Reports + Dashboard) |
| 23.5–24 | Phase 9 (Contact portal) — cut first if time runs out, since it reuses Phase 5/6 payment logic almost entirely |

---

## Master Acceptance Checklist (whole system)

- [ ] Every document number (PO/SO/Bill/Invoice) is auto-generated, sequential, and gap-free under concurrent load.
- [ ] Every Bill/Invoice confirm produces exactly one balanced Journal Entry, correctly attributing default accounts (Purchase Expense / Sales Income) and Creditors/Debtors.
- [ ] Every Payment produces exactly one Journal Entry moving cash between Creditors/Debtors and the correct Cash/Bank account per `Payment Via`.
- [ ] No Journal Entry can be Posted while unbalanced — enforced in `packages/core`, not just the UI.
- [ ] Budget Achieved Amount/%/Amount-to-Achieve are computed, never stored, and only visible once Confirmed.
- [ ] Budget Revise produces a correctly-linked Draft/Revised pair with the "X Revised" naming rule.
- [ ] Balance Sheet balances (Assets = Liabilities) for the seeded demo dataset.
- [ ] A `User`-role account can never see or touch anything outside their own linked Contact's documents.
- [ ] Every master-data table uses soft-archive; nothing referenced by a transaction is ever hard-deleted.
- [ ] All monetary fields are `Decimal(14,2)` end to end — never `Float`.
