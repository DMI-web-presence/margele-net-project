ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS model VARCHAR(255);
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS sku VARCHAR(255);

CREATE INDEX IF NOT EXISTS product_option_values_sku_idx
  ON product_option_values(sku);
