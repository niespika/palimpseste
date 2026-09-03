-- ============================================================================
-- ROLLBACK du lot E7 (aletheia_etayage_l7.sql) — n'exécuter qu'avec le code d'AVANT E7.
-- Drop des deux colonnes ; les travaux restent ; les comparaisons de synthèse et les
-- gestes sur le retour final partent (comptés en tête).
-- ============================================================================
select
  (select count(*) from aletheia_travaux) as travaux_avant,
  (select count(*) from aletheia_travaux where comparaison_synthese is not null) as comparaisons_perdues,
  (select count(*) from aletheia_travaux where retour_vf_agi is not null) as gestes_perdus;

begin;
alter table aletheia_travaux
  drop column if exists comparaison_synthese,
  drop column if exists retour_vf_agi;
commit;

select
  (select count(*) from information_schema.columns
     where (table_name, column_name) in (('aletheia_travaux','comparaison_synthese'), ('aletheia_travaux','retour_vf_agi'))) = 0
    as colonnes_retirees,
  (select count(*) from aletheia_travaux) as travaux_intacts;
