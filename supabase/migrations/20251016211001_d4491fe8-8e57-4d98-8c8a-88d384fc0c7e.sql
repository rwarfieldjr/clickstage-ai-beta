-- Create a sequence for order numbers starting at 1000
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1000;

-- Function to generate the next order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_num BIGINT;
BEGIN
  next_num := nextval('order_number_seq');
  RETURN 'ORD-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Update orders table to use text for order_number and add default
ALTER TABLE orders ALTER COLUMN order_number TYPE TEXT;
ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT generate_order_number();