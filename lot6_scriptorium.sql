-- ============================================================================
-- Lot 6 — Scriptorium (côté prof)
-- ----------------------------------------------------------------------------
-- Le contenu Scriptorium devient un « item » assignable à PLUSIEURS classes,
-- organisé par SEMAINE au sein d'une unité, avec un corps texte et/ou images.
--
-- Évolution ADDITIVE (cf. décision Lot 6) : `scriptorium_unites` (FK Codex) et
-- `scriptorium_documents` (Quazian lit `texte_extrait` par unité) restent en
-- place et continuent de fonctionner. Le rebranchement de Quazian « par
-- semaine » se fera au Lot 7.
--
-- Le détachement à l'effacement de classe (Lot 2) est obtenu « par ID » : la
-- table de liaison porte un `on delete cascade` sur classe_id → effacer une
-- classe retire ses liaisons (le contenu survit), sans toucher `effacer_classe`.
-- ============================================================================

begin;

-- ── 1. Le « document » devient un item de contenu ───────────────────────────
-- semaine = la notion « semaine N » partagée (Scriptorium / Fragments / Quazian).
alter table scriptorium_documents
  add column if not exists semaine integer;

-- Texte collable directement + items « image seule » → fichier facultatif.
alter table scriptorium_documents
  alter column fichier_ref drop not null;

-- Légende / description optionnelle (utile à l'affichage et à Quazian).
alter table scriptorium_documents
  add column if not exists legende text;

-- ── 2. Assignation multi-classes par ID ─────────────────────────────────────
create table if not exists scriptorium_document_classes (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references scriptorium_documents(id) on delete cascade,
  classe_id   uuid not null references classes(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (document_id, classe_id)
);
create index if not exists idx_scriptorium_doc_classes_doc    on scriptorium_document_classes(document_id);
create index if not exists idx_scriptorium_doc_classes_classe on scriptorium_document_classes(classe_id);

-- Backfill : reprendre l'assignation actuelle (classe portée par l'unité, Lot 1).
-- (a) via la FK classe_id si elle est renseignée.
insert into scriptorium_document_classes (document_id, classe_id)
select d.id, u.classe_id
  from scriptorium_documents d
  join scriptorium_unites u on u.id = d.unite_id
 where u.classe_id is not null
on conflict do nothing;

-- (b) migration du lien legacy : Lot 1 avait gardé `classe` (texte) « le temps
-- que le Lot 6 migre proprement le lien ». On le résout par correspondance de
-- nom (insensible à la casse/espaces). Les non-résolus (typo, classe effacée)
-- apparaîtront dans le groupe « Sans classe » de la vue par unité, à réassigner.
insert into scriptorium_document_classes (document_id, classe_id)
select d.id, c.id
  from scriptorium_documents d
  join scriptorium_unites u on u.id = d.unite_id
  join classes c on lower(btrim(c.nom)) = lower(btrim(u.classe))
 where u.classe_id is null and u.classe is not null
on conflict do nothing;

-- ── 3. Images d'un contenu (fichier + légende), enfant du document ──────────
create table if not exists scriptorium_contenu_images (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references scriptorium_documents(id) on delete cascade,
  fichier_ref text not null,
  legende     text,
  ordre       integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_scriptorium_contenu_images_doc on scriptorium_contenu_images(document_id);

-- ── 4. RLS (prof seul ; Scriptorium reste masqué côté élève) ────────────────
alter table scriptorium_document_classes enable row level security;
alter table scriptorium_contenu_images   enable row level security;

drop policy if exists scriptorium_doc_classes_prof_all on scriptorium_document_classes;
create policy scriptorium_doc_classes_prof_all on scriptorium_document_classes
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists scriptorium_contenu_images_prof_all on scriptorium_contenu_images;
create policy scriptorium_contenu_images_prof_all on scriptorium_contenu_images
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;
