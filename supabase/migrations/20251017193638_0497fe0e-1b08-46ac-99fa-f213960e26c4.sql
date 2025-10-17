-- Create storage policies for the uploads bucket (public access for checkout)
CREATE POLICY "Allow anyone to upload to uploads bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow anyone to read from uploads bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Create storage policies for original-images bucket (authenticated users only)
CREATE POLICY "Allow authenticated to upload to original-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'original-images' AND auth.uid() = owner);

CREATE POLICY "Allow authenticated to read own files in original-images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'original-images' AND auth.uid() = owner);

-- Create storage policies for staged bucket (authenticated users only)
CREATE POLICY "Allow authenticated to upload to staged"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'staged' AND auth.uid() = owner);

CREATE POLICY "Allow authenticated to read own files in staged"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'staged' AND auth.uid() = owner);