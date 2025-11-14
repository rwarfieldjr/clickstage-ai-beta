/*
  # Fix Security Issues - Comprehensive
  
  1. Add Missing Indexes for Foreign Keys
    - Add index on audit_log(user_id)
    - Add index on credit_transactions(user_id)
    
  2. Optimize RLS Policies with SELECT wrapping
    - Fix images table policies (view, insert, delete)
    - Fix email_logs table policies (view own)
    
  3. Remove Unused Indexes
    - Drop idx_orders_completed_at (recently added, not yet used)
    - Drop idx_images_user_id
    - Drop idx_images_created_at
    - Drop idx_credit_history_user_id_fk
    - Drop idx_payments_user_id_fk
    - Drop idx_email_logs_user_id
    - Drop idx_email_logs_type
    - Drop idx_email_logs_created_at
    
  4. Fix Multiple Permissive Policies
    - Combine email_logs SELECT policies into single policy with OR condition
    
  5. Fix Function Search Path
    - Update is_admin function with secure search_path
*/

-- ============================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- ============================================

-- Add index for audit_log.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);

-- Add index for credit_transactions.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);

-- ============================================
-- 2. OPTIMIZE RLS POLICIES WITH SELECT
-- ============================================

-- Fix images table policies
DO $$
BEGIN
  -- Drop and recreate "Users can view own images" policy
  DROP POLICY IF EXISTS "Users can view own images" ON images;
  CREATE POLICY "Users can view own images"
    ON images
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  -- Drop and recreate "Users can insert own images" policy
  DROP POLICY IF EXISTS "Users can insert own images" ON images;
  CREATE POLICY "Users can insert own images"
    ON images
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

  -- Drop and recreate "Users can delete own images" policy
  DROP POLICY IF EXISTS "Users can delete own images" ON images;
  CREATE POLICY "Users can delete own images"
    ON images
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
END $$;

-- Fix email_logs table policies - combine multiple SELECT policies into one
DO $$
BEGIN
  -- Drop existing permissive SELECT policies
  DROP POLICY IF EXISTS "Admins can view all email logs" ON email_logs;
  DROP POLICY IF EXISTS "Users can view own email logs" ON email_logs;
  
  -- Create single combined policy with OR condition
  CREATE POLICY "Users and admins can view email logs"
    ON email_logs
    FOR SELECT
    TO authenticated
    USING (
      (SELECT auth.uid()) = user_id 
      OR 
      is_admin()
    );
END $$;

-- ============================================
-- 3. REMOVE UNUSED INDEXES
-- ============================================

-- Drop unused indexes to reduce storage and maintenance overhead
DROP INDEX IF EXISTS idx_orders_completed_at;
DROP INDEX IF EXISTS idx_images_user_id;
DROP INDEX IF EXISTS idx_images_created_at;
DROP INDEX IF EXISTS idx_credit_history_user_id_fk;
DROP INDEX IF EXISTS idx_payments_user_id_fk;
DROP INDEX IF EXISTS idx_email_logs_user_id;
DROP INDEX IF EXISTS idx_email_logs_type;
DROP INDEX IF EXISTS idx_email_logs_created_at;

-- ============================================
-- 4. FIX FUNCTION SEARCH PATH
-- ============================================

-- Recreate is_admin function with secure search_path
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- ============================================
-- NOTES
-- ============================================

/*
  Remaining Issues Not Fixed in Migration:
  
  1. Leaked Password Protection - This must be enabled in Supabase Dashboard:
     - Go to Authentication > Providers > Email
     - Enable "Leaked Password Protection"
     - This feature checks passwords against HaveIBeenPwned.org
     
  Manual Action Required:
  - Navigate to Supabase Dashboard
  - Go to Authentication settings
  - Enable password breach detection
*/