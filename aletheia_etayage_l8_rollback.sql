-- ============================================================================
-- ROLLBACK du lot E8 (aletheia_etayage_l8.sql) — n'exécuter qu'avec le code d'AVANT E8.
-- Drop de la colonne ; les unités restent ; les plafonds réglés partent (comptés en tête).
-- ============================================================================
select
  (select count(*) from scriptorium_unites) as unites_avant,
  (select count(*) from scriptorium_unites where liseuse_max is not null) as plafonds_perdus;

begin;
alter table scriptorium_unites drop column if exists liseuse_max;
commit;

select
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_unites' and column_name = 'liseuse_max') = 0 as colonne_retiree,
  (select count(*) from scriptorium_unites) as unites_intactes;
