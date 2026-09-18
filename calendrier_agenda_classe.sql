-- ============================================================================
-- L'AGENDA DE CLASSE — évènements libres et intitulés d'évaluation (additive, NON-CASSANTE).
-- Fichier : calendrier_agenda_classe.sql   (rollback : calendrier_agenda_classe_rollback.sql)
-- Patron : notions_actif.sql (la porte), calendrier_c7_jours_cours.sql (la table, la RLS).
-- ----------------------------------------------------------------------------
-- Demande de Louis (18/09/2026) : « ajouter des évènements dans le calendrier
-- d'une classe qui ne sont pas nécessairement liés à une évaluation (il faut
-- avoir terminé la lecture de ce livre pour tel jour) » et « donner un nom aux
-- évaluations du plan d'éval, afin que ce soit clair ce qui va se passer et sur
-- quoi porte l'évaluation ».
--
-- Le calendrier ne stockait AUCUN évènement : il projette ce que les modules
-- déclarent (utils/calendrier-evenements.ts). Ce fichier lui donne UNE table
-- propre, `calendrier_evenements`, pour ce qu'aucun module ne porte : une date
-- posée par le professeur, pour une classe, avec un titre. Un évènement pour
-- deux classes = deux lignes (l'écran les crée ensemble).
--
-- L'intitulé d'évaluation, lui, ne crée rien : la colonne
-- `scriptorium_exercices_planifies.titre` existe depuis plan_evaluation_phase_a.sql
-- et n'a jamais été lue ni écrite (mesuré le 18/09 : 0 titre en prod sur 22
-- exercices vivants, 0 sur 12 en bac à sable). Le code la raccorde ; ce fichier
-- n'y touche pas. ⚠️ Arbitrage porté par le code, pas par la base : quand un
-- examen est ANNONCÉ (`annonce`, 14/09), son intitulé est SERVI À L'ÉLÈVE avec la
-- date — c'est le sens de la demande (« sur quoi porte l'évaluation »). Le
-- commentaire « PROF-ONLY » de la colonne date d'avant cette décision.
--
-- Porte : `scriptorium_params.agenda_classe_actif`, à OFF. Fermée, rien ne
-- change : aucun évènement n'est émis (prof comme élève), le formulaire n'est pas
-- proposé, l'intitulé n'est ni saisi ni affiché. Le code lit la colonne par
-- `lireLesReglages` (select *, tolérant) : colonne absente ⇒ OFF — le code peut
-- partir AVANT ce fichier.
-- RLS : prof-only, AUCUNE policy élève (patron plan_evaluation_phase_a.sql) — la
-- surface élève lit par le client admin, la garde applicative filtre par classe
-- et par `visible_eleves`.
-- Idempotent, rejouable, aucune donnée modifiée.
-- ============================================================================

-- constat de tête
select
  (select count(*) from scriptorium_params) as params_avant,
  (select count(*) from information_schema.columns
     where table_name = 'scriptorium_params' and column_name = 'agenda_classe_actif') as porte_deja_posee,
  (select count(*) from information_schema.tables
     where table_name = 'calendrier_evenements') as table_deja_posee;

begin;

alter table scriptorium_params
  add column if not exists agenda_classe_actif boolean not null default false;

create table if not exists calendrier_evenements (
  id             uuid primary key default gen_random_uuid(),
  classe_id      uuid not null references classes(id) on delete cascade,
  date           date not null,                       -- date PURE (jour d'école), pas un instant
  titre          text not null check (length(btrim(titre)) between 1 and 120),
  detail         text check (detail is null or length(detail) <= 1000),
  visible_eleves boolean not null default true,       -- false = note du professeur, calendrier prof seulement
  created_by     uuid references profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  supprime_at    timestamptz                          -- retrait (tombstone), jamais de DELETE
);
create index if not exists idx_calendrier_evenements_classe_date
  on calendrier_evenements(classe_id, date) where supprime_at is null;

alter table calendrier_evenements enable row level security;

drop policy if exists calendrier_evenements_prof_all on calendrier_evenements;
create policy calendrier_evenements_prof_all on calendrier_evenements
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

comment on table calendrier_evenements is
  'Agenda de classe : évènements libres posés par le professeur (lecture à finir, sortie, rappel). Lu par assemblerEvenements (source 6), porte agenda_classe_actif.';

commit;

-- constat de pied : trois drapeaux, plus les témoins
select
  exists (select 1 from information_schema.columns
            where table_name = 'scriptorium_params' and column_name = 'agenda_classe_actif'
              and data_type = 'boolean' and is_nullable = 'NO' and column_default = 'false') as porte_posee,
  not exists (select 1 from scriptorium_params where agenda_classe_actif) as porte_a_off,
  exists (select 1 from pg_policies where tablename = 'calendrier_evenements'
            and policyname = 'calendrier_evenements_prof_all') as rls_prof_posee,
  (select count(*) from calendrier_evenements) as evenements,          -- attendu 0 juste après
  (select count(*) from scriptorium_params) as params_intacts;
