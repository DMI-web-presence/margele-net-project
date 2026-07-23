const crypto = require('crypto');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Pool } = require('pg');
const { createBrevoMailer } = require('./services/brevo-mail');

loadEnv(path.join(__dirname, '..', '.env'));
loadEnv(path.join(__dirname, '..', '..', 'frontend', '.env'), false, [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_ORIGIN',
]);

const config = {
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  adminEmails: parseCsv(process.env.ADMIN_EMAILS || ''),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 3001}/auth/google/callback`,
  backendPublicUrl:
    process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`,
  netopiaMode: process.env.NETOPIA_MODE || 'sandbox',
  netopiaApiKey: process.env.NETOPIA_API_KEY,
  netopiaPosSignature: process.env.NETOPIA_POS_SIGNATURE,
  netopiaNotifyToken: process.env.NETOPIA_NOTIFY_TOKEN,
  netopiaEmailTemplate: process.env.NETOPIA_EMAIL_TEMPLATE || '',
  netopiaLanguage: process.env.NETOPIA_LANGUAGE || 'ro',
  brevoEnabled: String(process.env.BREVO_ENABLED || '').toLowerCase() === 'true',
  brevoApiKey: process.env.BREVO_API_KEY || '',
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || '',
  brevoSenderName: process.env.BREVO_SENDER_NAME || 'Margele.net',
  brevoReplyToEmail: process.env.BREVO_REPLY_TO_EMAIL || '',
  brevoReplyToName: process.env.BREVO_REPLY_TO_NAME || '',
  brevoAdminEmail: process.env.BREVO_ADMIN_EMAIL || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2BucketName: process.env.R2_BUCKET_NAME || '',
  r2Endpoint: process.env.R2_ENDPOINT || '',
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL || '',
  r2Region: process.env.R2_REGION || 'auto',
  productImageStorage: (process.env.PRODUCT_IMAGE_STORAGE || 'auto').toLowerCase(),
  cookieName: 'auth_token',
};

const dbSearchSchemas = ['catalog', 'auth', 'commerce', 'content', 'public'];
const dbSearchPath = dbSearchSchemas.join(',');
const uploadRoot = path.join(__dirname, '..', 'uploads');
const productUploadDir = path.join(uploadRoot, 'products');

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required. Add it to backend/.env.');
}

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is required. Add it to backend/.env.');
}

const pool = new Pool({
  connectionString: config.databaseUrl,
  options: `-c search_path=${dbSearchPath}`,
});

const r2Client = createR2Client(config);

const brevoMailer = createBrevoMailer({
  enabled: config.brevoEnabled,
  apiKey: config.brevoApiKey,
  senderEmail: config.brevoSenderEmail,
  senderName: config.brevoSenderName,
  replyToEmail: config.brevoReplyToEmail,
  replyToName: config.brevoReplyToName,
  adminEmail: config.brevoAdminEmail,
});

let userColumnsCache = null;
let addressColumnsCache = null;
let orderColumnsCache = null;
let conversationMessageColumnsCache = null;

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.method === 'GET' && requestUrl.pathname.startsWith('/uploads/')) {
      await handleUploadedFile(requestUrl, res);
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/products') {
      await handleProductList(requestUrl, res);
      return;
    }

    const productMatch = requestUrl.pathname.match(/^\/products\/([^/]+)$/);
    if (productMatch && req.method === 'GET') {
      await handleProductDetails(res, decodeURIComponent(productMatch[1]));
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/categories') {
      await handleCategoryList(res);
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/admin/categories') {
      await handleAdminCategoryList(req, res);
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/admin/categories') {
      await handleAdminCategoryCreate(req, res);
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/admin/products') {
      await handleAdminProductList(req, requestUrl, res);
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/admin/products') {
      await handleAdminProductCreate(req, res);
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/admin/uploads/product-image') {
      await handleAdminProductImageUpload(req, res);
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/admin/orders') {
      await handleAdminOrderList(req, requestUrl, res);
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/admin/conversations') {
      await handleAdminConversationList(req, requestUrl, res);
      return;
    }

    const adminProductMatch = requestUrl.pathname.match(/^\/admin\/products\/(\d+)$/);
    if (adminProductMatch && req.method === 'GET') {
      await handleAdminProductDetails(req, res, Number(adminProductMatch[1]));
      return;
    }

    if (adminProductMatch && req.method === 'PATCH') {
      await handleAdminProductUpdate(req, res, Number(adminProductMatch[1]));
      return;
    }

    if (adminProductMatch && req.method === 'DELETE') {
      await handleAdminProductDelete(req, res, Number(adminProductMatch[1]));
      return;
    }

    const adminOrderMatch = requestUrl.pathname.match(/^\/admin\/orders\/(\d+)$/);
    if (adminOrderMatch && req.method === 'PATCH') {
      await handleAdminOrderUpdate(req, res, Number(adminOrderMatch[1]));
      return;
    }

    const adminConversationMatch = requestUrl.pathname.match(/^\/admin\/conversations\/(\d+)$/);
    if (adminConversationMatch && req.method === 'PATCH') {
      await handleAdminConversationUpdate(req, res, Number(adminConversationMatch[1]));
      return;
    }

    const adminConversationReplyMatch = requestUrl.pathname.match(/^\/admin\/conversations\/(\d+)\/reply$/);
    if (adminConversationReplyMatch && req.method === 'POST') {
      await handleAdminConversationReply(req, res, Number(adminConversationReplyMatch[1]));
      return;
    }

    const categoryMatch = requestUrl.pathname.match(/^\/categories\/([^/]+)$/);
    if (categoryMatch && req.method === 'GET') {
      await handleCategoryDetails(res, decodeURIComponent(categoryMatch[1]));
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/auth/email-exists') {
      await handleEmailExists(requestUrl, res);
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/auth/google') {
      await handleGoogleStart(res);
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/auth/google/callback') {
      await handleGoogleCallback(req, requestUrl, res);
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/auth/register') {
      await handleRegister(req, res);
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/auth/login') {
      await handleLogin(req, res);
      return;
    }

    if ((req.method === 'POST' || req.method === 'GET') && requestUrl.pathname === '/auth/logout') {
      clearAuthCookie(res);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/auth/me') {
      await handleMe(req, res);
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/auth/admin/me') {
      await handleAdminMe(req, res);
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/auth/profile') {
      await handleProfile(req, res);
      return;
    }

    if (req.method === 'PATCH' && requestUrl.pathname === '/auth/profile') {
      await handleProfileUpdate(req, res);
      return;
    }

    if (req.method === 'PATCH' && requestUrl.pathname === '/auth/profile/email') {
      await handleEmailUpdate(req, res);
      return;
    }

    if (req.method === 'PATCH' && requestUrl.pathname === '/auth/profile/password') {
      await handlePasswordUpdate(req, res);
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/auth/orders') {
      await handleOrderList(req, requestUrl, res);
      return;
    }

    const orderMatch = requestUrl.pathname.match(/^\/auth\/orders\/([^/]+)$/);
    if (orderMatch && req.method === 'GET') {
      await handleOrderDetails(req, res, decodeURIComponent(orderMatch[1]));
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/auth/orders') {
      await handleOrderCreate(req, res);
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/returns') {
      await handleReturnRequest(req, res);
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/contact-messages') {
      await handleContactMessage(req, res);
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/auth/payments/netopia/start') {
      await handleNetopiaPaymentStart(req, res);
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/payments/netopia/notify') {
      await handleNetopiaNotify(req, requestUrl, res);
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/auth/addresses') {
      await handleAddressList(req, res);
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/auth/addresses') {
      await handleAddressCreate(req, res);
      return;
    }

    const addressMatch = requestUrl.pathname.match(/^\/auth\/addresses\/(\d+)$/);
    if (addressMatch && req.method === 'PATCH') {
      await handleAddressUpdate(req, res, Number(addressMatch[1]));
      return;
    }

    if (addressMatch && req.method === 'DELETE') {
      await handleAddressDelete(req, res, Number(addressMatch[1]));
      return;
    }

    sendJson(res, 404, { message: 'Route not found.' });
  } catch (error) {
    if (error.status) {
      sendJson(res, error.status, { message: error.message });
      return;
    }

    console.error(error);
    sendJson(res, 500, { message: 'A aparut o eroare pe server.' });
  }
});

server.listen(config.port, () => {
  console.log(`Backend listening on http://127.0.0.1:${config.port}`);
});

function loadEnv(filePath, override = true, allowedKeys = null) {
  let content = '';
  try {
    content = require('fs').readFileSync(filePath, 'utf8');
  } catch {
    return;
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    if (allowedKeys && !allowedKeys.includes(key)) continue;

    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (override || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = new Set([
    config.frontendOrigin,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ]);

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
}

function sendJson(res, status, data, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('Invalid JSON body.');
    error.status = 400;
    throw error;
  }
}

async function handleUploadedFile(requestUrl, res) {
  const relativePath = decodeURIComponent(requestUrl.pathname.replace(/^\/uploads\//, ''));
  const normalizedPath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = path.join(uploadRoot, normalizedPath);
  const resolvedRoot = path.resolve(uploadRoot);
  const resolvedFilePath = path.resolve(filePath);

  if (!resolvedFilePath.startsWith(resolvedRoot + path.sep) && resolvedFilePath !== resolvedRoot) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  let stat;
  try {
    stat = await fs.promises.stat(resolvedFilePath);
  } catch {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  if (!stat.isFile()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'Content-Type': getMimeTypeForPath(resolvedFilePath),
    'Cache-Control': 'public, max-age=31536000, immutable',
  });

  fs.createReadStream(resolvedFilePath).pipe(res);
}

async function handleAdminProductImageUpload(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const body = await readJson(req);
  const mimeType = String(body.mimeType || '').trim().toLowerCase();
  const fileName = String(body.fileName || '').trim();
  const base64Data = String(body.base64Data || '').trim();
  const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

  if (!mimeType || !allowedMimeTypes.has(mimeType)) {
    sendJson(res, 400, { message: 'Tipul imaginii nu este acceptat.' });
    return;
  }

  if (!base64Data) {
    sendJson(res, 400, { message: 'Imaginea nu a fost trimisa.' });
    return;
  }

  let fileBuffer;
  try {
    fileBuffer = Buffer.from(base64Data, 'base64');
  } catch {
    sendJson(res, 400, { message: 'Imaginea nu a putut fi decodata.' });
    return;
  }

  if (!fileBuffer.length) {
    sendJson(res, 400, { message: 'Imaginea este goala.' });
    return;
  }

  if (fileBuffer.length > 6 * 1024 * 1024) {
    sendJson(res, 400, { message: 'Imaginea este prea mare. Limita este 6 MB.' });
    return;
  }

  const safeBaseName = slugifyFileName(path.parse(fileName).name || 'produs');
  const extension = mimeTypeToExtension(mimeType);
  const storageResult = await storeProductImage({
    fileBuffer,
    mimeType,
    extension,
    safeBaseName,
  });

  sendJson(res, 201, storageResult);
}

function slugifyFileName(value) {
  return String(value || 'produs')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'produs';
}

function mimeTypeToExtension(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
}

function getMimeTypeForPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.gif') return 'image/gif';
  if (extension === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

async function storeProductImage({
  fileBuffer,
  mimeType,
  extension,
  safeBaseName,
}) {
  const objectKey = buildProductImageObjectKey(safeBaseName, extension);
  const shouldTryR2 =
    config.productImageStorage !== 'local' &&
    r2Client &&
    isR2PublicDeliveryConfigured(config);

  if (shouldTryR2) {
    try {
      await r2Client.send(
        new PutObjectCommand({
          Bucket: config.r2BucketName,
          Key: objectKey,
          Body: fileBuffer,
          ContentType: mimeType,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );

      return {
        imageUrl: `${stripTrailingSlash(config.r2PublicBaseUrl)}/${objectKey}`,
        path: objectKey,
        storage: 'r2',
      };
    } catch (error) {
      if (config.productImageStorage === 'r2') {
        throw error;
      }
      console.warn('R2 upload failed, falling back to local storage.', error);
    }
  }

  await fs.promises.mkdir(productUploadDir, { recursive: true });
  const localFileName = path.basename(objectKey);
  const absoluteFilePath = path.join(productUploadDir, localFileName);

  await fs.promises.writeFile(absoluteFilePath, fileBuffer);

  const publicPath = `/uploads/products/${localFileName}`;
  return {
    imageUrl: `${config.backendPublicUrl}${publicPath}`,
    path: publicPath,
    storage: 'local',
  };
}

function buildProductImageObjectKey(safeBaseName, extension) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeBaseName}.${extension}`;

  return `products/${year}/${month}/${uniqueName}`;
}

function createR2Client(appConfig) {
  if (appConfig.productImageStorage === 'local') {
    return null;
  }

  if (!isR2UploadConfigured(appConfig)) {
    return null;
  }

  return new S3Client({
    region: appConfig.r2Region,
    endpoint: appConfig.r2Endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: appConfig.r2AccessKeyId,
      secretAccessKey: appConfig.r2SecretAccessKey,
    },
  });
}

function isR2UploadConfigured(appConfig) {
  return Boolean(
    appConfig.r2AccessKeyId &&
      appConfig.r2SecretAccessKey &&
      appConfig.r2BucketName &&
      appConfig.r2Endpoint,
  );
}

function isR2PublicDeliveryConfigured(appConfig) {
  return Boolean(appConfig.r2PublicBaseUrl);
}

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

async function handleEmailExists(requestUrl, res) {
  const email = normalizeEmail(requestUrl.searchParams.get('email'));
  if (!email) {
    sendJson(res, 400, { message: 'Emailul este obligatoriu.' });
    return;
  }

  const result = await pool.query('SELECT 1 FROM users WHERE lower(email) = lower($1) LIMIT 1', [
    email,
  ]);
  sendJson(res, 200, { exists: result.rowCount > 0 });
}

async function handleProductList(requestUrl, res) {
  if (!(await hasTable('products'))) {
    sendJson(res, 200, []);
    return;
  }

  const listView = String(requestUrl.searchParams.get('view') || '').trim().toLowerCase();
  if (listView === 'lite') {
    const filters = buildProductFilters(requestUrl);
    if (filters.error) {
      sendJson(res, 400, { message: filters.error });
      return;
    }

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.short_description,
        p.description,
        p.price,
        p.compare_at_price,
        p.currency,
        COALESCE(primary_image.image_url, p.image_url) AS primary_image_url,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.created_at
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.id
        ORDER BY is_primary DESC, sort_order ASC, id ASC
        LIMIT 1
      ) primary_image ON true
      WHERE ${filters.whereSql}
      ORDER BY p.created_at DESC, p.id DESC
    `,
      filters.values,
    );

    sendJson(res, 200, result.rows.map(productCardResponse));
    return;
  }

  if (
    !(await hasTable('categories')) ||
    !(await hasTable('product_images'))
  ) {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    sendJson(res, 200, result.rows.map(productResponse));
    return;
  }

  const hasProductOptions =
    (await hasTable('product_attributes')) && (await hasTable('product_option_values'));
  const filters = buildProductFilters(requestUrl);
  if (filters.error) {
    sendJson(res, 400, { message: filters.error });
    return;
  }

  const result = await pool.query(
    `
    SELECT
      p.*,
      c.name AS category_name,
      c.slug AS category_slug,
      COALESCE(primary_image.image_url, p.image_url) AS primary_image_url,
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'id', pi.id,
            'imageUrl', pi.image_url,
            'altText', pi.alt_text,
            'sortOrder', pi.sort_order,
            'isPrimary', pi.is_primary
          )
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'::jsonb
      ) AS images,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', linked_category.id,
              'name', linked_category.name,
              'slug', linked_category.slug,
              'isPrimary', product_category.is_primary
            )
            ORDER BY product_category.is_primary DESC, linked_category.sort_order ASC, linked_category.name ASC
          )
          FROM product_categories product_category
          JOIN categories linked_category ON linked_category.id = product_category.category_id
          WHERE product_category.product_id = p.id
        ),
        '[]'::jsonb
      ) AS categories,
      ${
        hasProductOptions
          ? `
      COALESCE(product_attributes_data.attributes, '[]'::jsonb) AS attributes,
      COALESCE(product_variants_data.variants, '[]'::jsonb) AS variants
      `
          : `
      '[]'::jsonb AS attributes,
      '[]'::jsonb AS variants
      `
      }
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN LATERAL (
      SELECT image_url
      FROM product_images
      WHERE product_id = p.id
      ORDER BY is_primary DESC, sort_order ASC, id ASC
      LIMIT 1
    ) primary_image ON true
    ${
      hasProductOptions
        ? `
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pa.id,
          'key', pa.attribute_key,
          'value', pa.attribute_value,
          'sortOrder', pa.sort_order
        )
        ORDER BY pa.sort_order ASC, pa.id ASC
      ) AS attributes
      FROM product_attributes pa
      WHERE pa.product_id = p.id
    ) product_attributes_data ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pov.id,
          'optionName', pov.option_name,
          'optionValue', pov.option_value,
          'legacyOptionId', pov.legacy_option_id,
          'legacyOptionValueId', pov.legacy_option_value_id,
          'combinationId', pov.combination_id,
          'model', pov.model,
          'sku', pov.sku,
          'quantity', pov.quantity,
          'priceDelta', pov.price_delta,
          'pricePrefix', pov.price_prefix,
          'imageUrl', pov.image_url,
          'sortOrder', pov.sort_order
        )
        ORDER BY pov.sort_order ASC, pov.id ASC
      ) AS variants
      FROM product_option_values pov
      WHERE pov.product_id = p.id
    ) product_variants_data ON true
    `
        : ''
    }
    LEFT JOIN product_images pi ON pi.product_id = p.id
    WHERE ${filters.whereSql}
    GROUP BY p.id, c.id, primary_image.image_url
      ${hasProductOptions ? ', product_attributes_data.attributes, product_variants_data.variants' : ''}
    ORDER BY p.created_at DESC, p.id DESC
  `,
    filters.values,
  );
  sendJson(res, 200, result.rows.map(productResponse));
}

