-- ============================================================================
-- QUAZIAN — LE RAPPORT DE FRAGILITÉS SE CONSERVE, PAR CLASSE ET DATÉ. 2026-09-23.
-- Louis, 23/09 : « j'ai lancé un diagnostic hier, mais il n'a pas été conservé ».
-- Mesuré : le « Rapport de fragilités » (Quazian → Diagnostic) n'était écrit
-- nulle part — affiché une fois, perdu au rechargement — et il mêlait toutes les
-- classes. Décision de Louis le 23/09 : « par classe et daté ».
-- Patron : `calendrier_agenda_classe.sql`.
-- ----------------------------------------------------------------------------
-- DEUX gestes additifs : la porte `scriptorium_params.quazian_rapport_actif`
-- (OFF) ; la table `quazian_rapports_fragilites` (classe, texte, modèle, coût,
-- date), RLS professeur seul (les élèves n'y ont aucun accès).
-- Le code lit la porte par `lireLesReglages` (tolérant) et ne lit la table que
-- porte ouverte : il peut partir avant ce fichier. Porte fermée, le bouton reste
-- celui d'hier (toutes classes, non conservé).
-- Rollback : `quazian_rapports_fragilites_rollback.sql` (⚠️ rapports perdus).
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_params) as params_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_params' and column_name = 'quazian_rapport_actif') as porte_deja_posee,
  (select count(*) from information_schema.tables where table_name = 'quazian_rapports_fragilites') as table_deja_posee;

begin;

alter table scriptorium_params
  add column if not exists quazian_rapport_actif boolean not null default false;

create table if not exists quazian_rapports_fragilites (
  id         uuid primary key default gen_random_uuid(),
  classe_id  uuid not null references classes(id) on delete cascade,
  contenu    text not null check (length(btrim(contenu)) > 0),
  modele     text,
  cout       numeric,
  created_at timestamptz not null default now()
);
create index if not exists idx_quazian_rapports_classe_date
  on quazian_rapports_fragilites (classe_id, created_at desc);

alter table quazian_rapports_fragilites enable row level security;

drop policy if exists quazian_rapports_prof_all on quazian_rapports_fragilites;
create policy quazian_rapports_prof_all on quazian_rapports_fragilites
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

comment on table quazian_rapports_fragilites is
  'Rapports de fragilités Quazian générés par l''IA, par classe et datés (Diagnostic → Par classe). Professeur seul. Porte quazian_rapport_actif.';

commit;

-- constat de pied
select
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_params' and column_name = 'quazian_rapport_actif'
              and data_type = 'boolean' and is_nullable = 'NO' and column_default = 'false') as porte_posee,
  not exists (select 1 from scriptorium_params where quazian_rapport_actif) as porte_a_off,
  exists (select 1 from pg_policies where tablename = 'quazian_rapports_fragilites'
            and policyname = 'quazian_rapports_prof_all') as rls_prof_posee,
  (select count(*) from pg_policies where tablename = 'quazian_rapports_fragilites') as policies,  -- attendu 1
  (select count(*) from quazian_rapports_fragilites) as rapports,                                  -- attendu 0
  (select count(*) from scriptorium_params) as params_intacts;
