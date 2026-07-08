-- ============================================================================
-- FONDATION PARCOURS — Phase A (additive, NON-CASSANTE). Fichier : parcours_phase_a.sql
-- ----------------------------------------------------------------------------
-- Lot 1 de la refonte Scriptorium → Parcours (cf. SPEC_parcours_scriptorium.md §4).
-- N'altère RIEN de destructif : ajoute les tables neuves de la bibliothèque de
-- contenus réutilisables (Textes/Cours), du conteneur Parcours, des créneaux
-- hebdomadaires (arc-exclusif contenu|livre) et de l'assignation par classe.
-- Les tables existantes (scriptorium_unites/documents, aletheia_*, quazian_*)
-- restent intactes et continuent de fonctionner.
--
-- Idempotence : les `create table if not exists` et `drop policy if exists`
-- sont rejouables ; les contraintes ajoutées sur des tables PRÉEXISTANTES
-- (scriptorium_unites, scriptorium_contenu_images) sont protégées par des blocs
-- DO/EXCEPTION pour ne pas casser un second passage (on NE drope PAS la clé
-- unique (id,type) car une FK en dépend après le premier passage).
-- ============================================================================

begin;

-- 0. Garde de type DB pour l'arc polymorphe des créneaux (schema-S1) -----------
-- scriptorium_unites.id est déjà PK (donc unique) ; on ajoute une clé candidate
-- COMPOSITE (id, type) UNIQUEMENT pour servir de cible à la FK composite des
-- créneaux (Postgres exige que les colonnes référencées portent une contrainte
-- unique/PK). Redondante pour l'unicité, indispensable comme référence de FK.
do $$ begin
  alter table scriptorium_unites
    add constraint scriptorium_unites_id_type_uk unique (id, type);
exception
  when duplicate_table then null;   -- l'index unique existe déjà
  when duplicate_object then null;  -- la contrainte existe déjà
end $$;

-- 1. Bibliothèque de contenus réutilisables (Textes & Cours) ------------------
-- Item de PREMIÈRE CLASSE : AUCUN lien vers une unité, une semaine, ou une classe.
-- Ces dimensions sont portées par le créneau (parcours_creneaux) et par
-- l'assignation classe (parcours_classes). Discriminé par `type`.
create table if not exists scriptorium_contenus (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('texte', 'cours')),  -- extensible plus tard
  titre         text not null,
  auteur        text,                          -- surtout 'texte' ; souvent null pour 'cours'
  texte_extrait text,                          -- CORPS intégral consommé par les IA / futur RAG
  chapitres     text,                          -- métadonnée d'extrait (repris de scriptorium_documents)
  fichier_ref   text,                          -- fichier source facultatif (bucket 'scriptorium')
  tags          text[] not null default '{}',  -- optionnel (recherche/filtre)
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),  -- maj applicative (convention repo, pas de trigger)
  supprime_at   timestamptz                          -- SOFT-DELETE (jamais de DELETE dur)
);
create index if not exists idx_contenus_type    on scriptorium_contenus(type) where supprime_at is null;
create index if not exists idx_contenus_vivants on scriptorium_contenus(supprime_at);
-- Recherche plein-texte future (léger, non-RAG) : décommenter au besoin
-- create index if not exists idx_contenus_fts on scriptorium_contenus
--   using gin (to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(texte_extrait,'')));

-- 2. Extension arc-exclusif de scriptorium_contenu_images ---------------------
-- La table existe déjà (images filles de scriptorium_documents, document_id NOT NULL,
-- créée au Lot 6). On l'ouvre aux contenus de bibliothèque : document_id devient
-- nullable, on ajoute contenu_id nullable, et un CHECK impose EXACTEMENT une cible.
-- Les lignes existantes (document_id NOT NULL, contenu_id NULL) satisfont déjà le CHECK.
alter table scriptorium_contenu_images
  alter column document_id drop not null;
alter table scriptorium_contenu_images
  add column if not exists contenu_id uuid references scriptorium_contenus(id) on delete cascade;
do $$ begin
  alter table scriptorium_contenu_images
    add constraint scriptorium_contenu_images_cible_chk check (
      (document_id is not null and contenu_id is null)
      or (document_id is null and contenu_id is not null)
    );
exception
  when duplicate_object then null;  -- la contrainte existe déjà
end $$;
create index if not exists idx_contenu_images_contenu on scriptorium_contenu_images(contenu_id)
  where contenu_id is not null;

-- 3. Parcours = gabarit d'orchestration hebdomadaire --------------------------
-- Temporellement NEUTRE : numérote ses semaines 1..nb_semaines. La traduction en
-- dates réelles se fait par classe, à la lecture, via la frise (SPEC §5).
create table if not exists scriptorium_parcours (
  id          uuid primary key default gen_random_uuid(),
  titre       text not null,
  description text,
  auteur      text,
  nb_semaines integer not null check (nb_semaines between 1 and 52),
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  supprime_at timestamptz
);
create index if not exists idx_parcours_vivants on scriptorium_parcours(supprime_at);

