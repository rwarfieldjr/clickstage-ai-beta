-- Fix critical security issues in credits and RLS

-- 1. Add constraint to prevent negative credits
ALTER TABLE profiles 
ADD CONSTRAINT credits_non_negative 
CHECK (credits >= 0);

-- 2. Add RLS policy for users to record their own credit usage
CREATE POLICY "Users can record credit usage"
ON public.credits_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND transaction_type = 'usage'
  AND amount < 0
);