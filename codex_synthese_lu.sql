-- Phase 3 / Codex — validation « lu » du retour (T4)
-- L'élève marque son retour de synthèse comme lu. Tant que non lu (et retour
-- validé par le prof) : « à faire » côté élève + signal diagnostique côté prof.
-- Pattern miroir de retour_lu_at (Fragments) / retour_vf_lu_at (Aletheia).

alter table codex_travaux
  add column if not exists synthese_lu_at timestamptz;

-- (Aucune politique RLS à ajouter : l'écriture passe par le client admin côté
--  serveur, comme le reste du flux Codex élève.)
