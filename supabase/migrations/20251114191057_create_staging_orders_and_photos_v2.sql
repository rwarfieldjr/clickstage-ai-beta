/*
  # Create Staging Orders and Original Photos Tables

  1. New Tables
    - `staging_orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `bundle_selected` (text)
      - `staging_style` (text)
      - `address_of_property` (text)
      - `notes` (text, nullable)
      - `status` (text, default 'pending')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `staging_original_photos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `order_id` (uuid, foreign key to staging_orders)
      - `file_path` (text)
      - `file_name` (text)
      - `uploaded_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can read their own data
    - Users can insert their own data
    - Admins can read all data
    - Admins can update/delete all data

  3. Indexes
    - Index on user_id for both tables
    - Index on order_id for photos table
    - Index on status for orders table
*/

-- Create staging_orders table
CREATE TABLE IF NOT EXISTS staging_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bundle_selected text NOT NULL,
  staging_style text,
  address_of_property text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create staging_original_photos table
CREATE TABLE IF NOT EXISTS staging_original_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES staging_orders(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staging_orders_user_id ON staging_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_staging_orders_status ON staging_orders(status);
CREATE INDEX IF NOT EXISTS idx_staging_orders_created_at ON staging_orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_staging_original_photos_user_id ON staging_original_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_staging_original_photos_order_id ON staging_original_photos(order_id);

-- Enable RLS
ALTER TABLE staging_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staging_original_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staging_orders
CREATE POLICY "Users can view their own orders"
  ON staging_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON staging_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON staging_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON staging_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all orders"
  ON staging_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for staging_original_photos
CREATE POLICY "Users can view their own photos"
  ON staging_original_photos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own photos"
  ON staging_original_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
  ON staging_original_photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all photos"
  ON staging_original_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all photos"
  ON staging_original_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staging_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_staging_orders_updated_at_trigger ON staging_orders;
CREATE TRIGGER update_staging_orders_updated_at_trigger
  BEFORE UPDATE ON staging_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_staging_orders_updated_at();
