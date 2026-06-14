-- ============================================================================
-- Module CODEX — schéma complet (à exécuter une fois dans Supabase SQL Editor)
-- ----------------------------------------------------------------------------
-- Codex : synthèse de consolidation. Séance live en deux versions manuscrites
-- (V1 + V-finale), retour critique validé par le prof, trace durable et cartes
-- automatiques injectées dans le FSRS de Quazian.
--
-- Conventions reprises de Quazian / Scriptorium :
--   * préfixe `codex_`
--   * `classe_id` = texte (libellé de classe, comme quazian_quizzes)
--   * RLS : l'élève ne voit que SON travail ; le prof voit tout
--   * les écritures IA passent par le client service_role (bypass RLS)
-- ============================================================================

-- ── 1. Enregistrement du module ────────────────────────────────────────────
insert into modules (slug, nom, description, actif)
values (
  'codex',
  'Codex',
  'Synthèse de consolidation : écrire de mémoire le récapitulatif d''une unité, recevoir un retour critique adossé au cours, repartir avec une synthèse complète.',
  false
)
on conflict (slug) do nothing;

-- ── 2. Bucket de stockage (photos manuscrites V1 + V-finale) ───────────────
insert into storage.buckets (id, name, public)
values ('codex', 'codex', false)
on conflict (id) do nothing;

-- ── 3. Tables ──────────────────────────────────────────────────────────────

-- 3.1 Séance (classe × unité)
create table if not exists codex_sessions (
  id uuid primary key default gen_random_uuid(),
  classe_id text,
  scriptorium_unite_id uuid not null references scriptorium_unites(id) on delete cascade,
  statut text not null default 'brouillon'
    check (statut in ('brouillon', 'phase_1', 'phase_2', 'fermee')),
  duree_phase_min int not null default 25,
  -- horodatages de pilotage live
  lance_at timestamptz,                 -- passage en phase_1
  phase_2_at timestamptz,               -- passage en phase_2
  ferme_at timestamptz,                 -- fermeture
  phase_courante_fin_at timestamptz,    -- fin du chrono de la phase courante (now + duree)
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_codex_sessions_unite on codex_sessions(scriptorium_unite_id);
create index if not exists idx_codex_sessions_statut on codex_sessions(statut);

-- 3.2 Travail d'un élève dans une séance
create table if not exists codex_travaux (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references codex_sessions(id) on delete cascade,
  eleve_id uuid not null references profiles(id) on delete cascade,

  -- Phase 1 — V1 (livre fermé, manuscrit)
  photos_v1 text[] not null default '{}',
  texte_v1_ocr text,
  ocr_confiance_v1 numeric,
  suggestions_v1 jsonb,                 -- { oublis: [...], erreurs: [...], ortho: [...] }
  analyse_v1_statut text not null default 'vide'
    check (analyse_v1_statut in ('vide', 'en_cours', 'prete', 'erreur')),

  -- Phase 2 — V-finale
  photos_vf text[] not null default '{}',
  texte_vf_ocr text,
  ocr_confiance_vf numeric,
  retour_critique jsonb,                -- écran 1 : erreurs+corrections, suivi suggestions, etc.
  synthese_completee text,             -- écran 2 : synthèse avec ajouts IA marqués
  analyse_vf_statut text not null default 'vide'
    check (analyse_vf_statut in ('vide', 'en_cours', 'prete', 'erreur')),

  -- Validation prof (uniquement le retour critique de la V-finale)
  statut_validation text not null default 'en_attente'
    check (statut_validation in ('en_attente', 'valide')),
  valide_par uuid references profiles(id),
  valide_at timestamptz,

  cout_api numeric,
  created_at timestamptz not null default now(),
  unique (session_id, eleve_id)
);

create index if not exists idx_codex_travaux_session on codex_travaux(session_id);
create index if not exists idx_codex_travaux_eleve on codex_travaux(eleve_id);

-- 3.3 Erreurs corrigées (trace, dédup, cartes, signaux Profil élève)
create table if not exists codex_erreurs (
  id uuid primary key default gen_random_uuid(),
  travail_id uuid not null references codex_travaux(id) on delete cascade,
  eleve_id uuid not null references profiles(id) on delete cascade,
  concept_tag text,
  description text not null,            -- l'erreur / l'oubli
  correction text not null,            -- la bonne version (validée, adossée au Scriptorium)
  importance int not null default 1,   -- 1..3, sélectionne les cartes promues
  est_recurrente boolean not null default false,
  flashcard_id uuid references quazian_flashcards(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_codex_erreurs_eleve on codex_erreurs(eleve_id);
create index if not exists idx_codex_erreurs_tag on codex_erreurs(eleve_id, concept_tag);

-- 3.4 Paramètres du module (ligne unique id=1, modifiable par le prof)
create table if not exists codex_params (
  id int primary key default 1,
  duree_phase_min int not null default 25,
  plafond_oublis int not null default 3,
  plafond_erreurs int not null default 5,
  seuil_ocr_ortho numeric not null default 0.6,  -- sous ce seuil, ortho non évaluée
  cap_cartes int not null default 3,
  prompt_suggestions_v1 text,
  prompt_retour_vf text,
  constraint codex_params_singleton check (id = 1)
);

insert into codex_params (id) values (1) on conflict (id) do nothing;

-- ── 4. RLS ──────────────────────────────────────────────────────────────────
alter table codex_sessions enable row level security;
alter table codex_travaux  enable row level security;
alter table codex_erreurs  enable row level security;
alter table codex_params   enable row level security;

-- Helper inline : l'utilisateur courant est prof
-- (répété dans chaque policy pour rester sans dépendance à une fonction)

-- 4.1 codex_sessions : prof = tout ; élève = lecture seule (pour connaître l'état)
drop policy if exists codex_sessions_prof_all on codex_sessions;
create policy codex_sessions_prof_all on codex_sessions
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists codex_sessions_eleve_read on codex_sessions;
create policy codex_sessions_eleve_read on codex_sessions
  for select
  using (auth.uid() is not null);

-- 4.2 codex_travaux : prof = tout ; élève = son seul travail (CRUD)
drop policy if exists codex_travaux_prof_all on codex_travaux;
create policy codex_travaux_prof_all on codex_travaux
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists codex_travaux_eleve_own on codex_travaux;
create policy codex_travaux_eleve_own on codex_travaux
  for all
  using (eleve_id = auth.uid())
  with check (eleve_id = auth.uid());

-- 4.3 codex_erreurs : prof = tout ; élève = ses propres erreurs (lecture)
drop policy if exists codex_erreurs_prof_all on codex_erreurs;
create policy codex_erreurs_prof_all on codex_erreurs
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists codex_erreurs_eleve_read on codex_erreurs;
create policy codex_erreurs_eleve_read on codex_erreurs
  for select
  using (eleve_id = auth.uid());

-- 4.4 codex_params : prof seulement
drop policy if exists codex_params_prof_all on codex_params;
create policy codex_params_prof_all on codex_params
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

-- ============================================================================
-- Fin du schéma Codex.
-- Les écritures IA (suggestions V1, retour critique, synthèse, cartes) se font
-- via le client service_role côté serveur et contournent donc la RLS.
-- ============================================================================
