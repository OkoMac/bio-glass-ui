-- ============================================================
-- BION Supabase Storage — public + private buckets for user uploads
-- Run in Supabase SQL Editor (idempotent — safe to re-run)
--
-- Buckets:
--   - bion-media      (public, for catalog/product/avatar images)
--   - bion-evidence   (private, for dispute evidence — only owner + admin)
-- ============================================================

-- ── PUBLIC MEDIA (catalogs, products, avatars) ────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bion-media',
  'bion-media',
  true,
  10485760, -- 10 MB per file
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Authenticated users can upload/update/delete their own files
-- Path convention: <profile_id>/<sub-path>/<filename>
DROP POLICY IF EXISTS "bion-media upload own" ON storage.objects;
CREATE POLICY "bion-media upload own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'bion-media'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "bion-media update own" ON storage.objects;
CREATE POLICY "bion-media update own" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'bion-media'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "bion-media delete own" ON storage.objects;
CREATE POLICY "bion-media delete own" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'bion-media'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM profiles WHERE user_id = auth.uid())
);

-- Anyone can read (bucket is public, but we still define the SELECT policy)
DROP POLICY IF EXISTS "bion-media read all" ON storage.objects;
CREATE POLICY "bion-media read all" ON storage.objects FOR SELECT
USING (bucket_id = 'bion-media');

-- ── PRIVATE EVIDENCE (dispute photos) ─────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bion-evidence',
  'bion-evidence',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "bion-evidence upload own" ON storage.objects;
CREATE POLICY "bion-evidence upload own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'bion-evidence'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM profiles WHERE user_id = auth.uid())
);

-- Owners + parties to the dispute + admins can read
DROP POLICY IF EXISTS "bion-evidence read parties" ON storage.objects;
CREATE POLICY "bion-evidence read parties" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'bion-evidence'
  AND (
    (storage.foldername(name))[1] IN (SELECT id::text FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

DROP POLICY IF EXISTS "bion-evidence delete own" ON storage.objects;
CREATE POLICY "bion-evidence delete own" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'bion-evidence'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM profiles WHERE user_id = auth.uid())
);

-- Confirm
SELECT id, public, file_size_limit FROM storage.buckets WHERE id IN ('bion-media','bion-evidence');
