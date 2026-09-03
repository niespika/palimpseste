-- ============================================================================
-- ALETHEIA · ÉTAYAGE PAR NIVEAU — LOT E3 : les gabarits de lecture.
-- 2026-09-03. Spec : `SPEC_Aletheia_Etayage_par_niveau.md` (§ 5, § 9).
-- ----------------------------------------------------------------------------
-- Quatre objets, tous additifs, tous inertes porte fermée :
-- 1. `scriptorium_unites.gabarit_lecture text not null default 'argumentatif'`
--    (check sur les quatre gabarits) + `cycle_tournante jsonb` nullable (clés des
--    questions tournantes dans l'ordre du cycle, D12).
-- 2. `aletheia_travaux.champ_fixe text` + `champ_fixe_vf text` + `tournante_cle text`,
--    nullables sans défaut : la question FIXE du gabarit dialogué (« quelle thèse
--    l'auteur préfère-t-il ? »), V1 puis VF, et la clé de la question tournante
--    posée (figée à la soumission).
-- 3. `aletheia_params.blocs_gabarits jsonb` nullable : overrides prof des blocs de
--    prompt par gabarit (`{ dialogue: { v1: '…' } }`), lus par `blocGabarit`.
-- ⚠️ `aletheia_travaux` et `scriptorium_unites` sont des tables de flux VIVANT
--    (protocole renforcé R6) : colonnes nullables ou à défaut, aucune valeur
--    réécrite, aucune policy touchée. Les `select('*')` existants reçoivent des
--    clés en plus, ignorées. Ordre de déploiement indifférent.
-- Rollback : `aletheia_etayage_l3_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_unites where type = 'livre') as livres_avant,
  (select count(*) from aletheia_travaux) as travaux_avant,
  (select count(*) from information_schema.columns
     where (table_name, column_name) in (('scriptorium_unites','gabarit_lecture'), ('scriptorium_unites','cycle_tournante'),
                                         ('aletheia_travaux','champ_fixe'), ('aletheia_travaux','champ_fixe_vf'), ('aletheia_travaux','tournante_cle'),
                                         ('aletheia_params','blocs_gabarits'))) as colonnes_deja_posees;

begin;

alter table scriptorium_unites
  add column if not exists gabarit_lecture text not null default 'argumentatif'
    check (gabarit_lecture in ('argumentatif', 'dialogue', 'aphoristique', 'analytique')),
  add column if not exists cycle_tournante jsonb;
comment on column scriptorium_unites.gabarit_lecture is
  'Aletheia E3 — gabarit de lecture du livre (utils/aletheia/gabarits.ts) : argumentatif (défaut, = comportement d''avant) | dialogue | aphoristique | analytique. Surchargeable par séance dans la fiche (aletheia_livre_reference.contenu[].gabarit).';
comment on column scriptorium_unites.cycle_tournante is
  'Aletheia E3 — clés des questions tournantes du gabarit, dans l''ordre du cycle (D12 : cycle fixe). NULL = ordre du gabarit.';

alter table aletheia_travaux
  add column if not exists champ_fixe text,
  add column if not exists champ_fixe_vf text,
  add column if not exists tournante_cle text;
comment on column aletheia_travaux.champ_fixe is
  'Aletheia E3 — réponse à la question FIXE du gabarit dialogué (« quelle thèse l''auteur préfère-t-il ? »), version initiale. NULL hors dialogué.';
comment on column aletheia_travaux.champ_fixe_vf is
  'Aletheia E3 — la même, version finale.';
comment on column aletheia_travaux.tournante_cle is
  'Aletheia E3 — clé de la question tournante posée à cette séance (utils/aletheia/gabarits.ts), figée à la soumission V1 pour que le retour IA parle de la même question que le formulaire (mode C compris). NULL = « accord » (comportement d''avant).';

alter table aletheia_params
  add column if not exists blocs_gabarits jsonb;
comment on column aletheia_params.blocs_gabarits is
  'Aletheia E3 — overrides prof des blocs de prompt par gabarit : { dialogue: { v1, vf, diag_inventaire, diag_niveau, reference } … }. NULL ou vide = blocs par défaut du code.';

commit;

-- constat de pied
select
  (select count(*) from information_schema.columns
     where (table_name, column_name) in (('scriptorium_unites','gabarit_lecture'), ('scriptorium_unites','cycle_tournante'),
                                         ('aletheia_travaux','champ_fixe'), ('aletheia_travaux','champ_fixe_vf'), ('aletheia_travaux','tournante_cle'),
                                         ('aletheia_params','blocs_gabarits'))) = 6 as six_colonnes_posees,
  not exists (select 1 from scriptorium_unites where gabarit_lecture <> 'argumentatif') as tous_argumentatifs,
  not exists (select 1 from aletheia_travaux where champ_fixe is not null or champ_fixe_vf is not null) as aucun_champ_fixe,
  (select count(*) from scriptorium_unites where type = 'livre') as livres_intacts,
  (select count(*) from aletheia_travaux) as travaux_intacts;