async function handleProductDetails(res, productIdentifier) {
  if (!(await hasTable('products'))) {
    sendJson(res, 404, { message: 'Produsul nu a fost gasit.' });
    return;
  }

  if (
    !(await hasTable('categories')) ||
    !(await hasTable('product_images')) ||
    !(await hasTable('product_attributes')) ||
    !(await hasTable('product_option_values'))
  ) {
    const numericId = normalizeInteger(productIdentifier);
    const result = numericId
      ? await pool.query('SELECT * FROM products WHERE id = $1 LIMIT 1', [numericId])
      : await pool.query('SELECT * FROM products WHERE slug = $1 LIMIT 1', [productIdentifier]);
    const product = result.rows[0];
    if (!product) {
      sendJson(res, 404, { message: 'Produsul nu a fost gasit.' });
      return;
    }

    sendJson(res, 200, productResponse(product));
    return;
  }

  const numericProductId = normalizeInteger(productIdentifier);
  const productFilter = numericProductId
    ? 'p.id = $1'
    : 'p.slug = $1';
  const result = await pool.query(
    `
      SELECT
        p.*,
        c.name AS category_name,
        c.slug AS category_slug,
        COALESCE(primary_image.image_url, p.image_url) AS primary_image_url,
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', pi.id,
              'imageUrl', pi.image_url,
              'altText', pi.alt_text,
              'sortOrder', pi.sort_order,
              'isPrimary', pi.is_primary
            )
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::jsonb
        ) AS images,
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', pa.id,
              'key', pa.attribute_key,
              'value', pa.attribute_value,
              'sortOrder', pa.sort_order
            )
          ) FILTER (WHERE pa.id IS NOT NULL),
          '[]'::jsonb
        ) AS attributes,
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', pov.id,
              'optionName', pov.option_name,
              'optionValue', pov.option_value,
              'legacyOptionId', pov.legacy_option_id,
              'legacyOptionValueId', pov.legacy_option_value_id,
              'combinationId', pov.combination_id,
              'model', pov.model,
              'sku', pov.sku,
              'quantity', pov.quantity,
              'priceDelta', pov.price_delta,
              'pricePrefix', pov.price_prefix,
              'imageUrl', pov.image_url,
              'sortOrder', pov.sort_order
            )
          ) FILTER (WHERE pov.id IS NOT NULL),
          '[]'::jsonb
        ) AS variants,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', linked_category.id,
                'name', linked_category.name,
                'slug', linked_category.slug,
                'isPrimary', product_category.is_primary
              )
              ORDER BY product_category.is_primary DESC, linked_category.sort_order ASC, linked_category.name ASC
            )
            FROM product_categories product_category
            JOIN categories linked_category ON linked_category.id = product_category.category_id
            WHERE product_category.product_id = p.id
          ),
          '[]'::jsonb
        ) AS categories
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.id
        ORDER BY is_primary DESC, sort_order ASC, id ASC
        LIMIT 1
      ) primary_image ON true
      LEFT JOIN product_images pi ON pi.product_id = p.id
      LEFT JOIN product_attributes pa ON pa.product_id = p.id
      LEFT JOIN product_option_values pov ON pov.product_id = p.id
      WHERE ${productFilter} AND COALESCE(p.status, 'active') = 'active'
      GROUP BY p.id, c.id, primary_image.image_url
      LIMIT 1
    `,
    [numericProductId || productIdentifier],
  );
  const product = result.rows[0];
  if (!product) {
    sendJson(res, 404, { message: 'Produsul nu a fost gasit.' });
    return;
  }

  sendJson(res, 200, productResponse(product));
}

async function handleCategoryList(res) {
  if (!(await hasTable('categories'))) {
    sendJson(res, 200, []);
    return;
  }

  const result = await pool.query(`
    SELECT
      c.*,
      parent.name AS parent_name,
      parent.slug AS parent_slug,
      COUNT(DISTINCT p.id)::int AS product_count
    FROM categories c
    LEFT JOIN categories parent ON parent.id = c.parent_id
    LEFT JOIN product_categories pc ON pc.category_id = c.id
    LEFT JOIN products p ON p.id = pc.product_id AND COALESCE(p.status, 'active') = 'active'
    WHERE c.is_active = true
    GROUP BY c.id, parent.id
    ORDER BY c.sort_order ASC, c.name ASC
  `);

  sendJson(res, 200, result.rows.map(categoryResponse));
}

async function handleCategoryDetails(res, categoryIdentifier) {
  if (!(await hasTable('categories'))) {
    sendJson(res, 404, { message: 'Categoria nu a fost gasita.' });
    return;
  }

  const numericId = normalizeInteger(categoryIdentifier);
  const result = await pool.query(
    `
      SELECT
        c.*,
        parent.name AS parent_name,
        parent.slug AS parent_slug,
        COUNT(DISTINCT p.id)::int AS product_count
      FROM categories c
      LEFT JOIN categories parent ON parent.id = c.parent_id
      LEFT JOIN product_categories pc ON pc.category_id = c.id
      LEFT JOIN products p ON p.id = pc.product_id AND COALESCE(p.status, 'active') = 'active'
      WHERE ${numericId ? 'c.id = $1' : 'c.slug = $1'} AND c.is_active = true
      GROUP BY c.id, parent.id
      LIMIT 1
    `,
    [numericId || categoryIdentifier],
  );

  const category = result.rows[0];
  if (!category) {
    sendJson(res, 404, { message: 'Categoria nu a fost gasita.' });
    return;
  }

  sendJson(res, 200, categoryResponse(category));
}

async function handleAdminCategoryList(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  if (!(await hasTable('categories'))) {
    sendJson(res, 200, []);
    return;
  }

  const result = await pool.query(`
    SELECT
      c.*,
      parent.name AS parent_name,
      parent.slug AS parent_slug,
      COUNT(DISTINCT p.id)::int AS product_count
    FROM categories c
    LEFT JOIN categories parent ON parent.id = c.parent_id
    LEFT JOIN product_categories pc ON pc.category_id = c.id
    LEFT JOIN products p ON p.id = pc.product_id
    GROUP BY c.id, parent.id
    ORDER BY c.sort_order ASC, c.name ASC
  `);

  sendJson(res, 200, result.rows.map(categoryResponse));
}

async function handleAdminCategoryCreate(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  if (!(await hasTable('categories'))) {
    sendJson(res, 501, { message: 'Tabela de categorii nu este disponibila.' });
    return;
  }

  const body = await readJson(req);
  const input = normalizeAdminCategoryInput(body);

  if (input.parentId) {
    const parentResult = await pool.query('SELECT id FROM categories WHERE id = $1 LIMIT 1', [input.parentId]);
    if (parentResult.rowCount === 0) {
      sendJson(res, 400, { message: 'Categoria parinte selectata nu exista.' });
      return;
    }
  }

  const createdCategory = await withTransaction(async (client) => {
    const slug = await ensureUniqueCategorySlug(client, input.slug || input.name, null);
    const sortOrderResult = await client.query(
      'SELECT COALESCE(MAX(sort_order), 0)::int AS max_sort_order FROM categories WHERE parent_id IS NOT DISTINCT FROM $1',
      [input.parentId],
    );
    const nextSortOrder = Number(sortOrderResult.rows[0]?.max_sort_order || 0) + 1;

    const inserted = await insertRowWithClient(client, 'categories', {
      name: input.name,
      slug,
      parent_id: input.parentId,
      is_active: true,
      sort_order: nextSortOrder,
      updated_at: new Date(),
    });

    const result = await client.query(
      `
        SELECT
          c.*,
          parent.name AS parent_name,
          parent.slug AS parent_slug,
          0::int AS product_count
        FROM categories c
        LEFT JOIN categories parent ON parent.id = c.parent_id
        WHERE c.id = $1
        LIMIT 1
      `,
      [inserted.id],
    );

    return result.rows[0];
  }).catch((error) => {
    if (error.code === '23505') {
      const conflict = new Error('Exista deja o categorie cu acest slug.');
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  });

  sendJson(res, 201, categoryResponse(createdCategory));
}

async function handleAdminProductList(req, requestUrl, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const search = String(requestUrl.searchParams.get('q') || '').trim().toLowerCase();
  const products = await getAdminProducts();
  const filtered = search
    ? products.filter((product) =>
        [product.name, product.slug, product.sku]
          .map((value) => String(value || '').toLowerCase())
          .some((value) => value.includes(search)),
      )
    : products;

  sendJson(res, 200, filtered);
}

async function handleAdminProductDetails(req, res, productId) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const product = await getAdminProductById(productId);
  if (!product) {
    sendJson(res, 404, { message: 'Produsul nu a fost gasit.' });
    return;
  }

  sendJson(res, 200, product);
}

async function handleAdminProductCreate(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const body = await readJson(req);
  const input = normalizeAdminProductInput(body);
  await assertCategoryIdsExist(input.categoryIds);

  const product = await withTransaction(async (client) => {
    const slug = await ensureUniqueProductSlug(client, input.slug || input.name, null);
    const inserted = await insertRowWithClient(client, 'products', {
      name: input.name,
      slug,
      description: input.description,
      short_description: input.shortDescription,
      price: input.price,
      compare_at_price: input.compareAtPrice,
      currency: input.currency,
      sku: input.sku,
      stock_quantity: input.stockQuantity,
      status: input.status,
      image_url: input.imageUrl,
      material: input.material,
      category_id: input.primaryCategoryId,
      updated_at: new Date(),
    });

    await syncProductRelations(client, inserted.id, input);
    return getAdminProductById(inserted.id, client);
  }).catch((error) => translateProductMutationError(error));

  sendJson(res, 201, product);
}

async function handleAdminProductUpdate(req, res, productId) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const existing = await getAdminProductById(productId);
  if (!existing) {
    sendJson(res, 404, { message: 'Produsul nu a fost gasit.' });
    return;
  }

  const body = await readJson(req);
  const input = normalizeAdminProductInput(body);
  await assertCategoryIdsExist(input.categoryIds);

  const product = await withTransaction(async (client) => {
    const slug = await ensureUniqueProductSlug(client, input.slug || input.name, productId);
    const updated = await updateRowWithClient(client, 'products', productId, {
      name: input.name,
      slug,
      description: input.description,
      short_description: input.shortDescription,
      price: input.price,
      compare_at_price: input.compareAtPrice,
      currency: input.currency,
      sku: input.sku,
      stock_quantity: input.stockQuantity,
      status: input.status,
      image_url: input.imageUrl,
      material: input.material,
      category_id: input.primaryCategoryId,
      updated_at: new Date(),
    });

    await syncProductRelations(client, productId, input);
    return updated ? getAdminProductById(productId, client) : null;
  }).catch((error) => translateProductMutationError(error));

  if (!product) {
    sendJson(res, 404, { message: 'Produsul nu a fost gasit.' });
    return;
  }

  sendJson(res, 200, product);
}

async function handleAdminProductDelete(req, res, productId) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [productId]);
  if (result.rowCount === 0) {
    sendJson(res, 404, { message: 'Produsul nu a fost gasit.' });
    return;
  }

  sendJson(res, 200, { ok: true });
}

async function handleAdminOrderList(req, requestUrl, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const search = String(requestUrl.searchParams.get('q') || '').trim().toLowerCase();
  const status = String(requestUrl.searchParams.get('status') || '').trim().toLowerCase();
  const paymentStatus = String(requestUrl.searchParams.get('paymentStatus') || '').trim().toLowerCase();
  const orders = await getAdminOrders();

  const filtered = orders.filter((order) => {
    const matchesSearch =
      !search ||
      [
        order.orderNumber,
        order.customer?.name,
        order.customer?.email,
        ...order.items.map((item) => item.productName),
      ]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(search));

    const matchesStatus = !status || String(order.status || '').toLowerCase() === status;
    const matchesPaymentStatus =
      !paymentStatus || String(order.paymentStatus || '').toLowerCase() === paymentStatus;

    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  sendJson(res, 200, filtered);
}

async function handleAdminOrderUpdate(req, res, orderId) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const existing = await getAdminOrderById(orderId);
  if (!existing) {
    sendJson(res, 404, { message: 'Comanda nu a fost gasita.' });
    return;
  }

  const body = await readJson(req);
  const input = normalizeAdminOrderUpdateInput(body, existing);

  await updateRow('orders', orderId, input);
  const updated = await getAdminOrderById(orderId);

  sendJson(res, 200, updated);
}

