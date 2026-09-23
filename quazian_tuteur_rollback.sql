-- ============================================================================
-- Rollback de `quazian_tuteur.sql`. N'exécuter qu'en cas de problème.
-- La porte disparaît (lecteur tolérant ⇒ OFF) : plus de bouton « En parler avec
-- le tuteur ». Les conversations ouvertes depuis un quiz RESTENT (messages
-- compris) : elles perdent seulement leur lien à la question, et le tuteur n'en
-- recompose plus le contexte.
-- ============================================================================

-- constat de tête — TOLÉRANT (rejouable après un premier rollback)
select
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_conversations' and column_name = 'quiz_question_id') as colonne_presente,
  (select count(*) from scriptorium_conversations) as conversations_avant;

begin;

drop index if exists scriptorium_conversations_quiz_question_unique;
alter table scriptorium_conversations drop column if exists quiz_question_id;
alter table scriptorium_params drop column if exists quazian_tuteur_actif;

commit;

-- constat de pied
select
  not exists (select 1 from information_schema.columns
                where table_name = 'scriptorium_conversations' and column_name = 'quiz_question_id') as colonne_retiree,
  not exists (select 1 from information_schema.columns
                where table_name = 'scriptorium_params' and column_name = 'quazian_tuteur_actif') as porte_retiree,
  (select count(*) from scriptorium_conversations) as conversations_intactes;
