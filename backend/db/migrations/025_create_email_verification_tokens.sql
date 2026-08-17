DO $$
DECLARE
  user_schema text;
  has_email_verified_at boolean;
BEGIN
  FOR user_schema IN
    SELECT namespace.nspname
    FROM pg_class class
    JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
    WHERE namespace.nspname IN ('app_auth', 'auth', 'public')
      AND class.relname = 'users'
      AND class.relkind IN ('r', 'p')
      AND pg_has_role(class.relowner, 'MEMBER')
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = user_schema
        AND table_name = 'users'
        AND column_name = 'email_verified_at'
    )
    INTO has_email_verified_at;

    EXECUTE format(
      'ALTER TABLE %I.users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP',
      user_schema
    );

    IF NOT has_email_verified_at THEN
      EXECUTE format(
        'UPDATE %I.users SET email_verified_at = COALESCE(email_verified_at, created_at, CURRENT_TIMESTAMP) WHERE email_verified_at IS NULL',
        user_schema
      );
    END IF;

    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I.email_verification_tokens (
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
      'CREATE INDEX IF NOT EXISTS email_verification_tokens_user_id_idx ON %I.email_verification_tokens(user_id)',
      user_schema
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS email_verification_tokens_expires_at_idx ON %I.email_verification_tokens(expires_at)',
      user_schema
    );
  END LOOP;
END $$;
