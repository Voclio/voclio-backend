-- Migration: Fix all ENUM type casting issues
-- Date: 2026-01-31
-- Description: Converts all ENUM columns to proper PostgreSQL ENUM types to prevent Sequelize casting errors

-- ============================================
-- 1. Fix user_settings.theme ENUM
-- ============================================

-- Create ENUM type if not exists
DO $$ BEGIN
    CREATE TYPE enum_user_settings_theme AS ENUM ('light', 'dark', 'auto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop default temporarily
ALTER TABLE user_settings ALTER COLUMN theme DROP DEFAULT;

-- Convert column to ENUM
ALTER TABLE user_settings 
ALTER COLUMN theme TYPE enum_user_settings_theme 
USING theme::enum_user_settings_theme;

-- Set default back
ALTER TABLE user_settings 
ALTER COLUMN theme SET DEFAULT 'auto'::enum_user_settings_theme;

-- Update any NULL values
UPDATE user_settings 
SET theme = 'auto'::enum_user_settings_theme 
WHERE theme IS NULL;

-- ============================================
-- 2. Fix focus_sessions.status ENUM
-- ============================================

-- Create ENUM type if not exists
DO $$ BEGIN
    CREATE TYPE enum_focus_sessions_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop default temporarily
ALTER TABLE focus_sessions ALTER COLUMN status DROP DEFAULT;

-- Convert column to ENUM
ALTER TABLE focus_sessions 
ALTER COLUMN status TYPE enum_focus_sessions_status 
USING status::enum_focus_sessions_status;

-- Set default back
ALTER TABLE focus_sessions 
ALTER COLUMN status SET DEFAULT 'active'::enum_focus_sessions_status;

-- Update any NULL values
UPDATE focus_sessions 
SET status = 'active'::enum_focus_sessions_status 
WHERE status IS NULL;

-- ============================================
-- 3. Fix otp_codes.type ENUM
-- ============================================

-- Create ENUM type if not exists
DO $$ BEGIN
    CREATE TYPE enum_otp_codes_type AS ENUM ('login', 'registration', 'password_reset', 'email_verification', 'phone_verification');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop default temporarily (if exists)
ALTER TABLE otp_codes ALTER COLUMN type DROP DEFAULT;

-- Convert column to ENUM
ALTER TABLE otp_codes 
ALTER COLUMN type TYPE enum_otp_codes_type 
USING type::enum_otp_codes_type;

-- Note: No default value for this column as it's required

-- ============================================
-- 4. Fix notifications.type ENUM
-- ============================================

-- Create ENUM type if not exists
DO $$ BEGIN
    CREATE TYPE enum_notifications_type AS ENUM ('general', 'reminder', 'task', 'achievement', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop default temporarily
ALTER TABLE notifications ALTER COLUMN type DROP DEFAULT;

-- Convert column to ENUM
ALTER TABLE notifications 
ALTER COLUMN type TYPE enum_notifications_type 
USING type::enum_notifications_type;

-- Set default back
ALTER TABLE notifications 
ALTER COLUMN type SET DEFAULT 'general'::enum_notifications_type;

-- Update any NULL values
UPDATE notifications 
SET type = 'general'::enum_notifications_type 
WHERE type IS NULL;

-- ============================================
-- 5. Fix notifications.priority ENUM
-- ============================================

-- Create ENUM type if not exists
DO $$ BEGIN
    CREATE TYPE enum_notifications_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop default temporarily
ALTER TABLE notifications ALTER COLUMN priority DROP DEFAULT;

-- Convert column to ENUM
ALTER TABLE notifications 
ALTER COLUMN priority TYPE enum_notifications_priority 
USING priority::enum_notifications_priority;

-- Set default back
ALTER TABLE notifications 
ALTER COLUMN priority SET DEFAULT 'normal'::enum_notifications_priority;

-- Update any NULL values
UPDATE notifications 
SET priority = 'normal'::enum_notifications_priority 
WHERE priority IS NULL;

-- ============================================
-- Verification
-- ============================================

-- Verify all ENUM types are created
SELECT typname, typtype 
FROM pg_type 
WHERE typname LIKE 'enum_%' 
ORDER BY typname;

-- Verify all columns are using ENUM types
SELECT 
    table_name, 
    column_name, 
    data_type, 
    udt_name,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('user_settings', 'focus_sessions', 'otp_codes', 'notifications')
    AND data_type = 'USER-DEFINED'
ORDER BY table_name, column_name;
