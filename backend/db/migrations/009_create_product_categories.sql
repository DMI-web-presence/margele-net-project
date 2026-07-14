CREATE TABLE IF NOT EXISTS product_categories (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS product_categories_product_id_idx ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS product_categories_category_id_idx ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS product_categories_primary_idx ON product_categories(product_id, is_primary);

INSERT INTO product_categories (product_id, category_id, is_primary)
SELECT id, category_id, true
FROM products
WHERE category_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO UPDATE
SET is_primary = product_categories.is_primary OR EXCLUDED.is_primary;
