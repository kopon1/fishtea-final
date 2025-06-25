-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Enable RLS on humanizations table
ALTER TABLE humanizations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own humanizations
DROP POLICY IF EXISTS "Users can view own humanizations" ON humanizations;
CREATE POLICY "Users can view own humanizations"
ON humanizations FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own humanizations" ON humanizations;
CREATE POLICY "Users can insert own humanizations"
ON humanizations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval_type TEXT NOT NULL DEFAULT 'month',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_humanizations_user_id ON humanizations(user_id);
CREATE INDEX IF NOT EXISTS idx_humanizations_created_at ON humanizations(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable realtime for all tables
alter publication supabase_realtime add table subscriptions;

-- Update existing users to ensure they have proper tier assignment
UPDATE users SET tier = 'free' WHERE tier IS NULL OR tier = '';

-- Add constraint to ensure valid tiers
ALTER TABLE users ADD CONSTRAINT valid_tier_check CHECK (tier IN ('free', 'basic', 'pro', 'premium'));
