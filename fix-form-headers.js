const fs = require('fs');

function fixFormHeader(file, entityName, prefix, seqField) {
  let content = fs.readFileSync(file, 'utf8');
  const regex = new RegExp(`\`${prefix}-\\$\\{${entityName}\\.id\\.slice\\(-8\\)\\.toUpperCase\\(\\)\\}\\``, 'g');
  content = content.replace(regex, `\`${prefix}-\\$\\{${entityName}.${seqField}?.toString().padStart(5, '0')}\``);
  fs.writeFileSync(file, content);
}

fixFormHeader('apps/web/app/(app)/purchase/orders/page.tsx', 'order', 'PO', 'orderNumber');
fixFormHeader('apps/web/app/(app)/sales/orders/page.tsx', 'order', 'SO', 'orderNumber');
fixFormHeader('apps/web/app/(app)/purchase/bills/page.tsx', 'bill', 'BILL', 'billNumber');
fixFormHeader('apps/web/app/(app)/sales/invoices/page.tsx', 'invoice', 'INV', 'invoiceNumber');
