-- ============================================================================
-- C4 · L11 — ROLLBACK des deux retraits.
-- ----------------------------------------------------------------------------
-- ⚠️⚠️ CE QU'IL NE REND PAS, ET IL FAUT LE LIRE AVANT DE LE JOUER.
--
--   · `exercices_squelettes.prompt_version` RENAÎT NULLABLE ET VIDE. Un
--     `drop column` n'est pas additif : le rollback recrée la colonne, il ne
--     récupère RIEN de ce qu'elle portait.
--     ⭐ Ce n'est pas grave, et c'est prouvé : la colonne portait EXACTEMENT
--        `instrument_version`, ligne à ligne — la migration s'arrêtait si ce
--        n'était pas le cas. **La valeur est donc encore là, à côté.** La
--        recopie est un `update` d'une ligne, écrit ci-dessous et ACTIVÉ :
--        sans lui, la colonne renaîtrait vide et mentirait par omission.
--
--   · `idx_exercices_planifie` est RECRÉÉ à l'identique — même clé, même
--     prédicat, non unique. Rien ne se perd : un index se reconstruit.
--
-- ⚠️ CODE : revenir au code AVANT ou APRÈS est indifférent ici. Le code de
--    C4-L11 n'ÉCRIT plus `prompt_version` ; une colonne présente qu'il n'écrit
--    pas reste simplement NULL sur les squelettes suivants. Il n'y a donc pas
--    de fenêtre de casse dans ce sens-là.
-- ============================================================================

begin;

-- ── LE CONSTAT AVANT ────────────────────────────────────────────────────────
select
  (select count(*) from public.exercices_squelettes)              as squelettes,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_squelettes'
      and column_name = 'prompt_version')                         as prompt_version_avant_attendu_0,
  (select count(*) from pg_indexes
    where schemaname = 'public' and indexname = 'idx_exercices_planifie') as index_simple_avant_attendu_0;

-- ── 1. La colonne renaît, NULLABLE — et se remplit depuis sa jumelle ────────
alter table public.exercices_squelettes
  add column if not exists prompt_version text;

-- ⭐ La recopie qui rend la colonne HONNÊTE : elle portait `instrument_version`,
--    elle la reporte. Sans cette ligne, le rollback laisserait une colonne vide
--    dont personne ne saurait dire si elle est vide ou perdue.
update public.exercices_squelettes
   set prompt_version = instrument_version
 where prompt_version is null and instrument_version is not null;

-- ── 2. L'index simple revient ───────────────────────────────────────────────
create index if not exists idx_exercices_planifie
  on public.exercices (exercice_planifie_id)
  where exercice_planifie_id is not null;

-- ── LE CONSTAT APRÈS ────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_squelettes'
      and column_name = 'prompt_version')                         as prompt_version_apres_attendu_1,
  (select count(*) from public.exercices_squelettes
    where prompt_version is distinct from instrument_version)     as divergentes_attendu_0,
  (select count(*) from pg_indexes
    where schemaname = 'public' and indexname = 'idx_exercices_planifie') as index_simple_apres_attendu_1,
  (select count(*) from pg_indexes
    where schemaname = 'public' and indexname = 'uk_exercices_planifie')  as index_unique_intact_attendu_1;

commit;
