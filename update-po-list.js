const fs = require('fs');
const file = 'apps/web/app/(app)/purchase/orders/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const [searchQuery, setSearchQuery] = useState("");',
  `const [searchQuery, setSearchQuery] = useState("");\n  const [statusFilter, setStatusFilter] = useState("ALL");\n  const [sortOrder, setSortOrder] = useState("NEWEST");`
);

content = content.replace(
  /const filteredOrders = orders\.filter\(o =>[\s\S]*?\);/,
  `const filteredOrders = orders
    .filter(o => {
      const matchesSearch = o.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.orderNumber?.toString().includes(searchQuery) ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "NEWEST") return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      if (sortOrder === "OLDEST") return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
      return 0;
    });`
);

content = content.replace(
  /<TableCell className="font-medium text-uf-green">{o\.id\.slice\(-8\)\.toUpperCase\(\)}<\/TableCell>/g,
  '<TableCell className="font-medium text-uf-green">PO-{o.orderNumber?.toString().padStart(5, \'0\')}</TableCell>'
);

content = content.replace(
  /<h3 className="font-bold text-uf-green">{o\.id\.slice\(-8\)\.toUpperCase\(\)}<\/h3>/g,
  '<h3 className="font-bold text-uf-green">PO-{o.orderNumber?.toString().padStart(5, \'0\')}</h3>'
);

content = content.replace(
  /<h2>Purchase Order {order\?\.id\?\.slice\(-8\)\.toUpperCase\(\)}<\/h2>/g,
  '<h2>Purchase Order {isNew ? "New" : `PO-${order?.orderNumber?.toString().padStart(5, \'0\')}`}</h2>'
);

// We need to pass filters to MasterDataLayout! Wait, MasterDataLayout might not support custom filters out of the box unless we add them. Let's check it.

fs.writeFileSync(file, content);
