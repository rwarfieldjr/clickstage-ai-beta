-- Fix update_updated_at_column function to include proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add INSERT policy for payments table to only allow service role
CREATE POLICY "Only service role can insert payments"
ON public.payments
FOR INSERT
WITH CHECK (false);

-- Add comment explaining this is a service-role only table
COMMENT ON TABLE public.payments IS 'Service role only - payments are inserted by backend edge functions after Stripe verification';