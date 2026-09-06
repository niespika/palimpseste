-- ============================================================================
-- C7 · L8 — rollback de `c7_l8_chaine_cle.sql`. N'exécuter qu'en cas de
-- problème. La porte repasse à OFF par absence de colonne (lecteur tolérant) :
-- la chaîne, le retour, le « se juger » et l'élagage reprennent leur cours
-- d'avant. Rien d'autre n'est touché — le lot n'écrit aucune donnée.
-- ============================================================================

-- constat de tête : ce qui part
select (select count(*) from scriptorium_params where chaine_cle_actif) as portes_ouvertes;

begin;

alter table scriptorium_params drop column if exists chaine_cle_actif;

commit;

-- constat de pied
select
  not exists (select 1 from information_schema.columns
                where table_name = 'scriptorium_params' and column_name = 'chaine_cle_actif')
    as porte_retiree;
