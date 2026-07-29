const fs = require('fs');
const path = require('path');

loadEnv(path.join(__dirname, '..', '.env'));
loadEnv(path.join(__dirname, '..', '..', 'frontend', '.env'), false);

const checks = [];

checkRequired('DATABASE_URL');
checkRequired('JWT_SECRET');
checkSecretLength('JWT_SECRET', 32);
checkRequired('BACKUP_ENCRYPTION_KEY');
checkSecretLength('BACKUP_ENCRYPTION_KEY', 32);
checkRequired('R2_BACKUP_ACCESS_KEY_ID', { fallback: ['R2_ACCESS_KEY_ID'] });
checkRequired('R2_BACKUP_SECRET_ACCESS_KEY', { fallback: ['R2_SECRET_ACCESS_KEY'] });
checkRequired('R2_BACKUP_BUCKET_NAME', { fallback: ['R2_BUCKET_NAME'] });
checkRequired('R2_BACKUP_ENDPOINT', { fallback: ['R2_ENDPOINT'] });
checkRequired('BACKUP_ALERT_EMAIL', { fallback: ['BREVO_ADMIN_EMAIL', 'ADMIN_EMAILS'] });
checkBrevo();
checkIgnored('.env');
checkIgnored('backend/.env');
checkIgnored('frontend/.env');
checkIgnored('.local/backups/');
checkIgnored('.local/backup-logs/');
checkNoTrackedEnvFiles();

printReport();

function checkRequired(key, options = {}) {
  const hasValue = Boolean(process.env[key] || options.fallback?.some((fallbackKey) => process.env[fallbackKey]));
  checks.push({
    status: hasValue ? 'pass' : 'fail',
    area: 'env',
    message: hasValue ? `${key} configured` : `${key} missing`,
  });
}

function checkSecretLength(key, minimumLength) {
  const value = process.env[key] || '';
  if (!value) return;

  checks.push({
    status: value.length >= minimumLength ? 'pass' : 'warn',
    area: 'secrets',
    message: value.length >= minimumLength
      ? `${key} length looks acceptable`
      : `${key} is shorter than ${minimumLength} characters`,
  });
}

function checkBrevo() {
  const enabled = String(process.env.BREVO_ENABLED || '').toLowerCase() === 'true';
  const configured = Boolean(enabled && process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
  checks.push({
    status: configured ? 'pass' : 'warn',
    area: 'alerts',
    message: configured ? 'Brevo alert delivery configured' : 'Brevo alert delivery is not fully configured',
  });
}

function checkIgnored(pattern) {
  const gitignorePath = path.join(__dirname, '..', '..', '.gitignore');
  let gitignore = '';
  try {
    gitignore = fs.readFileSync(gitignorePath, 'utf8');
  } catch {
    checks.push({ status: 'fail', area: 'git', message: '.gitignore not found' });
    return;
  }

  checks.push({
    status: gitignore.includes(pattern) ? 'pass' : 'warn',
    area: 'git',
    message: gitignore.includes(pattern) ? `${pattern} ignored by git` : `${pattern} is not listed in .gitignore`,
  });
}

function checkNoTrackedEnvFiles() {
  const gitFolder = path.join(__dirname, '..', '..', '.git');
  if (!fs.existsSync(gitFolder)) return;

  checks.push({
    status: 'info',
    area: 'git',
    message: 'Run `git ls-files | rg "\\.env$"` before committing to confirm env files are not tracked.',
  });
}

function printReport() {
  console.log('Security configuration audit');
  console.log('');
  for (const check of checks) {
    const marker = check.status.toUpperCase().padEnd(4);
    console.log(`[${marker}] ${check.area}: ${check.message}`);
  }

  const failures = checks.filter((check) => check.status === 'fail').length;
  const warnings = checks.filter((check) => check.status === 'warn').length;
  console.log('');
  console.log(`Result: ${failures} failures, ${warnings} warnings`);
  process.exitCode = failures > 0 ? 1 : 0;
}

function loadEnv(filePath, override = true) {
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
    if (override || !process.env[key]) {
      process.env[key] = value;
    }
  }
}
