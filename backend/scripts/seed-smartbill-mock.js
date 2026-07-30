const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const MOCK_EMAIL = 'smartbill.mock@margele.net';
const MOCK_ORDER_NUMBER = 'MOCK-SMARTBILL-001';

loadEnv(path.join(__dirname, '..', '.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in backend/.env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: '-c search_path=catalog,app_auth,auth,commerce,content,public',
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (process.argv.includes('--remove')) {
      const result = await client.query(
        'DELETE FROM users WHERE lower(email) = lower($1) RETURNING id',
        [MOCK_EMAIL],
      );
      await client.query('COMMIT');
      console.log(
        result.rowCount > 0
          ? `Removed SmartBill mock data for ${MOCK_ORDER_NUMBER}.`
          : 'SmartBill mock data was already absent.',
      );
      return;
    }

    const userId = await upsertMockUser(client);
    await upsertMockAddress(client, userId);
    const orderId = await upsertMockOrder(client, userId);
    await replaceMockItems(client, orderId);
    const verification = await client.query(
      `
        SELECT
          o.order_number,
          o.invoice_number,
          o.invoice_status,
          o.invoice_provider,
          o.smartbill_series,
          o.smartbill_number,
          u.email,
          COUNT(oi.id)::int AS item_count
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.id = $1
        GROUP BY o.id, u.email
      `,
      [orderId],
    );

    await client.query('COMMIT');
    console.log(
      JSON.stringify(
        {
          created: true,
          orderId,
          orderNumber: MOCK_ORDER_NUMBER,
          invoiceNumber: 'MOCK0001',
          customerEmail: MOCK_EMAIL,
          storedRecord: verification.rows[0],
          note: 'Local UI fixture only. No SmartBill API request was made.',
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function upsertMockUser(client) {
  const existing = await client.query(
    'SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1',
    [MOCK_EMAIL],
  );

  if (existing.rows[0]) {
    const result = await client.query(
      `
        UPDATE users
        SET
          full_name = $2,
          phone = $3,
          client_type = $4,
          company_name = $5,
          cui = $6,
          trade_register_number = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `,
      [
        existing.rows[0].id,
        'Atelier Test SmartBill',
        '0712 345 678',
        'Persoana juridica',
        'Atelier Test SmartBill SRL',
        'RO12345678',
        'J05/123/2026',
      ],
    );
    return result.rows[0].id;
  }

  const result = await client.query(
    `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        phone,
        client_type,
        company_name,
        cui,
        trade_register_number,
        role,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'customer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `,
    [
      'Atelier Test SmartBill',
      MOCK_EMAIL,
      'mock$disabled',
      '0712 345 678',
      'Persoana juridica',
      'Atelier Test SmartBill SRL',
      'RO12345678',
      'J05/123/2026',
    ],
  );
  return result.rows[0].id;
}

async function upsertMockAddress(client, userId) {
  const existing = await client.query(
    `
      SELECT id
      FROM addresses
      WHERE user_id = $1 AND adresa1 = $2
      LIMIT 1
    `,
    [userId, 'Str. Exemplu nr. 42'],
  );
  const values = [
    'Atelier',
    'Test',
    'Atelier Test SmartBill SRL',
    'Romania',
    'Str. Exemplu nr. 42',
    'Etaj 1',
    '410001',
    'Oradea',
    'Bihor',
    '0712 345 678',
  ];

  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE addresses
        SET
          prenume = $2,
          nume = $3,
          companie = $4,
          tara = $5,
          adresa1 = $6,
          adresa2 = $7,
          cod_postal = $8,
          oras = $9,
          judet = $10,
          telefon = $11,
          implicit_facturare = true,
          implicit_livrare = true,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [existing.rows[0].id, ...values],
    );
    return;
  }

  await client.query(
    `
      INSERT INTO addresses (
        user_id,
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
      VALUES ($1, 'Dl.', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    [userId, ...values],
  );
}

async function upsertMockOrder(client, userId) {
  const existing = await client.query(
    'SELECT id FROM orders WHERE order_number = $1 LIMIT 1',
    [MOCK_ORDER_NUMBER],
  );
  const mockPayload = {
    companyVatCode: 'RO-MOCK',
    seriesName: 'MOCK',
    mentions: 'Fixture locala pentru testarea interfetei SmartBill',
    products: [
      { name: 'Margele sticla - mix pastel', quantity: 5, price: 19.5 },
      { name: 'Snur cerat 1 mm', quantity: 3, price: 20 },
      { name: 'Livrare', quantity: 1, price: 19.99 },
    ],
  };
  const mockResponse = {
    number: '0001',
    series: 'MOCK',
    message: 'Mock response - no fiscal document was emitted.',
  };
  const values = [
    userId,
    'Confirmata',
    157.5,
    19.99,
    177.49,
    'RON',
    'card',
    'paid',
    'netopia-mock',
    'MOCK-NTP-0001',
    'MOCK0001',
    'generata',
    'https://example.invalid/mock-smartbill-invoice.pdf',
    'Atelier Test SmartBill SRL',
    'RO12345678',
    'smartbill',
    'MOCK',
    '0001',
    mockPayload,
    mockResponse,
  ];

  if (existing.rows[0]) {
    const result = await client.query(
      `
        UPDATE orders
        SET
          user_id = $2,
          status = $3,
          subtotal = $4,
          delivery_total = $5,
          total = $6,
          currency = $7,
          payment_method = $8,
          payment_status = $9,
          payment_provider = $10,
          provider_payment_id = $11,
          paid_at = CURRENT_TIMESTAMP,
          invoice_number = $12,
          invoice_status = $13,
          invoice_url = $14,
          invoice_issued_at = CURRENT_TIMESTAMP,
          billing_company = $15,
          billing_vat = $16,
          invoice_provider = $17,
          smartbill_series = $18,
          smartbill_number = $19,
          smartbill_last_attempt_at = CURRENT_TIMESTAMP,
          smartbill_error = NULL,
          smartbill_payload = $20,
          smartbill_response = $21,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `,
      [existing.rows[0].id, ...values],
    );
    return result.rows[0].id;
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
        provider_payment_id,
        paid_at,
        invoice_number,
        invoice_status,
        invoice_url,
        invoice_issued_at,
        billing_company,
        billing_vat,
        invoice_provider,
        smartbill_series,
        smartbill_number,
        smartbill_last_attempt_at,
        smartbill_payload,
        smartbill_response,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP,
        $12, $13, $14, CURRENT_TIMESTAMP, $15, $16, $17, $18, $19,
        CURRENT_TIMESTAMP, $20, $21, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING id
    `,
    [values[0], MOCK_ORDER_NUMBER, ...values.slice(1)],
  );
  return result.rows[0].id;
}

async function replaceMockItems(client, orderId) {
  await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);

  const items = [
    {
      productName: 'Margele sticla - mix pastel',
      sku: 'MOCK-MRG-PASTEL',
      selectedOptions: 'Mix 6 mm',
      unitPrice: 19.5,
      quantity: 5,
      lineTotal: 97.5,
    },
    {
      productName: 'Snur cerat 1 mm',
      sku: 'MOCK-SNUR-1MM',
      selectedOptions: 'Negru',
      unitPrice: 20,
      quantity: 3,
      lineTotal: 60,
    },
  ];

  for (const item of items) {
    await client.query(
      `
        INSERT INTO order_items (
          order_id,
          product_name,
          sku,
          selected_options,
          unit_price,
          quantity,
          line_total,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      `,
      [
        orderId,
        item.productName,
        item.sku,
        item.selectedOptions,
        item.unitPrice,
        item.quantity,
        item.lineTotal,
      ],
    );
  }
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
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
