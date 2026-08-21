-- ============================================================================
-- ROLLBACK de `c4_l8_doctrine_correctif_routes.sql` — N'EXÉCUTER QU'EN CAS DE
-- PROBLÈME. Restaure la clé d'unicité PAR CODE TECHNIQUE.
-- ⚠️ ÉCHOUERA si `exercices_routes` porte des lignes dérivées : les 306
-- collisions légitimes documentées dans le correctif la rendent impossible.
-- C'est le comportement voulu — l'échec dit que le correctif avait raison.
-- ============================================================================
begin;
drop index if exists uk_routes_case;
create unique index uk_routes_case
  on exercices_routes(type_id, mode, cran, competence, observable_code);
commit;
