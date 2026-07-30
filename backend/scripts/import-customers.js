const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

loadEnv(path.join(__dirname, '..', '.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in backend/.env');
}

const dbSearchPath = 'catalog,app_auth,commerce,content,public';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dumpArg = args.find((arg) => !arg.startsWith('--'));
const dumpPath = path.resolve(dumpArg || path.join(__dirname, '..', '..', 'margele_oc.mysql.sql'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: `-c search_path=${dbSearchPath}`,
});

async function main() {
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Legacy dump not found: ${dumpPath}`);
  }

  const dump = fs.readFileSync(dumpPath, 'utf8');
  const countries = new Map(parseTableRows(dump, 'country').map(mapLegacyCountry));
  const zones = new Map(parseTableRows(dump, 'zone').map(mapLegacyZone));
  const addressesByCustomerId = groupBy(
    parseTableRows(dump, 'address').map((row) => mapLegacyAddress(row, countries, zones)),
    'customerId',
  );
  const dedupe = dedupeCustomers(parseTableRows(dump, 'customer').map(mapLegacyCustomer));
  const client = await pool.connect();
  const stats = {
    dryRun,
    customersRead: dedupe.total,
    customersPrepared: dedupe.customers.length,
    duplicateEmailsSkipped: dedupe.duplicateEmailCount,
    invalidEmailsSkipped: dedupe.invalidEmailCount,
    usersInserted: 0,
    usersUpdated: 0,
    addressesInserted: 0,
    addressesUpdated: 0,
    addressesSkipped: 0,
    conflicts: [],
  };

  try {
    await client.query('BEGIN');
    await assertImportColumns(client);

    for (const customer of dedupe.customers) {
      const userResult = await upsertUser(client, customer);
      stats[userResult.inserted ? 'usersInserted' : 'usersUpdated'] += 1;

      const customerAddresses = addressesByCustomerId.get(customer.legacyId) || [];
      for (const address of customerAddresses) {
        address.isDefault =
          address.legacyId === customer.defaultAddressId ||
          (!customer.defaultAddressId && customerAddresses.length === 1);

        if (!address.address1 || !address.city) {
          stats.addressesSkipped += 1;
          continue;
        }

        const addressResult = await upsertAddress(client, userResult.userId, customer, address);
        stats[addressResult.inserted ? 'addressesInserted' : 'addressesUpdated'] += 1;
      }
    }

    if (stats.conflicts.length > 0) {
      throw new Error(`Customer import blocked by ${stats.conflicts.length} legacy mapping conflict(s).`);
    }

    await resetSequences(client);

    if (dryRun) {
      await client.query('ROLLBACK');
    } else {
      await client.query('COMMIT');
    }

    printSummary(stats);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    printSummary(stats);
    throw error;
  } finally {
    client.release();
  }
}

async function assertImportColumns(client) {
  const userColumns = await getColumns(client, 'users');
  const addressColumns = await getColumns(client, 'addresses');
  const requiredUserColumns = ['legacy_id', 'requires_password_reset'];
  const requiredAddressColumns = ['legacy_id'];
  const missing = [
    ...requiredUserColumns.filter((column) => !userColumns.has(column)).map((column) => `users.${column}`),
    ...requiredAddressColumns.filter((column) => !addressColumns.has(column)).map((column) => `addresses.${column}`),
  ];

  if (missing.length > 0) {
    throw new Error(`Missing import columns: ${missing.join(', ')}. Run npm run db:migrate first.`);
  }
}

async function getColumns(client, tableName) {
  const result = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
        AND table_schema = ANY (current_schemas(false))
    `,
    [tableName],
  );
  return new Set(result.rows.map((row) => row.column_name));
}

async function upsertUser(client, customer) {
  const existingByLegacyId = await client.query(
    'SELECT id, legacy_id FROM users WHERE legacy_id = $1 LIMIT 1',
    [customer.legacyId],
  );

  if (existingByLegacyId.rows[0]) {
    await updateImportedUser(client, existingByLegacyId.rows[0].id, customer);
    return { inserted: false, userId: existingByLegacyId.rows[0].id };
  }

  const existingByEmail = await client.query(
    'SELECT id, legacy_id FROM users WHERE lower(email) = lower($1) LIMIT 1',
    [customer.email],
  );

  if (existingByEmail.rows[0]) {
    const existingLegacyId = existingByEmail.rows[0].legacy_id;
    if (existingLegacyId && Number(existingLegacyId) !== customer.legacyId) {
      throw new Error(
        `Customer import blocked: email match has conflicting legacy IDs ${existingLegacyId} and ${customer.legacyId}.`,
      );
    }

    await updateImportedUser(client, existingByEmail.rows[0].id, customer);
    return { inserted: false, userId: existingByEmail.rows[0].id };
  }

  const result = await client.query(
    `
      INSERT INTO users (
        legacy_id,
        full_name,
        email,
        password_hash,
        phone,
        newsletter_subscribed,
        role,
        requires_password_reset,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, 'legacy$disabled', $4, $5, 'customer', true, COALESCE($6::timestamp, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
      RETURNING id
    `,
    [
      customer.legacyId,
      customer.fullName,
      customer.email,
      customer.phone,
      customer.newsletterSubscribed,
      customer.dateAdded,
    ],
  );
  return { inserted: true, userId: result.rows[0].id };
}

