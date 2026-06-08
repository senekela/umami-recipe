-- Fix RLS for private OCR uploads bucket used by photo import
-- The client uploads files to paths like {user_id}/{timestamp}-{filename}
-- Existing setup docs allow any authenticated user to insert into this bucket,
-- but some environments are missing that storage policy.

-- Ensure the private OCR uploads bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('ocr-uploads', 'ocr-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Remove old variants if they exist
DROP POLICY IF EXISTS "Authenticated users upload OCR" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload OCR images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own OCR uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own OCR uploads" ON storage.objects;

-- Allow authenticated users to upload OCR source images into their own folder
CREATE POLICY "Users can upload OCR images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ocr-uploads'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to read only their own OCR uploads if needed by the client
CREATE POLICY "Users can view own OCR uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ocr-uploads'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own OCR uploads
CREATE POLICY "Users can delete own OCR uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ocr-uploads'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Reload schema/cache for API consumers
NOTIFY pgrst, 'reload schema';

