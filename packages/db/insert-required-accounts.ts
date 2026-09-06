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
    const res = await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        name: acc.name,
        type: acc.type as any,
        code: acc.code
      }
    });
    console.log("Upserted:", res.code);
  }
}
main().finally(() => prisma.$disconnect());
