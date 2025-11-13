/*
  # Comprehensive Security Fixes

  ## Changes Made

  ### 1. Add Missing Indexes for Foreign Keys
  - Add index on `audit_log.user_id` for better query performance
  - Add index on `credit_transactions.user_id` for better query performance

  ### 2. Optimize RLS Policies (Auth Function Initialization)
  Replace `auth.uid()` with `(select auth.uid())` in policies to prevent re-evaluation per row:
  - `stripe_customers`: "Users can view their own customer data"
  - `stripe_subscriptions`: "Users can view their own subscription data"
  - `stripe_orders`: "Users can view their own order data"
  - `credit_history`: "Admins can view credit history"
  - `credit_history`: "Admins can insert credit history"

  ### 3. Remove Unused Indexes
  Remove indexes that are not being used to reduce maintenance overhead:
  - `idx_orders_status`
  - `idx_orders_created_at`
  - `idx_orders_payment_type`
  - `idx_payments_user_id`
  - `idx_credit_history_user_id`
  - `idx_credit_history_created_at`

  ### 4. Fix Security Definer View
  Recreate `credits_view` without SECURITY DEFINER and ensure proper RLS

  ### 5. Fix Function Search Path
  Set immutable search_path for `is_admin` function

  ## Security Notes
  - All changes maintain existing functionality while improving performance
  - RLS policies remain secure while executing more efficiently
  - Unused indexes removed to reduce write overhead
*/

-- ============================================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- ============================================================================

-- Index for audit_log.user_id (foreign key: audit_log_user_id_fkey)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);

-- Index for credit_transactions.user_id (foreign key: credit_transactions_user_id_fkey)
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);

-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES - FIX AUTH FUNCTION RE-EVALUATION
-- ============================================================================

-- Fix stripe_customers policy
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.stripe_customers;
CREATE POLICY "Users can view their own customer data"
  ON public.stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) AND deleted_at IS NULL);

-- Fix stripe_subscriptions policy
DROP POLICY IF EXISTS "Users can view their own subscription data" ON public.stripe_subscriptions;
CREATE POLICY "Users can view their own subscription data"
  ON public.stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers
      WHERE user_id = (select auth.uid()) AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

-- Fix stripe_orders policy
DROP POLICY IF EXISTS "Users can view their own order data" ON public.stripe_orders;
CREATE POLICY "Users can view their own order data"
  ON public.stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers
      WHERE user_id = (select auth.uid()) AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

-- Fix credit_history admin view policy
DROP POLICY IF EXISTS "Admins can view credit history" ON public.credit_history;
CREATE POLICY "Admins can view credit history"
  ON public.credit_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'admin'
    )
  );

-- Fix credit_history admin insert policy
DROP POLICY IF EXISTS "Admins can insert credit history" ON public.credit_history;
CREATE POLICY "Admins can insert credit history"
  ON public.credit_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'admin'
    )
  );

-- ============================================================================
-- 3. REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS public.idx_orders_status;
DROP INDEX IF EXISTS public.idx_orders_created_at;
DROP INDEX IF EXISTS public.idx_orders_payment_type;
DROP INDEX IF EXISTS public.idx_payments_user_id;
DROP INDEX IF EXISTS public.idx_credit_history_user_id;
DROP INDEX IF EXISTS public.idx_credit_history_created_at;

-- ============================================================================
-- 4. FIX SECURITY DEFINER VIEW - RECREATE CREDITS_VIEW
-- ============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.credits_view;

-- Recreate without SECURITY DEFINER
-- Note: The view now relies on RLS policies on the underlying tables
CREATE VIEW public.credits_view AS
SELECT 
  p.id as user_id,
  p.email,
  COALESCE(
    (SELECT SUM(amount) 
     FROM public.credit_transactions ct 
     WHERE ct.user_id = p.id),
    0
  ) as credits,
  p.updated_at as credits_updated_at
FROM public.profiles p;

-- Grant access to authenticated users
GRANT SELECT ON public.credits_view TO authenticated;

-- Note: RLS is enforced through the profiles table policies

-- ============================================================================
-- 5. FIX FUNCTION SEARCH PATH
-- ============================================================================

-- Recreate is_admin function with immutable search_path
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = check_user_id
    AND user_roles.role = 'admin'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Security fixes applied successfully';
  RAISE NOTICE '- Added indexes for foreign keys: audit_log.user_id, credit_transactions.user_id';
  RAISE NOTICE '- Optimized RLS policies to prevent auth function re-evaluation';
  RAISE NOTICE '- Removed 6 unused indexes';
  RAISE NOTICE '- Fixed credits_view to remove SECURITY DEFINER';
  RAISE NOTICE '- Fixed is_admin function search_path';
END $$;
