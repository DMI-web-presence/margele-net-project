const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

loadEnv(path.join(__dirname, '..', '.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in backend/.env');
}

const dbSearchPath = 'catalog,auth,commerce,content,public';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: `-c search_path=${dbSearchPath}`,
});

async function main() {
  const countBefore = await pool.query(
    `SELECT COUNT(*)::int AS count FROM conversations WHERE customer_name ILIKE 'Test Chat Admin%'`,
  );

  const deleted = await pool.query(
    `
      DELETE FROM conversations
      WHERE customer_name ILIKE 'Test Chat Admin%'
      RETURNING id
    `,
  );

  const countAfter = await pool.query(
    `SELECT COUNT(*)::int AS count FROM conversations WHERE customer_name ILIKE 'Test Chat Admin%'`,
  );

  console.log(
    JSON.stringify({
      matchedBefore: countBefore.rows[0].count,
      deleted: deleted.rowCount,
      remaining: countAfter.rows[0].count,
      deletedIds: deleted.rows.map((row) => row.id),
    }),
  );
}

function loadEnv(filePath) {
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return;
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
