ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'customer';

UPDATE users
SET role = 'customer'
WHERE role IS NULL OR trim(role) = '';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin'));

CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
