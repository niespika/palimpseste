-- ============================================================================
-- Resserrement de codex_sessions_eleve_read — §8bis-6 (Lot 5 du plan d'évaluation).
-- Fichier : codex_policy_brouillon.sql (joué à la main, additif, idempotent).
-- ----------------------------------------------------------------------------
-- La policy en vigueur (review_fixes_2026-06-21.sql:155-165) autorise l'élève à LIRE
-- les sessions de SES classes (ou sans classe) SANS filtrer le statut → les BROUILLONS
-- sont lisibles via l'API PostgREST. Inoffensif tant qu'un brouillon naît juste avant
-- la classe ; INACCEPTABLE quand « Préparer la synthèse » (S4) le crée des SEMAINES à
-- l'avance : l'élève apprendrait l'existence et l'approche d'une synthèse (la policy
-- quiz, elle, filtre déjà statut in ('lance','ferme')).
--
-- Le PROF passe par codex_sessions_prof_all (FOR ALL, rôle prof — codex_schema.sql:131)
-- → INCHANGÉ (il continue de lire ses brouillons pour les lancer). L'UI élève ne
-- consomme que phase_1/phase_2/fermee (via client admin) → seule la page synthèse élève
-- atteinte par URL directe sur un brouillon devient « Synthèse introuvable » (acceptable).
--
-- Rejouable sans dommage (drop policy if exists + create). Aucune donnée modifiée.
-- ============================================================================

begin;

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
