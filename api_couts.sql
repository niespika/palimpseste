-- ============================================================================
-- Phase 2 (T5) — Journal des coûts API par module.
-- ----------------------------------------------------------------------------
-- Les coûts IA de Fragments (fragments_analyses / fragments_essai_depot_analyses
-- / fragments_syntheses) et de Codex (codex_travaux) sont déjà stockés en
-- colonne `cout_api` sur la ligne concernée. Quazian et Aletheia n'ont pas de
-- ligne « hôte » naturelle pour leurs générations → on les journalise ici.
--
-- Le tableau de bord additionne : colonnes cout_api existantes (Fragments+Codex)
-- + ce journal (Quazian+Aletheia). Aucun double comptage : chaque module écrit
-- dans UNE seule source.
-- ============================================================================

create table if not exists api_couts (
  id          uuid primary key default gen_random_uuid(),
  module      text not null,          -- 'quazian' | 'aletheia' | …
  cout        numeric not null,       -- en dollars
  created_at  timestamptz not null default now()
);

create index if not exists idx_api_couts_created on api_couts(created_at);

alter table api_couts enable row level security;

-- Lecture réservée aux profs (les écritures passent par la clé service_role qui
-- contourne RLS).
drop policy if exists api_couts_prof_read on api_couts;
create policy api_couts_prof_read on api_couts
  for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));
