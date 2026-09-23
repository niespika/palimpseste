-- ============================================================================
-- Rollback de `quazian_antichambre.sql`. N'exécuter qu'en cas de problème.
-- La porte disparaît (lecteur tolérant ⇒ OFF) : le lancement redevient celui
-- d'hier, en un geste. Un quiz dont l'antichambre était ouverte redevient un
-- simple brouillon — ses questions et ses réglages ne bougent pas.
-- ⚠️ Les présences enregistrées sont perdues (DROP TABLE) ; aucune note, aucune
--    session, aucune réponse d'élève n'est touchée.
-- ============================================================================

-- constat de tête — TOLÉRANT : il se rejoue même après un premier rollback
-- (il ne lit ni la table ni la colonne, qui peuvent ne plus exister).
select
  (select count(*) from information_schema.columns
     where table_name = 'quazian_quizzes' and column_name = 'antichambre_at') as colonne_presente,
  (select count(*) from information_schema.tables where table_name = 'quazian_antichambre') as table_presente,
  (select count(*) from quazian_quizzes) as quizz_avant;

begin;

drop table if exists quazian_antichambre;
alter table quazian_quizzes drop column if exists antichambre_at;
alter table scriptorium_params drop column if exists quazian_antichambre_actif;

commit;

-- constat de pied
select
  not exists (select 1 from information_schema.tables where table_name = 'quazian_antichambre') as table_retiree,
  not exists (select 1 from information_schema.columns
                where table_name = 'quazian_quizzes' and column_name = 'antichambre_at') as colonne_retiree,
  not exists (select 1 from information_schema.columns
                where table_name = 'scriptorium_params' and column_name = 'quazian_antichambre_actif') as porte_retiree,
  (select count(*) from quazian_quizzes) as quizz_intacts;
