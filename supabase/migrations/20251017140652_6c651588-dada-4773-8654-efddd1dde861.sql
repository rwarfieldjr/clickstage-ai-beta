-- Make the original-images bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'original-images';

-- Create RLS policies for the original-images bucket
-- Allow users to view their own uploaded images
CREATE POLICY "Users can view their own original images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'original-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to upload their own images
CREATE POLICY "Users can upload their own original images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'original-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all original images
CREATE POLICY "Admins can view all original images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'original-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Allow admins to manage all original images
CREATE POLICY "Admins can manage all original images"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'original-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);