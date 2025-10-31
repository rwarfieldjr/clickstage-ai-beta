-- Drop the duplicate credits column from profiles table
-- This unifies credit tracking to use only the user_credits table as the single source of truth
ALTER TABLE profiles DROP COLUMN IF EXISTS credits;

-- Add comment to document this change
COMMENT ON TABLE user_credits IS 'Authoritative source for user credit balances. All credit operations must reference this table only.';