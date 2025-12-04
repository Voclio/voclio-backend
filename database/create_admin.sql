-- Add Super Admin Script
-- Run this to create the first super admin user

-- Add is_admin column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Update existing user to admin (change email to your admin email)
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@voclio.com';

-- Or create a new super admin user
-- INSERT INTO users (email, password, name, is_admin, email_verified, is_active)
-- VALUES ('admin@voclio.com', '$2a$10$...hashed_password...', 'Super Admin', true, true, true);

-- View current admins
SELECT user_id, email, name, is_admin, created_at 
FROM users 
WHERE is_admin = true;
