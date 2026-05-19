-- ============================================================================
-- OCR pipeline — canonical schema, isolated in the `ocr` schema.
--
-- This is the single source of truth for a FRESH setup (test DB, or any
-- new project). It is the designer's 8-table relational model + the
-- pipeline-required additions (the `columns` table, workflow state,
-- labeling flags, sic/corr, Quốc Ngữ discriminators), all under `ocr`.
--
-- For the LIVE project (where the original 8 tables already exist in
-- `public`), use migrations/20260519_live_relocate_to_ocr.sql instead —
-- it relocates the designer's tables intact rather than recreating them.
--
-- ⚠️ After running this, add `ocr` to the project's PostgREST exposed
--    schemas: Dashboard → Settings → API → "Exposed schemas" → add `ocr`.
--
-- OcrPageData → relational mapping (the contract ocr-store-supabase.ts
-- implements): documents (slug/source_type/manifest_url/preprocessing/
-- reference) → pages (image dims + 5 workflow ts + manual_order_locked +
-- aligned_syllable_indices) → columns (Step-1 rects) → ocr_runs
-- (+preprocessing) → text_units (flags/quocngu_flag/corrected_text/
-- nnv_processed_at) → text_versions (append-only: source 'ocr'|'human'|
-- 'quoc-ngu') / text_candidates (+source 'ocr'|'quoc-ngu') / comments.
-- ============================================================================

create extension if not exists pgcrypto;       -- gen_random_uuid()
create schema if not exists ocr;

-- ── users ───────────────────────────────────────────────────────────────────
create table if not exists ocr.users (
  id         uuid primary key default gen_random_uuid(),
  email      text,
  name       text,
  role       text not null,
  created_at timestamptz not null default now()
);

-- ── documents ───────────────────────────────────────────────────────────────
create table if not exists ocr.documents (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text unique,
  source_type  text,                 -- 'iiif' | 'pdf' | 'upload'
  manifest_url text,
  source_url   text,
  preprocessing jsonb,
  reference    jsonb,                 -- {text, pageRanges} for Step 3 alignment
  status       text not null default 'uncorrected',
  created_at   timestamptz not null default now(),
  created_by   uuid references ocr.users (id)
);

-- ── pages ───────────────────────────────────────────────────────────────────
create table if not exists ocr.pages (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references ocr.documents (id) on delete cascade,
  page_number integer not null,
  image_url   text,
  ocr_status  text not null default 'uncorrected',
  image_width  integer,
  image_height integer,
  columns_confirmed_at     timestamptz,
  chars_confirmed_at       timestamptz,
  nnv_completed_at         timestamptz,
  quocngu_confirmed_at     timestamptz,
  skipped_at               timestamptz,
  manual_order_locked      boolean not null default false,
  aligned_syllable_indices jsonb,
  unique (document_id, page_number)
);

-- ── columns (Step-1 confirmed rectangles; reading order = order_index) ───────
create table if not exists ocr.columns (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid not null references ocr.pages (id) on delete cascade,
  order_index integer not null,
  min_x double precision not null,
  max_x double precision not null,
  min_y double precision not null,
  max_y double precision not null,
  kind  text not null default 'text'
        check (kind in ('text','binding','marginalia','commentary')),
  created_at timestamptz not null default now(),
  unique (page_id, order_index)
);

-- ── ocr_runs ────────────────────────────────────────────────────────────────
create table if not exists ocr.ocr_runs (
  id            uuid primary key default gen_random_uuid(),
  page_id       uuid not null references ocr.pages (id) on delete cascade,
  model_name    text,
  model_version text,
  status        text not null default 'complete',
  notes         text,
  raw_output_url text,
  preprocessing jsonb,
  started_at    timestamptz not null default now(),
  started_by    uuid references ocr.users (id)
);

