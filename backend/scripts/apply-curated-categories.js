const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

loadEnv(path.join(__dirname, '..', '.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in backend/.env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const categoryTree = [
  {
    name: 'Margele',
    slug: 'margele',
    children: [
      ['Margele Toho', 'margele-toho'],
      ['Margele Miyuki', 'margele-miyuki'],
      ['Margele de sticla', 'margele-de-sticla'],
      ['Margele fatetate', 'margele-fatetate'],
      ['Margele acrilice', 'margele-acrilice'],
      ['Margele lemn', 'margele-lemn'],
      ['Margele metalice', 'margele-metalice'],
      ['Margele Shamballa', 'margele-shamballa'],
      ['Margele cu litere', 'margele-cu-litere'],
      ['Mixuri margele', 'mixuri-margele'],
    ],
  },
  {
    name: 'Accesorii bijuterii',
    slug: 'accesorii-bijuterii',
    children: [
      ['Incuietori', 'incuietori'],
      ['Tortite cercei', 'tortite-cercei'],
      ['Zale si inele', 'zale-si-inele'],
      ['Ace si tije', 'ace-si-tije'],
      ['Capacele margele', 'capacele-margele'],
      ['Distantieri', 'distantieri'],
      ['Conectori', 'conectori'],
      ['Baze brose', 'baze-brose'],
      ['Baze inele', 'baze-inele'],
      ['Lanturi', 'lanturi'],
    ],
  },
  {
    name: 'Pandantive si charm-uri',
    slug: 'pandantive-si-charm-uri',
    children: [
      ['Pandantive metalice', 'pandantive-metalice'],
      ['Charm-uri tematice', 'charm-uri-tematice'],
      ['Charm-uri inimioare', 'charm-uri-inimioare'],
      ['Charm-uri stele/flori', 'charm-uri-stele-flori'],
      ['Pandantive sticla', 'pandantive-sticla'],
      ['Pandantive lemn', 'pandantive-lemn'],
      ['Medalioane', 'medalioane'],
    ],
  },
  {
    name: 'Fire, snururi si elastice',
    slug: 'fire-snururi-si-elastice',
    children: [
      ['Ata elastica', 'ata-elastica'],
      ['Fir siliconic', 'fir-siliconic'],
      ['Snur cerat', 'snur-cerat'],
      ['Snur piele/ecologic', 'snur-piele-ecologic'],
      ['Sarma modelaj', 'sarma-modelaj'],
      ['Fir nylon', 'fir-nylon'],
      ['Accesorii pentru insirat', 'accesorii-pentru-insirat'],
    ],
  },
  {
    name: 'Materiale handmade',
    slug: 'materiale-handmade',
    children: [
      ['Pasta modelatoare', 'pasta-modelatoare'],
      ['Fetru', 'fetru'],
      ['Paiete', 'paiete'],
      ['Panglici', 'panglici'],
      ['Pompoane', 'pompoane'],
      ['Nasturi decorativi', 'nasturi-decorativi'],
      ['Elemente textile', 'elemente-textile'],
      ['Adezivi si lacuri', 'adezivi-si-lacuri'],
    ],
  },
  {
    name: 'Decoratiuni si evenimente',
    slug: 'decoratiuni-si-evenimente',
    children: [
      ['Craciun', 'craciun'],
      ['Martisor si Ziua Femeii', 'martisor-si-ziua-femeii'],
      ['Paste', 'paste'],
      ['Nunta si botez', 'nunta-si-botez'],
      ['Decoratiuni festive', 'decoratiuni-festive'],
      ['Ambalaje cadou', 'ambalaje-cadou'],
      ['Accesorii coronite', 'accesorii-coronite'],
    ],
  },
  {
    name: 'Unelte',
    slug: 'unelte',
    children: [
      ['Clesti bijuterii', 'clesti-bijuterii'],
      ['Foarfeci', 'foarfeci'],
      ['Ace', 'ace'],
      ['Pensete', 'pensete'],
      ['Organizatoare', 'organizatoare'],
      ['Matrite si sabloane', 'matrite-si-sabloane'],
    ],
  },
  {
    name: 'Seturi si mixuri',
    slug: 'seturi-si-mixuri',
    children: [
      ['Seturi bijuterii', 'seturi-bijuterii'],
      ['Mixuri accesorii', 'mixuri-accesorii'],
      ['Mixuri margele', 'mixuri-margele-seturi'],
      ['Kituri handmade', 'kituri-handmade'],
      ['Pachete tematice', 'pachete-tematice'],
    ],
  },
  {
    name: 'Reduceri / Lichidare stoc',
    slug: 'reduceri-lichidare-stoc',
    children: [
      ['Produse reduse', 'produse-reduse'],
      ['Ultimele bucati', 'ultimele-bucati'],
      ['Stoc limitat', 'stoc-limitat'],
    ],
  },
];

const rules = [
  ['margele-toho', ['toho']],
  ['margele-miyuki', ['miyuki']],
  ['margele-shamballa', ['shamballa']],
  ['margele-fatetate', ['fatetat', 'fatetate', 'fatetata']],
  ['margele-de-sticla', ['sticla', 'cristal']],
  ['margele-acrilice', ['acril', 'acrilic', 'plastic']],
  ['margele-lemn', ['margele lemn', 'lemn']],
  ['margele-metalice', ['margele metal', 'metalice']],
  ['margele-cu-litere', ['litere', 'alfabet']],
  ['mixuri-margele', ['mix margele', 'mixuri margele']],
  ['incuietori', ['incuietoare', 'incuietori', 'lobster', 'delfin']],
  ['tortite-cercei', ['tortite', 'cercei']],
  ['zale-si-inele', ['zale', 'za ', 'inele', 'ineluse', 'split ring']],
  ['ace-si-tije', ['ace ', 'ac cu', 'tije', 'tija', 'pinuri']],
  ['capacele-margele', ['capacele', 'capace margele']],
  ['distantieri', ['distantier', 'distantieri', 'separator']],
  ['conectori', ['conector', 'conectori']],
  ['baze-brose', ['baza brosa', 'brose']],
  ['baze-inele', ['baza inel', 'baze inele']],
  ['lanturi', ['lant', 'lanturi']],
  ['charm-uri-inimioare', ['inima', 'inimioare', 'heart']],
  ['charm-uri-stele-flori', ['stea', 'stele', 'floare', 'flori']],
  ['pandantive-metalice', ['pandantiv metal', 'pandantive metal']],
  ['pandantive-sticla', ['pandantiv sticla', 'pandantive sticla']],
  ['pandantive-lemn', ['pandantiv lemn', 'pandantive lemn']],
  ['medalioane', ['medalion', 'medalioane']],
  ['charm-uri-tematice', ['charm', 'charmuri']],
  ['ata-elastica', ['ata elastica', 'elastic']],
  ['fir-siliconic', ['fir siliconic', 'siliconic']],
  ['snur-cerat', ['snur cerat']],
  ['snur-piele-ecologic', ['snur piele', 'piele ecologica']],
  ['sarma-modelaj', ['sarma', 'wire']],
  ['fir-nylon', ['nylon']],
  ['accesorii-pentru-insirat', ['insirat', 'insirare']],
  ['pasta-modelatoare', ['fimo', 'pasta modelatoare', 'modelling clay', 'modeling clay']],
  ['fetru', ['fetru']],
  ['paiete', ['paiete', 'paieta']],
  ['panglici', ['panglica', 'panglici']],
  ['pompoane', ['pompon', 'pompoane']],
  ['nasturi-decorativi', ['nasturi', 'nasture']],
  ['elemente-textile', ['textil', 'textile']],
  ['adezivi-si-lacuri', ['adeziv', 'lipici', 'lac ']],
  ['craciun', ['craciun', 'brad', 'glob', 'globuri', 'ornament']],
  ['martisor-si-ziua-femeii', ['martisor', 'ziua femeii', '8 martie']],
  ['paste', ['paste', 'iepuras', 'oua decorative']],
  ['nunta-si-botez', ['nunta', 'botez']],
  ['ambalaje-cadou', ['ambalaj', 'cadou', 'cutie cadou', 'saculet']],
  ['accesorii-coronite', ['coronita', 'coronite']],
  ['decoratiuni-festive', ['decoratiune', 'decoratiuni', 'festiv']],
  ['clesti-bijuterii', ['cleste', 'clesti']],
  ['foarfeci', ['foarfeca', 'foarfeci']],
  ['pensete', ['penseta', 'pensete']],
  ['organizatoare', ['organizator', 'organizatoare', 'cutie compartimente']],
  ['matrite-si-sabloane', ['matrita', 'matrite', 'sablon', 'sabloane']],
  ['mixuri-accesorii', ['mix accesorii']],
  ['seturi-bijuterii', ['set bijuterii']],
  ['kituri-handmade', ['kit ', 'kituri']],
  ['pachete-tematice', ['pachet', 'tematic']],
  ['produse-reduse', ['reducere', 'redus']],
  ['ultimele-bucati', ['ultimele bucati']],
  ['stoc-limitat', ['stoc limitat']],
];

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const categoryIdsBySlug = await upsertCategoryTree(client);
    const curatedSlugs = new Set(Array.from(categoryIdsBySlug.keys()));
    const products = await fetchProducts(client, curatedSlugs);
    const mappedCounts = new Map();
    const unmatched = [];

    for (const product of products) {
      const targetSlug = matchCategory(product.searchText);
      if (!targetSlug) {
        unmatched.push(product);
        continue;
      }

      const categoryId = categoryIdsBySlug.get(targetSlug);
      if (!categoryId) continue;

      await client.query('UPDATE product_categories SET is_primary = false WHERE product_id = $1', [
        product.id,
      ]);
      await client.query(
        `
          INSERT INTO product_categories (product_id, category_id, is_primary)
          VALUES ($1, $2, true)
          ON CONFLICT (product_id, category_id) DO UPDATE
          SET is_primary = true
        `,
        [product.id, categoryId],
      );
      await client.query('UPDATE products SET category_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [
        product.id,
        categoryId,
      ]);
      mappedCounts.set(targetSlug, (mappedCounts.get(targetSlug) || 0) + 1);
    }

    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('categories', 'id'),
        GREATEST((SELECT COALESCE(MAX(id), 1) FROM categories), 1),
        true
      )
    `);

    await client.query('COMMIT');
    console.log(`Created/updated ${categoryIdsBySlug.size} curated categories.`);
    console.log(`Mapped ${products.length - unmatched.length} products into curated categories.`);
    console.log(`Left ${unmatched.length} products on their existing legacy categories.`);
    console.log('Top mapped categories:');
    Array.from(mappedCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 12)
      .forEach(([slug, count]) => console.log(`- ${slug}: ${count}`));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function upsertCategoryTree(client) {
  const categoryIdsBySlug = new Map();

  for (let mainIndex = 0; mainIndex < categoryTree.length; mainIndex += 1) {
    const mainCategory = categoryTree[mainIndex];
    const mainId = await upsertCategory(client, {
      ...mainCategory,
      parentId: null,
      description: `${mainCategory.name} pentru proiecte handmade si bijuterii.`,
      sortOrder: (mainIndex + 1) * 100,
    });
    categoryIdsBySlug.set(mainCategory.slug, mainId);

    for (let childIndex = 0; childIndex < mainCategory.children.length; childIndex += 1) {
      const [name, slug] = mainCategory.children[childIndex];
      const childId = await upsertCategory(client, {
        name,
        slug,
        parentId: mainId,
        description: `${name} din catalogul Margele.net.`,
        sortOrder: (mainIndex + 1) * 100 + childIndex + 1,
      });
      categoryIdsBySlug.set(slug, childId);
    }
  }

  return categoryIdsBySlug;
}

async function upsertCategory(client, category) {
  const result = await client.query(
    `
      INSERT INTO categories (parent_id, name, slug, description, sort_order, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (slug) DO UPDATE
      SET parent_id = EXCLUDED.parent_id,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          sort_order = EXCLUDED.sort_order,
          is_active = true,
          updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
    [category.parentId, category.name, category.slug, category.description, category.sortOrder],
  );

  return Number(result.rows[0].id);
}

async function fetchProducts(client, curatedSlugs) {
  const result = await client.query(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.description,
        COALESCE(
          jsonb_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL AND NOT (c.slug = ANY($1))),
          '[]'::jsonb
        ) AS legacy_category_names
      FROM products p
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      WHERE COALESCE(p.status, 'active') = 'active'
      GROUP BY p.id
      ORDER BY p.id ASC
    `,
    [Array.from(curatedSlugs)],
  );

  return result.rows.map((product) => ({
    id: Number(product.id),
    searchText: normalizeSearchText([
      product.name,
      product.slug,
      product.sku,
      product.description,
      ...(Array.isArray(product.legacy_category_names) ? product.legacy_category_names : []),
    ].join(' ')),
  }));
}

function matchCategory(searchText) {
  const matchedRule = rules.find(([, keywords]) => keywords.some((keyword) => searchText.includes(keyword)));
  return matchedRule ? matchedRule[0] : null;
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
