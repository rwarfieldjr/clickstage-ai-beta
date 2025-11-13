/*
  # Fix Security and Performance Issues
  
  1. **Performance Improvements**
    - Add missing index on `payments.user_id` foreign key
    - Optimize all RLS policies to use `(select auth.uid())` pattern for better performance
    
  2. **Security Fixes**
    - Fix function search paths to prevent SQL injection
    - Set explicit search_path for trigger functions
    
  3. **Tables Affected**
    - profiles: 4 policies optimized
    - audit_log: 1 policy optimized  
    - user_credits: 1 policy optimized
    - credit_transactions: 1 policy optimized
    - orders: 2 policies optimized
    - payments: 1 policy optimized + index added
    - user_roles: 1 policy optimized
    
  4. **Important Notes**
    - All existing data is preserved
    - No breaking changes to application logic
    - Policies maintain same access control, just optimized for performance
    - Functions now have immutable search paths for security
*/

-- =====================================================
-- 1. ADD MISSING INDEX FOR FOREIGN KEY
-- =====================================================

-- Add index on payments.user_id for better foreign key performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id 
ON public.payments(user_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - PROFILES TABLE
-- =====================================================

-- Drop and recreate profiles policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- =====================================================
-- 3. OPTIMIZE RLS POLICIES - AUDIT_LOG TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_log;
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES - USER_CREDITS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
CREATE POLICY "Users can view their own credits"
  ON public.user_credits
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 5. OPTIMIZE RLS POLICIES - CREDIT_TRANSACTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 6. OPTIMIZE RLS POLICIES - ORDERS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- 7. OPTIMIZE RLS POLICIES - PAYMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 8. OPTIMIZE RLS POLICIES - USER_ROLES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 9. FIX FUNCTION SEARCH PATHS FOR SECURITY
-- =====================================================

-- Fix update_updated_at_column function with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Fix update_profiles_timestamp function with explicit search_path
CREATE OR REPLACE FUNCTION public.update_profiles_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 10. ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON INDEX idx_payments_user_id IS 
  'Index to optimize foreign key lookups and joins on payments.user_id';

COMMENT ON FUNCTION public.update_updated_at_column IS
  'Trigger function to automatically update updated_at timestamp. Uses explicit search_path for security.';

COMMENT ON FUNCTION public.update_profiles_timestamp IS
  'Trigger function to update profiles.updated_at timestamp. Uses explicit search_path for security.';