async function handleAdminConversationList(req, requestUrl, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  if (!(await hasTable('conversations')) || !(await hasTable('conversation_messages'))) {
    sendJson(res, 200, []);
    return;
  }

  const search = String(requestUrl.searchParams.get('q') || '').trim().toLowerCase();
  const status = String(requestUrl.searchParams.get('status') || '').trim().toLowerCase();
  const source = String(requestUrl.searchParams.get('source') || '').trim().toLowerCase();
  const conversations = await getAdminConversations();

  const filtered = conversations.filter((conversation) => {
    const matchesSearch =
      !search ||
      [
        conversation.customerName,
        conversation.customerEmail,
        conversation.customerPhone,
        conversation.contactDetail,
        conversation.subject,
        conversation.lastMessagePreview,
        ...conversation.messages.map((message) => message.messageText),
      ]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(search));

    const matchesStatus = !status || String(conversation.status || '').toLowerCase() === status;
    const matchesSource = !source || String(conversation.source || '').toLowerCase() === source;

    return matchesSearch && matchesStatus && matchesSource;
  });

  sendJson(res, 200, filtered);
}

async function handleAdminConversationUpdate(req, res, conversationId) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  if (!(await hasTable('conversations'))) {
    sendJson(res, 404, { message: 'Conversatia nu a fost gasita.' });
    return;
  }

  const existing = await getAdminConversationById(conversationId);
  if (!existing) {
    sendJson(res, 404, { message: 'Conversatia nu a fost gasita.' });
    return;
  }

  const body = await readJson(req);
  const input = normalizeAdminConversationUpdateInput(body);

  await updateRow('conversations', conversationId, {
    ...input,
    updated_at: new Date(),
  });
  const updated = await getAdminConversationById(conversationId);

  sendJson(res, 200, updated);
}

async function handleAdminConversationReply(req, res, conversationId) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  if (!(await hasTable('conversations')) || !(await hasTable('conversation_messages'))) {
    sendJson(res, 404, { message: 'Conversatia nu a fost gasita.' });
    return;
  }

  const existing = await getAdminConversationById(conversationId);
  if (!existing) {
    sendJson(res, 404, { message: 'Conversatia nu a fost gasita.' });
    return;
  }

  const body = await readJson(req);
  const replyText = String(body.message || '').trim();
  if (!replyText) {
    sendJson(res, 400, { message: 'Mesajul de raspuns este obligatoriu.' });
    return;
  }

  const recipientEmail = normalizeEmail(existing.customerEmail || '');
  if (!recipientEmail || !isEmail(recipientEmail)) {
    sendJson(res, 400, { message: 'Conversatia nu are o adresa de email valida pentru raspuns.' });
    return;
  }

  const replyResult = await brevoMailer.sendConversationReplyEmail(existing, replyText);
  if (replyResult?.skipped) {
    sendJson(res, 503, { message: 'Emailul de raspuns nu a putut fi trimis momentan.' });
    return;
  }

  const conversationMessageColumns = await getConversationMessageColumns();
  const replyAuthorName = buildAdminUserDisplayName(user);

  await withTransaction(async (client) => {
    const insertColumns = ['conversation_id', 'direction', 'source', 'message_text', 'attachments', 'sent_at'];
    const insertValues = [conversationId, 'outbound', 'email', replyText, '[]', new Date()];

    if (conversationMessageColumns.has('author_user_id')) {
      insertColumns.push('author_user_id');
      insertValues.push(user.id);
    }

    if (conversationMessageColumns.has('author_name')) {
      insertColumns.push('author_name');
      insertValues.push(replyAuthorName);
    }

    const insertParams = insertValues.map((_, index) => `$${index + 1}`);
    await client.query(
      `
        INSERT INTO conversation_messages (${insertColumns.join(', ')})
        VALUES (${insertParams.join(', ')})
      `,
      insertValues,
    );

    await client.query(
      `
        UPDATE conversations
        SET
          status = $2,
          last_message_preview = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [conversationId, existing.status === 'nou' ? 'in_curs' : existing.status, replyText.slice(0, 280)],
    );
  });

  const updated = await getAdminConversationById(conversationId);
  sendJson(res, 200, updated);
}

async function getAdminOrders(db = pool) {
  if (!(await hasTable('orders')) || !(await hasTable('order_items'))) {
    return [];
  }

  const result = await db.query(`${await adminOrderSelectSql()} ORDER BY o.created_at DESC`);
  return result.rows.map(adminOrderResponse);
}

async function getAdminConversations(db = pool) {
  if (!(await hasTable('conversations')) || !(await hasTable('conversation_messages'))) {
    return [];
  }

  const result = await db.query(
    `${await adminConversationSelectSql()}
     ORDER BY COALESCE(messages.last_message_at, c.updated_at, c.created_at) DESC, c.id DESC`,
  );
  return result.rows.map(adminConversationResponse);
}

async function getAdminConversationById(conversationId, db = pool) {
  if (!(await hasTable('conversations')) || !(await hasTable('conversation_messages'))) {
    return null;
  }

  const result = await db.query(`${await adminConversationSelectSql()} WHERE c.id = $1`, [conversationId]);
  return result.rows[0] ? adminConversationResponse(result.rows[0]) : null;
}

async function getAdminOrderById(orderId, db = pool) {
  if (!(await hasTable('orders')) || !(await hasTable('order_items'))) {
    return null;
  }

  const result = await db.query(`${await adminOrderSelectSql()} WHERE o.id = $1`, [orderId]);
  return result.rows[0] ? adminOrderResponse(result.rows[0]) : null;
}

async function adminOrderSelectSql() {
  const userColumns = await getUserColumns();
  const orderColumns = await getOrderColumns();
  const userNameSelect = buildAdminOrderUserNameSql(userColumns);
  const shipmentSelect = buildAdminOrderShipmentSql(orderColumns);

  return `
    SELECT
      o.*,
      ${userNameSelect} AS user_name,
      u.email AS user_email,
      ${shipmentSelect},
      COALESCE(items.items, '[]'::jsonb) AS items,
      COALESCE(items.item_count, 0)::int AS item_count
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN LATERAL (
      SELECT
        jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'productId', oi.product_id,
            'productName', oi.product_name,
            'productImageUrl', oi.product_image_url,
            'sku', oi.sku,
            'selectedOptions', oi.selected_options,
            'unitPrice', oi.unit_price,
            'quantity', oi.quantity,
            'lineTotal', oi.line_total
          )
          ORDER BY oi.id ASC
        ) AS items,
        COALESCE(SUM(oi.quantity), 0) AS item_count
      FROM order_items oi
      WHERE oi.order_id = o.id
    ) items ON true
  `;
}

async function adminConversationSelectSql() {
  const conversationMessageColumns = await getConversationMessageColumns();
  const authorUserIdSelect = conversationMessageColumns.has('author_user_id')
    ? 'cm.author_user_id'
    : 'NULL';
  const authorNameSelect = conversationMessageColumns.has('author_name')
    ? 'cm.author_name'
    : 'NULL';

  return `
    SELECT
      c.*,
      COALESCE(messages.messages, '[]'::jsonb) AS messages,
      COALESCE(messages.message_count, 0)::int AS message_count,
      messages.last_message_at
    FROM conversations c
    LEFT JOIN LATERAL (
      SELECT
        jsonb_agg(
          jsonb_build_object(
            'id', cm.id,
            'direction', cm.direction,
            'source', cm.source,
            'messageText', cm.message_text,
            'sentAt', cm.sent_at,
            'attachments', cm.attachments,
            'authorUserId', ${authorUserIdSelect},
            'authorName', ${authorNameSelect}
          )
          ORDER BY cm.sent_at ASC, cm.id ASC
        ) AS messages,
        COUNT(*) AS message_count,
        MAX(cm.sent_at) AS last_message_at
      FROM conversation_messages cm
      WHERE cm.conversation_id = c.id
    ) messages ON true
  `;
}

function buildAdminOrderShipmentSql(orderColumns) {
  const field = (column, alias) =>
    orderColumns.has(column) ? `o.${column} AS ${alias}` : `NULL AS ${alias}`;

  return [
    field('courier', 'courier'),
    field('tracking_number', 'tracking_number'),
    field('tracking_url', 'tracking_url'),
    orderColumns.has('package_status')
      ? `o.package_status AS package_status`
      : `'nepregatit'::varchar AS package_status`,
    orderColumns.has('package_count')
      ? `o.package_count AS package_count`
      : `1::int AS package_count`,
    field('packed_at', 'packed_at'),
    field('shipped_at', 'shipped_at'),
    field('invoice_number', 'invoice_number'),
    orderColumns.has('invoice_status')
      ? `o.invoice_status AS invoice_status`
      : `'negenerata'::varchar AS invoice_status`,
    field('invoice_url', 'invoice_url'),
    field('invoice_issued_at', 'invoice_issued_at'),
    field('billing_company', 'billing_company'),
    field('billing_vat', 'billing_vat'),
  ].join(',\n      ');
}

function buildAdminOrderUserNameSql(userColumns) {
  const parts = [];

  if (userColumns.has('full_name')) {
    parts.push('NULLIF(BTRIM(u.full_name), \'\')');
  }

  const firstNameColumn = userColumns.has('first_name')
    ? 'first_name'
    : userColumns.has('prenume')
      ? 'prenume'
      : null;
  const lastNameColumn = userColumns.has('last_name')
    ? 'last_name'
    : userColumns.has('nume')
      ? 'nume'
      : null;

  if (firstNameColumn || lastNameColumn) {
    const firstExpr = firstNameColumn ? `COALESCE(u.${firstNameColumn}, '')` : `''`;
    const lastExpr = lastNameColumn ? `COALESCE(u.${lastNameColumn}, '')` : `''`;
    parts.push(`NULLIF(BTRIM(${firstExpr} || ' ' || ${lastExpr}), '')`);
  }

  if (userColumns.has('name')) {
    parts.push('NULLIF(BTRIM(u.name), \'\')');
  }

  parts.push(`SPLIT_PART(COALESCE(u.email, ''), '@', 1)`);

  return `COALESCE(${parts.join(', ')})`;
}

function normalizeAdminConversationUpdateInput(body) {
  const updates = {};
  const nextStatus = cleanOptionalValue(body.status);
  const allowedStatuses = ['nou', 'in_curs', 'rezolvat', 'spam'];

  if (nextStatus) {
    if (!allowedStatuses.includes(nextStatus)) {
      const error = new Error('Statusul conversatiei nu este valid.');
      error.status = 400;
      throw error;
    }

    updates.status = nextStatus;
  }

  return updates;
}

function adminConversationResponse(conversation) {
  const messages = normalizeJsonArray(conversation.messages).map((message) => ({
    id: message.id,
    direction: message.direction || 'inbound',
    source: message.source || 'website',
    messageText: message.messageText || message.message_text || '',
    sentAt: message.sentAt || message.sent_at || null,
    authorUserId: message.authorUserId || message.author_user_id || null,
    authorName: message.authorName || message.author_name || '',
    attachments: normalizeJsonArray(message.attachments),
  }));

  return {
    id: conversation.id,
    customerName: conversation.customer_name || '',
    customerEmail: conversation.customer_email || '',
    customerPhone: conversation.customer_phone || '',
    contactDetail: conversation.contact_detail || '',
    source: conversation.source || 'website',
    status: conversation.status || 'nou',
    subject: conversation.subject || '',
    lastMessagePreview: conversation.last_message_preview || '',
    lastMessageAt: conversation.last_message_at || messages[messages.length - 1]?.sentAt || null,
    messageCount: Number(conversation.message_count || messages.length),
    createdAt: conversation.created_at || null,
    updatedAt: conversation.updated_at || null,
    messages,
  };
}

function normalizeAdminOrderUpdateInput(body, existingOrder) {
  const nextStatus = cleanOptionalValue(body.status) || existingOrder.status;
  const nextPaymentStatus = cleanOptionalValue(body.paymentStatus) || existingOrder.paymentStatus;
  const nextPackageStatus = cleanOptionalValue(body.packageStatus) || existingOrder.packageStatus || 'nepregatit';
  const nextInvoiceStatus = cleanOptionalValue(body.invoiceStatus) || existingOrder.invoiceStatus || 'negenerata';
  const allowedStatuses = [
    'Plasata',
    'Confirmata',
    'In procesare',
    'Expediata',
    'Livrata',
    'Anulata',
    'Returnata',
  ];
  const allowedPaymentStatuses = ['unpaid', 'pending', 'paid', 'failed', 'refunded'];
  const allowedPackageStatuses = ['nepregatit', 'pregatit', 'impachetat', 'expediat', 'livrat', 'retur'];
  const allowedInvoiceStatuses = ['negenerata', 'generata', 'trimisa', 'anulata'];

  if (!allowedStatuses.includes(nextStatus)) {
    const error = new Error('Statusul comenzii nu este valid.');
    error.status = 400;
    throw error;
  }

  if (!allowedPaymentStatuses.includes(nextPaymentStatus)) {
    const error = new Error('Statusul platii nu este valid.');
    error.status = 400;
    throw error;
  }

  if (!allowedPackageStatuses.includes(nextPackageStatus)) {
    const error = new Error('Statusul coletului nu este valid.');
    error.status = 400;
    throw error;
  }

  if (!allowedInvoiceStatuses.includes(nextInvoiceStatus)) {
    const error = new Error('Statusul facturii nu este valid.');
    error.status = 400;
    throw error;
  }

  const updates = {
    status: nextStatus,
    payment_status: nextPaymentStatus,
    paid_at: nextPaymentStatus === 'paid' ? existingOrder.paidAt || new Date() : null,
    cancelled_at: nextStatus === 'Anulata' ? new Date() : null,
    updated_at: new Date(),
  };

  // Shipment fields are optional because older databases may not have the migration yet.
  const shipmentColumns = orderColumnsCache;
  if (shipmentColumns?.has('courier')) {
    updates.courier = cleanOptionalValue(body.courier);
  }
  if (shipmentColumns?.has('tracking_number')) {
    updates.tracking_number = cleanOptionalValue(body.trackingNumber);
  }
  if (shipmentColumns?.has('tracking_url')) {
    updates.tracking_url = cleanOptionalValue(body.trackingUrl);
  }
  if (shipmentColumns?.has('package_status')) {
    updates.package_status = nextPackageStatus;
  }
  if (shipmentColumns?.has('package_count') && Object.prototype.hasOwnProperty.call(body, 'packageCount')) {
    updates.package_count = normalizeWholeNumber(
      body.packageCount,
      'Numarul de colete trebuie sa fie un numar intreg.',
    );
  }
  if (shipmentColumns?.has('packed_at')) {
    updates.packed_at =
      nextPackageStatus === 'pregatit' || nextPackageStatus === 'impachetat' || nextPackageStatus === 'expediat' || nextPackageStatus === 'livrat'
        ? existingOrder.packedAt || new Date()
        : null;
  }
  if (shipmentColumns?.has('shipped_at')) {
    updates.shipped_at =
      nextPackageStatus === 'expediat' || nextPackageStatus === 'livrat'
        ? existingOrder.shippedAt || new Date()
        : null;
  }
  if (shipmentColumns?.has('invoice_number')) {
    updates.invoice_number = cleanOptionalValue(body.invoiceNumber);
  }
  if (shipmentColumns?.has('invoice_status')) {
    updates.invoice_status = nextInvoiceStatus;
  }
  if (shipmentColumns?.has('invoice_url')) {
    updates.invoice_url = cleanOptionalValue(body.invoiceUrl);
  }
  if (shipmentColumns?.has('invoice_issued_at')) {
    updates.invoice_issued_at =
      nextInvoiceStatus === 'generata' || nextInvoiceStatus === 'trimisa'
        ? existingOrder.invoiceIssuedAt || new Date()
        : null;
  }
  if (shipmentColumns?.has('billing_company')) {
    updates.billing_company = cleanOptionalValue(body.billingCompany);
  }
  if (shipmentColumns?.has('billing_vat')) {
    updates.billing_vat = cleanOptionalValue(body.billingVat);
  }

  return updates;
}

async function getAdminProducts(db = pool) {
  if (!(await hasTable('products'))) {
    return [];
  }

  const result = await db.query(adminProductSelectSql());
  return result.rows.map(productResponse);
}

async function getAdminProductById(productId, db = pool) {
  if (!(await hasTable('products'))) {
    return null;
  }

  const result = await db.query(`${adminProductSelectSql()} WHERE p.id = $1`, [productId]);
  return result.rows[0] ? productResponse(result.rows[0]) : null;
}

function adminProductSelectSql() {
  return `
    SELECT
      p.*,
      c.name AS category_name,
      c.slug AS category_slug,
      COALESCE(primary_image.image_url, p.image_url) AS primary_image_url,
      COALESCE(images.images, '[]'::jsonb) AS images,
      COALESCE(attributes.attributes, '[]'::jsonb) AS attributes,
      COALESCE(variants.variants, '[]'::jsonb) AS variants,
      COALESCE(categories.categories, '[]'::jsonb) AS categories
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN LATERAL (
      SELECT image_url
      FROM product_images
      WHERE product_id = p.id
      ORDER BY is_primary DESC, sort_order ASC, id ASC
      LIMIT 1
    ) primary_image ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pi.id,
          'imageUrl', pi.image_url,
          'altText', pi.alt_text,
          'sortOrder', pi.sort_order,
          'isPrimary', pi.is_primary
        )
        ORDER BY pi.sort_order ASC, pi.id ASC
      ) AS images
      FROM product_images pi
      WHERE pi.product_id = p.id
    ) images ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pa.id,
          'key', pa.attribute_key,
          'value', pa.attribute_value,
          'sortOrder', pa.sort_order
        )
        ORDER BY pa.sort_order ASC, pa.id ASC
      ) AS attributes
      FROM product_attributes pa
      WHERE pa.product_id = p.id
    ) attributes ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pov.id,
          'optionName', pov.option_name,
          'optionValue', pov.option_value,
          'legacyOptionId', pov.legacy_option_id,
          'legacyOptionValueId', pov.legacy_option_value_id,
          'combinationId', pov.combination_id,
          'model', pov.model,
          'sku', pov.sku,
          'quantity', pov.quantity,
          'priceDelta', pov.price_delta,
          'pricePrefix', pov.price_prefix,
          'imageUrl', pov.image_url,
          'sortOrder', pov.sort_order
        )
        ORDER BY pov.sort_order ASC, pov.id ASC
      ) AS variants
      FROM product_option_values pov
      WHERE pov.product_id = p.id
    ) variants ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', linked_category.id,
          'name', linked_category.name,
          'slug', linked_category.slug,
          'isPrimary', product_category.is_primary
        )
        ORDER BY product_category.is_primary DESC, linked_category.sort_order ASC, linked_category.name ASC
      ) AS categories
      FROM product_categories product_category
      JOIN categories linked_category ON linked_category.id = product_category.category_id
      WHERE product_category.product_id = p.id
    ) categories ON true
  `;
}

function normalizeAdminProductInput(body) {
  const name = String(body.name || '').trim();
  if (!name) {
    const error = new Error('Numele produsului este obligatoriu.');
    error.status = 400;
    throw error;
  }

  const status = String(body.status || 'draft').trim().toLowerCase();
  if (!['draft', 'active', 'archived'].includes(status)) {
    const error = new Error('Statusul produsului nu este valid.');
    error.status = 400;
    throw error;
  }

  const categoryIds = uniqueNumbers([...(Array.isArray(body.categoryIds) ? body.categoryIds : []), body.categoryId]);
  const images = normalizeAdminImages(body.images);
  const attributes = normalizeAdminAttributes(body.attributes);
  const variants = normalizeAdminVariants(body.variants);
  const primaryImage = images.find((image) => image.isPrimary) || images[0] || null;

  return {
    name,
    slug: slugify(String(body.slug || '').trim()),
    description: cleanOptionalValue(body.description),
    shortDescription: cleanOptionalValue(body.shortDescription),
    price: normalizeMoneyInput(body.price, 'Pretul de baza este obligatoriu.'),
    compareAtPrice: normalizeNullableMoney(body.compareAtPrice),
    currency: String(body.currency || 'RON').trim().toUpperCase() || 'RON',
    sku: cleanOptionalValue(body.sku),
    stockQuantity: normalizeWholeNumber(body.stockQuantity, 'Stocul trebuie sa fie un numar intreg.'),
    status,
    imageUrl: cleanOptionalValue(body.imageUrl) || primaryImage?.imageUrl || null,
    material: cleanOptionalValue(body.material),
    categoryIds,
    primaryCategoryId: categoryIds[0] ?? null,
    images,
    attributes,
    variants,
  };
}

function normalizeAdminCategoryInput(body) {
  const name = String(body.name || '').trim();
  if (!name) {
    const error = new Error('Numele categoriei este obligatoriu.');
    error.status = 400;
    throw error;
  }

  return {
    name,
    slug: slugify(String(body.slug || '').trim()),
    parentId: normalizeNullableInteger(body.parentId),
  };
}

function normalizeAdminImages(images) {
  if (!Array.isArray(images)) return [];

  return images
    .map((image, index) => ({
      imageUrl: cleanOptionalValue(image?.imageUrl || image?.url || image),
      altText: cleanOptionalValue(image?.altText),
      sortOrder: normalizeWholeNumber(image?.sortOrder ?? index, 'Ordinea imaginilor trebuie sa fie numar intreg.'),
      isPrimary: Boolean(image?.isPrimary),
    }))
    .filter((image) => image.imageUrl);
}

function normalizeAdminAttributes(attributes) {
  if (!Array.isArray(attributes)) return [];

  return attributes
    .map((attribute, index) => ({
      key: String(attribute?.key || '').trim(),
      value: String(attribute?.value || '').trim(),
      sortOrder: normalizeWholeNumber(
        attribute?.sortOrder ?? index,
        'Ordinea atributelor trebuie sa fie numar intreg.',
      ),
    }))
    .filter((attribute) => attribute.key && attribute.value);
}

function normalizeAdminVariants(variants) {
  if (!Array.isArray(variants)) return [];

  return variants
    .map((variant, index) => {
      const optionName = String(variant?.optionName || '').trim();
      const optionValue = String(variant?.optionValue || '').trim();
      if (!optionName || !optionValue) return null;

      const pricePrefix = String(variant?.pricePrefix || '+').trim();
      if (!['+', '-'].includes(pricePrefix)) {
        const error = new Error('Prefixul diferentei de pret trebuie sa fie + sau -.');
        error.status = 400;
        throw error;
      }

      return {
        optionName,
        optionValue,
        legacyOptionId: normalizeNullableInteger(variant?.legacyOptionId),
        legacyOptionValueId: normalizeNullableInteger(variant?.legacyOptionValueId),
        combinationId: cleanOptionalValue(variant?.combinationId),
        model: cleanOptionalValue(variant?.model),
        sku: cleanOptionalValue(variant?.sku),
        quantity: normalizeWholeNumber(variant?.quantity ?? 0, 'Cantitatea variantei trebuie sa fie numar intreg.'),
        priceDelta: normalizeMoneyInput(variant?.priceDelta ?? 0, 'Diferenta de pret a variantei nu este valida.'),
        pricePrefix,
        imageUrl: cleanOptionalValue(variant?.imageUrl),
        sortOrder: normalizeWholeNumber(variant?.sortOrder ?? index, 'Ordinea variantelor trebuie sa fie numar intreg.'),
      };
    })
    .filter(Boolean);
}

async function assertCategoryIdsExist(categoryIds) {
  if (!categoryIds.length) return;

  const result = await pool.query(
    'SELECT id FROM categories WHERE id = ANY($1::int[])',
    [categoryIds],
  );
  if (result.rowCount !== categoryIds.length) {
    const error = new Error('Una sau mai multe categorii selectate nu exista.');
    error.status = 400;
    throw error;
  }
}

async function syncProductRelations(client, productId, input) {
  await syncProductCategories(client, productId, input.categoryIds);
  await syncProductImages(client, productId, input.images, input.imageUrl);
  await syncProductAttributes(client, productId, input.attributes);
  await syncProductVariants(client, productId, input.variants);
}

async function syncProductCategories(client, productId, categoryIds) {
  await client.query('DELETE FROM product_categories WHERE product_id = $1', [productId]);
  for (const [index, categoryId] of categoryIds.entries()) {
    await client.query(
      'INSERT INTO product_categories (product_id, category_id, is_primary) VALUES ($1, $2, $3)',
      [productId, categoryId, index === 0],
    );
  }
}

async function syncProductImages(client, productId, images, fallbackImageUrl) {
  await client.query('DELETE FROM product_images WHERE product_id = $1', [productId]);

  const normalizedImages = images.length
    ? images.map((image, index) => ({
        ...image,
        isPrimary: image.isPrimary || index === 0,
      }))
    : fallbackImageUrl
      ? [{ imageUrl: fallbackImageUrl, altText: null, sortOrder: 0, isPrimary: true }]
      : [];

  for (const image of normalizedImages) {
    await client.query(
      `
        INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [productId, image.imageUrl, image.altText, image.sortOrder, image.isPrimary],
    );
  }
}

