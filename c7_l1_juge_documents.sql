-- ============================================================================
-- C7 · L1 — « LE JUGE REÇOIT LES DOCUMENTS » : l'interrupteur, à OFF, et le
-- domicile du verdict du cran. 2026-09-03.
-- Patron : `copie_annotee_actif.sql` (AGENTS.md, « Gates »).
-- ----------------------------------------------------------------------------
-- 1. `scriptorium_params.juge_documents_actif boolean not null default false`
--    (ligne id = 1). Le code la lit par une requête tolérante
--    (`utils/juge/porte.ts`) : colonne absente ⇒ OFF.
-- 2. `exercices_depots.verdicts_cran jsonb` (nullable, objet) — ce que le juge
--    du cran a tranché, par version : `{ "v1": {…}, "vf": {…} }`
--    (`utils/chaine/juge-cran.ts`). Le registre des réussites (`10-` §7) s'en
--    DÉRIVE ; aucune table neuve. Le code l'écrit par une requête séparée et
--    tolérante : colonne absente ⇒ le verdict part en alerte, le retour est
--    servi quand même.
-- ⛔ Aucune policy touchée. `exercices_depots` est une table du flux VIVANT :
--    la colonne est ADDITIVE et NULLABLE, aucun `select('*')` sur la table
--    dans le code (vérifié par grep sur `app/` et `utils/`), et le code neuf ne
--    la nomme que dans des requêtes séparées — ordre de déploiement indifférent.
-- Rollback : `c7_l1_juge_documents_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_params) as params_avant,
  (select count(*) from exercices_depots) as depots_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_params' and column_name = 'juge_documents_actif')
    as porte_deja_posee,
  (select count(*) from information_schema.columns
     where table_name = 'exercices_depots' and column_name = 'verdicts_cran')
    as verdicts_deja_poses;

begin;

alter table scriptorium_params
  add column if not exists juge_documents_actif boolean not null default false;

alter table exercices_depots
  add column if not exists verdicts_cran jsonb;

alter table exercices_depots
  drop constraint if exists depots_verdicts_cran_chk;
alter table exercices_depots
  add constraint depots_verdicts_cran_chk check (
    verdicts_cran is null or jsonb_typeof(verdicts_cran) = 'object'
  );

commit;

-- constat de pied : quatre drapeaux, plus le témoin
select
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_params' and column_name = 'juge_documents_actif')
    as porte_posee,
  not exists (select 1 from scriptorium_params where juge_documents_actif) as porte_a_off,
  exists (select 1 from information_schema.columns
            where table_name = 'exercices_depots' and column_name = 'verdicts_cran'
              and is_nullable = 'YES' and column_default is null)
    as verdicts_poses_nullables,
  not exists (select 1 from exercices_depots where verdicts_cran is not null) as aucun_verdict,
  (select count(*) from exercices_depots) as depots_intacts;
