-- ============================================================================
-- QUAZIAN — L'ANTICHAMBRE ET LE LANCEMENT EN DEUX TEMPS. 2026-09-22.
-- Demande de Louis après le premier quiz en classe (T5, 22/09) : « avant que le
-- quiz ne se lance, une antichambre qui dit aux élèves ce qu'ils vont devoir
-- faire » ; « je dois être informé du nombre d'élèves dans l'antichambre, et
-- déclencher le quiz quand il y a le bon nombre ».
-- Patron : `calendrier_agenda_classe.sql`, `notions_actif.sql`.
-- ----------------------------------------------------------------------------
-- TROIS gestes, tous additifs :
--   1. la porte `scriptorium_params.quazian_antichambre_actif`, à OFF ;
--   2. `quazian_quizzes.antichambre_at` (nullable) : l'instant où le professeur
--      ouvre l'antichambre. ⭐ Le STATUT ne bouge pas — il reste `brouillon`
--      jusqu'au lancement. Un statut neuf aurait heurté le CHECK du socle
--      (`quazian_quizzes_statut_check` : brouillon | lance | ferme) et la policy
--      élève (`lance | ferme`), et cassé sept lecteurs (relevé du 22/09).
--      `initialiserSession` refuse déjà un brouillon : aucune question ne sort
--      de l'antichambre, par construction.
--   3. la table `quazian_antichambre` : qui est là. `vu_at` est rafraîchi par
--      l'écran de l'élève pendant qu'il attend ; « présent » = vu récemment.
--
-- Le code lit la porte par `lireLesReglages` (tolérant : colonne absente ⇒ OFF)
-- et ne lit `antichambre_at` et la table QUE porte ouverte : il peut partir
-- avant ce fichier. Porte fermée, le lancement reste celui d'hier, à l'octet.
-- ⛔ Aucune policy existante touchée. La table neuve n'a AUCUNE policy : elle
--    s'écrit et se lit par le service-role, derrière les gardes du code (classe
--    de l'élève, rôle du professeur) — patron `c1_rls_eleve.sql`.
-- Rollback : `quazian_antichambre_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_params) as params_avant,
  (select count(*) from quazian_quizzes) as quizz_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_params' and column_name = 'quazian_antichambre_actif') as porte_deja_posee,
  (select count(*) from information_schema.columns
     where table_name = 'quazian_quizzes' and column_name = 'antichambre_at') as colonne_deja_posee,
  (select count(*) from information_schema.tables
     where table_name = 'quazian_antichambre') as table_deja_posee;

begin;

alter table scriptorium_params
  add column if not exists quazian_antichambre_actif boolean not null default false;

alter table quazian_quizzes
  add column if not exists antichambre_at timestamptz;

create table if not exists quazian_antichambre (
  quiz_id   uuid not null references quazian_quizzes(id) on delete cascade,
  eleve_id  uuid not null references profiles(id) on delete cascade,
  arrive_at timestamptz not null default now(),
  vu_at     timestamptz not null default now(),
  primary key (quiz_id, eleve_id)
);

alter table quazian_antichambre enable row level security;

comment on column quazian_quizzes.antichambre_at is
  'Instant où le professeur a ouvert l''antichambre. Le statut reste brouillon jusqu''au lancement ; lu seulement porte quazian_antichambre_actif ouverte.';
comment on table quazian_antichambre is
  'Présence des élèves dans l''antichambre d''un quiz : vu_at rafraîchi par l''écran d''attente. Service-role seulement (aucune policy).';

commit;

-- constat de pied : trois drapeaux, plus les témoins
select
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_params' and column_name = 'quazian_antichambre_actif'
              and data_type = 'boolean' and is_nullable = 'NO' and column_default = 'false') as porte_posee,
  not exists (select 1 from scriptorium_params where quazian_antichambre_actif) as porte_a_off,
  exists (select 1 from information_schema.columns
            where table_name = 'quazian_quizzes' and column_name = 'antichambre_at'
              and is_nullable = 'YES') as colonne_posee,
  (select relrowsecurity from pg_class where relname = 'quazian_antichambre') as rls_active,
  (select count(*) from pg_policies where tablename = 'quazian_antichambre') as policies,   -- attendu 0
  (select count(*) from quazian_antichambre) as presences,                                  -- attendu 0
  (select count(*) from quazian_quizzes where antichambre_at is not null) as antichambres,  -- attendu 0
  (select count(*) from quazian_quizzes) as quizz_intacts,
  (select count(*) from scriptorium_params) as params_intacts;
