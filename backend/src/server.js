const crypto = require('crypto');
const https = require('https');
const http = require('http');
const path = require('path');
const { URL } = require('url');
const { Pool } = require('pg');

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
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 3001}/auth/google/callback`,
  cookieName: 'auth_token',
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required. Add it to backend/.env.');
}

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is required. Add it to backend/.env.');
}

const pool = new Pool({
  connectionString: config.databaseUrl,
});

let userColumnsCache = null;
let addressColumnsCache = null;

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.method === 'GET' && requestUrl.pathname === '/health') {
      sendJson(res, 200, { ok: true });
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

    if (req.method === 'POST' && requestUrl.pathname === '/auth/logout') {
      clearAuthCookie(res);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/auth/me') {
      await handleMe(req, res);
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
  sendJson(res, 201, { user: publicUser(insertedUser) });
}

async function findOrCreateGoogleUser({ email, fullName }) {
  const existing = await pool.query(
    'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
    [email],
  );

  if (existing.rows[0]) return existing.rows[0];

  return insertUser({
    full_name: fullName,
    email,
    password_hash: `google$${crypto.randomBytes(32).toString('hex')}`,
  });
}

async function handleLogin(req, res) {
  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!email || !password) {
    sendJson(res, 400, { message: 'Emailul si parola sunt obligatorii.' });
    return;
  }

  const result = await pool.query(
    'SELECT id, full_name, email, password_hash FROM users WHERE lower(email) = lower($1) LIMIT 1',
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

async function getColumns(tableName) {
  const result = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `,
    [tableName],
  );

  return new Set(result.rows.map((row) => row.column_name));
}

async function hasTable(tableName) {
  const result = await pool.query(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
      LIMIT 1
    `,
    [tableName],
  );

  return result.rowCount > 0;
}

async function insertUser(data) {
  return insertRow('users', data);
}

async function insertRow(tableName, data) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  const columns = entries.map(([key]) => key);
  const values = entries.map(([, value]) => value);
  const params = values.map((_, index) => `$${index + 1}`);
  const result = await pool.query(
    `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${params.join(', ')}) RETURNING *`,
    values,
  );

  return result.rows[0];
}

async function updateUser(userId, updates) {
  return updateRow('users', userId, updates);
}

async function updateRow(tableName, id, updates) {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1 LIMIT 1`, [id]);
    return result.rows[0] || null;
  }

  const setParts = entries.map(([key], index) => `${key} = $${index + 1}`);
  const values = entries.map(([, value]) => value);
  const result = await pool.query(
    `UPDATE ${tableName} SET ${setParts.join(', ')} WHERE id = $${
      values.length + 1
    } RETURNING *`,
    [...values, id],
  );

  return result.rows[0] || null;
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

function publicUser(user) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
  };
}

function buildFullName(body) {
  const explicit = String(body.fullName || '').trim();
  if (explicit) return explicit;

  return [body.firstName, body.lastName]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ');
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
  res.setHeader(
    'Set-Cookie',
    `${config.cookieName}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
  );
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
