-- ============================================================================
-- Aletheia « séances » — Lot 0 : contrat de terminologie (COMMENT ON COLUMN)
-- ----------------------------------------------------------------------------
-- Additif, NON destructif, rejouable. AUCUN renommage de colonne (décision LD1 :
-- rename UI-only, zéro migration sur du travail élève en prod).
-- But : ancrer AU NIVEAU DB que ces colonnes au nom hérité « semaine » sont des
-- ORDINAUX DE SÉANCE (index de découpe d'un livre), pas des semaines calendaires.
-- Migration manuelle (convention repo) : à jouer à la main sur la base.
-- ============================================================================

comment on column scriptorium_documents.semaine is
  'Ordinal de SEANCE : index de decoupe du livre (1..N). PAS une date, PAS une semaine calendaire. Renommage semaines->seances = UI-only, la colonne garde son nom herite.';

comment on column aletheia_travaux.semaine_index is
  'Ordinal de SEANCE du livre (index de decoupe). PAS une semaine calendaire. Contrainte UNIQUE conservee.';

comment on column aletheia_diagnostic.semaine_index is
  'Ordinal de SEANCE du livre (index de decoupe), aligne sur aletheia_travaux.semaine_index. PAS une semaine calendaire.';

-- Bornes de tranche Parcours : elles indexent des SEANCES de livre (pas des
-- semaines de parcours ; la semaine de parcours vit dans la colonne `semaine`).
comment on column scriptorium_parcours_creneaux.livre_semaine_debut is
  'Borne INCLUSE d''une tranche de livre = ordinal de SEANCE (pas une semaine de parcours). null = depuis la premiere seance.';

comment on column scriptorium_parcours_creneaux.livre_semaine_fin is
  'Borne INCLUSE d''une tranche de livre = ordinal de SEANCE (pas une semaine de parcours). null = jusqu''a la derniere seance.';

-- NB : quazian_flashcards.semaine est VOLONTAIREMENT EXCLU. C'est la semaine
-- (hebdomadaire) propre au module Quazian (visibilite classe x semaine, liee a
-- scriptorium_unite_id), PAS un ordinal de seance Aletheia. Ne pas le renommer ici.
