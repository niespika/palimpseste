-- ============================================================================
-- C4 · L11 — ROLLBACK de la forme du `cran`.
-- ----------------------------------------------------------------------------
-- ⚠️ CE QU'IL REND, ET CE QU'IL NE REND PAS.
--
--   · Il rend le TYPE `text` aux deux colonnes, et retire les deux `CHECK` de
--     forme. Après lui, la base accepte de nouveau n'importe quelle chaîne dans
--     `exercices.cran` — c'est exactement l'état d'avant, défaut compris.
--
--   · ⛔ IL NE REND PAS LES SIX LIGNES AU CODE. La conversion a écrit leur
--     numéro ; le retour arrière rend le type, pas l'écriture. Ce n'est PAS une
--     perte de donnée — le numéro et le code désignent le même cran, et
--     `exercices_crans` porte la correspondance dans les deux sens — mais il
--     faut le DIRE plutôt que le laisser deviner. La requête commentée en pied
--     de fichier réécrit les codes, si quelqu'un le veut vraiment.
--
--   · ⛔ IL NE TOUCHE PAS au trigger `trg_exercices_cran_selon_le_type` ni à
--     l'absence d'`exercices_cran_chk` : ce sont des objets de C4-L9, et ce lot
--     ne les a jamais touchés. Le drapeau de C4-L9 reste vrai après ce rollback.
--
--   · ⚠️ `exercices_types_crans` est DÉRIVÉE : après ce retour arrière,
--     `scripts/derive-doctrine.py --sql` REÉCRIRAIT des entiers dans une colonne
--     redevenue `text` (Postgres les cast, mais `--verifie` compare en `text`
--     des deux côtés et resterait IDENTIQUE). Pour un retour arrière complet,
--     revenir aussi au dériveur d'avant C4-L11.
-- ============================================================================

begin;

-- ── LE CONSTAT AVANT ────────────────────────────────────────────────────────
select
  (select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices' and column_name = 'cran')
    as type_exercices_cran,
  (select count(*) from public.exercices where cran is not null) as instances_avec_cran;

alter table public.exercices drop constraint if exists exercices_cran_forme_chk;
alter table public.exercices
  alter column cran type text using (cran::text);

alter table public.exercices_types_crans drop constraint if exists exercices_types_crans_cran_chk;
alter table public.exercices_types_crans
  alter column cran type text using (cran::text);

-- ── OPTIONNEL — remettre les codes là où ils étaient ────────────────────────
-- ⚠️ À NE JOUER QUE SI ON VEUT VRAIMENT L'ÉTAT D'AVANT, LIGNE POUR LIGNE. Sans
--    la liste des six identifiants d'origine, cette requête remettrait AU CODE
--    des lignes qui portaient déjà le numéro : elle rendrait un état mêlé
--    DIFFÉRENT de celui d'avant. Elle est donc commentée, à dessein.
-- update public.exercices e set cran = c.code
--   from public.exercices_crans c where e.cran = c.cran::text;

-- ── LE CONSTAT APRÈS ────────────────────────────────────────────────────────
select
  (select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices' and column_name = 'cran')
    as type_exercices_cran,
  (select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'exercices_types_crans' and column_name = 'cran')
    as type_types_crans_cran,
  (select count(*) from pg_constraint where conname = 'exercices_cran_forme_chk')
    as check_de_forme_restant_attendu_0,
  (select count(*) from pg_constraint where conname = 'exercices_cran_chk')
    as exercices_cran_chk_toujours_absent_attendu_0,
  (select count(*) from pg_trigger where tgname = 'trg_exercices_cran_selon_le_type')
    as trigger_de_presence_intact_attendu_1;

commit;
