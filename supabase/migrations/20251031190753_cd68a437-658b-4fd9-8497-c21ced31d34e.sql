-- Fix: Add DELETE policy for abandoned_checkouts cleanup
-- This allows automated cleanup of abandoned checkouts after 48 hours
CREATE POLICY "Service role can delete old checkouts"
ON public.abandoned_checkouts
FOR DELETE
TO service_role
USING (completed = false AND created_at < NOW() - INTERVAL '48 hours');

-- Add admin DELETE policy for manual cleanup
CREATE POLICY "Admins can delete abandoned checkouts"
ON public.abandoned_checkouts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));