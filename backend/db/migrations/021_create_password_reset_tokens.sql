DO $$
DECLARE
  user_schema text;
BEGIN
  FOR user_schema IN
    SELECT schema_name
    FROM (VALUES ('app_auth'), ('auth'), ('public')) AS schemas(schema_name)
    WHERE to_regclass(format('%I.users', schema_name)) IS NOT NULL
  LOOP
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I.password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES %I.users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )',
      user_schema,
      user_schema
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON %I.password_reset_tokens(user_id)',
      user_schema
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx ON %I.password_reset_tokens(expires_at)',
      user_schema
    );
  END LOOP;
END $$;
