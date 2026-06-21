-- ============================================================================
-- Aletheia — Lot 6 : affinages (réglages activables, off par défaut)
-- ----------------------------------------------------------------------------
-- Deux réglages globaux sur aletheia_params (singleton id=1) :
--   • eval_questions_actif   : affiche au retour 1 la remarque sur la qualité
--     des questions de l'élève (champ remarque_questions). Off par défaut.
--   • deblocage_sequentiel   : la semaine N+1 ne s'ouvre qu'à la clôture (DONE)
--     de N. Off par défaut (accès libre, comportement actuel).
--
-- Affinage A (édition des 3 prompts) : déjà couvert par /prof/aletheia (Lots 3-5).
-- Affinage C (export/impression PDF de la carte) : pas de SQL (impression nav.).
--
-- ⚠️ COUPLAGE CODE ↔ MIGRATION : à exécuter avec/avant le déploiement du code.
-- ============================================================================

begin;

alter table aletheia_params
  add column if not exists eval_questions_actif boolean not null default false;

alter table aletheia_params
  add column if not exists deblocage_sequentiel boolean not null default false;

commit;
