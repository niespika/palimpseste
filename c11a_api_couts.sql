-- ============================================================================
-- C11a — Journal des coûts API par module (réparation).
-- Fichier : c11a_api_couts.sql — cf. PLAN_CHANTIERS_RENTREE.md §C11.
-- ----------------------------------------------------------------------------
-- POURQUOI CE FICHIER PLUTÔT QUE `api_couts.sql` : ce dernier est en ARCHIVE
-- (SUIVI_SQL.md — « ne jamais rejouer »). Constat du 25/07/2026, vérifié en base
-- sandbox (`select to_regclass('public.api_couts')` → NULL) : la table n'a
-- JAMAIS été créée. Les 14 sites d'appel de `enregistrerCoutApi()` (Aletheia ×6,
-- Quazian ×6, Scriptorium ×2) écrivaient donc dans le vide depuis juin 2026 —
-- silencieusement, car supabase-js ne LÈVE pas sur erreur d'insertion, il
-- retourne `{ error }` (corrigé côté code dans le même chantier).
--
-- Contenu identique à `api_couts.sql` (rien à changer à la conception), plus
-- l'habillage maison : transaction, idempotence, bloc de vérification.
--
-- ── Répartition des sources de coût (inchangée) ──────────────────────────────
-- Fragments (fragments_analyses / fragments_essai_depot_analyses /
-- fragments_syntheses) et Codex (codex_travaux) portent leur coût en colonne
-- `cout_api` sur la ligne concernée. Quazian, Aletheia et Scriptorium (RAG)
-- n'ont pas de ligne « hôte » naturelle pour toutes leurs générations → ils
-- passent par CE journal. La tuile « Coût API » du tableau de bord prof
-- additionne les DEUX sources. Aucun double comptage : chaque module écrit dans
-- UNE seule des deux (le RAG stocke bien un `cout` sur
-- `scriptorium_messages`/`scriptorium_rag_syntheses`, mais c'est un détail
-- d'écran, jamais lu par la tuile).
--
-- Additif et sans effet sur les flux existants (table neuve, aucune policy
-- touchée ailleurs) → protocole normal, pas de protocole renforcé (règle R6/5).
-- Idempotent, rejouable.
-- ============================================================================

begin;

create table if not exists api_couts (
  id          uuid primary key default gen_random_uuid(),
  module      text not null,          -- 'aletheia' | 'quazian' | 'scriptorium' | …
  cout        numeric not null,       -- en dollars US
  created_at  timestamptz not null default now()
);

create index if not exists idx_api_couts_created on api_couts(created_at);

alter table api_couts enable row level security;

-- Lecture réservée aux profs (patron standard). Les écritures passent par la clé
-- service_role, qui contourne RLS — et la tuile lit aussi en service_role.
drop policy if exists api_couts_prof_read on api_couts;
create policy api_couts_prof_read on api_couts
  for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;

-- ── Vérification (à exécuter après ; doit renvoyer table_ok = t, rls_ok = t,
--    policies = 1, index_ok = t) ───────────────────────────────────────────────
-- select
--   to_regclass('public.api_couts') is not null                        as table_ok,
--   (select relrowsecurity from pg_class where oid = 'public.api_couts'::regclass) as rls_ok,
--   (select count(*) from pg_policies
--      where schemaname = 'public' and tablename = 'api_couts')        as policies,
--   (select count(*) > 0 from pg_indexes
--      where schemaname = 'public' and indexname = 'idx_api_couts_created') as index_ok;
--
-- ── Puis, APRÈS une génération IA Aletheia/Quazian/Scriptorium, le journal doit
--    se remplir (c'est le test qui prouve la réparation de bout en bout) ───────
-- select module, count(*) as appels, round(sum(cout)::numeric, 4) as total_usd,
--        min(created_at) as premier, max(created_at) as dernier
--   from api_couts group by module order by total_usd desc;
