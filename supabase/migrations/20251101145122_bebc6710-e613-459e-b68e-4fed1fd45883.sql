-- Create checkout health log table for automated stability checks
CREATE TABLE IF NOT EXISTS public.checkout_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkout_health_log ENABLE ROW LEVEL SECURITY;

-- Service role can insert health checks
CREATE POLICY "Service role can insert health checks"
ON public.checkout_health_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- Admins can view health logs
CREATE POLICY "Admins can view health logs"
ON public.checkout_health_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for faster queries
CREATE INDEX idx_checkout_health_log_timestamp ON public.checkout_health_log(timestamp DESC);
CREATE INDEX idx_checkout_health_log_success ON public.checkout_health_log(success, timestamp DESC);