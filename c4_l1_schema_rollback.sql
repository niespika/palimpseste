-- ============================================================================
-- C4 · L1 — RETOUR ARRIÈRE du schéma. N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- Fichier : c4_l1_schema_rollback.sql — annule `c4_l1_schema.sql`.
-- ----------------------------------------------------------------------------
-- ⚠️⚠️ DESTRUCTIF PAR NATURE : il SUPPRIME les 20 tables et TOUT ce qu'elles
-- contiennent — instances, dépôts, copies d'élèves, squelettes, mesures,
-- niveaux, journal du routeur, compteurs d'assiduité. Il n'y a pas de version
-- non destructive de ce retour arrière : les tables sont neuves, les vider et
-- les garder n'aurait aucun sens.
-- ⚠️ JOUER D'ABORD `c4_l1_existant_rollback.sql` : `api_couts.depot_id` porte
-- une FK vers `exercices_depots`, qui disparaît ici.
--
-- ⚠️ LE BLOC DE CONSTAT CI-DESSOUS EST À LIRE D'ABORD — il compte ce qui va
-- partir. Patron : `c7_quazian_contenus_rollback.sql`.
-- ============================================================================

-- ── CONSTAT AVANT — À LIRE, hors transaction ───────────────────────────────
select 'exercices_types' as tbl, count(*) from exercices_types
union all select 'exercices_references',  count(*) from exercices_references
union all select 'exercices',             count(*) from exercices
union all select 'exercices_depots',      count(*) from exercices_depots
union all select 'exercices_squelettes',  count(*) from exercices_squelettes
union all select 'exercices_metacognition', count(*) from exercices_metacognition
union all select 'exercices_retours',     count(*) from exercices_retours
union all select 'competences_mesures',   count(*) from competences_mesures
union all select 'competences_niveaux',   count(*) from competences_niveaux
union all select 'competences_escalade',  count(*) from competences_escalade
union all select 'competences_montee',    count(*) from competences_montee
union all select 'monitoring_mesures',    count(*) from monitoring_mesures
union all select 'monitoring_niveaux',    count(*) from monitoring_niveaux
union all select 'routeur_decisions',     count(*) from routeur_decisions
union all select 'assiduite_hebdo',       count(*) from assiduite_hebdo
union all select 'exercices_demonstrations', count(*) from exercices_demonstrations
order by 1;

begin;

drop view if exists assiduite_hebdo_classe;

-- Ordre indifférent grâce à `cascade` sur les FK internes ; l'ordre inverse de
-- la création est conservé pour la lisibilité.
drop table if exists assiduite_hebdo               cascade;
drop table if exists monitoring_niveaux            cascade;
drop table if exists monitoring_mesures            cascade;
drop table if exists competences_actives_par_classe cascade;
drop table if exists competences_montee            cascade;
drop table if exists competences_escalade          cascade;
drop table if exists competences_niveaux           cascade;
drop table if exists competences_mesures           cascade;
drop table if exists exercices_retours             cascade;
drop table if exists exercices_metacognition       cascade;
drop table if exists exercices_squelettes          cascade;
drop table if exists exercices_jobs                cascade;
drop table if exists exercices_depots              cascade;
drop table if exists routeur_decisions             cascade;
drop table if exists exercices                     cascade;
drop table if exists exercices_references          cascade;
drop table if exists exercices_demonstrations      cascade;
drop table if exists exercices_types_modes         cascade;
drop table if exists exercices_types_crans         cascade;
drop table if exists exercices_types               cascade;

-- Les gardes serveur (les triggers sont partis avec les tables).
drop function if exists public.garde_retour_maison_non_edite();
drop function if exists public.garde_depot_lieu();
drop function if exists public.garde_reference_validee();
drop function if exists public.garde_reference_immuable();
drop function if exists public.modes_par_competence_bien_forme(jsonb);
drop function if exists public.photos_bien_formees(jsonb);

-- Les trois interrupteurs. Ils étaient à OFF ; les retirer ne rallume rien.
alter table scriptorium_params drop column if exists competences_affichage_actif;
alter table scriptorium_params drop column if exists routeur_actif;
alter table scriptorium_params drop column if exists exercices_actif;

commit;

-- ── VÉRIFICATION APRÈS ─────────────────────────────────────────────────────
select
  (select count(*) from pg_tables where schemaname='public' and (
      tablename like 'exercices%' or tablename like 'competences%'
   or tablename like 'monitoring%' or tablename in ('routeur_decisions','assiduite_hebdo'))
   and tablename <> 'scriptorium_exercices_planifies') = 0            as tables_c4l1_parties,
  (select count(*) from information_schema.columns where table_schema='public'
     and table_name='scriptorium_params' and column_name in
     ('exercices_actif','routeur_actif','competences_affichage_actif')) = 0
                                                                      as interrupteurs_partis,
  -- Ce que le retour arrière NE TOUCHE PAS, et qui doit rester intact :
  (select count(*) from information_schema.columns where table_schema='public'
     and table_name='scriptorium_params' and column_name in
     ('rag_actif','plan_evaluation_actif')) = 2                       as interrupteurs_existants_intacts,
  (select count(*) from pg_tables where schemaname='public'
     and tablename='scriptorium_exercices_planifies') = 1             as plan_exercices_intact;
