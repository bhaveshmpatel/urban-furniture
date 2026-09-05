const fs = require('fs');

function fix(file, oldStr, newStr) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(file, content);
}

fix('apps/web/app/(app)/purchase/orders/page.tsx', 
    '`PO-${order.id.slice(-8).toUpperCase()}`', 
    '`PO-${order.orderNumber?.toString().padStart(5, "0")}`');

fix('apps/web/app/(app)/sales/orders/page.tsx', 
    '`SO-${order.id.slice(-8).toUpperCase()}`', 
    '`SO-${order.orderNumber?.toString().padStart(5, "0")}`');

fix('apps/web/app/(app)/purchase/bills/page.tsx', 
    '`BILL-${bill.id.slice(-8).toUpperCase()}`', 
    '`BILL-${bill.billNumber?.toString().padStart(5, "0")}`');

fix('apps/web/app/(app)/sales/invoices/page.tsx', 
    '`INV-${invoice.id.slice(-8).toUpperCase()}`', 
    '`INV-${invoice.invoiceNumber?.toString().padStart(5, "0")}`');

