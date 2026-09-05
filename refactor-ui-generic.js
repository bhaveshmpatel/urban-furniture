const fs = require('fs');

const pages = [
  { path: 'apps/web/app/(app)/contacts/page.tsx', arr: 'contacts', endpoint: 'contacts' },
  { path: 'apps/web/app/(app)/products/page.tsx', arr: 'products', endpoint: 'products' },
  { path: 'apps/web/app/(app)/accounting/analytic-accounts/page.tsx', arr: 'accounts', endpoint: 'analytic-accounts' },
  { path: 'apps/web/app/(app)/accounting/chart-of-accounts/page.tsx', arr: 'accounts', endpoint: 'accounts' },
  { path: 'apps/web/app/(app)/accounting/journals/page.tsx', arr: 'journals', endpoint: 'journals' },
  { path: 'apps/web/app/(app)/accounting/journal-entries/page.tsx', arr: 'entries', endpoint: 'journal-entries' },
  { path: 'apps/web/app/(app)/accounting/budgets/page.tsx', arr: 'budgets', endpoint: 'budgets' },
  { path: 'apps/web/app/(app)/users/page.tsx', arr: 'users', endpoint: 'users' },
];

for (const p of pages) {
  let content = fs.readFileSync(p.path, 'utf8');

  // Add states
  if (!content.includes('const [page, setPage] = useState(1);')) {
    content = content.replace(
      'const [searchQuery, setSearchQuery] = useState("");',
      'const [searchQuery, setSearchQuery] = useState("");\n  const [page, setPage] = useState(1);\n  const [totalPages, setTotalPages] = useState(1);\n  const [statusFilter, setStatusFilter] = useState("ALL");\n  const [sortOrder, setSortOrder] = useState("NEWEST");'
    );
  }

  // Effect
  const effectRegex = /useEffect\(\(\) => {\n\s*fetchData\(\);\n[^\}]*\}, \[\]\);/;
  content = content.replace(effectRegex, 'useEffect(() => {\n    const delay = setTimeout(() => fetchData(), 300);\n    return () => clearTimeout(delay);\n  }, [page, searchQuery, statusFilter, sortOrder]);');

  // FetchData
  const oldFetchRegex = /const fetchData = async \(\) => {[\s\S]*?setLoading\(false\);\n  };/;
  const newFetch = `const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      paginate: "true",
      page: page.toString(),
      limit: "10",
      search: searchQuery,
      sortOrder: sortOrder,
      statusFilter: statusFilter
    });
    const res = await fetch(\`/api/${p.endpoint}?$\{params.toString()}\`);
    const json = await res.json();
    set${p.arr.charAt(0).toUpperCase() + p.arr.slice(1)}(json.data || []);
    setTotalPages(json.metadata?.totalPages || 1);
    setLoading(false);
  };`;
  content = content.replace(oldFetchRegex, newFetch);

  // Filters
  const oldFilterRegex = new RegExp(`const filtered${p.arr.charAt(0).toUpperCase() + p.arr.slice(1)} = ${p.arr}\\.filter\\([\\s\\S]*?\\);`);
  content = content.replace(oldFilterRegex, `const filtered${p.arr.charAt(0).toUpperCase() + p.arr.slice(1)} = ${p.arr};`);

  // MasterDataLayout
  if (!content.includes('pagination={{')) {
    content = content.replace(
      'renderForm={renderForm}',
      'renderForm={renderForm}\n      pagination={{ page, totalPages, setPage }}'
    );
  }

  fs.writeFileSync(p.path, content);
  console.log(`Refactored ${p.path}`);
}
