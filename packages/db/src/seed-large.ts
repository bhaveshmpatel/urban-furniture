import { prisma } from "./index";


const names = ["John", "Alice", "Michael", "Sarah", "David", "Emma", "James", "Olivia", "Robert", "Sophia"];
const surnames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
const companies = ["Tech", "Solutions", "Global", "Industries", "Group", "Systems", "Corp", "Inc", "LLC", "Ltd"];
const furniture = ["Chair", "Desk", "Table", "Sofa", "Bed", "Cabinet", "Bookshelf", "Stool", "Bench", "Wardrobe"];
const prefixes = ["Modern", "Classic", "Ergonomic", "Luxury", "Minimalist", "Vintage", "Industrial", "Rustic"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomEl(arr: any[]) { return arr[randomInt(0, arr.length - 1)]; }

// Random date in the last 6 months
const now = new Date();
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(now.getMonth() - 6);

function getRandomDate() {
  const start = sixMonthsAgo.getTime();
  const end = now.getTime();
  return new Date(start + Math.random() * (end - start));
}

// Add days to a date
function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log("Starting large data seed with last 6 months history...");
  
  // 1. 200 Contacts
  console.log("Seeding 100 Contacts...");
  const contacts = [];
  for (let i = 0; i < 100; i++) {
    const isComp = Math.random() > 0.5;
    const name = isComp ? `${randomEl(prefixes)} ${randomEl(companies)}` : `${randomEl(names)} ${randomEl(surnames)}`;
    const type = randomEl(["CUSTOMER", "VENDOR", "BOTH"]);
    contacts.push({
      name: `${name} ${i}`,
      email: `contact${i}@example.com`,
      mobile: `555-${randomInt(1000, 9999)}`,
      type
    });
  }
  await prisma.contact.createMany({ data: contacts, skipDuplicates: false });
  const allContacts = await prisma.contact.findMany();
  const vendors = allContacts.filter(c => c.type === "VENDOR" || c.type === "BOTH");
  const customers = allContacts.filter(c => c.type === "CUSTOMER" || c.type === "BOTH");

  // 2. 200 Products
  console.log("Seeding 100 Products...");
  const products = [];
  for (let i = 0; i < 100; i++) {
    products.push({
      name: `${randomEl(prefixes)} ${randomEl(furniture)} ${i}`,
      type: randomEl(["GOODS", "SERVICE"]),
      salesPrice: randomInt(50, 1500),
      costPrice: randomInt(20, 800),
    });
  }
  await prisma.product.createMany({ data: products, skipDuplicates: false });
  const allProducts = await prisma.product.findMany();

  // 3. 200 Accounts
  console.log("Seeding 100 Accounts...");
  const accounts = [];
  
  // Required core accounts
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
  for (const acc of requiredAccounts) {
    accounts.push(acc);
  }

  const accountTypes = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];
  for (let i = 0; i < 100; i++) {
    accounts.push({
      code: `ACC-${Date.now() + i}`,
      name: `Account ${i}`,
      type: randomEl(accountTypes) as any,
    });
  }
  await prisma.account.createMany({ data: accounts, skipDuplicates: true });
  const allAccounts = await prisma.account.findMany();
  const debitAccs = allAccounts.filter(a => a.type === "ASSET" || a.type === "EXPENSE");
  const creditAccs = allAccounts.filter(a => a.type === "LIABILITY" || a.type === "EQUITY" || a.type === "INCOME");

  // 4. 200 Analytic Accounts
  console.log("Seeding 100 Analytic Accounts...");
  const analyticAccounts = [];
  for (let i = 0; i < 100; i++) {
    analyticAccounts.push({
      name: `Project ${i}`,
      type: randomEl(["INCOME", "EXPENSE"]) as any,
    });
  }
  await prisma.analyticAccount.createMany({ data: analyticAccounts, skipDuplicates: false });
  const allAnalytics = await prisma.analyticAccount.findMany();

  // 5. Journals
  console.log("allAccounts length: ", allAccounts.length); console.log("Seeding 5 Journals...");
  const journals = [];
  const journalTypes = ["SALES", "PURCHASE", "BANK", "CASH", "GENERAL"];
  for (let i = 0; i < 5; i++) {
    journals.push({
      name: `${journalTypes[i]} Journal`,
      type: journalTypes[i] as any,
      defaultDebitAccountId: randomEl(allAccounts).id,
      defaultCreditAccountId: randomEl(allAccounts).id,
    });
  }
  await prisma.journal.createMany({ data: journals, skipDuplicates: false });
  const allJournals = await prisma.journal.findMany();

  // 6. 200 Budgets
  console.log("Seeding 100 Budgets...");
  const budgets = [];
  for (let i = 0; i < 100; i++) {
    const pStart = new Date(now.getFullYear(), now.getMonth() - (i % 6), 1);
    const pEnd = new Date(now.getFullYear(), now.getMonth() - (i % 6) + 1, 0);
    budgets.push({
      name: `Budget M-${i%6} - ${i}`,
      analyticAccountId: randomEl(allAnalytics).id,
      type: randomEl(["INCOME", "EXPENSE"]) as any,
      responsibleContactId: randomEl(allContacts).id,
      periodStart: pStart,
      periodEnd: pEnd,
      committedAmount: randomInt(5000, 50000),
      status: randomEl(["DRAFT", "CONFIRMED", "CANCELLED"]) as any,
    });
  }
  await prisma.budget.createMany({ data: budgets, skipDuplicates: false });

  const statuses = ["DRAFT", "CONFIRMED", "CANCELLED"];

  // 7. 200 Purchase Orders & Lines
  console.log("Seeding 100 Purchase Orders...");
  for (let i = 0; i < 100; i++) {
    const po = await prisma.purchaseOrder.create({
      data: {
        vendorId: randomEl(vendors).id,
        status: randomEl(statuses) as any,
        orderDate: getRandomDate(),
      }
    });
    for(let j=0; j < randomInt(1, 3); j++) {
      await prisma.purchaseOrderLine.create({
        data: {
          purchaseOrderId: po.id,
          productId: randomEl(allProducts).id,
          analyticAccountId: randomEl(allAnalytics).id,
          quantity: randomInt(1, 10),
          unitPrice: randomInt(50, 500)
        }
      });
    }
  }

  // 8. 200 Sales Orders & Lines
  console.log("Seeding 100 Sales Orders...");
  for (let i = 0; i < 100; i++) {
    const so = await prisma.salesOrder.create({
      data: {
        customerId: randomEl(customers).id,
        status: randomEl(statuses) as any,
        orderDate: getRandomDate(),
      }
    });
    for(let j=0; j < randomInt(1, 3); j++) {
      await prisma.salesOrderLine.create({
        data: {
          salesOrderId: so.id,
          productId: randomEl(allProducts).id,
          analyticAccountId: randomEl(allAnalytics).id,
          quantity: randomInt(1, 10),
          unitPrice: randomInt(100, 1000)
        }
      });
    }
  }

  // 9. 200 Vendor Bills & Lines
  console.log("Seeding 100 Vendor Bills...");
  const vendorBills = [];
  for (let i = 0; i < 100; i++) {
    const invDate = getRandomDate();
    const dueDate = addDays(invDate, randomEl([15, 30, 45, 60]));
    const bill = await prisma.vendorBill.create({
      data: {
        vendorId: randomEl(vendors).id,
        status: randomEl(["DRAFT", "CONFIRMED", "PAID", "CANCELLED"]) as any,
        invoiceDate: invDate,
        dueDate: dueDate,
        totalAmount: 0 
      }
    });
    vendorBills.push(bill);
    let total = 0;
    for(let j=0; j < randomInt(1, 3); j++) {
      const q = randomInt(1, 10);
      const u = randomInt(50, 500);
      total += q * u;
      await prisma.vendorBillLine.create({
        data: {
          billId: bill.id,
          productId: randomEl(allProducts).id,
          analyticAccountId: randomEl(allAnalytics).id,
          quantity: q,
          unitPrice: u
        }
      });
    }
    await prisma.vendorBill.update({ where: { id: bill.id }, data: { totalAmount: total }});
  }

  // 10. 200 Customer Invoices & Lines
  console.log("Seeding 100 Customer Invoices...");
  const customerInvoices = [];
  for (let i = 0; i < 100; i++) {
    const invDate = getRandomDate();
    const dueDate = addDays(invDate, randomEl([15, 30, 45, 60]));
    const inv = await prisma.customerInvoice.create({
      data: {
        customerId: randomEl(customers).id,
        status: randomEl(["DRAFT", "CONFIRMED", "PAID", "CANCELLED"]) as any,
        invoiceDate: invDate,
        dueDate: dueDate,
        totalAmount: 0
      }
    });
    customerInvoices.push(inv);
    let total = 0;
    for(let j=0; j < randomInt(1, 3); j++) {
      const q = randomInt(1, 10);
      const u = randomInt(100, 1000);
      total += q * u;
      await prisma.customerInvoiceLine.create({
        data: {
          invoiceId: inv.id,
          productId: randomEl(allProducts).id,
          analyticAccountId: randomEl(allAnalytics).id,
          quantity: q,
          unitPrice: u
        }
      });
    }
    await prisma.customerInvoice.update({ where: { id: inv.id }, data: { totalAmount: total }});
  }

  // 11. 200 Journal Entries & Items
  console.log("Seeding 100 Journal Entries...");
  for (let i = 0; i < 100; i++) {
    const je = await prisma.journalEntry.create({
      data: {
        journalId: randomEl(allJournals).id,
        date: getRandomDate(),
        reference: `JE-REF-${i}`,
        status: randomEl(["DRAFT", "POSTED", "CANCELLED"]) as any
      }
    });
    const amount = randomInt(100, 5000);
    // add proper items to not break balance sheet
    await prisma.journalItem.createMany({
      data: [
        {
          journalEntryId: je.id,
          accountId: randomEl(debitAccs).id,
          analyticAccountId: randomEl(allAnalytics).id,
          debit: amount,
          credit: 0
        },
        {
          journalEntryId: je.id,
          accountId: randomEl(creditAccs).id,
          analyticAccountId: randomEl(allAnalytics).id,
          debit: 0,
          credit: amount
        }
      ]
    });
  }

  // 12. 200 Payments
  console.log("Seeding 100 Payments...");
  for (let i = 0; i < 100; i++) {
    const isOut = Math.random() > 0.5;
    await prisma.payment.create({
      data: {
        paymentDate: getRandomDate(),
        amount: randomInt(100, 5000),
        method: randomEl(["BANK", "CASH"]) as any,
        contactId: isOut ? randomEl(vendors).id : randomEl(customers).id,
      }
    });
  }

  console.log("Data seeding complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
