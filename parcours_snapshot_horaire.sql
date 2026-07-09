-- ============================================================================
-- Parcours — Snapshot d'horaire figé par (parcours, classe). Décision PO 3.
-- Additif sur scriptorium_parcours_classes (aucune donnée touchée).
-- ----------------------------------------------------------------------------
-- L'aperçu prof continue de RECALCULER les dates depuis la frise à la lecture.
-- En plus, le prof peut « publier » l'horaire résolu : on en fige une copie
-- (horaire_snapshot). L'écart entre le snapshot et la frise recalculée devient
-- alors un signal actionnable (« N échéances décalées depuis la publication »),
-- utile quand la future consommation élève affichera ces dates.
-- ============================================================================

begin;

alter table scriptorium_parcours_classes
  add column if not exists horaire_snapshot  jsonb,        -- [{ semaine, dateReelle, statut, semestreNom, pedaDansSemestre }]
  add column if not exists snapshot_version   integer not null default 0,
  add column if not exists snapshot_genere_le timestamptz;

commit;
