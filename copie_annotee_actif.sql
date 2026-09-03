-- ============================================================================
-- « LA COPIE ANNOTÉE » (professeur) — l'interrupteur, à OFF.
-- 2026-09-03. Patron : `rag_actif` / `plan_evaluation_actif` (AGENTS.md, « Gates »).
-- ----------------------------------------------------------------------------
-- Une colonne booléenne NOT NULL DEFAULT false sur `scriptorium_params` (ligne
-- id = 1). Le code la lit par une requête tolérante : colonne absente ⇒ OFF.
-- Aucune policy touchée, aucune table de flux vivant.
-- Rollback : `copie_annotee_actif_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_params) as params_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_params' and column_name = 'copie_annotee_actif')
    as colonne_deja_posee;

begin;

alter table scriptorium_params
  add column if not exists copie_annotee_actif boolean not null default false;

commit;

-- constat de pied : deux drapeaux
select
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_params' and column_name = 'copie_annotee_actif')
    as colonne_posee,
  not exists (select 1 from scriptorium_params where copie_annotee_actif) as tout_a_off;
