-- ============================================================================
-- Lot 5 — Phase 3 : épreuve multi-classes (5.4)
-- ----------------------------------------------------------------------------
-- Une épreuve d'essai peut être assignée à PLUSIEURS classes, chacune avec sa
-- propre date et son propre état ouvert/fermé. La date et l'ouverture des
-- dépôts, qui étaient portées par l'épreuve (globales), passent dans une table
-- de liaison (épreuve × classe). L'épreuve elle-même est scopée à un semestre.
--
-- À exécuter APRÈS lot5a_semestre.sql. Migration en place, sans perte : on
-- garde `date_epreuve` / `depots_ouverts` sur l'épreuve (défauts / legacy) et
-- on dérive les liaisons existantes depuis les essais déjà déposés.
-- ============================================================================

begin;

-- ── 1. Épreuve scopée par semestre ──────────────────────────────────────────
alter table fragments_essais_epreuves
  add column if not exists semestre_id uuid references fragments_semestres(id) on delete cascade;

update fragments_essais_epreuves
   set semestre_id = (select id from fragments_semestres where courant limit 1)
 where semestre_id is null;

alter table fragments_essais_epreuves
  alter column semestre_id set not null;

-- ── 2. Liaison épreuve × classe (date + état propres à chaque classe) ────────
create table if not exists fragments_epreuves_classes (
  id            uuid primary key default gen_random_uuid(),
  epreuve_id    uuid not null references fragments_essais_epreuves(id) on delete cascade,
  classe_id     uuid not null references classes(id) on delete cascade,
  date_epreuve  date not null,
  depots_ouverts boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (epreuve_id, classe_id)
);

create index if not exists idx_fragments_epreuves_classes_epreuve on fragments_epreuves_classes(epreuve_id);
create index if not exists idx_fragments_epreuves_classes_classe  on fragments_epreuves_classes(classe_id);

-- Backfill : pour chaque épreuve, recréer les liaisons à partir des classes qui
-- ont au moins un essai déposé pour elle, en reprenant date + état de l'épreuve.
-- (Les classes seulement « essai activé » sans dépôt sont réassignées à la main.)
insert into fragments_epreuves_classes (epreuve_id, classe_id, date_epreuve, depots_ouverts)
select distinct e.id, i.classe_id, e.date_epreuve, e.depots_ouverts
  from fragments_essais_epreuves e
  join fragments_essais es on es.epreuve_id = e.id
  join inscriptions i      on i.id = es.inscription_id
 where i.classe_id is not null
on conflict (epreuve_id, classe_id) do nothing;

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
alter table fragments_epreuves_classes enable row level security;

drop policy if exists fragments_epreuves_classes_prof_all on fragments_epreuves_classes;
create policy fragments_epreuves_classes_prof_all on fragments_epreuves_classes
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists fragments_epreuves_classes_eleve_read on fragments_epreuves_classes;
create policy fragments_epreuves_classes_eleve_read on fragments_epreuves_classes
  for select
  using (exists (
    select 1 from inscriptions i
    where i.classe_id = fragments_epreuves_classes.classe_id
      and i.eleve_id = auth.uid()
      and i.statut = 'active'
  ));

commit;
