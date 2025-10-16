-- Allow anyone (including guests) to upload to original-images bucket
CREATE POLICY "Anyone can upload to original-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'original-images');

-- Allow anyone to read from original-images bucket (it's already public)
CREATE POLICY "Anyone can read from original-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'original-images');