const fs = require('fs');
const path = require('path');
const {
  GetBucketLifecycleConfigurationCommand,
  PutBucketLifecycleConfigurationCommand,
  S3Client,
} = require('@aws-sdk/client-s3');

loadEnv(path.join(__dirname, '..', '.env'));

const args = process.argv.slice(2);
const applyChanges = args.includes('--apply');
const listOnly = args.includes('--list');
const retentionDays = Number(valueForArg('--days') || process.env.BACKUP_R2_RETENTION_DAYS || 90);
const prefix = normalizePrefix(process.env.BACKUP_R2_PREFIX || 'database-backups');
const ruleId = process.env.BACKUP_R2_LIFECYCLE_RULE_ID || 'margele-net-encrypted-db-backups';

const config = {
  r2AccessKeyId: process.env.R2_BACKUP_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_BACKUP_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '',
  r2BucketName: process.env.R2_BACKUP_BUCKET_NAME || process.env.R2_BUCKET_NAME || '',
  r2Endpoint: process.env.R2_BACKUP_ENDPOINT || process.env.R2_ENDPOINT || '',
  r2Region: process.env.R2_BACKUP_REGION || process.env.R2_REGION || 'auto',
};

for (const [key, value] of Object.entries({
  R2_ACCESS_KEY_ID: config.r2AccessKeyId,
  R2_SECRET_ACCESS_KEY: config.r2SecretAccessKey,
  R2_BUCKET_NAME: config.r2BucketName,
  R2_ENDPOINT: config.r2Endpoint,
})) {
  if (!value) {
    throw new Error(`${key} is required in backend/.env for R2 lifecycle management.`);
  }
}

if (!Number.isInteger(retentionDays) || retentionDays < 7) {
  throw new Error('Retention must be an integer of at least 7 days. Use --days 90 or BACKUP_R2_RETENTION_DAYS=90.');
}

const r2Client = new S3Client({
  region: config.r2Region,
  endpoint: config.r2Endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
  },
});

async function main() {
  const existingRules = await getExistingRules();
  if (listOnly) {
    printRules(existingRules);
    return;
  }

  const lifecycleRule = {
    ID: ruleId,
    Status: 'Enabled',
    Filter: {
      Prefix: `${prefix}/`,
    },
    Expiration: {
      Days: retentionDays,
    },
    AbortIncompleteMultipartUpload: {
      DaysAfterInitiation: 1,
    },
  };

  const nextRules = [
    ...existingRules.filter((rule) => rule.ID !== ruleId),
    lifecycleRule,
  ];

  console.log('R2 lifecycle rule plan');
  console.log(`Bucket: ${config.r2BucketName}`);
  console.log(`Rule ID: ${ruleId}`);
  console.log(`Prefix: ${prefix}/`);
  console.log(`Delete objects after: ${retentionDays} days`);
  console.log(`Existing rules preserved: ${existingRules.filter((rule) => rule.ID !== ruleId).length}`);

  if (!applyChanges) {
    console.log('');
    console.log('Dry run only. Re-run with --apply to update the bucket lifecycle configuration.');
    return;
  }

  await r2Client.send(
    new PutBucketLifecycleConfigurationCommand({
      Bucket: config.r2BucketName,
      LifecycleConfiguration: {
        Rules: nextRules,
      },
    }),
  );

  console.log('R2 lifecycle configuration updated.');
}

async function getExistingRules() {
  try {
    const response = await r2Client.send(
      new GetBucketLifecycleConfigurationCommand({
        Bucket: config.r2BucketName,
      }),
    );
    return Array.isArray(response.Rules) ? response.Rules : [];
  } catch (error) {
    const name = String(error?.name || '');
    const status = Number(error?.$metadata?.httpStatusCode || 0);
    if (name === 'NoSuchLifecycleConfiguration' || status === 404) {
      return [];
    }

    throw error;
  }
}

function printRules(rules) {
  if (!rules.length) {
    console.log('No R2 lifecycle rules found.');
    return;
  }

  console.log('R2 lifecycle rules');
  for (const rule of rules) {
    console.log(`- ${rule.ID || '(no id)'}: ${rule.Status || 'unknown'}`);
    if (rule.Filter?.Prefix) console.log(`  prefix: ${rule.Filter.Prefix}`);
    if (rule.Expiration?.Days) console.log(`  delete after: ${rule.Expiration.Days} days`);
    if (rule.Transitions?.length) console.log(`  transitions: ${rule.Transitions.length}`);
  }
}

function valueForArg(name) {
  const index = args.indexOf(name);
  if (index === -1) return '';
  return args[index + 1] || '';
}

function normalizePrefix(value) {
  return String(value || 'database-backups').replace(/^\/+|\/+$/g, '') || 'database-backups';
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
  const message = String(error?.message || error);
  if (/access denied/i.test(message)) {
    console.error('Access denied by R2.');
    console.error('The current R2 credentials can probably upload objects, but cannot manage bucket lifecycle rules.');
    console.error('Use credentials with R2 bucket lifecycle/admin permission, then re-run this command.');
  } else {
    console.error(message);
  }
  process.exitCode = 1;
});
