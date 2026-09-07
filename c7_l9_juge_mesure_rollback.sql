-- ============================================================================
-- C7 · L9 — rollback de `c7_l9_juge_mesure.sql`. N'exécuter qu'en cas de
-- problème. La porte repasse à OFF par absence de colonne (lecteur tolérant) :
-- la chaîne mesure comme avant sur les crans qui isolent (P1, P2, la lettre),
-- le taux redevient non pondéré, aucune sonde de trajectoire ne se pose.
-- ⚠️ Les mesures CONVERTIES écrites porte ouverte RESTENT (lettre nulle, un seul
--    observable) : le moteur les lit sans lettre (la médiane les ignore), la
--    fenêtre d'évidence les lit par `statutDeLaMesure` comme les autres. Le
--    constat de tête les compte ; ce fichier n'en retire aucune.
-- ============================================================================

-- constat de tête : ce qui part, et ce qui reste
select
  (select count(*) from scriptorium_params where juge_mesure_actif) as portes_ouvertes,
  (select count(*) from competences_mesures where lettre_equivalente is null and depot_id is not null)
    as mesures_sans_lettre_qui_restent;

begin;

alter table scriptorium_params drop column if exists juge_mesure_actif;

commit;

-- constat de pied
select
  not exists (select 1 from information_schema.columns
                where table_name = 'scriptorium_params' and column_name = 'juge_mesure_actif')
    as porte_retiree;
