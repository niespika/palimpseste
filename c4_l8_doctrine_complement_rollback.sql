-- ============================================================================
-- ROLLBACK de `c4_l8_doctrine_complement.sql` — N'EXÉCUTER QU'EN CAS DE
-- PROBLÈME. Ce qu'on perd est intégralement RE-DÉRIVABLE des sources par
-- `scripts/derive-doctrine.py`.
-- ============================================================================
begin;
drop table if exists demonstrations_formes;
alter table exercices_types drop column if exists libelle;
commit;
