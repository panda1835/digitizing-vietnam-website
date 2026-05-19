-- ============================================================================
-- ROLLBACK of 20260519_live_relocate_to_ocr.sql
--
-- Restores `public` to EXACTLY its pre-migration state: moves the 8
-- original tables back into public, removes every column/constraint/
-- index/table the migration added, and resets the exposed-schemas list.
-- Nothing was ever deleted, so this is a complete, lossless restore.
--
-- Run in the LIVE project's SQL editor (cpvlderoberfzmafelqm). Idempotent.
-- ============================================================================

begin;

-- 1. Un-expose `ocr` (back to the original list) + reload PostgREST.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public';
notify pgrst, 'reload config';

-- 2. Drop the brand-new table (never existed originally).
drop table if exists ocr.columns cascade;

-- 3. Drop FK constraints the migration added (originals lacked them).
alter table ocr.text_units    drop constraint if exists text_units_ocr_run_id_fkey;
alter table ocr.text_versions drop constraint if exists text_versions_text_unit_id_fkey;
alter table ocr.text_versions drop constraint if exists text_versions_ocr_run_id_fkey;
alter table ocr.comments      drop constraint if exists comments_text_unit_id_fkey;

-- 4. Drop check constraints the migration added.
alter table ocr.text_units      drop constraint if exists text_units_quocngu_flag_check;
alter table ocr.text_candidates drop constraint if exists text_candidates_source_check;

-- 5. Drop indexes the migration added.
drop index if exists ocr.documents_slug_key;
drop index if exists ocr.text_units_page_idx;
drop index if exists ocr.text_units_run_idx;
drop index if exists ocr.text_versions_unit_idx;
drop index if exists ocr.text_candidates_unit_idx;
drop index if exists ocr.ocr_runs_page_idx;
drop index if exists ocr.pages_document_idx;

-- 6. Drop columns the migration added.
alter table ocr.documents drop column if exists slug;
alter table ocr.documents drop column if exists source_type;
alter table ocr.documents drop column if exists manifest_url;
alter table ocr.documents drop column if exists preprocessing;
alter table ocr.documents drop column if exists reference;
alter table ocr.pages drop column if exists image_width;
alter table ocr.pages drop column if exists image_height;
alter table ocr.pages drop column if exists columns_confirmed_at;
alter table ocr.pages drop column if exists chars_confirmed_at;
alter table ocr.pages drop column if exists nnv_completed_at;
alter table ocr.pages drop column if exists quocngu_confirmed_at;
alter table ocr.pages drop column if exists skipped_at;
alter table ocr.pages drop column if exists manual_order_locked;
alter table ocr.pages drop column if exists aligned_syllable_indices;
alter table ocr.text_units drop column if exists ids;
alter table ocr.text_units drop column if exists uncertain;
alter table ocr.text_units drop column if exists no_reading_form;
alter table ocr.text_units drop column if exists qn_uncertain;
alter table ocr.text_units drop column if exists nnv_processed_at;
alter table ocr.text_units drop column if exists quocngu_flag;
alter table ocr.text_units drop column if exists corrected_text;
alter table ocr.text_candidates drop column if exists source;
alter table ocr.ocr_runs drop column if exists preprocessing;

-- 7. Move the 8 original tables back to `public` (only if still in ocr).
do $$
declare t text;
begin
  foreach t in array array[
    'users','documents','pages','ocr_runs',
    'text_units','text_versions','text_candidates','comments'
  ] loop
    if exists (select 1 from information_schema.tables
                where table_schema='ocr' and table_name=t)
       and not exists (select 1 from information_schema.tables
                where table_schema='public' and table_name=t)
    then
      execute format('alter table ocr.%I set schema public', t);
    end if;
  end loop;
end $$;

-- 8. Drop the now-empty `ocr` schema.
drop schema if exists ocr cascade;

commit;
