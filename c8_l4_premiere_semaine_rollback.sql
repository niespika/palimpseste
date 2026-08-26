-- ============================================================================
-- C8 · L4 — ROLLBACK de la première semaine comptée par Fragments.
-- ----------------------------------------------------------------------------
-- ⛔ IL DROPPE UNE COLONNE QUI PORTE DE LA SAISIE HUMAINE.
--   `semesters.fragments_premiere_semaine` se règle à l'écran
--   (`/prof/calendrier/config`, section Semestres). La dropper PERD le réglage
--   des semestres vivants — deux nombres, mais deux nombres que personne ne
--   retrouvera. Le `select` de tête les relève : **recopier sa sortie ailleurs
--   avant de continuer.**
--
-- ⚠️ L'ORDRE EST L'INVERSE DE LA MIGRATION : CODE D'ABORD, SQL ENSUITE.
--   La migration pose SQL puis code, parce qu'une colonne additive est
--   invisible au code ancien. Le retrait, lui, marche dans l'autre sens : tant
--   que le code déployé LIT la colonne, la dropper fait échouer ses `select` et
--   les écrans de Fragments, du tableau de bord élève et du panoptique
--   concluent « aucun semestre ». **Revenir au code d'avant le lot d'abord ;
--   dropper la colonne ensuite.**
--
-- ⭐ ET IL Y A PRESQUE TOUJOURS PLUS DOUX QUE CE FICHIER.
--   Le lot a un état neutre, et il est atteignable sans toucher au schéma :
--   remettre les semestres à `1` rend EXACTEMENT le comportement d'avant le lot
--   (toutes les semaines de travail comptent, depuis la première). C'est le
--   `update` commenté ci-dessous — une ligne, réversible, sans redéploiement.
--   Ne dropper la colonne que si l'on retire vraiment le lot du dépôt.
-- ============================================================================

begin;

-- ── Ce qui va être perdu — RECOPIER CETTE SORTIE AVANT DE CONTINUER ─────────
select id, name, start_date, end_date, archived_at, fragments_premiere_semaine
  from semesters
 where fragments_premiere_semaine <> 1
 order by start_date;

-- ── Le repli DOUX, sans toucher au schéma (décommenter et s'arrêter là) ─────
-- update semesters set fragments_premiere_semaine = 1;

-- ── Le retrait franc ────────────────────────────────────────────────────────
alter table semesters
  drop constraint if exists semesters_fragments_premiere_semaine_check;

alter table semesters
  drop column if exists fragments_premiere_semaine;

-- ── Constat APRÈS ───────────────────────────────────────────────────────────
select
  (select count(*)
     from information_schema.columns
    where table_name  = 'semesters'
      and column_name = 'fragments_premiere_semaine')                as colonne_restante,
  (select count(*)
     from pg_constraint
    where conname = 'semesters_fragments_premiere_semaine_check')    as check_restant;

commit;
