-- ============================================================================
-- C4 · L8 — CORRECTIF : la clé d'unicité d'`exercices_routes` porte la SECTION,
-- jamais le code technique.
-- Fichier : c4_l8_doctrine_correctif_routes.sql
-- ----------------------------------------------------------------------------
-- À jouer APRÈS `c4_l8_doctrine.sql`. Ce fichier n'existe que parce que la
-- première rédaction de `uk_routes_case` a été jouée en sandbox avant que la
-- dérivation ne la contredise ; `c4_l8_doctrine.sql` porte désormais la BONNE
-- rédaction, et un dépôt neuf n'aura pas besoin de ce correctif.
--
-- LE CONSTAT, ET IL VIENT DES SOURCES
--   La dérivation refusait d'écrire : 306 collisions sur
--   (objet, mode, cran, compétence, observable_code). Elles sont LÉGITIMES —
--   plusieurs blocs d'observable d'`instances/04-*.md` isolent des aspects
--   distincts d'UN MÊME champ de la grille réceptive :
--     · `apports`       — Synthèse §8 « l'apport organisateur », §9 « l'apport
--                         vide », §10 « l'apport décoratif », §11 « l'apport
--                         non couvrant » ;
--     · `operation`     — Synthèse §2, §4, §7 ;
--     · `correspond_a`  — Synthèse §1 et §3 ;
--     · `rapports`      — Synthèse §5 et §6 ;
--     · `recadrages`    — Questionnement §7, §8, §9 ;
--     · `question_posee`— Questionnement §2 et §4.
--   Le `04-` §0 dit où vit une route : « le fichier de `instances/` et la
--   SECTION qui portent le défaut injecté, la cible mode par mode, et les
--   consignes ». Le code technique, lui, « est à la fiche de la compétence » —
--   il se partage, et rien n'a jamais dit qu'il identifiait une route.
--   La clé suit donc le domicile, pas le code.
--
-- PROTOCOLE : NORMAL — un index d'une table neuve, vide, gatée, qu'aucun code
-- ne lit encore.
-- Rollback : `c4_l8_doctrine_correctif_routes_rollback.sql`.
-- ============================================================================

begin;

drop index if exists uk_routes_case;
create unique index uk_routes_case
  on exercices_routes(type_id, mode, cran, competence, source_section);

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION
-- ============================================================================
-- select indexdef from pg_indexes where indexname = 'uk_routes_case';
--   → ... USING btree (type_id, mode, cran, competence, source_section)
