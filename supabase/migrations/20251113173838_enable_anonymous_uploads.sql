/*
  # Enable Anonymous Uploads to Storage Buckets

  ## Changes
  1. Add RLS policy to allow anonymous (anon role) users to INSERT into uploads bucket
  2. Add RLS policy to allow anonymous (anon role) users to INSERT into staged bucket
  3. Keep existing authenticated and service role policies intact

  ## Security Notes
  - Anonymous users can ONLY upload (INSERT)
  - Anonymous users CANNOT read, update, or delete files
  - Authenticated users and service role retain full permissions
  - This allows guest checkout flow without forcing login
*/

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous uploads to uploads bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to staged bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to avatars bucket" ON storage.objects;

-- Allow anonymous uploads to 'uploads' bucket
CREATE POLICY "Allow anonymous uploads to uploads bucket"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'uploads');

-- Allow anonymous uploads to 'staged' bucket
CREATE POLICY "Allow anonymous uploads to staged bucket"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'staged');

-- Allow anonymous uploads to 'avatars' bucket (for profile pics during signup)
CREATE POLICY "Allow anonymous uploads to avatars bucket"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'avatars');