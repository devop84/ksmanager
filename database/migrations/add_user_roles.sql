-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'viewonly';

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to admin role (assuming first user should be admin)
-- You may want to manually set specific users to admin
UPDATE users SET role = 'admin' WHERE id = (SELECT MIN(id) FROM users);

