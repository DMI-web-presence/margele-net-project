const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

loadEnv(path.join(__dirname, '..', '.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in backend/.env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const report = await buildReport();
  printReport(report);
}

async function buildReport() {
  const [identity, ssl, searchPath] = await Promise.all([
    pool.query(`
      SELECT
        current_user AS current_user,
        current_database() AS current_database,
        inet_server_addr()::text AS server_address,
        inet_server_port() AS server_port
    `),
    pool.query(`
      SELECT ssl
      FROM pg_stat_ssl
      WHERE pid = pg_backend_pid()
    `).catch(() => ({ rows: [] })),
    pool.query('SHOW search_path'),
  ]);

  const currentUser = identity.rows[0].current_user;
  const role = await pool.query(
    `
      SELECT rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
      FROM pg_roles
      WHERE rolname = $1
    `,
    [currentUser],
  );
  const tablePrivileges = await pool.query(
    `
      SELECT table_schema, privilege_type, COUNT(*)::int AS count
      FROM information_schema.role_table_grants
      WHERE grantee = $1
        AND table_schema IN ('app_auth', 'auth', 'catalog', 'commerce', 'content', 'public')
      GROUP BY table_schema, privilege_type
      ORDER BY table_schema, privilege_type
    `,
    [currentUser],
  );

  return {
    generatedAt: new Date().toISOString(),
    identity: identity.rows[0],
    sslEnabled: Boolean(ssl.rows[0]?.ssl),
    searchPath: searchPath.rows[0]?.search_path || '',
    role: role.rows[0] || {},
    tablePrivileges: tablePrivileges.rows,
  };
}

function printReport(report) {
  const role = report.role;
  const highPrivilegeFlags = ['rolsuper', 'rolcreatedb', 'rolcreaterole', 'rolreplication', 'rolbypassrls']
    .filter((flag) => role[flag]);

  console.log('Database hardening report');
  console.log(`Generated: ${report.generatedAt}`);
  console.log('');
  console.log(`Database: ${report.identity.current_database}`);
  console.log(`User: ${report.identity.current_user}`);
  console.log(`Server: ${report.identity.server_address || 'local'}:${report.identity.server_port}`);
  console.log(`SSL: ${report.sslEnabled ? 'enabled' : 'not enabled / local connection'}`);
  console.log(`Search path: ${report.searchPath}`);
  console.log('');
  console.log(`High privilege flags: ${highPrivilegeFlags.length ? highPrivilegeFlags.join(', ') : 'none'}`);
  console.log('');
  console.log('Table privileges:');
  for (const row of report.tablePrivileges) {
    console.log(`- ${row.table_schema}: ${row.privilege_type} (${row.count})`);
  }
  console.log('');
  console.log('Recommendations:');
  if (highPrivilegeFlags.length) {
    console.log('- Production app user should not be superuser and should not create roles/databases.');
  } else {
    console.log('- App user role privileges look constrained at role level.');
  }
  if (!report.sslEnabled) {
    console.log('- Require SSL for production database connections.');
  }
  console.log('- Use a separate migration/admin DB user for schema changes.');
  console.log('- Use a read-only backup user if the production database provider supports pg_dump with limited grants.');
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
