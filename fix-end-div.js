const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<\/form>\n    <\/div>\n    <\/div>\n  \);\n}/g, '</form>\n    </div>\n  );\n}');
  fs.writeFileSync(file, content);
}

fix('apps/web/app/(app)/purchase/orders/page.tsx');
fix('apps/web/app/(app)/sales/orders/page.tsx');
fix('apps/web/app/(app)/purchase/bills/page.tsx');
fix('apps/web/app/(app)/sales/invoices/page.tsx');
