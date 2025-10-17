-- Drop the public policies that allow anyone to access original-images
DROP POLICY IF EXISTS "Anyone can read from original-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view original images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to original-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload original images" ON storage.objects;