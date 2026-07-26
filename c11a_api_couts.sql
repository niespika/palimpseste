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
-- Contenu repris d'`api_couts.sql` (rien à changer à la conception), plus
-- l'habillage maison : transaction, idempotence, bloc de vérification.
--
-- ── v2 du 25/07/2026 (C11a-bis), AVANT toute exécution ───────────────────────
-- Ce fichier n'ayant JAMAIS été joué, on l'enrichit EN PLACE plutôt que par un
-- ALTER : la table naît avec l'ATTRIBUTION de chaque coût (élève, classe, modèle,
-- compteurs de tokens — tout nullable, best-effort). Aucune ligne ne sera donc
-- écrite sans attribution reconstituable, et le futur écran de détail (coûts par
-- module / élève / jour) n'aura rien à rattraper.
-- ⚠️ Le `create table if not exists` ci-dessous reste idempotent (rejouer = no-op)
-- mais il ne MET PAS À JOUR une table déjà créée en v1 : ce fichier n'ayant jamais
-- été joué (re-vérifié le 25/07), le cas ne se présente pas — s'il se présentait
-- un jour, le chemin serait un ALTER séparé, journalisé à part (R6).
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
  created_at  timestamptz not null default now(),

  -- ── Attribution (v2) — TOUT nullable, best-effort ─────────────────────────
  -- Un coût non attribuable reste une ligne VALIDE (module + montant) : c'est la
  -- réalité de certains coûts (génération « de classe », fiche de référence d'un
  -- livre, capstone), pas un échec de journalisation. Le code ne fait JAMAIS de
  -- requête supplémentaire pour remplir ces colonnes : il n'écrit que ce qu'il a
  -- déjà sous la main.
  -- `on delete set null` des deux côtés : un élève ou une classe supprimé
  -- n'efface pas un coût DÉJÀ PAYÉ — il devient simplement « non attribué ».
  eleve_id    uuid null references profiles(id) on delete set null,
  classe_id   uuid null references classes(id)  on delete set null,
  modele      text null,              -- id de modèle facturé ('claude-sonnet-4-6', 'gemini-…')

  -- Compteurs de tokens de l'appel (hit-rate du prompt caching — recommandation
  -- ouverte de l'audit du 02/07). `tokens_cache_ecriture` = TOTAL de l'écriture
  -- de cache, tous TTL confondus (5 min + 1 h) : le détail par TTL sert au PRIX,
  -- pas au suivi.
  tokens_entree          integer null,
  tokens_sortie          integer null,
  tokens_cache_lecture   integer null,
  tokens_cache_ecriture  integer null
);

create index if not exists idx_api_couts_created on api_couts(created_at);

-- Index partiel : le futur écran « coûts par élève » ne balaye que les lignes
-- attribuées (les coûts de classe, majoritaires en volume, ne l'encombrent pas).
create index if not exists idx_api_couts_eleve on api_couts(eleve_id, created_at)
  where eleve_id is not null;

alter table api_couts enable row level security;

-- Lecture réservée aux profs (patron standard). Les écritures passent par la clé
-- service_role, qui contourne RLS — et la tuile lit aussi en service_role.
drop policy if exists api_couts_prof_read on api_couts;
create policy api_couts_prof_read on api_couts
  for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;

-- ── Vérification (à exécuter après ; doit renvoyer table_ok = t, rls_ok = t,
--    policies = 1, index_created_ok = t, index_eleve_ok = t,
--    colonnes_attribution = 7) ─────────────────────────────────────────────────
-- select
--   to_regclass('public.api_couts') is not null                        as table_ok,
--   (select relrowsecurity from pg_class where oid = 'public.api_couts'::regclass) as rls_ok,
--   (select count(*) from pg_policies
--      where schemaname = 'public' and tablename = 'api_couts')        as policies,
--   (select count(*) > 0 from pg_indexes
--      where schemaname = 'public' and indexname = 'idx_api_couts_created') as index_created_ok,
--   (select count(*) > 0 from pg_indexes
--      where schemaname = 'public' and indexname = 'idx_api_couts_eleve')   as index_eleve_ok,
--   (select count(*) from information_schema.columns
--      where table_schema = 'public' and table_name = 'api_couts'
--        and column_name in ('eleve_id', 'classe_id', 'modele',
--                            'tokens_entree', 'tokens_sortie',
--                            'tokens_cache_lecture', 'tokens_cache_ecriture'))
--                                                                      as colonnes_attribution;
--
-- ── Puis, APRÈS une génération IA Aletheia/Quazian/Scriptorium, le journal doit
--    se remplir ET s'attribuer (c'est le test de bout en bout) ─────────────────
-- select module,
--        count(*)                                   as appels,
--        count(eleve_id)                            as attribues_eleve,
--        count(classe_id)                           as attribues_classe,
--        count(tokens_entree)                       as avec_tokens,
--        round(sum(cout)::numeric, 4)               as total_usd,
--        max(created_at)                            as dernier
--   from api_couts group by module order by total_usd desc;
--
-- Attendus par module (un « 0 » attendu n'est pas un bug) :
--   • aletheia   → attribues_eleve > 0 (retours V1/VF, diagnostic) ; les lignes du
--                  CAPSTONE et de la FICHE DE RÉFÉRENCE sont non attribuées (coûts
--                  de livre, déclenchés par le prof) → attribues_eleve < appels ;
--   • quazian    → JAMAIS d'élève (génération par classe/contenu — structurel) ;
--                  attribues_classe > 0 sur la seule création de quiz ;
--   • scriptorium→ chat élève : élève ET classe ; synthèse hebdo : classe seule ;
--   • partout    → avec_tokens = appels dès que le fournisseur rend un usage.
