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
const catalogRoot = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'images', 'catalog');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: `-c search_path=${dbSearchPath}`,
});

async function main() {
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Legacy dump not found: ${dumpPath}`);
  }

  if (!fs.existsSync(catalogRoot)) {
    throw new Error(`Catalog image folder not found: ${catalogRoot}`);
  }

  const dump = fs.readFileSync(dumpPath, 'utf8');
  const existingProductIds = await getExistingProductIds();
  const products = parseTableRows(dump, 'product').map(mapLegacyProduct);
  const galleryRows = parseTableRows(dump, 'product_image').map(mapLegacyProductImage);
  const imagesByProductId = new Map();
  const missingFiles = [];

  for (const product of products) {
    if (!existingProductIds.has(product.id)) continue;

    const imageUrl = imageUrlFromLegacyPath(product.image);
    if (!imageUrl) continue;

    addImage(imagesByProductId, product.id, {
      imageUrl,
      sortOrder: 0,
      isPrimary: true,
    });

    if (!localImageExists(product.image)) {
      missingFiles.push(product.image);
    }
  }

  for (const image of galleryRows) {
    if (!existingProductIds.has(image.productId)) continue;

    const imageUrl = imageUrlFromLegacyPath(image.image);
    if (!imageUrl) continue;

    addImage(imagesByProductId, image.productId, {
      imageUrl,
      sortOrder: image.sortOrder + 1,
      isPrimary: false,
    });

    if (!localImageExists(image.image)) {
      missingFiles.push(image.image);
    }
  }

  const productIds = Array.from(imagesByProductId.keys());
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (productIds.length > 0) {
      await client.query('DELETE FROM product_images WHERE product_id = ANY($1::int[])', [
        productIds,
      ]);
    }

    let insertedImages = 0;
    for (const productId of productIds) {
      const images = imagesByProductId.get(productId) || [];

      for (const image of images) {
        await client.query(
          `
            INSERT INTO product_images (
              product_id,
              image_url,
              alt_text,
              sort_order,
              is_primary
            )
            VALUES ($1, $2, NULL, $3, $4)
          `,
          [productId, image.imageUrl, image.sortOrder, image.isPrimary],
        );
        insertedImages += 1;
      }

      const primaryImage = images.find((image) => image.isPrimary) || images[0];
      if (primaryImage) {
        await client.query('UPDATE products SET image_url = $2 WHERE id = $1', [
          productId,
          primaryImage.imageUrl,
        ]);
      }
    }

    await client.query('COMMIT');
    console.log(`Imported ${insertedImages} product images for ${productIds.length} products.`);
    console.log(`Missing local image files: ${new Set(missingFiles).size}`);
    for (const missingFile of Array.from(new Set(missingFiles)).slice(0, 20)) {
      console.log(`- ${missingFile}`);
    }
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

function addImage(imagesByProductId, productId, image) {
  if (!imagesByProductId.has(productId)) {
    imagesByProductId.set(productId, []);
  }

  const images = imagesByProductId.get(productId);
  if (images.some((existingImage) => existingImage.imageUrl === image.imageUrl)) return;

  images.push(image);
  images.sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
    return left.sortOrder - right.sortOrder;
  });
}

function mapLegacyProduct(row) {
  return {
    id: Number(row[0]),
    image: cleanText(row[11]),
  };
}

function mapLegacyProductImage(row) {
  return {
    productId: Number(row[1]),
    image: cleanText(row[2]),
    sortOrder: Number(row[3] || 0),
  };
}

function imageUrlFromLegacyPath(value) {
  const image = cleanImagePath(value);
  return image ? `/images/${image}` : null;
}

function localImageExists(value) {
  const image = cleanImagePath(value);
  if (!image) return true;

  const relativePath = image.replace(/^catalog\//i, '');
  return fs.existsSync(path.join(catalogRoot, ...relativePath.split('/')));
}

function cleanImagePath(value) {
  return String(value || '')
    .replace(/\\\//g, '/')
    .replace(/^\/+/, '')
    .trim();
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
