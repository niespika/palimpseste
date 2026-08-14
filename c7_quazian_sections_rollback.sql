-- ============================================================================
-- C7 · L3 — RETOUR ARRIÈRE de c7_quazian_sections.sql.
-- N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ----------------------------------------------------------------------------
-- CE QUE ÇA FAIT : retire `quazian_flashcards.section_id`, son CHECK et son
-- index. La base retrouve exactement l'état d'après `c7_quazian_contenus.sql`.
--
-- ⚠️ NON DESTRUCTIF pour les cartes — contrairement au rollback de C7·L1.
-- Aucune ligne n'est supprimée : on ne retire qu'une PRÉCISION. Les cartes nées
-- d'une sous-section retombent au grain « cours entier », et sous ce grain le
-- code d'avant L3 (comme celui de L3, qui tolère l'absence de la colonne) les
-- rend visibles dès que le cours est entamé. Aucun `quazian_card_states` touché,
-- donc aucun historique FSRS perdu.
-- Le prix du retour arrière : le grain fin est PERDU pour de bon. Rejouer
-- `c7_quazian_sections.sql` recrée la colonne vide — il faudra re-générer les
-- cartes d'un cours découpé pour qu'elles retrouvent leur sous-section.
--
-- ── Constat d'entrée — À LIRE AVANT (ce qui va perdre sa précision) ──────────
-- select count(*) as cartes_au_grain_section,
--        count(distinct section_id) as sous_sections_concernees,
--        count(distinct contenu_id) as cours_concernes
-- from quazian_flashcards where section_id is not null;
-- ============================================================================

begin;

alter table quazian_flashcards drop constraint if exists quazian_flashcards_section_chk;
drop index if exists idx_quazian_flashcards_section;
alter table quazian_flashcards drop column if exists section_id;

commit;

-- ── Vérification (attendu : 0) ───────────────────────────────────────────────
-- select count(*) as reste_colonne from information_schema.columns
--   where table_schema='public' and table_name='quazian_flashcards'
--     and column_name='section_id';
