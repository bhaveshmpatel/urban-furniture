import { prisma } from "./src/index";
async function main() {
  const c = await prisma.account.count();
  console.log("Account count BEFORE CLEAR:", c);
  await prisma.account.deleteMany();
  const c2 = await prisma.account.count();
  console.log("Account count AFTER CLEAR:", c2);
}
main().finally(()=>prisma.$disconnect());
