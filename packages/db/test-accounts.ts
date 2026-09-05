import { prisma } from "./index";
async function main() {
  const c = await prisma.account.count();
  console.log("Account count:", c);
}
main();
