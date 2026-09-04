-- ============================================================================
-- C7 · L2 — rollback de `c7_l2_gabarit_base.sql`. N'exécuter qu'en cas de problème.
-- ⚠️ Il DÉTRUIT la grille dérivée (se rejoue par `derive-doctrine.py --sql`) ET
--    les `variante` / `probleme` / `constituant` / `pieces` des instances entrées
--    au format 1.5 : le constat de tête les compte.
-- ============================================================================
select
  (select count(*) from exercices where variante is not null) as instances_a_variante,
  (select count(*) from exercices_cas where probleme is not null or constituant is not null or pieces is not null)
    as cas_du_gabarit,
  (select count(*) from exercices_problemes) as problemes_derives;

begin;
drop table if exists exercices_marquage_gabarit;
drop table if exists exercices_pieces;
drop table if exists exercices_tests;
drop table if exists exercices_problemes;
alter table exercices_cas drop constraint if exists cas_pieces_forme_chk;
alter table exercices_cas drop column if exists pieces, drop column if exists constituant, drop column if exists probleme;
alter table exercices drop constraint if exists exercices_variante_chk;
alter table exercices drop column if exists variante;
alter table scriptorium_params drop column if exists gabarit_actif;
commit;

select
  (select count(*) from information_schema.tables
     where table_name in ('exercices_problemes','exercices_tests','exercices_pieces','exercices_marquage_gabarit')) = 0
    as tables_retirees,
  (select count(*) from information_schema.columns
     where (table_name = 'exercices' and column_name = 'variante')
        or (table_name = 'exercices_cas' and column_name in ('probleme','constituant','pieces'))
        or (table_name = 'scriptorium_params' and column_name = 'gabarit_actif')) = 0
    as colonnes_retirees;
