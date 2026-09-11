-- ============================================================================
-- LA TROISIÈME VOIE DU RATTACHEMENT (C4-L12, premier geste) : l'interrupteur, à OFF. 2026-09-10.
-- Patron : `c7_l9_juge_mesure.sql`, `c7_l8_chaine_cle.sql`.
-- ----------------------------------------------------------------------------
-- UNE colonne : `scriptorium_params.notions_actif boolean not null default false`
-- (ligne id = 1). Le code la lit par une requête SÉPARÉE et TOLÉRANTE
-- (`utils/moteur/porte-notions.ts`) : colonne absente ⇒ OFF — le code peut donc
-- partir AVANT ce fichier, et c'est l'ordre voulu.
-- Ce qu'elle protège (décision de Louis, 10/09/2026 ; `01-` §4 couche 4, C4-L16) :
-- dans la couche 4 du routeur, un sujet ou un texte en `cours_etat = 'notions'`
-- devient servable dès qu'un cours VU par une classe de l'élève déclare l'une de
-- ses notions (`scriptorium_contenus.notions`). Porte fermée : écarté comme hier
-- (`cours_par_notions_non_lu`), à l'octet.
-- ⛔ Ni `gabarit_actif`, ni `routeur_actif` : un lot lit LE SIEN (`07-` §5).
-- ⛔ Aucune policy touchée ; additive et gatée (règle R6, point 5). Aucune donnée
--    n'est réécrite. Rollback : `notions_actif_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_params) as params_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_params' and column_name = 'notions_actif')
    as porte_deja_posee;

begin;

alter table scriptorium_params
  add column if not exists notions_actif boolean not null default false;

commit;

-- constat de pied : deux drapeaux, plus le témoin
select
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_params' and column_name = 'notions_actif'
              and data_type = 'boolean' and is_nullable = 'NO' and column_default = 'false')
    as porte_posee,
  not exists (select 1 from scriptorium_params where notions_actif) as porte_a_off,
  (select count(*) from scriptorium_params) as params_intacts;
