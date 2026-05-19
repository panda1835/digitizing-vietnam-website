-- ============================================================================
-- Restore the ORIGINAL (locked) table privileges on the 8 public tables.
--
-- The relocate migration GRANTed privileges to the API roles; those grants
-- are object-level and travelled back to `public` via SET SCHEMA during
-- rollback. Originally these tables had NO grants to anon/authenticated/
-- service_role (service_role got "42501 permission denied"). This revoke
-- returns them to that exact state, so `public` matches pre-migration.
--
-- Run in the LIVE project's SQL editor (cpvlderoberfzmafelqm). Idempotent.
-- (Does not touch RLS, columns, or data — privileges only.)
-- ============================================================================

begin;

do $$
declare t text;
begin
  foreach t in array array[
    'users','documents','pages','ocr_runs',
    'text_units','text_versions','text_candidates','comments'
  ] loop
    if exists (select 1 from information_schema.tables
                where table_schema='public' and table_name=t) then
      execute format(
        'revoke all on public.%I from anon, authenticated, service_role', t
      );
    end if;
  end loop;
end $$;

commit;
