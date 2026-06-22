-- ============================================================================
-- Aletheia — Carte d'architecture (prof) & diagnostic de compréhension
-- (SPEC_Aletheia_Carte_et_Diagnostic.md)
-- ----------------------------------------------------------------------------
-- À EXÉCUTER **APRÈS** `aletheia_affinages.sql` (dépend de la table
-- `aletheia_capstone` recréée book-level par la passe affinages).
--
-- Trois blocs :
--   1. `aletheia_capstone` : carte ÉDITABLE par le prof — `amende_par_prof`
--      (anti-écrasement par une régénération IA) + `updated_at`.
--   2. `aletheia_livre_reference` : référence par chapitre (thèse canonique +
--      arguments clés), 1 ligne/livre, socle stable du diagnostic. Prof-only.
--   3. `aletheia_diagnostic` : diagnostic de compréhension par travail, E→A sur
--      2 axes (thèse / arguments), V1 + VF (→ delta). **TABLE DÉDIÉE prof-only**
--      (PAS sur `aletheia_travaux` qui a une RLS `eleve_own` : l'élève pourrait
--      sinon lire son diagnostic via l'API — interdit par la spec). Jamais exposé.
-- ============================================================================

begin;

-- ── 1. Carte d'architecture éditable + anti-écrasement ──────────────────────
alter table aletheia_capstone
  add column if not exists amende_par_prof boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- ── 2. Référence par chapitre (socle du diagnostic) ─────────────────────────
-- contenu jsonb = [{ semaine, titre, these_canonique, arguments_cles[] }].
create table if not exists aletheia_livre_reference (
  id                   uuid primary key default gen_random_uuid(),
  scriptorium_livre_id uuid not null references scriptorium_unites(id) on delete cascade,
  statut               text not null default 'PENDING' check (statut in ('PENDING','READY','ERROR')),
  contenu              jsonb,
  erreur_at            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (scriptorium_livre_id)
);
create index if not exists idx_aletheia_livre_reference_livre on aletheia_livre_reference(scriptorium_livre_id);

alter table aletheia_livre_reference enable row level security;
-- Prof-only ; lecture/écriture serveur via le client admin (la référence n'est
-- jamais servie à l'élève — c'est un artefact interne d'ancrage du diagnostic).
drop policy if exists aletheia_livre_reference_prof_all on aletheia_livre_reference;
create policy aletheia_livre_reference_prof_all on aletheia_livre_reference
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

-- ── 3. Diagnostic de compréhension — PROF-ONLY (jamais montré à l'élève) ─────
-- Inventaire (anti-halo phase 1) + niveaux E→A 0-4 (phase 2) par axe, V1 et VF.
-- Les niveaux sont NULLABLES : « thèse mal définie » (chapitre non argumentatif)
-- → on ne force pas un niveau de thèse. Échelle calquée sur utils/notation.ts
-- (0=E … 4=A). Clé = un diagnostic par travail.
create table if not exists aletheia_diagnostic (
  id                   uuid primary key default gen_random_uuid(),
  travail_id           uuid not null references aletheia_travaux(id) on delete cascade,
  -- Dénormalisé pour requêtes prof (trajectoire par élève/livre) sans jointure.
  eleve_id             uuid not null references profiles(id) on delete cascade,
  scriptorium_livre_id uuid not null references scriptorium_unites(id) on delete cascade,
  semaine_index        integer not null,
  -- Diagnostic sur la V1 (compréhension AVANT aide).
  inventaire_v1        jsonb,
  niveau_these_v1      smallint check (niveau_these_v1 between 0 and 4),
  niveau_arguments_v1  smallint check (niveau_arguments_v1 between 0 and 4),
  these_mal_definie_v1 boolean,
  -- Diagnostic sur la VF (→ delta V1→VF = réponse au feedback).
  inventaire_vf        jsonb,
  niveau_these_vf      smallint check (niveau_these_vf between 0 and 4),
  niveau_arguments_vf  smallint check (niveau_arguments_vf between 0 and 4),
  these_mal_definie_vf boolean,
  erreur_at            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (travail_id)
);
create index if not exists idx_aletheia_diagnostic_eleve on aletheia_diagnostic(eleve_id);
create index if not exists idx_aletheia_diagnostic_livre on aletheia_diagnostic(scriptorium_livre_id);

alter table aletheia_diagnostic enable row level security;
-- PROF-ONLY : AUCUNE politique élève. Les écritures passent par le client admin
-- (service_role) côté serveur ; aucune lecture élève possible, même via l'API.
drop policy if exists aletheia_diagnostic_prof_all on aletheia_diagnostic;
create policy aletheia_diagnostic_prof_all on aletheia_diagnostic
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;
