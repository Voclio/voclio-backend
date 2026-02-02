-- Add missing timestamp columns to focus_sessions table
ALTER TABLE focus_sessions 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;

-- Update existing records to use start_time as started_at if started_at is null
UPDATE focus_sessions 
SET started_at = start_time 
WHERE started_at IS NULL;

-- Update existing records to use end_time as ended_at if ended_at is null and end_time is not null
UPDATE focus_sessions 
SET ended_at = end_time 
WHERE ended_at IS NULL AND end_time IS NOT NULL;