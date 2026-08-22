-- ============================================================================
-- C4 · L1 — RETOUR ARRIÈRE du seed. N'EXÉCUTER QU'EN CAS DE PROBLÈME.
-- Fichier : c4_l1_seed_rollback.sql — annule `c4_l1_seed.sql`.
-- ----------------------------------------------------------------------------
-- Retire les quinze lignes du seed : les treize objets et les deux types
-- diagnostiques. NON DESTRUCTIF DE FAIT tant
-- qu'aucune instance ne s'y accroche : `exercices.type_id` est en
-- `on delete restrict` — s'il existe une seule instance sur un type, le DELETE
-- ÉCHOUE plutôt que d'emporter quoi que ce soit. C'est voulu.
-- ⚠️ Le bloc de constat en tête compte ce qui va partir et ce qui bloquera.
-- ============================================================================

-- ── CONSTAT AVANT — À LIRE ─────────────────────────────────────────────────
select t.code,
       (select count(*) from exercices e where e.type_id = t.id)              as instances,
       (select count(*) from exercices_types_crans c where c.type_id = t.id)  as lignes_axe_cran,
       (select count(*) from exercices_types_modes m where m.type_id = t.id)  as lignes_axe_competence
  from exercices_types t order by t.code;

begin;

-- Les deux axes de déclaration partent par cascade (`on delete cascade`).
delete from exercices_types where code in (
  -- les treize objets
  'problematisation','transition','argument','objection','exemple','reference','plan',
  'introduction','conclusion','mot','phrase','paragraphe','partie',
  -- les deux types diagnostiques (nature `complet`)
  'diagnostic_essai','diagnostic_explication_texte');

commit;

-- ── VÉRIFICATION APRÈS ─────────────────────────────────────────────────────
select count(*) = 0 as les_quinze_lignes_du_seed_retirees, count(*) as reste
  from exercices_types where code in (
    'problematisation','transition','argument','objection','exemple','reference','plan',
    'introduction','conclusion','mot','phrase','paragraphe','partie',
    'diagnostic_essai','diagnostic_explication_texte');
