import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "./index";

async function main() {
  const customer = await prisma.contact.findFirst({ where: { type: "CUSTOMER" } });
  const vendor = await prisma.contact.findFirst({ where: { type: "VENDOR" } });

  const passwordHash = await bcrypt.hash("Portal@1234", 12);

  if (customer) {
    await prisma.user.upsert({
      where: { loginId: "customer001" },
      update: {},
      create: {
        loginId: "customer001",
        email: customer.email || "customer@portal.com",
        passwordHash,
        role: Role.CONTACT,
        contactId: customer.id
      }
    });
    console.log(`Created portal account for customer ${customer.name}: loginId=customer001 password=Portal@1234`);
  }

  if (vendor) {
    await prisma.user.upsert({
      where: { loginId: "vendor001" },
      update: {},
      create: {
        loginId: "vendor001",
        email: vendor.email || "vendor@portal.com",
        passwordHash,
        role: Role.CONTACT,
        contactId: vendor.id
      }
    });
    console.log(`Created portal account for vendor ${vendor.name}: loginId=vendor001 password=Portal@1234`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
