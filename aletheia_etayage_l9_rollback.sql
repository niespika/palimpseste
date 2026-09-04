-- ROLLBACK du lot E9-bis (aletheia_etayage_l9.sql) — n'exécuter qu'avec le code d'AVANT.
select (select count(*) from aletheia_travaux where ouvert_at is not null) as ouvertures_perdues,
       (select count(*) from aletheia_eleve_etat) as etats_perdus;
begin;
alter table aletheia_travaux drop column if exists ouvert_at;
drop table if exists aletheia_eleve_etat;
commit;
select (select count(*) from information_schema.columns where table_name = 'aletheia_travaux' and column_name = 'ouvert_at') = 0 as colonne_retiree,
       (select count(*) from information_schema.tables where table_name = 'aletheia_eleve_etat') = 0 as table_retiree;
