CREATE TABLE IF NOT EXISTS auth.password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
  ON auth.password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx
  ON auth.password_reset_tokens(expires_at);
