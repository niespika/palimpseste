-- ============================================================================
-- C8 · FRAGMENTS — ROLLBACK : le thème reperd le commentaire du professeur.
-- ----------------------------------------------------------------------------
-- ⚠️ N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ⚠️ CE QU'IL DÉTRUIT : le TEXTE des commentaires laissés par le professeur et
--    leur instant. Le thème, sa proposition et sa validation restent. Après ce
--    rollback, le bouton « Commenter » de Suivi échoue (la colonne n'existe
--    plus) et l'élève ne voit plus aucun commentaire.
-- ============================================================================

-- ── CONSTAT DE TÊTE — À LIRE AVANT D'ALLER PLUS LOIN ────────────────────────
select
  (select count(*) from fragments_themes where commente_at is not null)   as commentaires_qui_partent,
  (select count(*) from fragments_themes)                                  as themes_avant;

begin;

alter table fragments_themes
  drop column if exists commentaire_prof,
  drop column if exists commente_at;

-- ── CONSTAT DE PIED ─────────────────────────────────────────────────────────
select
  (select count(*) = 0 from information_schema.columns
     where table_name = 'fragments_themes'
       and column_name in ('commentaire_prof', 'commente_at'))             as colonnes_retirees,
  (select count(*) from fragments_themes)                                  as themes_intacts;

commit;
