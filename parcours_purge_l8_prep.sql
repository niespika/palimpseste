-- ============================================================================
-- MIGRATION L8 — PREP (LECTURE SEULE) — à jouer AVANT d'écrire/lancer la purge dure.
-- ----------------------------------------------------------------------------
-- Répond aux inconnues laissées par l'introspection 1a (deux FK NO ACTION) et
-- liste les fichiers Storage à nettoyer. Ne MODIFIE RIEN.
-- Jouer chaque bloc, COLLER les résultats.
-- ============================================================================

-- ── A. Nullabilité de quazian_questions.flashcard_source_id ───────────────────
--     Détermine le correctif NO ACTION #2 :
--       'YES' → on NULL le lien de provenance (question-snapshot conservée).
--       'NO'  → il faudra SUPPRIMER ces questions à la place.
select column_name, is_nullable, data_type
from information_schema.columns
where table_name = 'quazian_questions' and column_name = 'flashcard_source_id';

-- ── B. Volumes des deux surfaces NO ACTION (0 = correctifs sans effet) ────────
with u as (select id from scriptorium_unites where type = 'unite'),
     d as (select id from scriptorium_documents where unite_id in (select id from u)),
     f as (select id from quazian_flashcards
           where scriptorium_unite_id in (select id from u)
              or scriptorium_doc_id   in (select id from d))
select
  (select count(*) from f)                                                as flashcards_a_supprimer_elargi,
  -- Cartes qui pointent un document d'unité SANS être déjà dans le scope unité
  -- (= l'apport réel de l'élargissement de _f ; NO ACTION #1) :
  (select count(*) from quazian_flashcards
     where scriptorium_doc_id in (select id from d)
       and (scriptorium_unite_id is null
            or scriptorium_unite_id not in (select id from u)))           as cartes_hors_scope_mais_doc_unite,
  -- Questions de quizz référençant ces cartes (NO ACTION #2) :
  (select count(*) from quazian_questions
     where flashcard_source_id in (select id from f))                     as questions_liees_aux_cartes;

-- ── C. Clés Storage à nettoyer — bucket 'scriptorium' ────────────────────────
--     (images = 0 et codex_travaux = 0 au dry-run L7 → rien à nettoyer côté images/codex)
select id, fichier_ref
from scriptorium_documents
where unite_id in (select id from scriptorium_unites where type = 'unite')
  and fichier_ref is not null
order by id;

-- ── D. Re-contrôle pré-purge (post-Phase A) : périmètre + garde-fou aletheia ──
with u as (select id from scriptorium_unites where type = 'unite')
select
  (select count(*) from u)                                                          as unites_type_unite,
  (select count(*) from scriptorium_unites where type='unite' and supprime_at is not null) as dont_soft_deletees,
  (select count(*) from scriptorium_unites where type='livre')                      as livres,
  (select count(*) from aletheia_travaux          where scriptorium_livre_id in (select id from u))
   + (select count(*) from aletheia_capstone       where scriptorium_livre_id in (select id from u))
   + (select count(*) from aletheia_livre_reference where scriptorium_livre_id in (select id from u))
   + (select count(*) from aletheia_diagnostic     where scriptorium_livre_id in (select id from u))
                                                                                     as aletheia_touchees_DOIT_ETRE_0;
-- ============================================================================
