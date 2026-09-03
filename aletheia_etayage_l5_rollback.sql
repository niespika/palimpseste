-- ROLLBACK de `aletheia_etayage_l5.sql` — n'exécuter qu'en cas de problème, avec le
-- code d'AVANT E5 déployé. Retire les trois colonnes ; travaux et cartes restent intacts.
-- ⚠️ Détruit les rappels et les réponses aux relances déjà écrits (le constat de tête les compte).
select
  (select count(*) from aletheia_travaux where rappel is not null or reponses_relances is not null) as valeurs_qui_partent,
  (select count(*) from quazian_flashcards where lemme is not null) as lemmes_qui_partent,
  (select count(*) from aletheia_travaux) as travaux_avant;
begin;
alter table aletheia_travaux drop column if exists rappel, drop column if exists reponses_relances;
alter table quazian_flashcards drop column if exists lemme;
commit;
select
  (select count(*) from information_schema.columns
     where (table_name, column_name) in (('aletheia_travaux','rappel'), ('aletheia_travaux','reponses_relances'), ('quazian_flashcards','lemme'))) = 0
    as colonnes_retirees,
  (select count(*) from aletheia_travaux) as travaux_intacts;
