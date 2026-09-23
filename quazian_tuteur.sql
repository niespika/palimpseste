-- ============================================================================
-- QUAZIAN — EN PARLER AVEC LE TUTEUR APRÈS UNE ERREUR ASSURÉE. 2026-09-23.
-- Demande de Louis après le premier quiz en classe (point 8) : « offrir la
-- possibilité d'avoir une explication avec le tuteur s'il y a eu une réponse
-- fausse avec une forte crédence ». Seuil décidé le 23/09 : 70 points ou plus
-- sur une mauvaise réponse. Le premier message du tuteur est composé PAR LE
-- CODE (décision « Après Thea » du 21/09), sans appel au modèle.
-- Patron : `quazian_antichambre.sql`.
-- ----------------------------------------------------------------------------
-- DEUX gestes, tous deux additifs :
--   1. la porte `scriptorium_params.quazian_tuteur_actif`, à OFF ;
--   2. `scriptorium_conversations.quiz_question_id` (nullable, FK `on delete
--      set null`) : la question de quiz dont la conversation est partie. La
--      route du tuteur en recompose le contexte à CHAQUE tour (suffixe par
--      élève, jamais le préfixe de classe mis en cache). Un index unique
--      partiel empêche deux conversations vivantes pour la même question et le
--      même élève (double clic).
-- Le code lit la porte par `lireLesReglages` (tolérant) et ne lit la colonne que
-- porte ouverte : il peut partir avant ce fichier.
-- ⛔ Aucune policy touchée. ⚠️ La policy élève `conversations_eleve_all` est
--    `for all` : l'élève PEUT écrire lui-même `quiz_question_id` sur ses
--    conversations. La route du tuteur ne s'y fie donc pas : elle revérifie à
--    chaque tour la classe de la question et l'erreur assurée (revue du 23/09).
-- Rollback : `quazian_tuteur_rollback.sql`.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_params) as params_avant,
  (select count(*) from scriptorium_conversations) as conversations_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_params' and column_name = 'quazian_tuteur_actif') as porte_deja_posee,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_conversations' and column_name = 'quiz_question_id') as colonne_deja_posee;

begin;

alter table scriptorium_params
  add column if not exists quazian_tuteur_actif boolean not null default false;

alter table scriptorium_conversations
  add column if not exists quiz_question_id uuid references quazian_questions(id) on delete set null;

create unique index if not exists scriptorium_conversations_quiz_question_unique
  on scriptorium_conversations (eleve_id, quiz_question_id)
  where quiz_question_id is not null and supprime_at is null;

comment on column scriptorium_conversations.quiz_question_id is
  'Question de quiz Quazian dont la conversation est partie (bouton « En parler avec le tuteur » du retour). Lue seulement porte quazian_tuteur_actif ouverte.';

commit;

-- constat de pied
select
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_params' and column_name = 'quazian_tuteur_actif'
              and data_type = 'boolean' and is_nullable = 'NO' and column_default = 'false') as porte_posee,
  not exists (select 1 from scriptorium_params where quazian_tuteur_actif) as porte_a_off,
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_conversations' and column_name = 'quiz_question_id'
              and is_nullable = 'YES') as colonne_posee,
  exists (select 1 from pg_indexes where indexname = 'scriptorium_conversations_quiz_question_unique') as index_pose,
  (select count(*) from scriptorium_conversations where quiz_question_id is not null) as ancrees,  -- attendu 0
  (select count(*) from scriptorium_conversations) as conversations_intactes,
  (select count(*) from scriptorium_params) as params_intacts;
