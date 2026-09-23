-- ============================================================================
-- Rollback de `quazian_scores_apres_fermeture.sql`. N'exécuter qu'en cas de
-- problème : rend à l'élève la lecture de sa note à tout moment (la fuite
-- revient). Aucune donnée touchée.
-- ============================================================================
select policyname, qual from pg_policies where tablename = 'quazian_quiz_scores' and policyname = 'quazian_quiz_scores_eleve_read';

begin;

drop policy if exists quazian_quiz_scores_eleve_read on quazian_quiz_scores;
create policy quazian_quiz_scores_eleve_read on quazian_quiz_scores
  for select using (eleve_id = auth.uid());

commit;

select policyname, qual from pg_policies where tablename = 'quazian_quiz_scores' order by policyname;
