-- ROLLBACK de `aletheia_etayage_l2.sql` — n'exécuter qu'en cas de problème.
-- Retire la colonne `forme` ; les travaux, leurs textes et leurs retours restent intacts.
-- ⚠️ Détruit le journal des formes servies (audit), rien d'autre.
select (select count(*) from aletheia_travaux where forme is not null) as formes_qui_partent,
       (select count(*) from aletheia_travaux) as travaux_avant;
begin;
alter table aletheia_travaux drop column if exists forme;
commit;
select not exists (select 1 from information_schema.columns
  where table_name = 'aletheia_travaux' and column_name = 'forme') as colonne_retiree,
  (select count(*) from aletheia_travaux) as travaux_intacts;
