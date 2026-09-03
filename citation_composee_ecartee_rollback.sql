-- ============================================================================
-- C6 · L1 — ROLLBACK : les drapeaux « citation composée » effacés reviennent.
-- ----------------------------------------------------------------------------
-- ⚠️ N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ⚠️ CE QU'IL DÉTRUIT : la marque « effacé » posée par le professeur. Les
--    retours, leur texte, leur publication restent intacts — mais TOUS les
--    drapeaux effacés se relèvent à la prochaine lecture de la page
--    d'attention, puisque le calcul, lui, n'a jamais cessé de les lever. Le
--    bouton « Effacer » échoue ensuite (la colonne n'existe plus) et l'écran
--    le dit par un incident.
-- ============================================================================

-- ── CONSTAT DE TÊTE — À LIRE AVANT D'ALLER PLUS LOIN ────────────────────────
select
  (select count(*) from exercices_retours
     where citation_composee_ecartee_at is not null)                       as effacements_qui_partent,
  (select count(*) from exercices_retours)                                 as retours_avant;

begin;

alter table exercices_retours
  drop column if exists citation_composee_ecartee_at;

-- ── CONSTAT DE PIED ─────────────────────────────────────────────────────────
select
  (select count(*) = 0 from information_schema.columns
     where table_name = 'exercices_retours'
       and column_name = 'citation_composee_ecartee_at')                   as colonne_retiree,
  (select count(*) from exercices_retours)                                 as retours_intacts;

commit;
