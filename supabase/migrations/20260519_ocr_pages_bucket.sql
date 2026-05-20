-- OCR page-image Storage bucket for self-originating PDF / upload docs.
--
-- This is OBJECT storage, not a Postgres table: the relational DB only
-- ever stores the small public URL in ocr.pages.image_url, so page scans
-- never bloat the DB itself. (Images are JPEG-compressed + resolution-
-- clamped client-side before upload — see ImportPdfClient.)
--
-- Public-read so the /api/admin/ocr/page-image proxy can fetch objects by
-- URL with no auth. Writes go through the service-role key, which
-- bypasses Storage RLS, so no extra insert/update policies are needed.
--
-- Idempotent: safe to run more than once.

insert into storage.buckets (id, name, public)
values ('ocr-pages', 'ocr-pages', true)
on conflict (id) do update set public = excluded.public;