-- ── text_units (bbox = 4-pt quad; all-null = no footprint) ──────────────────
create table if not exists ocr.text_units (
  id           uuid primary key default gen_random_uuid(),
  page_id      uuid not null references ocr.pages (id) on delete cascade,
  ocr_run_id   uuid not null references ocr.ocr_runs (id) on delete cascade,
  "offset"     integer not null,
  layout_class integer,
  bbox_x1 double precision, bbox_y1 double precision,
  bbox_x2 double precision, bbox_y2 double precision,
  bbox_x3 double precision, bbox_y3 double precision,
  bbox_x4 double precision, bbox_y4 double precision,
  ids             text,
  uncertain       boolean not null default false,
  no_reading_form boolean not null default false,
  qn_uncertain    boolean not null default false,
  nnv_processed_at timestamptz,
  quocngu_flag    text check (quocngu_flag is null or quocngu_flag in
                  ('ok','low_confidence','no_alignment','nom_error')),
  corrected_text  text
);

-- ── text_versions (append-only: OCR original + every correction) ────────────
create table if not exists ocr.text_versions (
  id              uuid primary key default gen_random_uuid(),
  text_unit_id    uuid not null references ocr.text_units (id) on delete cascade,
  ocr_run_id      uuid not null references ocr.ocr_runs (id) on delete cascade,
  edited_by       uuid references ocr.users (id),
  text            text not null,
  confidence      double precision,
  source          text not null,        -- 'ocr' | 'human' | 'quoc-ngu'
  correction_note text,
  created_at      timestamptz not null default now()
);

-- ── text_candidates (OCR alts + Quốc Ngữ alts, discriminated) ───────────────
create table if not exists ocr.text_candidates (
  id           uuid primary key default gen_random_uuid(),
  text_unit_id uuid not null references ocr.text_units (id) on delete cascade,
  text         text not null,
  rank         integer not null,
  source       text not null default 'ocr'   -- 'ocr' | 'quoc-ngu'
               check (source in ('ocr','quoc-ngu'))
);

-- ── comments ────────────────────────────────────────────────────────────────
create table if not exists ocr.comments (
  id           uuid primary key default gen_random_uuid(),
  page_id      uuid not null references ocr.pages (id) on delete cascade,
  text_unit_id uuid references ocr.text_units (id) on delete cascade,
  created_by   uuid references ocr.users (id),
  type         text not null,
  body         text not null,
  created_at   timestamptz not null default now()
);

-- Lookup indexes for the assemble (rows → OcrPageData) query path.
create index if not exists text_units_page_idx        on ocr.text_units (page_id);
create index if not exists text_units_run_idx         on ocr.text_units (ocr_run_id);
create index if not exists text_versions_unit_idx     on ocr.text_versions (text_unit_id);
create index if not exists text_candidates_unit_idx   on ocr.text_candidates (text_unit_id);
create index if not exists ocr_runs_page_idx          on ocr.ocr_runs (page_id);
create index if not exists pages_document_idx         on ocr.pages (document_id);
create index if not exists columns_page_idx           on ocr.columns (page_id);

-- RLS on (service_role bypasses; no anon policies until auth lands).
alter table ocr.users           enable row level security;
alter table ocr.documents       enable row level security;
alter table ocr.pages           enable row level security;
alter table ocr.columns         enable row level security;
alter table ocr.ocr_runs        enable row level security;
alter table ocr.text_units      enable row level security;
alter table ocr.text_versions   enable row level security;
alter table ocr.text_candidates enable row level security;
alter table ocr.comments        enable row level security;

-- Grants: Supabase API roles need explicit privileges on the schema.
grant usage on schema ocr to anon, authenticated, service_role;
grant all on all tables    in schema ocr to anon, authenticated, service_role;
grant all on all sequences in schema ocr to anon, authenticated, service_role;
alter default privileges in schema ocr
  grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema ocr
  grant all on sequences to anon, authenticated, service_role;

-- Expose `ocr` through the Data API + hot-reload PostgREST. Default
-- exposed list on a standard Supabase project is 'public,
-- graphql_public'; adjust if your project exposes extra schemas.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, ocr';
notify pgrst, 'reload config';
