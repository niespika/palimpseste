-- ============================================================================
-- ALETHEIA · ÉTAYAGE PAR NIVEAU — LOT E8 : la liseuse plafonnée par livre.
-- 2026-09-03. Spec : `SPEC_Aletheia_Etayage_par_niveau.md` (§ 8.4, § 9).
-- ----------------------------------------------------------------------------
-- Une colonne additive, nullable sans défaut, inerte porte fermée :
--   `scriptorium_unites.liseuse_max text` — 'fenetre' | 'demi_section' ; NULL = demi_section.
--   Sur une traduction encore protégée, le prof règle 'fenetre' : la forme A (la moitié de
--   la section) n'est jamais servie pour ce livre, la fenêtre de 400 mots la remplace.
-- ⚠️ `scriptorium_unites` est une table de flux vivant (protocole R6) : aucune valeur
--    réécrite, aucune policy touchée ; les `select('*')` reçoivent une clé en plus.
-- Rollback : `aletheia_etayage_l8_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_unites) as unites_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_unites' and column_name = 'liseuse_max') as colonne_deja_posee;

begin;

alter table scriptorium_unites
  add column if not exists liseuse_max text
    constraint scriptorium_unites_liseuse_max_check check (liseuse_max in ('fenetre', 'demi_section'));
comment on column scriptorium_unites.liseuse_max is
  'Aletheia E8 — plafond de la liseuse intégrée pour ce livre : fenetre (400 mots) ou demi_section (défaut, NULL). Réglé par le prof sur une traduction protégée.';

commit;

-- constat de pied
select
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_unites' and column_name = 'liseuse_max') = 1 as colonne_posee,
  not exists (select 1 from scriptorium_unites where liseuse_max is not null) as aucune_valeur,
  (select count(*) from scriptorium_unites) as unites_intactes;
