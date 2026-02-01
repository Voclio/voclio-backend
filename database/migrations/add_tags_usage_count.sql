-- Add usage_count column to tags table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tags' 
        AND column_name = 'usage_count'
    ) THEN
        ALTER TABLE tags ADD COLUMN usage_count INTEGER DEFAULT 0;
        
        -- Update existing tags with their current usage count
        -- Count how many times each tag is used in note_tags
        UPDATE tags t
        SET usage_count = (
            SELECT COUNT(*)
            FROM note_tags nt
            WHERE nt.tag_id = t.tag_id
        );
        
        RAISE NOTICE 'Added usage_count column to tags table and populated with current counts';
    ELSE
        RAISE NOTICE 'usage_count column already exists in tags table';
    END IF;
END $$;
