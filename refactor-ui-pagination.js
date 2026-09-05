const fs = require('fs');

const files = [
  { path: 'apps/web/app/(app)/purchase/orders/page.tsx', arr: 'orders' },
  { path: 'apps/web/app/(app)/sales/orders/page.tsx', arr: 'orders' },
  { path: 'apps/web/app/(app)/purchase/bills/page.tsx', arr: 'bills' },
  { path: 'apps/web/app/(app)/sales/invoices/page.tsx', arr: 'invoices' }
];

for (const f of files) {
  let content = fs.readFileSync(f.path, 'utf8');

  // 1. Add page states
  if (!content.includes('const [page, setPage] = useState(1);')) {
    content = content.replace(
      'const [searchQuery, setSearchQuery] = useState("");',
      'const [searchQuery, setSearchQuery] = useState("");\n  const [page, setPage] = useState(1);\n  const [totalPages, setTotalPages] = useState(1);'
    );
  }

  // 2. Fix useEffect to depend on search and pagination states
  content = content.replace(
    'useEffect(() => {\n    fetchData();\n  }, []);',
    'useEffect(() => {\n    const delay = setTimeout(() => fetchData(), 300);\n    return () => clearTimeout(delay);\n  }, [page, searchQuery, statusFilter, sortOrder]);'
  );

  // 3. Update fetchData
  const oldFetchRegex = /const fetchData = async \(\) => {[\s\S]*?setLoading\(false\);\n  };/;
  const newFetch = `const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      paginate: "true",
      page: page.toString(),
      limit: "20",
      search: searchQuery,
      sortOrder: sortOrder,
      statusFilter: statusFilter
    });
    const res = await fetch(\`/api/${f.path.split('/')[4]}\?$\{params.toString()}\`);
    const json = await res.json();
    set${f.arr.charAt(0).toUpperCase() + f.arr.slice(1)}(json.data || []);
    setTotalPages(json.metadata?.totalPages || 1);
    setLoading(false);
  };`;
  content = content.replace(oldFetchRegex, newFetch);

  // 4. Remove local filtering, just assign filtered = arr
  const oldFilterRegex = new RegExp(`const filtered${f.arr.charAt(0).toUpperCase() + f.arr.slice(1)} = ${f.arr}\\s*\\.filter\\([\\s\\S]*?\\.sort\\([\\s\\S]*?\\);`, 'g');
  if (content.match(oldFilterRegex)) {
    content = content.replace(oldFilterRegex, `const filtered${f.arr.charAt(0).toUpperCase() + f.arr.slice(1)} = ${f.arr};`);
  }

  // 5. Add pagination prop to MasterDataLayout
  if (!content.includes('pagination={{')) {
    content = content.replace(
      'renderForm={renderForm}',
      'renderForm={renderForm}\n      pagination={{ page, totalPages, setPage }}'
    );
  }

  fs.writeFileSync(f.path, content);
  console.log(`Refactored ${f.path}`);
}
