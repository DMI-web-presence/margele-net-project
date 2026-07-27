ALTER TABLE users
  ADD COLUMN IF NOT EXISTS legacy_id INTEGER,
  ADD COLUMN IF NOT EXISTS requires_password_reset BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS users_legacy_id_idx
  ON users(legacy_id)
  WHERE legacy_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx
  ON users(lower(email));

ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS legacy_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS addresses_legacy_id_idx
  ON addresses(legacy_id)
  WHERE legacy_id IS NOT NULL;
