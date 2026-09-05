const fs = require('fs');

function processFile(file, sequencePrefix) {
  let content = fs.readFileSync(file, 'utf8');

  // Add state if not exists
  if (!content.includes('const [statusFilter')) {
    content = content.replace(
      'const [searchQuery, setSearchQuery] = useState("");',
      `const [searchQuery, setSearchQuery] = useState("");\n  const [statusFilter, setStatusFilter] = useState("ALL");\n  const [sortOrder, setSortOrder] = useState("NEWEST");`
    );
  }

  // Update import if needed
  if (!content.includes('SelectContent') && !content.includes('@/components/ui/select')) {
    // We'll just assume they have Select imported, or we will add it.
  }

  // Define Filter bar UI
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

  // Inject filter UI in renderList
  if (content.includes('const renderList = () => (')) {
    content = content.replace(
      'const renderList = () => (\n    <div',
      `const renderList = () => (\n    <div>\n${filterUI}\n    <div`
    );
    // close the div
    content = content.replace(/<\/Table>\n    <\/div>\n  \);/g, '</Table>\n    </div>\n    </div>\n  );');
  }

  // Inject filter UI in renderKanban
  if (content.includes('const renderKanban = () => (')) {
    content = content.replace(
      'const renderKanban = () => (\n    <div',
      `const renderKanban = () => (\n    <div>\n${filterUI}\n    <div`
    );
    // close the div
    content = content.replace(/<\/div>\n  \);/g, '</div>\n    </div>\n  );');
  }
  
  fs.writeFileSync(file, content);
}

processFile('apps/web/app/(app)/purchase/orders/page.tsx', 'PO-');