async function syncProductAttributes(client, productId, attributes) {
  await client.query('DELETE FROM product_attributes WHERE product_id = $1', [productId]);

  for (const attribute of attributes) {
    await client.query(
      `
        INSERT INTO product_attributes (product_id, attribute_key, attribute_value, sort_order)
        VALUES ($1, $2, $3, $4)
      `,
      [productId, attribute.key, attribute.value, attribute.sortOrder],
    );
  }
}

async function syncProductVariants(client, productId, variants) {
  await client.query('DELETE FROM product_option_values WHERE product_id = $1', [productId]);

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
          sort_order,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
      `,
      [
        productId,
        variant.optionName,
        variant.optionValue,
        variant.legacyOptionId,
        variant.legacyOptionValueId,
        variant.combinationId,
        variant.model,
        variant.sku,
        variant.quantity,
        variant.priceDelta,
        variant.pricePrefix,
        variant.imageUrl,
        variant.sortOrder,
      ],
    );
  }
}

async function ensureUniqueProductSlug(db, rawValue, excludeProductId) {
  const base = slugify(rawValue) || `produs-${Date.now()}`;
  let candidate = base;
  let counter = 2;

  while (true) {
    const values = [candidate];
    let sql = 'SELECT id FROM products WHERE slug = $1';
    if (excludeProductId) {
      values.push(excludeProductId);
      sql += ' AND id <> $2';
    }
    sql += ' LIMIT 1';

    const result = await db.query(sql, values);
    if (result.rowCount === 0) return candidate;

    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

async function ensureUniqueCategorySlug(db, rawValue, excludeCategoryId) {
  const base = slugify(rawValue) || `categorie-${Date.now()}`;
  let candidate = base;
  let counter = 2;

  while (true) {
    const values = [candidate];
    let sql = 'SELECT id FROM categories WHERE slug = $1';
    if (excludeCategoryId) {
      values.push(excludeCategoryId);
      sql += ' AND id <> $2';
    }
    sql += ' LIMIT 1';

    const result = await db.query(sql, values);
    if (result.rowCount === 0) return candidate;

    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

function translateProductMutationError(error) {
  if (error.code === '23505') {
    const conflict = new Error('Slugul sau SKU-ul exista deja pentru alt produs.');
    conflict.status = 409;
    throw conflict;
  }

  throw error;
}

async function handleGoogleStart(res) {
  if (!config.googleClientId || !config.googleClientSecret) {
    sendJson(res, 501, {
      message: 'Google authentication is not configured.',
    });
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', config.googleClientId);
  googleUrl.searchParams.set('redirect_uri', config.googleCallbackUrl);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('prompt', 'select_account');
  googleUrl.searchParams.set('state', state);

  res.writeHead(302, {
    Location: googleUrl.toString(),
    'Set-Cookie': `google_oauth_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`,
  });
  res.end();
}

async function handleGoogleCallback(req, requestUrl, res) {
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const storedState = parseCookies(req.headers.cookie || '').google_oauth_state;

  if (!code || !state || !storedState || state !== storedState) {
    redirectToFrontend(res, '/autentificare?error=google');
    return;
  }

  let tokenResponse;
  try {
    tokenResponse = await postForm('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleCallbackUrl,
      grant_type: 'authorization_code',
    });
  } catch {
    redirectToFrontend(res, '/autentificare?error=google');
    return;
  }

  if (!tokenResponse.id_token) {
    redirectToFrontend(res, '/autentificare?error=google');
    return;
  }

  const googleProfile = decodeJwtPayload(tokenResponse.id_token);
  const email = normalizeEmail(googleProfile.email);
  const fullName = String(googleProfile.name || email.split('@')[0] || 'Google user').trim();

  if (!email || googleProfile.email_verified === false) {
    redirectToFrontend(res, '/autentificare?error=google');
    return;
  }

  const user = await findOrCreateGoogleUser({ email, fullName });
  const authToken = signToken({ sub: user.id, email: user.email });
  res.setHeader('Set-Cookie', [
    `${config.cookieName}=${authToken}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`,
    'google_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
  ]);
  redirectToFrontend(res, '/');
}

async function handleRegister(req, res) {
  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const fullName = buildFullName(body);

  if (!email || !isEmail(email)) {
    sendJson(res, 400, { message: 'Emailul nu este valid.' });
    return;
  }

  if (password.length < 8) {
    sendJson(res, 400, { message: 'Parola trebuie sa aiba cel putin 8 caractere.' });
    return;
  }

  if (!fullName) {
    sendJson(res, 400, { message: 'Numele este obligatoriu.' });
    return;
  }

  const columns = await getUserColumns();
  const passwordHash = await hashPassword(password);
  const insertData = {
    full_name: fullName,
    email,
    password_hash: passwordHash,
  };

  if (columns.has('role')) {
    insertData.role = roleForEmail(email);
  }

  addOptionalUserData(insertData, columns, body);

  const insertedUser = await insertUser(insertData).catch((error) => {
    if (error.code === '23505') {
      const conflict = new Error('Exista deja un cont cu acest email.');
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  });

  setAuthCookie(res, signToken({ sub: insertedUser.id, email: insertedUser.email }));
  void bestEffortEmail('welcome email', () => brevoMailer.sendWelcomeEmail(insertedUser));
  sendJson(res, 201, { user: publicUser(insertedUser) });
}

async function findOrCreateGoogleUser({ email, fullName }) {
  const existing = await pool.query(
    'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
    [email],
  );

  if (existing.rows[0]) return existing.rows[0];

  const columns = await getUserColumns();
  const insertData = {
    full_name: fullName,
    email,
    password_hash: `google$${crypto.randomBytes(32).toString('hex')}`,
  };

  if (columns.has('role')) {
    insertData.role = roleForEmail(email);
  }

  return insertUser(insertData);
}

async function handleLogin(req, res) {
  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!email || !password) {
    sendJson(res, 400, { message: 'Emailul si parola sunt obligatorii.' });
    return;
  }

  const userColumns = await getUserColumns();
  const selectRole = userColumns.has('role') ? ', role' : '';
  const result = await pool.query(
    `SELECT id, full_name, email, password_hash${selectRole} FROM users WHERE lower(email) = lower($1) LIMIT 1`,
    [email],
  );
  const user = result.rows[0];

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    sendJson(res, 401, { message: 'Emailul sau parola nu sunt corecte.' });
    return;
  }

  setAuthCookie(res, signToken({ sub: user.id, email: user.email }));
  sendJson(res, 200, { user: publicUser(user) });
}

async function handleMe(req, res) {
  const user = await getCurrentUser(req);
  if (!user) {
    sendJson(res, 200, { authenticated: false });
    return;
  }

  sendJson(res, 200, {
    authenticated: true,
    user: publicUser(user),
  });
}

async function handleAdminMe(req, res) {
  const user = await getCurrentUser(req);
  if (!user) {
    sendJson(res, 200, { authenticated: false, isAdmin: false });
    return;
  }

  sendJson(res, 200, {
    authenticated: true,
    isAdmin: isAdminUser(user),
    user: publicUser(user),
  });
}

async function handleProfile(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  sendJson(res, 200, profileResponse(user));
}

async function handleProfileUpdate(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const body = await readJson(req);
  const columns = await getUserColumns();
  const updates = {};

  if (columns.has('full_name') && typeof body.fullName === 'string') {
    updates.full_name = body.fullName.trim();
  }

  const map = {
    phone: 'phone',
    preferences: 'client_type',
    companyName: 'company_name',
    cui: 'cui',
    tradeRegisterNumber: 'trade_register_number',
    birthDate: 'birth_date',
  };

  for (const [bodyKey, columnName] of Object.entries(map)) {
    if (columns.has(columnName) && Object.prototype.hasOwnProperty.call(body, bodyKey)) {
      updates[columnName] = cleanOptionalValue(body[bodyKey]);
    }
  }

  const updated = await updateUser(user.id, updates);
  sendJson(res, 200, profileResponse(updated || user));
}

async function handleEmailUpdate(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  if (!email || !isEmail(email)) {
    sendJson(res, 400, { message: 'Emailul nu este valid.' });
    return;
  }

  const updated = await updateUser(user.id, { email }).catch((error) => {
    if (error.code === '23505') {
      const conflict = new Error('Exista deja un cont cu acest email.');
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  });

  setAuthCookie(res, signToken({ sub: updated.id, email: updated.email }));
  sendJson(res, 200, profileResponse(updated));
}

async function handlePasswordUpdate(req, res) {
  const user = await requireUser(req, res, true);
  if (!user) return;

  const body = await readJson(req);
  const currentPassword = String(body.currentPassword || '');
  const nextPassword = String(body.nextPassword || '');
  const confirmPassword = String(body.confirmPassword || '');

  if (!(await verifyPassword(currentPassword, user.password_hash))) {
    sendJson(res, 401, { message: 'Parola actuala nu este corecta.' });
    return;
  }

  if (nextPassword.length < 8) {
    sendJson(res, 400, { message: 'Parola noua trebuie sa aiba cel putin 8 caractere.' });
    return;
  }

  if (nextPassword !== confirmPassword) {
    sendJson(res, 400, { message: 'Parolele nu coincid.' });
    return;
  }

  await updateUser(user.id, { password_hash: await hashPassword(nextPassword) });
  sendJson(res, 200, { ok: true });
}

async function handleAddressList(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (!(await hasTable('addresses'))) {
    sendJson(res, 200, []);
    return;
  }

  const columns = await getAddressColumns();
  const userColumn = columns.has('user_id') ? 'user_id' : null;
  if (!userColumn) {
    sendJson(res, 200, []);
    return;
  }

  const result = await pool.query(
    'SELECT * FROM addresses WHERE user_id = $1 ORDER BY id DESC',
    [user.id],
  );

  sendJson(res, 200, result.rows.map(addressResponse));
}

async function handleOrderList(req, requestUrl, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (!(await hasTable('orders')) || !(await hasTable('order_items'))) {
    sendJson(res, 200, []);
    return;
  }

  const months = Number(requestUrl.searchParams.get('months') || 0);
  const values = [user.id];
  let dateFilter = '';
  if (Number.isFinite(months) && months > 0) {
    values.push(months);
    dateFilter = ` AND created_at >= CURRENT_TIMESTAMP - ($${values.length}::int * INTERVAL '1 month')`;
  }

  const ordersResult = await pool.query(
    `
      SELECT *
      FROM orders
      WHERE user_id = $1${dateFilter}
      ORDER BY created_at DESC
    `,
    values,
  );

  const orders = ordersResult.rows;
  if (orders.length === 0) {
    sendJson(res, 200, []);
    return;
  }

  const orderIds = orders.map((order) => order.id);
  const itemsResult = await pool.query(
    `
      SELECT *
      FROM order_items
      WHERE order_id = ANY($1::int[])
      ORDER BY id ASC
    `,
    [orderIds],
  );

  const itemsByOrderId = new Map();
  for (const item of itemsResult.rows) {
    const existing = itemsByOrderId.get(item.order_id) || [];
    existing.push(orderItemResponse(item));
    itemsByOrderId.set(item.order_id, existing);
  }

  sendJson(
    res,
    200,
    orders.map((order) => orderResponse(order, itemsByOrderId.get(order.id) || [])),
  );
}

async function handleOrderDetails(req, res, orderNumber) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (!(await hasTable('orders')) || !(await hasTable('order_items'))) {
    sendJson(res, 404, { message: 'Comanda nu a fost gasita.' });
    return;
  }

  const orderResult = await pool.query(
    `
      SELECT *
      FROM orders
      WHERE user_id = $1 AND order_number = $2
      LIMIT 1
    `,
    [user.id, orderNumber],
  );
  const order = orderResult.rows[0];
  if (!order) {
    sendJson(res, 404, { message: 'Comanda nu a fost gasita.' });
    return;
  }

  const itemsResult = await pool.query(
    `
      SELECT *
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
    `,
    [order.id],
  );

  sendJson(res, 200, orderResponse(order, itemsResult.rows.map(orderItemResponse)));
}

async function handleOrderCreate(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (!(await hasTable('orders')) || !(await hasTable('order_items'))) {
    sendJson(res, 501, { message: 'Tabelele pentru comenzi nu exista inca.' });
    return;
  }

  const body = await readJson(req);
  const orderItems = await buildTrustedOrderItems(body.items);
  if (orderItems.length === 0) {
    sendJson(res, 400, { message: 'Cosul este gol.' });
    return;
  }

  const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.line_total, 0));
  const deliveryTotal = roundMoney(body.deliveryTotal || body.delivery || 0);
  const total = roundMoney(subtotal + deliveryTotal);
  const orderNumber = await generateOrderNumber();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const orderResult = await client.query(
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
          payment_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [user.id, orderNumber, 'Plasata', subtotal, deliveryTotal, total, 'RON', 'manual', 'unpaid'],
    );
    const order = orderResult.rows[0];
    const insertedItems = [];

    for (const item of orderItems) {
      const itemResult = await client.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            product_image_url,
            sku,
            selected_options,
            unit_price,
            quantity,
            line_total
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `,
        [
          order.id,
          item.product_id,
          item.product_name,
          item.product_image_url,
          item.sku,
          item.selected_options,
          item.unit_price,
          item.quantity,
          item.line_total,
        ],
      );
      insertedItems.push(orderItemResponse(itemResult.rows[0]));
    }

    await client.query('COMMIT');
    const responsePayload = orderResponse(order, insertedItems);
    void sendOrderEmails({ user, order: responsePayload, items: insertedItems });
    sendJson(res, 201, responsePayload);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleNetopiaPaymentStart(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (!(await hasTable('orders')) || !(await hasTable('order_items'))) {
    sendJson(res, 501, { message: 'Tabelele pentru comenzi nu exista inca.' });
    return;
  }

  if (!config.netopiaApiKey || !config.netopiaPosSignature) {
    sendJson(res, 501, {
      message:
        'Plata online nu este configurata inca. Adauga NETOPIA_API_KEY si NETOPIA_POS_SIGNATURE in backend/.env.',
    });
    return;
  }

  const body = await readJson(req);
  const orderItems = await buildTrustedOrderItems(body.items);
  if (orderItems.length === 0) {
    sendJson(res, 400, { message: 'Cosul este gol.' });
    return;
  }

  const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.line_total, 0));
  const deliveryTotal = roundMoney(body.deliveryTotal || body.delivery || 0);
  const total = roundMoney(subtotal + deliveryTotal);
  const orderNumber = await generateOrderNumber();
  const customer = await getCheckoutCustomer(user);
  const client = await pool.connect();
  let order = null;
  const insertedItems = [];

  try {
    await client.query('BEGIN');
    const orderResult = await client.query(
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
          payment_provider
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
      [
        user.id,
        orderNumber,
        'In asteptare plata',
        subtotal,
        deliveryTotal,
        total,
        'RON',
        'card',
        'pending',
        'netopia',
      ],
    );
    order = orderResult.rows[0];

    for (const item of orderItems) {
      const itemResult = await client.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            product_image_url,
            sku,
            selected_options,
            unit_price,
            quantity,
            line_total
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `,
        [
          order.id,
          item.product_id,
          item.product_name,
          item.product_image_url,
          item.sku,
          item.selected_options,
          item.unit_price,
          item.quantity,
          item.line_total,
        ],
      );
      insertedItems.push(orderItemResponse(itemResult.rows[0]));
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  try {
    const netopiaResponse = await startNetopiaPayment({
      order,
      items: orderItems,
      customer,
      browserData: body.browserData || {},
      req,
    });
    const paymentState = netopiaPaymentState(netopiaResponse);
    const paymentAction = netopiaPaymentAction(netopiaResponse);
    const updatedOrder = await updateOrderPayment(order.id, {
      status: paymentState.orderStatus,
      payment_status: paymentState.paymentStatus,
      provider_payment_id: netopiaResponse.payment?.ntpID || null,
      provider_payment_url: paymentAction.redirectUrl || null,
      provider_response: JSON.stringify(netopiaResponse),
      paid_at: paymentState.paymentStatus === 'paid' ? new Date() : null,
      payment_error: paymentState.errorMessage || null,
    });
    const responseOrder = orderResponse(updatedOrder || order, insertedItems);
    void sendOrderEmails({ user, order: responseOrder, items: insertedItems });

    sendJson(res, 201, {
      order: responseOrder,
      payment: {
        provider: 'netopia',
        status: paymentState.paymentStatus,
        redirectUrl: paymentAction.redirectUrl,
        redirectMethod: paymentAction.redirectMethod,
        formData: paymentAction.formData,
        message: paymentState.errorMessage || netopiaResponse.error?.message || '',
      },
    });
  } catch (error) {
    const updatedOrder = await updateOrderPayment(order.id, {
      status: 'Plata esuata',
      payment_status: 'failed',
      payment_error: error instanceof Error ? error.message : 'Nu am putut porni plata online.',
    });

    sendJson(res, 502, {
      message: error instanceof Error ? error.message : 'Nu am putut porni plata online.',
      order: orderResponse(updatedOrder || order, insertedItems),
    });
  }
}

async function handleNetopiaNotify(req, requestUrl, res) {
  if (config.netopiaNotifyToken && requestUrl.searchParams.get('token') !== config.netopiaNotifyToken) {
    sendJson(res, 401, { ok: false, message: 'Invalid notify token.' });
    return;
  }

  const body = await readJson(req);
  const orderNumber = String(body.order?.orderID || body.orderID || '').trim();
  if (!orderNumber) {
    sendJson(res, 400, { ok: false, message: 'Missing orderID.' });
    return;
  }

  const orderResult = await pool.query('SELECT * FROM orders WHERE order_number = $1 LIMIT 1', [
    orderNumber,
  ]);
  const order = orderResult.rows[0];
  if (!order) {
    sendJson(res, 404, { ok: false, message: 'Comanda nu a fost gasita.' });
    return;
  }

  const payment = body.payment || {};
  const amount = Number(payment.amount);
  const currency = String(payment.currency || order.currency || 'RON').toUpperCase();
  if (
    Number.isFinite(amount) &&
    (!netopiaAmountMatches(amount, Number(order.total)) || currency !== String(order.currency || 'RON').toUpperCase())
  ) {
    sendJson(res, 400, { ok: false, message: 'Suma sau moneda notificarii nu corespunde comenzii.' });
    return;
  }

  const paymentState = netopiaPaymentState(body);
  await updateOrderPayment(order.id, {
    status: paymentState.orderStatus,
    payment_status: paymentState.paymentStatus,
    provider_payment_id: payment.ntpID || order.provider_payment_id || null,
    provider_response: JSON.stringify(body),
    paid_at: paymentState.paymentStatus === 'paid' ? new Date() : order.paid_at || null,
    cancelled_at: paymentState.paymentStatus === 'cancelled' ? new Date() : order.cancelled_at || null,
    payment_error: paymentState.errorMessage || payment.message || null,
  });

  sendJson(res, 200, { ok: true });
}

async function handleAddressCreate(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (!(await hasTable('addresses'))) {
    sendJson(res, 501, { message: 'Tabela addresses nu exista inca.' });
    return;
  }

  const body = await readJson(req);
  const columns = await getAddressColumns();
  const insertData = buildAddressData(columns, body, user.id);
  const validationMessage = validateAddressData(insertData);
  if (validationMessage) {
    sendJson(res, 400, { message: validationMessage });
    return;
  }

  await clearDefaultAddresses(user.id, insertData);
  const address = await insertRow('addresses', insertData);
  sendJson(res, 201, addressResponse(address));
}

async function handleAddressUpdate(req, res, addressId) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (!(await hasTable('addresses'))) {
    sendJson(res, 501, { message: 'Tabela addresses nu exista inca.' });
    return;
  }

  const body = await readJson(req);
  const columns = await getAddressColumns();
  const updates = buildAddressData(columns, body);
  const validationMessage = validateAddressData(updates);
  if (validationMessage) {
    sendJson(res, 400, { message: validationMessage });
    return;
  }

  await clearDefaultAddresses(user.id, updates, addressId);
  const address = await updateRowForUser('addresses', addressId, user.id, updates);

  if (!address) {
    sendJson(res, 404, { message: 'Adresa nu a fost gasita.' });
    return;
  }

  sendJson(res, 200, addressResponse(address));
}

async function handleAddressDelete(req, res, addressId) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (!(await hasTable('addresses'))) {
    sendJson(res, 204, {});
    return;
  }

  await pool.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [addressId, user.id]);
  sendJson(res, 200, { ok: true });
}

async function getCurrentUser(req, includePassword = false) {
  const token = parseCookies(req.headers.cookie || '')[config.cookieName];
  const payload = token ? verifyToken(token) : null;
  if (!payload?.sub) return null;

  const select = includePassword
    ? 'SELECT * FROM users WHERE id = $1 LIMIT 1'
    : 'SELECT * FROM users WHERE id = $1 LIMIT 1';
  const result = await pool.query(select, [payload.sub]);
  return result.rows[0] || null;
}

async function requireUser(req, res, includePassword = false) {
  const user = await getCurrentUser(req, includePassword);
  if (!user) {
    sendJson(res, 401, { message: 'Trebuie sa fii autentificat.' });
    return null;
  }
  return user;
}

async function requireAdmin(req, res, includePassword = false) {
  const user = await requireUser(req, res, includePassword);
  if (!user) return null;

  if (!isAdminUser(user)) {
    sendJson(res, 403, { message: 'Nu ai permisiunea de a accesa panoul de administrare.' });
    return null;
  }

  return user;
}

async function getUserColumns() {
  if (userColumnsCache) return userColumnsCache;
  userColumnsCache = await getColumns('users');
  return userColumnsCache;
}

async function getAddressColumns() {
  if (addressColumnsCache) return addressColumnsCache;
  addressColumnsCache = await getColumns('addresses');
  return addressColumnsCache;
}

async function getOrderColumns() {
  if (orderColumnsCache) return orderColumnsCache;
  orderColumnsCache = await getColumns('orders');
  return orderColumnsCache;
}

async function getConversationMessageColumns() {
  if (conversationMessageColumnsCache) return conversationMessageColumnsCache;
  conversationMessageColumnsCache = await getColumns('conversation_messages');
  return conversationMessageColumnsCache;
}

async function getColumns(tableName) {
  const result = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = ANY($1::text[]) AND table_name = $2
      ORDER BY array_position($1::text[], table_schema)
    `,
    [dbSearchSchemas, tableName],
  );

  return new Set(result.rows.map((row) => row.column_name));
}

