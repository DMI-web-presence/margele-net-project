const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

loadEnv(path.join(__dirname, '..', '.env'));

const args = parseArgs(process.argv.slice(2));
const email = normalizeEmail(args.email || process.env.ADMIN_EMAIL);
const password = String(args.password || process.env.ADMIN_PASSWORD || '');
const fullNameInput = args.name || process.env.ADMIN_NAME;
const fullName = String(fullNameInput || 'Margele Admin').trim();
const preservePassword =
  args['preserve-password'] === true ||
  String(process.env.ADMIN_PRESERVE_PASSWORD || '').toLowerCase() === 'true';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Point it at the target database.');
}

if (!email || !isEmail(email)) {
  throw new Error('Admin email is required. Use --email or ADMIN_EMAIL.');
}

if (!preservePassword && password.length < 12) {
  throw new Error('Admin password must be at least 12 characters. Use --password or ADMIN_PASSWORD.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: '-c search_path=catalog,app_auth,auth,commerce,content,public',
});

async function main() {
  const userColumns = await getColumns('users');
  const existing = await pool.query(
    'SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1',
    [email],
  );

  if (existing.rows[0]) {
    const updates = {
      full_name: fullNameInput ? fullName : undefined,
      password_hash: preservePassword ? undefined : await hashPassword(password),
      role: userColumns.has('role') ? 'admin' : undefined,
      email_verified_at: userColumns.has('email_verified_at') ? new Date() : undefined,
      requires_password_reset: userColumns.has('requires_password_reset') ? false : undefined,
      updated_at: userColumns.has('updated_at') ? new Date() : undefined,
    };

    await updateUser(existing.rows[0].id, updates);
    console.log(
      preservePassword
        ? `Updated admin user ${email} without changing the password.`
        : `Updated admin user ${email}.`,
    );
    return;
  }

  if (password.length < 12) {
    throw new Error(
      `No existing user found for ${email}. Provide ADMIN_PASSWORD or --password to create the admin account.`,
    );
  }

  const insertData = {
    full_name: fullName,
    email,
    password_hash: await hashPassword(password),
    role: userColumns.has('role') ? 'admin' : undefined,
    email_verified_at: userColumns.has('email_verified_at') ? new Date() : undefined,
    requires_password_reset: userColumns.has('requires_password_reset') ? false : undefined,
    created_at: userColumns.has('created_at') ? new Date() : undefined,
    updated_at: userColumns.has('updated_at') ? new Date() : undefined,
  };

  await insertUser(insertData);
  console.log(`Created admin user ${email}.`);
}

async function getColumns(tableName) {
  const result = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = ANY($1::text[]) AND table_name = $2
      ORDER BY array_position($1::text[], table_schema)
    `,
    [['catalog', 'app_auth', 'auth', 'commerce', 'content', 'public'], tableName],
  );

  return new Set(result.rows.map((row) => row.column_name));
}

async function insertUser(data) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  const columns = entries.map(([key]) => key);
  const values = entries.map(([, value]) => value);
  const params = values.map((_, index) => `$${index + 1}`);

  await pool.query(
    `INSERT INTO users (${columns.join(', ')}) VALUES (${params.join(', ')})`,
    values,
  );
}

async function updateUser(userId, updates) {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
  const assignments = entries.map(([key], index) => `${key} = $${index + 2}`);
  const values = entries.map(([, value]) => value);

  await pool.query(
    `UPDATE users SET ${assignments.join(', ')} WHERE id = $1`,
    [userId, ...values],
  );
}

async function hashPassword(value) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(value, salt);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

function scrypt(value, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(value, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (!arg.startsWith('--')) continue;

    const equalsIndex = arg.indexOf('=');
    if (equalsIndex !== -1) {
      parsed[arg.slice(2, equalsIndex)] = arg.slice(equalsIndex + 1);
      continue;
    }

    if (!rawArgs[index + 1] || rawArgs[index + 1].startsWith('--')) {
      parsed[arg.slice(2)] = true;
      continue;
    }

    parsed[arg.slice(2)] = rawArgs[index + 1];
    index += 1;
  }

  return parsed;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
