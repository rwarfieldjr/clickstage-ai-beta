-- Create rate limiting table for checkout endpoint
CREATE TABLE IF NOT EXISTS public.checkout_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ip_address)
);

-- Enable RLS
ALTER TABLE public.checkout_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role full access to rate limits"
ON public.checkout_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_checkout_rate_limits_ip ON public.checkout_rate_limits(ip_address);
CREATE INDEX idx_checkout_rate_limits_window ON public.checkout_rate_limits(window_start);

-- Function to clean up old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.checkout_rate_limits
  WHERE window_start < now() - interval '24 hours';
END;
$$;