async function hasTable(tableName) {
  const result = await pool.query(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = ANY($1::text[]) AND table_name = $2
      LIMIT 1
    `,
    [dbSearchSchemas, tableName],
  );

  return result.rowCount > 0;
}

async function insertUser(data) {
  return insertRow('users', data);
}

async function insertRow(tableName, data) {
  return insertRowWithClient(pool, tableName, data);
}

async function insertRowWithClient(db, tableName, data) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  const columns = entries.map(([key]) => key);
  const values = entries.map(([, value]) => value);
  const params = values.map((_, index) => `$${index + 1}`);
  const result = await db.query(
    `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${params.join(', ')}) RETURNING *`,
    values,
  );

  return result.rows[0];
}

async function updateUser(userId, updates) {
  return updateRow('users', userId, updates);
}

async function updateRow(tableName, id, updates) {
  return updateRowWithClient(pool, tableName, id, updates);
}

async function updateRowWithClient(db, tableName, id, updates) {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    const result = await db.query(`SELECT * FROM ${tableName} WHERE id = $1 LIMIT 1`, [id]);
    return result.rows[0] || null;
  }

  const setParts = entries.map(([key], index) => `${key} = $${index + 1}`);
  const values = entries.map(([, value]) => value);
  const result = await db.query(
    `UPDATE ${tableName} SET ${setParts.join(', ')} WHERE id = $${
      values.length + 1
    } RETURNING *`,
    [...values, id],
  );

  return result.rows[0] || null;
}

async function withTransaction(action) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await action(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateRowForUser(tableName, id, userId, updates) {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    const result = await pool.query(
      `SELECT * FROM ${tableName} WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [id, userId],
    );
    return result.rows[0] || null;
  }

  const setParts = entries.map(([key], index) => `${key} = $${index + 1}`);
  const values = entries.map(([, value]) => value);
  const result = await pool.query(
    `UPDATE ${tableName} SET ${setParts.join(', ')} WHERE id = $${
      values.length + 1
    } AND user_id = $${values.length + 2} RETURNING *`,
    [...values, id, userId],
  );

  return result.rows[0] || null;
}