async function updateImportedUser(client, userId, customer) {
  await client.query(
    `
      UPDATE users
      SET
        legacy_id = COALESCE(legacy_id, $2),
        full_name = COALESCE(NULLIF(full_name, ''), $3),
        phone = COALESCE(NULLIF(phone, ''), $4),
        newsletter_subscribed = newsletter_subscribed OR $5,
        requires_password_reset = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [userId, customer.legacyId, customer.fullName, customer.phone, customer.newsletterSubscribed],
  );
}

async function upsertAddress(client, userId, customer, address) {
  const values = [
    userId,
    address.legacyId,
    address.firstName || customer.firstName || '-',
    address.lastName || customer.lastName || '-',
    address.company,
    address.country || 'Romania',
    address.address1,
    address.address2,
    address.postcode,
    address.city,
    address.zone,
    customer.phone,
    address.isDefault,
  ];

  const existing = await client.query(
    'SELECT id FROM addresses WHERE legacy_id = $1 LIMIT 1',
    [address.legacyId],
  );

  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE addresses
        SET
          user_id = $2,
          prenume = $3,
          nume = $4,
          companie = $5,
          tara = $6,
          adresa1 = $7,
          adresa2 = $8,
          cod_postal = $9,
          oras = $10,
          judet = $11,
          telefon = $12,
          implicit_facturare = $13,
          implicit_livrare = $13,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [existing.rows[0].id, ...values.filter((_, index) => index !== 1)],
    );
    return { inserted: false };
  }

  await client.query(
    `
      INSERT INTO addresses (
        user_id,
        legacy_id,
        apelativ,
        prenume,
        nume,
        companie,
        tara,
        adresa1,
        adresa2,
        cod_postal,
        oras,
        judet,
        telefon,
        implicit_facturare,
        implicit_livrare,
        created_at,
        updated_at
      )
      VALUES ($1, $2, 'Dl.', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    values,
  );
  return { inserted: true };
}

async function resetSequences(client) {
  await client.query(`
    SELECT setval(
      pg_get_serial_sequence('users', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 1),
      true
    )
  `);
  await client.query(`
    SELECT setval(
      pg_get_serial_sequence('addresses', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 1) FROM addresses), 1),
      true
    )
  `);
}

function dedupeCustomers(customers) {
  const byEmail = new Map();
  let duplicateEmailCount = 0;
  let invalidEmailCount = 0;

  for (const customer of customers) {
    if (!customer.email || !isEmail(customer.email)) {
      invalidEmailCount += 1;
      continue;
    }

    const existing = byEmail.get(customer.email);
    if (!existing) {
      byEmail.set(customer.email, customer);
      continue;
    }

    duplicateEmailCount += 1;
    byEmail.set(customer.email, chooseCanonicalCustomer(existing, customer));
  }

  return {
    total: customers.length,
    customers: [...byEmail.values()].sort((left, right) => left.legacyId - right.legacyId),
    duplicateEmailCount,
    invalidEmailCount,
  };
}

function chooseCanonicalCustomer(left, right) {
  if (left.isActive !== right.isActive) return left.isActive ? left : right;

  const leftDate = Date.parse(left.dateAdded || '') || 0;
  const rightDate = Date.parse(right.dateAdded || '') || 0;
  if (leftDate !== rightDate) return leftDate > rightDate ? left : right;

  return left.legacyId > right.legacyId ? left : right;
}

function groupBy(items, key) {
  const grouped = new Map();
  for (const item of items) {
    const groupKey = item[key];
    const group = grouped.get(groupKey) || [];
    group.push(item);
    grouped.set(groupKey, group);
  }
  return grouped;
}

function mapLegacyCustomer(row) {
  const firstName = cleanText(row[4]);
  const lastName = cleanText(row[5]);
  return {
    legacyId: Number(row[0]),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(' ') || 'Client importat',
    email: normalizeEmail(row[6]),
    phone: cleanOptionalText(row[7]),
    newsletterSubscribed: row[13] === 1 || row[13] === '1',
    defaultAddressId: normalizeInteger(row[14]),
    isActive: row[17] === 1 || row[17] === '1',
    dateAdded: row[21] || null,
  };
}

function mapLegacyAddress(row, countries, zones) {
  const countryId = normalizeInteger(row[9]);
  const zoneId = normalizeInteger(row[10]);
  return {
    legacyId: Number(row[0]),
    customerId: Number(row[1]),
    firstName: cleanText(row[2]),
    lastName: cleanText(row[3]),
    company: cleanOptionalText(row[4]),
    address1: cleanText(row[5]),
    address2: cleanOptionalText(row[6]),
    city: cleanText(row[7]),
    postcode: cleanOptionalText(row[8]),
    country: countries.get(countryId) || 'Romania',
    zone: zones.get(zoneId) || null,
    isDefault: false,
  };
}

function mapLegacyCountry(row) {
  return [Number(row[0]), cleanText(row[1])];
}

function mapLegacyZone(row) {
  return [Number(row[0]), cleanText(row[2])];
}

function parseTableRows(sql, tableName) {
  const rows = [];
  const marker = `INSERT INTO \`${tableName}\` VALUES`;
  let searchIndex = 0;

  while (searchIndex < sql.length) {
    const insertIndex = sql.indexOf(marker, searchIndex);
    if (insertIndex === -1) break;

    const valuesStart = insertIndex + marker.length;
    const valuesEnd = findStatementEnd(sql, valuesStart);
    if (valuesEnd === -1) {
      throw new Error(`Could not find end of INSERT statement for ${tableName}`);
    }

    rows.push(...parseValues(sql.slice(valuesStart, valuesEnd)));
    searchIndex = valuesEnd + 1;
  }

  return rows;
}

function findStatementEnd(sql, startIndex) {
  let inString = false;
  let escapeNext = false;

  for (let index = startIndex; index < sql.length; index += 1) {
    const char = sql[index];

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
      } else if (char === '\\') {
        escapeNext = true;
      } else if (char === "'") {
        inString = false;
      }
      continue;
    }

    if (char === "'") {
      inString = true;
      continue;
    }

    if (char === ';') {
      return index;
    }
  }

  return -1;
}

