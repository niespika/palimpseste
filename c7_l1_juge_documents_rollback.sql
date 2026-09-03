-- ============================================================================
-- C7 · L1 — rollback de `c7_l1_juge_documents.sql`. N'exécuter qu'en cas de
-- problème. ⚠️ Il DÉTRUIT les verdicts du cran déjà écrits : le constat de tête
-- les compte. La porte repasse à OFF par absence de colonne.
-- ============================================================================

-- constat de tête : ce qui part
select
  (select count(*) from exercices_depots where verdicts_cran is not null) as verdicts_perdus,
  (select count(*) from scriptorium_params where juge_documents_actif) as portes_ouvertes;

begin;

alter table exercices_depots drop constraint if exists depots_verdicts_cran_chk;
alter table exercices_depots drop column if exists verdicts_cran;
alter table scriptorium_params drop column if exists juge_documents_actif;

commit;

-- constat de pied
select
  not exists (select 1 from information_schema.columns
                where table_name = 'exercices_depots' and column_name = 'verdicts_cran')
    as verdicts_retires,
  not exists (select 1 from information_schema.columns
                where table_name = 'scriptorium_params' and column_name = 'juge_documents_actif')
    as porte_retiree;
