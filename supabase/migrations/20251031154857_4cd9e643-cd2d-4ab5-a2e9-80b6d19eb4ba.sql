-- Fix user_credits RLS policies to avoid auth.users access
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can insert their own credits" ON user_credits;

-- Create a helper function to get user email from auth context
CREATE OR REPLACE FUNCTION public.get_auth_user_email()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid();
$$;

-- Recreate policies using the helper function
CREATE POLICY "Users can view their own credits"
ON user_credits
FOR SELECT
USING (email = public.get_auth_user_email());

CREATE POLICY "Users can insert their own credits"
ON user_credits
FOR INSERT
WITH CHECK (email = public.get_auth_user_email());