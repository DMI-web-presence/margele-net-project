const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

loadEnv(path.join(__dirname, '..', '.env'));

const args = process.argv.slice(2);
const uploadLatest = args.includes('--latest');
const backupPathArg = args.find((arg) => !arg.startsWith('--'));
const backupsRoot = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '..', '..', '.local', 'backups'));

const config = {
  r2AccessKeyId: process.env.R2_BACKUP_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_BACKUP_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '',
  r2BucketName: process.env.R2_BACKUP_BUCKET_NAME || process.env.R2_BUCKET_NAME || '',
  r2Endpoint: process.env.R2_BACKUP_ENDPOINT || process.env.R2_ENDPOINT || '',
  r2Region: process.env.R2_BACKUP_REGION || process.env.R2_REGION || 'auto',
  r2Prefix: normalizePrefix(process.env.BACKUP_R2_PREFIX || 'database-backups'),
  encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || '',
};

for (const [key, value] of Object.entries({
  R2_ACCESS_KEY_ID: config.r2AccessKeyId,
  R2_SECRET_ACCESS_KEY: config.r2SecretAccessKey,
  R2_BUCKET_NAME: config.r2BucketName,
  R2_ENDPOINT: config.r2Endpoint,
  BACKUP_ENCRYPTION_KEY: config.encryptionKey,
})) {
  if (!value) {
    throw new Error(`${key} is required in backend/.env for encrypted offsite backups.`);
  }
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
  const backupPath = uploadLatest ? await latestBackupPath(backupsRoot) : path.resolve(backupPathArg || '');
  if (!backupPath || !fs.existsSync(backupPath)) {
    throw new Error('Backup file not found. Use --latest or provide a .dump/.sql file path.');
  }

  if (!/\.(dump|sql)$/i.test(backupPath)) {
    throw new Error('Only .dump and .sql backup files are supported.');
  }

  const backupBuffer = await fs.promises.readFile(backupPath);
  const encrypted = encryptBackup(backupBuffer, config.encryptionKey);
  const backupFileName = path.basename(backupPath);
  const objectKey = `${config.r2Prefix}/${backupFileName}.enc`;
  const metadataKey = `${objectKey}.json`;
  const sourceMetadata = await readSourceMetadata(`${backupPath}.json`);
  const metadata = {
    ...sourceMetadata,
    uploadedAt: new Date().toISOString(),
    sourceFileName: backupFileName,
    encryptedFileName: `${backupFileName}.enc`,
    encryption: {
      algorithm: 'aes-256-gcm',
      keyDerivation: 'sha256(BACKUP_ENCRYPTION_KEY)',
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    },
    originalBytes: backupBuffer.length,
    encryptedBytes: encrypted.buffer.length,
    r2: {
      bucket: config.r2BucketName,
      key: objectKey,
    },
  };

  console.log(`Uploading encrypted backup to R2: ${objectKey}`);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: config.r2BucketName,
      Key: objectKey,
      Body: encrypted.buffer,
      ContentType: 'application/octet-stream',
      Metadata: {
        encrypted: 'true',
        algorithm: 'aes-256-gcm',
        source: 'margele-net-backup',
      },
    }),
  );

  await r2Client.send(
    new PutObjectCommand({
      Bucket: config.r2BucketName,
      Key: metadataKey,
      Body: Buffer.from(`${JSON.stringify(metadata, null, 2)}\n`, 'utf8'),
      ContentType: 'application/json; charset=utf-8',
      Metadata: {
        source: 'margele-net-backup',
      },
    }),
  );

  await fs.promises.writeFile(`${backupPath}.enc.json`, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log('Offsite backup uploaded.');
  console.log(`Backup key: ${objectKey}`);
  console.log(`Metadata key: ${metadataKey}`);
}

function encryptBackup(buffer, passphrase) {
  const key = crypto.createHash('sha256').update(passphrase).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    buffer: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
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

async function readSourceMetadata(metadataPath) {
  try {
    return JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
  } catch {
    return {};
  }
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
  console.error(error.message);
  process.exitCode = 1;
});
