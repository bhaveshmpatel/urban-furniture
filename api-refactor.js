const fs = require('fs');

const configs = {
  'apps/web/app/api/purchase-orders/route.ts': { model: 'purchaseOrder', include: '{ vendor: true, bill: true }', orderBy: 'orderDate', filterField: 'status' },
  'apps/web/app/api/vendor-bills/route.ts': { model: 'vendorBill', include: '{ vendor: true, purchaseOrder: true }', orderBy: 'invoiceDate', filterField: 'status' },
  'apps/web/app/api/sales-orders/route.ts': { model: 'salesOrder', include: '{ customer: true, invoice: true }', orderBy: 'orderDate', filterField: 'status' },
  'apps/web/app/api/customer-invoices/route.ts': { model: 'customerInvoice', include: '{ customer: true, salesOrder: true }', orderBy: 'invoiceDate', filterField: 'status' },
  'apps/web/app/api/contacts/route.ts': { model: 'contact', searchFields: "['name', 'email', 'phone']", filterField: 'type' },
  'apps/web/app/api/products/route.ts': { model: 'product', searchFields: "['name', 'sku']", filterField: 'type' },
  'apps/web/app/api/analytic-accounts/route.ts': { model: 'analyticAccount', searchFields: "['name', 'code']" },
  'apps/web/app/api/accounts/route.ts': { model: 'account', searchFields: "['name', 'code']", filterField: 'type' },
  'apps/web/app/api/journals/route.ts': { model: 'journal', searchFields: "['name', 'code']", filterField: 'type' },
  'apps/web/app/api/journal-entries/route.ts': { model: 'journalEntry', include: '{ journal: true }', orderBy: 'date', filterField: 'status' },
  'apps/web/app/api/users/route.ts': { model: 'user', include: '{ contact: true }', searchFields: "['name', 'email']" },
  'apps/web/app/api/budgets/route.ts': { model: 'budget', include: '{ analyticAccount: true, responsible: true }', filterField: 'status' }
};

for (const [file, conf] of Object.entries(configs)) {
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${file}`);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('withPagination')) {
    content = content.replace('import { prisma } from "@repo/db";', 'import { prisma } from "@repo/db";\nimport { withPagination } from "@repo/core";');
  }

  const oldGetRegex = /export async function GET\([^)]*\)\s*{[\s\S]*?return NextResponse\.json\([^)]+\);\n}/;
  
  let options = [];
  if (conf.include) options.push(`include: ${conf.include}`);
  if (conf.orderBy) options.push(`orderByField: '${conf.orderBy}'`);
  if (conf.filterField) options.push(`filterField: '${conf.filterField}'`);
  if (conf.searchFields) options.push(`searchFields: ${conf.searchFields}`);

  const newGet = `export async function GET(req: Request) {
  const result = await withPagination(req, prisma.${conf.model}, { ${options.join(', ')} });
  return NextResponse.json(result);
}`;

  content = content.replace(oldGetRegex, newGet);
  fs.writeFileSync(file, content);
  console.log(`Refactored ${file}`);
}
