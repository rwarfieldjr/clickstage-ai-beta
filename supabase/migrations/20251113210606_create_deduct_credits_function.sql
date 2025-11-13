/*
  # Create Deduct Credits RPC Function

  1. New Function
    - `deduct_credits(user_id uuid, amount int)` - Atomically deducts credits from user
    
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS
    - Validates user exists and has enough credits
    - Atomic operation to prevent race conditions
    
  3. Error Handling
    - Raises exception if user not found
    - Raises exception if insufficient credits
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.deduct_credits(uuid, int);

-- Create deduct_credits function with proper error handling
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid, 
  p_amount int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance int;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if user has credits record
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User credits record not found for user_id: %', p_user_id;
  END IF;

  -- Check if user has enough credits
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Current balance: %, Required: %', v_current_balance, p_amount;
  END IF;

  -- Deduct credits
  UPDATE user_credits
  SET 
    balance = balance - p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log the transaction
  INSERT INTO credits_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    created_at
  ) VALUES (
    p_user_id,
    -p_amount,
    'deduction',
    'Credits used for order',
    now()
  );

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, int) TO service_role;
