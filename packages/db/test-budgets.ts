import { prisma } from "./src/index";
async function main() {
  const budgets = await prisma.budget.findMany();
  console.log("Budgets count:", budgets.length);
  const ids = budgets.map(b => b.id);
  const uniqueIds = new Set(ids);
  console.log("Unique IDs count:", uniqueIds.size);
  
  const aIds = budgets.map(b => b.analyticAccountId);
  const uniqueAIds = new Set(aIds);
  console.log("Unique AnalyticAccount IDs count:", uniqueAIds.size);
}
main().finally(() => prisma.$disconnect());
