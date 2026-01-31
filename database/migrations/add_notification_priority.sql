-- Add priority column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'normal';

-- Add related_id column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS related_id INTEGER;

-- Add read_at column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Update existing notifications to have default priority
UPDATE notifications 
SET priority = 'normal' 
WHERE priority IS NULL;
