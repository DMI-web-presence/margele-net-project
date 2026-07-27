ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_provider VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS smartbill_series VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS smartbill_number VARCHAR(80);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS smartbill_pdf_fetched_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS smartbill_email_sent_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS smartbill_last_attempt_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS smartbill_error TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS smartbill_payload JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS smartbill_response JSONB;

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS judet VARCHAR(100);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS telefon VARCHAR(80);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS companie VARCHAR(160);

CREATE INDEX IF NOT EXISTS orders_smartbill_document_idx
  ON orders(smartbill_series, smartbill_number);
