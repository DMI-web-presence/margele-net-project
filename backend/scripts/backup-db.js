const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

loadEnv(path.join(__dirname, '..', '.env'));

const databaseUrl = process.env.DATABASE_URL;
const backupsRoot = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '..', '..', '.local', 'backups'));
const pgDumpPath = process.env.PG_DUMP_PATH || findPostgresTool('pg_dump') || 'pg_dump';
const args = process.argv.slice(2);
const plainSql = args.includes('--plain');
const backupFormat = plainSql ? 'plain' : 'custom';

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required in backend/.env');
}

async function main() {
  await fs.promises.mkdir(backupsRoot, { recursive: true });

  const timestamp = timestampForFilename(new Date());
  const databaseName = databaseNameFromUrl(databaseUrl);
  const extension = plainSql ? 'sql' : 'dump';
  const fileName = `${databaseName}-${timestamp}.${extension}`;
  const outputPath = path.join(backupsRoot, fileName);
  const metadataPath = `${outputPath}.json`;

  const pgDumpArgs = plainSql
    ? ['--dbname', databaseUrl, '--no-owner', '--no-privileges']
    : ['--dbname', databaseUrl, '--format=custom', '--compress=9', '--no-owner', '--no-privileges'];

  console.log(`Creating ${backupFormat} backup: ${outputPath}`);
  await runCommandToFile(pgDumpPath, pgDumpArgs, outputPath);

  const stat = await fs.promises.stat(outputPath);
  const metadata = {
    createdAt: new Date().toISOString(),
    databaseName,
    format: backupFormat,
    fileName,
    bytes: stat.size,
    tool: path.basename(pgDumpPath),
  };

  await fs.promises.writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(`Backup complete: ${fileName}`);
  console.log(`Size: ${formatBytes(stat.size)}`);
  console.log(`Metadata: ${metadataPath}`);
}

function runCommandToFile(command, commandArgs, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath, { flags: 'w' });
    let childExited = false;
    let exitCode = null;
    let settled = false;
    const child = spawn(command, commandArgs, {
      stdio: ['ignore', 'pipe', 'inherit'],
      windowsHide: true,
    });

    child.stdout.pipe(output);

    const fail = (error) => {
      if (settled) return;
      settled = true;
      output.destroy();
      fs.promises.rm(outputPath, { force: true }).catch(() => {});
      reject(error);
    };

    const maybeResolve = () => {
      if (settled || !childExited || !output.closed) return;
      settled = true;
      if (exitCode === 0) {
        resolve();
        return;
      }
      fs.promises.rm(outputPath, { force: true }).catch(() => {});
      reject(new Error(`${command} exited with code ${exitCode}`));
    };

    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        fail(
          new Error(
            `${command} was not found. Install PostgreSQL client tools or set PG_DUMP_PATH in backend/.env.`,
          ),
        );
        return;
      }

      fail(error);
    });

    output.on('error', fail);
    output.on('close', maybeResolve);

    child.on('exit', (code) => {
      childExited = true;
      exitCode = code;
      maybeResolve();
    });
  });
}

function databaseNameFromUrl(value) {
  try {
    const parsed = new URL(value);
    const name = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    return sanitizeFilename(name || 'database');
  } catch {
    return 'database';
  }
}

function timestampForFilename(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function sanitizeFilename(value) {
  return String(value || 'database').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'database';
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
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
