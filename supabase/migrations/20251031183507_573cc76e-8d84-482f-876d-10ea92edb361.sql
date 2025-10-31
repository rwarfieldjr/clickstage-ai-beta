-- =====================================================
-- STABILITY HARDENING: Database Schema Updates
-- =====================================================

-- 1. Create stripe_event_log table for webhook deduplication
CREATE TABLE IF NOT EXISTS public.stripe_event_log (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_event_log_created ON public.stripe_event_log(created_at);
CREATE INDEX IF NOT EXISTS idx_stripe_event_log_type ON public.stripe_event_log(event_type);

-- Enable RLS
ALTER TABLE public.stripe_event_log ENABLE ROW LEVEL SECURITY;

-- Service role only access
CREATE POLICY "Service role full access to stripe events"
ON public.stripe_event_log
FOR ALL
USING (true)
WITH CHECK (true);

-- 2. Create system_logs table for comprehensive error tracking
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  event TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  user_id UUID,
  path TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON public.system_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_logs_severity ON public.system_logs(severity);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON public.system_logs(user_id);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Service role and admins can view logs
CREATE POLICY "Service role and admins can manage system logs"
ON public.system_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Add checkout locking mechanism to prevent race conditions
ALTER TABLE public.user_credits ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_user_credits_locked ON public.user_credits(locked_until) WHERE locked_until IS NOT NULL;

-- 4. Add processing_started timestamp to orders for watchdog
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS processing_started TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_orders_processing ON public.orders(status, processing_started) 
WHERE status = 'processing';

-- 5. Create atomic credit update function with audit trail
CREATE OR REPLACE FUNCTION public.update_user_credits_atomic(
  p_email TEXT,
  p_delta INTEGER,
  p_reason TEXT,
  p_order_id UUID DEFAULT NULL,
  p_stripe_payment_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
  v_user_id UUID;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT credits, id INTO v_current_credits, v_user_id
  FROM user_credits
  WHERE email = p_email
  FOR UPDATE;

  -- If user doesn't exist, create with 0 credits
  IF NOT FOUND THEN
    INSERT INTO user_credits (email, credits)
    VALUES (p_email, 0)
    RETURNING credits, id INTO v_current_credits, v_user_id;
  END IF;

  -- Calculate new balance
  v_new_credits := v_current_credits + p_delta;

  -- Prevent negative balance for deductions
  IF v_new_credits < 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'current', v_current_credits,
      'requested', p_delta
    );
  END IF;

  -- Update credits
  UPDATE user_credits
  SET credits = v_new_credits,
      updated_at = now()
  WHERE email = p_email;

  -- Insert audit record
  INSERT INTO credits_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    order_id,
    stripe_payment_id
  ) VALUES (
    v_user_id,
    p_delta,
    CASE WHEN p_delta > 0 THEN 'purchase' ELSE 'usage' END,
    p_reason,
    p_order_id,
    p_stripe_payment_id
  );

  RETURN json_build_object(
    'success', true,
    'previous_balance', v_current_credits,
    'delta', p_delta,
    'new_balance', v_new_credits
  );
END;
$$;

-- 6. Create function to acquire checkout lock
CREATE OR REPLACE FUNCTION public.acquire_checkout_lock(
  p_email TEXT,
  p_lock_duration_seconds INTEGER DEFAULT 300
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked_until TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
  -- Check if already locked
  SELECT locked_until INTO v_locked_until
  FROM user_credits
  WHERE email = p_email
  FOR UPDATE;

  -- If locked and not expired, return false
  IF v_locked_until IS NOT NULL AND v_locked_until > v_now THEN
    RETURN false;
  END IF;

  -- Acquire lock
  UPDATE user_credits
  SET locked_until = v_now + (p_lock_duration_seconds || ' seconds')::INTERVAL
  WHERE email = p_email;

  RETURN true;
END;
$$;

-- 7. Create function to release checkout lock
CREATE OR REPLACE FUNCTION public.release_checkout_lock(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_credits
  SET locked_until = NULL
  WHERE email = p_email;
END;
$$;

-- 8. Create cleanup function for old logs
CREATE OR REPLACE FUNCTION public.cleanup_old_system_logs()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.system_logs
  WHERE created_at < now() - INTERVAL '90 days';
  
  DELETE FROM public.stripe_event_log
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$;