-- 4. Créneau hebdo — jointure polymorphe en ARC EXCLUSIF ----------------------
-- 1 ligne = 1 contenu (texte/cours de bibliothèque) OU 1 livre (entier/tranche),
-- posé dans une semaine, à une position `ordre`. Plusieurs créneaux par semaine.
create table if not exists scriptorium_parcours_creneaux (
  id            uuid primary key default gen_random_uuid(),
  parcours_id   uuid not null references scriptorium_parcours(id) on delete cascade,
  semaine       integer not null check (semaine >= 1),  -- semaine RELATIVE (1..nb_semaines)
  ordre         integer not null,                       -- position intra-semaine (toujours fournie par l'action, §7.6)

  ref_type      text not null check (ref_type in ('contenu', 'livre')),  -- cible de stockage

  -- Cible A : contenu de bibliothèque (texte OU cours).
  -- RESTRICT = garde-fou de dernier recours ; en usage NORMAL il ne se déclenche
  -- JAMAIS (les contenus sont soft-deletés, jamais DELETE dur). La vraie protection
  -- des parcours tiers est le NON-PURGE des créneaux au soft-delete (schema-S7, §7.2).
  contenu_id    uuid references scriptorium_contenus(id) on delete restrict,

  -- Cible B : livre (scriptorium_unites type='livre'), entier ou en tranche.
  livre_id            uuid references scriptorium_unites(id) on delete restrict,
  livre_semaine_debut integer,   -- index de semaine du livre (aligné sur scriptorium_documents.semaine)
  livre_semaine_fin   integer,   -- borne INCLUSE ; (null,null) = livre ENTIER

  -- schema-S1 : constante générée servant UNIQUEMENT de garde de type via FK composite.
  -- Non nullable par construction. Sous MATCH SIMPLE (défaut), la FK composite
  -- (livre_id, livre_type) n'est vérifiée QUE si livre_id est non null (créneau 'livre') ;
  -- pour un créneau 'contenu' (livre_id null), la FK est ignorée. Résultat : tout
  -- créneau 'livre' est GARANTI pointer une ligne scriptorium_unites de type='livre'.
  livre_type    text generated always as ('livre') stored,

  titre_affiche text,            -- override d'affichage propre au créneau
  note          text,            -- consigne facultative du prof
  created_at    timestamptz not null default now(),

  -- Arc exclusif : exactement une cible selon ref_type.
  constraint parcours_creneaux_cible_chk check (
    (ref_type = 'contenu' and contenu_id is not null and livre_id is null)
    or (ref_type = 'livre' and livre_id   is not null and contenu_id is null)
  ),
  -- Les bornes de tranche n'existent que pour une cible livre.
  constraint parcours_creneaux_tranche_scope_chk check (
    ref_type = 'livre' or (livre_semaine_debut is null and livre_semaine_fin is null)
  ),
  -- Tranche cohérente (début ≤ fin) si les deux bornes sont posées.
  constraint parcours_creneaux_tranche_ordre_chk check (
    livre_semaine_debut is null or livre_semaine_fin is null
    or livre_semaine_debut <= livre_semaine_fin
  ),
  -- schema-S1 : garde de type DB sur le bras 'livre'.
  constraint parcours_creneaux_livre_type_fk
    foreign key (livre_id, livre_type)
    references scriptorium_unites(id, type) on delete restrict,
  -- schema-S9 : unicité de l'ordre intra-semaine (empêche les doublons de course).
  constraint parcours_creneaux_ordre_uk unique (parcours_id, semaine, ordre)
);
create index if not exists idx_parcours_creneaux_parcours on scriptorium_parcours_creneaux(parcours_id, semaine, ordre);
create index if not exists idx_parcours_creneaux_contenu  on scriptorium_parcours_creneaux(contenu_id) where contenu_id is not null;
create index if not exists idx_parcours_creneaux_livre    on scriptorium_parcours_creneaux(livre_id)   where livre_id   is not null;

-- 5. Assignation par classe — la date de début vit ICI -----------------------
-- Classe A démarre le 08/09, classe B le 22/09 : deux lignes, deux date_debut,
-- même parcours_id. date_debut nullable = « assigné, pas encore daté » (UX toggle).
create table if not exists scriptorium_parcours_classes (
  id          uuid primary key default gen_random_uuid(),
  parcours_id uuid not null references scriptorium_parcours(id) on delete cascade,
  classe_id   uuid not null references classes(id) on delete cascade,
  date_debut  date,                                  -- DATE PURE (régime UTC : T00:00:00Z, getters UTC)
  statut      text not null default 'active' check (statut in ('active', 'archivee')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (parcours_id, classe_id)
  -- schema-S4 (différé) : emplacement réservé pour un futur SNAPSHOT d'horaire
  -- (horaire_snapshot jsonb, snapshot_version int, snapshot_genere_le timestamptz) —
  -- NON créé ici (voir SPEC §4.5). La fondation recalcule l'aperçu depuis la frise.
);
create index if not exists idx_parcours_classes_parcours on scriptorium_parcours_classes(parcours_id);
create index if not exists idx_parcours_classes_classe   on scriptorium_parcours_classes(classe_id);

-- 6. RLS — authoring PROF-ONLY (Scriptorium reste masqué côté élève) ----------
-- Lecture élève préparée mais NON activée (viendra via client admin + garde
-- applicative filtrant texte_extrait, cf. SPEC §4.2). scriptorium_contenu_images
-- a déjà sa RLS prof-all (Lot 6) — elle couvre aussi le nouveau chemin contenu_id.
alter table scriptorium_contenus          enable row level security;
alter table scriptorium_parcours          enable row level security;
alter table scriptorium_parcours_creneaux enable row level security;
alter table scriptorium_parcours_classes  enable row level security;

drop policy if exists contenus_prof_all on scriptorium_contenus;
create policy contenus_prof_all on scriptorium_contenus
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists parcours_prof_all on scriptorium_parcours;
create policy parcours_prof_all on scriptorium_parcours
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists parcours_creneaux_prof_all on scriptorium_parcours_creneaux;
create policy parcours_creneaux_prof_all on scriptorium_parcours_creneaux
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists parcours_classes_prof_all on scriptorium_parcours_classes;
create policy parcours_classes_prof_all on scriptorium_parcours_classes
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;