function addOptionalUserData(insertData, columns, body) {
  const clientType = String(body.clientType || '').trim();
  const optionalMap = {
    client_type: clientType,
    company_name: body.companyName,
    cui: body.cui,
    trade_register_number: body.tradeRegisterNumber,
    newsletter_subscribed: body.newsletterSubscribed,
  };

  for (const [column, value] of Object.entries(optionalMap)) {
    if (columns.has(column)) {
      insertData[column] = cleanOptionalValue(value);
    }
  }
}

function buildAddressData(columns, body, userId) {
  const data = {};
  const map = {
    apelativ: ['apelativ', 'title'],
    prenume: ['prenume', 'first_name'],
    nume: ['nume', 'last_name'],
    companie: ['companie', 'company'],
    tara: ['tara', 'country'],
    adresa1: ['adresa1', 'address_line_1', 'street'],
    adresa2: ['adresa2', 'address_line_2'],
    codPostal: ['cod_postal', 'postal_code'],
    oras: ['oras', 'city'],
    judet: ['judet', 'county'],
    telefon: ['telefon', 'phone'],
    implicitFacturare: ['implicit_facturare', 'billing_default'],
    implicitLivrare: ['implicit_livrare', 'shipping_default', 'is_default'],
  };

  if (userId && columns.has('user_id')) {
    data.user_id = userId;
  }

  for (const [bodyKey, possibleColumns] of Object.entries(map)) {
    for (const column of possibleColumns) {
      if (columns.has(column) && Object.prototype.hasOwnProperty.call(body, bodyKey)) {
        data[column] = cleanOptionalValue(body[bodyKey]);
        break;
      }
    }
  }

  return data;
}

function validateAddressData(data) {
  const requiredFields = ['prenume', 'nume', 'tara', 'adresa1', 'cod_postal', 'oras'];
  for (const field of requiredFields) {
    if (Object.prototype.hasOwnProperty.call(data, field) && !String(data[field] || '').trim()) {
      return 'Completeaza toate campurile obligatorii pentru adresa.';
    }
  }

  return '';
}

async function buildTrustedOrderItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];

  const productIds = Array.from(
    new Set(
      rawItems
        .map((item) => {
          const product = item && typeof item === 'object' ? item.product || item : {};
          return normalizeInteger(product.id || item.productId || item.product_id);
        })
        .filter(Boolean),
    ),
  );

  if (productIds.length === 0) return [];

  const products = await getCheckoutProducts(productIds);
  const orderItems = [];

  for (const item of rawItems) {
    const productInput = item && typeof item === 'object' ? item.product || item : {};
    const productId = normalizeInteger(productInput.id || item.productId || item.product_id);
    const product = products.get(productId);
    if (!product) {
      const error = new Error('Un produs din cos nu mai este disponibil.');
      error.status = 400;
      throw error;
    }

    const quantity = Math.max(1, Math.min(999, Math.floor(Number(item.quantity || 1))));
    if (!Number.isFinite(quantity)) continue;

    const requestedSku = cleanOptionalValue(productInput.sku || item.sku);
    const selectedOptions = cleanOptionalValue(productInput.selectedSize || item.selectedSize);
    const selectedVariant = findVariantForCartLine(product.variants, requestedSku, selectedOptions);
    if ((requestedSku || selectedOptions || productRequiresVariantSelection(product)) && !selectedVariant) {
      const error = new Error(`Selectia pentru produsul "${product.name}" nu mai este valida.`);
      error.status = 400;
      throw error;
    }

    const unitPrice = roundMoney(applyCheckoutVariantPrice(Number(product.price), selectedVariant));
    const lineTotal = roundMoney(unitPrice * quantity);

    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      product_image_url: cleanOptionalValue(productInput.imageUrl) || product.imageUrl,
      sku: selectedVariant?.sku || product.sku || requestedSku || null,
      selected_options: selectedOptions || null,
      unit_price: unitPrice,
      quantity,
      line_total: lineTotal,
      category_name: product.categoryName || '',
    });
  }

  return orderItems;
}

async function getCheckoutProducts(productIds) {
  const result = await pool.query(
    `
      SELECT
        p.id,
        p.name,
        p.price,
        p.sku,
        COALESCE(primary_image.image_url, p.image_url) AS image_url,
        c.name AS category_name,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'optionName', pov.option_name,
              'optionValue', pov.option_value,
              'legacyOptionValueId', pov.legacy_option_value_id,
              'combinationId', pov.combination_id,
              'model', pov.model,
              'sku', pov.sku,
              'quantity', pov.quantity,
              'priceDelta', pov.price_delta,
              'pricePrefix', pov.price_prefix,
              'imageUrl', pov.image_url,
              'sortOrder', pov.sort_order
            )
            ORDER BY pov.sort_order ASC, pov.id ASC
          ) FILTER (WHERE pov.id IS NOT NULL),
          '[]'::jsonb
        ) AS variants
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.id
        ORDER BY is_primary DESC, sort_order ASC, id ASC
        LIMIT 1
      ) primary_image ON true
      LEFT JOIN product_option_values pov ON pov.product_id = p.id
      WHERE p.id = ANY($1::int[]) AND COALESCE(p.status, 'active') = 'active'
      GROUP BY p.id, c.name, primary_image.image_url
    `,
    [productIds],
  );

  return new Map(
    result.rows.map((product) => [
      Number(product.id),
      {
        id: Number(product.id),
        name: product.name || '',
        price: Number(product.price || 0),
        sku: product.sku || null,
        imageUrl: product.image_url || null,
        categoryName: product.category_name || '',
        variants: normalizeJsonArray(product.variants),
      },
    ]),
  );
}

function findVariantForCartLine(variants, requestedSku, selectedOptions) {
  const availableVariants = variants.filter(variantIsAvailableForCheckout);
  const candidates = availableVariants.length > 0 ? availableVariants : variants;
  const sku = String(requestedSku || '').trim();
  if (sku) {
    const skuMatch = findBestCheckoutVariant(candidates, (variant) => String(variant.sku || '').trim() === sku);
    if (skuMatch) return skuMatch;
  }

  const selectedOptionPairs = parseSelectedOptionPairs(selectedOptions);
  if (selectedOptionPairs.length === 0) return null;

  const selectedOptionVariants = selectedOptionPairs
    .map(({ name, value }) =>
      findBestCheckoutVariant(
        candidates,
        (variant) =>
          normalizeOptionText(variant.optionName) === name &&
          normalizeOptionText(variant.optionValue) === value,
      ),
    )
    .filter(Boolean);

  const selectedImageVariant = selectedOptionVariants.find((variant) => variant.imageUrl);
  const selectedImageValueId = selectedImageVariant?.legacyOptionValueId;
  const selectedNonImageVariants = selectedOptionVariants.filter((variant) => !variant.imageUrl);

  if (selectedNonImageVariants.length > 0) {
    for (const optionVariant of selectedNonImageVariants) {
      const match = findBestCheckoutVariant(candidates, (variant) => {
        if (!optionVariant.legacyOptionValueId || variant.legacyOptionValueId !== optionVariant.legacyOptionValueId) {
          return false;
        }

        if (!selectedImageValueId) {
          return !variant.combinationId;
        }

        return variantCombinationIncludes(variant, selectedImageValueId);
      });
      if (match) return match;
    }
  }

  if (selectedImageValueId) {
    return findBestCheckoutVariant(
      candidates,
      (variant) =>
        variant.legacyOptionValueId === selectedImageValueId &&
        (!variant.combinationId || variantCombinationIncludes(variant, selectedImageValueId)),
    );
  }

  return selectedOptionVariants[0] || null;
}

function parseSelectedOptionPairs(selectedOptions) {
  return String(selectedOptions || '')
    .split(';')
    .map((part) => {
      const [name, ...valueParts] = part.split(':');
      return {
        name: normalizeOptionText(name),
        value: normalizeOptionText(valueParts.join(':')),
      };
    })
    .filter((pair) => pair.name && pair.value);
}

function normalizeOptionText(value) {
  return String(value || '').trim().toLowerCase();
}

function variantCombinationIncludes(variant, legacyOptionValueId) {
  return String(variant.combinationId || '')
    .split('-')
    .map((part) => Number(part))
    .includes(Number(legacyOptionValueId));
}

function findBestCheckoutVariant(variants, predicate) {
  const matches = variants.filter(predicate);
  return (
    matches.find((variant) => variantHasCheckoutCode(variant) && variantIsAvailableForCheckout(variant)) ||
    matches.find(variantHasCheckoutCode) ||
    matches.find(variantIsAvailableForCheckout) ||
    matches[0] ||
    null
  );
}

function variantHasCheckoutCode(variant) {
  return Boolean(variant.sku || variant.model);
}

function variantIsAvailableForCheckout(variant) {
  return variant.quantity === undefined || variant.quantity === null || Number(variant.quantity) > 0;
}

function productRequiresVariantSelection(product) {
  const variants = product.variants || [];
  const optionValuesByName = new Map();
  const finalSkus = new Set();

  for (const variant of variants.filter(variantIsAvailableForCheckout)) {
    const optionName = String(variant.optionName || '').trim();
    const optionValue = String(variant.optionValue || '').trim();
    if (optionName && optionValue) {
      if (!optionValuesByName.has(optionName)) optionValuesByName.set(optionName, new Set());
      optionValuesByName.get(optionName).add(optionValue);
    }

    if (variantHasFinalCheckoutPrice(variant) && variant.sku) {
      finalSkus.add(String(variant.sku).trim());
    }
  }

  return (
    Array.from(optionValuesByName.values()).some((values) => values.size > 1) ||
    finalSkus.size > 1
  );
}

function applyCheckoutVariantPrice(basePrice, variant) {
  const safeBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
  if (!variant) return safeBasePrice;

  const priceDelta = Number(variant.priceDelta ?? 0);
  if (!Number.isFinite(priceDelta)) return safeBasePrice;

  if (variantHasFinalCheckoutPrice(variant)) {
    return priceDelta;
  }

  if (variant.pricePrefix === '-') {
    return Math.max(0, safeBasePrice - priceDelta);
  }

  return safeBasePrice + priceDelta;
}

