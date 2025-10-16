-- Fix RLS policy for abandoned_checkouts to allow guest inserts
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can insert abandoned checkouts" ON abandoned_checkouts;

-- Create a new PERMISSIVE policy that allows anyone to insert
CREATE POLICY "Anyone can insert abandoned checkouts"
ON abandoned_checkouts
FOR INSERT
TO public
WITH CHECK (true);