-- ============================================================================
-- Lot 5 — Phase 2 : notation (barème / rubrique partagée / sections en lettres)
-- ----------------------------------------------------------------------------
-- Additif. Les sections restent stockées en 0-4 (canonique) ; les lettres E-A
-- sont une couche d'affichage (utils/notation.ts). Rien sur l'oral : il garde
-- ses 3 sections 0-4, désormais affichées en lettres, SANS note /20 (le /20 ne
-- concerne que l'essai et la synthèse).
--
-- Seul changement de schéma : un champ « rubrique partagée » éditable, importé
-- par les 4 prompts d'évaluation via {{rubrique}}.
-- ============================================================================

begin;

alter table fragments_config
  add column if not exists rubrique text;

commit;
