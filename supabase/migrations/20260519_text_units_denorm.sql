-- ─────────────────────────────────────────────────────────────────────────
-- Denormalized read columns on ocr.text_units
--
-- Why: the labels / unencoded admin pages aggregate the corpus
-- (most-frequent OCR→human corrections, glyph search, IDS registry).
-- Deriving "current text" and "OCR-origin text" per glyph from the
-- append-only ocr.text_versions history at read time means transferring
-- (or scanning) every version row — O(corpus size). As the corpus grows
-- that is the load-time wall.
--
-- Fix: cache the two derived values on text_units, maintained on every
-- write. Reads become single-table, indexed GROUP BY / WHERE — O(result
-- size). ocr.text_versions stays the untouched append-only audit trail;
-- these columns are a pure read projection of it.
--
--   current_text   — latest non-'quoc-ngu' version's text  (== getPage's
--                     reconstructed `text`; '' when a unit has no version)
--   ocr_text       — earliest 'ocr'/'kandi*' version's text (the OCR
--                     origin; NULL if the unit never had an OCR version)
--   ocr_confidence — that OCR version's confidence
--   current_note   — latest non-'quoc-ngu' version's correction_note
--
-- Idempotent: safe to run more than once.
-- Schema is the production default `ocr` (OCR_DB_SCHEMA). Adjust the
-- `ocr.` prefix if you point the app at a different schema.
-- ─────────────────────────────────────────────────────────────────────────

alter table ocr.text_units
  add column if not exists current_text   text,
  add column if not exists ocr_text       text,
  add column if not exists ocr_confidence real,
  add column if not exists current_note   text;

-- Search: WHERE current_text = $1  (labels occurrence search)
create index if not exists text_units_current_text_idx
  on ocr.text_units (current_text);
-- Aggregate: GROUP BY ocr_text, current_text  (frequent corrections)
create index if not exists text_units_relabel_idx
  on ocr.text_units (ocr_text, current_text);
-- Unencoded registry: only IDS-tagged units (small subset → partial idx)
create index if not exists text_units_ids_idx
  on ocr.text_units (ids) where ids is not null;
-- Scope joins
create index if not exists text_units_page_id_idx
  on ocr.text_units (page_id);
create index if not exists pages_document_id_idx
  on ocr.pages (document_id);

-- ── refresh_page_denorm: recompute the four columns for one page ──────────
-- Called by setPage() after it writes versions. Set-based (one statement),
-- so a page save adds exactly one round trip regardless of glyph count.
-- This is the single source of the derivation rule — the backfill below
-- and getPage()'s in-app reconstruction must stay equivalent to it.
create or replace function ocr.refresh_page_denorm(p_page_id uuid)
returns void
language sql
as $$
  with ocr_v as (
    select distinct on (tv.text_unit_id)
      tv.text_unit_id, tv.text as t, tv.confidence as c
    from ocr.text_versions tv
    join ocr.text_units u on u.id = tv.text_unit_id
    where u.page_id = p_page_id
      and (tv.source = 'ocr' or tv.source like 'kandi%')
    order by tv.text_unit_id, tv.created_at asc
  ),
  cur_v as (
    select distinct on (tv.text_unit_id)
      tv.text_unit_id, tv.text as t, tv.correction_note as n
    from ocr.text_versions tv
    join ocr.text_units u on u.id = tv.text_unit_id
    where u.page_id = p_page_id
      and tv.source <> 'quoc-ngu'
    order by tv.text_unit_id, tv.created_at desc
  )
  update ocr.text_units u set
    ocr_text       = o.t,
    ocr_confidence = o.c,
    current_text   = coalesce(c.t, o.t, ''),
    current_note   = c.n
  from (select id from ocr.text_units where page_id = p_page_id) base
  left join cur_v c on c.text_unit_id = base.id
  left join ocr_v o on o.text_unit_id = base.id
  where u.id = base.id;
$$;

-- ── aggregated_relabels: frequent OCR→human corrections, in-DB ───────────
-- Returns one row per (from,to) pair plus how many un-relabeled `from`
-- remain in scope. Mirrors the app's old getAggregatedRelabels filters
-- (non-empty, NFC-normalized, trimmed, genuinely different). p_slug NULL =
-- whole corpus; otherwise scoped to that document.
create or replace function ocr.aggregated_relabels(p_slug text default null)
returns table (
  from_text      text,
  to_text        text,
  total_chars    bigint,
  remaining_from bigint
)
language sql
stable
as $$
  with scope as (
    select u.ocr_text, u.current_text
    from ocr.text_units u
    join ocr.pages p on p.id = u.page_id
    join ocr.documents d on d.id = p.document_id
    where p_slug is null or d.slug = p_slug
  ),
  -- `js_trim` matches JS String.prototype.trim() (strips all \s, incl.
  -- newlines/tabs) so the in-DB filter agrees with the old app logic —
  -- btrim() would only strip ASCII spaces and let newline layout
  -- sentinels pollute the aggregate.
  pairs as (
    select ocr_text as ft, current_text as tt, count(*)::bigint as tot
    from scope
    where ocr_text is not null
      and current_text is not null and current_text <> ''
      and ocr_text <> current_text
      and regexp_replace(ocr_text,     '^\s+|\s+$', '', 'g') <> ''
      and regexp_replace(current_text, '^\s+|\s+$', '', 'g') <> ''
      and regexp_replace(normalize(ocr_text, NFC),     '^\s+|\s+$', '', 'g')
       <> regexp_replace(normalize(current_text, NFC), '^\s+|\s+$', '', 'g')
    group by ocr_text, current_text
  ),
  remaining as (
    select current_text as ct, count(*)::bigint as rem
    from scope
    where current_text is not null
      and regexp_replace(current_text, '^\s+|\s+$', '', 'g') <> ''
    group by current_text
  )
  select p.ft, p.tt, p.tot, coalesce(r.rem, 0)::bigint
  from pairs p
  left join remaining r on r.ct = p.ft
  order by p.tot desc, p.ft;
$$;

-- ── One-time backfill of existing rows ───────────────────────────────────
-- Same derivation as refresh_page_denorm, run corpus-wide once.
with ocr_v as (
  select distinct on (tv.text_unit_id)
    tv.text_unit_id, tv.text as t, tv.confidence as c
  from ocr.text_versions tv
  where tv.source = 'ocr' or tv.source like 'kandi%'
  order by tv.text_unit_id, tv.created_at asc
),
cur_v as (
  select distinct on (tv.text_unit_id)
    tv.text_unit_id, tv.text as t, tv.correction_note as n
  from ocr.text_versions tv
  where tv.source <> 'quoc-ngu'
  order by tv.text_unit_id, tv.created_at desc
)
update ocr.text_units u set
  ocr_text       = o.t,
  ocr_confidence = o.c,
  current_text   = coalesce(c.t, o.t, ''),
  current_note   = c.n
from ocr.text_units base
left join cur_v c on c.text_unit_id = base.id
left join ocr_v o on o.text_unit_id = base.id
where u.id = base.id;

-- Grants mirror the table grants (service_role is what the app uses; anon
-- / authenticated kept consistent with the rest of the ocr schema).
grant execute on function ocr.refresh_page_denorm(uuid)
  to service_role, anon, authenticated;
grant execute on function ocr.aggregated_relabels(text)
  to service_role, anon, authenticated;

-- Make PostgREST pick up the new functions immediately.
notify pgrst, 'reload schema';
