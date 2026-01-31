-- Make updated_at nullable or add default
ALTER TABLE categories 
ALTER COLUMN updated_at DROP NOT NULL;

-- Or set default value
ALTER TABLE categories 
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
