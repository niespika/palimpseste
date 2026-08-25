-- ============================================================================
-- C4 · L15 — RETOUR ARRIÈRE de `c4_l15_doctrine_marquage_longueur.sql`.
-- ----------------------------------------------------------------------------
-- ⚠️ CE QU'IL DÉTRUIT : deux colonnes DÉRIVÉES, et rien d'autre. Il ne perd
--    aucune donnée saisie — ce que ces colonnes portent se ré-engendre à la
--    demande depuis le `02-`, par `scripts/derive-doctrine.py --sql`.
--
-- ⚠️ CE QU'IL FAUT SAVOIR AVANT DE LE JOUER. Le code de C4-L15 lit ces deux
--    colonnes par `select *` (`utils/fabrique/doctrine.ts`) et par un `select`
--    nommé (`utils/deroule/vue.ts`). Le second REFUSERAIT de lire une colonne
--    absente : le déroulé élève tomberait. **Retirer le code d'abord, la
--    colonne ensuite** — l'ordre inverse de la pose.
--    *Si l'on veut seulement défaire la DONNÉE sans défaire la colonne :
--     `update exercices_crans set marquage = null, longueur = null;` suffit, et
--     l'écran retrouve exactement son comportement d'avant le lot.*
-- ============================================================================

begin;

alter table exercices_crans
  drop column if exists marquage,
  drop column if exists longueur;

commit;
