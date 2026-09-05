import { PrismaClient, Role, ContactType, ProductType, AccountType, JournalType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Users ───────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  const accountantPassword = await bcrypt.hash("Account@1234", 12);

  const admin = await prisma.user.upsert({
    where: { loginId: "admin001" },
    update: {},
    create: {
      loginId: "admin001",
      email: "admin@urbanfurniture.com",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const accountant = await prisma.user.upsert({
    where: { loginId: "acct001" },
    update: {},
    create: {
      loginId: "acct001",
      email: "accountant@urbanfurniture.com",
      passwordHash: accountantPassword,
      role: Role.ACCOUNTANT,
    },
  });

  console.log("✅ Users created:", admin.loginId, accountant.loginId);

  // ─── Chart of Accounts ───────────────────────────────────────────────────
  const accounts = await Promise.all([
    // Assets
    prisma.account.upsert({ where: { code: "1000" }, update: {}, create: { name: "Cash", type: AccountType.ASSET, code: "1000" } }),
    prisma.account.upsert({ where: { code: "1010" }, update: {}, create: { name: "Bank", type: AccountType.ASSET, code: "1010" } }),
    prisma.account.upsert({ where: { code: "1100" }, update: {}, create: { name: "Accounts Receivable (Debtors)", type: AccountType.ASSET, code: "1100" } }),
    prisma.account.upsert({ where: { code: "1200" }, update: {}, create: { name: "Inventory", type: AccountType.ASSET, code: "1200" } }),
    // Liabilities
    prisma.account.upsert({ where: { code: "2000" }, update: {}, create: { name: "Accounts Payable (Creditors)", type: AccountType.LIABILITY, code: "2000" } }),
    prisma.account.upsert({ where: { code: "2100" }, update: {}, create: { name: "Tax Payable", type: AccountType.LIABILITY, code: "2100" } }),
    // Equity
    prisma.account.upsert({ where: { code: "3000" }, update: {}, create: { name: "Owner Equity", type: AccountType.EQUITY, code: "3000" } }),
    prisma.account.upsert({ where: { code: "3100" }, update: {}, create: { name: "Retained Earnings", type: AccountType.EQUITY, code: "3100" } }),
    // Income
    prisma.account.upsert({ where: { code: "4000" }, update: {}, create: { name: "Sales Income", type: AccountType.INCOME, code: "4000" } }),
    // Expenses
    prisma.account.upsert({ where: { code: "5000" }, update: {}, create: { name: "Purchase Expense", type: AccountType.EXPENSE, code: "5000" } }),
    prisma.account.upsert({ where: { code: "5100" }, update: {}, create: { name: "Operating Expenses", type: AccountType.EXPENSE, code: "5100" } }),
  ]);

  const [cash, bank, debtors, , creditors, taxPayable, , , salesIncome, purchaseExpense] = accounts;

  console.log("✅ Chart of Accounts created:", accounts.length, "accounts");

  // ─── Journals ─────────────────────────────────────────────────────────────
  const salesJournal = await prisma.journal.upsert({
    where: { id: "journal-sales" },
    update: {},
    create: {
      id: "journal-sales",
      name: "Sales Journal",
      type: JournalType.SALES,
      defaultDebitAccountId: debtors!.id,
      defaultCreditAccountId: salesIncome!.id,
    },
  });

  const purchaseJournal = await prisma.journal.upsert({
    where: { id: "journal-purchase" },
    update: {},
    create: {
      id: "journal-purchase",
      name: "Purchase Journal",
      type: JournalType.PURCHASE,
      defaultDebitAccountId: purchaseExpense!.id,
      defaultCreditAccountId: creditors!.id,
    },
  });

  const bankJournal = await prisma.journal.upsert({
    where: { id: "journal-bank" },
    update: {},
    create: {
      id: "journal-bank",
      name: "Bank Journal",
      type: JournalType.BANK,
      defaultDebitAccountId: bank!.id,
      defaultCreditAccountId: debtors!.id,
    },
  });

  const cashJournal = await prisma.journal.upsert({
    where: { id: "journal-cash" },
    update: {},
    create: {
      id: "journal-cash",
      name: "Cash Journal",
      type: JournalType.CASH,
      defaultDebitAccountId: cash!.id,
      defaultCreditAccountId: debtors!.id,
    },
  });

  console.log("✅ Journals created:", salesJournal.name, purchaseJournal.name, bankJournal.name, cashJournal.name);

  // ─── Contacts ─────────────────────────────────────────────────────────────
  const vendorContact = await prisma.contact.upsert({
    where: { id: "contact-rahul" },
    update: {},
    create: {
      id: "contact-rahul",
      name: "Rahul Sharma",
      type: ContactType.VENDOR,
      email: "rahul.sharma@vendor.com",
      mobile: "9876543210",
      addressCity: "Mumbai",
      addressState: "Maharashtra",
      addressPincode: "400001",
    },
  });

  const customerContact = await prisma.contact.upsert({
    where: { id: "contact-nimesh" },
    update: {},
    create: {
      id: "contact-nimesh",
      name: "Nimesh Pathak",
      type: ContactType.CUSTOMER,
      email: "nimesh.pathak@customer.com",
      mobile: "9123456789",
      addressCity: "Ahmedabad",
      addressState: "Gujarat",
      addressPincode: "380001",
    },
  });

  console.log("✅ Contacts created:", vendorContact.name, customerContact.name);

  // ─── Products ─────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: "product-sofa" },
      update: {},
      create: {
        id: "product-sofa",
        name: "L-Shape Sofa",
        type: ProductType.GOODS,
        salesPrice: 45000,
        costPrice: 28000,
        category: "Living Room",
      },
    }),
    prisma.product.upsert({
      where: { id: "product-dining" },
      update: {},
      create: {
        id: "product-dining",
        name: "6-Seater Dining Set",
        type: ProductType.GOODS,
        salesPrice: 35000,
        costPrice: 22000,
        category: "Dining Room",
      },
    }),
    prisma.product.upsert({
      where: { id: "product-wardrobe" },
      update: {},
      create: {
        id: "product-wardrobe",
        name: "4-Door Wardrobe",
        type: ProductType.GOODS,
        salesPrice: 28000,
        costPrice: 18000,
        category: "Bedroom",
      },
    }),
    prisma.product.upsert({
      where: { id: "product-assembly" },
      update: {},
      create: {
        id: "product-assembly",
        name: "Assembly & Installation Service",
        type: ProductType.SERVICE,
        salesPrice: 2500,
        costPrice: 1500,
        category: "Services",
      },
    }),
  ]);

  console.log("✅ Products created:", products.length, "products");

  // ─── Analytic Accounts ────────────────────────────────────────────────────
  const analyticAccounts = await Promise.all([
    prisma.analyticAccount.upsert({
      where: { id: "analytic-sales-dept" },
      update: {},
      create: { id: "analytic-sales-dept", name: "Sales Department", type: "INCOME" },
    }),
    prisma.analyticAccount.upsert({
      where: { id: "analytic-ops-dept" },
      update: {},
      create: { id: "analytic-ops-dept", name: "Operations Department", type: "EXPENSE" },
    }),
  ]);

  console.log("✅ Analytic Accounts created:", analyticAccounts.length);

  // ─── Budget ───────────────────────────────────────────────────────────────
  await prisma.budget.upsert({
    where: { id: "budget-q4-2026" },
    update: {},
    create: {
      id: "budget-q4-2026",
      name: "Q4 2026 Sales Target",
      period: "2026-Q4",
      periodStart: new Date("2026-10-01"),
      periodEnd: new Date("2026-12-31"),
      plannedAmount: 500000,
      analyticAccountId: analyticAccounts[0]!.id,
      responsibleUserId: accountant.id,
    },
  });

  console.log("✅ Budget created");
  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Login Credentials:");
  console.log("  Admin:      loginId=admin001    password=Admin@1234");
  console.log("  Accountant: loginId=acct001     password=Account@1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
