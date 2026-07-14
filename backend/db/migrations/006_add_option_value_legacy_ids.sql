ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS legacy_option_id INTEGER;
ALTER TABLE product_option_values ADD COLUMN IF NOT EXISTS legacy_option_value_id INTEGER;

CREATE INDEX IF NOT EXISTS product_option_values_legacy_option_value_id_idx
  ON product_option_values(legacy_option_value_id);
