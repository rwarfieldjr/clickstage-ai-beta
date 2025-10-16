-- Add order_number column to orders table
ALTER TABLE public.orders 
ADD COLUMN order_number BIGINT;

-- Create a sequence starting at 1123
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1123;

-- Set order_number for existing orders (if any)
UPDATE public.orders 
SET order_number = nextval('order_number_seq') 
WHERE order_number IS NULL;

-- Make order_number NOT NULL and add default
ALTER TABLE public.orders 
ALTER COLUMN order_number SET DEFAULT nextval('order_number_seq'),
ALTER COLUMN order_number SET NOT NULL;

-- Add unique constraint
ALTER TABLE public.orders 
ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);

-- Create index for better performance
CREATE INDEX idx_orders_order_number ON public.orders(order_number);