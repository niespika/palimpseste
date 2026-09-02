-- ============================================================================
-- C6 · L4 — ROLLBACK : l'essai d'une classe reperd le lien vers son instance.
-- ----------------------------------------------------------------------------
-- ⚠️ N'EXÉCUTER QU'EN CAS DE PROBLÈME.
--
-- ⚠️⚠️ CE QU'IL DÉTRUIT, ET IL FAUT LE LIRE AVANT : le lien de CHAQUE essai
--    branché vers son instance de la chaîne. L'instance, sa ligne de plan, ses
--    dépôts, ses transcriptions, ses mesures et ses ancres RESTENT — rien de la
--    chaîne ne part. Mais plus rien ne dit « cette instance est l'essai X de la
--    classe Y » : la page de passation du professeur dans Fragments ne se
--    retrouve plus, le bouton de mesure de l'essai non plus, et un dépôt
--    d'essai confirmé après ce rollback n'entre plus dans la chaîne.
--    ⛔ Le constat de tête compte ce qui part.
--
-- ⛔ IL NE TOUCHE NI LES ESSAIS, NI LES DÉPÔTS DE FRAGMENTS, NI UN INTERRUPTEUR,
--    NI AUCUNE TABLE DE LA CHAÎNE.
-- ============================================================================

-- ── CONSTAT DE TÊTE — À LIRE AVANT D'ALLER PLUS LOIN ────────────────────────
select
  (select count(*) from fragments_essais_classes where exercice_id is not null)
                                                                      as liens_branches_qui_partent,
  (select count(*) from fragments_essais_classes)                     as liens_avant;

begin;

drop index if exists idx_fragments_essais_classes_exercice;

alter table fragments_essais_classes drop column if exists exercice_id;

-- ── CONSTAT DE PIED ─────────────────────────────────────────────────────────
select
  (select count(*) = 0 from information_schema.columns
     where table_name = 'fragments_essais_classes'
       and column_name = 'exercice_id')                               as colonne_retiree,
  (select count(*) = 0 from pg_indexes
     where tablename = 'fragments_essais_classes'
       and indexname = 'idx_fragments_essais_classes_exercice')        as index_retire,
  (select count(*) from fragments_essais_classes)                     as liens_intacts;

commit;
