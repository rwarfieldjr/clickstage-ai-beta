-- =====================================================
-- CREDIT SYSTEM V2: Migration from email-based to user_id-based
-- =====================================================

-- Step 1: Rename old tables to preserve data
ALTER TABLE IF EXISTS public.user_credits RENAME TO user_credits_old;
ALTER TABLE IF EXISTS public.credits_transactions RENAME TO credits_transactions_old;

-- Step 2: Create new simplified schema
CREATE TABLE public.user_credits_new (
  user_id UUID PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3: Migrate data from old tables
-- Match emails to user_ids from profiles table
INSERT INTO public.user_credits_new (user_id, credits, updated_at)
SELECT p.id, uc.credits, uc.updated_at
FROM user_credits_old uc
JOIN profiles p ON p.email = uc.email
ON CONFLICT (user_id) DO UPDATE SET
  credits = EXCLUDED.credits,
  updated_at = EXCLUDED.updated_at;

-- Step 4: Rename new table to final name
DROP TABLE IF EXISTS public.user_credits CASCADE;
ALTER TABLE public.user_credits_new RENAME TO user_credits;

-- Step 5: Create indexes
CREATE INDEX idx_credit_ledger_user_time ON public.credit_ledger(user_id, created_at DESC);

-- Step 6: Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

-- Step 7: Create policies
CREATE POLICY "credits self-read"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "ledger self-read"
ON public.credit_ledger
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "admins can view all credits"
ON public.user_credits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can view all ledger"
ON public.credit_ledger
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 8: Create atomic credit update function
CREATE OR REPLACE FUNCTION public.update_user_credits_atomic(
  p_user_id UUID,
  p_delta INTEGER,
  p_reason TEXT,
  p_order_id UUID DEFAULT NULL
)
RETURNS TABLE (ok BOOLEAN, balance INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Ensure the row exists
  INSERT INTO public.user_credits(user_id, credits)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock the row to prevent races
  UPDATE public.user_credits
     SET credits = credits
   WHERE user_id = p_user_id
   RETURNING credits INTO v_balance;

  -- Calculate new balance; forbid negatives
  IF v_balance + p_delta < 0 THEN
    RETURN QUERY SELECT false, v_balance, 'insufficient_credits';
    RETURN;
  END IF;

  -- Apply update
  UPDATE public.user_credits
     SET credits = credits + p_delta,
         updated_at = now()
   WHERE user_id = p_user_id
  RETURNING credits INTO v_balance;

  -- Write immutable ledger record
  INSERT INTO public.credit_ledger(user_id, order_id, delta, balance_after, reason)
  VALUES (p_user_id, p_order_id, p_delta, v_balance, COALESCE(p_reason,'unspecified'));

  RETURN QUERY SELECT true, v_balance, NULL::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, v_balance, SQLERRM;
END;
$$;

-- Step 9: Grant permissions
REVOKE ALL ON FUNCTION public.update_user_credits_atomic(UUID, INTEGER, TEXT, UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.update_user_credits_atomic(UUID, INTEGER, TEXT, UUID) TO anon, authenticated, service_role;

-- Step 10: Drop old RPC function that used email
DROP FUNCTION IF EXISTS public.deduct_credits_if_available(TEXT, INTEGER);

-- Note: Keep old tables for reference, they can be dropped manually after verification
-- DROP TABLE IF EXISTS user_credits_old;
-- DROP TABLE IF EXISTS credits_transactions_old;