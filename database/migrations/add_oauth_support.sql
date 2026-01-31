-- Migration: Add OAuth Support
-- Description: Adds OAuth provider fields to users table for Google/Microsoft login

-- Add OAuth columns to users table
ALTER TABLE users 
ADD COLUMN oauth_provider VARCHAR(50),
ADD COLUMN oauth_id VARCHAR(255);

-- Add index for OAuth lookups
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);

-- Add comment
COMMENT ON COLUMN users.oauth_provider IS 'OAuth provider name: google, microsoft, etc.';
COMMENT ON COLUMN users.oauth_id IS 'Unique ID from OAuth provider';

-- Allow password to be NULL for OAuth users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
