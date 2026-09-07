-- ============================================================================
-- C7 · L9 — « SUR UN CRAN QUI ISOLE, LE JUGE EST LA MESURE » : l'interrupteur, à OFF. 2026-09-07.
-- Patron : `c7_l8_chaine_cle.sql` (la porte de la clé), `c7_l1_juge_documents.sql`.
-- ----------------------------------------------------------------------------
-- UNE colonne : `scriptorium_params.juge_mesure_actif boolean not null default false`
-- (ligne id = 1). Le code la lit par une requête SÉPARÉE et TOLÉRANTE
-- (`utils/chaine/porte-mesure.ts`) : colonne absente ⇒ OFF — le code peut donc
-- partir AVANT ce fichier, et c'est l'ordre voulu.
-- Ce qu'elle protège (décisions de Louis, séance d'arbitrage du 07/09/2026 —
-- `07-` §2, entrée C7-L9 ; `01-` v5.15 ; `03-` v2.2 §1 ; `10-` v0.13 §6-§7) : aux
-- crans 1·2·3·4·5·7·9 servis par le routeur, sur un exercice qui isole avec une clé,
--   (1) ni P1 ni P2 : la mesure est le verdict du cran converti en valeur extrême
--       de la famille de l'observable isolé, `n/a` ailleurs, lettre-équivalente NULLE ;
--   (2) aux crans 1·3, la clôture met le dépôt en file et la mesure s'écrit sans appel ;
--   (3) en vf, le juge rejoue à l'aveugle et `delta_v1_vf` est la différence des verdicts ;
--   (4) Calame reçoit le verdict, la copie, les documents et la dimension — aucun squelette ;
--   (5) le poids par cran dans le taux de réussite, et le signal de trajectoire au 6·8.
-- ⚠️ Elle N'A DE SENS que `juge_documents_actif` ouvert : porte ouverte et juge
--    fermé, aucun verdict ne peut exister — la chaîne d'hier, et une alerte nommée.
-- ⛔ Ce n'est ni `chaine_actif` (la coupure de facture), ni `gabarit_actif`, ni
--    `chaine_cle_actif`, ni `juge_documents_actif` : un lot lit LE SIEN (`07-` §5).
-- ⛔ Aucune policy touchée ; additive et gatée (règle R6, point 5). Aucune donnée
--    n'est réécrite : les mesures d'hier restent, avec leur lettre.
-- Rollback : `c7_l9_juge_mesure_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_params) as params_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_params' and column_name = 'juge_mesure_actif')
    as porte_deja_posee;

begin;

alter table scriptorium_params
  add column if not exists juge_mesure_actif boolean not null default false;

commit;

-- constat de pied : deux drapeaux, plus le témoin
select
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_params' and column_name = 'juge_mesure_actif'
              and data_type = 'boolean' and is_nullable = 'NO' and column_default = 'false')
    as porte_posee,
  not exists (select 1 from scriptorium_params where juge_mesure_actif) as porte_a_off,
  (select count(*) from scriptorium_params) as params_intacts;