function parseValues(input) {
  const rows = [];
  let row = null;
  let value = '';
  let inString = false;
  let escapeNext = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (inString) {
      if (escapeNext) {
        value += decodeEscapedChar(char);
        escapeNext = false;
      } else if (char === '\\') {
        escapeNext = true;
      } else if (char === "'") {
        inString = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === "'") {
      inString = true;
      continue;
    }

    if (char === '(' && row === null) {
      row = [];
      value = '';
      continue;
    }

    if (char === ',' && row !== null) {
      row.push(normalizeSqlValue(value));
      value = '';
      continue;
    }

    if (char === ')' && row !== null) {
      row.push(normalizeSqlValue(value));
      rows.push(row);
      row = null;
      value = '';
      continue;
    }

    if (row !== null) {
      value += char;
    }
  }

  return rows;
}

function normalizeSqlValue(value) {
  const trimmed = value.trim();
  if (trimmed.toUpperCase() === 'NULL') return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function decodeEscapedChar(char) {
  const map = {
    0: '\0',
    b: '\b',
    n: '\n',
    r: '\r',
    t: '\t',
    Z: '\x1a',
  };

  return map[char] ?? char;
}

function normalizeInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

function cleanOptionalText(value) {
  const text = cleanText(value);
  return text || null;
}

function cleanText(value) {
  return decodeHtml(String(value || '')).replace(/\s+/g, ' ').trim();
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

function printSummary(stats) {
  console.log(
    [
      `Customer import ${stats.dryRun ? 'dry run' : 'complete'}`,
      `customers_read=${stats.customersRead}`,
      `customers_prepared=${stats.customersPrepared}`,
      `duplicate_emails_skipped=${stats.duplicateEmailsSkipped}`,
      `invalid_emails_skipped=${stats.invalidEmailsSkipped}`,
      `users_inserted=${stats.usersInserted}`,
      `users_updated=${stats.usersUpdated}`,
      `addresses_inserted=${stats.addressesInserted}`,
      `addresses_updated=${stats.addressesUpdated}`,
      `addresses_skipped=${stats.addressesSkipped}`,
    ].join('\n'),
  );
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
