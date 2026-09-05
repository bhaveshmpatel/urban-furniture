const fs = require('fs');

function addSequenceAndFilters(file, typeName, idPrefix) {
  let content = fs.readFileSync(file, 'utf8');

  // Add states
  if (!content.includes('const [statusFilter')) {
    content = content.replace(
      'const [searchQuery, setSearchQuery] = useState("");',
      `const [searchQuery, setSearchQuery] = useState("");\n  const [statusFilter, setStatusFilter] = useState("ALL");\n  const [sortOrder, setSortOrder] = useState("NEWEST");`
    );
  }

  // Find the entity array name, e.g. orders, bills, invoices
  const isPO = file.includes('purchase/orders');
  const isSO = file.includes('sales/orders');
  const isBill = file.includes('purchase/bills');
  const isInv = file.includes('sales/invoices');

  const arrayName = (isPO || isSO) ? 'orders' : (isBill ? 'bills' : 'invoices');
  const dateField = (isPO || isSO) ? 'orderDate' : (isBill ? 'invoiceDate' : 'invoiceDate');
  const partnerField = isPO || isBill ? 'vendor' : 'customer';
  const seqField = isPO || isSO ? 'orderNumber' : (isBill ? 'billNumber' : 'invoiceNumber');

  // Replace filtered array logic
  const oldFilterRegex = new RegExp(`const filtered${arrayName.charAt(0).toUpperCase() + arrayName.slice(1)} = ${arrayName}\\.filter\\([^\\)]+\\)[^;]*;`, 'g');
  const filterLogic = `const filtered${arrayName.charAt(0).toUpperCase() + arrayName.slice(1)} = ${arrayName}
    .filter(o => {
      const matchesSearch = o.${partnerField}?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.${seqField}?.toString().includes(searchQuery) ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "NEWEST") return new Date(b.${dateField}).getTime() - new Date(a.${dateField}).getTime();
      if (sortOrder === "OLDEST") return new Date(a.${dateField}).getTime() - new Date(b.${dateField}).getTime();
      return 0;
    });`;
  
  if (content.match(oldFilterRegex)) {
    content = content.replace(oldFilterRegex, filterLogic);
  } else {
    // maybe it doesn't match single line regex if formatted differently. let's just replace the basic one
    const simpleFilter = new RegExp(`const filtered${arrayName.charAt(0).toUpperCase() + arrayName.slice(1)} = ${arrayName}\\.filter\\([\\s\\S]*?\\);`);
    content = content.replace(simpleFilter, filterLogic);
  }

  // Replace ID formatting with Sequence in Table and Kanban
  content = content.replace(
    /<TableCell className="font-medium text-uf-green">{o\.id\.slice\(-8\)\.toUpperCase\(\)}<\/TableCell>/g,
    `<TableCell className="font-medium text-uf-green">${idPrefix}-{o.${seqField}?.toString().padStart(5, '0')}</TableCell>`
  );
  content = content.replace(
    /<h3 className="font-bold text-uf-green">{o\.id\.slice\(-8\)\.toUpperCase\(\)}<\/h3>/g,
    `<h3 className="font-bold text-uf-green">${idPrefix}-{o.${seqField}?.toString().padStart(5, '0')}</h3>`
  );
  content = content.replace(
    /<TableCell className="font-medium text-blue-600">{b\.id\.slice\(-8\)\.toUpperCase\(\)}<\/TableCell>/g,
    `<TableCell className="font-medium text-blue-600">${idPrefix}-{b.${seqField}?.toString().padStart(5, '0')}</TableCell>`
  );
  content = content.replace(
    /<h3 className="font-bold text-blue-600">{b\.id\.slice\(-8\)\.toUpperCase\(\)}<\/h3>/g,
    `<h3 className="font-bold text-blue-600">${idPrefix}-{b.${seqField}?.toString().padStart(5, '0')}</h3>`
  );
  content = content.replace(
    /<TableCell className="font-medium text-blue-600">{i\.id\.slice\(-8\)\.toUpperCase\(\)}<\/TableCell>/g,
    `<TableCell className="font-medium text-blue-600">${idPrefix}-{i.${seqField}?.toString().padStart(5, '0')}</TableCell>`
  );
  content = content.replace(
    /<h3 className="font-bold text-blue-600">{i\.id\.slice\(-8\)\.toUpperCase\(\)}<\/h3>/g,
    `<h3 className="font-bold text-blue-600">${idPrefix}-{i.${seqField}?.toString().padStart(5, '0')}</h3>`
  );

  // Form title
  content = content.replace(
    new RegExp(`<h2>${typeName} {[^}]+}<\\/h2>`, 'g'),
    `<h2>${typeName} {isNew ? "New" : \`${idPrefix}-\${(order || bill || invoice)?.${seqField}?.toString().padStart(5, '0')}\`}</h2>`
  );

  const filterUI = `
    <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-md border shadow-sm">
      <div className="flex space-x-4 items-center">
        <div className="text-sm font-medium text-gray-500">Filter by Status:</div>
        <select className="border rounded px-2 py-1 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <div className="flex space-x-4 items-center">
        <div className="text-sm font-medium text-gray-500">Sort by Date:</div>
        <select className="border rounded px-2 py-1 text-sm" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
          <option value="NEWEST">Newest First</option>
          <option value="OLDEST">Oldest First</option>
        </select>
      </div>
    </div>
  `;

  if (!content.includes('Filter by Status:')) {
    if (content.includes('const renderList = () => (')) {
      content = content.replace(
        'const renderList = () => (\n    <div',
        `const renderList = () => (\n    <div>\n${filterUI}\n    <div`
      );
      content = content.replace(/<\/Table>\n    <\/div>\n  \);/g, '</Table>\n    </div>\n    </div>\n  );');
    }

    if (content.includes('const renderKanban = () => (')) {
      content = content.replace(
        'const renderKanban = () => (\n    <div',
        `const renderKanban = () => (\n    <div>\n${filterUI}\n    <div`
      );
      content = content.replace(/<\/div>\n  \);/g, '</div>\n    </div>\n  );');
    }
  }

  // For Sales Orders Table Headers
  if (isSO) {
    content = content.replace('<TableHead>Order ID</TableHead>', '<TableHead>SO Number</TableHead>');
  } else if (isBill) {
    content = content.replace('<TableHead>Bill ID</TableHead>', '<TableHead>Bill Number</TableHead>');
  } else if (isInv) {
    content = content.replace('<TableHead>Invoice ID</TableHead>', '<TableHead>Invoice Number</TableHead>');
  }

  fs.writeFileSync(file, content);
}

addSequenceAndFilters('apps/web/app/(app)/sales/orders/page.tsx', 'Sales Order', 'SO');
addSequenceAndFilters('apps/web/app/(app)/purchase/bills/page.tsx', 'Vendor Bill', 'BILL');
addSequenceAndFilters('apps/web/app/(app)/sales/invoices/page.tsx', 'Customer Invoice', 'INV');
