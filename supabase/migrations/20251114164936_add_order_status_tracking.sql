/*
  # Add Order Status Tracking
  
  1. Changes to `orders` table
    - Add `status` column (text, default 'pending') - Order status: pending, processing, completed
    - Add `completed_at` column (timestamptz) - When the order was completed
    
  2. Updates
    - Add index on status column for faster filtering
    - Add index on completed_at for date queries
    
  3. Notes
    - Existing orders will default to 'pending' status
    - completed_at remains null until order is marked complete
    - Status transitions: pending → processing → completed
*/

-- Add status column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'status'
  ) THEN
    ALTER TABLE orders ADD COLUMN status text DEFAULT 'pending';
  END IF;
END $$;

-- Add completed_at column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON orders(completed_at DESC);

-- Add constraint to ensure valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_status_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_status_check 
      CHECK (status IN ('pending', 'processing', 'completed'));
  END IF;
END $$;