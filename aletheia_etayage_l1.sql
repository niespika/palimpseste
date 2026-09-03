-- ============================================================================
-- ALETHEIA · ÉTAYAGE PAR NIVEAU — LOT E1 : l'interrupteur (à OFF) + la découpe.
-- 2026-09-03. Spec : `SPEC_Aletheia_Etayage_par_niveau.md` (§ 3, § 9).
-- ----------------------------------------------------------------------------
-- 1. `scriptorium_params.aletheia_etayage_actif` boolean NOT NULL DEFAULT false
--    (patron `rag_actif` / `copie_annotee_actif`). Le code la lit par une requête
--    séparée et TOLÉRANTE (`utils/aletheia/decoupage-serveur.ts`) : colonne
--    absente ⇒ OFF. Ordre de déploiement indifférent.
-- 2. Table NEUVE `aletheia_livre_decoupage` : une ligne par livre, la découpe en
--    phrases (bornes en caractères, base 0, fin exclue, dans
--    `scriptorium_documents.texte_extrait`) et son empreinte de version.
--    ⛔ Le texte n'y est JAMAIS recopié : des bornes et des masques seulement.
--    RLS : prof seul (patron `aletheia_livre_reference`) ; le code écrit et lit
--    par le client admin.
-- Additif et gaté : aucune policy existante touchée, aucune table de flux vivant.
-- Rollback : `aletheia_etayage_l1_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_params) as params_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_params' and column_name = 'aletheia_etayage_actif')
    as colonne_deja_posee,
  (select count(*) from information_schema.tables
     where table_name = 'aletheia_livre_decoupage') as table_deja_posee;

begin;

alter table scriptorium_params
  add column if not exists aletheia_etayage_actif boolean not null default false;

create table if not exists aletheia_livre_decoupage (
  scriptorium_livre_id uuid primary key references scriptorium_unites(id) on delete cascade,
  version              text not null,          -- sha256 des texte_extrait du livre, dans l'ordre des semaines
  semaines             jsonb not null,         -- DecoupeSemaine[] (utils/aletheia/decoupage.ts)
  updated_at           timestamptz not null default now()
);
comment on table aletheia_livre_decoupage is
  'Aletheia E1 — découpe en phrases (bornes base 0, fin exclue, dans scriptorium_documents.texte_extrait) + masques (appels de note, numéro de section, césures). Jamais de texte recopié. Périmée quand version ≠ empreinte courante.';

alter table aletheia_livre_decoupage enable row level security;
drop policy if exists aletheia_livre_decoupage_prof_all on aletheia_livre_decoupage;
create policy aletheia_livre_decoupage_prof_all on aletheia_livre_decoupage
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;

-- constat de pied : trois drapeaux
select
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_params' and column_name = 'aletheia_etayage_actif')
    as colonne_posee,
  not exists (select 1 from scriptorium_params where aletheia_etayage_actif) as tout_a_off,
  exists (select 1 from information_schema.tables where table_name = 'aletheia_livre_decoupage')
    as table_posee,
  (select count(*) from aletheia_livre_decoupage) as decoupes;
