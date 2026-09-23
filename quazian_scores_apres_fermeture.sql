-- ============================================================================
-- QUAZIAN — L'ÉLÈVE NE LIT SA NOTE DE QUIZ QU'UNE FOIS LE QUIZ FERMÉ. 2026-09-23.
-- Revue adversariale finale du commit 4c955f6 (déployé le 23/09) : la policy
-- `quazian_quiz_scores_eleve_read` laissait l'élève lire SA ligne à tout moment.
-- Or la note s'écrit dès qu'il envoie, quiz encore lancé ; avec une copie
-- « sonde » (A=40 B=30 C=20 D=10 sur une question, rien ailleurs), la moyenne
-- lue par l'API désigne la bonne lettre, qu'il peut passer à la classe qui
-- compose encore. Mesuré le 23/09 : policy en prod `using (eleve_id = auth.uid())`.
-- ----------------------------------------------------------------------------
-- UN geste : la même policy, bornée aux quiz FERMÉS. Aucun code à changer —
-- les lecteurs élève ne lisent que des quiz fermés (`quazian/page.tsx` sur
-- `fermeIds`, `chargerRetourQuizz` et `etatNoteVue` après fermeture) ; les
-- écritures passent par le service-role ; le professeur a `prof_all_scores`.
-- ⚠️ Flux existant (Quazian) : protocole renforcé de `SUIVI_SQL.md` (fenêtre
--    calme, rollback prêt, contrôle élève). Rollback : `quazian_scores_apres_fermeture_rollback.sql`.
-- ============================================================================

-- constat de tête
select policyname, cmd, qual from pg_policies
 where tablename = 'quazian_quiz_scores' and policyname = 'quazian_quiz_scores_eleve_read';

begin;

drop policy if exists quazian_quiz_scores_eleve_read on quazian_quiz_scores;
create policy quazian_quiz_scores_eleve_read on quazian_quiz_scores
  for select
  using (
    eleve_id = auth.uid()
    and exists (select 1 from quazian_quizzes z where z.id = quazian_quiz_scores.quiz_id and z.statut = 'ferme')
  );

commit;

-- constat de pied : la policy bornée, et rien d'autre de touché
select policyname, cmd, qual from pg_policies where tablename = 'quazian_quiz_scores' order by policyname;
select (select count(*) from quazian_quiz_scores) as notes_intactes;
