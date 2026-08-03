const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

loadEnv(path.join(__dirname, '..', '.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in backend/.env');
}

const dbSearchPath = 'app_auth,catalog,commerce,content,public,auth';
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const dumpArg = args.find((arg) => !arg.startsWith('--'));
const dumpPath = path.resolve(dumpArg || path.join(__dirname, '..', '..', 'margele_oc.mysql.sql'));
const catalogRoot = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'images', 'catalog');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: `-c search_path=${dbSearchPath}`,
});

async function main() {
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Legacy dump not found: ${dumpPath}`);
  }

  const dump = fs.readFileSync(dumpPath, 'utf8');
  const source = buildSourceReport(dump);
  const postgres = await buildPostgresReport();
  const report = buildReport(source, postgres);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printReport(report);
}

function buildSourceReport(dump) {
  const categoryDescriptions = new Map(
    parseTableRows(dump, 'category_description')
      .map(mapCategoryDescription)
      .filter((description) => description.languageId === 1)
      .map((description) => [description.categoryId, description]),
  );
  const productDescriptions = new Map(
    parseTableRows(dump, 'product_description')
      .map(mapProductDescription)
      .filter((description) => description.languageId === 1)
      .map((description) => [description.productId, description]),
  );
  const products = parseTableRows(dump, 'product').map(mapProduct);
  const categories = parseTableRows(dump, 'category').map(mapCategory);
  const productImages = parseTableRows(dump, 'product_image').map(mapProductImage);
  const customers = parseTableRows(dump, 'customer').map(mapCustomer);
  const addresses = parseTableRows(dump, 'address').map(mapAddress);
  const orders = parseTableRows(dump, 'order').map(mapOrder).filter((order) => order.id);
  const orderProducts = parseTableRows(dump, 'order_product').map(mapOrderProduct);
  const orderTotalsByOrderId = groupBy(parseTableRows(dump, 'order_total').map(mapOrderTotal), 'orderId');
  const orderProductsByOrderId = groupBy(orderProducts, 'orderId');

  const importableCategories = categories.filter((category) => categoryDescriptions.get(category.id)?.name);
  const skippedCategories = categories
    .filter((category) => !categoryDescriptions.get(category.id)?.name)
    .map((category) => ({ legacyId: category.id, reason: 'missing_ro_description_name' }));

  const importableProducts = products.filter((product) => productDescriptions.get(product.id)?.name);
  const importableProductIds = new Set(importableProducts.map((product) => product.id));
  const skippedProducts = products
    .filter((product) => !productDescriptions.get(product.id)?.name)
    .map((product) => ({ legacyId: product.id, reason: 'missing_ro_description_name' }));

  const imageCandidatesByProductId = buildImageCandidates(products, productImages, importableProductIds);
  const imageCandidates = [...imageCandidatesByProductId.values()].flat();
  const missingImageFiles = unique(
    imageCandidates
      .filter((image) => !localImageExists(image.sourcePath))
      .map((image) => image.sourcePath)
      .filter(Boolean),
  );
  const skippedImageRows = [
    ...products
      .filter((product) => cleanImagePath(product.image) && !importableProductIds.has(product.id))
      .map((product) => ({ legacyId: product.id, reason: 'product_not_importable', sourcePath: product.image })),
    ...productImages
      .filter((image) => cleanImagePath(image.image) && !importableProductIds.has(image.productId))
      .map((image) => ({ legacyId: image.productId, reason: 'product_not_importable', sourcePath: image.image })),
  ];

  const customerDedupe = dedupeCustomers(customers);
  const registeredCustomerEmails = new Set(customerDedupe.customers.map((customer) => customer.email).filter(Boolean));
  const guestOrderEmails = unique(
    orders
      .map((order) => order.email)
      .filter((email) => email && isEmail(email) && !registeredCustomerEmails.has(email)),
  );
  const importableCustomerIds = new Set(customerDedupe.customers.map((customer) => customer.id));
  const addressesByCustomerId = groupBy(addresses, 'customerId');
  const skippedAddresses = [];
  for (const customer of customerDedupe.customers) {
    for (const address of addressesByCustomerId.get(customer.id) || []) {
      if (!address.address1 || !address.city) {
        skippedAddresses.push({ legacyId: address.id, customerId: customer.id, reason: 'missing_address_or_city' });
      }
    }
  }
  for (const address of addresses) {
    if (!importableCustomerIds.has(address.customerId)) {
      skippedAddresses.push({ legacyId: address.id, customerId: address.customerId, reason: 'customer_not_imported' });
    }
  }

  const orderTotalMismatches = [];
  const ordersWithoutItems = [];
  for (const order of orders) {
    const productsForOrder = orderProductsByOrderId.get(order.id) || [];
    if (productsForOrder.length === 0) {
      ordersWithoutItems.push({ legacyId: order.id, reason: 'no_order_items' });
    }

    const totalRow = (orderTotalsByOrderId.get(order.id) || []).find((row) => row.code === 'total');
    const sourceTotal = roundMoney(totalRow?.value ?? order.total);
    const orderTotal = roundMoney(order.total);
    if (Math.abs(sourceTotal - orderTotal) > 0.01) {
      orderTotalMismatches.push({
        legacyId: order.id,
        reason: 'order_total_mismatch',
        sourceTotal,
        orderTotal,
      });
    }
  }

  return {
    dumpPath,
    catalogRoot,
    categories: {
      sourceCount: categories.length,
      importableCount: importableCategories.length,
      skipped: skippedCategories,
    },
    products: {
      sourceCount: products.length,
      importableCount: importableProducts.length,
      skipped: skippedProducts,
    },
    images: {
      sourceCount: imageCandidates.length,
      productsWithImages: imageCandidatesByProductId.size,
      missingFileCount: missingImageFiles.length,
      missingFiles: missingImageFiles,
      skippedRows: skippedImageRows,
    },
    customers: {
      sourceCount: customers.length,
      importableCount: customerDedupe.customers.length,
      sourceIdentityCount: customerDedupe.customers.length + guestOrderEmails.length,
      legacyGuestIdentityCount: guestOrderEmails.length,
      duplicateEmailCount: customerDedupe.duplicateEmailCount,
      invalidEmailCount: customerDedupe.invalidEmailCount,
      skipped: customerDedupe.skipped,
    },
    addresses: {
      sourceCount: addresses.length,
      skipped: skippedAddresses,
    },
    orders: {
      sourceCount: orders.length,
      orderItemCount: orderProducts.length,
      ordersWithoutItems,
      totalMismatches: orderTotalMismatches,
    },
  };
}

async function buildPostgresReport() {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM categories) AS category_count,
      (SELECT COUNT(*)::int FROM products) AS product_count,
      (SELECT COUNT(*)::int FROM product_images) AS product_image_count,
      (SELECT COUNT(DISTINCT product_id)::int FROM product_images) AS products_with_gallery_images,
      (SELECT COUNT(*)::int FROM products WHERE NULLIF(BTRIM(COALESCE(image_url, '')), '') IS NULL) AS products_missing_primary_image,
      (SELECT COUNT(*)::int FROM users WHERE COALESCE(role, 'customer') <> 'admin') AS customer_count,
      (
        SELECT COUNT(DISTINCT lower(o.legacy_customer_email))::int
        FROM orders o
        WHERE o.user_id IS NULL
          AND o.legacy_id IS NOT NULL
          AND NULLIF(BTRIM(o.legacy_customer_email), '') IS NOT NULL
      ) AS legacy_guest_customer_count,
      (SELECT COUNT(*)::int FROM addresses) AS address_count,
      (SELECT COUNT(*)::int FROM orders WHERE legacy_id IS NOT NULL) AS legacy_order_count,
      (SELECT COUNT(*)::int FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.legacy_id IS NOT NULL) AS legacy_order_item_count,
      (SELECT COUNT(*)::int FROM orders WHERE legacy_id IS NOT NULL AND user_id IS NOT NULL) AS linked_legacy_order_count,
      (SELECT COUNT(*)::int FROM orders WHERE legacy_id IS NOT NULL AND user_id IS NULL) AS guest_legacy_order_count
  `);

  return result.rows[0];
}

