-- ============================================================================
-- C8 · FRAGMENTS — ROLLBACK : le thème reperd ses deux instants.
-- ----------------------------------------------------------------------------
-- ⚠️ N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- ⚠️ CE QU'IL DÉTRUIT : qui a proposé quoi, et quand le professeur a validé. Le
--    TEXTE du thème reste (`theme`, `description`). Après ce rollback, la page
--    Suivi ne distingue plus un thème proposé d'un thème validé, et l'élève ne
--    peut plus écrire le sien (l'action serveur écrit `propose_at`).
-- ============================================================================

-- ── CONSTAT DE TÊTE — À LIRE AVANT D'ALLER PLUS LOIN ────────────────────────
select
  (select count(*) from fragments_themes where propose_at is not null)     as themes_proposes_qui_perdent_leur_date,
  (select count(*) from fragments_themes where valide_at is not null)      as themes_valides_qui_perdent_leur_date,
  (select count(*) from fragments_themes)                                  as themes_avant;

begin;

alter table fragments_themes
  drop column if exists propose_at,
  drop column if exists valide_at;

-- ── CONSTAT DE PIED ─────────────────────────────────────────────────────────
select
  (select count(*) = 0 from information_schema.columns
     where table_name = 'fragments_themes'
       and column_name in ('propose_at', 'valide_at'))                     as colonnes_retirees,
  (select count(*) from fragments_themes)                                  as themes_intacts;

commit;
