-- ============================================================================
-- CREDIT SYSTEM UNIFICATION - Database Consistency & Performance
-- ============================================================================
-- This migration ensures the unified user_id-based credit system is fully
-- indexed and optimized for production use.

-- 1. Add performance indexes on user_credits table
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_updated_at ON public.user_credits(updated_at DESC);

-- 2. Add performance indexes on credit_ledger table
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON public.credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_created_at ON public.credit_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_order_id ON public.credit_ledger(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_created ON public.credit_ledger(user_id, created_at DESC);

-- 3. Add performance indexes on processed_stripe_sessions
CREATE INDEX IF NOT EXISTS idx_processed_sessions_user_id ON public.processed_stripe_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_processed_sessions_session_id ON public.processed_stripe_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_processed_sessions_payment_intent ON public.processed_stripe_sessions(payment_intent_id) WHERE payment_intent_id IS NOT NULL;

-- 4. Add comment to archived table to prevent accidental use
COMMENT ON TABLE public.user_credits_archived_20251104 IS 'ARCHIVED: Email-based credit system. Deprecated 2025-11-04. Use user_credits (user_id-based) instead.';
COMMENT ON TABLE public.credits_transactions_old IS 'DEPRECATED: Old transaction system. Use credit_ledger instead.';

-- 5. Create helper function to get user credit balance (optimized)
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(credits, 0)
  FROM public.user_credits
  WHERE user_id = p_user_id;
$$;

COMMENT ON FUNCTION public.get_user_credit_balance(UUID) IS 'Fast lookup of user credit balance from unified user_credits table';

-- 6. Create helper function to get credit transaction history
CREATE OR REPLACE FUNCTION public.get_user_credit_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  transaction_id UUID,
  delta INTEGER,
  balance_after INTEGER,
  reason TEXT,
  order_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id as transaction_id,
    delta,
    balance_after,
    reason,
    order_id,
    created_at
  FROM public.credit_ledger
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION public.get_user_credit_history(UUID, INTEGER) IS 'Retrieve user credit transaction history from unified credit_ledger';

-- 7. Add verification check to ensure no orphaned credit records
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM public.user_credits uc
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = uc.user_id
  );
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned credit records without matching profiles', orphaned_count;
  ELSE
    RAISE NOTICE 'Credit system verification: All records have valid user profiles';
  END IF;
END $$;