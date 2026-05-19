-- ============================================================================
-- LIVE project path: relocate the designer's 8 public tables into the
-- `ocr` schema INTACT (preserves their exact definitions / constraints /
-- RLS), then apply the pipeline-required additions. Run this on the live
-- OCR project (cpvlderoberfzmafelqm), where the original tables already
-- exist in `public` with no data.
--
-- Idempotent. After running, add `ocr` to Settings → API → Exposed schemas.
--
-- (Supersedes the earlier public-targeted additive migration — the OCR
-- schema is now isolated rather than sharing `public`.)
-- ============================================================================

begin;

create schema if not exists ocr;

-- ── Relocate the 8 original tables (only if still in public) ────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'users','documents','pages','ocr_runs',
    'text_units','text_versions','text_candidates','comments'
  ] loop
    if exists (select 1 from information_schema.tables
                where table_schema='public' and table_name=t)
       and not exists (select 1 from information_schema.tables
                where table_schema='ocr' and table_name=t)
    then
      execute format('alter table public.%I set schema ocr', t);
    end if;
  end loop;
end $$;

-- ── Additive: documents ─────────────────────────────────────────────────────
alter table ocr.documents add column if not exists slug          text;
alter table ocr.documents add column if not exists source_type   text;
alter table ocr.documents add column if not exists manifest_url   text;
alter table ocr.documents add column if not exists preprocessing  jsonb;
alter table ocr.documents add column if not exists reference      jsonb;
create unique index if not exists documents_slug_key on ocr.documents (slug);

-- ── Additive: pages ─────────────────────────────────────────────────────────
alter table ocr.pages add column if not exists image_width              integer;
alter table ocr.pages add column if not exists image_height             integer;
alter table ocr.pages add column if not exists columns_confirmed_at     timestamptz;
alter table ocr.pages add column if not exists chars_confirmed_at       timestamptz;
alter table ocr.pages add column if not exists nnv_completed_at         timestamptz;
alter table ocr.pages add column if not exists quocngu_confirmed_at     timestamptz;
alter table ocr.pages add column if not exists skipped_at               timestamptz;
alter table ocr.pages add column if not exists manual_order_locked      boolean not null default false;
alter table ocr.pages add column if not exists aligned_syllable_indices jsonb;

-- ── New: columns ────────────────────────────────────────────────────────────
create table if not exists ocr.columns (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid not null references ocr.pages (id) on delete cascade,
  order_index integer not null,
  min_x double precision not null,
  max_x double precision not null,
  min_y double precision not null,
  max_y double precision not null,
  kind  text not null default 'text',
  created_at timestamptz not null default now(),
  unique (page_id, order_index)
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'columns_kind_check') then
    alter table ocr.columns add constraint columns_kind_check
      check (kind in ('text','binding','marginalia','commentary'));
  end if;
end $$;

-- ── Additive: text_units ────────────────────────────────────────────────────
alter table ocr.text_units add column if not exists ids              text;
alter table ocr.text_units add column if not exists uncertain        boolean not null default false;
alter table ocr.text_units add column if not exists no_reading_form  boolean not null default false;
alter table ocr.text_units add column if not exists qn_uncertain     boolean not null default false;
alter table ocr.text_units add column if not exists nnv_processed_at  timestamptz;
alter table ocr.text_units add column if not exists quocngu_flag      text;
alter table ocr.text_units add column if not exists corrected_text    text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'text_units_quocngu_flag_check') then
    alter table ocr.text_units add constraint text_units_quocngu_flag_check
      check (quocngu_flag is null or quocngu_flag in
             ('ok','low_confidence','no_alignment','nom_error'));
  end if;
end $$;

-- ── Additive: text_candidates ───────────────────────────────────────────────
alter table ocr.text_candidates add column if not exists source text not null default 'ocr';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'text_candidates_source_check') then
    alter table ocr.text_candidates add constraint text_candidates_source_check
      check (source in ('ocr','quoc-ngu'));
  end if;
end $$;

-- ── Additive: ocr_runs ──────────────────────────────────────────────────────
alter table ocr.ocr_runs add column if not exists preprocessing jsonb;

-- ── Missing FK constraints (integrity) ──────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'text_units_ocr_run_id_fkey') then
    alter table ocr.text_units add constraint text_units_ocr_run_id_fkey
      foreign key (ocr_run_id) references ocr.ocr_runs (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'text_versions_text_unit_id_fkey') then
    alter table ocr.text_versions add constraint text_versions_text_unit_id_fkey
      foreign key (text_unit_id) references ocr.text_units (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'text_versions_ocr_run_id_fkey') then
    alter table ocr.text_versions add constraint text_versions_ocr_run_id_fkey
      foreign key (ocr_run_id) references ocr.ocr_runs (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comments_text_unit_id_fkey') then
    alter table ocr.comments add constraint comments_text_unit_id_fkey
      foreign key (text_unit_id) references ocr.text_units (id) on delete cascade;
  end if;
end $$;

create index if not exists text_units_page_idx      on ocr.text_units (page_id);
create index if not exists text_units_run_idx       on ocr.text_units (ocr_run_id);
create index if not exists text_versions_unit_idx   on ocr.text_versions (text_unit_id);
create index if not exists text_candidates_unit_idx on ocr.text_candidates (text_unit_id);
create index if not exists ocr_runs_page_idx        on ocr.ocr_runs (page_id);
create index if not exists pages_document_idx       on ocr.pages (document_id);
create index if not exists columns_page_idx         on ocr.columns (page_id);

-- ── Grants: the Supabase API roles need explicit privileges on `ocr`.
--    (The original public tables lacked service_role grants — 42501.)
grant usage on schema ocr to anon, authenticated, service_role;
grant all on all tables    in schema ocr to anon, authenticated, service_role;
grant all on all sequences in schema ocr to anon, authenticated, service_role;
alter default privileges in schema ocr
  grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema ocr
  grant all on sequences to anon, authenticated, service_role;

-- ── Expose `ocr` through the Data API + hot-reload PostgREST.
--    This project's current exposed list is exactly 'public,
--    graphql_public' (confirmed via probe), so this is the full value.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, ocr';
notify pgrst, 'reload config';

commit;
