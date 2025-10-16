-- Add expires_at column to credits_transactions table
ALTER TABLE public.credits_transactions
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for expiration queries
CREATE INDEX idx_credits_transactions_expires_at ON public.credits_transactions(expires_at);

-- Add comment to document expiration logic
COMMENT ON COLUMN public.credits_transactions.expires_at IS 'Credits from 1-10 photo bundles expire after 6 months, 20+ photo bundles expire after 12 months';