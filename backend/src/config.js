const fs = require('fs');
const path = require('path');

loadEnv(path.join(__dirname, '..', '.env'));
loadEnv(path.join(__dirname, '..', '..', 'frontend', '.env'), false, [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_ORIGIN',
]);

const dbSearchSchemas = ['app_auth', 'catalog', 'commerce', 'content', 'public', 'auth'];
const dbSearchPath = dbSearchSchemas.join(',');

const config = {
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  frontendOrigin: normalizeConfiguredUrl(process.env.FRONTEND_ORIGIN) || 'http://localhost:3000',
  adminEmails: parseCsv(process.env.ADMIN_EMAILS || ''),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl:
    normalizeConfiguredUrl(process.env.GOOGLE_CALLBACK_URL) ||
    `http://localhost:${process.env.PORT || 3001}/auth/google/callback`,
  backendPublicUrl:
    normalizeConfiguredUrl(process.env.BACKEND_PUBLIC_URL) ||
    `http://localhost:${process.env.PORT || 3001}`,
  netopiaMode: process.env.NETOPIA_MODE || 'sandbox',
  netopiaApiKey: process.env.NETOPIA_API_KEY,
  netopiaPosSignature: process.env.NETOPIA_POS_SIGNATURE,
  netopiaNotifyToken: process.env.NETOPIA_NOTIFY_TOKEN,
  netopiaEmailTemplate: process.env.NETOPIA_EMAIL_TEMPLATE || '',
  netopiaLanguage: process.env.NETOPIA_LANGUAGE || 'ro',
  brevoEnabled: String(process.env.BREVO_ENABLED || '').toLowerCase() === 'true',
  brevoApiKey: process.env.BREVO_API_KEY || '',
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || '',
  brevoSenderName: process.env.BREVO_SENDER_NAME || 'Margele.net',
  brevoReplyToEmail: process.env.BREVO_REPLY_TO_EMAIL || '',
  brevoReplyToName: process.env.BREVO_REPLY_TO_NAME || '',
  brevoAdminEmail: process.env.BREVO_ADMIN_EMAIL || '',
  smartbillEnabled: String(process.env.SMARTBILL_ENABLED || '').toLowerCase() === 'true',
  smartbillBaseUrl:
    process.env.SMARTBILL_BASE_URL || 'https://ws.smartbill.ro/SBORO/api',
  smartbillEmail: process.env.SMARTBILL_EMAIL || '',
  smartbillToken: process.env.SMARTBILL_TOKEN || '',
  smartbillCompanyVatCode: process.env.SMARTBILL_COMPANY_VAT_CODE || '',
  smartbillInvoiceSeries: process.env.SMARTBILL_INVOICE_SERIES || '',
  smartbillTaxName: process.env.SMARTBILL_TAX_NAME || 'Normala',
  smartbillTaxPercentage: Number(process.env.SMARTBILL_TAX_PERCENTAGE || 21),
  smartbillDueDays: Number(process.env.SMARTBILL_DUE_DAYS || 0),
  smartbillSendEmail: String(process.env.SMARTBILL_SEND_EMAIL || '').toLowerCase() === 'true',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2BucketName: process.env.R2_BUCKET_NAME || '',
  r2Endpoint: process.env.R2_ENDPOINT || '',
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL || '',
  r2Region: process.env.R2_REGION || 'auto',
  productImageStorage: (process.env.PRODUCT_IMAGE_STORAGE || 'auto').toLowerCase(),
  cookieName: 'auth_token',
};

function loadEnv(filePath, override = true, allowedKeys = null) {
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
    if (allowedKeys && !allowedKeys.includes(key)) continue;

    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (override || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function normalizeConfiguredUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.startsWith('//')) return `https:${text}`;
  return text;
}

function parseCsv(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((item) => String(item || '').trim().toLowerCase())
      .filter(Boolean),
  );
}

module.exports = {
  config,
  dbSearchPath,
  dbSearchSchemas,
  loadEnv,
  normalizeConfiguredUrl,
  parseCsv,
};
