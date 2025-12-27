-- Create a storage bucket for group images
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-images', 'group-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload group images
CREATE POLICY "Authenticated users can upload group images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'group-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow public read access to group images
CREATE POLICY "Group images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'group-images');

-- Allow group admins to update their group images
CREATE POLICY "Users can update their uploaded group images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'group-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow group admins to delete their group images
CREATE POLICY "Users can delete their uploaded group images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'group-images' 
  AND auth.uid() IS NOT NULL
);