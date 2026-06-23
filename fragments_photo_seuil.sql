-- Phase 3 / T2 — seuil « photo suspecte » éditable par le prof + délai côté prof
-- Le seuil anti-triche (EXIF ancien) était codé en dur (2 jours) dans
-- utils/imageProcessing.ts. On le rend éditable (fragments_config) et on stocke
-- la date EXIF de prise de vue (la plus ancienne photo du dépôt) pour afficher
-- au prof le délai écoulé entre la prise et le dépôt.

-- Seuil en heures (48 h = 2 jours, valeur historique codée en dur).
alter table fragments_config
  add column if not exists seuil_photo_heures int not null default 48;

-- Date EXIF (DateTimeOriginal) de la photo la plus ancienne du dépôt, si lisible.
alter table fragments_depots
  add column if not exists photo_prise_at timestamptz;
