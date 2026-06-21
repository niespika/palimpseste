-- ============================================================================
-- Aletheia — Lot 3 : prompt éditable du retour 1 (PromptConfig)
-- ----------------------------------------------------------------------------
-- Table de paramètres mono-ligne (modèle codex_params) : stocke l'OVERRIDE du
-- prompt édité par le prof. Le défaut vit dans le code (PROMPT_FEEDBACK_1_DEFAUT,
-- utils/aletheia-retours.ts) ; null = on utilise le défaut.
-- Les Lots 4-5 ajouteront prompt_feedback_2 / prompt_capstone à cette table.
--
-- ⚠️ COUPLAGE CODE ↔ MIGRATION : à exécuter avec/avant le déploiement du code.
-- Lecture/écriture via le client admin (service_role) ; RLS prof par sécurité.
-- ============================================================================

begin;

create table if not exists aletheia_params (
  id                integer primary key default 1,
  prompt_feedback_1 text,
  updated_at        timestamptz not null default now(),
  constraint aletheia_params_singleton check (id = 1)
);

insert into aletheia_params (id) values (1) on conflict (id) do nothing;

-- Trace d'un échec de génération du retour 1 (IA indisponible, JSON invalide,
-- texte de la semaine manquant…). Permet de signaler l'échec à l'élève (le statut
-- revient à DRAFT, résumé conservé) au lieu d'un retour silencieux. Effacé à la
-- nouvelle soumission / au succès.
alter table aletheia_travaux
  add column if not exists retour_1_erreur_at timestamptz;

alter table aletheia_params enable row level security;
drop policy if exists aletheia_params_prof_all on aletheia_params;
create policy aletheia_params_prof_all on aletheia_params
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;
