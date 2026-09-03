-- ROLLBACK de `aletheia_etayage_l3.sql` — n'exécuter qu'en cas de problème, et
-- seulement avec le code d'AVANT E3 déployé (le code neuf lit ces colonnes porte ouverte).
-- ⚠️ Détruit le gabarit choisi par livre, les cycles, les réponses à la question fixe
--    et les overrides de blocs. Les livres, travaux, retours restent intacts.
select
  (select count(*) from scriptorium_unites where gabarit_lecture <> 'argumentatif') as livres_non_argumentatifs_qui_partent,
  (select count(*) from aletheia_travaux where champ_fixe is not null or champ_fixe_vf is not null) as champs_fixes_qui_partent,
  (select count(*) from aletheia_travaux) as travaux_avant;
begin;
alter table scriptorium_unites drop column if exists gabarit_lecture, drop column if exists cycle_tournante;
alter table aletheia_travaux drop column if exists champ_fixe, drop column if exists champ_fixe_vf, drop column if exists tournante_cle;
alter table aletheia_params drop column if exists blocs_gabarits;
commit;
select
  (select count(*) from information_schema.columns
     where (table_name, column_name) in (('scriptorium_unites','gabarit_lecture'), ('scriptorium_unites','cycle_tournante'),
                                         ('aletheia_travaux','champ_fixe'), ('aletheia_travaux','champ_fixe_vf'), ('aletheia_travaux','tournante_cle'),
                                         ('aletheia_params','blocs_gabarits'))) = 0 as colonnes_retirees,
  (select count(*) from aletheia_travaux) as travaux_intacts;
