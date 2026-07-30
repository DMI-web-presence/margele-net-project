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
const strictTotals = args.includes('--strict-totals');
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
  const statusNames = new Map(parseTableRows(dump, 'order_status').map(mapLegacyOrderStatus));
  const productsByOrderId = groupBy(parseTableRows(dump, 'order_product').map(mapLegacyOrderProduct), 'orderId');
  const totalsByOrderId = groupBy(parseTableRows(dump, 'order_total').map(mapLegacyOrderTotal), 'orderId');
  const historyByOrderId = groupBy(
    parseTableRows(dump, 'order_history').map((row) => mapLegacyOrderHistory(row, statusNames)),
    'orderId',
  );
  const orders = parseTableRows(dump, 'order')
    .map((row) => mapLegacyOrder(row, statusNames))
    .filter((order) => order.legacyId);

  const client = await pool.connect();
  const stats = {
    dryRun,
    strictTotals,
    ordersRead: orders.length,
    ordersInserted: 0,
    ordersUpdated: 0,
    linkedToUsers: 0,
    guestOrders: 0,
    itemsInserted: 0,
    itemsUpdated: 0,
    ordersWithoutItems: 0,
    totalMismatches: 0,
  };

  try {
    await client.query('BEGIN');
    await assertImportColumns(client);

    for (const legacyOrder of orders) {
      const legacyProducts = productsByOrderId.get(legacyOrder.legacyId) || [];
      const legacyTotals = totalsByOrderId.get(legacyOrder.legacyId) || [];
      const legacyHistory = historyByOrderId.get(legacyOrder.legacyId) || [];
      const totals = calculateTotals(legacyOrder, legacyProducts, legacyTotals);
      const userId = await findLinkedUserId(client, legacyOrder);

      if (userId) stats.linkedToUsers += 1;
      else stats.guestOrders += 1;

      if (legacyProducts.length === 0) {
        stats.ordersWithoutItems += 1;
      }

      if (!totals.matches) {
        stats.totalMismatches += 1;
      }

      const orderResult = await upsertOrder(client, legacyOrder, {
        userId,
        totals,
        legacyTotals,
        legacyHistory,
      });
      stats[orderResult.inserted ? 'ordersInserted' : 'ordersUpdated'] += 1;

      await removeStaleImportedItems(client, orderResult.orderId, legacyProducts);

      for (const product of legacyProducts) {
        const itemResult = await upsertOrderItem(client, orderResult.orderId, product);
        stats[itemResult.inserted ? 'itemsInserted' : 'itemsUpdated'] += 1;
      }
    }

    if (strictTotals && stats.totalMismatches > 0) {
      throw new Error(`Order import blocked: ${stats.totalMismatches} order total mismatch(es).`);
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
  const orderColumns = await getColumns(client, 'orders');
  const orderItemColumns = await getColumns(client, 'order_items');
  const requiredOrderColumns = [
    'legacy_id',
    'legacy_customer_id',
    'legacy_customer_name',
    'legacy_customer_email',
    'legacy_customer_phone',
    'legacy_status_id',
    'legacy_status_name',
    'legacy_payment_method',
    'legacy_shipping_method',
    'legacy_totals',
    'legacy_status_history',
    'legacy_billing_address',
    'legacy_shipping_address',
  ];
  const requiredItemColumns = ['legacy_id', 'legacy_product_id', 'legacy_model', 'tax_total'];
  const missing = [
    ...requiredOrderColumns.filter((column) => !orderColumns.has(column)).map((column) => `orders.${column}`),
    ...requiredItemColumns.filter((column) => !orderItemColumns.has(column)).map((column) => `order_items.${column}`),
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

async function findLinkedUserId(client, order) {
  if (order.customerId) {
    const legacyResult = await client.query(
      'SELECT id FROM users WHERE legacy_id = $1 LIMIT 1',
      [order.customerId],
    );
    if (legacyResult.rows[0]) return legacyResult.rows[0].id;
  }

  if (order.email) {
    const emailResult = await client.query(
      'SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [order.email],
    );
    if (emailResult.rows[0]) return emailResult.rows[0].id;
  }

  return null;
}

async function upsertOrder(client, order, context) {
  const orderNumber = `LEGACY-${order.legacyId}`;
  const values = [
    context.userId,
    orderNumber,
    order.status,
    context.totals.subtotal,
    context.totals.deliveryTotal,
    context.totals.total,
    order.currency,
    order.paymentMethodCode,
    order.paymentStatus,
    order.paymentProvider,
    order.paidAt,
    order.cancelledAt,
    order.legacyId,
    order.customerId,
    order.customerName,
    order.email,
    order.phone,
    order.statusId,
    order.statusName,
    order.paymentMethodText,
    order.shippingMethodText,
    JSON.stringify(context.legacyTotals),
    JSON.stringify(context.legacyHistory),
    JSON.stringify(order.billingAddress),
    JSON.stringify(order.shippingAddress),
    order.dateAdded,
    order.dateModified,
  ];

  const existing = await client.query('SELECT id FROM orders WHERE legacy_id = $1 LIMIT 1', [order.legacyId]);
  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE orders
        SET
          user_id = $2,
          order_number = $3,
          status = $4,
          subtotal = $5,
          delivery_total = $6,
          total = $7,
          currency = $8,
          payment_method = $9,
          payment_status = $10,
          payment_provider = $11,
          paid_at = $12,
          cancelled_at = $13,
          legacy_id = $14,
          legacy_customer_id = $15,
          legacy_customer_name = $16,
          legacy_customer_email = $17,
          legacy_customer_phone = $18,
          legacy_status_id = $19,
          legacy_status_name = $20,
          legacy_payment_method = $21,
          legacy_shipping_method = $22,
          legacy_totals = $23::jsonb,
          legacy_status_history = $24::jsonb,
          legacy_billing_address = $25::jsonb,
          legacy_shipping_address = $26::jsonb,
          created_at = COALESCE($27::timestamp, created_at),
          updated_at = COALESCE($28::timestamp, CURRENT_TIMESTAMP)
        WHERE id = $1
      `,
      [existing.rows[0].id, ...values],
    );
    return { inserted: false, orderId: existing.rows[0].id };
  }

  const result = await client.query(
    `
      INSERT INTO orders (
        user_id,
        order_number,
        status,
        subtotal,
        delivery_total,
        total,
        currency,
        payment_method,
        payment_status,
        payment_provider,
        paid_at,
        cancelled_at,
        legacy_id,
        legacy_customer_id,
        legacy_customer_name,
        legacy_customer_email,
        legacy_customer_phone,
        legacy_status_id,
        legacy_status_name,
        legacy_payment_method,
        legacy_shipping_method,
        legacy_totals,
        legacy_status_history,
        legacy_billing_address,
        legacy_shipping_address,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22::jsonb, $23::jsonb,
        $24::jsonb, $25::jsonb, COALESCE($26::timestamp, CURRENT_TIMESTAMP),
        COALESCE($27::timestamp, CURRENT_TIMESTAMP)
      )
      RETURNING id
    `,
    values,
  );
  return { inserted: true, orderId: result.rows[0].id };
}

async function removeStaleImportedItems(client, orderId, products) {
  const legacyIds = products.map((product) => product.legacyId).filter(Boolean);
  if (legacyIds.length === 0) {
    await client.query('DELETE FROM order_items WHERE order_id = $1 AND legacy_id IS NOT NULL', [orderId]);
    return;
  }

  await client.query(
    'DELETE FROM order_items WHERE order_id = $1 AND legacy_id IS NOT NULL AND legacy_id <> ALL($2::int[])',
    [orderId, legacyIds],
  );
}

async function upsertOrderItem(client, orderId, product) {
  const linkedProductId = await findLinkedProductId(client, product.productId);
  const values = [
    orderId,
    product.legacyId,
    linkedProductId,
    product.productId,
    product.name,
    product.model,
    product.model,
    product.price,
    product.quantity,
    product.total,
    product.tax,
  ];

  const existing = await client.query(
    'SELECT id FROM order_items WHERE legacy_id = $1 LIMIT 1',
    [product.legacyId],
  );

  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE order_items
        SET
          order_id = $2,
          legacy_id = $3,
          product_id = $4,
          legacy_product_id = $5,
          product_name = $6,
          sku = $7,
          legacy_model = $8,
          unit_price = $9,
          quantity = $10,
          line_total = $11,
          tax_total = $12
        WHERE id = $1
      `,
      [existing.rows[0].id, ...values],
    );
    return { inserted: false };
  }

  await client.query(
    `
      INSERT INTO order_items (
        order_id,
        legacy_id,
        product_id,
        legacy_product_id,
        product_name,
        sku,
        legacy_model,
        unit_price,
        quantity,
        line_total,
        tax_total,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
    `,
    values,
  );
  return { inserted: true };
}

async function findLinkedProductId(client, legacyProductId) {
  if (!legacyProductId) return null;
  const result = await client.query('SELECT id FROM products WHERE id = $1 LIMIT 1', [legacyProductId]);
  return result.rows[0]?.id || null;
}

async function resetSequences(client) {
  await client.query(`
    SELECT setval(
      pg_get_serial_sequence('orders', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 1) FROM orders), 1),
      true
    )
  `);
  await client.query(`
    SELECT setval(
      pg_get_serial_sequence('order_items', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 1) FROM order_items), 1),
      true
    )
  `);
}

function calculateTotals(order, products, totals) {
  const subtotalRow = totals.find((row) => row.code === 'sub_total');
  const shippingRow = totals.find((row) => row.code === 'shipping');
  const totalRow = totals.find((row) => row.code === 'total');
  const productSubtotal = roundMoney(products.reduce((sum, product) => sum + product.total, 0));
  const subtotal = roundMoney(subtotalRow?.value ?? productSubtotal);
  const deliveryTotal = roundMoney(shippingRow?.value ?? 0);
  const orderTotal = roundMoney(order.total);
  const sourceTotal = roundMoney(totalRow?.value ?? orderTotal);
  const matches = Math.abs(sourceTotal - orderTotal) <= 0.01;

  return {
    subtotal,
    deliveryTotal,
    total: orderTotal,
    productSubtotal,
    sourceTotal,
    matches,
  };
}

function mapLegacyOrder(row, statusNames) {
  const statusId = normalizeInteger(row[46]);
  const statusName = statusNames.get(statusId) || legacyStatusNameById(statusId);
  const status = mapOrderStatus(statusId, statusName);
  const paymentMethodText = cleanOptionalText(row[27]);
  const shippingMethodText = cleanOptionalText(row[42]);
  return {
    legacyId: Number(row[0]),
    customerId: normalizeInteger(row[6]),
    customerName: [cleanText(row[8]), cleanText(row[9])].filter(Boolean).join(' ') || null,
    email: normalizeEmail(row[10]),
    phone: cleanOptionalText(row[11]),
    billingAddress: {
      firstName: cleanOptionalText(row[14]),
      lastName: cleanOptionalText(row[15]),
      company: cleanOptionalText(row[16]),
      address1: cleanOptionalText(row[17]),
      address2: cleanOptionalText(row[18]),
      city: cleanOptionalText(row[19]),
      postcode: cleanOptionalText(row[20]),
      country: cleanOptionalText(row[21]),
      zone: cleanOptionalText(row[23]),
    },
    shippingAddress: {
      firstName: cleanOptionalText(row[29]),
      lastName: cleanOptionalText(row[30]),
      company: cleanOptionalText(row[31]),
      address1: cleanOptionalText(row[32]),
      address2: cleanOptionalText(row[33]),
      city: cleanOptionalText(row[34]),
      postcode: cleanOptionalText(row[35]),
      country: cleanOptionalText(row[36]),
      zone: cleanOptionalText(row[38]),
    },
    paymentMethodText,
    paymentMethodCode: mapPaymentMethod(row[28], paymentMethodText),
    paymentProvider: cleanOptionalText(row[28]),
    shippingMethodText,
    statusId,
    statusName,
    status,
    paymentStatus: mapPaymentStatus(status, statusName),
    total: roundMoney(row[45]),
    currency: cleanOptionalText(row[53]) || 'RON',
    paidAt: status === 'Livrata' || status === 'Expediata' ? row[59] || null : null,
    cancelledAt: status === 'Anulata' ? row[60] || row[59] || null : null,
    dateAdded: row[59] || null,
    dateModified: row[60] || null,
  };
}

function mapLegacyOrderProduct(row) {
  return {
    legacyId: Number(row[0]),
    orderId: Number(row[1]),
    productId: normalizeInteger(row[2]),
    name: cleanText(row[3]) || 'Produs importat',
    model: cleanOptionalText(row[4]),
    quantity: Number(row[5] || 0),
    price: roundMoney(row[6]),
    total: roundMoney(row[7]),
    tax: roundMoney(row[8]),
  };
}

function mapLegacyOrderTotal(row) {
  return {
    legacyId: Number(row[0]),
    orderId: Number(row[1]),
    code: String(row[2] || '').trim(),
    title: cleanText(row[3]),
    value: roundMoney(row[4]),
    sortOrder: Number(row[5] || 0),
  };
}

function mapLegacyOrderHistory(row, statusNames) {
  const statusId = normalizeInteger(row[2]);
  return {
    legacyId: Number(row[0]),
    orderId: Number(row[1]),
    statusId,
    statusName: statusNames.get(statusId) || legacyStatusNameById(statusId),
    notify: row[3] === 1 || row[3] === '1',
    commentPresent: Boolean(cleanText(row[4])),
    dateAdded: row[5] || null,
  };
}

function mapLegacyOrderStatus(row) {
  return [Number(row[0]), cleanText(row[2])];
}

function mapOrderStatus(statusId, statusName) {
  const normalized = normalizeStatusName(statusName);
  if (/(cancel|denied|expired|voided|failed|anulat|refuzat|expirat)/.test(normalized)) return 'Anulata';
  if (/(refund|reverse|return|retur)/.test(normalized)) return 'Returnata';
  if (/(ship|expedi)/.test(normalized)) return 'Expediata';
  if (/(complete|completed|livrat|finalizat)/.test(normalized)) return 'Livrata';
  if (/(process|processed|proces|pending|astept|confirm)/.test(normalized)) return 'In procesare';

  if ([7, 9, 10, 11, 13, 16].includes(Number(statusId))) return 'Anulata';
  if ([11].includes(Number(statusId))) return 'Returnata';
  if ([3].includes(Number(statusId))) return 'Expediata';
  if ([5].includes(Number(statusId))) return 'Livrata';
  if ([1, 2, 15].includes(Number(statusId))) return 'In procesare';
  return 'Plasata';
}

function mapPaymentStatus(status, statusName) {
  const normalized = normalizeStatusName(statusName);
  if (status === 'Anulata' || /(failed|denied|voided|expired|cancel)/.test(normalized)) return 'failed';
  if (status === 'Returnata' || /(refund|reversed|return|retur)/.test(normalized)) return 'refunded';
  if (status === 'Livrata' || status === 'Expediata' || /(complete|paid|platit|finalizat)/.test(normalized)) return 'paid';
  return 'pending';
}

function mapPaymentMethod(paymentCode, paymentMethodText) {
  const value = `${paymentCode || ''} ${paymentMethodText || ''}`.toLowerCase();
  if (value.includes('card') || value.includes('netopia') || value.includes('mobilpay')) return 'card';
  if (value.includes('bank') || value.includes('op') || value.includes('transfer')) return 'bank_transfer';
  if (value.includes('cod') || value.includes('ramburs')) return 'cash_on_delivery';
  return 'manual';
}

function legacyStatusNameById(statusId) {
  const fallback = {
    1: 'Pending',
    2: 'Processing',
    3: 'Shipped',
    5: 'Complete',
    7: 'Canceled',
    9: 'Canceled Reversal',
    10: 'Failed',
    11: 'Refunded',
    12: 'Reversed',
    13: 'Chargeback',
    15: 'Processed',
    16: 'Voided',
  };
  return fallback[Number(statusId)] || null;
}

function normalizeStatusName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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
  return String(value || '').trim().toLowerCase() || null;
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

function roundMoney(value) {
  const number = Number(value || 0);
  return Math.round((Number.isFinite(number) ? number : 0) * 100) / 100;
}

function printSummary(stats) {
  console.log(
    [
      `Order import ${stats.dryRun ? 'dry run' : 'complete'}`,
      `orders_read=${stats.ordersRead}`,
      `orders_inserted=${stats.ordersInserted}`,
      `orders_updated=${stats.ordersUpdated}`,
      `linked_to_users=${stats.linkedToUsers}`,
      `guest_orders=${stats.guestOrders}`,
      `items_inserted=${stats.itemsInserted}`,
      `items_updated=${stats.itemsUpdated}`,
      `orders_without_items=${stats.ordersWithoutItems}`,
      `total_mismatches=${stats.totalMismatches}`,
      `strict_totals=${stats.strictTotals}`,
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
