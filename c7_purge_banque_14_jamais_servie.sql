-- ============================================================================
-- c7_purge_banque_14_jamais_servie.sql — 08/09/2026
-- Louis, 08/09 : « On efface les 492 jamais servies (on garde les textes et les sujets). »
-- ----------------------------------------------------------------------------
-- Une instance de l'ANCIENNE banque (format 1.4) = importée (id_import non nul, pas « ex-gab-… »)
-- et sans aucun cas à `probleme`. Hors classe. Jamais servie = aucun dépôt.
-- Mesuré en production le 08/09 avant ce fichier : 492 cibles · 84 servies gardées · 4 de classe
-- gardées · 4 créées à la main gardées · 0 décision du routeur sur les cibles.
-- Ce que la suppression entraîne (clés étrangères) : exercices_cas → cascade (les cas des cibles) ;
-- exercices_depots → cascade (aucun, par définition) ; exercices_signalements_eleve → cascade (aucun) ;
-- routeur_decisions.exercice_id → set null (aucune) ; fragments_essais_classes → set null (aucun).
-- Les TEXTES et les SUJETS sont des tables à part, sans cascade depuis `exercices` : intouchés.
-- ⛔ Sandbox d'abord, prod ensuite. Le 1) se lit avant le 2) : le compte doit dire 492 en prod.
-- ============================================================================

-- 1) À BLANC — le compte des cibles (attendu en production : 492)
select count(*) as cibles
  from exercices e
 where e.id_import is not null
   and e.id_import not like 'ex-gab-%'
   and e.lieu is distinct from 'classe'
   and not exists (select 1 from exercices_cas c where c.exercice_id = e.id and c.probleme is not null)
   and not exists (select 1 from exercices_depots d where d.exercice_id = e.id);

-- 2) L'EFFACEMENT — même prédicat, à la lettre
delete from exercices e
 where e.id_import is not null
   and e.id_import not like 'ex-gab-%'
   and e.lieu is distinct from 'classe'
   and not exists (select 1 from exercices_cas c where c.exercice_id = e.id and c.probleme is not null)
   and not exists (select 1 from exercices_depots d where d.exercice_id = e.id);

-- 3) OPTIONNEL — les matériaux fabriqués de l'ancienne banque que plus aucun cas ne référence
--    (mesuré : 409 après le 2). Même décision que le 2 : on garde les textes et les sujets, pas les
--    matériaux d'exercices effacés. Ne touche pas au gabarit (« mat-gab-… »).
-- delete from exercices_materiaux m
--  where m.id_import is not null
--    and m.id_import not like 'mat-gab-%'
--    and not exists (select 1 from exercices_cas c where c.materiau_id = m.id);
