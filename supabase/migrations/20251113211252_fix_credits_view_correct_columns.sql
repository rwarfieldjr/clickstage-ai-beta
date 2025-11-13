/*
  # Fix Credits View with Correct Column Names

  1. Changes
    - Update credits_view to use correct column names
    - 'credits' instead of 'balance' in user_credits
    - 'name' instead of 'full_name' in profiles
    
  2. Security
    - No security changes needed
*/

-- Drop existing view
DROP VIEW IF EXISTS public.credits_view;

-- Create credits_view with correct column names
CREATE OR REPLACE VIEW public.credits_view AS
SELECT
  u.id as user_id,
  u.email,
  COALESCE(uc.credits, 0) as balance,
  p.name
FROM auth.users u
LEFT JOIN public.user_credits uc ON uc.user_id = u.id
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.email;

-- Grant access to authenticated users (admin check happens via RLS)
GRANT SELECT ON public.credits_view TO authenticated;

-- Update add_credits function
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
  INSERT INTO user_credits (user_id, credits, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    credits = user_credits.credits + p_amount,
    updated_at = now()
  RETURNING credits INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

-- Update subtract_credits function
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
    credits = GREATEST(0, credits - p_amount),
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;

  -- If no row found, create one with 0 credits
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits, updated_at)
    VALUES (p_user_id, 0, now())
    RETURNING credits INTO v_new_balance;
  END IF;

  RETURN v_new_balance;
END;
$$;

-- Update set_credits function
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
  INSERT INTO user_credits (user_id, credits, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    credits = p_amount,
    updated_at = now()
  RETURNING credits INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

-- Update deduct_credits function to use correct column
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
  SELECT credits INTO v_current_balance
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
    credits = credits - p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

END;
$$;
