-- ============================================================================
-- Rollback de `quazian_rapports_fragilites.sql`. N'exécuter qu'en cas de
-- problème. ⚠️ DROP TABLE : les rapports conservés sont PERDUS. La porte
-- disparaît (lecteur tolérant ⇒ OFF) : le bouton redevient celui d'hier.
-- ============================================================================
select
  (select count(*) from information_schema.tables where table_name = 'quazian_rapports_fragilites') as table_presente,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_params' and column_name = 'quazian_rapport_actif') as porte_presente;

begin;

drop table if exists quazian_rapports_fragilites;
alter table scriptorium_params drop column if exists quazian_rapport_actif;

commit;

select
  not exists (select 1 from information_schema.tables where table_name = 'quazian_rapports_fragilites') as table_retiree,
  not exists (select 1 from information_schema.columns
                where table_name = 'scriptorium_params' and column_name = 'quazian_rapport_actif') as porte_retiree;
