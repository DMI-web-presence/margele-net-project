CREATE TABLE IF NOT EXISTS content.product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id INTEGER REFERENCES commerce.orders(id) ON DELETE SET NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT product_reviews_rating_check CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT product_reviews_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS product_reviews_product_status_idx ON content.product_reviews(product_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS product_reviews_status_idx ON content.product_reviews(status, created_at DESC);
CREATE INDEX IF NOT EXISTS product_reviews_email_idx ON content.product_reviews(lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS product_reviews_unique_email_product_idx
    ON content.product_reviews(product_id, lower(email));

ALTER TABLE content.product_reviews ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES catalog.products(id) ON DELETE CASCADE;
ALTER TABLE content.product_reviews ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE content.product_reviews ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES commerce.orders(id) ON DELETE SET NULL;
ALTER TABLE content.product_reviews ADD COLUMN IF NOT EXISTS name VARCHAR(120);
ALTER TABLE content.product_reviews ADD COLUMN IF NOT EXISTS email VARCHAR(180);
ALTER TABLE content.product_reviews ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE content.product_reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE content.product_reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE content.product_reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE content.product_reviews ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE content.product_reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE content.product_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
