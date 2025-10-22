-- Update credits_transactions table to ensure expires_at is properly set
-- Add index for better query performance on expiration checks
CREATE INDEX IF NOT EXISTS idx_credits_expires_at ON public.credits_transactions(expires_at) 
WHERE expires_at IS NOT NULL AND transaction_type = 'purchase';

-- Create a function to automatically set expiration dates on credit purchases
CREATE OR REPLACE FUNCTION public.set_credit_expiration()
RETURNS TRIGGER AS $$
DECLARE
  expiration_months INTEGER;
BEGIN
  -- Only set expiration for purchase transactions
  IF NEW.transaction_type = 'purchase' AND NEW.expires_at IS NULL THEN
    -- Determine expiration based on amount purchased
    IF NEW.amount <= 10 THEN
      expiration_months := 6;  -- 1-10 credits expire in 6 months
    ELSE
      expiration_months := 12; -- 20+ credits expire in 12 months
    END IF;
    
    NEW.expires_at := NOW() + (expiration_months || ' months')::INTERVAL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-set expiration dates
DROP TRIGGER IF EXISTS set_credit_expiration_trigger ON public.credits_transactions;
CREATE TRIGGER set_credit_expiration_trigger
  BEFORE INSERT ON public.credits_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_credit_expiration();

-- Update existing purchase transactions without expiration dates
UPDATE public.credits_transactions
SET expires_at = CASE 
  WHEN amount <= 10 THEN created_at + INTERVAL '6 months'
  ELSE created_at + INTERVAL '12 months'
END
WHERE transaction_type = 'purchase' 
  AND expires_at IS NULL;