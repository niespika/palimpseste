-- ============================================================================
-- C4 · L1 — RETOUR ARRIÈRE des touches à l'existant. N'EXÉCUTER QU'EN CAS DE
-- PROBLÈME. Fichier : c4_l1_existant_rollback.sql — annule `c4_l1_existant.sql`.
-- ----------------------------------------------------------------------------
-- ⚠️ PROTOCOLE RENFORCÉ (SUIVI_SQL règle 5) — un élève réel utilise la base.
-- ⚠️ DESTRUCTIF DE CE QUE LES COLONNES PORTENT : si le professeur a déjà posé
-- des aménagements sur des élèves (`mode_saisie_force`, `exception_expression`,
-- `exception_orthographe`), CES MARQUES SONT PERDUES. Le bloc de constat en
-- tête les compte — LE LIRE D'ABORD. Idem pour l'attribution des coûts déjà
-- journalisés (`phase`, `depot_id`, `competence`, `version` sur `api_couts`) :
-- les LIGNES de coût survivent, leur ATTRIBUTION est perdue.
--
-- NE TOUCHE À AUCUNE POLICY. En particulier, il NE RESTAURE PAS la policy
-- self-service de `profiles` — elle est morte depuis `c1_rls_eleve.sql` et doit
-- le rester (07- §1.3). NE TOUCHE PAS `classes` : le fichier aller ne l'altère
-- pas, il ne fait que la vérifier.
-- ============================================================================

-- ── CONSTAT AVANT — À LIRE ─────────────────────────────────────────────────
select
  (select count(*) from profiles where mode_saisie_force is not null)   as amenagements_mode_saisie,
  (select count(*) from profiles where exception_expression)            as amenagements_expression,
  (select count(*) from profiles where exception_orthographe)           as amenagements_orthographe,
  (select count(*) from api_couts where phase is not null)              as couts_avec_phase,
  (select count(*) from api_couts where depot_id is not null)           as couts_rattaches_a_un_depot;

begin;

alter table api_couts drop constraint if exists api_couts_version_chk;
alter table api_couts drop constraint if exists api_couts_competence_chk;
alter table api_couts drop constraint if exists api_couts_depot_fk;
alter table api_couts drop constraint if exists api_couts_phase_chk;
drop index if exists idx_api_couts_depot;
alter table api_couts drop column if exists version;
alter table api_couts drop column if exists competence;
alter table api_couts drop column if exists depot_id;
alter table api_couts drop column if exists phase;

alter table profiles drop constraint if exists profiles_mode_saisie_force_chk;
alter table profiles drop column if exists exception_orthographe;
alter table profiles drop column if exists exception_expression;
alter table profiles drop column if exists mode_saisie_force;

commit;

-- ── VÉRIFICATION APRÈS ─────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns where table_schema='public'
     and table_name='profiles' and column_name in
     ('mode_saisie_force','exception_expression','exception_orthographe')) = 0  as profiles_revenu,
  (select count(*) from information_schema.columns where table_schema='public'
     and table_name='api_couts' and column_name in
     ('phase','depot_id','competence','version')) = 0                            as api_couts_revenu,
  -- Ce qui doit rester INTACT :
  (select count(*) from information_schema.columns where table_schema='public'
     and table_name='api_couts' and column_name in
     ('modele','tokens_entree','tokens_sortie','tokens_cache_lecture','tokens_cache_ecriture',
      'eleve_id','classe_id')) = 7                                               as attribution_c11a_intacte,
  (select count(*) from pg_policies where schemaname='public' and tablename='profiles'
     and cmd='UPDATE' and policyname ilike '%personnel%') = 0                    as policy_self_service_toujours_morte,
  (select count(*) from information_schema.columns where table_schema='public'
     and table_name='classes' and column_name in ('filiere','type_pedagogique')) = 2
                                                                                 as classes_jamais_touchee;
