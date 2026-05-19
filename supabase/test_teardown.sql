-- ============================================================================
-- TEST-DB RESET — removes ALL OCR scaffolding from the test project,
-- leaving the NomFlow flashcard tables untouched.
--
-- Two parts:
--   1. Drop the 9 OCR tables we earlier (mistakenly) created in `public`.
--   2. Drop the whole `ocr` schema.
-- After running this, run `schema.sql` to (re)create the clean,
-- isolated `ocr` schema. There are no FKs between OCR tables and the
-- NomFlow tables, so nothing else is affected.
-- ============================================================================

-- 1. Leftover public-schema OCR tables (from the pre-schema-isolation apply).
drop table if exists public.text_candidates cascade;
drop table if exists public.text_versions   cascade;
drop table if exists public.columns          cascade;
drop table if exists public.text_units       cascade;
drop table if exists public.ocr_runs         cascade;
drop table if exists public.comments         cascade;
drop table if exists public.pages            cascade;
drop table if exists public.documents        cascade;
drop table if exists public.users            cascade;

-- 2. The isolated OCR schema (and everything in it).
drop schema if exists ocr cascade;
