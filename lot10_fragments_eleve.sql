-- ============================================================================
-- Lot 10 — Fragments élève (page restructurée)
-- ----------------------------------------------------------------------------
-- Deux ajouts additifs :
--  1) Gate de lecture : l'élève doit valider qu'il a lu le retour de son dernier
--     fragment avant de pouvoir en déposer un nouveau. On horodate la lecture.
--  2) Anti-triche photo (couche 2) : au dépôt, l'EXIF DateTimeOriginal est
--     comparé à l'horloge de l'appareil ; un écart important (photo recyclée de
--     la galerie) marque le dépôt comme « à signaler ».
-- ============================================================================

begin;

-- 1. Gate de lecture du retour (par analyse de fragment écrit).
alter table fragments_analyses
  add column if not exists retour_lu_at timestamptz;

-- 2. Signal anti-triche au niveau du dépôt (au moins une photo suspecte).
alter table fragments_depots
  add column if not exists photos_suspectes boolean not null default false;

commit;
