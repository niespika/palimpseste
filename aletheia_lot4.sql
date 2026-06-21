-- ============================================================================
-- Aletheia — Lot 4 : retour 2 (reconstruction + architecture)
-- ----------------------------------------------------------------------------
-- - Prompt éditable du retour 2 dans aletheia_params (prompt_feedback_2).
-- - Trace d'échec de génération du retour 2 (même logique que retour 1).
-- Le défaut du prompt vit dans le code (PROMPT_FEEDBACK_2_DEFAUT) ; null = défaut.
-- `devoilement` (architecture amont + jalons aval) est déjà une colonne jsonb
-- d'aletheia_travaux (Lot 2) ; le retour 2 la renseigne désormais.
--
-- ⚠️ COUPLAGE CODE ↔ MIGRATION : à exécuter avec/avant le déploiement du code.
-- ============================================================================

begin;

alter table aletheia_params
  add column if not exists prompt_feedback_2 text;

alter table aletheia_travaux
  add column if not exists retour_2_erreur_at timestamptz;

commit;
