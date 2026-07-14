-- Aletheia — Mode C (extraits de livre dans un parcours) — Lot C1.0
-- Kill-switch global du mode C. SEULE DDL de tout C1 : additive, idempotente, réversible.
-- Sur la table CONFIG 1-ligne (aletheia_params, id=1), JAMAIS sur aletheia_travaux (0
-- migration de données). Défaut false → le mode C reste invisible tant qu'on ne flippe
-- pas (le flip = C-ACT, après le chantier C2 « carte-de-parcours »). Dégrade en douceur :
-- lireModeCActif tolère la colonne absente (→ false) avant l'exécution de ce script.
--
-- À jouer dans Supabase AVANT le merge de C1. Rollback : ALTER TABLE aletheia_params DROP COLUMN mode_c_actif;

ALTER TABLE aletheia_params
  ADD COLUMN IF NOT EXISTS mode_c_actif boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN aletheia_params.mode_c_actif IS
  'Kill-switch global Aletheia mode C (extraits de livre en parcours). false = repli-B whole-book (statu quo prod) pour tout livre partiellement posé ou mal configuré. Ne passer à true qu''après livraison de C2 (carte-de-parcours) + audit R-EXPO. Cf. SPEC_aletheia_mode_c.md §8.';
