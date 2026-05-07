-- Create storage bucket for shop images
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-images', 'shop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to shop images
CREATE POLICY "Public can view shop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-images');

-- Allow authenticated admins to upload images
CREATE POLICY "Admins can upload shop images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'shop-images' AND is_admin(auth.uid()));

-- Allow authenticated admins to update images
CREATE POLICY "Admins can update shop images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'shop-images' AND is_admin(auth.uid()));

-- Allow authenticated admins to delete images
CREATE POLICY "Admins can delete shop images"
ON storage.objects FOR DELETE
USING (bucket_id = 'shop-images' AND is_admin(auth.uid()));