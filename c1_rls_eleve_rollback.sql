-- ============================================================================
-- C1 — ROLLBACK de c1_rls_eleve.sql (protocole renforcé, SUIVI_SQL.md règle 5).
-- Fichier : c1_rls_eleve_rollback.sql
-- ----------------------------------------------------------------------------
-- À jouer UNIQUEMENT si, après c1_rls_eleve.sql, un flux élève casse en sandbox
-- (un élève réel — le pilote Aletheia — travaille sur cette base). Restaure les
-- policies élève d'AVANT la migration, telles que le dump `pg_policies` du 23/07
-- les montre RÉELLEMENT en base (doublons socle + lot1 inclus) :
--   • aletheia_travaux : aletheia_travaux_eleve_own (FOR ALL)
--   • codex_travaux    : codex_travaux_eleve_own (FOR ALL)
--   • quazian_sessions : quazian_sessions_eleve_own (lot1) + eleve_own_sessions (socle)
--   • quazian_answers  : quazian_answers_eleve_own (lot1) + eleve_own_answers (socle)
--   • quazian_quiz_scores : quazian_quiz_scores_eleve_own (lot1, ALL) + eleve_own_scores (socle, SELECT)
-- et retire les policies SELECT-only introduites par la migration.
--
-- ⚠️ Rappel du protocole (règle 5) : rollback COMPLET = ce SQL + revert du code
-- C1-A (git). Ce fichier suffit à DÉBLOQUER un flux d'écriture cassé (il rouvre
-- les policies FOR ALL dont l'ANCIEN code dépendait).
--
-- NON RESTAURÉ VOLONTAIREMENT (revenir en arrière rouvrirait un trou, sans aucun
-- bénéfice pour l'app — ces policies n'étaient utilisées par AUCUN code) :
--   • profiles « Mise à jour profil personnel » (UPDATE) : sa restauration
--     rouvrirait l'escalade élève→prof + le déstrike. Toutes les écritures
--     profiles passent par le client admin → la garder retirée ne casse rien.
--   • profiles « Trigger peut créer un profil » (INSERT) : reste resserré à
--     `with check (auth.uid() = id)`. Le trigger auth→profiles est SECURITY
--     DEFINER (il bypasse la RLS) → le resserrement ne casse pas la création de
--     compte ; le re-loosir n'apporterait rien.
--   • codex_sessions_eleve_read : la migration a ré-asserté la version STRICTE
--     (déjà en vigueur au dump) ; c'est une policy de LECTURE, elle n'a jamais
--     bloqué d'écriture. On la CONSERVE stricte.
-- NB : aletheia_travaux est restauré ci-dessous en FOR ALL (son état PRÉ-migration
-- selon le dump) — la fermeture C1 y bascule 5 lectures sur le client admin ; le
-- rollback SQL rouvre l'écriture, le rollback COMPLET revert aussi ce code.
--
-- Idempotent (drop policy if exists + create). Rejouable sans dommage.
-- ============================================================================

begin;

-- ── Retirer les policies SELECT-only introduites par c1_rls_eleve.sql ────────
drop policy if exists aletheia_travaux_eleve_read on aletheia_travaux;
drop policy if exists codex_travaux_eleve_read    on codex_travaux;
drop policy if exists quazian_sessions_eleve_read    on quazian_sessions;
drop policy if exists quazian_quiz_scores_eleve_read on quazian_quiz_scores;
drop policy if exists quazian_answers_eleve_read     on quazian_answers;

-- ── Restaurer aletheia_travaux_eleve_own (dump : FOR ALL) ────────────────────
drop policy if exists aletheia_travaux_eleve_own on aletheia_travaux;
create policy aletheia_travaux_eleve_own on aletheia_travaux
  for all
  using (eleve_id = auth.uid())
  with check (eleve_id = auth.uid());

