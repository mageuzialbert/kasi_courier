-- Create delivery-attachments storage bucket for delivery file uploads
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'delivery-attachments',
  'delivery-attachments',
  true, -- Public bucket so attachments are accessible by staff/riders
  5242880, -- 5MB limit (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- Create storage policy: Allow authenticated users to upload attachments
CREATE POLICY "Authenticated users can upload delivery attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'delivery-attachments');

-- Create storage policy: Allow authenticated users to update attachments
CREATE POLICY "Authenticated users can update delivery attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'delivery-attachments')
WITH CHECK (bucket_id = 'delivery-attachments');

-- Create storage policy: Allow authenticated users to delete attachments
CREATE POLICY "Authenticated users can delete delivery attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'delivery-attachments');

-- Create storage policy: Allow public read access to all attachments
CREATE POLICY "Public can read delivery attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'delivery-attachments');

-- Note: The API route uses service role key for uploads,
-- so RLS policies are secondary. The bucket being public allows
-- attachments to be viewed by anyone with the link.
