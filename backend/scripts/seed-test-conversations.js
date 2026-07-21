const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

loadEnv(path.join(__dirname, '..', '.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in backend/.env');
}

const dbSearchPath = 'catalog,auth,commerce,content,public';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: `-c search_path=${dbSearchPath}`,
});

const samples = [
  {
    customerName: 'Test Chat Admin 02',
    customerEmail: 'test-chat-02@example.com',
    customerPhone: '0711000002',
    source: 'website',
    status: 'nou',
    subject: 'Verificare breadcrumb 02',
    message: 'Acesta este un mesaj de test pentru a umple lista din admin.',
  },
  {
    customerName: 'Test Chat Admin 03',
    customerEmail: 'test-chat-03@example.com',
    customerPhone: '0711000003',
    source: 'email',
    status: 'in_curs',
    subject: 'Cerere stoc produs',
    message: 'Buna, ma intereseaza disponibilitatea pentru un produs nou.',
  },
  {
    customerName: 'Test Chat Admin 04',
    customerEmail: 'test-chat-04@example.com',
    customerPhone: '0711000004',
    source: 'whatsapp',
    status: 'nou',
    subject: 'Detalii livrare',
    message: 'Salut! In cat timp ajunge o comanda in Bucuresti?',
  },
  {
    customerName: 'Test Chat Admin 05',
    customerEmail: 'test-chat-05@example.com',
    customerPhone: '0711000005',
    source: 'website',
    status: 'rezolvat',
    subject: 'Multumire comanda',
    message: 'Multumesc, am primit coletul si totul este perfect.',
  },
  {
    customerName: 'Test Chat Admin 06',
    customerEmail: 'test-chat-06@example.com',
    customerPhone: '0711000006',
    source: 'email',
    status: 'spam',
    subject: 'Mesaj promotional',
    message: 'Oferta promotionala nerelevanta pentru testarea inboxului.',
  },
  {
    customerName: 'Test Chat Admin 07',
    customerEmail: 'test-chat-07@example.com',
    customerPhone: '0711000007',
    source: 'website',
    status: 'in_curs',
    subject: 'Cerere factura',
    message: 'As dori factura pe companie pentru comanda trimisa ieri.',
  },
  {
    customerName: 'Test Chat Admin 08',
    customerEmail: 'test-chat-08@example.com',
    customerPhone: '0711000008',
    source: 'whatsapp',
    status: 'nou',
    subject: 'Intrebare personalizare',
    message: 'Se poate personaliza produsul cu o combinatie diferita de culori?',
  },
];

async function main() {
  const insertedIds = [];

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    const sentAt = new Date(Date.now() + index * 60 * 1000);

    const existing = await pool.query('SELECT id FROM conversations WHERE customer_email = $1 LIMIT 1', [sample.customerEmail]);
    if (existing.rows[0]) {
      insertedIds.push(existing.rows[0].id);
      continue;
    }

    const conversationResult = await pool.query(
      `
        INSERT INTO conversations (
          customer_name,
          customer_email,
          customer_phone,
          contact_detail,
          source,
          status,
          subject,
          last_message_preview,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        RETURNING id
      `,
      [
        sample.customerName,
        sample.customerEmail,
        sample.customerPhone,
        sample.customerEmail,
        sample.source,
        sample.status,
        sample.subject,
        sample.message.slice(0, 280),
        sentAt,
      ],
    );

    const conversationId = conversationResult.rows[0].id;

    await pool.query(
      `
        INSERT INTO conversation_messages (
          conversation_id,
          direction,
          source,
          message_text,
          attachments,
          sent_at
        )
        VALUES ($1, 'inbound', $2, $3, '[]'::jsonb, $4)
      `,
      [conversationId, sample.source, sample.message, sentAt],
    );

    insertedIds.push(conversationId);
  }

  const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM conversations');
  console.log(
    JSON.stringify({
      insertedOrFound: insertedIds.length,
      totalConversations: countResult.rows[0].count,
      conversationIds: insertedIds,
    }),
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
