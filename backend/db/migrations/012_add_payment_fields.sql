ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'manual';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(120);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_payment_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_response JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_error TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sku VARCHAR(120);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_options TEXT;

CREATE INDEX IF NOT EXISTS orders_order_number_idx ON orders(order_number);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
CREATE INDEX IF NOT EXISTS orders_provider_payment_id_idx ON orders(provider_payment_id);
