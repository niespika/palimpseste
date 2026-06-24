-- Phase 3 / T3 — détecteur « petits malins » (pilote Fragments)
-- Double passe : (1) heuristique stricte sans IA sur le commentaire au dépôt,
-- (2) champ structuré renvoyé par l'éval IA existante. Les deux signaux sont
-- stockés en JSON { type, motif, source } et affichés au prof (indicatif).

alter table fragments_depots
  add column if not exists signal_integrite jsonb;

alter table fragments_analyses
  add column if not exists signal_integrite jsonb;
