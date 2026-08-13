-- ============================================================================
-- C7 · L1 — Quazian reconnaît l'architecture Scriptorium actuelle.
-- Fichier : c7_quazian_contenus.sql — cf. PLAN_CHANTIERS_RENTREE.md §C7,
-- PROMPT_Code_C7_L1.md, RAPPORT_Diagnostic_C7_quazian.md (§4.3).
-- ----------------------------------------------------------------------------
-- POURQUOI : Quazian ancre ses cartes, ses publications et le périmètre de ses
-- quiz sur `scriptorium_unites` (type='unite'). La réorganisation du Scriptorium
-- a déplacé cours et textes dans `scriptorium_contenus` ; il ne reste dans
-- `scriptorium_unites` que des LIVRES, que Quazian s'interdit (anti-spoiler).
-- La colonne `quazian_flashcards.scriptorium_unite_id` étant `not null`, aucune
-- carte ne PEUT pointer un contenu : le schéma refuse l'écriture avant même que
-- le code s'en mêle. Même mur sur `quazian_publications`.
--
-- CE QUE ÇA FAIT : l'arc BI-SOURCE `unité | contenu`, strictement le patron déjà
-- joué pour Codex (plan_evaluation_phase_a.sql §5, contrainte
-- `codex_sessions_source_chk`) et pour les images de contenu (parcours_phase_a.sql) :
--   1. `quazian_flashcards`   : unite_id nullable + `contenu_id` + CHECK exclusif
--   2. `quazian_publications` : idem + unicité du bras contenu
--   3. `quazian_quizzes`      : `scope_contenus uuid[]` à côté de `scope_unites`
-- Les lignes existantes (unite_id non null, contenu_id null) satisfont d'emblée
-- les deux CHECK — et il n'y en a AUCUNE : les trois tables sont vides en base
-- (constat du 13/08, §3 du rapport). Aucune donnée à convertir.
--
-- CE QUE ÇA NE FAIT PAS : aucune policy touchée, aucune RLS modifiée, aucune
-- colonne supprimée, aucune donnée détruite. `scope_unites` reste en place avec
-- son sens d'origine (quiz hérités) — on n'en change pas la signification en
-- douce, on ajoute la colonne qui dit ce qu'elle dit.
--
-- ⚠️ `quazian_publications.classe_id` (type `text`, alimenté avec le LIBELLÉ
-- `scriptorium_unites.classe`) n'est lu par aucun code — donnée morte, décrite
-- au §4.5 et §10.1 du rapport. On la LAISSE telle quelle : son sort est un
-- arbitrage (R7), pas une remise en marche. Le nouveau bras ne l'alimente pas.
--
-- ── Protocole (règles R6 + 5 de SUIVI_SQL.md) ────────────────────────────────
-- Additive dans ses effets (colonnes neuves, contraintes que tout l'existant
-- satisfait, un `drop not null` qui ne fait que RELÂCHER) — mais elle touche des
-- tables d'un FLUX EXISTANT (Quazian) et n'est pas gatée : on applique donc le
-- PROTOCOLE RENFORCÉ. Code d'abord (merge + push), SQL ensuite, fenêtre calme,
-- retour arrière prêt (`c7_quazian_contenus_rollback.sql`), smoke test élève.
-- Le risque réel est nul (tables vides, aucun élève n'a de carte), mais la règle
-- ne se négocie pas au cas par cas.
-- Idempotent, rejouable (`if not exists` / `duplicate_object`).
--
-- ── Ordre code / SQL ─────────────────────────────────────────────────────────
-- Le code de L1 écrit `contenu_id` dès qu'un contenu est choisi : tant que ce
-- fichier n'est pas joué, la génération de cartes échoue avec le message de
-- Postgres (colonne absente). Ce n'est PAS une régression — le chemin ne
-- fonctionnait déjà pas (0 unité, 0 carte depuis la réorganisation). Rien de ce
-- qui marche aujourd'hui ne dépend de ce fichier.
-- ============================================================================

begin;

-- 1. quazian_flashcards — arc bi-source ---------------------------------------
-- `on delete restrict` (et non cascade, contrairement au bras unité) : purger un
-- contenu de la corbeille est un VRAI delete (purgerContenuBiblio), là où
-- supprimerUnite ne fait qu'un soft-delete précisément pour ne pas cascader sur
-- les cartes. En cascade, la purge d'un cours emporterait en silence les
-- `quazian_card_states` — l'historique FSRS des élèves. En restrict, elle est
-- refusée ; le code affiche un message clair (patron de la garde codex_sessions).
alter table quazian_flashcards alter column scriptorium_unite_id drop not null;
alter table quazian_flashcards add column if not exists contenu_id uuid
  references scriptorium_contenus(id) on delete restrict;
do $$ begin
  alter table quazian_flashcards add constraint quazian_flashcards_source_chk check (
    (scriptorium_unite_id is not null and contenu_id is null)
    or (scriptorium_unite_id is null and contenu_id is not null)
  );
exception when duplicate_object then null; end $$;

create index if not exists idx_quazian_flashcards_contenu
  on quazian_flashcards(contenu_id) where contenu_id is not null;

-- 2. quazian_publications — arc bi-source + unicité du bras contenu -----------
-- L'unicité historique `quazian_publications_scriptorium_unite_id_key` survit
-- telle quelle : en Postgres, plusieurs NULL ne violent pas un UNIQUE, donc le
-- bras contenu ne s'y heurte pas. Il lui faut sa propre unicité, en index
-- partiel (une publication par contenu, au plus).
alter table quazian_publications alter column scriptorium_unite_id drop not null;
alter table quazian_publications add column if not exists contenu_id uuid
  references scriptorium_contenus(id) on delete cascade;
do $$ begin
  alter table quazian_publications add constraint quazian_publications_source_chk check (
    (scriptorium_unite_id is not null and contenu_id is null)
    or (scriptorium_unite_id is null and contenu_id is not null)
  );
exception when duplicate_object then null; end $$;

create unique index if not exists idx_quazian_publications_contenu
  on quazian_publications(contenu_id) where contenu_id is not null;

-- 3. quazian_quizzes — périmètre en contenus ----------------------------------
-- `scope_unites` (uuid[], sans FK) désignait des unités ; on ne lui fait pas
-- dire autre chose. `scope_contenus` porte le périmètre du nouveau monde. Un
-- quiz a l'un, l'autre, ou les deux (rien ne l'interdit — un quiz peut couvrir
-- une unité héritée ET un cours de bibliothèque).
alter table quazian_quizzes add column if not exists scope_contenus uuid[] not null default '{}';

commit;

-- ── Vérification (à exécuter après ; attendu : tout à `t`, colonnes = 3) ─────
-- select
--   (select count(*) from information_schema.columns
--      where table_schema = 'public'
--        and ((table_name = 'quazian_flashcards'   and column_name = 'contenu_id')
--          or (table_name = 'quazian_publications' and column_name = 'contenu_id')
--          or (table_name = 'quazian_quizzes'      and column_name = 'scope_contenus')))
--                                                                  as colonnes,
--   (select is_nullable = 'YES' from information_schema.columns
--      where table_schema='public' and table_name='quazian_flashcards'
--        and column_name='scriptorium_unite_id')                   as fc_unite_nullable,
--   (select is_nullable = 'YES' from information_schema.columns
--      where table_schema='public' and table_name='quazian_publications'
--        and column_name='scriptorium_unite_id')                   as pub_unite_nullable,
--   (select count(*) = 2 from pg_constraint
--      where conname in ('quazian_flashcards_source_chk','quazian_publications_source_chk'))
--                                                                  as arcs_poses,
--   (select count(*) = 2 from pg_indexes where schemaname='public'
--      and indexname in ('idx_quazian_flashcards_contenu','idx_quazian_publications_contenu'))
--                                                                  as index_poses;
--
-- ── Constat d'entrée (attendu au 13/08 : 0 partout — rien à convertir) ──────
-- select (select count(*) from quazian_flashcards)   as cartes,
--        (select count(*) from quazian_publications) as publications,
--        (select count(*) from quazian_quizzes)      as quiz;
