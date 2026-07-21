CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(160) NOT NULL,
    customer_email VARCHAR(160),
    customer_phone VARCHAR(80),
    contact_detail VARCHAR(160),
    source VARCHAR(30) NOT NULL DEFAULT 'website',
    status VARCHAR(30) NOT NULL DEFAULT 'nou',
    subject VARCHAR(200),
    last_message_preview TEXT,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL DEFAULT 'inbound',
    source VARCHAR(30) NOT NULL DEFAULT 'website',
    message_text TEXT NOT NULL,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    external_message_id VARCHAR(160),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS conversations_source_idx ON conversations(source);
CREATE INDEX IF NOT EXISTS conversations_status_idx ON conversations(status);
CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations(created_at);
CREATE INDEX IF NOT EXISTS conversation_messages_conversation_id_idx ON conversation_messages(conversation_id);
