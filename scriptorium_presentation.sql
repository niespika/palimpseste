-- ============================================================================
-- LE DECK DE PRÉSENTATION D'UN COURS (Scriptorium, prof seul). 2026-09-14.
-- Patron : `notions_actif.sql` (une colonne, lecture tolérante côté code).
-- ----------------------------------------------------------------------------
-- UNE colonne : `scriptorium_contenus.presentation_ref text null` — le chemin,
-- dans le bucket privé `scriptorium`, du fichier HTML autonome que Louis projette
-- en classe pour ce cours. NULL = aucun deck déposé.
-- Le code la lit par une requête SÉPARÉE et TOLÉRANTE (`app/prof/scriptorium/page.tsx`) :
-- colonne absente ⇒ aucun deck. Le code peut donc partir AVANT ce fichier.
-- ⛔ Ce fichier n'est JAMAIS lu par le RAG : il n'entre ni dans `texte_extrait`
--    ni dans les sections. C'est le support du professeur, rien d'autre.
-- ⛔ Aucune policy touchée (les écrans passent par le service-role) ; additive,
--    aucune donnée réécrite. Pas d'interrupteur : écran prof seul, invisible aux
--    élèves (décision de Louis, 14/09). Rollback : `scriptorium_presentation_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_contenus) as contenus_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_contenus' and column_name = 'presentation_ref')
    as colonne_deja_posee;

begin;

alter table scriptorium_contenus
  add column if not exists presentation_ref text null;

commit;

-- constat de pied
select
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_contenus' and column_name = 'presentation_ref'
              and data_type = 'text' and is_nullable = 'YES')
    as colonne_posee,
  (select count(*) from scriptorium_contenus where presentation_ref is not null) as decks_deposes,
  (select count(*) from scriptorium_contenus) as contenus_intacts;
