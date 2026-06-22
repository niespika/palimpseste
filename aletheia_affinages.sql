-- ============================================================================
-- Aletheia — Affinages (SPEC_Aletheia_Affinages.md)
-- ----------------------------------------------------------------------------
-- Passe d'affinage CASSANTE sur le module Aletheia (lots 1→6 déjà livrés).
-- Décision produit : migration PROPRE, sans backfill (les élèves n'ont pas encore
-- commencé — go-live semaine du 27/06). On vide aletheia_travaux et on recrée
-- aletheia_capstone au niveau LIVRE.
--
-- Quatre blocs :
--   1. aletheia_travaux : saisie 5 champs V1 (these/arguments/accord/questions/
--      vocabulaire) + 3 champs VF (these_vf/arguments_vf/accord_vf) ; deux retours
--      json (retour_v1 / retour_vf) ; retour_vf_lu_at (gate de clôture inchangé).
--   2. aletheia_capstone : recréée — UNE ligne PAR LIVRE (clé scriptorium_livre_id),
--      partagée, plus de capstone par élève. Lecture via client admin + garde code.
--   3. quazian_flashcards.source : on élargit la contrainte CHECK pour 'aletheia'
--      (les définitions du retour V1 deviennent des cartes personnelles Quazian).
--   4. aletheia_params : inchangée (prompts feedback_1/feedback_2/capstone +
--      toggles). Les défauts vivent dans le code (utils/aletheia-retours.ts).
--
-- ⚠️ COUPLAGE CODE ↔ MIGRATION : à exécuter AVEC le déploiement de cette branche.
--   Le code lit/écrit les nouvelles colonnes et aletheia_capstone book-level.
-- ============================================================================

begin;

-- ── 1. aletheia_travaux : saisie 5 champs + 3 champs VF + 2 retours ──────────
-- Migration propre : aucune donnée à préserver → on vide la table.
truncate table aletheia_travaux;

alter table aletheia_travaux
  drop column if exists resume_initial,
  drop column if exists resume_vf,
  drop column if exists retour_1,
  drop column if exists retour_2,
  drop column if exists retour_2_lu_at,
  drop column if exists retour_1_erreur_at,
  drop column if exists retour_2_erreur_at;

alter table aletheia_travaux
  add column if not exists these               text,
  add column if not exists arguments           text,
  add column if not exists accord              text,
  -- `questions` (text[]) existe déjà (lot 2) ; on garde.
  add column if not exists vocabulaire         text[] not null default '{}',
  add column if not exists these_vf            text,
  add column if not exists arguments_vf        text,
  add column if not exists accord_vf           text,
  add column if not exists retour_v1           jsonb,
  add column if not exists retour_vf           jsonb,
  add column if not exists retour_vf_lu_at     timestamptz,
  add column if not exists retour_v1_erreur_at timestamptz,
  add column if not exists retour_vf_erreur_at timestamptz;
-- `devoilement` (jsonb) conservé : sert la continuité du retour VF (architectures
-- précédentes). Le capstone ne s'en sert plus (devenu canonique book-level).
-- `statut` (DRAFT/V1_SUBMITTED/FEEDBACK1_READY/VF_SUBMITTED/FEEDBACK2_READY/DONE)
-- conservé tel quel : les noms restent internes (V1 = 5 champs, VF = 3 champs).

-- ── 2. aletheia_capstone : carte UNIQUE par livre (partagée) ─────────────────
-- Plus de capstone par élève. Clé = scriptorium_livre_id. Servie à tous les
-- élèves du livre (garde d'accès dans le code) et visible côté prof.
drop table if exists aletheia_capstone cascade;
create table aletheia_capstone (
  id                   uuid primary key default gen_random_uuid(),
  scriptorium_livre_id uuid not null references scriptorium_unites(id) on delete cascade,
  statut               text not null default 'PENDING' check (statut in ('PENDING','READY','ERROR')),
  contenu              jsonb,
  erreur_at            timestamptz,
  created_at           timestamptz not null default now(),
  unique (scriptorium_livre_id)
);
create index if not exists idx_aletheia_capstone_livre on aletheia_capstone(scriptorium_livre_id);

alter table aletheia_capstone enable row level security;
-- Écritures/lectures côté élève via le client admin (service_role) qui IGNORE la
-- RLS ; la garde d'accès (livre assigné à la classe active + toutes semaines DONE)
-- est appliquée DANS le code. La politique prof autorise les lectures prof directes.
drop policy if exists aletheia_capstone_prof_all on aletheia_capstone;
create policy aletheia_capstone_prof_all on aletheia_capstone
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

-- ── 3. quazian_flashcards.source : autoriser 'aletheia' ─────────────────────
-- Les définitions du vocabulaire (retour V1) créent des cartes PERSONNELLES
-- Quazian (eleve_id renseigné, exclues des quizz, ancrées sur le livre). On
-- élargit la contrainte CHECK (même mécanique que codex_schema.sql pour 'codex').
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'quazian_flashcards'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%source%'
  loop
    execute format('alter table quazian_flashcards drop constraint %I', c);
  end loop;
end $$;

alter table quazian_flashcards
  add constraint quazian_flashcards_source_check
  check (source in ('ia', 'prof', 'fragment', 'codex', 'aletheia'));

commit;
