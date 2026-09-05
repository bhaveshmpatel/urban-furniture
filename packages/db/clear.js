const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5433/urban_furniture',
});

async function main() {
  await pool.query('DELETE FROM "Budget"');
  console.log('Cleared Budget table');
  process.exit(0);
}

main().catch(console.error);
