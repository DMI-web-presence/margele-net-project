const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Client } = require('pg');

loadEnv(path.join(__dirname, '..', '.env'));

const args = process.argv.slice(2);
const backupPathArg = args.find((arg) => !arg.startsWith('--'));
const backupsRoot = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '..', '..', '.local', 'backups'));
const databaseUrl = process.env.DATABASE_URL || '';
const tempDatabaseName = `margele_restore_test_${timestamp()}`;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required in backend/.env');
}

async function main() {
  const backupPath = path.resolve(backupPathArg || (await latestBackupPath(backupsRoot)));
  if (!backupPath || !fs.existsSync(backupPath)) {
    throw new Error('Backup file not found. Provide a .dump/.sql file path or create a backup first.');
  }

  const sourceUrl = new URL(databaseUrl);
  const maintenanceUrl = withDatabase(sourceUrl, 'postgres').toString();
  const restoreUrl = withDatabase(sourceUrl, tempDatabaseName).toString();
  const adminClient = new Client({ connectionString: maintenanceUrl });

  console.log(`Restore test backup: ${path.basename(backupPath)}`);
  console.log(`Temporary database: ${tempDatabaseName}`);

  await adminClient.connect();

  try {
    await createDatabase(adminClient, tempDatabaseName);
    await runCommand(process.execPath, [
      path.join(__dirname, 'restore-db.js'),
      backupPath,
      '--target-url',
      restoreUrl,
      '--confirm',
    ]);
    await runCommand(process.execPath, [path.join(__dirname, 'validate-migration.js')], {
      DATABASE_URL: restoreUrl,
    });
    console.log('Restore test passed.');
  } finally {
    await dropDatabase(adminClient, tempDatabaseName);
    await adminClient.end();
    console.log(`Temporary database removed: ${tempDatabaseName}`);
  }
}

async function createDatabase(client, databaseName) {
  await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
}

async function dropDatabase(client, databaseName) {
  await client.query(
    `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1
        AND pid <> pg_backend_pid()
    `,
    [databaseName],
  );
  await client.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`);
}

function runCommand(command, commandArgs, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'inherit', 'inherit'],
      windowsHide: true,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${path.basename(command)} exited with code ${code}`));
    });
  });
}

async function latestBackupPath(folder) {
  if (!fs.existsSync(folder)) return '';

  const entries = await fs.promises.readdir(folder, { withFileTypes: true });
  const backups = [];
  for (const entry of entries) {
    if (!entry.isFile() || !/\.(dump|sql)$/i.test(entry.name)) continue;
    const filePath = path.join(folder, entry.name);
    const stat = await fs.promises.stat(filePath);
    backups.push({ filePath, mtimeMs: stat.mtimeMs });
  }

  backups.sort((left, right) => right.mtimeMs - left.mtimeMs);
  return backups[0]?.filePath || '';
}

function withDatabase(sourceUrl, databaseName) {
  const nextUrl = new URL(sourceUrl.toString());
  nextUrl.pathname = `/${databaseName}`;
  return nextUrl;
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function timestamp() {
  return new Date().toISOString().replace(/\D/g, '').slice(0, 14);
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

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
