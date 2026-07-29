const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

loadEnv(path.join(__dirname, '..', '.env'));

const args = process.argv.slice(2);
const confirmRestore = args.includes('--confirm');
const backupPathArg = args.find((arg) => !arg.startsWith('--'));
const targetUrlArg = valueForArg('--target-url');
const targetDatabaseUrl = targetUrlArg || process.env.RESTORE_DATABASE_URL || '';
const pgRestorePath = process.env.PG_RESTORE_PATH || findPostgresTool('pg_restore') || 'pg_restore';
const psqlPath = process.env.PSQL_PATH || findPostgresTool('psql') || 'psql';

async function main() {
  if (!backupPathArg) {
    throw new Error('Usage: node scripts/restore-db.js <backup.dump|backup.sql> --target-url <postgres-url> --confirm');
  }

  if (!targetDatabaseUrl) {
    throw new Error('Provide --target-url or RESTORE_DATABASE_URL. Refusing to restore into DATABASE_URL by default.');
  }

  if (!confirmRestore) {
    throw new Error('Restore is destructive. Re-run with --confirm after verifying the target database URL.');
  }

  const backupPath = path.resolve(backupPathArg);
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  const isPlainSql = /\.sql$/i.test(backupPath);
  console.log(`Restoring ${backupPath}`);
  console.log(`Target database: ${safeDatabaseLabel(targetDatabaseUrl)}`);

  if (isPlainSql) {
    await runCommand(psqlPath, ['--dbname', targetDatabaseUrl, '--file', backupPath]);
  } else {
    await runCommand(pgRestorePath, [
      '--dbname',
      targetDatabaseUrl,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      backupPath,
    ]);
  }

  console.log('Restore complete.');
}

function runCommand(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: ['ignore', 'inherit', 'inherit'],
      windowsHide: true,
    });

    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(
          new Error(
            `${command} was not found. Install PostgreSQL client tools or set PG_RESTORE_PATH / PSQL_PATH in backend/.env.`,
          ),
        );
        return;
      }

      reject(error);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function valueForArg(name) {
  const index = args.indexOf(name);
  if (index === -1) return '';
  return args[index + 1] || '';
}

function safeDatabaseLabel(value) {
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}${parsed.pathname}`;
  } catch {
    return 'provided target database';
  }
}

function findPostgresTool(toolName) {
  if (process.platform !== 'win32') return '';

  const candidates = [
    `C:\\Program Files\\PostgreSQL\\18\\bin\\${toolName}.exe`,
    `C:\\Program Files\\PostgreSQL\\17\\bin\\${toolName}.exe`,
    `C:\\Program Files\\PostgreSQL\\16\\bin\\${toolName}.exe`,
    `C:\\Program Files\\PostgreSQL\\15\\bin\\${toolName}.exe`,
    `C:\\Program Files\\PostgreSQL\\14\\bin\\${toolName}.exe`,
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || '';
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
