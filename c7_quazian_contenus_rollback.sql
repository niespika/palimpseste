-- ============================================================================
-- ROLLBACK de c7_quazian_contenus.sql — N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- cf. SUIVI_SQL.md règle 5 (protocole renforcé : retour arrière prêt).
-- ----------------------------------------------------------------------------
-- Restaure l'état d'avant C7 · L1 : retire l'arc bi-source `unité | contenu` de
-- `quazian_flashcards` et `quazian_publications`, et la colonne `scope_contenus`
-- de `quazian_quizzes`.
--
-- ⚠️ DESTRUCTIF SI DES CARTES/PUBLICATIONS DU NOUVEAU BRAS EXISTENT. Le retour
-- au `not null` sur `scriptorium_unite_id` est impossible tant qu'il reste des
-- lignes ancrées `contenu_id` : ce fichier les SUPPRIME d'abord, explicitement.
-- C'est le seul choix cohérent — une carte de contenu n'a pas d'unité vers
-- laquelle se replier, et la garder en la rattachant à une unité arbitraire
-- serait pire. Le bloc de constat en tête dit combien de lignes vont partir :
-- LE LIRE AVANT de dérouler le reste.
--
-- Rappel : au moment où c7_quazian_contenus.sql a été écrit (13/08/2026), les
-- trois tables étaient VIDES. Si ce rollback est joué peu après, il ne détruit
-- rien du tout.
-- ============================================================================

-- ── À LIRE D'ABORD (hors transaction) ────────────────────────────────────────
-- select (select count(*) from quazian_flashcards   where contenu_id is not null) as cartes_a_detruire,
--        (select count(*) from quazian_publications where contenu_id is not null) as publications_a_detruire,
--        (select count(*) from quazian_card_states cs
--           join quazian_flashcards f on f.id = cs.flashcard_id
--          where f.contenu_id is not null)                                        as etats_fsrs_eleves_emportes;

begin;

-- 1. Les lignes du bras contenu partent (cascade : card_states → review_log).
delete from quazian_publications where contenu_id is not null;
delete from quazian_flashcards   where contenu_id is not null;

-- 2. Contraintes et index de l'arc.
alter table quazian_flashcards   drop constraint if exists quazian_flashcards_source_chk;
alter table quazian_publications drop constraint if exists quazian_publications_source_chk;
drop index if exists idx_quazian_flashcards_contenu;
drop index if exists idx_quazian_publications_contenu;

-- 3. Colonnes ajoutées.
alter table quazian_flashcards   drop column if exists contenu_id;
alter table quazian_publications drop column if exists contenu_id;
alter table quazian_quizzes      drop column if exists scope_contenus;

-- 4. Retour au `not null` d'origine (possible : plus une seule ligne sans unité).
alter table quazian_flashcards   alter column scriptorium_unite_id set not null;
alter table quazian_publications alter column scriptorium_unite_id set not null;

commit;

-- ── Vérification (attendu : tout à `t`) ──────────────────────────────────────
-- select
--   (select count(*) = 0 from information_schema.columns
--      where table_schema='public'
--        and ((table_name='quazian_flashcards'   and column_name='contenu_id')
--          or (table_name='quazian_publications' and column_name='contenu_id')
--          or (table_name='quazian_quizzes'      and column_name='scope_contenus')))
--                                                              as colonnes_retirees,
--   (select is_nullable = 'NO' from information_schema.columns
--      where table_schema='public' and table_name='quazian_flashcards'
--        and column_name='scriptorium_unite_id')               as fc_not_null_restaure,
--   (select is_nullable = 'NO' from information_schema.columns
--      where table_schema='public' and table_name='quazian_publications'
--        and column_name='scriptorium_unite_id')               as pub_not_null_restaure;
