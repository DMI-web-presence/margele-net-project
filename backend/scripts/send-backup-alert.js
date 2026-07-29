const fs = require('fs');
const os = require('os');
const path = require('path');
const { createBrevoMailer } = require('../src/services/brevo-mail');

loadEnv(path.join(__dirname, '..', '.env'));

const args = process.argv.slice(2);
const status = valueForArg('--status') || 'failed';
const logPath = valueForArg('--log');
const alertEmail = process.env.BACKUP_ALERT_EMAIL || process.env.BREVO_ADMIN_EMAIL || firstCsv(process.env.ADMIN_EMAILS);

const mailer = createBrevoMailer({
  enabled: String(process.env.BREVO_ENABLED || '').toLowerCase() === 'true',
  apiKey: process.env.BREVO_API_KEY || '',
  senderEmail: process.env.BREVO_SENDER_EMAIL || '',
  senderName: process.env.BREVO_SENDER_NAME || 'Margele.net',
  replyToEmail: process.env.BREVO_REPLY_TO_EMAIL || '',
  replyToName: process.env.BREVO_REPLY_TO_NAME || '',
});

async function main() {
  if (status !== 'failed') {
    throw new Error('Only failed backup alerts are supported.');
  }

  if (!alertEmail) {
    console.error('Backup alert skipped: BACKUP_ALERT_EMAIL or BREVO_ADMIN_EMAIL is not configured.');
    return;
  }

  const logExcerpt = await readSafeLogExcerpt(logPath);
  const timestamp = new Date().toISOString();
  const host = os.hostname();

  const result = await mailer.sendTransactionalEmail({
    to: [{ email: alertEmail }],
    subject: `[Margele.net] Backup automat esuat`,
    textContent: [
      'Backupul automat al bazei de date a esuat.',
      '',
      `Data: ${timestamp}`,
      `Host: ${host}`,
      logPath ? `Log: ${logPath}` : '',
      '',
      'Ultimele linii din log:',
      logExcerpt || '(log indisponibil)',
      '',
      'Verifica serverul si ruleaza manual: npm.cmd run backup:db:offsite',
    ]
      .filter(Boolean)
      .join('\n'),
    htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin: 0 0 16px;">Backup automat esuat</h2>
        <p style="margin: 0 0 12px;">Backupul automat al bazei de date Margele.net a esuat.</p>
        <ul style="margin: 0 0 16px; padding-left: 20px;">
          <li><strong>Data:</strong> ${escapeHtml(timestamp)}</li>
          <li><strong>Host:</strong> ${escapeHtml(host)}</li>
          ${logPath ? `<li><strong>Log:</strong> ${escapeHtml(logPath)}</li>` : ''}
        </ul>
        <p style="margin: 0 0 8px;"><strong>Ultimele linii din log:</strong></p>
        <pre style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; white-space: pre-wrap;">${escapeHtml(
          logExcerpt || '(log indisponibil)',
        )}</pre>
        <p style="margin: 16px 0 0;">Verifica serverul si ruleaza manual: <code>npm.cmd run backup:db:offsite</code></p>
      </div>
    `,
    tags: ['backup', 'alert'],
  });

  if (result?.skipped) {
    console.error(`Backup alert skipped: ${result.reason}`);
    return;
  }

  console.log(`Backup failure alert sent to ${alertEmail}`);
}

async function readSafeLogExcerpt(filePath) {
  if (!filePath) return '';

  try {
    const content = await fs.promises.readFile(path.resolve(filePath), 'utf8');
    return redactSecrets(content).split(/\r?\n/).slice(-80).join('\n').trim();
  } catch {
    return '';
  }
}

function redactSecrets(value) {
  return String(value || '')
    .replace(/(postgres(?:ql)?:\/\/[^:\s]+:)[^@\s]+(@)/gi, '$1[redacted]$2')
    .replace(/(DATABASE_URL\s*=\s*)\S+/gi, '$1[redacted]')
    .replace(/(R2_SECRET_ACCESS_KEY\s*=\s*)\S+/gi, '$1[redacted]')
    .replace(/(R2_ACCESS_KEY_ID\s*=\s*)\S+/gi, '$1[redacted]')
    .replace(/(BREVO_API_KEY\s*=\s*)\S+/gi, '$1[redacted]')
    .replace(/(BACKUP_ENCRYPTION_KEY\s*=\s*)\S+/gi, '$1[redacted]');
}

function valueForArg(name) {
  const index = args.indexOf(name);
  if (index === -1) return '';
  return args[index + 1] || '';
}

function firstCsv(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .find(Boolean) || '';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
