-- ============================================================================
-- ALETHEIA · ÉTAYAGE PAR NIVEAU — LOT E5 : le retour V1 recomposé.
-- 2026-09-03. Spec : `SPEC_Aletheia_Etayage_par_niveau.md` (§ 6.1 à 6.3, § 8.3, § 9).
-- ----------------------------------------------------------------------------
-- Trois colonnes additives, nullables sans défaut, inertes porte fermée :
-- 1. `aletheia_travaux.rappel text` — « Sans relire, quelle était l'idée de la séance
--    dernière ? », jugé dans l'appel V1 contre la fiche N−1 (D1).
-- 2. `aletheia_travaux.reponses_relances jsonb` — les réponses de l'élève aux relances
--    du retour V1, AVANT la réécriture : [{ relance, texte }] ; injectées dans l'appel VF.
-- 3. `quazian_flashcards.lemme text` — le terme canonique (lemme) d'une carte de
--    vocabulaire, pour dédupliquer « apollinien / apollinienne / apollinisme » (D9).
-- ⚠️ `aletheia_travaux` et `quazian_flashcards` sont des tables de flux VIVANT
--    (protocole renforcé R6) : aucune valeur réécrite, aucune policy touchée ; les
--    `select('*')` existants reçoivent des clés en plus, ignorées. Ordre indifférent.
-- Rollback : `aletheia_etayage_l5_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from aletheia_travaux) as travaux_avant,
  (select count(*) from quazian_flashcards) as cartes_avant,
  (select count(*) from information_schema.columns
     where (table_name, column_name) in (('aletheia_travaux','rappel'), ('aletheia_travaux','reponses_relances'), ('quazian_flashcards','lemme')))
    as colonnes_deja_posees;

begin;

alter table aletheia_travaux
  add column if not exists rappel text,
  add column if not exists reponses_relances jsonb;
comment on column aletheia_travaux.rappel is
  'Aletheia E5 — rappel d''ouverture (« sans relire, quelle était l''idée de la séance dernière ? »), jugé dans l''appel V1 contre la fiche N−1. NULL en séance 1 ou porte fermée.';
comment on column aletheia_travaux.reponses_relances is
  'Aletheia E5 — réponses de l''élève aux relances du retour V1, avant la réécriture : [{ relance, texte, surlignage?, verdict_code? }]. Injectées dans l''appel VF.';

alter table quazian_flashcards
  add column if not exists lemme text;
comment on column quazian_flashcards.lemme is
  'Aletheia E5 — terme canonique (lemme, masculin singulier, sans article) d''une carte de vocabulaire, pour la déduplication. NULL pour les cartes d''avant.';

commit;

-- constat de pied
select
  (select count(*) from information_schema.columns
     where (table_name, column_name) in (('aletheia_travaux','rappel'), ('aletheia_travaux','reponses_relances'), ('quazian_flashcards','lemme'))) = 3
    as trois_colonnes_posees,
  not exists (select 1 from aletheia_travaux where rappel is not null or reponses_relances is not null) as aucune_valeur,
  not exists (select 1 from quazian_flashcards where lemme is not null) as aucun_lemme,
  (select count(*) from aletheia_travaux) as travaux_intacts,
  (select count(*) from quazian_flashcards) as cartes_intactes;
