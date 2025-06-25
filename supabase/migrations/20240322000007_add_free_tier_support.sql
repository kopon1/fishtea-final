-- Add tier column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';

-- Update existing users to have free tier
UPDATE users SET tier = 'free' WHERE tier IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);

-- Enable realtime for users table
alter publication supabase_realtime add table users;
