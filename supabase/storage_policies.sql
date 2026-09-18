-- =============================================
-- SUPABASE STORAGE POLICIES
-- =============================================
-- Run this in Supabase SQL Editor AFTER schema.sql
--
-- NOTE: The buckets themselves must be created via
-- the Supabase Dashboard → Storage → New Bucket
-- OR by running the SQL below as superuser.
--
-- Bucket names:
--   product-images
--   service-images
-- =============================================

-- =============================================
-- CREATE BUCKETS (run once)
-- =============================================
-- If you prefer to create via Dashboard UI instead,
-- skip these INSERT statements and create them manually.
-- Set both buckets as PUBLIC.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES — product-images
-- =============================================

-- Anyone can view product images (public bucket)
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Only admins can upload product images
CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- Only admins can update product images
CREATE POLICY "product_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- Only admins can delete product images
CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- =============================================
-- STORAGE POLICIES — service-images
-- =============================================
CREATE POLICY "service_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-images');

CREATE POLICY "service_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'service-images'
    AND public.is_admin()
  );

CREATE POLICY "service_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'service-images'
    AND public.is_admin()
  );

CREATE POLICY "service_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'service-images'
    AND public.is_admin()
  );
