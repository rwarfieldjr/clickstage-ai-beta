/*
  # Create Credit History and Management Functions

  1. New Tables
    - `credit_history` - Tracks all credit adjustments made by admins
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `admin_email` (text)
      - `change_type` (text) - 'add', 'subtract', 'set'
      - `amount` (integer)
      - `new_balance` (integer)
      - `created_at` (timestamptz)

  2. New Functions
    - `add_credits(user_id, amount)` - Adds credits to user balance
    - `subtract_credits(user_id, amount)` - Removes credits from user balance
    - `set_credits(user_id, amount)` - Sets credits to specific amount

  3. Security
    - Enable RLS on credit_history table
    - Only admins can view credit history
    - Functions are SECURITY DEFINER for admin use
*/

-- Create credit_history table
CREATE TABLE IF NOT EXISTS public.credit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_email text NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('add', 'subtract', 'set')),
  amount integer NOT NULL,
  new_balance integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view credit history
CREATE POLICY "Admins can view credit history"
  ON public.credit_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create policy for admins to insert credit history
CREATE POLICY "Admins can insert credit history"
  ON public.credit_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create add_credits function
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance int;
BEGIN
  -- Update or insert credits
  INSERT INTO user_credits (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = user_credits.balance + p_amount,
    updated_at = now()
  RETURNING balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

-- Create subtract_credits function
CREATE OR REPLACE FUNCTION public.subtract_credits(p_user_id uuid, p_amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance int;
BEGIN
  -- Update credits
  UPDATE user_credits
  SET
    balance = GREATEST(0, balance - p_amount),
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- If no row found, create one with 0 balance
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, balance, updated_at)
    VALUES (p_user_id, 0, now())
    RETURNING balance INTO v_new_balance;
  END IF;

  RETURN v_new_balance;
END;
$$;

-- Create set_credits function
CREATE OR REPLACE FUNCTION public.set_credits(p_user_id uuid, p_amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance int;
BEGIN
  -- Update or insert credits
  INSERT INTO user_credits (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = p_amount,
    updated_at = now()
  RETURNING balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.subtract_credits(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_credits(uuid, int) TO authenticated;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON public.credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_created_at ON public.credit_history(created_at DESC);
