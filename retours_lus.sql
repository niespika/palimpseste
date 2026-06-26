-- Validation de lecture des retours — transversale et bloquante.
-- Deux nouvelles SOURCES de retour à valider (les autres colonnes *_lu_at existent déjà) :
--   fragments_analyses.retour_lu_at  (Fragments écrit) — existe (lot10)
--   codex_travaux.synthese_lu_at     (Codex)           — existe (codex_synthese_lu)
--   aletheia_travaux.retour_vf_lu_at (Aletheia VF)      — existe (aletheia_affinages)
-- Additif, idempotent. À exécuter sur la preview puis reload PostgREST.

-- Fragments — retour d'ESSAI (le dépôt d'essai reste ouvert ; seule la lecture du retour est bloquante).
alter table fragments_essai_depot_analyses add column if not exists retour_lu_at timestamptz;

-- Quazian — note de quizz (source seule : non lue → bloque les autres modules, jamais Quazian lui-même).
alter table quazian_quiz_scores add column if not exists note_vue_at timestamptz;

-- Reload du cache de schéma PostgREST.
select pg_notify('pgrst', 'reload schema');
