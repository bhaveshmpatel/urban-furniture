const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<\/Table>\n    <\/div>\n    <\/div>\n    <\/div>\n  \);/g, '</Table>\n    </div>\n    </div>\n  );');
  content = content.replace(/<\/Table>\n    <\/div>\n    <\/div>\n  \);/g, '</Table>\n    </div>\n    </div>\n  );'); // Keep it the same if it's already correct. Let's just do a generic replacement for 3 closing divs where there should be 2.
  content = content.replace(/<\/div>\n    <\/div>\n    <\/div>\n  \);/g, '</div>\n    </div>\n  );');
  fs.writeFileSync(file, content);
}

['apps/web/app/(app)/purchase/orders/page.tsx', 'apps/web/app/(app)/sales/orders/page.tsx', 'apps/web/app/(app)/purchase/bills/page.tsx', 'apps/web/app/(app)/sales/invoices/page.tsx'].forEach(fixFile);
