-- ============================================================================
-- Rollback de `notions_actif.sql`. N'exécuter qu'en cas de problème. La porte
-- repasse à OFF par absence de colonne (lecteur tolérant) : les sujets et textes
-- rattachés par notions redeviennent écartés (`cours_par_notions_non_lu`).
-- ⚠️ Les décisions du routeur prises porte ouverte RESTENT ; ce fichier n'en
--    retire aucune, et les dépôts des élèves ne bougent pas.
-- ============================================================================

-- constat de tête
select (select count(*) from scriptorium_params where notions_actif) as portes_ouvertes;

begin;

alter table scriptorium_params drop column if exists notions_actif;

commit;

-- constat de pied
select
  not exists (select 1 from information_schema.columns
                where table_name = 'scriptorium_params' and column_name = 'notions_actif')
    as porte_retiree;
