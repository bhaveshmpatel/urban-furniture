import { prisma } from './src/index';

const requiredAccounts = [
  { name: "Cash", type: "ASSET", code: "1000" },
  { name: "Bank", type: "ASSET", code: "1010" },
  { name: "Accounts Receivable (Debtors)", type: "ASSET", code: "1100" },
  { name: "Inventory", type: "ASSET", code: "1200" },
  { name: "Accounts Payable (Creditors)", type: "LIABILITY", code: "2000" },
  { name: "Tax Payable", type: "LIABILITY", code: "2100" },
  { name: "Owner Equity", type: "EQUITY", code: "3000" },
  { name: "Retained Earnings", type: "EQUITY", code: "3100" },
  { name: "Sales Income", type: "INCOME", code: "4000" },
  { name: "Purchase Expense", type: "EXPENSE", code: "5000" },
  { name: "Operating Expenses", type: "EXPENSE", code: "5100" }
];

async function main() {
  for (const acc of requiredAccounts) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Account" (id, name, type, code, "isArchived", "createdAt") 
      VALUES (gen_random_uuid()::text, '${acc.name}', '${acc.type}', '${acc.code}', false, NOW())
      ON CONFLICT(code) DO NOTHING;
    `);
  }
  console.log("Inserted via RAW SQL.");
  const check = await prisma.account.findUnique({ where: { code: '5000' }});
  console.log("Check 5000:", check);
}
main().finally(() => prisma.$disconnect());
