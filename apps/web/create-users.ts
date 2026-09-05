import { prisma, Role } from "@repo/db";
import bcrypt from "bcrypt";

async function main() {
  const passwordHash = await bcrypt.hash("User@1234", 10);
  
  const rahul = await prisma.contact.findFirst({ where: { name: "Rahul Sharma" }});
  const nimesh = await prisma.contact.findFirst({ where: { name: "Nimesh Pathak" }});
  
  if (rahul) {
    await prisma.user.upsert({
      where: { email: rahul.email || "rahul@vendor.com" },
      update: {},
      create: {
        loginId: "user_rahul",
        email: rahul.email || "rahul@vendor.com",
        passwordHash,
        role: Role.CONTACT,
        contactId: rahul.id
      }
    });
    console.log("Created portal user for Rahul Sharma: rahul.sharma@vendor.com / User@1234");
  }

  if (nimesh) {
    await prisma.user.upsert({
      where: { email: nimesh.email || "nimesh@customer.com" },
      update: {},
      create: {
        loginId: "user_nimesh",
        email: nimesh.email || "nimesh@customer.com",
        passwordHash,
        role: Role.CONTACT,
        contactId: nimesh.id
      }
    });
    console.log("Created portal user for Nimesh Pathak: nimesh.pathak@customer.com / User@1234");
  }
}
main();
