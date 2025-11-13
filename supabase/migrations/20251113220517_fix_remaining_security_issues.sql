/*
  # Fix Remaining Security Issues

  ## Changes Made

  ### 1. Add Missing Indexes for Foreign Keys
  - Add index on `credit_history.user_id` for foreign key `credit_history_user_id_fkey`
  - Add index on `payments.user_id` for foreign key `payments_user_id_fkey`

  ### 2. Remove Unused Indexes
  - Remove `idx_audit_log_user_id` (not being used)
  - Remove `idx_credit_transactions_user_id` (not being used)

  ### 3. Fix Security Definer View
  - Recreate `credits_view` as a regular view (without SECURITY DEFINER)
  - Ensure proper RLS enforcement through underlying tables

  ### 4. Fix Function Search Path
  - Recreate `is_admin` function with proper immutable search_path

  ## Security Notes
  - Leaked Password Protection must be enabled in Supabase Dashboard
    (Database > Settings > Auth > Password Protection)
  - This cannot be set via SQL migration
*/

-- ============================================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- ============================================================================

-- Index for credit_history.user_id (foreign key: credit_history_user_id_fkey)
CREATE INDEX IF NOT EXISTS idx_credit_history_user_id_fk ON public.credit_history(user_id);

-- Index for payments.user_id (foreign key: payments_user_id_fkey)
CREATE INDEX IF NOT EXISTS idx_payments_user_id_fk ON public.payments(user_id);

-- ============================================================================
-- 2. REMOVE UNUSED INDEXES
-- ============================================================================

-- Remove unused index on audit_log.user_id
DROP INDEX IF EXISTS public.idx_audit_log_user_id;

-- Remove unused index on credit_transactions.user_id
DROP INDEX IF EXISTS public.idx_credit_transactions_user_id;

-- ============================================================================
-- 3. FIX SECURITY DEFINER VIEW - RECREATE CREDITS_VIEW
-- ============================================================================

-- Drop and recreate the view without any security definer properties
DROP VIEW IF EXISTS public.credits_view CASCADE;

-- Create a simple view that relies on RLS from underlying tables
CREATE VIEW public.credits_view 
WITH (security_invoker=true)
AS
SELECT 
  p.id as user_id,
  p.email,
  COALESCE(
    (SELECT SUM(ct.amount) 
     FROM public.credit_transactions ct 
     WHERE ct.user_id = p.id),
    0
  ) as credits,
  p.updated_at as credits_updated_at
FROM public.profiles p;

-- Grant appropriate permissions
GRANT SELECT ON public.credits_view TO authenticated;
GRANT SELECT ON public.credits_view TO service_role;

-- ============================================================================
-- 4. FIX FUNCTION SEARCH PATH - RECREATE IS_ADMIN
-- ============================================================================

-- Drop and recreate is_admin function with proper search_path
DROP FUNCTION IF EXISTS public.is_admin(uuid);

CREATE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = check_user_id
    AND user_roles.role = 'admin'
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon;

-- ============================================================================
-- VERIFICATION AND NOTES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Security fixes applied successfully';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Added indexes for foreign keys:';
  RAISE NOTICE '  - credit_history.user_id';
  RAISE NOTICE '  - payments.user_id';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Removed unused indexes:';
  RAISE NOTICE '  - idx_audit_log_user_id';
  RAISE NOTICE '  - idx_credit_transactions_user_id';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Fixed credits_view (removed SECURITY DEFINER)';
  RAISE NOTICE '✓ Fixed is_admin function search_path';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MANUAL ACTION REQUIRED:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Enable Leaked Password Protection:';
  RAISE NOTICE '1. Go to Supabase Dashboard';
  RAISE NOTICE '2. Navigate to: Authentication > Policies';
  RAISE NOTICE '3. Enable "Password strength" feature';
  RAISE NOTICE '4. Enable "Leaked password protection"';
  RAISE NOTICE '';
  RAISE NOTICE 'This setting cannot be configured via SQL.';
  RAISE NOTICE '========================================';
END $$;
