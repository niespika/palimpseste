-- ============================================================================
-- Calendrier — Lot C1a : fondation additive (non-cassante)
-- ----------------------------------------------------------------------------
-- Introduit le SEMESTRE GLOBAL (propriété du calendrier, global au prof, partagé
-- par toutes les classes) + les VACANCES + une COULEUR par classe pour le rendu
-- calendrier. Purement additif : rien d'existant ne change de comportement.
--
-- La bascule de Fragments (fragments_semestres → semesters) se fait au lot C1b,
-- celle de Quazian au lot C1c, l'ancrage calendaire des semaines au lot C2.
-- ============================================================================

begin;

-- ── 1. Semestre global ──────────────────────────────────────────────────────
-- name/start_date/end_date/is_active correspondent (lors de la bascule C1b) à
-- l'ancien fragments_semestres.label/date_debut/date_fin/courant.
create table if not exists semesters (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── 2. Périodes de vacances (rattachées au semestre) ────────────────────────
create table if not exists holidays (
  id          uuid primary key default gen_random_uuid(),
  semester_id uuid not null references semesters(id) on delete cascade,
  label       text not null,
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_holidays_semester on holidays(semester_id);

-- ── 3. Couleur de classe (hex) pour le calendrier ───────────────────────────
-- Aucune colonne couleur n'existait sur classes. null = couleur par défaut (palette).
alter table classes
  add column if not exists couleur text;

-- ── 4. RLS ──────────────────────────────────────────────────────────────────
alter table semesters enable row level security;
alter table holidays  enable row level security;

-- Prof : accès total.
drop policy if exists semesters_prof_all on semesters;
create policy semesters_prof_all on semesters
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists holidays_prof_all on holidays;
create policy holidays_prof_all on holidays
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

-- Élève : lecture seule. Métadonnées calendaires globales (semestre actif +
-- vacances) que l'élève doit pouvoir lire pour connaître ses attendus par
-- semaine (lot C2). Données non sensibles → lecture ouverte aux authentifiés.
drop policy if exists semesters_eleve_read on semesters;
create policy semesters_eleve_read on semesters
  for select
  using (true);

drop policy if exists holidays_eleve_read on holidays;
create policy holidays_eleve_read on holidays
  for select
  using (true);

commit;