-- ── Restaurer codex_travaux_eleve_own (dump : FOR ALL) ───────────────────────
drop policy if exists codex_travaux_eleve_own on codex_travaux;
create policy codex_travaux_eleve_own on codex_travaux
  for all
  using (eleve_id = auth.uid())
  with check (eleve_id = auth.uid());

-- ── Restaurer les DEUX policies Quazian par table (lot1 + socle) ─────────────
-- quazian_sessions : lot1 (with check) + socle (with_check null → défaut = using)
drop policy if exists quazian_sessions_eleve_own on quazian_sessions;
create policy quazian_sessions_eleve_own on quazian_sessions
  for all using (eleve_id = auth.uid()) with check (eleve_id = auth.uid());
drop policy if exists eleve_own_sessions on quazian_sessions;
create policy eleve_own_sessions on quazian_sessions
  for all using (eleve_id = auth.uid());

-- quazian_answers : lot1 (with check) + socle (with_check null)
drop policy if exists quazian_answers_eleve_own on quazian_answers;
create policy quazian_answers_eleve_own on quazian_answers
  for all
  using (exists (select 1 from quazian_sessions s where s.id = quazian_answers.session_id and s.eleve_id = auth.uid()))
  with check (exists (select 1 from quazian_sessions s where s.id = quazian_answers.session_id and s.eleve_id = auth.uid()));
drop policy if exists eleve_own_answers on quazian_answers;
create policy eleve_own_answers on quazian_answers
  for all
  using (exists (select 1 from quazian_sessions s where s.id = quazian_answers.session_id and s.eleve_id = auth.uid()));

-- quazian_quiz_scores : lot1 (FOR ALL) + socle (déjà SELECT own)
drop policy if exists quazian_quiz_scores_eleve_own on quazian_quiz_scores;
create policy quazian_quiz_scores_eleve_own on quazian_quiz_scores
  for all using (eleve_id = auth.uid()) with check (eleve_id = auth.uid());
drop policy if exists eleve_own_scores on quazian_quiz_scores;
create policy eleve_own_scores on quazian_quiz_scores
  for select using (eleve_id = auth.uid());

commit;

-- ============================================================================
-- VÉRIFICATION PRÉALABLE (ne s'exécute PAS — bloc de commentaires).
-- ----------------------------------------------------------------------------
-- Ce rollback reconstitue l'état AVANT migration D'APRÈS le dump pg_policies du
-- 23/07 (doublons socle + lot1 inclus). Pour re-confirmer AVANT de jouer
-- c1_rls_eleve.sql, exécuter la requête ci-dessous dans le SQL Editor sandbox et
-- comparer sa sortie aux CREATE POLICY ci-dessus. En cas d'écart, remplacer les
-- définitions ci-dessus par la sortie (elle EST la vérité) puis re-tester.
-- NB : `profiles` est inclus dans la requête pour visibilité, mais la migration
-- ne RESTAURE PAS sa policy UPDATE (cf. en-tête) — c'est volontaire.
--
--   select format(
--            E'create policy %I on %I.%I%s%s%s%s;',
--            pol.policyname, pol.schemaname, pol.tablename,
--            case pol.cmd when 'ALL' then ' for all' when 'SELECT' then ' for select'
--                         when 'INSERT' then ' for insert' when 'UPDATE' then ' for update'
--                         when 'DELETE' then ' for delete' else '' end,
--            case when pol.roles is not null and pol.roles <> '{public}'
--                 then ' to ' || array_to_string(pol.roles, ', ') else '' end,
--            case when pol.qual is not null then E'\n  using (' || pol.qual || ')' else '' end,
--            case when pol.with_check is not null then E'\n  with check (' || pol.with_check || ')' else '' end
--          ) as ddl_actuelle
--     from pg_policies pol
--    where pol.schemaname = 'public'
--      and pol.tablename in ('aletheia_travaux','codex_travaux','codex_sessions',
--                            'quazian_sessions','quazian_quiz_scores','quazian_answers',
--                            'profiles')
--    order by pol.tablename, pol.policyname;
-- ============================================================================
