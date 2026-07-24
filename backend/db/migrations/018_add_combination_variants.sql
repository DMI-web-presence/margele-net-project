ALTER TABLE product_option_values
  ADD COLUMN IF NOT EXISTS option_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS variant_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_option_values(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS product_option_values_active_product_idx
  ON product_option_values(product_id, is_active);

CREATE INDEX IF NOT EXISTS order_items_variant_id_idx
  ON order_items(variant_id);
