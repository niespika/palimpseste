-- ============================================================================
-- Lot 7 — Quazian (côté prof)
-- ----------------------------------------------------------------------------
-- La génération de flashcards passe « par semaine » (modèle Scriptorium Lot 6).
-- On ajoute la semaine sur la carte ; la VISIBILITÉ élève est DÉRIVÉE du
-- contenu Scriptorium (un élève voit les cartes d'une (unité, semaine) dont au
-- moins un contenu est assigné à une de ses classes — cf. scriptorium_document_classes,
-- Lot 6) — pas de table de visibilité, pas de duplication par (semaine × classe).
--
-- Additif et minimal : les cartes existantes (semaine NULL) restent visibles via
-- le mécanisme actuel (unité publiée).
-- ============================================================================

begin;

alter table quazian_flashcards
  add column if not exists semaine integer;

create index if not exists idx_quazian_flashcards_unite_semaine
  on quazian_flashcards(scriptorium_unite_id, semaine);

commit;
