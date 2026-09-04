-- Rollback de `c7_l5_fiches_objets.sql` : la table dérivée se retire sans perte
-- (elle se rederive de `09-Objets.md`). Aucune autre table ne la référence.
drop table if exists exercices_fiches_objets;