function variantHasFinalCheckoutPrice(variant) {
  return Boolean(variant.combinationId || variant.sku || variant.model) && Number(variant.priceDelta ?? 0) > 0;
}

function buildOrderItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item) => {
      const product = item && typeof item === 'object' ? item.product || item : {};
      const productName = String(product.name || item.productName || item.name || '').trim();
      const unitPrice = parseMoney(product.price || item.unitPrice || item.price);
      const quantity = Math.max(1, Math.min(999, Math.floor(Number(item.quantity || 1))));
      const lineTotal = roundMoney(unitPrice * quantity);

      if (!productName || unitPrice < 0 || !Number.isFinite(quantity)) {
        return null;
      }

      return {
        product_id: normalizeInteger(product.id || item.productId || item.product_id),
        product_name: productName,
        product_image_url: cleanOptionalValue(product.imageUrl || item.productImageUrl || item.imageUrl),
        unit_price: unitPrice,
        quantity,
        line_total: lineTotal,
      };
    })
    .filter(Boolean);
}

async function getCheckoutCustomer(user) {
  const fullNameParts = String(user.full_name || '').trim().split(/\s+/).filter(Boolean);
  const fallbackFirstName = fullNameParts[0] || 'Client';
  const fallbackLastName = fullNameParts.slice(1).join(' ') || 'Margele.net';
  let address = null;

  if (await hasTable('addresses')) {
    const addressResult = await pool.query(
      `
        SELECT *
        FROM addresses
        WHERE user_id = $1
        ORDER BY implicit_facturare DESC, implicit_livrare DESC, id DESC
        LIMIT 1
      `,
      [user.id],
    );
    address = addressResult.rows[0] || null;
  }

  const firstName = cleanOptionalValue(address?.prenume) || fallbackFirstName;
  const lastName = cleanOptionalValue(address?.nume) || fallbackLastName;
  const email = cleanOptionalValue(user.email) || 'client@example.com';
  const phone = cleanOptionalValue(address?.telefon || address?.phone || user.phone) || '0259267109';
  const city = cleanOptionalValue(address?.oras || address?.city) || 'Oradea';
  const state = cleanOptionalValue(address?.judet || address?.county) || 'Bihor';
  const postalCode = cleanOptionalValue(address?.cod_postal || address?.postal_code) || '410000';
  const details = [address?.adresa1, address?.adresa2].map(cleanOptionalValue).filter(Boolean).join(', ') ||
    'Str. Sovata 5, bl PC26, ap2';

  return {
    email,
    phone,
    firstName,
    lastName,
    city,
    country: 642,
    countryName: 'Romania',
    state,
    postalCode,
    details,
  };
}

async function startNetopiaPayment({ order, items, customer, browserData, req }) {
  const endpoint =
    config.netopiaMode === 'live'
      ? 'https://secure.mobilpay.ro/pay/payment/card/start'
      : 'https://secure.sandbox.netopia-payments.com/payment/card/start';
  const payload = buildNetopiaStartPayload({ order, items, customer, browserData, req });
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: config.netopiaApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(responseBody?.error?.message || responseBody?.message || 'NETOPIA a respins cererea de plata.');
  }

  if (responseBody?.error?.code && !['00', '0', '100', 0, 100].includes(responseBody.error.code)) {
    throw new Error(responseBody.error.message || 'NETOPIA a returnat o eroare pentru plata.');
  }

  return responseBody || {};
}

function buildNetopiaStartPayload({ order, items, customer, browserData, req }) {
  const notifyUrl = new URL('/payments/netopia/notify', config.backendPublicUrl);
  if (config.netopiaNotifyToken) {
    notifyUrl.searchParams.set('token', config.netopiaNotifyToken);
  }

  const redirectUrl = new URL('/checkout/status', config.frontendOrigin);
  redirectUrl.searchParams.set('orderNumber', order.order_number);

  return {
    config: {
      emailTemplate: config.netopiaEmailTemplate,
      notifyUrl: notifyUrl.toString(),
      redirectUrl: redirectUrl.toString(),
      language: config.netopiaLanguage,
    },
    payment: {
      options: {
        installments: 0,
        bonus: 0,
      },
      instrument: {
        type: 'card',
        token: '',
      },
      data: netopiaBrowserData(browserData, req),
    },
    order: {
      ntpID: '',
      posSignature: config.netopiaPosSignature,
      dateTime: new Date().toISOString(),
      description: `Comanda ${order.order_number} - Margele.net`,
      orderID: order.order_number,
      amount: Number(order.total),
      currency: order.currency || 'RON',
      billing: customer,
      shipping: customer,
      products: items.map((item) => ({
        name: `${item.product_name} x ${item.quantity}`,
        code: item.sku || String(item.product_id || ''),
        category: item.category_name || '',
        price: Number(item.line_total),
        vat: 19,
      })),
      installments: {
        selected: 0,
        available: [0],
      },
      data: {
        localOrderId: String(order.id),
      },
    },
  };
}

function netopiaBrowserData(browserData, req) {
  return {
    BROWSER_USER_AGENT: cleanOptionalValue(browserData.BROWSER_USER_AGENT) || req.headers['user-agent'] || '',
    OS: cleanOptionalValue(browserData.OS) || '',
    OS_VERSION: cleanOptionalValue(browserData.OS_VERSION) || '',
    MOBILE: cleanOptionalValue(browserData.MOBILE) || 'false',
    SCREEN_POINT: cleanOptionalValue(browserData.SCREEN_POINT) || 'false',
    SCREEN_PRINT: cleanOptionalValue(browserData.SCREEN_PRINT) || '',
    BROWSER_COLOR_DEPTH: cleanOptionalValue(browserData.BROWSER_COLOR_DEPTH) || '',
    BROWSER_SCREEN_HEIGHT: cleanOptionalValue(browserData.BROWSER_SCREEN_HEIGHT) || '',
    BROWSER_SCREEN_WIDTH: cleanOptionalValue(browserData.BROWSER_SCREEN_WIDTH) || '',
    BROWSER_PLUGINS: cleanOptionalValue(browserData.BROWSER_PLUGINS) || '',
    BROWSER_JAVA_ENABLED: cleanOptionalValue(browserData.BROWSER_JAVA_ENABLED) || 'false',
    BROWSER_LANGUAGE: cleanOptionalValue(browserData.BROWSER_LANGUAGE) || '',
    BROWSER_TZ: cleanOptionalValue(browserData.BROWSER_TZ) || 'Europe/Bucharest',
    BROWSER_TZ_OFFSET: cleanOptionalValue(browserData.BROWSER_TZ_OFFSET) || '',
    IP_ADDRESS: clientIpAddress(req),
  };
}

function clientIpAddress(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || '';
}

function netopiaPaymentAction(response) {
  const paymentUrl =
    response.payment?.paymentURL ||
    response.payment?.paymentUrl ||
    response.payment?.url ||
    '';
  if (paymentUrl) {
    return {
      redirectUrl: paymentUrl,
      redirectMethod: 'GET',
      formData: null,
    };
  }

  const customerAction = response.customerAction || {};
  if (customerAction.url) {
    return {
      redirectUrl: customerAction.url,
      redirectMethod: 'POST',
      formData: customerAction.formData || {},
    };
  }

  return {
    redirectUrl: '',
    redirectMethod: 'NONE',
    formData: null,
  };
}

function netopiaPaymentState(response) {
  const payment = response.payment || {};
  const error = response.error || {};
  const status = Number(payment.status);
  const errorCode = String(error.code ?? '').trim();
  const errorMessage = cleanOptionalValue(error.message || payment.message);

  if ([3, 5].includes(status)) {
    return {
      paymentStatus: 'paid',
      orderStatus: 'Platita',
      errorMessage: null,
    };
  }

  if (status === 15 || errorCode === '100') {
    return {
      paymentStatus: 'pending',
      orderStatus: 'In asteptare plata',
      errorMessage: null,
    };
  }

  if ((errorCode && !['00', '0', '100'].includes(errorCode)) || status === 12) {
    return {
      paymentStatus: 'failed',
      orderStatus: 'Plata esuata',
      errorMessage: errorMessage || 'Plata nu a fost autorizata.',
    };
  }

  return {
    paymentStatus: 'pending',
    orderStatus: 'In asteptare plata',
    errorMessage: null,
  };
}

function netopiaAmountMatches(providerAmount, orderTotal) {
  return (
    Math.abs(Number(providerAmount) - Number(orderTotal)) < 0.01 ||
    Math.abs(Number(providerAmount) / 100 - Number(orderTotal)) < 0.01
  );
}

async function updateOrderPayment(orderId, updates) {
  return updateRow('orders', orderId, updates);
}

async function generateOrderNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `MN-${datePart}-${randomPart}`;
    const existing = await pool.query(
      'SELECT 1 FROM orders WHERE order_number = $1 LIMIT 1',
      [orderNumber],
    );
    if (existing.rowCount === 0) return orderNumber;
  }

  return `MN-${Date.now()}`;
}

function parseMoney(value) {
  const normalized = String(value || '0')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? roundMoney(number) : 0;
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function normalizeInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

async function clearDefaultAddresses(userId, data, exceptAddressId = null) {
  const updates = [];
  const values = [userId];
  let where = 'user_id = $1';

  if (exceptAddressId !== null) {
    values.push(exceptAddressId);
    where += ` AND id <> $${values.length}`;
  }

  if (data.implicit_facturare === true) {
    updates.push(`UPDATE addresses SET implicit_facturare = false WHERE ${where}`);
  }

  if (data.implicit_livrare === true) {
    updates.push(`UPDATE addresses SET implicit_livrare = false WHERE ${where}`);
  }

  for (const sql of updates) {
    await pool.query(sql, values);
  }
}

function profileResponse(user) {
  return {
    fullName: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    preferences: user.client_type || user.preferences || 'Persoana fizica',
    birthDate: user.birth_date ? toDateInputValue(user.birth_date) : null,
    companyName: user.company_name || '',
    cui: user.cui || '',
    tradeRegisterNumber: user.trade_register_number || '',
    canEditEmail: true,
    canEditPassword: Boolean(user.password_hash),
  };
}

function addressResponse(address) {
  return {
    id: address.id,
    apelativ: address.apelativ || address.title || 'Dl.',
    prenume: address.prenume || address.first_name || '',
    nume: address.nume || address.last_name || '',
    companie: address.companie || address.company || '',
    tara: address.tara || address.country || '',
    adresa1: address.adresa1 || address.address_line_1 || address.street || '',
    adresa2: address.adresa2 || address.address_line_2 || '',
    codPostal: address.cod_postal || address.postal_code || '',
    oras: address.oras || address.city || '',
    judet: address.judet || address.county || '',
    telefon: address.telefon || address.phone || '',
    implicitFacturare: Boolean(address.implicit_facturare || address.billing_default),
    implicitLivrare: Boolean(address.implicit_livrare || address.shipping_default || address.is_default),
  };
}

function orderResponse(order, items = []) {
  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status || 'Plasata',
    subtotal: String(order.subtotal || '0'),
    deliveryTotal: String(order.delivery_total || '0'),
    total: String(order.total || '0'),
    currency: order.currency || 'RON',
    paymentMethod: order.payment_method || 'manual',
    paymentStatus: order.payment_status || 'unpaid',
    paymentProvider: order.payment_provider || null,
    providerPaymentId: order.provider_payment_id || null,
    paidAt: order.paid_at || null,
    paymentError: order.payment_error || null,
    createdAt: order.created_at,
    items,
  };
}

function adminOrderResponse(order) {
  const items = normalizeJsonArray(order.items).map((item) => ({
    id: item.id,
    productId: item.productId ?? item.product_id ?? null,
    productName: item.productName || item.product_name || '',
    productImageUrl: item.productImageUrl || item.product_image_url || '',
    sku: item.sku || null,
    selectedOptions: item.selectedOptions || item.selected_options || null,
    unitPrice: String(item.unitPrice || item.unit_price || '0'),
    quantity: Number(item.quantity || 0),
    lineTotal: String(item.lineTotal || item.line_total || '0'),
  }));

  return {
    ...orderResponse(order, items),
    updatedAt: order.updated_at || null,
    courier: order.courier || null,
    trackingNumber: order.tracking_number || null,
    trackingUrl: order.tracking_url || null,
    packageStatus: order.package_status || 'nepregatit',
    packageCount: Number(order.package_count || 1),
    packedAt: order.packed_at || null,
    shippedAt: order.shipped_at || null,
    invoiceNumber: order.invoice_number || null,
    invoiceStatus: order.invoice_status || 'negenerata',
    invoiceUrl: order.invoice_url || null,
    invoiceIssuedAt: order.invoice_issued_at || null,
    billingCompany: order.billing_company || null,
    billingVat: order.billing_vat || null,
    customer: {
      id: order.user_id ?? null,
      name: order.user_name || '',
      email: order.user_email || '',
    },
    itemCount: Number(order.item_count || items.reduce((sum, item) => sum + item.quantity, 0)),
  };
}

function orderItemResponse(item) {
  return {
    id: item.id,
    productId: item.product_id,
    productName: item.product_name || '',
    productImageUrl: item.product_image_url || '',
    sku: item.sku || null,
    selectedOptions: item.selected_options || null,
    unitPrice: String(item.unit_price || '0'),
    quantity: Number(item.quantity || 0),
    lineTotal: String(item.line_total || '0'),
  };
}

function productResponse(product) {
  const attributes = normalizeJsonArray(product.attributes);
  const images = normalizeJsonArray(product.images);
  const variants = normalizeJsonArray(product.variants);
  const categories = normalizeJsonArray(product.categories);
  const options = productOptionsFromVariants(variants, attributes);

  return {
    id: product.id,
    name: product.name || '',
    slug: product.slug || null,
    description: product.description || product.short_description || null,
    shortDescription: product.short_description || null,
    price: String(product.price || '0'),
    compareAtPrice: product.compare_at_price ? String(product.compare_at_price) : null,
    currency: product.currency || 'RON',
    imageUrl: product.primary_image_url || product.image_url || product.imageUrl || product.image || null,
    images,
    categoryId: product.category_id ?? product.categoryId ?? null,
    category:
      product.category_id || product.category_name || product.category_slug
        ? {
            id: product.category_id ?? null,
            name: product.category_name || '',
            slug: product.category_slug || '',
          }
        : null,
    categories,
    sku: product.sku || null,
    stockQuantity: Number(product.stock_quantity || 0),
    status: product.status || 'active',
    material: product.material || null,
    attributes,
    options,
    variants,
    sizes: options
      .filter((option) => option.name === 'size')
      .flatMap((option) => option.values),
    createdAt: product.created_at || product.createdAt || null,
  };
}

function productCardResponse(product) {
  return {
    id: product.id,
    name: product.name || '',
    slug: product.slug || null,
    description:
      trimProductCardDescription(product.short_description || product.shortDescription) ||
      trimProductCardDescription(product.description),
    price: String(product.price || '0'),
    compareAtPrice: product.compare_at_price ? String(product.compare_at_price) : null,
    currency: product.currency || 'RON',
    imageUrl: product.primary_image_url || product.image_url || product.imageUrl || product.image || null,
    categoryId: product.category_id ?? product.categoryId ?? null,
    category:
      product.category_id || product.category_name || product.category_slug
        ? {
            id: product.category_id ?? null,
            name: product.category_name || '',
            slug: product.category_slug || '',
          }
        : null,
    createdAt: product.created_at || product.createdAt || null,
  };
}

