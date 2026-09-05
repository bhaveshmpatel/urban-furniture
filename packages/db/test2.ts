import { prisma } from "./src/index";
async function main() {
  const accs = await prisma.account.findMany({ select: { code: true } });
  console.log("Accs:", accs.slice(0, 10));
}
main().finally(()=>prisma.$disconnect());
