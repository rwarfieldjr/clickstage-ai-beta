-- Fix the search_path security issue for generate_order_number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num BIGINT;
BEGIN
  next_num := nextval('order_number_seq');
  RETURN 'ORD-' || LPAD(next_num::TEXT, 6, '0');
END;
$$;