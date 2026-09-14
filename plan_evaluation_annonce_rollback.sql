-- Rollback de plan_evaluation_annonce.sql — n'exécuter qu'en cas de problème.
-- Retire la colonne `annonce` et son CHECK. Les annonces posées par le prof sont
-- PERDUES (l'élève cesse de voir les examens annoncés) ; rien d'autre ne bouge.
-- ⚠️ Le code qui lit/écrit `annonce` doit être RETIRÉ (déployé) AVANT ce fichier,
-- sinon chaque écriture du plan tombe en erreur « column annonce does not exist ».
begin;
alter table scriptorium_exercices_planifies drop constraint if exists exercices_annonce_chk;
alter table scriptorium_exercices_planifies drop column if exists annonce;
commit;
