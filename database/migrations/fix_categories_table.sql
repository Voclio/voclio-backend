-- Fix categories table - add updated_at column
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records
UPDATE categories 
SET updated_at = created_at 
WHERE updated_at IS NULL;
