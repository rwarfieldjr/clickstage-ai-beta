-- Stabilize abandoned_checkouts table security
-- This table stores pre-authentication guest checkout data
-- All access is through edge functions with service_role only

-- 1. Drop all existing RLS policies
DROP POLICY IF EXISTS "Admins can view all abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Admins can update abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Admins can delete abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Public INSERT for guest checkout (rate-limited + CAPTCHA protec" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Service role can delete old checkouts" ON public.abandoned_checkouts;

-- 2. Disable RLS entirely (no authentication context for guest checkouts)
ALTER TABLE public.abandoned_checkouts DISABLE ROW LEVEL SECURITY;

-- 3. Revoke all permissions from public roles
REVOKE ALL ON TABLE public.abandoned_checkouts FROM anon, authenticated;

-- 4. Grant explicit permissions to service_role only
-- Edge functions handle all validation (rate limiting, CAPTCHA, input validation)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.abandoned_checkouts TO service_role;

-- Add comment documenting the security model
COMMENT ON TABLE public.abandoned_checkouts IS 
'Guest checkout tracking table. RLS disabled because users are not authenticated at checkout start. All access restricted to service_role through validated edge functions (create-checkout, purge-abandoned-checkouts). Automated cleanup runs daily via pg_cron at 3 AM UTC.';