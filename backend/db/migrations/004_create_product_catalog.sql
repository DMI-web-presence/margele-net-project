CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    short_description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    compare_at_price NUMERIC(10, 2),
    currency VARCHAR(3) NOT NULL DEFAULT 'RON',
    sku VARCHAR(80) UNIQUE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    image_url TEXT,
    material VARCHAR(180),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_status_check CHECK (status IN ('draft', 'active', 'archived'))
);

CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_attributes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_key VARCHAR(80) NOT NULL,
    attribute_value VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);
CREATE INDEX IF NOT EXISTS categories_active_sort_idx ON categories(is_active, sort_order, name);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products(created_at);
CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON product_images(product_id);
CREATE INDEX IF NOT EXISTS product_images_primary_idx ON product_images(product_id, is_primary);
CREATE INDEX IF NOT EXISTS product_attributes_product_id_idx ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS product_attributes_key_idx ON product_attributes(attribute_key);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name VARCHAR(150);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(180);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'RON';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(80);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS material VARCHAR(180);
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_unique_idx ON categories(slug);
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique_idx ON products(slug);
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique_idx ON products(sku);

WITH parent_category AS (
    INSERT INTO categories (name, slug, description, sort_order, is_active)
    VALUES (
        'Articole pentru evenimente',
        'articole-pentru-evenimente',
        'Materiale si accesorii potrivite pentru decoratiuni de sezon si evenimente.',
        10,
        true
    )
    ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        sort_order = EXCLUDED.sort_order,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id
),
christmas_category AS (
    INSERT INTO categories (parent_id, name, slug, description, sort_order, is_active)
    SELECT
        parent_category.id,
        'Craciun',
        'craciun',
        'Produse festive pentru ornamente, coronite si decoratiuni de iarna.',
        20,
        true
    FROM parent_category
    ON CONFLICT (slug) DO UPDATE
    SET parent_id = EXCLUDED.parent_id,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        sort_order = EXCLUDED.sort_order,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id
),
seed_products AS (
    INSERT INTO products (
        category_id,
        name,
        slug,
        description,
        short_description,
        price,
        currency,
        sku,
        stock_quantity,
        status,
        image_url,
        material
    )
    SELECT
        christmas_category.id,
        product_data.name,
        product_data.slug,
        product_data.description,
        product_data.short_description,
        product_data.price,
        'RON',
        product_data.sku,
        product_data.stock_quantity,
        'active',
        '/landing-page-image.webp',
        product_data.material
    FROM christmas_category
    CROSS JOIN (
        VALUES
            ('Globuri lemn pentru decor de Craciun', 'globuri-lemn-decor-craciun', 'Set de ornamente din lemn pentru pictura, decupaj si decoratiuni festive.', 'Ornamente din lemn pentru proiecte handmade.', 12.90, 'MGL-9001', 42, 'Lemn natur'),
            ('Margele rosii pentru decoratiuni festive', 'margele-rosii-decoratiuni-festive', 'Margele sticla in nuante de rosu pentru globuri, bratari si ornamente handmade.', 'Margele rosii pentru decoratiuni de sezon.', 16.90, 'MGL-9002', 80, 'Sticla'),
            ('Clopotei metalici aurii', 'clopotei-metalici-aurii', 'Accesorii mici si luminoase pentru coronite, ambalaje cadou si decoratiuni de iarna.', 'Clopotei aurii pentru decoratiuni.', 8.50, 'MGL-9003', 120, 'Metal'),
            ('Mix paiete argintii si aurii', 'mix-paiete-argintii-aurii', 'Paiete stralucitoare pentru ornamente, felicitari si accesorii decorative.', 'Paiete metalizate pentru accente festive.', 9.70, 'MGL-9004', 60, 'Plastic metalizat'),
            ('Figurine brad din lemn natur', 'figurine-brad-lemn-natur', 'Figurine usoare din lemn, potrivite pentru pictura, gravare si decoratiuni pentru brad.', 'Figurine din lemn pentru brad.', 10.00, 'MGL-9005', 36, 'Lemn natur'),
            ('Fundite textile rosii', 'fundite-textile-rosii', 'Fundite decorative pentru ambalaje, coronite, martisoare si proiecte handmade.', 'Fundite textile pentru ambalaje festive.', 6.20, 'MGL-9006', 100, 'Textil')
    ) AS product_data(name, slug, description, short_description, price, sku, stock_quantity, material)
    ON CONFLICT (sku) DO UPDATE
    SET category_id = EXCLUDED.category_id,
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        short_description = EXCLUDED.short_description,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        stock_quantity = EXCLUDED.stock_quantity,
        status = EXCLUDED.status,
        image_url = EXCLUDED.image_url,
        material = EXCLUDED.material,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id, name, image_url
)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
SELECT seed_products.id, seed_products.image_url, seed_products.name, 0, true
FROM seed_products
WHERE NOT EXISTS (
    SELECT 1
    FROM product_images
    WHERE product_images.product_id = seed_products.id
      AND product_images.image_url = seed_products.image_url
);

INSERT INTO product_attributes (product_id, attribute_key, attribute_value, sort_order)
SELECT products.id, 'size', sizes.size_label, sizes.sort_order
FROM products
CROSS JOIN (
    VALUES
        ('6.5 mm', 10),
        ('8.5 mm', 20),
        ('10.5 mm', 30),
        ('12.5 mm', 40),
        ('14.5 mm', 50)
) AS sizes(size_label, sort_order)
WHERE products.sku IN ('MGL-9001', 'MGL-9002', 'MGL-9003', 'MGL-9004', 'MGL-9005', 'MGL-9006')
  AND NOT EXISTS (
      SELECT 1
      FROM product_attributes
      WHERE product_attributes.product_id = products.id
        AND product_attributes.attribute_key = 'size'
        AND product_attributes.attribute_value = sizes.size_label
  );
