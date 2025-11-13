/*
  # Optimize Security Definer Views
  
  1. **View Optimizations**
    - Add explicit search_path to security definer views for safety
    - Change to SECURITY INVOKER where appropriate
    - profiles_with_user_id: Change to SECURITY INVOKER (doesn't need elevated privileges)
    - security_status_summary: Remains SECURITY DEFINER but with explicit search_path
    
  2. **Important Notes**
    - SECURITY INVOKER views run with the privileges of the user executing the query
    - SECURITY DEFINER views run with the privileges of the view owner
    - Use SECURITY DEFINER only when necessary for access control
*/

-- =====================================================
-- 1. RECREATE profiles_with_user_id AS SECURITY INVOKER
-- =====================================================

-- This view doesn't need SECURITY DEFINER since it just queries profiles
-- which already has proper RLS policies
DROP VIEW IF EXISTS public.profiles_with_user_id CASCADE;

CREATE OR REPLACE VIEW public.profiles_with_user_id
WITH (security_invoker=true)
AS
SELECT 
  id,
  id as user_id,
  name,
  email,
  timezone,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_with_user_id TO authenticated;

COMMENT ON VIEW public.profiles_with_user_id IS 
  'Backward compatible view that includes user_id as an alias to id. Uses SECURITY INVOKER for safety.';

-- =====================================================
-- 2. VERIFY security_status_summary VIEW
-- =====================================================

-- Check if the view exists and if it needs SECURITY DEFINER
DO $$
BEGIN
  -- Only recreate if the view exists
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' 
    AND viewname = 'security_status_summary'
  ) THEN
    -- Recreate with SECURITY INVOKER if it doesn't need elevated privileges
    EXECUTE '
      CREATE OR REPLACE VIEW public.security_status_summary
      WITH (security_invoker=true)
      AS
      SELECT 
        count(*) AS total_features,
        count(*) FILTER (WHERE is_enabled = true) AS enabled_features,
        count(*) FILTER (WHERE is_enabled = false) AS pending_features,
        round(((count(*) FILTER (WHERE is_enabled = true))::numeric / 
               count(*)::numeric * 100), 2) AS completion_percentage
      FROM public.security_config_checklist
      WHERE EXISTS (
        SELECT 1 FROM public.security_config_checklist LIMIT 1
      );
    ';
    
    COMMENT ON VIEW public.security_status_summary IS 
      'Summary statistics of security configuration checklist. Uses SECURITY INVOKER for safety.';
  END IF;
END $$;

-- =====================================================
-- 3. UPDATE get_profile_by_user_id FUNCTION
-- =====================================================

-- Already has search_path, but let's ensure it's explicit
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
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT id, name, email, timezone, created_at, updated_at
  FROM public.profiles
  WHERE id = p_user_id;
$$;

COMMENT ON FUNCTION public.get_profile_by_user_id IS
  'Helper function to get profile by user_id. Uses SECURITY DEFINER with explicit search_path.';

-- =====================================================
-- 4. UPDATE handle_new_user FUNCTION  
-- =====================================================

-- Ensure explicit search_path on trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
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

COMMENT ON FUNCTION public.handle_new_user IS
  'Trigger function to auto-create profile on user signup. Uses SECURITY DEFINER with explicit search_path.';
