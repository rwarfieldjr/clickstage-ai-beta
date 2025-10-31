-- Re-enable RLS with service_role-only policies for abandoned_checkouts
-- This provides defense-in-depth while maintaining guest checkout functionality

-- Enable RLS
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role can insert abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Service role can select abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Service role can update abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Service role can delete old abandoned checkouts" ON public.abandoned_checkouts;

-- Service role can insert (for create-checkout edge function)
CREATE POLICY "Service role can insert abandoned checkouts"
ON public.abandoned_checkouts
FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role can select (for queries and monitoring)
CREATE POLICY "Service role can select abandoned checkouts"
ON public.abandoned_checkouts
FOR SELECT
TO service_role
USING (true);

-- Service role can update (for marking as completed)
CREATE POLICY "Service role can update abandoned checkouts"
ON public.abandoned_checkouts
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Service role can delete ONLY old abandoned checkouts (48+ hours, not completed)
CREATE POLICY "Service role can delete old abandoned checkouts"
ON public.abandoned_checkouts
FOR DELETE
TO service_role
USING (completed = false AND created_at < now() - interval '48 hours');

-- Update table comment to reflect RLS policy approach
COMMENT ON TABLE public.abandoned_checkouts IS 
'Guest checkout tracking table. Uses RLS with service_role-only policies. All access through validated edge functions (create-checkout, purge-abandoned-checkouts). DELETE policy enforces 48-hour minimum retention. Automated cleanup runs daily via pg_cron at 3 AM UTC.';