-- Create storage policies for original-images bucket to allow uploads

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'original-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow guest users to upload to guest folder
CREATE POLICY "Guests can upload images"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'original-images' 
  AND (storage.foldername(name))[1] = 'guest'
);

-- Allow authenticated users to read their own images
CREATE POLICY "Users can read their own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'original-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow guests to read guest images
CREATE POLICY "Guests can read guest images"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'original-images' 
  AND (storage.foldername(name))[1] = 'guest'
);

-- Allow admins to read all images
CREATE POLICY "Admins can read all images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'original-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);