function trimProductCardDescription(value) {
  let plainText = String(value || '');

  for (let pass = 0; pass < 2; pass += 1) {
    const decoded = decodeProductDescriptionEntities(plainText);
    if (decoded === plainText) break;
    plainText = decoded;
  }

  const normalized = plainText
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(br|hr)\b[^>]*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/<[^>]*$/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return null;
  }

  return normalized.length > 180 ? `${normalized.slice(0, 177).trimEnd()}...` : normalized;
}

function decodeProductDescriptionEntities(value) {
  return String(value || '')
    .replace(/&#x([\da-f]+);/gi, (match, hexadecimal) => {
      const codePoint = Number.parseInt(hexadecimal, 16);
      return isValidHtmlCodePoint(codePoint) ? String.fromCodePoint(codePoint) : match;
    })
    .replace(/&#(\d+);/g, (match, decimal) => {
      const codePoint = Number.parseInt(decimal, 10);
      return isValidHtmlCodePoint(codePoint) ? String.fromCodePoint(codePoint) : match;
    })
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#0*39;/gi, "'")
    .replace(/&amp;/gi, '&');
}

function isValidHtmlCodePoint(value) {
  return (
    Number.isInteger(value) &&
    value > 0 &&
    value <= 0x10ffff &&
    !(value >= 0xd800 && value <= 0xdfff)
  );
}

function categoryResponse(category) {
  return {
    id: category.id,
    parentId: category.parent_id ?? null,
    name: category.name || '',
    slug: category.slug || '',
    description: category.description || null,
    sortOrder: Number(category.sort_order || 0),
    isActive: Boolean(category.is_active),
    productCount: Number(category.product_count || 0),
    parent:
      category.parent_id || category.parent_name || category.parent_slug
        ? {
            id: category.parent_id ?? null,
            name: category.parent_name || '',
            slug: category.parent_slug || '',
          }
        : null,
    createdAt: category.created_at || null,
  };
}

function buildProductFilters(requestUrl) {
  const values = [];
  const clauses = ["COALESCE(p.status, 'active') = 'active'"];
  const categoryId = requestUrl.searchParams.get('categoryId');
  const categorySlug = cleanOptionalValue(requestUrl.searchParams.get('categorySlug'));

  if (categoryId) {
    const parsedCategoryId = normalizeInteger(categoryId);
    if (!parsedCategoryId) {
      return { error: 'categoryId trebuie sa fie un numar valid.' };
    }

    values.push(parsedCategoryId);
    clauses.push(
      `EXISTS (
        SELECT 1
        FROM product_categories pc_filter
        WHERE pc_filter.product_id = p.id AND pc_filter.category_id = $${values.length}
      )`,
    );
  }

  if (categorySlug) {
    values.push(categorySlug);
    clauses.push(
      `EXISTS (
        SELECT 1
        FROM product_categories pc_filter
        JOIN categories c_filter ON c_filter.id = pc_filter.category_id
        WHERE pc_filter.product_id = p.id AND c_filter.slug = $${values.length}
      )`,
    );
  }

  return {
    values,
    whereSql: clauses.join(' AND '),
  };
}

function productOptionsFromAttributes(attributes) {
  const optionMap = new Map();

  for (const attribute of attributes) {
    const key = String(attribute.key || '').trim();
    const value = String(attribute.value || '').trim();
    if (!key || !value) continue;

    if (!optionMap.has(key)) {
      optionMap.set(key, []);
    }

    optionMap.get(key).push({
      value,
      sortOrder: Number(attribute.sortOrder || 0),
    });
  }

  return Array.from(optionMap.entries()).map(([name, values]) => ({
    name,
    values: values
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((item) => item.value),
  }));
}

function productOptionsFromVariants(variants, attributes) {
  if (!variants.length) {
    return productOptionsFromAttributes(attributes);
  }

  const optionMap = new Map();

  for (const variant of variants) {
    const name = String(variant.optionName || '').trim();
    const value = String(variant.optionValue || '').trim();
    if (!name || !value) continue;

    if (!optionMap.has(name)) {
      optionMap.set(name, new Map());
    }

    const values = optionMap.get(name);
    const current = values.get(value);
    const candidate = {
      value,
      imageUrl: variant.imageUrl || null,
      swatchColor: swatchColorForValue(value),
      quantity: Number(variant.quantity || 0),
      sortOrder: Number(variant.sortOrder || 0),
      legacyOptionValueId: variant.legacyOptionValueId ?? null,
    };

    if (!current || (!current.imageUrl && candidate.imageUrl)) {
      values.set(value, candidate);
    }
  }

  return Array.from(optionMap.entries()).map(([name, values]) => {
    const valueDetails = Array.from(values.values()).sort(
      (left, right) => left.sortOrder - right.sortOrder,
    );

    return {
      name,
      values: valueDetails.map((item) => item.value),
      valueDetails,
    };
  });
}

function swatchColorForValue(value) {
  const normalized = String(value || '').toLowerCase();
  const matches = [
    ['argintiu', '#c0c7d2'],
    ['auriu', '#d8a923'],
    ['antique gold', '#b08a3c'],
    ['bronz', '#9a6334'],
    ['cupru', '#b46a3c'],
    ['nickel', '#9aa3a8'],
    ['negru', '#151515'],
    ['alb', '#f8fafc'],
    ['rosu', '#dc2626'],
    ['roz', '#f472b6'],
    ['mov', '#8b5cf6'],
    ['lavanda', '#b794f4'],
    ['albastru', '#2563eb'],
    ['turquaz', '#14b8a6'],
    ['verde', '#16a34a'],
    ['olive', '#708238'],
    ['galben', '#facc15'],
    ['portocaliu', '#f97316'],
    ['maro', '#7c4a2d'],
    ['bej', '#d6bd91'],
    ['gri', '#94a3b8'],
    ['transparent', 'transparent'],
  ];

  return matches.find(([name]) => normalized.includes(name))?.[1] || null;
}

function normalizeJsonArray(value) {
  if (Array.isArray(value)) return value;

  if (!value) return [];

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

async function bestEffortEmail(label, action) {
  try {
    return await action();
  } catch (error) {
    console.error(`[brevo] ${label} failed`, error);
    return null;
  }
}

async function handleReturnRequest(req, res) {
  const body = await readJson(req);
  const returnRequest = {
    fullName: String(body.fullName || '').trim(),
    email: normalizeEmail(body.email),
    phone: String(body.phone || '').trim(),
    orderNumber: String(body.orderNumber || '').trim(),
    productName: String(body.productName || '').trim(),
    sku: String(body.sku || '').trim(),
    reason: String(body.reason || '').trim(),
    outcome: String(body.outcome || '').trim(),
    details: String(body.details || '').trim(),
  };

  if (!returnRequest.fullName) {
    sendJson(res, 400, { message: 'Numele complet este obligatoriu.' });
    return;
  }

  if (!returnRequest.email || !isEmail(returnRequest.email)) {
    sendJson(res, 400, { message: 'Emailul nu este valid.' });
    return;
  }

  if (!returnRequest.phone) {
    sendJson(res, 400, { message: 'Telefonul este obligatoriu.' });
    return;
  }

  if (!returnRequest.orderNumber) {
    sendJson(res, 400, { message: 'Numarul comenzii este obligatoriu.' });
    return;
  }

  if (!returnRequest.productName) {
    sendJson(res, 400, { message: 'Produsul returnat este obligatoriu.' });
    return;
  }

  if (!returnRequest.reason) {
    sendJson(res, 400, { message: 'Selecteaza motivul returului.' });
    return;
  }

  if (!returnRequest.outcome) {
    sendJson(res, 400, { message: 'Selecteaza ce iti doresti mai departe.' });
    return;
  }

  const emailResults = await Promise.allSettled([
    bestEffortEmail('return request admin alert', () =>
      brevoMailer.sendReturnRequestAdminAlert(returnRequest),
    ),
    bestEffortEmail('return request customer confirmation', () =>
      brevoMailer.sendReturnRequestCustomerConfirmation(returnRequest),
    ),
  ]);

  const deliveredCount = emailResults.filter(
    (result) => result.status === 'fulfilled' && result.value && result.value.skipped !== true,
  ).length;

  if (deliveredCount === 0) {
    sendJson(res, 503, {
      message:
        'Cererea nu a putut fi trimisa momentan. Verifica setarile de email si incearca din nou.',
    });
    return;
  }

  sendJson(res, 201, {
    ok: true,
    message: 'Cererea de retur a fost trimisa. Revenim cat mai curand.',
  });
}

async function handleContactMessage(req, res) {
  const body = await readJson(req);
  const message = {
    name: String(body.name || '').trim(),
    contactDetail: String(body.contactDetail || '').trim(),
    topic: String(body.topic || '').trim(),
    message: String(body.message || '').trim(),
  };

  if (!message.name) {
    sendJson(res, 400, { message: 'Numele este obligatoriu.' });
    return;
  }

  if (!message.contactDetail) {
    sendJson(res, 400, { message: 'Emailul sau telefonul este obligatoriu.' });
    return;
  }

  if (!message.message) {
    sendJson(res, 400, { message: 'Mesajul este obligatoriu.' });
    return;
  }

  if ((await hasTable('conversations')) && (await hasTable('conversation_messages'))) {
    await createWebsiteConversation(message);
  }

  const emailResults = await Promise.allSettled([
    bestEffortEmail('contact admin alert', () =>
      brevoMailer.sendContactMessageAdminAlert(message),
    ),
    bestEffortEmail('contact customer confirmation', () =>
      brevoMailer.sendContactMessageCustomerConfirmation(message),
    ),
  ]);

  const deliveredCount = emailResults.filter(
    (result) => result.status === 'fulfilled' && result.value && result.value.skipped !== true,
  ).length;

  if (deliveredCount === 0) {
    sendJson(res, 503, {
      message:
        'Mesajul nu a putut fi trimis momentan. Verifica setarile de email si incearca din nou.',
    });
    return;
  }

  sendJson(res, 201, {
    ok: true,
    message: 'Mesajul a fost trimis. Revenim cat mai curand.',
  });
}

async function createWebsiteConversation(message) {
  const contactDetail = String(message.contactDetail || '').trim();
  const email = isEmail(normalizeEmail(contactDetail)) ? normalizeEmail(contactDetail) : null;
  const phone = email ? null : contactDetail;
  const subject = String(message.topic || '').trim() || 'Mesaj website';
  const preview = String(message.message || '').trim().slice(0, 280);

  await withTransaction(async (client) => {
    const conversationResult = await client.query(
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `,
      [message.name, email, phone, contactDetail, 'website', 'nou', subject, preview],
    );

    const conversationId = conversationResult.rows[0]?.id;
    await client.query(
      `
        INSERT INTO conversation_messages (
          conversation_id,
          direction,
          source,
          message_text,
          attachments,
          sent_at
        )
        VALUES ($1, $2, $3, $4, '[]'::jsonb, CURRENT_TIMESTAMP)
      `,
      [conversationId, 'inbound', 'website', message.message],
    );
  });
}

async function sendOrderEmails({ user, order, items }) {
  await Promise.allSettled([
    bestEffortEmail('order confirmation', () =>
      brevoMailer.sendOrderConfirmationEmail({ user, order, items }),
    ),
    bestEffortEmail('admin order alert', () =>
      brevoMailer.sendNewOrderAdminAlert({ user, order, items }),
    ),
  ]);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: isAdminUser(user) ? 'admin' : user.role || 'customer',
    isAdmin: isAdminUser(user),
  };
}

function buildAdminUserDisplayName(user) {
  const fullName = String(user.full_name || '').trim();
  if (fullName) return fullName;

  const fallbackName = String(user.name || '').trim();
  if (fallbackName) return fallbackName;

  return String(user.email || 'Admin').split('@')[0];
}

function buildFullName(body) {
  const explicit = String(body.fullName || '').trim();
  if (explicit) return explicit;

  return [body.firstName, body.lastName]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ');
}

function roleForEmail(email) {
  return config.adminEmails.has(normalizeEmail(email)) ? 'admin' : 'customer';
}

function isAdminUser(user) {
  const email = normalizeEmail(user?.email);
  return user?.role === 'admin' || (email ? config.adminEmails.has(email) : false);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanOptionalValue(value) {
  if (value === null) return null;
  if (typeof value === 'boolean') return value;
  const text = String(value || '').trim();
  return text === '--' ? '' : text;
}

function parseCsv(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((item) => normalizeEmail(item))
      .filter(Boolean),
  );
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255);
}

function normalizeMoneyInput(value, message) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }

  return roundMoney(number);
}

function normalizeNullableMoney(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }

  return normalizeMoneyInput(value, 'Pretul promotional nu este valid.');
}

function normalizeWholeNumber(value, message) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }

  return number;
}

function normalizeNullableInteger(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }

  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function uniqueNumbers(values) {
  const normalized = [];

  for (const value of values) {
    const number = normalizeNullableInteger(value);
    if (number && !normalized.includes(number)) {
      normalized.push(number);
    }
  }

  return normalized;
}

function toDateInputValue(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

async function verifyPassword(password, passwordHash) {
  const parts = String(passwordHash || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const [, salt, hash] = parts;
  const key = await scrypt(password, salt);
  const stored = Buffer.from(hash, 'hex');
  return stored.length === key.length && crypto.timingSafeEqual(stored, key);
}

function scrypt(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const signature = createSignature(`${encodedHeader}.${encodedBody}`);
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function verifyToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedBody, signature] = parts;
  const expectedSignature = createSignature(`${encodedHeader}.${encodedBody}`);
  if (!constantTimeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedBody));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function createSignature(value) {
  return crypto.createHmac('sha256', config.jwtSecret).update(value).digest('base64url');
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function setAuthCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `${config.cookieName}=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`,
  );
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', [
    `${config.cookieName}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    'google_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
  ]);
}

function redirectToFrontend(res, pathName) {
  const destination = new URL(pathName, config.frontendOrigin);
  res.writeHead(302, { Location: destination.toString() });
  res.end();
}

function postForm(url, values) {
  const body = new URLSearchParams(values).toString();
  const parsedUrl = new URL(url);

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        method: 'POST',
        hostname: parsedUrl.hostname,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          try {
            const data = JSON.parse(text);
            if (response.statusCode >= 400) {
              const error = new Error(data.error_description || data.error || 'OAuth request failed.');
              error.status = response.statusCode;
              reject(error);
              return;
            }
            resolve(data);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

function decodeJwtPayload(token) {
  const [, payload] = String(token || '').split('.');
  if (!payload) return {};

  try {
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return {};
  }
}

function parseCookies(cookieHeader) {
  const cookies = {};
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) continue;
    cookies[rawKey] = rawValue.join('=');
  }
  return cookies;
}
