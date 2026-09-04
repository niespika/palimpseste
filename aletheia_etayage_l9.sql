-- ============================================================================
-- ALETHEIA · ÉTAYAGE PAR NIVEAU — LOT E9-bis : la présentation vue une fois, l'heure
-- d'ouverture d'une séance (le temps réel d'une séance, annoncé aux élèves).
-- 2026-09-04. Spec : `SPEC_Aletheia_Etayage_par_niveau.md` (§ 10, refonte des écrans).
-- ----------------------------------------------------------------------------
-- 1. `aletheia_travaux.ouvert_at timestamptz` — posé à la PREMIÈRE ouverture de la séance
--    (la ligne naît alors en DRAFT, vide) ; avec `retour_vf_lu_at`, c'est le temps réel d'une
--    séance, calculé par classe et par livre, montré à l'élève et au professeur.
-- 2. `aletheia_eleve_etat` — un état par élève : `presentation_vue_at` (la présentation du
--    module, montrée une fois), `presentation_version`.
-- ⚠️ `aletheia_travaux` est une table de flux vivant (R6) : aucune valeur réécrite, aucune
--    policy touchée ; une ligne DRAFT vide n'est PAS un rendu (`estRendu` = statut ≠ DRAFT).
-- Rollback : `aletheia_etayage_l9_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from aletheia_travaux) as travaux_avant,
  (select count(*) from information_schema.columns where table_name = 'aletheia_travaux' and column_name = 'ouvert_at') as colonne_deja_posee,
  (select count(*) from information_schema.tables where table_name = 'aletheia_eleve_etat') as table_deja_posee;

begin;

alter table aletheia_travaux add column if not exists ouvert_at timestamptz;
comment on column aletheia_travaux.ouvert_at is
  'Aletheia (refonte 04/09) — première ouverture de la séance par l''élève. Avec retour_vf_lu_at : le temps réel d''une séance.';

create table if not exists aletheia_eleve_etat (
  eleve_id uuid primary key references profiles(id) on delete cascade,
  presentation_vue_at timestamptz,
  presentation_version integer not null default 1,
  updated_at timestamptz not null default now()
);
comment on table aletheia_eleve_etat is
  'Aletheia (refonte 04/09) — état par élève : la présentation du module vue (une fois par version).';
alter table aletheia_eleve_etat enable row level security;
drop policy if exists aletheia_eleve_etat_prof_all on aletheia_eleve_etat;
create policy aletheia_eleve_etat_prof_all on aletheia_eleve_etat
  for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;

-- constat de pied
select
  (select count(*) from information_schema.columns where table_name = 'aletheia_travaux' and column_name = 'ouvert_at') = 1 as colonne_posee,
  (select count(*) from information_schema.tables where table_name = 'aletheia_eleve_etat') = 1 as table_posee,
  not exists (select 1 from aletheia_travaux where ouvert_at is not null) as aucune_valeur,
  (select count(*) from aletheia_travaux) as travaux_intacts;
