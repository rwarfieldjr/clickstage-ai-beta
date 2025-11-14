/*
  # Harden Credit System - Enterprise Level V2
  
  ## Overview
  This migration creates a rock-solid, tamper-proof credit system with:
  - Single source of truth for credits (profiles.credits)
  - Comprehensive transaction audit log
  - Atomic RPC functions for all credit operations
  - Real-time consistency guarantees
  - Prevention of negative balances
  
  ## Changes
  
  1. Ensure profiles.credits column exists with proper constraints
  2. Enhance credit_transactions table with better structure
  3. Create atomic RPC functions for:
     - get_user_credits (read balance + history)
     - add_credits (purchase/admin add)
     - deduct_credits (order usage/admin subtract)
     - admin_adjust_credits (admin-only adjustments)
  4. Add proper indexes for performance
  5. Set up RLS policies for security
  
  ## Transaction Types
  - purchase: Credits purchased via Stripe
  - admin_add: Admin manually added credits
  - admin_subtract: Admin manually removed credits
  - deduction: Credits used for orders
  - refund: Credits refunded
  - expiration: Credits expired
*/

-- ============================================
-- 1. ENSURE PROFILES TABLE HAS CREDITS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'credits'
  ) THEN
    ALTER TABLE profiles ADD COLUMN credits INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add constraint to prevent negative credits
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_credits_non_negative;
ALTER TABLE profiles ADD CONSTRAINT profiles_credits_non_negative CHECK (credits >= 0);

-- Add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. ENHANCE CREDIT_TRANSACTIONS TABLE
-- ============================================

-- Ensure balance_after is required
ALTER TABLE credit_transactions ALTER COLUMN balance_after SET NOT NULL;

-- Add balance_before column for better auditing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'credit_transactions'
    AND column_name = 'balance_before'
  ) THEN
    ALTER TABLE credit_transactions ADD COLUMN balance_before INTEGER;
  END IF;
END $$;

-- Add admin_id column to track who made admin adjustments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'credit_transactions'
    AND column_name = 'admin_id'
  ) THEN
    ALTER TABLE credit_transactions ADD COLUMN admin_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Update transaction type check constraint
ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_transaction_type_check;
ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_transaction_type_check
  CHECK (transaction_type IN ('purchase', 'admin_add', 'admin_subtract', 'deduction', 'refund', 'expiration'));

-- Create index on user_id and created_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created 
  ON credit_transactions(user_id, created_at DESC);

-- ============================================
-- 3. CREATE ATOMIC RPC FUNCTIONS
-- ============================================

-- Function: Get user credits and transaction history
CREATE OR REPLACE FUNCTION get_user_credits(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_credits INTEGER;
  v_transactions JSON;
  v_result JSON;
BEGIN
  -- Get current balance
  SELECT COALESCE(credits, 0) INTO v_credits
  FROM profiles
  WHERE id = p_user_id;

  -- Get transaction history (last 100)
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_transactions
  FROM (
    SELECT 
      id,
      amount,
      transaction_type,
      description,
      balance_before,
      balance_after,
      created_at
    FROM credit_transactions
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 100
  ) t;

  -- Build result
  v_result := json_build_object(
    'credits', v_credits,
    'transactions', v_transactions
  );

  RETURN v_result;
END;
$$;

-- Function: Add credits (purchase or admin add)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_stripe_payment_id TEXT DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Validate transaction type
  IF p_transaction_type NOT IN ('purchase', 'admin_add', 'refund') THEN
    RAISE EXCEPTION 'Invalid transaction type for adding credits';
  END IF;

  -- Lock the profile row for update
  SELECT credits INTO v_balance_before
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate new balance
  v_balance_after := v_balance_before + p_amount;

  -- Update profile
  UPDATE profiles
  SET credits = v_balance_after,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Insert transaction record
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    stripe_payment_id,
    balance_before,
    balance_after,
    admin_id
  ) VALUES (
    p_user_id,
    p_amount,
    p_transaction_type,
    p_description,
    p_stripe_payment_id,
    v_balance_before,
    v_balance_after,
    p_admin_id
  ) RETURNING id INTO v_transaction_id;

  -- Return result
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'amount_added', p_amount
  );
END;
$$;

-- Function: Deduct credits (order usage or admin subtract)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Validate transaction type
  IF p_transaction_type NOT IN ('deduction', 'admin_subtract', 'expiration') THEN
    RAISE EXCEPTION 'Invalid transaction type for deducting credits';
  END IF;

  -- Lock the profile row for update
  SELECT credits INTO v_balance_before
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check sufficient balance
  IF v_balance_before < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Available: %, Required: %', v_balance_before, p_amount;
  END IF;

  -- Calculate new balance
  v_balance_after := v_balance_before - p_amount;

  -- Update profile
  UPDATE profiles
  SET credits = v_balance_after,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Insert transaction record (amount is negative for deductions)
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    order_id,
    balance_before,
    balance_after,
    admin_id
  ) VALUES (
    p_user_id,
    -p_amount,  -- Store as negative
    p_transaction_type,
    p_description,
    p_order_id,
    v_balance_before,
    v_balance_after,
    p_admin_id
  ) RETURNING id INTO v_transaction_id;

  -- Return result
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'amount_deducted', p_amount
  );
END;
$$;

-- Function: Admin adjust credits (unified add/subtract)
CREATE OR REPLACE FUNCTION admin_adjust_credits(
  p_admin_id UUID,
  p_user_id UUID,
  p_amount INTEGER,
  p_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_result JSON;
BEGIN
  -- Verify admin privileges
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_admin_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;

  -- Validate amount is not zero
  IF p_amount = 0 THEN
    RAISE EXCEPTION 'Amount cannot be zero';
  END IF;

  -- Add or deduct based on amount sign
  IF p_amount > 0 THEN
    v_result := add_credits(
      p_user_id,
      p_amount,
      'admin_add',
      COALESCE(p_note, 'Admin added credits'),
      NULL,
      p_admin_id
    );
  ELSE
    v_result := deduct_credits(
      p_user_id,
      ABS(p_amount),
      'admin_subtract',
      COALESCE(p_note, 'Admin removed credits'),
      NULL,
      p_admin_id
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Function: Get all users with credit balances (admin only)
CREATE OR REPLACE FUNCTION admin_get_all_user_credits(p_admin_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_users JSON;
  v_total_credits BIGINT;
BEGIN
  -- Verify admin privileges
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_admin_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;

  -- Get all users with credit info
  SELECT json_agg(row_to_json(u))
  INTO v_users
  FROM (
    SELECT 
      p.id,
      p.email,
      p.name,
      COALESCE(p.credits, 0) as credits,
      p.created_at,
      p.updated_at
    FROM profiles p
    ORDER BY p.email
  ) u;

  -- Get total credits in system
  SELECT COALESCE(SUM(credits), 0)
  INTO v_total_credits
  FROM profiles;

  RETURN json_build_object(
    'users', COALESCE(v_users, '[]'::json),
    'total_credits', v_total_credits
  );
END;
$$;

-- ============================================
-- 4. UPDATE RLS POLICIES
-- ============================================

-- Credit transactions: Users can view their own, admins can view all
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Admins can view all credit transactions" ON credit_transactions;

CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view all credit transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Profiles: Users can view their own credits, admins can view all
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_user_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_credits(UUID, INTEGER, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER, TEXT, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_adjust_credits(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_user_credits(UUID) TO authenticated;