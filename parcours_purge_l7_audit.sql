-- ============================================================================
-- MIGRATION L7/L8 — AUDIT (LECTURE SEULE, à jouer AVANT toute mutation)
-- ----------------------------------------------------------------------------
-- Refonte Scriptorium → Parcours, dernier lot : ne garder QUE les livres Aletheia,
-- jeter les unités pilote (type='unite') + leurs dépendances Quazian/Codex.
-- Ce fichier ne MODIFIE RIEN. Il sert à :
--   (1) valider la liste de dépendances contre le catalogue LIVE (le schéma de base
--       précède le versionnage git → les ON DELETE réels ne sont pas tous lisibles) ;
--   (2) débusquer un trigger créé dans l'UI Supabase (invisible dans git) ;
--   (3) chiffrer ce qui part / ce qui reste + vérifier le garde-fou Aletheia = 0.
--
-- Mode d'emploi : jouer chaque bloc, COLLER le résultat pour réconciliation
-- AVANT de jouer `parcours_purge_l7_phase_a.sql`.
-- ⚠️ NE JAMAIS utiliser session_replication_role='replica' (désactive FK + CHECK).
-- ============================================================================

-- ── 1a. FK entrantes réelles (ON DELETE) sur TOUT le périmètre supprimé ──────
--     But : débusquer un enfant RESTRICT surprise de n'importe quelle table dont
--     on supprime des lignes (pas seulement des racines).
select c.conname,
       conrelid::regclass  as enfant,
       confrelid::regclass as parent,
       a.attname           as colonne_fk,
       case c.confdeltype when 'a' then 'NO ACTION' when 'r' then 'RESTRICT'
            when 'c' then 'CASCADE' when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' end as on_delete
from pg_constraint c
join lateral unnest(c.conkey) with ordinality k(attnum, ord) on true
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
where c.contype = 'f'
  and confrelid::regclass in ('scriptorium_unites'::regclass,'scriptorium_documents'::regclass,
                              'scriptorium_document_classes'::regclass,'scriptorium_contenu_images'::regclass,
                              'scriptorium_unite_classes'::regclass,
                              'quazian_flashcards'::regclass,'quazian_card_states'::regclass,
                              'quazian_review_log'::regclass,'quazian_publications'::regclass,
                              'codex_sessions'::regclass,'codex_travaux'::regclass,'codex_erreurs'::regclass)
order by parent, enfant;
-- ATTENDU : matche la liste confirmée du plan (aucun enfant surprise).

-- ── 1b. Triggers non-internes sur le périmètre (UI Supabase = invisibles git) ─
select tgrelid::regclass as tabla, tgname, tgenabled
from pg_trigger
where not tgisinternal
  and tgrelid::regclass in ('scriptorium_unites'::regclass,'scriptorium_documents'::regclass,
      'scriptorium_document_classes'::regclass,'scriptorium_contenu_images'::regclass,
      'quazian_flashcards'::regclass,'quazian_card_states'::regclass,'quazian_review_log'::regclass,
      'quazian_publications'::regclass,'codex_sessions'::regclass,'codex_travaux'::regclass,'codex_erreurs'::regclass)
order by tabla, tgname;
-- ATTENDU : VIDE (aucun trigger). Sinon → réconcilier AVANT de continuer.

-- ── 2. Dry-run : volumes (ce qui part) + garde-fou Aletheia (DOIT ETRE 0) ────
with u as (select id from scriptorium_unites where type='unite'),
     d as (select id from scriptorium_documents where unite_id in (select id from u)),
     f as (select id from quazian_flashcards where scriptorium_unite_id in (select id from u)),
     cs as (select id from codex_sessions where scriptorium_unite_id in (select id from u))
select
  (select count(*) from u)                                                                     as unites_a_traiter,
  (select count(*) from scriptorium_unites where type='livre')                                 as livres_conserves,
  (select count(*) from d)                                                                      as documents,
  (select count(*) from scriptorium_document_classes where document_id in (select id from d))   as doc_classes,
  (select count(*) from scriptorium_contenu_images    where document_id in (select id from d))  as images,
  (select count(*) from scriptorium_unite_classes     where unite_id  in (select id from u))    as unite_classes,
  (select count(*) from f)                                                                      as flashcards,
  (select count(*) from quazian_card_states where flashcard_id in (select id from f))           as card_states,
  (select count(*) from quazian_review_log  where card_state_id in
       (select id from quazian_card_states where flashcard_id in (select id from f)))           as review_log,
  (select count(*) from quazian_publications where scriptorium_unite_id in (select id from u))  as publications,
  (select count(*) from cs)                                                                     as codex_sessions,
  (select count(*) from codex_travaux where session_id in (select id from cs))                  as codex_travaux,
  (select count(*) from codex_erreurs where travail_id in
       (select id from codex_travaux where session_id in (select id from cs)))                  as codex_erreurs,
  -- GARDE-FOU non tautologique : lignes Aletheia touchées par le périmètre unité.
  -- Aletheia n'attache que des LIVRES → ce total DOIT ETRE 0. ≠ 0 ⇒ STOP.
  (select count(*) from aletheia_travaux          where scriptorium_livre_id in (select id from u)) +
  (select count(*) from aletheia_capstone         where scriptorium_livre_id in (select id from u)) +
  (select count(*) from aletheia_livre_reference  where scriptorium_livre_id in (select id from u)) +
  (select count(*) from aletheia_diagnostic       where scriptorium_livre_id in (select id from u))
                                                                                as aletheia_touchees_DOIT_ETRE_0;

-- ============================================================================
-- Fin de l'audit. Prochaine étape : parcours_purge_l7_phase_a.sql (réversible).
-- ============================================================================
