const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

loadEnv(path.join(__dirname, '..', '.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in backend/.env');
}

const dbSearchPath = 'catalog,auth,commerce,content,public';

const dumpPath = path.resolve(
  process.argv[2] || path.join(__dirname, '..', '..', 'margele_oc.mysql.sql'),
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: `-c search_path=${dbSearchPath}`,
});

async function main() {
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Legacy dump not found: ${dumpPath}`);
  }

  const dump = fs.readFileSync(dumpPath, 'utf8');
  const existingProductIds = await getExistingProductIds();
  const optionNames = new Map(
    parseTableRows(dump, 'option_description')
      .map(mapLegacyOptionDescription)
      .filter((option) => option.languageId === 1)
      .map((option) => [option.optionId, option.name]),
  );
  const optionValues = new Map(
    parseTableRows(dump, 'option_value_description')
      .map(mapLegacyOptionValueDescription)
      .filter((optionValue) => optionValue.languageId === 1)
      .map((optionValue) => [optionValue.optionValueId, optionValue]),
  );
  const optionValueImages = new Map(
    parseTableRows(dump, 'option_value')
      .map(mapLegacyOptionValue)
      .map((optionValue) => [optionValue.optionValueId, optionValue]),
  );

  const regularVariants = parseTableRows(dump, 'product_option_value')
    .map(mapLegacyProductOptionValue)
    .filter((variant) => existingProductIds.has(variant.productId))
    .map((variant) => ({
      ...variant,
      optionName: optionNames.get(variant.optionId) || `Optiune ${variant.optionId}`,
      optionValue: optionValues.get(variant.optionValueId)?.name || `Valoare ${variant.optionValueId}`,
      imageUrl:
        legacyImageUrl(variant.image) ||
        legacyImageUrl(optionValueImages.get(variant.optionValueId)?.image),
    }))
    .filter((variant) => variant.optionValue.trim());
  const advancedVariants = parseTableRows(dump, 'may_advanced_option_product_value')
    .map(mapLegacyAdvancedProductOptionValue)
    .filter((variant) => existingProductIds.has(variant.productId))
    .filter((variant) => !variant.hidden)
    .map((variant) => ({
      ...variant,
      optionName: optionNames.get(variant.optionId) || `Optiune ${variant.optionId}`,
      optionValue: optionValues.get(variant.optionValueId)?.name || `Valoare ${variant.optionValueId}`,
      imageUrl:
        legacyImageUrl(firstLegacyImage(variant.images)) ||
        legacyImageUrl(optionValueImages.get(variant.optionValueId)?.image),
    }))
    .filter((variant) => variant.optionValue.trim());
  const variants = [...regularVariants, ...advancedVariants];

  const productIds = Array.from(new Set(variants.map((variant) => variant.productId)));
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (productIds.length > 0) {
      await client.query('DELETE FROM product_option_values WHERE product_id = ANY($1::int[])', [
        productIds,
      ]);
      await client.query('DELETE FROM product_attributes WHERE product_id = ANY($1::int[])', [
        productIds,
      ]);
    }

    let insertedVariants = 0;
    const insertedAttributes = new Set();

    for (const variant of variants) {
      await client.query(
        `
          INSERT INTO product_option_values (
            product_id,
            option_name,
            option_value,
            legacy_option_id,
            legacy_option_value_id,
            combination_id,
            model,
            sku,
            quantity,
            price_delta,
            price_prefix,
            image_url,
            sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `,
        [
          variant.productId,
          variant.optionName,
          variant.optionValue,
          variant.optionId,
          variant.optionValueId,
          variant.combinationId || null,
          variant.model || null,
          variant.sku || null,
          variant.quantity,
          variant.priceDelta,
          variant.pricePrefix,
          variant.imageUrl,
          variant.sortOrder,
        ],
      );
      insertedVariants += 1;

      const attributeKey = `${variant.productId}:${variant.optionName}:${variant.optionValue}`;
      if (!insertedAttributes.has(attributeKey)) {
        await client.query(
          `
            INSERT INTO product_attributes (
              product_id,
              attribute_key,
              attribute_value,
              sort_order
            )
            VALUES ($1, $2, $3, $4)
          `,
          [variant.productId, variant.optionName, variant.optionValue, variant.sortOrder],
        );
        insertedAttributes.add(attributeKey);
      }
    }

    await client.query('COMMIT');
    console.log(`Imported ${insertedVariants} product option values.`);
    console.log(`Imported ${insertedAttributes.size} product attributes from options.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getExistingProductIds() {
  const result = await pool.query('SELECT id FROM products');
  return new Set(result.rows.map((row) => Number(row.id)));
}

function mapLegacyOptionDescription(row) {
  return {
    optionId: Number(row[0]),
    languageId: Number(row[1]),
    name: cleanText(row[2]),
  };
}

function mapLegacyOptionValueDescription(row) {
  return {
    optionValueId: Number(row[0]),
    languageId: Number(row[1]),
    optionId: Number(row[2]),
    name: cleanText(row[3]),
  };
}

function mapLegacyOptionValue(row) {
  return {
    optionValueId: Number(row[0]),
    optionId: Number(row[1]),
    image: cleanText(row[2]),
    sortOrder: Number(row[3] || 0),
  };
}

function mapLegacyProductOptionValue(row) {
  return {
    productId: Number(row[2]),
    optionId: Number(row[3]),
    optionValueId: Number(row[4]),
    quantity: Number(row[5] || 0),
    priceDelta: Number(row[7] || 0),
    pricePrefix: cleanPricePrefix(row[8]),
    image: cleanText(row[11]),
    sortOrder: Number(row[0] || 0),
  };
}

function mapLegacyAdvancedProductOptionValue(row) {
  return {
    productId: Number(row[1]),
    optionId: Number(row[2]),
    combinationId: cleanText(row[3]),
    optionValueId: Number(row[4]),
    model: cleanText(row[5]),
    sku: cleanText(row[6]),
    images: cleanText(row[13]),
    quantity: Number(row[24] || 0),
    priceDelta: Number(row[14] || 0),
    pricePrefix: cleanPricePrefix(row[15]),
    hidden: Number(row[23] || 0) === 1,
    sortOrder: Number(row[0] || 0),
  };
}

function cleanPricePrefix(value) {
  const prefix = cleanText(value);
  return prefix === '-' ? '-' : '+';
}

function legacyImageUrl(value) {
  const image = String(value || '').replace(/\\\//g, '/').replace(/^\/+/, '').trim();
  return image ? `/images/${image}` : null;
}

function firstLegacyImage(value) {
  if (!value) return '';

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed[0] || '' : '';
  } catch {
    return '';
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
  return String(value || '').replace(/\s+/g, ' ').trim();
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