function buildReport(source, postgres) {
  return {
    generatedAt: new Date().toISOString(),
    dumpPath: source.dumpPath,
    catalogRoot: source.catalogRoot,
    counts: {
      products: {
        source: source.products.importableCount,
        sourceRaw: source.products.sourceCount,
        postgres: postgres.product_count,
        difference: postgres.product_count - source.products.importableCount,
      },
      categories: {
        source: source.categories.importableCount,
        sourceRaw: source.categories.sourceCount,
        postgres: postgres.category_count,
        difference: postgres.category_count - source.categories.importableCount,
      },
      images: {
        source: source.images.sourceCount,
        postgres: postgres.product_image_count,
        difference: postgres.product_image_count - source.images.sourceCount,
        missingLocalFiles: source.images.missingFileCount,
        productsMissingPrimaryImage: postgres.products_missing_primary_image,
      },
      customers: {
        source: source.customers.importableCount,
        sourceRaw: source.customers.sourceCount,
        postgres: postgres.customer_count,
        difference: postgres.customer_count - source.customers.importableCount,
      },
      customerIdentities: {
        source: source.customers.sourceIdentityCount,
        sourceRegistered: source.customers.importableCount,
        sourceLegacyGuests: source.customers.legacyGuestIdentityCount,
        postgres: postgres.customer_count + postgres.legacy_guest_customer_count,
        postgresRegistered: postgres.customer_count,
        postgresLegacyGuests: postgres.legacy_guest_customer_count,
        difference: postgres.customer_count + postgres.legacy_guest_customer_count - source.customers.sourceIdentityCount,
      },
      orders: {
        source: source.orders.sourceCount,
        postgres: postgres.legacy_order_count,
        difference: postgres.legacy_order_count - source.orders.sourceCount,
        linkedToUsers: postgres.linked_legacy_order_count,
        guestOrders: postgres.guest_legacy_order_count,
      },
      orderItems: {
        source: source.orders.orderItemCount,
        postgres: postgres.legacy_order_item_count,
        difference: postgres.legacy_order_item_count - source.orders.orderItemCount,
      },
      addresses: {
        sourceRaw: source.addresses.sourceCount,
        postgres: postgres.address_count,
      },
    },
    skippedRows: {
      products: summarizeSkipped(source.products.skipped),
      categories: summarizeSkipped(source.categories.skipped),
      customers: summarizeSkipped(source.customers.skipped),
      addresses: summarizeSkipped(source.addresses.skipped),
      images: summarizeSkipped(source.images.skippedRows),
      orders: summarizeSkipped([...source.orders.ordersWithoutItems, ...source.orders.totalMismatches]),
    },
    samples: {
      missingImageFiles: source.images.missingFiles.slice(0, 20),
      skippedProducts: source.products.skipped.slice(0, 20),
      skippedCustomers: source.customers.skipped.slice(0, 20),
      skippedAddresses: source.addresses.skipped.slice(0, 20),
      orderIssues: [...source.orders.ordersWithoutItems, ...source.orders.totalMismatches].slice(0, 20),
    },
  };
}

