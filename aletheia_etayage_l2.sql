-- ============================================================================
-- ALETHEIA · ÉTAYAGE PAR NIVEAU — LOT E2 : la forme servie, journalisée sur le travail.
-- 2026-09-03. Spec : `SPEC_Aletheia_Etayage_par_niveau.md` (§ 7, § 9).
-- ----------------------------------------------------------------------------
-- UNE colonne NULLABLE, sans `default`, sur `aletheia_travaux` : `forme text`
-- ∈ {'montre','fenetre','demi_section'} — la forme d'étayage décidée par le code
-- (`utils/aletheia/forme.ts`) au moment de la soumission V1, porte ouverte
-- seulement. NULL = décidée par rien (porte fermée, ou travail antérieur).
-- ⚠️ `aletheia_travaux` est une table du FLUX VIVANT (protocole renforcé R6) :
--    colonne nullable sans défaut, aucune policy touchée, aucune valeur écrite
--    par cette migration. Le code déployé ne fait aucun `select('*')` sur la
--    table (vérifié par grep) : la colonne est inerte pour lui.
-- Rollback : `aletheia_etayage_l2_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from aletheia_travaux) as travaux_avant,
  (select count(*) from information_schema.columns
     where table_name = 'aletheia_travaux' and column_name = 'forme') as colonne_deja_posee;

begin;

alter table aletheia_travaux
  add column if not exists forme text
    check (forme is null or forme in ('montre', 'fenetre', 'demi_section'));
comment on column aletheia_travaux.forme is
  'Aletheia E2 — forme d''étayage servie pour cette séance (montre | fenetre | demi_section), décidée par le code (utils/aletheia/forme.ts) à la soumission V1, porte aletheia_etayage_actif ouverte. NULL = non décidée.';

commit;

-- constat de pied : trois drapeaux
select
  exists (select 1 from information_schema.columns
            where table_name = 'aletheia_travaux' and column_name = 'forme') as colonne_posee,
  (select is_nullable = 'YES' and column_default is null from information_schema.columns
     where table_name = 'aletheia_travaux' and column_name = 'forme') as nullable_sans_defaut,
  not exists (select 1 from aletheia_travaux where forme is not null) as aucune_forme,
  (select count(*) from aletheia_travaux) as travaux_intacts;
