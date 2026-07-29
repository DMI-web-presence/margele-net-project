const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

loadEnv(path.join(__dirname, '..', '.env'));

const args = process.argv.slice(2);
const encryptedPathArg = args.find((arg) => !arg.startsWith('--'));
const outputArg = valueForArg('--output');
const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || '';
const backupsRoot = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '..', '..', '.local', 'backups'));

if (!encryptionKey) {
  throw new Error('BACKUP_ENCRYPTION_KEY is required in backend/.env to decrypt backups.');
}

async function main() {
  if (!encryptedPathArg) {
    throw new Error('Usage: node scripts/decrypt-backup.js <backup.dump.enc> [--output restored.dump]');
  }

  const encryptedPath = path.resolve(encryptedPathArg);
  const metadataPath = `${encryptedPath}.json`;
  if (!fs.existsSync(encryptedPath)) {
    throw new Error(`Encrypted backup not found: ${encryptedPath}`);
  }

  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Backup metadata not found: ${metadataPath}`);
  }

  const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
  const sourceFileName = metadata.sourceFileName || path.basename(encryptedPath).replace(/\.enc$/i, '');
  const outputPath = path.resolve(outputArg || path.join(backupsRoot, sourceFileName));
  const encryptedBuffer = await fs.promises.readFile(encryptedPath);
  const decryptedBuffer = decryptBackup(encryptedBuffer, encryptionKey, metadata.encryption);

  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(outputPath, decryptedBuffer);
  console.log(`Decrypted backup written: ${outputPath}`);
}

function decryptBackup(buffer, passphrase, encryption) {
  if (!encryption || encryption.algorithm !== 'aes-256-gcm') {
    throw new Error('Unsupported or missing encryption metadata.');
  }

  const key = crypto.createHash('sha256').update(passphrase).digest();
  const iv = Buffer.from(encryption.iv, 'base64');
  const authTag = Buffer.from(encryption.authTag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(buffer), decipher.final()]);
}

function valueForArg(name) {
  const index = args.indexOf(name);
  if (index === -1) return '';
  return args[index + 1] || '';
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
