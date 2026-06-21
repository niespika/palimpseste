-- ============================================================================
-- Aletheia — Lot 2 : structure (tables travail élève) + bascule book-level
-- ----------------------------------------------------------------------------
-- Trois blocs additifs :
--   1. Enregistrement du module « aletheia » (le prof l'active + assigne des
--      classes via /prof/modules — aucun code dédié, mécanique générique).
--   2. Assignation classe AU NIVEAU DU LIVRE (décision : un livre = un jeu de
--      classes, plus par-semaine). Table `scriptorium_unite_classes` jumelle de
--      `scriptorium_document_classes` (Lot 6) + backfill des livres existants.
--   3. Tables `aletheia_travaux` / `aletheia_capstone` (travail élève) + RLS.
--
-- ⚠️ COUPLAGE CODE ↔ MIGRATION (comme Lot 1) : à exécuter AVANT/avec le déploiement
--   du code de ce lot (le code lit `scriptorium_unite_classes` et les tables
--   `aletheia_*`). Détachement à l'effacement de classe : assuré par le
--   `on delete cascade` sur `classe_id` — aucune modification de `effacer_classe`.
-- ============================================================================

begin;

-- ── 1. Module ───────────────────────────────────────────────────────────────
insert into modules (slug, nom, description, actif)
values ('aletheia', 'Aletheia', 'Lecture autonome et accompagnée d''un livre, semaine après semaine.', false)
on conflict (slug) do nothing;

-- ── 2. Assignation classe au niveau du livre (unité) ────────────────────────
create table if not exists scriptorium_unite_classes (
  id         uuid primary key default gen_random_uuid(),
  unite_id   uuid not null references scriptorium_unites(id) on delete cascade,
  classe_id  uuid not null references classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (unite_id, classe_id)
);
create index if not exists idx_scriptorium_unite_classes_unite  on scriptorium_unite_classes(unite_id);
create index if not exists idx_scriptorium_unite_classes_classe on scriptorium_unite_classes(classe_id);

alter table scriptorium_unite_classes enable row level security;
drop policy if exists scriptorium_unite_classes_prof_all on scriptorium_unite_classes;
create policy scriptorium_unite_classes_prof_all on scriptorium_unite_classes
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

-- Backfill : remonter au niveau livre les assignations par-semaine des livres
-- déjà créés (Lot 1). Les contenus non-livre gardent leur assignation par doc.
insert into scriptorium_unite_classes (unite_id, classe_id)
select distinct d.unite_id, dc.classe_id
  from scriptorium_document_classes dc
  join scriptorium_documents d on d.id = dc.document_id
  join scriptorium_unites u on u.id = d.unite_id
 where u.type = 'livre'
on conflict do nothing;

-- Nettoyage : les livres sont désormais gérés EXCLUSIVEMENT au niveau livre.
-- On supprime les liens par-semaine des documents de livre, devenus redondants
-- (source unique de vérité = scriptorium_unite_classes). Les contenus non-livre
-- ne sont pas touchés.
delete from scriptorium_document_classes dc
 using scriptorium_documents d
 join scriptorium_unites u on u.id = d.unite_id
 where dc.document_id = d.id and u.type = 'livre';

-- ── 3. Travail élève Aletheia ───────────────────────────────────────────────
-- Statuts en MAJUSCULES anglaises (conforme aletheia-spec §3 ; divergence
-- assumée par rapport aux statuts FR snake_case des autres modules).
create table if not exists aletheia_travaux (
  id                  uuid primary key default gen_random_uuid(),
  scriptorium_livre_id uuid not null references scriptorium_unites(id) on delete cascade,
  semaine_index       integer not null,
  eleve_id            uuid not null references profiles(id) on delete cascade,
  statut              text not null default 'DRAFT'
                        check (statut in ('DRAFT','V1_SUBMITTED','FEEDBACK1_READY','VF_SUBMITTED','FEEDBACK2_READY','DONE')),
  resume_initial      text,
  questions           text[] not null default '{}',
  retour_1            jsonb,
  resume_vf           text,
  retour_2            jsonb,
  retour_2_lu_at      timestamptz,
  devoilement         jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (eleve_id, scriptorium_livre_id, semaine_index)
);
create index if not exists idx_aletheia_travaux_eleve on aletheia_travaux(eleve_id);
create index if not exists idx_aletheia_travaux_livre on aletheia_travaux(scriptorium_livre_id);

create table if not exists aletheia_capstone (
  id                  uuid primary key default gen_random_uuid(),
  scriptorium_livre_id uuid not null references scriptorium_unites(id) on delete cascade,
  eleve_id            uuid not null references profiles(id) on delete cascade,
  contenu             jsonb,
  created_at          timestamptz not null default now(),
  unique (eleve_id, scriptorium_livre_id)
);
create index if not exists idx_aletheia_capstone_eleve on aletheia_capstone(eleve_id);

-- RLS : prof (tout) + élève (ses propres lignes uniquement).
-- ⚠️ Les écritures Aletheia passent par le client admin (service_role) qui IGNORE
-- la RLS. La politique eleve_own protège donc surtout les LECTURES directes ; la
-- garde d'accès (livre assigné à la classe active + module + transition d'état
-- valide) est appliquée DANS le code des server actions, qui DOIT systématiquement
-- vérifier l'appartenance + l'accès au livre + le statut avant toute écriture admin.
alter table aletheia_travaux  enable row level security;
alter table aletheia_capstone enable row level security;

drop policy if exists aletheia_travaux_prof_all on aletheia_travaux;
create policy aletheia_travaux_prof_all on aletheia_travaux
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists aletheia_travaux_eleve_own on aletheia_travaux;
create policy aletheia_travaux_eleve_own on aletheia_travaux
  for all
  using (eleve_id = auth.uid())
  with check (eleve_id = auth.uid());

drop policy if exists aletheia_capstone_prof_all on aletheia_capstone;
create policy aletheia_capstone_prof_all on aletheia_capstone
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists aletheia_capstone_eleve_own on aletheia_capstone;
create policy aletheia_capstone_eleve_own on aletheia_capstone
  for all
  using (eleve_id = auth.uid())
  with check (eleve_id = auth.uid());

commit;
