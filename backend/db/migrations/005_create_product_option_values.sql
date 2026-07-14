CREATE TABLE IF NOT EXISTS product_option_values (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    option_name VARCHAR(120) NOT NULL,
    option_value VARCHAR(255) NOT NULL,
    legacy_option_id INTEGER,
    legacy_option_value_id INTEGER,
    combination_id VARCHAR(255),
    model VARCHAR(255),
    sku VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 0,
    price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price_prefix VARCHAR(1) NOT NULL DEFAULT '+',
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS product_option_values_product_id_idx ON product_option_values(product_id);
CREATE INDEX IF NOT EXISTS product_option_values_option_name_idx ON product_option_values(option_name);

ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS option_name VARCHAR(120);
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS option_value VARCHAR(255);
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS legacy_option_id INTEGER;
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS legacy_option_value_id INTEGER;
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS combination_id VARCHAR(255);
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS model VARCHAR(255);
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS sku VARCHAR(255);
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS price_prefix VARCHAR(1) NOT NULL DEFAULT '+';
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS product_option_values_legacy_option_value_id_idx ON product_option_values(legacy_option_value_id);
