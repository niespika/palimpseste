-- ============================================================================
-- C4 · L15 — RETRAIT DU DÉCOR DE RECETTE.
-- ----------------------------------------------------------------------------
-- ⭐ Tout ce que `c4_l15_decor_recette.sql` a semé porte un `id_import` préfixé
--    `ex-c4l15-` ou `mat-c4l15-` : le retrait ne devine rien, il nomme.
-- ⛔ IL NE TOUCHE À AUCUN MATÉRIAU PRÉEXISTANT. Le décor de C4-L15 réutilise
--    `mat-garant-a`, qui est du décor de C4-L8 : il reste.
-- ⚠️ L'ordre suit les clés étrangères — dépôts, cas, instances, matériau.
-- ============================================================================

begin;

delete from exercices_depots d
 using exercices e
 where d.exercice_id = e.id and e.id_import like 'ex-c4l15-%';

delete from exercices_cas c
 using exercices e
 where c.exercice_id = e.id and e.id_import like 'ex-c4l15-%';

delete from exercices where id_import like 'ex-c4l15-%';

delete from exercices_materiaux where id_import like 'mat-c4l15-%';

commit;

-- Attendu après : les quatre comptes à zéro.
-- select (select count(*) from exercices where id_import like 'ex-c4l15-%')         as instances,
--        (select count(*) from exercices_materiaux where id_import like 'mat-c4l15-%') as materiaux;
