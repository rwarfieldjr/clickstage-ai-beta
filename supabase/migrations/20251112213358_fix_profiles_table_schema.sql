/*
  # Fix Profiles Table Schema and Ensure Compatibility
  
  1. Schema Verification
    - Ensures profiles table exists with correct structure
    - Adds missing columns if needed
    - Creates user_id as alias to id for consistency
  
  2. Row Level Security
    - Verifies RLS is enabled
    - Ensures proper policies for authenticated users
  
  3. Triggers and Functions
    - Auto-create profile on user signup
    - Auto-update timestamp on changes
  
  4. Compatibility
    - Creates view with user_id for backward compatibility
    - Ensures all queries work with either id or user_id
*/

-- ============================================================================
-- PROFILES TABLE SETUP
-- ============================================================================

-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add timezone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'timezone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Service role has full access
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, timezone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- AUTOMATIC TIMESTAMP UPDATE TRIGGER
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.update_profiles_timestamp() CASCADE;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_profiles_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_timestamp();

-- ============================================================================
-- BACKWARD COMPATIBILITY VIEW
-- ============================================================================

-- Create a view that includes user_id as an alias to id for compatibility
DROP VIEW IF EXISTS public.profiles_with_user_id CASCADE;

CREATE OR REPLACE VIEW public.profiles_with_user_id AS
SELECT 
  id,
  id as user_id,  -- Alias for backward compatibility
  name,
  email,
  timezone,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_with_user_id TO authenticated;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get profile by user_id (for compatibility)
CREATE OR REPLACE FUNCTION public.get_profile_by_user_id(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, email, timezone, created_at, updated_at
  FROM public.profiles
  WHERE id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_by_user_id(UUID) TO authenticated;

-- ============================================================================
-- DATA INTEGRITY CHECKS
-- ============================================================================

-- Ensure all existing auth users have profiles
INSERT INTO public.profiles (id, email, name, timezone)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', ''),
  COALESCE(u.raw_user_meta_data->>'timezone', 'UTC')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profile information. Uses id as primary key which references auth.users(id). For compatibility, use the profiles_with_user_id view which includes user_id as an alias.';
COMMENT ON COLUMN public.profiles.id IS 'Primary key and foreign key to auth.users(id)';
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone preference (e.g., America/New_York, UTC)';
COMMENT ON VIEW public.profiles_with_user_id IS 'Backward compatible view that includes user_id as an alias to id';
