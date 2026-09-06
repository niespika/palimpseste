-- ============================================================================
-- C7 · L8 — « LA CHAÎNE À L'HEURE DE LA CLÉ » : l'interrupteur, à OFF. 2026-09-07.
-- Patron : `c7_l1_juge_documents.sql` (la porte du juge), `copie_annotee_actif.sql`.
-- ----------------------------------------------------------------------------
-- UNE colonne : `scriptorium_params.chaine_cle_actif boolean not null default false`
-- (ligne id = 1). Le code la lit par une requête SÉPARÉE et TOLÉRANTE
-- (`utils/chaine/porte-cle.ts`) : colonne absente ⇒ OFF — le code peut donc
-- partir AVANT ce fichier, et c'est l'ordre voulu.
-- Ce qu'elle protège (décision de Louis, 06/09 au soir — « le lot change le
-- retour de tous les dépôts, un lot lit le sien ») : les quatre pièces de C7-L8 —
--   (1) la chaîne signale une v1 qui reproduit le devoir ;
--   (2) sur un exercice qui isole avec une clé, la chaîne ne mesure QUE la
--       compétence de l'observable de la clé, et le retour ne parle que de lui ;
--   (3) le « se juger » n'interroge que cette compétence, l'observable de la clé
--       en tête ;
--   (4) une citation présente dans le matériau ET dans la copie s'écarte, sauf
--       sur le passage à corriger.
-- ⛔ Ce n'est ni `chaine_actif` (la coupure de facture), ni `gabarit_actif`, ni
--    `juge_documents_actif` : un lot lit LE SIEN (`07-` §5).
-- ⛔ Aucune policy touchée ; additive et gatée (règle R6, point 5).
-- Rollback : `c7_l8_chaine_cle_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_params) as params_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_params' and column_name = 'chaine_cle_actif')
    as porte_deja_posee;

begin;

alter table scriptorium_params
  add column if not exists chaine_cle_actif boolean not null default false;

commit;

-- constat de pied : deux drapeaux, plus le témoin
select
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_params' and column_name = 'chaine_cle_actif'
              and data_type = 'boolean' and is_nullable = 'NO' and column_default = 'false')
    as porte_posee,
  not exists (select 1 from scriptorium_params where chaine_cle_actif) as porte_a_off,
  (select count(*) from scriptorium_params) as params_intacts;
