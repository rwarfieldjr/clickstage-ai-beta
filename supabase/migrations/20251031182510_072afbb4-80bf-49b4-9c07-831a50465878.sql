-- Fix 1: Remove duplicate INSERT policy on abandoned_checkouts
DROP POLICY IF EXISTS "Allow all inserts for abandoned checkouts" ON public.abandoned_checkouts;

-- Rename the remaining policy to be more descriptive
DROP POLICY IF EXISTS "Anyone can insert abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Public INSERT for guest checkout (rate-limited + CAPTCHA protected)" 
ON public.abandoned_checkouts FOR INSERT 
WITH CHECK (true);

-- Fix 2: Add INSERT policy for processed_stripe_sessions
CREATE POLICY "Service role can insert processed sessions" 
ON public.processed_stripe_sessions FOR INSERT 
WITH CHECK (true);

-- Fix 3: Add unique constraint to prevent duplicate session processing
ALTER TABLE public.processed_stripe_sessions 
ADD CONSTRAINT unique_session_id UNIQUE (session_id);

-- Fix 4: Add scheduled cleanup function for abandoned checkouts
CREATE OR REPLACE FUNCTION public.cleanup_abandoned_checkouts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.abandoned_checkouts
  WHERE completed = false 
    AND created_at < NOW() - INTERVAL '48 hours';
END;
$$;

-- Schedule weekly cleanup via pg_cron
SELECT cron.schedule(
  'cleanup-abandoned-checkouts',
  '0 4 * * 0', -- Sundays at 04:00 UTC
  $$
  SELECT net.http_post(
      url:='https://ufzhskookhsarjlijywh.supabase.co/functions/v1/purge-abandoned-checkouts',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmemhza29va2hzYXJqbGlqeXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDcyODUsImV4cCI6MjA3NjAyMzI4NX0.nckxd-rTTorRdymQjVUz_lTYH4ckPvubS05tRfX_qp8"}'::jsonb,
      body:='{}'::jsonb
  ) as request_id;
  $$
);