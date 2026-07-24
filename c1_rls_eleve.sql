-- ============================================================================
-- C1 — ROBUSTESSE & SÉCURITÉ ÉLÈVE : RLS granulaires (Session A, additive).
-- Fichier : c1_rls_eleve.sql — cf. SPEC_C1_robustesse.md (Session A, A2) et
-- AUDIT_Consolidation_2026-07-02.md (constats « FOR ALL », « PostgREST »,
-- « machine à états », « garde de classe »).
-- ----------------------------------------------------------------------------
-- Remplace les policies élève trop permissives par des policies SELECT-only (ou
-- rien, quand l'app lit tout en admin) : l'élève ne peut plus JAMAIS écrire en
-- direct via PostgREST (anon key + JWT élève, présents dans le navigateur).
-- Ferme : falsifier sa note de quizz, s'auto-valider un Codex, forcer
-- statut='DONE' Aletheia, poser un `*_lu_at` hors flux, ET une escalade de
-- privilège (élève → prof) via profiles.
--
-- ⚠️ Ce fichier est calé sur l'état RÉEL de la base (dump `pg_policies` du
-- 23/07), pas seulement sur l'historique du repo. Deux surprises intégrées :
--   • Doublons hérités : quazian_sessions/answers portent DEUX policies élève
--     FOR ALL — la lot1 (`*_eleve_own`) ET une socle non versionnée
--     (`eleve_own_*`). Il faut DROP les deux, sinon la socle garde l'écriture
--     ouverte (policies OR'ées). C'est la « faute historique FOR ALL » × 2.
--   • profiles : `Mise à jour profil personnel` (UPDATE, with_check=null →
--     défaut = using auth.uid()=id) laisse l'élève PATCHer sa propre ligne, dont
--     `role` (escalade en prof) et `integrite_*` (se déstriker). Policy INUTILE
--     à l'app (toutes les écritures profiles passent par le client admin :
--     app/prof/eleves/actions.ts, utils/integrite.ts) → on la DROP. Et l'INSERT
--     `with_check=true` est resserré à sa propre ligne (le trigger auth→profiles
--     est SECURITY DEFINER, dump 23/07 → il n'en dépend pas).
--
-- Ce qui reste ouvert en LECTURE (SELECT own) et pourquoi :
--   • quazian_sessions/answers/quiz_scores : lectures user-scoped (liste,
--     initialiserSession, chargerRetourQuizz, etatNoteVue) → SELECT own gardé.
-- Ce qui est FERMÉ (aucune policy élève, lecture app 100 % admin) :
--   • codex_travaux : toutes les lectures élève sont admin (chargerTrace,
--     chargerEtatTravail, chargerSyntheseActive/Historique, getTravail) → aucune
--     policy élève. Ferme l'exposition de `retour_critique` avant validation.
--   • aletheia_travaux : les 5 lectures user-scoped (travauxParSemaine data.ts +
--     4 lookups actions.ts) sont basculées sur le client admin (même commit) →
--     table FERMÉE. Ferme la lecture API de `devoilement`/retours (anti-spoiler).
--
-- ⚠️ ORDRE DE DÉPLOIEMENT (SUIVI_SQL.md règle 5 — un élève pilote travaille sur
-- la base) : code C1-A MERGÉ + POUSSÉ D'ABORD, SQL ENSUITE, en fenêtre calme,
-- smoke test élève immédiat. Les écritures Quazian élève basculent sur le client
-- admin dans le même commit ; sur l'ANCIEN code, cette migration CASSERAIT la
-- passation de quizz. Aletheia et Codex écrivaient DÉJÀ tout via admin.
-- Retour arrière : c1_rls_eleve_rollback.sql.
--
-- Idempotence : drop policy if exists + create policy. Rejouable sans dommage.
-- AUCUNE donnée modifiée, aucune table/colonne créée.
-- ============================================================================

begin;

-- ── 0. profiles — fermer l'escalade de privilège (CRITIQUE) ──────────────────
-- (a) L'UPDATE self-service est inutilisé par l'app (toutes les écritures
-- profiles passent par le client admin : création de compte
-- app/prof/eleves/actions.ts, strikes/blocage utils/integrite.ts). Sans
-- with_check explicite, il autorisait `role='prof'` (escalade) et la remise à
-- zéro des `integrite_*`. On le retire.
drop policy if exists "Mise à jour profil personnel" on profiles;

-- (b) L'INSERT self-service avait with_check=true → n'importe quel authentifié
-- pouvait insérer des lignes profil arbitraires. Le trigger auth→profiles
-- (public.handle_new_user, vérifié SECURITY DEFINER dans le dump du 23/07) ne
-- dépend PAS de cette policy (il bypasse la RLS). On resserre à sa propre ligne.
drop policy if exists "Trigger peut créer un profil" on profiles;
create policy "Trigger peut créer un profil" on profiles
  for insert
  with check (auth.uid() = id);
-- INCHANGÉ : lecture self (verifierEleve lit profiles.role en user-scoped) et
-- policies prof (lecture/écriture de tous les profils).

-- ── 1. aletheia_travaux — FERMÉ (aucune policy élève) ────────────────────────
-- Décision Louis/Fable : fermeture complète. Les 5 lectures qui restaient
-- user-scoped (travauxParSemaine data.ts + les 4 lookups actions.ts) sont
-- basculées sur le client admin (même filtre eleve_id) dans le même commit.
-- Écritures : déjà 100 % admin + compare-and-set. Ferme, en plus des écritures
-- (statut forcé, retour_*/devoilement, retour_vf_lu_at, DELETE/INSERT), la
-- LECTURE API de `devoilement` (jalons aval = spoiler) et des retours.
drop policy if exists aletheia_travaux_eleve_own  on aletheia_travaux;
drop policy if exists aletheia_travaux_eleve_read on aletheia_travaux;

-- ── 2. codex_travaux — FERMÉ (aucune policy élève) ───────────────────────────
-- Décision Louis/Fable : version fermée. Toutes les lectures élève passent par
-- le client admin (chargerTrace/EtatTravail/SyntheseActive/Historique/getTravail)
-- → l'élève n'a besoin d'AUCUN accès PostgREST direct. RLS reste active, seule
-- codex_travaux_prof_all subsiste. Ferme aussi la lecture API de
-- retour_critique/synthese_completee AVANT validation prof.
drop policy if exists codex_travaux_eleve_own  on codex_travaux;
drop policy if exists codex_travaux_eleve_read on codex_travaux;

-- ── 3. Quazian — passation : plus AUCUNE écriture élève directe ──────────────
-- ⚠️ DEUX policies FOR ALL par table (lot1 + socle non versionnée) : DROP les
-- deux, sinon la socle garde l'écriture ouverte. Les écritures de passation
-- basculent sur le client admin (même commit). Ferme : PATCHer
-- score_moyen/note_formative_20/note_vue_at, réécrire ses réponses après coup,
-- forger une session sur un quiz hors-classe (pollution de la cohorte).
drop policy if exists quazian_sessions_eleve_own on quazian_sessions;  -- lot1
drop policy if exists eleve_own_sessions          on quazian_sessions;  -- socle
drop policy if exists quazian_sessions_eleve_read on quazian_sessions;
create policy quazian_sessions_eleve_read on quazian_sessions
  for select
  using (eleve_id = auth.uid());

drop policy if exists quazian_answers_eleve_own on quazian_answers;  -- lot1
drop policy if exists eleve_own_answers          on quazian_answers;  -- socle
drop policy if exists quazian_answers_eleve_read on quazian_answers;
create policy quazian_answers_eleve_read on quazian_answers
  for select
  using (exists (
    select 1 from quazian_sessions s
    where s.id = quazian_answers.session_id and s.eleve_id = auth.uid()
  ));

drop policy if exists quazian_quiz_scores_eleve_own on quazian_quiz_scores;  -- lot1 (FOR ALL)
drop policy if exists eleve_own_scores               on quazian_quiz_scores;  -- socle (déjà SELECT)
drop policy if exists quazian_quiz_scores_eleve_read on quazian_quiz_scores;
create policy quazian_quiz_scores_eleve_read on quazian_quiz_scores
  for select
  using (eleve_id = auth.uid());

-- ── 4. codex_sessions — lecture élève : ré-assertion de la version stricte ───
-- Le dump confirme que la policy EN VIGUEUR est déjà la stricte (pas de
-- brouillon, scope classe — celle de codex_policy_brouillon.sql). On la
-- ré-asserte à l'identique : no-op qui rend l'état certain et auto-documenté.
-- Le prof passe par codex_sessions_prof_all → INCHANGÉ.
drop policy if exists codex_sessions_eleve_read on codex_sessions;
create policy codex_sessions_eleve_read on codex_sessions
  for select
  using (
    statut <> 'brouillon'
    and (
      classe_id is null
      or exists (
        select 1 from inscriptions i
         where i.eleve_id = auth.uid()
           and i.statut = 'active'
           and i.classe_id = codex_sessions.classe_id
      )
    )
  );

commit;

-- ============================================================================
-- HORS PÉRIMÈTRE (analysés au dump, NON modifiés ici — cf. réponse à Louis) :
--   • fragments_depots : l'élève peut UPDATE sa propre ligne (using auth.uid()=
--     eleve_id, with_check null) → blanchir photos_suspectes/signal_integrite,
--     rétro-dater statut. Module MASQUÉ dans le pilote Aletheia-only + chemin
--     d'écriture (delete+insert user-scoped) délicat et non testé → NON touché
--     dans cette migration (risque de casser le dépôt). Candidat Session B.
--   • quazian_card_states / review_log (FOR ALL élève, socle) : auto-révision
--     FSRS, données d'étude personnelles NON notées → risque faible, acceptable.
-- ============================================================================
