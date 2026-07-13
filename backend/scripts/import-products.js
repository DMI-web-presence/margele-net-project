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
  const products = parseTableRows(dump, 'product').map(mapLegacyProduct);
  const descriptions = new Map(
    parseTableRows(dump, 'product_description')
      .map(mapLegacyProductDescription)
      .filter((description) => description.languageId === 1)
      .map((description) => [description.productId, description]),
  );
  const seoUrls = new Map(
    parseTableRows(dump, 'seo_url')
      .map(mapLegacySeoUrl)
      .filter((seoUrl) => seoUrl.languageId === 1 && seoUrl.query.startsWith('product_id='))
      .map((seoUrl) => [Number(seoUrl.query.replace('product_id=', '')), seoUrl.keyword]),
  );
  const productCategories = groupProductCategories(parseTableRows(dump, 'product_to_category'));
  const existingCategoryIds = await getExistingCategoryIds();

  const legacyProducts = products
    .map((product) => {
      const description = descriptions.get(product.id);
      if (!description?.name) return null;

      return {
        ...product,
        name: description.name,
        description: stripHtml(decodeHtml(description.description)),
        shortDescription: cleanText(description.metaDescription || description.description).slice(0, 500),
        slug: normalizeSlug(
          seoUrls.get(product.id) || product.sku || product.model || description.name,
          product.id,
        ),
        categoryId: chooseCategoryId(productCategories.get(product.id) || [], existingCategoryIds),
      };
    })
    .filter(Boolean);

  const uniqueProducts = ensureUniqueSkus(ensureUniqueSlugs(legacyProducts));
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const product of uniqueProducts) {
      await client.query(
        `
          INSERT INTO products (
            id,
            category_id,
            name,
            slug,
            description,
            short_description,
            price,
            currency,
            sku,
            stock_quantity,
            status,
            image_url,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'RON', $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO UPDATE
          SET category_id = EXCLUDED.category_id,
              name = EXCLUDED.name,
              slug = EXCLUDED.slug,
              description = EXCLUDED.description,
              short_description = EXCLUDED.short_description,
              price = EXCLUDED.price,
              currency = EXCLUDED.currency,
              sku = EXCLUDED.sku,
              stock_quantity = EXCLUDED.stock_quantity,
              status = EXCLUDED.status,
              image_url = EXCLUDED.image_url,
              updated_at = EXCLUDED.updated_at
        `,
        [
          product.id,
          product.categoryId,
          product.name,
          product.slug,
          product.description,
          product.shortDescription,
          product.price,
          product.sku,
          product.quantity,
          product.isActive ? 'active' : 'draft',
          legacyImageUrl(product.image),
          product.dateAdded,
          product.dateModified,
        ],
      );
    }

    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('products', 'id'),
        GREATEST((SELECT COALESCE(MAX(id), 1) FROM products), 1),
        true
      )
    `);

    await client.query('COMMIT');
    console.log(`Imported ${uniqueProducts.length} products from ${dumpPath}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getExistingCategoryIds() {
  const result = await pool.query('SELECT id FROM categories');
  return new Set(result.rows.map((row) => Number(row.id)));
}

function groupProductCategories(rows) {
  const categoriesByProductId = new Map();

  for (const row of rows) {
    const productId = Number(row[0]);
    const categoryId = Number(row[1]);
    if (!categoriesByProductId.has(productId)) {
      categoriesByProductId.set(productId, []);
    }
    categoriesByProductId.get(productId).push(categoryId);
  }

  return categoriesByProductId;
}

function chooseCategoryId(categoryIds, existingCategoryIds) {
  const existingIds = categoryIds.filter((categoryId) => existingCategoryIds.has(categoryId));
  if (existingIds.length === 0) return null;
  return existingIds[existingIds.length - 1];
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

function mapLegacyProduct(row) {
  return {
    id: Number(row[0]),
    model: cleanText(row[1]),
    sku: cleanText(row[2]),
    quantity: Number(row[9] || 0),
    image: cleanText(row[11]),
    price: Number(row[14] || 0),
    sortOrder: Number(row[26] || 0),
    isActive: row[27] === 1 || row[27] === '1',
    dateAdded: row[29] || null,
    dateModified: row[30] || null,
  };
}

function mapLegacyProductDescription(row) {
  return {
    productId: Number(row[0]),
    languageId: Number(row[1]),
    name: cleanText(row[2]),
    description: row[3] || '',
    tag: row[4] || '',
    metaTitle: cleanText(row[5]),
    metaDescription: row[6] || '',
  };
}

function mapLegacySeoUrl(row) {
  return {
    languageId: Number(row[2]),
    query: String(row[3] || ''),
    keyword: String(row[4] || ''),
  };
}

function ensureUniqueSlugs(products) {
  const seen = new Map();

  return products.map((product) => {
    const baseSlug = product.slug || `product-${product.id}`;
    const seenCount = seen.get(baseSlug) || 0;
    seen.set(baseSlug, seenCount + 1);

    return {
      ...product,
      slug: seenCount === 0 ? baseSlug : `${baseSlug}-${product.id}`,
    };
  });
}

function ensureUniqueSkus(products) {
  const seen = new Map();

  return products.map((product) => {
    const baseSku = cleanOptionalText(product.sku || product.model);
    if (!baseSku) {
      return {
        ...product,
        sku: null,
      };
    }

    const seenCount = seen.get(baseSku) || 0;
    seen.set(baseSku, seenCount + 1);

    return {
      ...product,
      sku: seenCount === 0 ? baseSku : `${baseSku}-${product.id}`,
    };
  });
}

function legacyImageUrl(value) {
  const image = String(value || '').replace(/^\/+/, '').trim();
  return image ? `/legacy-images/${image}` : null;
}

function cleanOptionalText(value) {
  const text = cleanText(value);
  return text || null;
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

  return slug || `product-${fallbackId}`;
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
