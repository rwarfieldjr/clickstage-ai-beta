-- Drop existing policies on abandoned_checkouts
DROP POLICY IF EXISTS "Allow guest inserts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.abandoned_checkouts;

-- Create a permissive policy that allows anyone (even unauthenticated) to insert
CREATE POLICY "Allow all inserts for abandoned checkouts"
ON public.abandoned_checkouts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);