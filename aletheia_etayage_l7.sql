-- ============================================================================
-- ALETHEIA · ÉTAYAGE PAR NIVEAU — LOT E7 : le retour final agi.
-- 2026-09-03. Spec : `SPEC_Aletheia_Etayage_par_niveau.md` (§ 6.4, § 6.5, § 9).
-- ----------------------------------------------------------------------------
-- Deux colonnes additives, nullables sans défaut, inertes porte fermée :
-- 1. `aletheia_travaux.comparaison_synthese jsonb` — le surlignage de l'élève sur la
--    synthèse modèle et sa comparaison par le code à la couverture jugée dans l'appel VF
--    (D8) : { surlignage, reperes, manques, deja_la, at }.
-- 2. `aletheia_travaux.retour_vf_agi jsonb` — les gestes de l'élève sur le retour final
--    (D7) : { nuance: { surlignage, verdict_code, essais }, amont: [{ index, choix, juste }] }.
-- ⚠️ `aletheia_travaux` est une table de flux VIVANT (protocole renforcé R6) : aucune
--    valeur réécrite, aucune policy touchée ; les `select('*')` reçoivent des clés en
--    plus, ignorées. Ordre de déploiement indifférent (le code lit en tolérance).
-- Rollback : `aletheia_etayage_l7_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from aletheia_travaux) as travaux_avant,
  (select count(*) from information_schema.columns
     where (table_name, column_name) in (('aletheia_travaux','comparaison_synthese'), ('aletheia_travaux','retour_vf_agi')))
    as colonnes_deja_posees;

begin;

alter table aletheia_travaux
  add column if not exists comparaison_synthese jsonb,
  add column if not exists retour_vf_agi jsonb;
comment on column aletheia_travaux.comparaison_synthese is
  'Aletheia E7 — surlignage de l''élève sur la synthèse modèle, comparé par le code à la couverture jugée dans l''appel VF (D8) : { surlignage, reperes, manques, deja_la, at }.';
comment on column aletheia_travaux.retour_vf_agi is
  'Aletheia E7 — gestes de l''élève sur le retour final (D7) : { nuance: { surlignage, verdict_code, essais }, amont: [{ index, choix, juste }] }.';

commit;

-- constat de pied
select
  (select count(*) from information_schema.columns
     where (table_name, column_name) in (('aletheia_travaux','comparaison_synthese'), ('aletheia_travaux','retour_vf_agi'))) = 2
    as deux_colonnes_posees,
  not exists (select 1 from aletheia_travaux where comparaison_synthese is not null or retour_vf_agi is not null) as aucune_valeur,
  (select count(*) from aletheia_travaux) as travaux_intacts;
