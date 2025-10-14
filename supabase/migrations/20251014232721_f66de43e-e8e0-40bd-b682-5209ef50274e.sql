-- Add credits column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 0;

-- Add credits_used column to orders table to track how many credits were consumed
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS credits_used integer;

-- Create a credits_transactions table for detailed tracking
CREATE TABLE IF NOT EXISTS public.credits_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund')),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  stripe_payment_id text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on credits_transactions
ALTER TABLE public.credits_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own credit transactions
CREATE POLICY "Users can view their own credit transactions"
ON public.credits_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_credits_transactions_user_id ON public.credits_transactions(user_id);
CREATE INDEX idx_credits_transactions_created_at ON public.credits_transactions(created_at DESC);