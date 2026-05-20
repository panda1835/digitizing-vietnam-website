-- ─────────────────────────────────────────────────────────────────────────
-- ocr.qn_suggestions — DB-side aggregation for the Step-4 chip strip
--
-- Why: the /api/admin/ocr/qn-suggestions route was building the (glyph →
-- prior Quốc Ngữ readings) map by issuing ~40+ sequential PostgREST
-- round-trips per request: paginated QN-versions fetch + 100-id chunks
-- for unit metadata + page → document scope + non-QN versions per unit.
-- At a ~2k-glyph corpus that took ~12 s on every editor refresh; the
-- chip strip didn't paint for ~10 s while the editor sat empty.
--
-- The work is set-based by nature: it's a GROUP BY over text_versions
-- joined to text_units → pages → documents. So push it into Postgres,
-- return a small ranked result, and the route becomes one RPC.
--
-- Same pattern, same style as ocr.aggregated_relabels.
--
-- ── Definition of the result ─────────────────────────────────────────
-- For every text_unit that has at least one source='quoc-ngu' version,
--   glyph = latest non-QN ("manuscript") version text  (matches getPage)
--   qn    = latest source='quoc-ngu' version text
-- Aggregate per (glyph, qn, scope):
--   count           = how many units produce that (glyph,qn) pair
--   uncertain_count = of those units, how many have qn_uncertain=true
-- scope is 'text' when the unit's document slug == p_slug, else 'global'.
--
-- p_scope:
--   'text'   — only same-document pairs
--   'global' — only other-document pairs
--   'both'   — text first by count, then global for qn values not
--              already represented for the same glyph in text scope
-- Returns up to p_max ranked rows PER GLYPH (text-scope ranks lower
-- numerically = higher priority; count desc breaks ties, then qn alpha).
--
-- Run in the LIVE project's SQL editor (cpvlderoberfzmafelqm).
-- Idempotent: CREATE OR REPLACE, safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function ocr.qn_suggestions(
  p_slug  text default null,
  p_max   int  default 5,
  p_scope text default 'both'
)
returns table (
  glyph           text,
  qn              text,
  count           bigint,
  uncertain_count bigint,
  scope           text
)
language sql
stable
as $$
  with
  -- Latest QN reading per unit (append-only history → distinct on desc).
  latest_qn as (
    select distinct on (tv.text_unit_id)
      tv.text_unit_id,
      tv.text as qn_text
    from ocr.text_versions tv
    where tv.source = 'quoc-ngu'
    order by tv.text_unit_id, tv.created_at desc
  ),
  -- Latest non-QN version per unit — same rule getPage uses to derive
  -- the displayed glyph (any of 'ocr', 'kandi*', 'nnv', 'human').
  latest_manuscript as (
    select distinct on (tv.text_unit_id)
      tv.text_unit_id,
      tv.text as glyph_text
    from ocr.text_versions tv
    where tv.source <> 'quoc-ngu'
    order by tv.text_unit_id, tv.created_at desc
  ),
  -- Join in unit + page + doc so we can split text-scope vs global.
  unit_info as (
    select u.id as unit_id,
           u.qn_uncertain,
           d.slug as doc_slug
    from ocr.text_units u
    join ocr.pages p     on p.id = u.page_id
    join ocr.documents d on d.id = p.document_id
  ),
  joined as (
    select
      lm.glyph_text                                     as glyph,
      lq.qn_text                                        as qn,
      ui.qn_uncertain,
      case when p_slug is not null and ui.doc_slug = p_slug
           then 'text' else 'global' end                as scope
    from latest_qn lq
    join latest_manuscript lm on lm.text_unit_id = lq.text_unit_id
    join unit_info ui          on ui.unit_id      = lq.text_unit_id
    -- Same non-empty filters the in-app code applies.
    where lq.qn_text is not null
      and lm.glyph_text is not null
      and length(btrim(lm.glyph_text)) > 0
      and length(btrim(lq.qn_text))   > 0
  ),
  agg as (
    select
      j.glyph, j.qn, j.scope,
      count(*)::bigint                                            as cnt,
      sum(case when j.qn_uncertain then 1 else 0 end)::bigint     as ucnt
    from joined j
    where (p_scope = 'both')
       or (p_scope = 'text'   and j.scope = 'text')
       or (p_scope = 'global' and j.scope = 'global')
    group by j.glyph, j.qn, j.scope
  ),
  -- For 'both': drop global rows whose (glyph, qn) is already in text scope.
  -- That mirrors the JS merge: "text first; then global for qn values not
  -- already present."
  filtered as (
    select a.*
    from agg a
    where p_scope <> 'both'
       or a.scope = 'text'
       or not exists (
         select 1 from agg t
         where t.scope = 'text'
           and t.glyph = a.glyph
           and t.qn    = a.qn
       )
  ),
  ranked as (
    select
      f.glyph, f.qn, f.cnt, f.ucnt, f.scope,
      row_number() over (
        partition by f.glyph
        order by case when f.scope = 'text' then 0 else 1 end,
                 f.cnt desc,
                 f.qn
      ) as rk
    from filtered f
  )
  select
    r.glyph,
    r.qn,
    r.cnt  as count,
    r.ucnt as uncertain_count,
    r.scope
  from ranked r
  where r.rk <= greatest(1, least(p_max, 50))   -- defensive cap on p_max
  order by r.glyph, r.rk;
$$;

grant execute on function ocr.qn_suggestions(text, int, text)
  to service_role, anon, authenticated;

notify pgrst, 'reload schema';
