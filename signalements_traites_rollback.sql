-- Retour arrière de signalements_traites.sql — efface le geste « cas traité »
-- (une donnée du professeur, pas un fait élève). À ne jouer que si la table
-- n'est plus lue par le code déployé.
drop table if exists public.exercices_signalements_traites;
