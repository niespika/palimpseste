-- ROLLBACK de `aletheia_etayage_l1.sql` — n'exécuter qu'en cas de problème.
-- Retire l'interrupteur (le code le lit alors comme OFF) et la table de découpe.
-- ⚠️ Détruit les découpes générées ; elles se régénèrent en quelques millisecondes
--    (aucune IA) dès que la porte rouvre et qu'un livre est préparé ou re-découpé.
select
  (select count(*) from scriptorium_params where aletheia_etayage_actif) as allumes_avant,
  (select count(*) from aletheia_livre_decoupage) as decoupes_qui_partent;
begin;
drop table if exists aletheia_livre_decoupage;
alter table scriptorium_params drop column if exists aletheia_etayage_actif;
commit;
select
  not exists (select 1 from information_schema.columns
    where table_name = 'scriptorium_params' and column_name = 'aletheia_etayage_actif') as colonne_retiree,
  not exists (select 1 from information_schema.tables
    where table_name = 'aletheia_livre_decoupage') as table_retiree;
