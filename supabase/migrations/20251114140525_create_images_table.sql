/*
  # Create Images Table

  1. New Tables
    - `images`
      - `id` (uuid, primary key) - unique image identifier
      - `user_id` (uuid, foreign key) - references auth.users
      - `filename` (text) - original filename
      - `storage_path` (text) - path in Supabase storage
      - `bucket` (text) - storage bucket name (uploads/staged)
      - `url` (text) - public URL to image
      - `size` (bigint) - file size in bytes
      - `mime_type` (text) - image MIME type
      - `created_at` (timestamptz) - upload timestamp

  2. Security
    - Enable RLS on `images` table
    - Add policy for users to view their own images
    - Add policy for users to delete their own images
    - Add policy for users to insert their own images
*/

CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL,
  bucket text NOT NULL DEFAULT 'uploads',
  url text NOT NULL,
  size bigint NOT NULL DEFAULT 0,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own images"
  ON images
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images"
  ON images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images"
  ON images
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
