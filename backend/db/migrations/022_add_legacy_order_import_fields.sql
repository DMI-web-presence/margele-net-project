ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS legacy_id INTEGER,
  ADD COLUMN IF NOT EXISTS legacy_customer_id INTEGER,
  ADD COLUMN IF NOT EXISTS legacy_customer_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS legacy_customer_email VARCHAR(160),
  ADD COLUMN IF NOT EXISTS legacy_customer_phone VARCHAR(80),
  ADD COLUMN IF NOT EXISTS legacy_status_id INTEGER,
  ADD COLUMN IF NOT EXISTS legacy_status_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS legacy_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS legacy_shipping_method TEXT,
  ADD COLUMN IF NOT EXISTS legacy_totals JSONB,
  ADD COLUMN IF NOT EXISTS legacy_status_history JSONB,
  ADD COLUMN IF NOT EXISTS legacy_billing_address JSONB,
  ADD COLUMN IF NOT EXISTS legacy_shipping_address JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS orders_legacy_id_idx
  ON orders(legacy_id)
  WHERE legacy_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_legacy_customer_id_idx
  ON orders(legacy_customer_id)
  WHERE legacy_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_legacy_customer_email_idx
  ON orders(lower(legacy_customer_email))
  WHERE legacy_customer_email IS NOT NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS legacy_id INTEGER,
  ADD COLUMN IF NOT EXISTS legacy_product_id INTEGER,
  ADD COLUMN IF NOT EXISTS legacy_model VARCHAR(160),
  ADD COLUMN IF NOT EXISTS tax_total NUMERIC(10, 2) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS order_items_legacy_id_idx
  ON order_items(legacy_id)
  WHERE legacy_id IS NOT NULL;
