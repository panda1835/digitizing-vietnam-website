-- ─────────────────────────────────────────────────────────────────────────
-- Redefine ocr.aggregated_relabels to count only GENUINE human corrections
--
-- Why: the previous definition paired
--   from_text = earliest 'ocr'/'kandi%' version
--   to_text   = latest non-QN version
-- which meant the Nôm Na Việt re-OCR pass — stored historically as
-- source='human' because setPage only knew 'ocr'/'human'/'quoc-ngu' —
-- showed up in the "frequent corrections" list as if the user had typed
-- those readings. From data: machine NNV rows are written ~3 s after
-- pages.nnv_completed_at; real human edits land hours later. Polluted
-- both the labels UI and (worse) any training-data export.
--
-- Going forward DVN tags the NNV-pass save with source='nnv' (machine
-- baseline). For legacy rows that pre-date that tagging — they're still
-- source='human' — we exclude them at read time using the tell-tale
-- timing: a unit's FIRST 'human' row whose created_at is within ±5 min
-- of its page's nnv_completed_at is treated as machine, not a human
-- correction. Subsequent 'human' rows (real edits) keep counting.
--
-- The pair becomes:
--   from_text = latest MACHINE version's text (ocr | kandi* | nnv | legacy-NNV-as-human)
--   to_text   = latest GENUINE 'human' version's text
-- counted only when both exist and differ (with the same non-empty /
-- NFC-trim filters the prior function used).
--
-- remaining_from semantics unchanged: how many corpus cells still show
-- the original value as their current reading — i.e. how many remain
-- un-relabeled. "Current" = human if present, else machine.
--
-- Pure read-time definition; no stored data is mutated. Append-only
-- audit trail is preserved.
--
-- Run in the LIVE project's SQL editor (cpvlderoberfzmafelqm).
-- Idempotent: CREATE OR REPLACE, safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────

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
  with scope_units as (
    select u.id as unit_id, u.page_id, p.nnv_completed_at
    from ocr.text_units u
    join ocr.pages p on p.id = u.page_id
    join ocr.documents d on d.id = p.document_id
    where p_slug is null or d.slug = p_slug
  ),
  -- Non-QN versions in scope, with the page's nnv_completed_at attached
  -- so we can apply the legacy-NNV timing check per row.
  versions as (
    select
      tv.id,
      tv.text_unit_id,
      tv.text,
      tv.source,
      tv.created_at,
      su.nnv_completed_at
    from ocr.text_versions tv
    join scope_units su on su.unit_id = tv.text_unit_id
    where tv.source <> 'quoc-ngu'
  ),
  -- The earliest 'human'-tagged row per unit. If it's within ±5 min of
  -- the page's nnv_completed_at, that's the legacy NNV pass — treat it
  -- as machine baseline, not a human correction.
  first_human as (
    select distinct on (text_unit_id)
      text_unit_id,
      id as first_human_id,
      created_at as first_human_at
    from versions
    where source = 'human'
    order by text_unit_id, created_at
  ),
  classified as (
    select
      v.text_unit_id,
      v.text,
      v.source,
      v.created_at,
      case
        -- Machine baseline (current + future taxonomy).
        when v.source = 'ocr' or v.source = 'nnv' or v.source like 'kandi%'
          then 'machine'
        -- Legacy NNV mislabeled as 'human' — exclude from corrections.
        when v.source = 'human'
         and v.id = fh.first_human_id
         and v.nnv_completed_at is not null
         and abs(extract(epoch from (v.created_at - v.nnv_completed_at))) <= 300
          then 'machine'
        -- Genuine human correction.
        when v.source = 'human'
          then 'human'
        else null
      end as kind
    from versions v
    left join first_human fh on fh.text_unit_id = v.text_unit_id
  ),
  per_unit as (
    select
      text_unit_id,
      (array_agg(text order by created_at desc) filter (where kind='machine'))[1] as machine_text,
      (array_agg(text order by created_at desc) filter (where kind='human'))[1]   as human_text
    from classified
    where kind is not null
    group by text_unit_id
  ),
  pairs as (
    select machine_text as ft, human_text as tt, count(*)::bigint as tot
    from per_unit
    where machine_text is not null
      and human_text is not null
      and human_text <> ''
      and machine_text <> human_text
      and regexp_replace(machine_text, '^\s+|\s+$', '', 'g') <> ''
      and regexp_replace(human_text,   '^\s+|\s+$', '', 'g') <> ''
      and regexp_replace(normalize(machine_text, NFC), '^\s+|\s+$', '', 'g')
       <> regexp_replace(normalize(human_text,   NFC), '^\s+|\s+$', '', 'g')
    group by machine_text, human_text
  ),
  -- "remaining_from" = how many cells still SHOW the original (machine)
  -- value as their current reading. Current = human if present else
  -- machine, same as getPage's reconstruction.
  current_per_unit as (
    select coalesce(human_text, machine_text) as ct from per_unit
  ),
  remaining as (
    select ct, count(*)::bigint as rem
    from current_per_unit
    where ct is not null
      and regexp_replace(ct, '^\s+|\s+$', '', 'g') <> ''
    group by ct
  )
  select p.ft, p.tt, p.tot, coalesce(r.rem, 0)::bigint
  from pairs p
  left join remaining r on r.ct = p.ft
  order by p.tot desc, p.ft;
$$;

grant execute on function ocr.aggregated_relabels(text)
  to service_role, anon, authenticated;

notify pgrst, 'reload schema';
