-- ---------------------------------------------------------------------
-- 011 - Storage policies for the card-images bucket.
--
-- Profile photos, covers and gallery images. The bucket is public to read
-- (these appear on public profile pages) but writes are restricted to the
-- owner of the folder they land in.
--
-- Every object is stored as `<user_id>/<file>`, so the first path segment IS
-- the owner. Checking it against auth.uid() means a signed-in user cannot
-- name a path into someone else's folder.
--
-- Without these, writes needed the service key, which meant an upload had to
-- be proxied through the server. With them the browser uploads straight to
-- Supabase and the service key comes out of the application entirely.
-- ---------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-images',
  'card-images',
  true,
  3145728,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 3145728,
      allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

-- Read: the images are on public profile pages, so anyone.
DROP POLICY IF EXISTS "Anyone reads card images" ON storage.objects;
CREATE POLICY "Anyone reads card images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'card-images');

-- Write: only into your own folder.
DROP POLICY IF EXISTS "Owners upload their own card images" ON storage.objects;
CREATE POLICY "Owners upload their own card images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'card-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners replace their own card images" ON storage.objects;
CREATE POLICY "Owners replace their own card images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'card-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'card-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners delete their own card images" ON storage.objects;
CREATE POLICY "Owners delete their own card images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'card-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
