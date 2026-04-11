-- ═══════════════════════════════════════════════════════════════════
-- Provider Documents Storage Bucket
-- Adds a Supabase Storage bucket for KYC documents (ID, qualifications,
-- insurance, business registration, proof of address)
-- ═══════════════════════════════════════════════════════════════════

-- Create the bucket (private — only authenticated users can access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'provider-documents',
  'provider-documents',
  false,                  -- private bucket
  10485760,               -- 10 MB max per file
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- Storage RLS policies — users only see/upload their own documents
-- File path convention: {provider_id}/{doc_type}_{timestamp}.{ext}
-- ═══════════════════════════════════════════════════════════════════

-- Allow providers to upload to their own folder
CREATE POLICY "Providers upload own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'provider-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow providers to read their own documents
CREATE POLICY "Providers read own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'provider-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow providers to delete their own documents
CREATE POLICY "Providers delete own documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'provider-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow providers to update their own documents (for replacing)
CREATE POLICY "Providers update own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'provider-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to read ALL documents
CREATE POLICY "Admins read all provider documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'provider-documents'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
