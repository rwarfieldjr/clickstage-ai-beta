/*
  # Add Payment Type and Credit Cost to Orders

  1. Changes
    - Add `payment_type` column (text) to track if payment was via stripe or credits
    - Add `credit_cost` column (integer) to track how many credits were used
    
  2. Security
    - No RLS changes needed as orders table already has proper policies
*/

-- Add payment_type column to track payment method
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_type text DEFAULT 'stripe';
  END IF;
END $$;

-- Add credit_cost column to track credits spent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'credit_cost'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN credit_cost integer DEFAULT 0;
  END IF;
END $$;

-- Create index for better query performance on payment_type
CREATE INDEX IF NOT EXISTS idx_orders_payment_type ON public.orders(payment_type);
