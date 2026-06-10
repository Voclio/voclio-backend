-- Migration: Add Webex Sync Support
-- Description: Creates table for storing Webex OAuth tokens and sync configuration

CREATE TABLE IF NOT EXISTS webex_sync (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_in INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    webex_user_id VARCHAR(255),
    webex_user_email VARCHAR(255),
    webex_display_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_webex_sync_user_id ON webex_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_webex_sync_webex_user_id ON webex_sync(webex_user_id);
CREATE INDEX IF NOT EXISTS idx_webex_sync_webex_user_email ON webex_sync(webex_user_email);
CREATE INDEX IF NOT EXISTS idx_webex_sync_is_active ON webex_sync(is_active);
CREATE INDEX IF NOT EXISTS idx_webex_sync_sync_enabled ON webex_sync(sync_enabled);

COMMENT ON TABLE webex_sync IS 'Stores Webex OAuth tokens and sync configuration for users';
