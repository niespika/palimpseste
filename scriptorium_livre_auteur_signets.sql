-- Livre Aletheia : nom d'auteur + signets (table des matières du PDF).
--
-- auteur  : affiché à côté du titre (prof + élève). Saisi à la création, éditable.
-- signets : métadonnée capturée à l'import d'un PDF (table des matières / outline,
--           [{titre, page, niveau}]) QUAND elle existe. Non utilisée pour l'instant —
--           gardée pour une future présentation/navigation du texte (le PDF étant
--           jeté après création, c'est la seule fenêtre pour la capturer). RLS : ces
--           colonnes suivent celle de scriptorium_unites (déjà en place).

alter table scriptorium_unites  add column if not exists auteur  text;
alter table scriptorium_unites  add column if not exists signets jsonb;

-- Stockage transitoire des signets pendant la session de découpe (comme `pages`).
alter table scriptorium_imports add column if not exists signets jsonb;
