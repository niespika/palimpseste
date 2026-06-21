-- ============================================================================
-- Calendrier — Lot C7 : jours de cours (informatif, aucune contrainte)
-- ----------------------------------------------------------------------------
-- Le prof déclare un motif hebdomadaire par classe (« avec les Terminale, cours
-- lundi et jeudi ») ; le système matérialise ces jours sur le semestre (hors
-- vacances). Des exceptions ponctuelles (ajout / retrait) sont possibles.
-- Pas de créneau horaire : grain « jour » uniquement.
--
-- Additif, prof seul (le calendrier est un outil d'organisation du prof).
-- ============================================================================

begin;

-- Motif hebdomadaire : weekday 0 = lundi … 6 = dimanche.
create table if not exists teaching_patterns (
  id         uuid primary key default gen_random_uuid(),
  classe_id  uuid not null references classes(id) on delete cascade,
  weekday    int  not null check (weekday between 0 and 6),
  created_at timestamptz not null default now(),
  unique (classe_id, weekday)
);
create index if not exists idx_teaching_patterns_classe on teaching_patterns(classe_id);

-- Exceptions ponctuelles à ce motif.
create table if not exists teaching_exceptions (
  id         uuid primary key default gen_random_uuid(),
  classe_id  uuid not null references classes(id) on delete cascade,
  date       date not null,
  kind       text not null check (kind in ('ajout', 'retrait')),
  created_at timestamptz not null default now(),
  unique (classe_id, date)
);
create index if not exists idx_teaching_exceptions_classe on teaching_exceptions(classe_id);

alter table teaching_patterns   enable row level security;
alter table teaching_exceptions enable row level security;

drop policy if exists teaching_patterns_prof_all on teaching_patterns;
create policy teaching_patterns_prof_all on teaching_patterns
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists teaching_exceptions_prof_all on teaching_exceptions;
create policy teaching_exceptions_prof_all on teaching_exceptions
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;
