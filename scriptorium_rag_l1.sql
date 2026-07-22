-- ============================================================================
-- SCRIPTORIUM RAG — Lot L1 : Fondation instances (additive, NON-CASSANTE).
-- Fichier : scriptorium_rag_l1.sql — cf. SPEC_scriptorium_rag.md §4 (DDL §4.2,
-- migration §4.4) et §8.3 (colonnes rag_* de scriptorium_params).
-- ----------------------------------------------------------------------------
-- Le Parcours adopte le patron modèle → instance par classe (celui des plans
-- d'évaluation) : l'assignation d'un parcours à une classe MATÉRIALISE une
-- instance (créneaux copiés du modèle + éléments à grain fin), qui diverge
-- ensuite librement. Ce fichier :
--   A. crée les sections de contenu (structure déclarée à l'import — remplies au L2) ;
--   B. crée les créneaux d'INSTANCE (mêmes gardes que le modèle) ;
--   C. crée les éléments d'instance (le grain fin + LE « vu » du prof) ;
--   D. pose la RLS prof-only sur les trois tables ;
--   E. ajoute les colonnes rag_* de scriptorium_params (gate OFF par défaut) ;
--   F. migre les assignations EXISTANTES (one-shot idempotent, copie conforme).
--
-- ORDRE DE DÉPLOIEMENT : jouer ce fichier JUSTE APRÈS le deploy du code L1
-- (l'action assignerParcoursClasse matérialise les assignations NOUVELLES ;
-- la section F rattrape toutes les assignations antérieures). Rejouable sans
-- danger pendant la fenêtre de déploiement : F ne matérialise que les
-- instances VIDES. Ce n'est PAS un outil de re-matérialisation générale —
-- c'est reinitialiserInstance (action, destructive, double confirmation).
--
-- Idempotence : create table/index if not exists, add column if not exists,
-- drop policy if exists, inserts gardés par not exists. Aucune donnée détruite.
-- Prérequis : parcours_phase_a.sql (tables parcours + clé composite
-- scriptorium_unites(id, type)), plan_evaluation_phase_a.sql (scriptorium_params).
-- ============================================================================

begin;

-- ── A. Sections d'un contenu de bibliothèque ─────────────────────────────────
-- Structure déclarée à l'import d'un cours (éditeur au Lot L2), PARTAGÉE entre
-- les parcours (c'est une propriété du contenu, pas d'une instance). niveau :
-- 1 = chapitre, 2 = sous-chapitre. `texte` = corps de la section (le corpus RAG
-- lit ici plutôt que texte_extrait entier quand le cours est découpé).
create table if not exists scriptorium_contenu_sections (
  id          uuid primary key default gen_random_uuid(),
  contenu_id  uuid not null references scriptorium_contenus(id) on delete cascade,
  ordre       integer not null,
  niveau      integer not null default 1 check (niveau in (1, 2)),  -- 1 = chapitre, 2 = sous-chapitre
  titre       text not null,
  texte       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (contenu_id, ordre)
);
create index if not exists idx_contenu_sections_contenu on scriptorium_contenu_sections(contenu_id);

-- ── B. Créneaux d'INSTANCE ───────────────────────────────────────────────────
-- Copiés du modèle à l'assignation, divergence libre PAR CLASSE ensuite.
-- Mêmes gardes que scriptorium_parcours_creneaux : arc exclusif contenu|livre,
-- FK composite de type livre (schema-S1), unicité d'ordre intra-semaine
-- (schema-S9). `modele_creneau_id` = provenance INFORMATIVE (porte « modèle
-- vivant » future) — set null si le créneau modèle disparaît, l'instance survit.
create table if not exists scriptorium_parcours_classe_creneaux (
  id                  uuid primary key default gen_random_uuid(),
  parcours_classe_id  uuid not null references scriptorium_parcours_classes(id) on delete cascade,
  semaine             integer not null check (semaine >= 1),
  ordre               integer not null,
  ref_type            text not null check (ref_type in ('contenu', 'livre')),
  contenu_id          uuid references scriptorium_contenus(id) on delete restrict,
  livre_id            uuid references scriptorium_unites(id) on delete restrict,
  livre_semaine_debut integer,   -- borne de tranche = ORDINAL DE SÉANCE (héritage « semaine »)
  livre_semaine_fin   integer,   -- borne INCLUSE ; (null,null) = livre ENTIER
  livre_type          text generated always as ('livre') stored,
  titre_affiche       text,
  note                text,
  modele_creneau_id   uuid references scriptorium_parcours_creneaux(id) on delete set null, -- provenance (informatif)
  created_at          timestamptz not null default now(),
  constraint pcc_cible_chk check (
    (ref_type = 'contenu' and contenu_id is not null and livre_id is null)
    or (ref_type = 'livre' and livre_id is not null and contenu_id is null)
  ),
  constraint pcc_tranche_scope_chk check (
    ref_type = 'livre' or (livre_semaine_debut is null and livre_semaine_fin is null)
  ),
  constraint pcc_tranche_ordre_chk check (
    livre_semaine_debut is null or livre_semaine_fin is null
    or livre_semaine_debut <= livre_semaine_fin
  ),
  constraint pcc_livre_type_fk foreign key (livre_id, livre_type)
    references scriptorium_unites(id, type) on delete restrict,
  constraint pcc_ordre_uk unique (parcours_classe_id, semaine, ordre)
);
create index if not exists idx_pcc_pc      on scriptorium_parcours_classe_creneaux(parcours_classe_id, semaine, ordre);
create index if not exists idx_pcc_contenu on scriptorium_parcours_classe_creneaux(contenu_id) where contenu_id is not null;
create index if not exists idx_pcc_livre   on scriptorium_parcours_classe_creneaux(livre_id)   where livre_id   is not null;

-- ── C. Éléments d'instance : le grain fin + LE « VU » ────────────────────────
-- Un élément = une section de cours, OU le contenu entier de son créneau
-- (texte, ou cours non découpé), OU une séance de livre. `semaine` = semaine de
-- parcours où VIT l'élément (défaut : celle du créneau ; déplaçable par classe
-- au L3). `vu_at` = le clic prof (null = pas encore vu). Les trois statuts RAG
-- en dérivent : vu (vu_at non null) / en cours (null, semaine ≤ courante) /
-- à venir (semaine future — titre seul au corpus).
create table if not exists scriptorium_parcours_classe_elements (
  id            uuid primary key default gen_random_uuid(),
  creneau_id    uuid not null references scriptorium_parcours_classe_creneaux(id) on delete cascade,
  ref_type      text not null check (ref_type in ('contenu', 'section', 'livre_semaine')),
  section_id    uuid references scriptorium_contenu_sections(id) on delete restrict,
  livre_semaine integer,                 -- ordinal d'ORIGINE (scriptorium_documents.semaine)
  semaine       integer not null check (semaine >= 1),  -- semaine de parcours où vit l'élément
  ordre         integer not null,
  vu_at         timestamptz,             -- LE clic prof ; null = pas (encore) vu
  vu_par        uuid references profiles(id),
  created_at    timestamptz not null default now(),
  constraint pce_cible_chk check (
    (ref_type = 'contenu'          and section_id is null     and livre_semaine is null)
    or (ref_type = 'section'       and section_id is not null and livre_semaine is null)
    or (ref_type = 'livre_semaine' and section_id is null     and livre_semaine is not null)
  ),
  constraint pce_ordre_uk unique (creneau_id, semaine, ordre)
);
create index if not exists idx_pce_creneau on scriptorium_parcours_classe_elements(creneau_id);
create index if not exists idx_pce_section on scriptorium_parcours_classe_elements(section_id) where section_id is not null;

-- ── D. RLS — prof-only sur les trois tables ──────────────────────────────────
-- La lecture ÉLÈVE passe EXCLUSIVEMENT par le client admin + garde applicative
-- de l'assembleur de corpus (SPEC §6) — AUCUNE policy élève : c'est la première
-- ligne de l'anti-spoiler (le contenu des semaines à venir ne sort jamais).
alter table scriptorium_contenu_sections          enable row level security;
alter table scriptorium_parcours_classe_creneaux  enable row level security;
alter table scriptorium_parcours_classe_elements  enable row level security;

drop policy if exists contenu_sections_prof_all on scriptorium_contenu_sections;
create policy contenu_sections_prof_all on scriptorium_contenu_sections
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists pcc_prof_all on scriptorium_parcours_classe_creneaux;
create policy pcc_prof_all on scriptorium_parcours_classe_creneaux
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists pce_prof_all on scriptorium_parcours_classe_elements;
create policy pce_prof_all on scriptorium_parcours_classe_elements
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

-- ── E. scriptorium_params — réglages RAG (SPEC §8.3) ─────────────────────────
-- GATE global OFF par défaut : tout le chantier reste dormant jusqu'au flip
-- (décision PO après calibration L8). Modèles par réglage (bascule sans deploy).
alter table scriptorium_params
  add column if not exists rag_actif            boolean not null default false,   -- GATE global
  add column if not exists rag_modele           text    not null default 'gemini-3.5-flash-lite',
  add column if not exists rag_modele_synthese  text    not null default 'claude-sonnet-4-6',
  add column if not exists rag_quota_jour       integer not null default 40,
  add column if not exists rag_prompt           text,             -- override prof du prompt chat
  add column if not exists rag_prompt_synthese  text;             -- override prof du prompt synthèse

-- ── F. Migration one-shot des assignations existantes (SPEC §4.4) ────────────
-- Pour chaque ligne VIVANTE de scriptorium_parcours_classes (statut 'active',
-- parcours non soft-deleté) : matérialiser l'instance = copie conforme.
-- Idempotence : ne matérialise que si l'instance est VIDE (not exists créneaux)
-- — les assignations passées par la nouvelle action assignerParcoursClasse ne
-- sont donc jamais retouchées. Les créneaux pointant un contenu/livre
-- soft-deleté sont copiés TELS QUELS (badge « retiré » à l'affichage).
--
-- ╔══ DRY-RUN OBLIGATOIRE (à jouer AVANT, résultats à noter) ═════════════════╗
-- ║ -- (1) Assignations à matérialiser (attendu : toutes les actives vivantes
-- ║ --     à instance vide) :
-- ║ select count(*) as assignations_a_materialiser
-- ║ from scriptorium_parcours_classes pc
-- ║ join scriptorium_parcours p on p.id = pc.parcours_id and p.supprime_at is null
-- ║ where pc.statut = 'active'
-- ║   and not exists (select 1 from scriptorium_parcours_classe_creneaux e
-- ║                   where e.parcours_classe_id = pc.id);
-- ║
-- ║ -- (2) Créneaux à copier (attendu = Σ nb créneaux modèle × nb assignations) :
-- ║ select count(*) as creneaux_a_copier
-- ║ from scriptorium_parcours_classes pc
-- ║ join scriptorium_parcours p on p.id = pc.parcours_id and p.supprime_at is null
-- ║ join scriptorium_parcours_creneaux cr on cr.parcours_id = pc.parcours_id
-- ║ where pc.statut = 'active'
-- ║   and not exists (select 1 from scriptorium_parcours_classe_creneaux e
-- ║                   where e.parcours_classe_id = pc.id);
-- ║
-- ║ -- (3) Éléments attendus : 1 par créneau-contenu + largeur de tranche résolue
-- ║ --     par créneau-livre (bornes null → min/max des séances-docs du livre) :
-- ║ with docs as (
-- ║   select unite_id, min(semaine) as mn, max(semaine) as mx
-- ║   from scriptorium_documents where semaine is not null group by unite_id
-- ║ )
-- ║ select
-- ║   count(*) filter (where cr.ref_type = 'contenu') as elements_contenu,
-- ║   coalesce(sum(
-- ║     case when cr.ref_type = 'livre'
-- ║            and coalesce(cr.livre_semaine_debut, d.mn) is not null
-- ║            and coalesce(cr.livre_semaine_fin,   d.mx) is not null
-- ║       then greatest(0, coalesce(cr.livre_semaine_fin, d.mx)
-- ║                      - coalesce(cr.livre_semaine_debut, d.mn) + 1)
-- ║       else 0 end), 0) as elements_livre
-- ║ from scriptorium_parcours_classes pc
-- ║ join scriptorium_parcours p on p.id = pc.parcours_id and p.supprime_at is null
-- ║ join scriptorium_parcours_creneaux cr on cr.parcours_id = pc.parcours_id
-- ║ left join docs d on d.unite_id = cr.livre_id
-- ║ where pc.statut = 'active'
-- ║   and not exists (select 1 from scriptorium_parcours_classe_creneaux e
-- ║                   where e.parcours_classe_id = pc.id);
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- F.1 — Copie 1:1 des créneaux du modèle (semaine/ordre/ref/tranche/titre/note,
-- provenance renseignée). livre_type est une colonne générée → non insérée.
insert into scriptorium_parcours_classe_creneaux
  (parcours_classe_id, semaine, ordre, ref_type, contenu_id, livre_id,
   livre_semaine_debut, livre_semaine_fin, titre_affiche, note, modele_creneau_id)
select pc.id, cr.semaine, cr.ordre, cr.ref_type, cr.contenu_id, cr.livre_id,
       cr.livre_semaine_debut, cr.livre_semaine_fin, cr.titre_affiche, cr.note, cr.id
from scriptorium_parcours_classes pc
join scriptorium_parcours p on p.id = pc.parcours_id and p.supprime_at is null
join scriptorium_parcours_creneaux cr on cr.parcours_id = pc.parcours_id
where pc.statut = 'active'
  and not exists (
    select 1 from scriptorium_parcours_classe_creneaux e
    where e.parcours_classe_id = pc.id
  );

-- F.2 — Éléments des créneaux-CONTENU : 1 élément 'contenu' par créneau (aucune
-- section n'existe encore — l'éclatement par sections arrivera au L2 via la
-- re-découpe consciente). semaine = celle du créneau, ordre = 1. Garde
-- d'idempotence au grain créneau (not exists élément).
insert into scriptorium_parcours_classe_elements
  (creneau_id, ref_type, semaine, ordre)
select icc.id, 'contenu', icc.semaine, 1
from scriptorium_parcours_classe_creneaux icc
where icc.ref_type = 'contenu'
  and not exists (
    select 1 from scriptorium_parcours_classe_elements el
    where el.creneau_id = icc.id
  );

-- F.3 — Éléments des créneaux-LIVRE : 1 élément 'livre_semaine' par séance
-- k ∈ [a,b] (bornes explicites, ou entier = [min,max] des séances-docs du
-- livre), étalés semaine = S + (k − a) où S = semaine du créneau, CLAMPÉS à
-- nb_semaines (les excédents s'empilent sur la dernière semaine — l'avis prof
-- viendra avec la grille du L3). ordre = rang dans la semaine d'arrivée.
-- Un livre sans séance-doc et sans bornes explicites → aucun élément (skip).
with docs as (
  select unite_id, min(semaine) as mn, max(semaine) as mx
  from scriptorium_documents where semaine is not null group by unite_id
),
bornes as (
  select icc.id as creneau_id, icc.semaine as sem_creneau, p.nb_semaines,
         coalesce(icc.livre_semaine_debut, d.mn) as deb,
         coalesce(icc.livre_semaine_fin,   d.mx) as fin
  from scriptorium_parcours_classe_creneaux icc
  join scriptorium_parcours_classes pc on pc.id = icc.parcours_classe_id
  join scriptorium_parcours p on p.id = pc.parcours_id
  left join docs d on d.unite_id = icc.livre_id
  where icc.ref_type = 'livre'
    and not exists (
      select 1 from scriptorium_parcours_classe_elements el
      where el.creneau_id = icc.id
    )
)
insert into scriptorium_parcours_classe_elements
  (creneau_id, ref_type, livre_semaine, semaine, ordre)
select b.creneau_id, 'livre_semaine', k.seance,
       least(b.sem_creneau + (k.seance - b.deb), b.nb_semaines) as semaine,
       row_number() over (
         partition by b.creneau_id, least(b.sem_creneau + (k.seance - b.deb), b.nb_semaines)
         order by k.seance
       ) as ordre
from bornes b
cross join lateral generate_series(b.deb, b.fin) as k(seance)
where b.deb is not null and b.fin is not null and b.deb <= b.fin;

commit;

-- ╔══ VÉRIFICATION POST-MIGRATION (à jouer APRÈS, comparer au dry-run) ═══════╗
-- ║ -- (1) Créneaux d'instance par assignation = nb créneaux modèle :
-- ║ select pc.id, cl.nom as classe, p.titre as parcours,
-- ║        (select count(*) from scriptorium_parcours_creneaux m
-- ║         where m.parcours_id = pc.parcours_id) as creneaux_modele,
-- ║        (select count(*) from scriptorium_parcours_classe_creneaux i
-- ║         where i.parcours_classe_id = pc.id) as creneaux_instance
-- ║ from scriptorium_parcours_classes pc
-- ║ join scriptorium_parcours p on p.id = pc.parcours_id and p.supprime_at is null
-- ║ join classes cl on cl.id = pc.classe_id
-- ║ where pc.statut = 'active'
-- ║ order by p.titre, cl.nom;
-- ║
-- ║ -- (2) Livre par livre : nb éléments par créneau-livre = largeur de tranche :
-- ║ with docs as (
-- ║   select unite_id, min(semaine) as mn, max(semaine) as mx
-- ║   from scriptorium_documents where semaine is not null group by unite_id
-- ║ )
-- ║ select u.label as livre, icc.id as creneau_instance,
-- ║        coalesce(icc.livre_semaine_debut, d.mn) as deb,
-- ║        coalesce(icc.livre_semaine_fin,   d.mx) as fin,
-- ║        (select count(*) from scriptorium_parcours_classe_elements el
-- ║         where el.creneau_id = icc.id) as elements
-- ║ from scriptorium_parcours_classe_creneaux icc
-- ║ join scriptorium_unites u on u.id = icc.livre_id
-- ║ left join docs d on d.unite_id = icc.livre_id
-- ║ where icc.ref_type = 'livre'
-- ║ order by u.label;
-- ║
-- ║ -- (3) Aucun élément né « vu » :
-- ║ select count(*) as elements_vus_attendu_zero
-- ║ from scriptorium_parcours_classe_elements where vu_at is not null;
-- ╚═══════════════════════════════════════════════════════════════════════════╝
