-- ============================================================================
-- Scriptorium — « Supprimer » une unité / un livre (archive + purge ciblée)
-- ----------------------------------------------------------------------------
-- Un vrai DELETE sur scriptorium_unites est INTERDIT : toutes les tables
-- dépendantes sont en ON DELETE CASCADE et détruiraient ce qu'on veut préserver
-- (aletheia_travaux = travail élève + retours IA, codex_sessions = synthèse,
-- quazian_flashcards = cartes). « Supprimer » garde donc la ligne (coquille) et
-- la MASQUE via cette colonne ; la server action `supprimerUnite` purge à côté
-- le contenu prof + les artefacts IA Scriptorium (carte + fiche de lecture) et
-- détache les classes (bloque tout nouveau dépôt).
--
-- supprime_at IS NULL  → unité active (affichée).
-- supprime_at IS NOT NULL → unité supprimée (filtrée partout côté lecture).
--
-- ⚠️ COUPLAGE CODE ↔ MIGRATION : à exécuter AVEC le déploiement de cette branche
--   (le code filtre `is('supprime_at', null)` et écrit la colonne).
-- ============================================================================

begin;

alter table scriptorium_unites
  add column if not exists supprime_at timestamptz;

commit;
