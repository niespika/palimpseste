-- ============================================================================
-- SCRIPTORIUM RAG — Lot L7 : synthèse hebdomadaire par classe.
-- Fichier : scriptorium_rag_l7_syntheses.sql — cf. SPEC_scriptorium_rag.md §10.
-- ----------------------------------------------------------------------------
-- « rag_ » évite la collision mentale avec les synthèses Codex (plan-synthese*).
-- Une ligne par (classe, lundi de la semaine SYNTHÉTISÉE — écoulée). Statuts :
-- PENDING (réservé), READY (générée), VIDE (aucune activité — aucun appel IA),
-- ERROR (échec, re-tentable via « (Re)générer »). `contenu` = sortie §9.2 du
-- modèle + stats calculées en SQL. `vue_at` = consultation prof (éteint le
-- signal « à faire » du lundi). Idempotence de génération : unique
-- (classe_id, semaine_lundi) — un re-run écrase proprement (upsert).
-- RLS : lecture prof (patron standard) ; écritures via service role (cron).
-- Idempotent, additif, rejouable. Prérequis : scriptorium_rag_l5_chat.sql.
-- ============================================================================

begin;

create table if not exists scriptorium_rag_syntheses (
  id            uuid primary key default gen_random_uuid(),
  classe_id     uuid not null references classes(id) on delete cascade,
  semaine_lundi date not null,                            -- lundi de la semaine SYNTHÉTISÉE (écoulée)
  statut        text not null default 'PENDING' check (statut in ('PENDING', 'READY', 'VIDE', 'ERROR')),
  contenu       jsonb,                                    -- sortie §9.2 + stats calculées code
  cout          numeric,
  vue_at        timestamptz,                              -- consultation prof (éteint le signal « à faire »)
  erreur_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (classe_id, semaine_lundi)
);
create index if not exists idx_rag_syntheses_classe on scriptorium_rag_syntheses(classe_id, semaine_lundi desc);

alter table scriptorium_rag_syntheses enable row level security;

drop policy if exists rag_syntheses_prof_select on scriptorium_rag_syntheses;
create policy rag_syntheses_prof_select on scriptorium_rag_syntheses
  for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;
