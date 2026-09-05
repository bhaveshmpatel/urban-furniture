const fs = require('fs');

const files = [
  'apps/web/app/(app)/purchase/bills/page.tsx',
  'apps/web/app/(app)/purchase/orders/page.tsx',
  'apps/web/app/(app)/sales/invoices/page.tsx',
  'apps/web/app/(app)/sales/orders/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // This regex matches exactly the stray code block my last script left behind
  content = content.replace(/      if \(sortOrder === "OLDEST"\) return new Date\(a\.[a-zA-Z]+\)\.getTime\(\) - new Date\(b\.[a-zA-Z]+\)\.getTime\(\);\n      return 0;\n    \}\);\n/g, '');

  fs.writeFileSync(file, content);
  console.log('Fixed ' + file);
}
