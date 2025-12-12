-- Fix: stripe_event_log table incorrectly allows public access
-- Drop the misconfigured policy that uses 'public' role
DROP POLICY IF EXISTS "Service role full access to stripe events" ON public.stripe_event_log;

-- Create the correct policy that restricts access to service_role only
CREATE POLICY "Service role full access to stripe events"
ON public.stripe_event_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);