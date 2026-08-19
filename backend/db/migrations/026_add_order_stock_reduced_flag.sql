ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_reduced BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS orders_stock_reduced_idx ON orders(stock_reduced);
