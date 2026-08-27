-- ============================================================================
-- ROLLBACK de `c4_l8_doctrine.sql` — N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- Fichier : c4_l8_doctrine_rollback.sql
-- ----------------------------------------------------------------------------
-- ⚠️ DESTRUCTIF PAR NATURE : supprime les neuf tables de la doctrine dérivée et
-- l'interrupteur `fabrique_actif`. Ce qu'on perd est intégralement RE-DÉRIVABLE
-- des sources par `scripts/derive-doctrine.py` — c'est la propriété même de ces
-- tables : « rien n'y est écrit à la main ». Le journal `doctrine_derivation`
-- part avec elles, et lui n'est pas re-dérivable : il ne porte que la trace des
-- passes antérieures.
--
-- ⚠️ NE TOUCHE PAS aux tables de C4-L1 ni aux trois interrupteurs du `07-` §1.5.
-- `exercices_types.crans_admis`, `exercices_types_crans` et
-- `exercices_types_modes` sont des tables de C4-L1 que la dérivation REMPLIT :
-- ce rollback ne les vide PAS. Pour revenir à l'état « seed de C4-L1 », jouer
-- en plus la section optionnelle en bas de fichier.
-- ============================================================================

begin;

drop table if exists doctrine_derivation;
drop table if exists exercices_guides_production;
drop table if exists exercices_consignes_production;
drop table if exists exercices_consignes_isolees;
drop table if exists exercices_routes;
drop table if exists exercices_types_modes_source;
drop table if exists competences_modes_admis;
drop table if exists exercices_durees;
drop table if exists exercices_crans;

alter table scriptorium_params drop column if exists fabrique_actif;

commit;

-- ============================================================================
-- VÉRIFICATION APRÈS ROLLBACK
-- ============================================================================
-- select
--   (select count(*) from information_schema.tables where table_schema='public'
--      and table_name in ('exercices_crans','exercices_durees','competences_modes_admis',
--        'exercices_types_modes_source','exercices_routes','exercices_consignes_isolees',
--        'exercices_consignes_production','exercices_guides_production','doctrine_derivation')) as restant,  -- 0
--   (select count(*) from information_schema.columns where table_schema='public'
--      and table_name='scriptorium_params' and column_name='fabrique_actif') as gate_restant,               -- 0
--   (select count(*) from information_schema.columns where table_schema='public'
--      and table_name='scriptorium_params' and column_name in
--      ('rag_actif','plan_evaluation_actif','exercices_actif','routeur_actif','competences_affichage_actif'))
--        as interrupteurs_existants_intacts,                                                                -- 5
--   (select count(*) from exercices_types) as treize_objets_plus_deux_diagnostics;                          -- 15

-- ============================================================================
-- SECTION OPTIONNELLE — revenir à l'état « seed de C4-L1 » sur les colonnes que
-- la dérivation a remplies. ⚠️ À NE JOUER QUE SI C'EST CE QU'ON VEUT.
-- ============================================================================
-- begin;
-- delete from exercices_types_crans;
-- delete from exercices_types_modes;
-- update exercices_types set crans_admis = '{}', exclusions_parcours = '{}',
--        mode_saisie = null;
--
-- ⚠️ AMENDÉ PAR C5-L1 (26/08) : la recette ci-dessus portait aussi
--    `consigne_gabarit = null`. **La colonne est retirée** — `07-` §1.1 v2.55,
--    décision de Louis : c'était un RELIQUAT d'un modèle « une consigne par
--    objet » remplacé par la banque `exercices_routes` (objet × mode × cran).
--    Laissée telle quelle, cette recette AURAIT ÉCHOUÉ après le passage de
--    `c5_l1_retrait_consigne_gabarit.sql`. Même geste que C4-L11, qui avait dû
--    amender le rollback de C4-L9 pour la même raison.
-- commit;
