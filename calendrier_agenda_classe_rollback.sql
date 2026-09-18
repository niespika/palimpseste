-- ============================================================================
-- ROLLBACK de calendrier_agenda_classe.sql — n'exécuter qu'en cas de problème.
-- Retire la porte et la table. ⚠️ DROP TABLE : les évènements posés par le
-- professeur sont PERDUS (ils ne vivent nulle part ailleurs). Le code, porte
-- absente ⇒ OFF, ne lit plus la table : rien ne casse à l'écran.
-- Ne touche pas à `scriptorium_exercices_planifies.titre` (colonne antérieure).
-- ============================================================================
begin;
drop table if exists calendrier_evenements;
alter table scriptorium_params drop column if exists agenda_classe_actif;
commit;

select
  not exists (select 1 from information_schema.tables where table_name = 'calendrier_evenements') as table_retiree,
  not exists (select 1 from information_schema.columns
                where table_name = 'scriptorium_params' and column_name = 'agenda_classe_actif') as porte_retiree;
