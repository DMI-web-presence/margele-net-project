const fs = require('fs');
const path = require('path');

loadEnv(path.join(__dirname, '..', '.env'));

const backupsRoot = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '..', '..', '.local', 'backups'));
const args = process.argv.slice(2);
const confirmDelete = args.includes('--confirm');
const retention = {
  daily: Number(process.env.BACKUP_RETENTION_DAILY || 14),
  weekly: Number(process.env.BACKUP_RETENTION_WEEKLY || 8),
  monthly: Number(process.env.BACKUP_RETENTION_MONTHLY || 12),
};

async function main() {
  if (!fs.existsSync(backupsRoot)) {
    console.log(`Backup folder does not exist yet: ${backupsRoot}`);
    return;
  }

  const backups = await listBackups(backupsRoot);
  const plan = buildRetentionPlan(backups, retention);

  console.log('Backup prune plan');
  console.log(`Folder: ${backupsRoot}`);
  console.log(`Retention: ${retention.daily} daily, ${retention.weekly} weekly, ${retention.monthly} monthly`);
  console.log(`Backups found: ${backups.length}`);
  console.log(`Keep: ${plan.keep.size}`);
  console.log(`Delete: ${plan.delete.length}`);

  for (const backup of plan.delete.slice(0, 30)) {
    console.log(`- ${confirmDelete ? 'delete' : 'would delete'} ${path.basename(backup.filePath)}`);
  }

  if (plan.delete.length > 30) {
    console.log(`...and ${plan.delete.length - 30} more`);
  }

  if (!confirmDelete) {
    console.log('Dry run only. Re-run with --confirm to delete old backups.');
    return;
  }

  for (const backup of plan.delete) {
    await removeBackupPair(backup.filePath);
  }

  console.log('Old backups removed.');
}

async function listBackups(folder) {
  const entries = await fs.promises.readdir(folder, { withFileTypes: true });
  const backups = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/\.(dump|sql)$/i.test(entry.name)) continue;

    const filePath = path.join(folder, entry.name);
    const stat = await fs.promises.stat(filePath);
    backups.push({
      filePath,
      createdAt: dateFromBackupName(entry.name) || stat.birthtime || stat.mtime,
    });
  }

  return backups.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

function buildRetentionPlan(backups, policy) {
  const keep = new Set();
  const dailyKeys = new Set();
  const weeklyKeys = new Set();
  const monthlyKeys = new Set();

  for (const backup of backups) {
    const date = backup.createdAt;
    const dayKey = date.toISOString().slice(0, 10);
    const weekKey = `${date.getUTCFullYear()}-W${weekNumber(date)}`;
    const monthKey = date.toISOString().slice(0, 7);

    if (dailyKeys.size < policy.daily && !dailyKeys.has(dayKey)) {
      dailyKeys.add(dayKey);
      keep.add(backup.filePath);
      continue;
    }

    if (weeklyKeys.size < policy.weekly && !weeklyKeys.has(weekKey)) {
      weeklyKeys.add(weekKey);
      keep.add(backup.filePath);
      continue;
    }

    if (monthlyKeys.size < policy.monthly && !monthlyKeys.has(monthKey)) {
      monthlyKeys.add(monthKey);
      keep.add(backup.filePath);
    }
  }

  return {
    keep,
    delete: backups.filter((backup) => !keep.has(backup.filePath)),
  };
}

async function removeBackupPair(filePath) {
  await fs.promises.rm(filePath, { force: true });
  await fs.promises.rm(`${filePath}.json`, { force: true });
}

function dateFromBackupName(fileName) {
  const match = fileName.match(/-(\d{14})\.(dump|sql)$/i);
  if (!match) return null;

  const value = match[1];
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));
  const hour = Number(value.slice(8, 10));
  const minute = Number(value.slice(10, 12));
  const second = Number(value.slice(12, 14));
  const date = new Date(year, month, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? null : date;
}

function weekNumber(date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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