function printReport(report) {
  console.log('Migration validation report');
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Dump: ${report.dumpPath}`);
  console.log('');
  printCount('Products', report.counts.products);
  printCount('Categories', report.counts.categories);
  printCount('Images', report.counts.images);
  console.log(`  missing local image files: ${report.counts.images.missingLocalFiles}`);
  console.log(`  products missing primary image: ${report.counts.images.productsMissingPrimaryImage}`);
  printCount('Customers', report.counts.customers);
  printCount('Customer identities', report.counts.customerIdentities);
  console.log(`  source registered: ${report.counts.customerIdentities.sourceRegistered}`);
  console.log(`  source legacy guests: ${report.counts.customerIdentities.sourceLegacyGuests}`);
  console.log(`  postgres registered: ${report.counts.customerIdentities.postgresRegistered}`);
  console.log(`  postgres legacy guests: ${report.counts.customerIdentities.postgresLegacyGuests}`);
  printCount('Orders', report.counts.orders);
  console.log(`  linked to users: ${report.counts.orders.linkedToUsers}`);
  console.log(`  guest orders: ${report.counts.orders.guestOrders}`);
  printCount('Order items', report.counts.orderItems);
  console.log(`Addresses: source raw ${report.counts.addresses.sourceRaw} / postgres ${report.counts.addresses.postgres}`);
  console.log('');
  console.log('Failed/skipped rows by reason');
  for (const [area, summary] of Object.entries(report.skippedRows)) {
    console.log(`${area}: ${summary.total}`);
    for (const [reason, count] of Object.entries(summary.byReason)) {
      console.log(`  - ${reason}: ${count}`);
    }
  }
  console.log('');
  printSamples('Missing image files', report.samples.missingImageFiles);
  printSamples('Skipped products', report.samples.skippedProducts);
  printSamples('Skipped customers', report.samples.skippedCustomers);
  printSamples('Skipped addresses', report.samples.skippedAddresses);
  printSamples('Order issues', report.samples.orderIssues);
}

function printCount(label, count) {
  console.log(`${label}: source ${count.source} / postgres ${count.postgres} / diff ${formatDifference(count.difference)}`);
  if (typeof count.sourceRaw === 'number' && count.sourceRaw !== count.source) {
    console.log(`  source raw: ${count.sourceRaw}`);
  }
}

function printSamples(label, samples) {
  if (!samples.length) return;
  console.log(`${label} sample:`);
  for (const sample of samples.slice(0, 10)) {
    console.log(`  - ${typeof sample === 'string' ? sample : JSON.stringify(sample)}`);
  }
}

function summarizeSkipped(rows) {
  const byReason = {};
  for (const row of rows) {
    byReason[row.reason] = (byReason[row.reason] || 0) + 1;
  }

  return {
    total: rows.length,
    byReason,
  };
}

function buildImageCandidates(products, productImages, importableProductIds) {
  const imagesByProductId = new Map();
  for (const product of products) {
    if (!importableProductIds.has(product.id)) continue;
    const imageUrl = imageUrlFromLegacyPath(product.image);
    if (!imageUrl) continue;
    addImage(imagesByProductId, product.id, { imageUrl, sourcePath: product.image });
  }

  for (const image of productImages) {
    if (!importableProductIds.has(image.productId)) continue;
    const imageUrl = imageUrlFromLegacyPath(image.image);
    if (!imageUrl) continue;
    addImage(imagesByProductId, image.productId, { imageUrl, sourcePath: image.image });
  }

  return imagesByProductId;
}

function addImage(imagesByProductId, productId, image) {
  if (!imagesByProductId.has(productId)) {
    imagesByProductId.set(productId, []);
  }

  const images = imagesByProductId.get(productId);
  if (images.some((existingImage) => existingImage.imageUrl === image.imageUrl)) return;
  images.push(image);
}

function dedupeCustomers(customers) {
  const byEmail = new Map();
  const skipped = [];
  let duplicateEmailCount = 0;
  let invalidEmailCount = 0;

  for (const customer of customers) {
    if (!customer.email || !isEmail(customer.email)) {
      invalidEmailCount += 1;
      skipped.push({ legacyId: customer.id, reason: 'invalid_email' });
      continue;
    }

    const existing = byEmail.get(customer.email);
    if (!existing) {
      byEmail.set(customer.email, customer);
      continue;
    }

    duplicateEmailCount += 1;
    const canonical = chooseCanonicalCustomer(existing, customer);
    const skippedCustomer = canonical.id === existing.id ? customer : existing;
    skipped.push({ legacyId: skippedCustomer.id, reason: 'duplicate_email', email: skippedCustomer.email });
    byEmail.set(customer.email, canonical);
  }

  return {
    customers: [...byEmail.values()].sort((left, right) => left.id - right.id),
    duplicateEmailCount,
    invalidEmailCount,
    skipped,
  };
}

function chooseCanonicalCustomer(left, right) {
  if (left.isActive !== right.isActive) return left.isActive ? left : right;

  const leftDate = Date.parse(left.dateAdded || '') || 0;
  const rightDate = Date.parse(right.dateAdded || '') || 0;
  if (leftDate !== rightDate) return leftDate > rightDate ? left : right;

  return left.id > right.id ? left : right;
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

function mapCategory(row) {
  return { id: Number(row[0]) };
}

function mapCategoryDescription(row) {
  return { categoryId: Number(row[0]), languageId: Number(row[1]), name: cleanText(row[2]) };
}

function mapProduct(row) {
  return { id: Number(row[0]), image: cleanText(row[11]) };
}

function mapProductDescription(row) {
  return { productId: Number(row[0]), languageId: Number(row[1]), name: cleanText(row[2]) };
}

function mapProductImage(row) {
  return { productId: Number(row[1]), image: cleanText(row[2]) };
}

function mapCustomer(row) {
  return {
    id: Number(row[0]),
    email: normalizeEmail(row[6]),
    isActive: row[17] === 1 || row[17] === '1',
    dateAdded: row[21] || null,
  };
}

function mapAddress(row) {
  return {
    id: Number(row[0]),
    customerId: Number(row[1]),
    address1: cleanText(row[5]),
    city: cleanText(row[7]),
  };
}

function mapOrder(row) {
  return { id: Number(row[0]), email: normalizeEmail(row[10]), total: roundMoney(row[45]) };
}

function mapOrderProduct(row) {
  return {
    id: Number(row[0]),
    orderId: Number(row[1]),
    total: roundMoney(row[7]),
  };
}

function mapOrderTotal(row) {
  return {
    orderId: Number(row[1]),
    code: cleanText(row[3]),
    value: roundMoney(row[5]),
  };
}

function imageUrlFromLegacyPath(value) {
  const image = cleanImagePath(value);
  return image ? `/images/${image}` : null;
}

function localImageExists(value) {
  const image = cleanImagePath(value);
  if (!image) return true;
  if (!fs.existsSync(catalogRoot)) return false;

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

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
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

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function unique(values) {
  return [...new Set(values)];
}

function formatDifference(value) {
  return value > 0 ? `+${value}` : String(value);
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
