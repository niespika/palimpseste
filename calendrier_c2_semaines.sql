-- ============================================================================
-- Calendrier — Lot C2 : ancrage calendaire des semaines
-- ----------------------------------------------------------------------------
-- On fait évoluer `fragments_semaines` EN PLACE (la table à laquelle les dépôts
-- et présentations sont rattachés) plutôt que de la renommer : aucun risque de
-- casser les FK semaine_id existantes.
--
-- Ajouts :
--   - end_date            : dimanche de la semaine calendaire (lundi→dimanche).
--   - pedagogical_number  : numéro pédagogique (= numero pour une semaine de
--                           travail ; saute les semaines de vacances).
--   - is_vacation         : faux pour les semaines STOCKÉES (seules les semaines
--                           de travail sont stockées ; les semaines de vacances
--                           sont calculées à l'affichage à partir de `holidays`).
--
-- La (re)génération des semaines se fait via l'action regenererSemaines() de
-- /prof/calendrier/config (lundi→dimanche, saut des vacances, mise à jour en
-- place, NON destructive).
--
-- Prérequis : calendrier_c1a.sql + calendrier_c1b_cutover.sql. Idempotent.
-- ============================================================================

begin;

alter table fragments_semaines
  add column if not exists end_date date,
  add column if not exists pedagogical_number integer,
  add column if not exists is_vacation boolean not null default false;

-- Backfill des lignes existantes pour qu'elles survivent au nouveau schéma.
update fragments_semaines
   set end_date = (date_debut + interval '6 days')::date
 where end_date is null and date_debut is not null;

update fragments_semaines
   set pedagogical_number = numero
 where pedagogical_number is null and is_vacation = false;

commit;
