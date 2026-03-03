-- Add attachment_url column to deliveries table
-- Run this in Supabase SQL Editor

ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS attachment_url TEXT DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN deliveries.attachment_url IS 'Optional URL to an attached document or image (stored in delivery-attachments bucket)';
