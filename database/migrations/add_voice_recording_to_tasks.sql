-- Add voice_recording_id column to tasks table
-- This allows tasks to be linked to voice recordings

-- Add the column
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS voice_recording_id INTEGER;

-- Add foreign key constraint
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_voice_recording
FOREIGN KEY (voice_recording_id) 
REFERENCES voice_recordings(recording_id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_voice_recording_id 
ON tasks(voice_recording_id);

-- Add comment
COMMENT ON COLUMN tasks.voice_recording_id IS 'Reference to voice recording if task was created from voice';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name = 'voice_recording_id';
