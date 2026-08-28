-- ============================================================================
-- C6 · L3 — ROLLBACK : le journal reperd la marque `bonus`.
-- ----------------------------------------------------------------------------
-- ⚠️ N'EXÉCUTER QU'EN CAS DE PROBLÈME.
--
-- ⚠️⚠️ CE QU'IL DÉTRUIT, ET IL FAUT LE LIRE AVANT : la marque de CHAQUE exercice
--    qu'un élève a demandé sur son budget optionnel. Elle ne se recalcule
--    d'aucune autre source — ni le dépôt, ni l'instance, ni la mesure ne savent
--    dire qui a demandé quoi. « Sans elle, l'analyse de fin d'année ne distingue
--    plus ce que l'élève a demandé de ce qu'on lui a imposé » (`01-` §5).
--    ⛔ Le constat de tête compte ce qui part. Un retour arrière qu'on joue sans
--    savoir ce qu'il emporte n'est pas un retour arrière.
--
-- ⛔ LES `competences_mesures.bonus` DÉJÀ ÉCRITS RESTENT. Un rollback de schéma
--    n'efface pas un fait mesuré : la mesure garde ce que la chaîne y a recopié.
--    ⚠️ Conséquence à connaître : après ce rollback, une mesure marquée n'a plus
--    de source amont, et le canal redevient ce qu'il était avant C6-L3 — un
--    lecteur sans écrivain.
--
-- ⛔ IL NE TOUCHE NI LES DÉPÔTS, NI LES DÉCISIONS, NI UN INTERRUPTEUR. Les
--    exercices servis en bonus restent servis : ils redeviennent seulement
--    indiscernables des exercices imposés.
-- ============================================================================

-- ── CONSTAT DE TÊTE — À LIRE AVANT D'ALLER PLUS LOIN ────────────────────────
select
  (select count(*) from routeur_decisions where bonus)            as marques_qui_vont_partir,
  (select count(distinct eleve_id) from routeur_decisions where bonus) as eleves_concernes,
  (select count(*) from competences_mesures where bonus)          as mesures_deja_marquees_qui_restent,
  (select count(*) from routeur_decisions)                        as decisions_avant;

begin;

drop index if exists idx_routeur_decisions_bonus;

alter table routeur_decisions drop column if exists bonus;

-- ── CONSTAT DE PIED ─────────────────────────────────────────────────────────
select
  (select count(*) = 0 from information_schema.columns
     where table_name = 'routeur_decisions' and column_name = 'bonus')  as colonne_retiree,
  (select count(*) = 0 from pg_indexes
     where tablename = 'routeur_decisions' and indexname = 'idx_routeur_decisions_bonus')
                                                                        as index_retire,
  (select count(*) from routeur_decisions)                              as decisions_intactes;

commit;
