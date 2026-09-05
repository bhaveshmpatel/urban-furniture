const fs = require("fs");
const path = require("path");

const appsWebDir = path.join(__dirname, "apps", "web", "app", "(app)");

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file === "page.tsx") {
      let content = fs.readFileSync(fullPath, "utf-8");
      let changed = false;

      // Fix `limit: "20"` to `limit: "10"`
      if (content.includes('limit: "20"')) {
        content = content.replace(/limit: "20"/g, 'limit: "10"');
        changed = true;
      }

      // Check if it's the exact problem
      const badEffectMatch1 = content.match(/useEffect\(\(\) => \{\n\s*fetchData\(\);\n\s*fetchDependencies\(\);\n\s*\}, \[\]\);/);
      if (badEffectMatch1) {
        const replacement = `useEffect(() => {
    const delay = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(delay);
  }, [page, searchQuery, statusFilter, sortOrder]);

  useEffect(() => {
    fetchDependencies();
  }, []);`;
        content = content.replace(badEffectMatch1[0], replacement);
        changed = true;
      }

      const badEffectMatch2 = content.match(/useEffect\(\(\) => \{\n\s*fetchData\(\);\n\s*\}, \[\]\);/);
      if (badEffectMatch2) {
        const replacement = `useEffect(() => {
    const delay = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(delay);
  }, [page, searchQuery, statusFilter, sortOrder]);`;
        content = content.replace(badEffectMatch2[0], replacement);
        changed = true;
      }

      // Some might have just `fetchData();` and `fetchAccounts()` or something.
      // Let's just do a regex replace for `fetchData();` inside an empty dependency useEffect.
      // Actually, my patterns might miss slightly different whitespace. 

      // Reset page when searchQuery changes in MasterDataLayout:
      // Actually, the easiest way to reset page is to add a small useEffect.
      // But wait, if page is a dependency of the same useEffect, how does it know?
      // When we type in search, `searchQuery` changes, it fetches, BUT page remains whatever it was (e.g. page 5).
      // We want to add an effect:
      const resetPageCode = `  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, sortOrder]);\n`;
      
      // If we don't have the resetPageCode, inject it before `const fetchData`
      if (!content.includes('setPage(1)') && content.includes('setSearchQuery') && content.includes('setPage')) {
        // we can place it right before `const fetchData`
        content = content.replace('const fetchData', resetPageCode + '\n  const fetchData');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log("Updated", fullPath);
      }
    }
  }
}

processDir(appsWebDir);
