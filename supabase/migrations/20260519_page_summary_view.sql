-- ─────────────────────────────────────────────────────────────────────────
-- ocr.page_summary — one row per page with workflow flags + column/char
-- counts, computed in the database.
--
-- Why: the per-document OCR dashboard (listPageSummaries) needed the
-- column count and the glyph count (text_units with a real bbox) for
-- every page. It did this with 2 head-count round-trips PER PAGE — 44
-- network hops for a 22-page doc, each a round-trip to the remote DB —
-- so the dashboard took ~1.7s and scaled linearly with page count.
-- (listIndex's per-document fan-out is collapsed in code, no view
-- needed; this view is only the per-page aggregate.)
--
-- Fix: a single indexed aggregate in-DB. The dashboard now does ONE
-- query returning one row per page. Uses the existing
-- columns_page_idx / text_units_page_idx indexes. No row-cap concern —
-- the view returns one row per page, not per glyph.
--
-- This is the read projection the `TODO(view)` comments in
-- ocr-store-supabase.ts ask for. Pure read; no data, RLS, or write-path
-- changes. Code falls back to the old per-page path if this view is
-- absent, so applying this migration is safe in any order vs. deploy.
--
-- Run in the LIVE project's SQL editor (cpvlderoberfzmafelqm).
-- Idempotent: safe to run more than once.
-- Schema is the production default `ocr` (OCR_DB_SCHEMA). Adjust the
-- `ocr.` prefix if you point the app at a different schema.
-- ─────────────────────────────────────────────────────────────────────────

create or replace view ocr.page_summary as
select
  p.id,
  p.document_id,
  p.page_number,
  p.ocr_status,
  p.columns_confirmed_at,
  p.chars_confirmed_at,
  p.quocngu_confirmed_at,
  p.nnv_completed_at,
  p.skipped_at,
  coalesce(c.n, 0)::int as column_count,
  coalesce(t.n, 0)::int as char_count
from ocr.pages p
left join (
  select page_id, count(*) as n
  from ocr.columns
  group by page_id
) c on c.page_id = p.id
left join (
  select page_id, count(*) as n
  from ocr.text_units
  where bbox_x1 is not null
  group by page_id
) t on t.page_id = p.id;

-- Match the schema's table grants so the PostgREST API roles (the
-- service-role client included) can read the view.
grant select on ocr.page_summary to anon, authenticated, service_role;

-- Nudge PostgREST to pick the new relation up without a restart.
notify pgrst, 'reload schema';
