const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

loadEnv(path.join(__dirname, '..', '.env'));

const dbSearchPath = 'catalog,auth,commerce,content,public';
const publicRoot = path.resolve(__dirname, '..', '..', 'frontend', 'public');
const catalogRoot = path.join(publicRoot, 'images', 'catalog');
const dryRun = !process.argv.includes('--apply');
const uploadAllCatalogFiles = process.argv.includes('--all-files');

const config = {
  databaseUrl: process.env.DATABASE_URL || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2BucketName: process.env.R2_BUCKET_NAME || '',
  r2Endpoint: process.env.R2_ENDPOINT || '',
  r2PublicBaseUrl: (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
  r2Region: process.env.R2_REGION || 'auto',
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required in backend/.env');
}

for (const [key, value] of Object.entries({
  R2_ACCESS_KEY_ID: config.r2AccessKeyId,
  R2_SECRET_ACCESS_KEY: config.r2SecretAccessKey,
  R2_BUCKET_NAME: config.r2BucketName,
  R2_ENDPOINT: config.r2Endpoint,
  R2_PUBLIC_BASE_URL: config.r2PublicBaseUrl,
})) {
  if (!value) {
    throw new Error(`${key} is required in backend/.env`);
  }
}

const pool = new Pool({
  connectionString: config.databaseUrl,
  options: `-c search_path=${dbSearchPath}`,
});

const r2Client = new S3Client({
  region: config.r2Region,
  endpoint: config.r2Endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
  },
});

async function main() {
  const references = await collectImageReferences();
  const uniqueUrls = Array.from(new Set(references.map((item) => item.url)));
  const plan = uploadAllCatalogFiles
    ? collectCatalogFilesFromDisk()
    : collectReferencedFiles(uniqueUrls);

  console.log(`Found ${references.length} DB references across ${uniqueUrls.length} unique image URLs.`);
  console.log(`Upload mode: ${uploadAllCatalogFiles ? 'all catalog files' : 'database-referenced files only'}`);
  console.log(`Uploadable files: ${plan.files.length}`);
  console.log(`Missing local files: ${plan.missing.length}`);

  if (plan.missing.length > 0) {
    console.log('First missing entries:');
    for (const url of plan.missing.slice(0, 20)) {
      console.log(`- ${url}`);
    }
  }

  const urlMapping = new Map();
  for (const file of plan.files) {
    const objectKey = buildObjectKey(file.relativePath);
    const nextUrl = `${config.r2PublicBaseUrl}/${objectKey}`;
    urlMapping.set(file.originalUrl, { objectKey, nextUrl, absolutePath: file.absolutePath });
  }

  if (dryRun) {
    console.log('Dry run only. Re-run with --apply to upload files and update database URLs.');
    console.log('Sample mapping:');
    for (const [sourceUrl, value] of Array.from(urlMapping.entries()).slice(0, 10)) {
      console.log(`- ${sourceUrl} -> ${value.nextUrl}`);
    }
    return;
  }

  for (const [sourceUrl, value] of urlMapping.entries()) {
    await uploadFileToR2(value.absolutePath, value.objectKey);
    console.log(`Uploaded: ${sourceUrl} -> ${value.nextUrl}`);
  }

  if (references.length > 0) {
    await applyDatabaseUpdates(urlMapping);
    console.log('Database URLs updated successfully for matching image URLs.');
  } else {
    console.log('No database URLs matched for update.');
  }
}

async function collectImageReferences() {
  const statements = [
    {
      table: 'products',
      sql: `
        SELECT image_url AS url
        FROM products
        WHERE image_url IS NOT NULL AND image_url <> ''
      `,
    },
    {
      table: 'product_images',
      sql: `
        SELECT image_url AS url
        FROM product_images
        WHERE image_url IS NOT NULL AND image_url <> ''
      `,
    },
    {
      table: 'product_option_values',
      sql: `
        SELECT image_url AS url
        FROM product_option_values
        WHERE image_url IS NOT NULL AND image_url <> ''
      `,
    },
  ];

  const references = [];
  for (const statement of statements) {
    const result = await pool.query(statement.sql);
    for (const row of result.rows) {
      const url = String(row.url || '').trim();
      if (!url) continue;
      references.push({
        table: statement.table,
        url,
      });
    }
  }

  return references;
}

