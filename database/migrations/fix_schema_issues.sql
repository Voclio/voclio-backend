-- Migration: Fix Schema Issues
-- Description: Fixes column name mismatches and adds missing columns

-- Fix Reminders table - add is_dismissed column
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN DEFAULT false;

-- Fix Focus Sessions table - add start_time and end_time aliases
-- Note: We keep both column names for backward compatibility
ALTER TABLE focus_sessions 
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;

-- Update existing records to sync the columns
UPDATE focus_sessions 
SET start_time = started_at, end_time = ended_at 
WHERE start_time IS NULL;

-- Fix Productivity Streaks table - add streak_date column and unique constraint
ALTER TABLE productivity_streaks 
ADD COLUMN IF NOT EXISTS streak_date DATE;

-- Update existing records
UPDATE productivity_streaks 
SET streak_date = last_activity_date 
WHERE streak_date IS NULL;

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'productivity_streaks_user_id_streak_date_key'
    ) THEN
        ALTER TABLE productivity_streaks 
        ADD CONSTRAINT productivity_streaks_user_id_streak_date_key 
        UNIQUE (user_id, streak_date);
    END IF;
END $$;

-- Fix Achievements table - ensure it has both achievement_type and title
ALTER TABLE achievements 
ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Update existing records
UPDATE achievements 
SET title = achievement_type 
WHERE title IS NULL AND achievement_type IS NOT NULL;

-- Add comments for clarity
COMMENT ON COLUMN reminders.is_dismissed IS 'Whether the reminder has been dismissed by the user';
COMMENT ON COLUMN focus_sessions.start_time IS 'Alias for started_at for consistency';
COMMENT ON COLUMN focus_sessions.end_time IS 'Alias for ended_at for consistency';
COMMENT ON COLUMN productivity_streaks.streak_date IS 'Date of the streak activity';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reminders_is_dismissed ON reminders(is_dismissed);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_start_time ON focus_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_productivity_streaks_streak_date ON productivity_streaks(streak_date);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Schema fixes applied successfully!';
END $$;
