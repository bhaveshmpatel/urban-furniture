const fs = require('fs');

const mappings = [
  { file: 'apps/web/app/(app)/purchase/orders/page.tsx', badUrl: '/api/purchase?', goodUrl: '/api/purchase-orders?' },
  { file: 'apps/web/app/(app)/sales/orders/page.tsx', badUrl: '/api/sales?', goodUrl: '/api/sales-orders?' },
  { file: 'apps/web/app/(app)/purchase/bills/page.tsx', badUrl: '/api/purchase?', goodUrl: '/api/vendor-bills?' },
  { file: 'apps/web/app/(app)/sales/invoices/page.tsx', badUrl: '/api/sales?', goodUrl: '/api/customer-invoices?' },
];

for (const map of mappings) {
  let content = fs.readFileSync(map.file, 'utf8');
  content = content.replace(map.badUrl, map.goodUrl);
  fs.writeFileSync(map.file, content);
  console.log(`Fixed ${map.file}`);
}
