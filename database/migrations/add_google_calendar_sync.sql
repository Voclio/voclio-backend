-- Create Google Calendar Sync Table
CREATE TABLE IF NOT EXISTS google_calendar_sync (
    sync_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    google_access_token TEXT NOT NULL,
    google_refresh_token TEXT,
    google_token_expiry TIMESTAMP,
    calendar_id VARCHAR(255) NOT NULL DEFAULT 'primary',
    calendar_name VARCHAR(255),
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'disabled')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, calendar_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_calendar_sync_user_id ON google_calendar_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_sync_status ON google_calendar_sync(sync_status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_google_calendar_sync_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_google_calendar_sync_updated_at ON google_calendar_sync;
CREATE TRIGGER update_google_calendar_sync_updated_at
    BEFORE UPDATE ON google_calendar_sync
    FOR EACH ROW
    EXECUTE FUNCTION update_google_calendar_sync_updated_at();