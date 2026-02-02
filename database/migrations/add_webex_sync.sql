-- Migration: Add Webex Sync Support
-- Description: Creates table for storing Webex OAuth tokens and sync configuration

-- Create webex_sync table
CREATE TABLE IF NOT EXISTS webex_sync (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenType" VARCHAR(50) DEFAULT 'Bearer',
    "expiresIn" INTEGER,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    "webexUserId" VARCHAR(255),
    "webexUserEmail" VARCHAR(255),
    "webexDisplayName" VARCHAR(255),
    "isActive" BOOLEAN DEFAULT true,
    "lastSyncAt" TIMESTAMP WITH TIME ZONE,
    "syncEnabled" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_webex_sync_user_id ON webex_sync("userId");
CREATE INDEX IF NOT EXISTS idx_webex_sync_webex_user_id ON webex_sync("webexUserId");
CREATE INDEX IF NOT EXISTS idx_webex_sync_webex_user_email ON webex_sync("webexUserEmail");
CREATE INDEX IF NOT EXISTS idx_webex_sync_is_active ON webex_sync("isActive");
CREATE INDEX IF NOT EXISTS idx_webex_sync_sync_enabled ON webex_sync("syncEnabled");

-- Add trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_webex_sync_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_webex_sync_updated_at
    BEFORE UPDATE ON webex_sync
    FOR EACH ROW
    EXECUTE FUNCTION update_webex_sync_updated_at();

-- Add comments for documentation
COMMENT ON TABLE webex_sync IS 'Stores Webex OAuth tokens and sync configuration for users';
COMMENT ON COLUMN webex_sync."userId" IS 'Reference to the user who connected Webex';
COMMENT ON COLUMN webex_sync."accessToken" IS 'Webex OAuth access token';
COMMENT ON COLUMN webex_sync."refreshToken" IS 'Webex OAuth refresh token';
COMMENT ON COLUMN webex_sync."tokenType" IS 'OAuth token type (usually Bearer)';
COMMENT ON COLUMN webex_sync."expiresIn" IS 'Token expiration time in seconds';
COMMENT ON COLUMN webex_sync."expiresAt" IS 'Absolute token expiration timestamp';
COMMENT ON COLUMN webex_sync.scope IS 'OAuth scopes granted';
COMMENT ON COLUMN webex_sync."webexUserId" IS 'Webex user ID';
COMMENT ON COLUMN webex_sync."webexUserEmail" IS 'Webex user email address';
COMMENT ON COLUMN webex_sync."webexDisplayName" IS 'Webex user display name';
COMMENT ON COLUMN webex_sync."isActive" IS 'Whether the sync connection is active';
COMMENT ON COLUMN webex_sync."lastSyncAt" IS 'Last time meetings were synced';
COMMENT ON COLUMN webex_sync."syncEnabled" IS 'Whether sync is enabled for this user';