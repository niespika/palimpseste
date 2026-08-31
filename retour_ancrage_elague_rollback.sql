-- ============================================================================
-- retour_ancrage_elague_rollback.sql — retour arrière de retour_ancrage_elague.sql
--
-- ⚠️ REMET L'EXIGENCE D'ANCRAGE SUR LE TEXTE ENGENDRÉ. À ne jouer QUE si le code
--    qui élague (`utils/chaine/retour.ts:elaguerLesAncrages`) a été retiré : sinon
--    tout retour portant une citation invérifiable échouera en `23514`.
--
-- ⛔ Il restaure la fonction TELLE QU'ELLE ÉTAIT le 31/08 avant la migration —
--    copie conforme de `pg_get_functiondef`, relevée sur la sandbox.
-- ============================================================================

begin;

create or replace function public.retour_segmente_bien_forme(
  p jsonb,
  ancrage_exige boolean default true
) returns boolean
language sql
immutable
as $function$
  select p is null
      or (jsonb_typeof(p) = 'array'
          and (jsonb_array_length(p) >= 1 or not ancrage_exige)
          and not exists (
            select 1 from jsonb_array_elements(p) e
            where jsonb_typeof(e) <> 'object'
               or coalesce(btrim(e->>'id'), '') = ''
               or coalesce(btrim(e->>'texte'), '') = ''
               or (ancrage_exige and (
                     jsonb_typeof(e->'ancrage') <> 'object'
                  or coalesce(btrim(e#>>'{ancrage,citation}'), '') = ''
                  or coalesce(e#>>'{ancrage,source}', '') not in ('copie', 'texte_support')))
               or (not ancrage_exige and e ? 'ancrage' and (
                     jsonb_typeof(e->'ancrage') <> 'object'
                  or coalesce(btrim(e#>>'{ancrage,citation}'), '') = '')))
          and (select count(distinct e->>'id') from jsonb_array_elements(p) e)
              = jsonb_array_length(p));
$function$;

commit;
