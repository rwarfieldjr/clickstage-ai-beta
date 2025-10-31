-- Add storage bucket RLS policies for secure file access
-- Users can only upload files to their own folders or guest session folders

-- Policy: Users can upload files to their own user folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'original-images' AND
  (
    -- Authenticated users can upload to their user_id folder
    (auth.uid()::text = (storage.foldername(name))[1]) OR
    -- Allow uploads to guest folders for unauthenticated users
    ((storage.foldername(name))[1] = 'guest' AND auth.uid() IS NULL)
  )
);

-- Policy: Users can read files from their own folder
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'original-images' AND
  (
    -- Authenticated users can read from their user_id folder
    (auth.uid()::text = (storage.foldername(name))[1]) OR
    -- Admins can read all files
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'original-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'original-images' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Add similar policies for uploads bucket
CREATE POLICY "Users can upload to uploads bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    ((storage.foldername(name))[1] = 'guest' AND auth.uid() IS NULL)
  )
);

CREATE POLICY "Users can read from uploads bucket"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'uploads' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Add policies for staged bucket (admin-only write, users can read their own)
CREATE POLICY "Admins can upload to staged bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'staged' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can read their staged files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'staged' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);