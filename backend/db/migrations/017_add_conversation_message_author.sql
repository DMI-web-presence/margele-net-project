ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS author_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS author_name VARCHAR(160);

CREATE INDEX IF NOT EXISTS conversation_messages_author_user_id_idx
ON conversation_messages(author_user_id);