function resolveLocalFileFromUrl(url) {
  if (!url.startsWith('/images/')) {
    return null;
  }

  const relativePublicPath = url.replace(/^\/+/, '');
  const exactAbsolutePath = path.join(publicRoot, ...relativePublicPath.split('/'));

  if (fs.existsSync(exactAbsolutePath)) {
    return {
      originalUrl: url,
      relativePath: relativePublicPath,
      absolutePath: exactAbsolutePath,
    };
  }

  const normalizedMatch = findNormalizedSpaceMatch(relativePublicPath);
  if (normalizedMatch) {
    return {
      originalUrl: url,
      relativePath: normalizedMatch.relativePath,
      absolutePath: normalizedMatch.absolutePath,
    };
  }

  return {
    originalUrl: url,
    relativePath: relativePublicPath,
    absolutePath: exactAbsolutePath,
  };
}

function findNormalizedSpaceMatch(relativePublicPath) {
  const segments = relativePublicPath.split('/');
  const fileName = segments.pop();
  const directoryRelativePath = segments.join('/');
  const directoryAbsolutePath = path.join(publicRoot, ...segments);

  if (!fileName || !fs.existsSync(directoryAbsolutePath)) {
    return null;
  }

  const normalizeSpaces = (value) => value.replace(/\s+/g, ' ').trim();
  const normalizedFileName = normalizeSpaces(fileName);

  for (const entry of fs.readdirSync(directoryAbsolutePath, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }

    if (normalizeSpaces(entry.name) !== normalizedFileName) {
      continue;
    }

    const nextRelativePath = directoryRelativePath
      ? `${directoryRelativePath}/${entry.name}`.replace(/\\/g, '/')
      : entry.name;

    return {
      relativePath: nextRelativePath,
      absolutePath: path.join(directoryAbsolutePath, entry.name),
    };
  }

  return null;
}

function collectReferencedFiles(uniqueUrls) {
  const files = [];
  const missing = [];

  for (const url of uniqueUrls) {
    const localFile = resolveLocalFileFromUrl(url);
    if (!localFile || !fs.existsSync(localFile.absolutePath)) {
      missing.push(url);
      continue;
    }

    files.push(localFile);
  }

  return { files, missing };
}

function collectCatalogFilesFromDisk() {
  if (!fs.existsSync(catalogRoot)) {
    throw new Error(`Catalog image folder not found: ${catalogRoot}`);
  }

  const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']);
  const files = [];

  walkFiles(catalogRoot, (absolutePath) => {
    const extension = path.extname(absolutePath).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      return;
    }

    const relativePublicPath = path.relative(publicRoot, absolutePath).replace(/\\/g, '/');
    files.push({
      originalUrl: `/${relativePublicPath}`,
      relativePath: relativePublicPath,
      absolutePath,
    });
  });

  return { files, missing: [] };
}

function walkFiles(root, visit) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkFiles(absolutePath, visit);
      continue;
    }

    if (entry.isFile()) {
      visit(absolutePath);
    }
  }
}

function buildObjectKey(relativePath) {
  return relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
}

async function uploadFileToR2(absolutePath, objectKey) {
  const fileBuffer = await fs.promises.readFile(absolutePath);
  const contentType = getMimeTypeForPath(absolutePath);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: config.r2BucketName,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
}

async function applyDatabaseUpdates(urlMapping) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const [sourceUrl, value] of urlMapping.entries()) {
      await client.query(
        'UPDATE products SET image_url = $2 WHERE image_url = $1',
        [sourceUrl, value.nextUrl],
      );
      await client.query(
        'UPDATE product_images SET image_url = $2 WHERE image_url = $1',
        [sourceUrl, value.nextUrl],
      );
      await client.query(
        'UPDATE product_option_values SET image_url = $2 WHERE image_url = $1',
        [sourceUrl, value.nextUrl],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function getMimeTypeForPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.gif') return 'image/gif';
  if (extension === '.svg') return 'image/svg+xml';
  if (extension === '.avif') return 'image/avif';
  if (extension === '.jpeg') return 'image/jpeg';
  return 'image/jpeg';
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
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
