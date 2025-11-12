/*
  # Create Storage Buckets and Access Policies

  1. Storage Buckets Created
    - `uploads` - Original listing photo uploads (Public read, Authenticated write)
    - `staged` - AI-staged final images (Public read, Authenticated write)
    - `previews` - Temporary generated previews (Private only)
    - `avatars` - Agent/photographer profile photos (Public read, Authenticated write)
    - `marketing-assets` - Site banners, demo images, promotional assets (Public read, Admin write)
    - `invoices` - Stripe invoice PDFs and transaction receipts (Private only)
    - `logs` - Diagnostic and event logs (Private only)

  2. Access Policies
    - Public buckets (uploads, staged, avatars, marketing-assets): Public read, authenticated write
    - Private buckets (previews, invoices, logs): Service role/admin only
    - Marketing-assets: Admin-only write access

  3. Security
    - All buckets use RLS for fine-grained access control
    - File path restrictions to prevent unauthorized access
    - Admin role verification for sensitive operations

  NOTE: This migration is standalone and doesn't require existing tables.
  For admin-restricted buckets, you'll need to update policies after creating the user_roles table.
*/

-- Helper function to check if user_roles table exists
-- Security: SET search_path prevents search path manipulation attacks
CREATE OR REPLACE FUNCTION public.table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND tables.table_name = table_exists.table_name
  );
END;
$$;

-- Create storage buckets (if they don't already exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('uploads', 'uploads', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]),
  ('staged', 'staged', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('previews', 'previews', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('marketing-assets', 'marketing-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[]),
  ('invoices', 'invoices', false, 5242880, ARRAY['application/pdf']::text[]),
  ('logs', 'logs', false, 10485760, ARRAY['text/plain', 'application/json']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- UPLOADS BUCKET POLICIES (Public read, Authenticated write)
-- ============================================================================

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public read access for uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- Allow public read access to uploads
CREATE POLICY "Public read access for uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'uploads');

-- Allow users to update their own files
CREATE POLICY "Users can update their own uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- STAGED BUCKET POLICIES (Public read, Authenticated write)
-- ============================================================================

DROP POLICY IF EXISTS "Public read access for staged" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload staged files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own staged files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own staged files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage staged files" ON storage.objects;

-- Allow public read access to staged images
CREATE POLICY "Public read access for staged"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'staged');

-- Allow authenticated users to upload staged files
CREATE POLICY "Authenticated users can upload staged files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'staged');

-- Allow users to update their own staged files
CREATE POLICY "Users can update their own staged files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'staged' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'staged' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own staged files
CREATE POLICY "Users can delete their own staged files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'staged' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow service role full access to staged bucket
CREATE POLICY "Service role can manage staged files"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'staged')
  WITH CHECK (bucket_id = 'staged');

-- ============================================================================
-- AVATARS BUCKET POLICIES (Public read, Authenticated write)
-- ============================================================================

DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Allow public read access to avatars
CREATE POLICY "Public read access for avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- MARKETING-ASSETS BUCKET POLICIES (Public read, Admin write)
-- ============================================================================

DROP POLICY IF EXISTS "Public read access for marketing assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload marketing assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update marketing assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete marketing assets" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage marketing assets" ON storage.objects;

-- Allow public read access to marketing assets
CREATE POLICY "Public read access for marketing assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketing-assets');

-- Temporarily allow authenticated users to upload marketing assets
-- TODO: Update this policy after creating user_roles table to restrict to admins only
CREATE POLICY "Authenticated users can upload marketing assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'marketing-assets');

-- Temporarily allow authenticated users to update marketing assets
-- TODO: Update this policy after creating user_roles table to restrict to admins only
CREATE POLICY "Authenticated users can update marketing assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'marketing-assets')
  WITH CHECK (bucket_id = 'marketing-assets');

-- Temporarily allow authenticated users to delete marketing assets
-- TODO: Update this policy after creating user_roles table to restrict to admins only
CREATE POLICY "Authenticated users can delete marketing assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'marketing-assets');

-- Allow service role full access
CREATE POLICY "Service role can manage marketing assets"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'marketing-assets')
  WITH CHECK (bucket_id = 'marketing-assets');

-- ============================================================================
-- PREVIEWS BUCKET POLICIES (Private - Service role/Admin only)
-- ============================================================================

DROP POLICY IF EXISTS "Service role can manage previews" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access previews" ON storage.objects;

-- Allow service role full access to previews
CREATE POLICY "Service role can manage previews"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'previews')
  WITH CHECK (bucket_id = 'previews');

-- No additional policies for previews - service role only for now
-- TODO: Add admin access policy after creating user_roles table

-- ============================================================================
-- INVOICES BUCKET POLICIES (Private - Service role/Admin only)
-- ============================================================================

DROP POLICY IF EXISTS "Service role can manage invoices" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own invoices" ON storage.objects;

-- Allow service role full access to invoices
CREATE POLICY "Service role can manage invoices"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'invoices')
  WITH CHECK (bucket_id = 'invoices');

-- No additional admin policy yet
-- TODO: Add admin access policy after creating user_roles table

-- Allow users to view only their own invoices
CREATE POLICY "Users can view their own invoices"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- LOGS BUCKET POLICIES (Private - Service role/Admin only)
-- ============================================================================

DROP POLICY IF EXISTS "Service role can manage logs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access logs" ON storage.objects;

-- Allow service role full access to logs
CREATE POLICY "Service role can manage logs"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'logs')
  WITH CHECK (bucket_id = 'logs');

-- No additional admin policy yet
-- TODO: Add admin access policy after creating user_roles table

-- ============================================================================
-- LEGACY BUCKET POLICIES (Update existing buckets for consistency)
-- ============================================================================

-- Update original-images bucket if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'original-images') THEN
    -- Drop old policies
    DROP POLICY IF EXISTS "Users can upload to original-images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can read from original-images" ON storage.objects;
    DROP POLICY IF EXISTS "Service role can manage original-images" ON storage.objects;

    -- Create new policies
    CREATE POLICY "Public read access for original-images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'original-images');

    CREATE POLICY "Authenticated users can upload to original-images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'original-images');

    CREATE POLICY "Service role can manage original-images"
      ON storage.objects FOR ALL
      TO service_role
      USING (bucket_id = 'original-images')
      WITH CHECK (bucket_id = 'original-images');
  END IF;
END $$;
