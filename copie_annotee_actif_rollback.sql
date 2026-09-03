-- ROLLBACK de `copie_annotee_actif.sql` — n'exécuter qu'en cas de problème.
-- Retire l'interrupteur ; le code le lit alors comme OFF (colonne absente ⇒ OFF).
select (select count(*) from scriptorium_params where copie_annotee_actif) as allumes_avant;
begin;
alter table scriptorium_params drop column if exists copie_annotee_actif;
commit;
select not exists (select 1 from information_schema.columns
  where table_name = 'scriptorium_params' and column_name = 'copie_annotee_actif') as colonne_retiree;
