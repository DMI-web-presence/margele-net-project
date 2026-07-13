const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

loadEnv(path.join(__dirname, '..', '.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in backend/.env');
}

const dumpPath = path.resolve(
  process.argv[2] || path.join(__dirname, '..', '..', 'margele_oc.mysql.sql'),
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Legacy dump not found: ${dumpPath}`);
  }

  const dump = fs.readFileSync(dumpPath, 'utf8');
  const categories = parseTableRows(dump, 'category').map(mapLegacyCategory);
  const descriptions = new Map(
    parseTableRows(dump, 'category_description')
      .map(mapLegacyCategoryDescription)
      .filter((description) => description.languageId === 1)
      .map((description) => [description.categoryId, description]),
  );
  const seoUrls = new Map(
    parseTableRows(dump, 'seo_url')
      .map(mapLegacySeoUrl)
      .filter((seoUrl) => seoUrl.languageId === 1 && seoUrl.query.startsWith('category_id='))
      .map((seoUrl) => [Number(seoUrl.query.replace('category_id=', '')), seoUrl.keyword]),
  );

  const legacyCategories = categories
    .map((category) => {
      const description = descriptions.get(category.id);
      if (!description?.name) return null;

      return {
        ...category,
        name: description.name,
        description: stripHtml(decodeHtml(description.description)),
        slug: normalizeSlug(seoUrls.get(category.id) || description.name, category.id),
      };
    })
    .filter(Boolean);

  const uniqueCategories = ensureUniqueSlugs(legacyCategories);
  const importedCategoryIds = new Set(uniqueCategories.map((category) => category.id));
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const category of uniqueCategories) {
      await client.query(
        `
          INSERT INTO categories (
            id,
            parent_id,
            name,
            slug,
            description,
            sort_order,
            is_active,
            created_at,
            updated_at
          )
          VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE
          SET name = EXCLUDED.name,
              slug = EXCLUDED.slug,
              description = EXCLUDED.description,
              sort_order = EXCLUDED.sort_order,
              is_active = EXCLUDED.is_active,
              updated_at = EXCLUDED.updated_at
        `,
        [
          category.id,
          category.name,
          category.slug,
          category.description,
          category.sortOrder,
          category.isActive,
          category.dateAdded,
          category.dateModified,
        ],
      );
    }

    for (const category of uniqueCategories) {
      await client.query(
        `
          UPDATE categories
          SET parent_id = $2
          WHERE id = $1
        `,
        [
          category.id,
          category.parentId && importedCategoryIds.has(category.parentId) ? category.parentId : null,
        ],
      );
    }

    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('categories', 'id'),
        GREATEST((SELECT COALESCE(MAX(id), 1) FROM categories), 1),
        true
      )
    `);

    await client.query('COMMIT');
    console.log(`Imported ${uniqueCategories.length} categories from ${dumpPath}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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

function mapLegacyCategory(row) {
  return {
    id: Number(row[0]),
    parentId: Number(row[2] || 0),
    sortOrder: Number(row[5] || 0),
    isActive: row[6] === 1 || row[6] === '1',
    dateAdded: row[7] || null,
    dateModified: row[8] || null,
  };
}

function mapLegacyCategoryDescription(row) {
  return {
    categoryId: Number(row[0]),
    languageId: Number(row[1]),
    name: cleanText(row[2]),
    description: row[3] || '',
  };
}

function mapLegacySeoUrl(row) {
  return {
    languageId: Number(row[2]),
    query: String(row[3] || ''),
    keyword: String(row[4] || ''),
  };
}

function ensureUniqueSlugs(categories) {
  const seen = new Map();

  return categories.map((category) => {
    const baseSlug = category.slug || `category-${category.id}`;
    const seenCount = seen.get(baseSlug) || 0;
    seen.set(baseSlug, seenCount + 1);

    return {
      ...category,
      slug: seenCount === 0 ? baseSlug : `${baseSlug}-${category.id}`,
    };
  });
}

function normalizeSlug(value, fallbackId) {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\.html$/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  return slug || `category-${fallbackId}`;
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

function cleanText(value) {
  return decodeHtml(String(value || '')).replace(/\s+/g, ' ').trim();
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
