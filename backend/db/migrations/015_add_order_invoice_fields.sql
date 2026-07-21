ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(80);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_status VARCHAR(30) NOT NULL DEFAULT 'negenerata';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_company VARCHAR(160);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_vat VARCHAR(80);

CREATE INDEX IF NOT EXISTS orders_invoice_number_idx ON orders(invoice_number);
CREATE INDEX IF NOT EXISTS orders_invoice_status_idx ON orders(invoice_status);
