-- ============================================================================
-- Lot 1 — Modèle de données « classe » (fondation)
-- ----------------------------------------------------------------------------
-- ⚠️  NE PAS EXÉCUTER tant que le code de Phase B n'est pas annoncé complet :
--     ce script fait une TABLE RASE du travail de test et supprime
--     `module_assignments`. Tant que le code n'est pas migré, l'app casserait.
--
-- Ce qu'il fait :
--   * crée les entités  classes / inscriptions / classe_modules
--   * convertit les références « classe » texte → FK uuid vers classes
--   * ajoute inscription_id (élève × classe) au travail élève
--   * efface le travail de test (repart propre) ; conserve comptes, modules,
--     contenu Scriptorium et pool de flashcards partagées
--   * RLS calquée sur Codex (prof = tout ; élève = le sien)
--
-- Conventions reprises de Codex/Quazian : préfixe explicite, RLS inline,
-- écritures IA via service_role (bypass RLS).
-- ============================================================================

begin;

-- ── 1. Entités ──────────────────────────────────────────────────────────────

-- 1.1 Classe — entité à ID stable. Deux classes de même nom mais d'années
--     différentes = deux lignes distinctes (distinguées par annee_scolaire).
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,                                  -- ex. « Terminale HLP »
  niveau text,                                        -- ex. '1ere' | 'terminale'
  filiere text,                                       -- ex. 'HLP' | 'Philo TC'
  annee_scolaire text not null,                       -- ex. '2025-2026'
  statut text not null default 'active'
    check (statut in ('active', 'fermee')),
  created_at timestamptz not null default now()
);

-- 1.2 Inscription — lien plusieurs-à-plusieurs élève ↔ classe.
--     Porte un statut (support du retrait d'élève, Lot 2).
create table if not exists inscriptions (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references profiles(id) on delete cascade,
  classe_id uuid not null references classes(id) on delete cascade,
  statut text not null default 'active'
    check (statut in ('active', 'retiree')),
  created_at timestamptz not null default now(),
  unique (eleve_id, classe_id)
);
create index if not exists idx_inscriptions_eleve on inscriptions(eleve_id);
create index if not exists idx_inscriptions_classe on inscriptions(classe_id);

-- 1.3 Accès module au niveau de la classe. L'accès effectif d'un élève est
--     DÉRIVÉ (élève → inscriptions actives → classe_modules → modules, union).
create table if not exists classe_modules (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid not null references classes(id) on delete cascade,
  module_id uuid not null references modules(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (classe_id, module_id)
);
create index if not exists idx_classe_modules_classe on classe_modules(classe_id);
create index if not exists idx_classe_modules_module on classe_modules(module_id);

-- ── 2. TABLE RASE du travail de test ────────────────────────────────────────
-- Conserve : profiles, modules, scriptorium_unites/documents, flashcards
-- partagées (eleve_id null), fragments_semaines/semestres/epreuves/config.
truncate table
  quazian_review_log, quazian_answers, quazian_sessions, quazian_quiz_scores,
  quazian_questions, quazian_quizzes, quazian_card_states, quazian_publications,
  quazian_semester,
  codex_erreurs, codex_travaux, codex_sessions,
  fragments_photos, fragments_analyses, fragments_pistes, fragments_depots,
  essais_analyses, fragments_essais_photos, fragments_essais,
  fragments_analyses_orales, fragments_oraux, fragments_presentations,
  fragments_syntheses, fragments_themes
restart identity cascade;

-- Flashcards personnelles (Codex) effacées ; pool partagé (eleve_id null) gardé.
delete from quazian_flashcards where eleve_id is not null;

-- ── 3. Références « classe » : texte → FK uuid vers classes ─────────────────
-- On ne convertit que les colonnes activement utilisées par le Lot 1 :
--   * quazian_quizzes.classe_id  → visibilité quizz par classe (corrige 0.3)
--   * codex_sessions.classe_id   → roster + visibilité Codex par classe
-- quazian_publications.classe_id et quazian_semester.classe_id restent en TEXTE
-- legacy (non filtrés en Lot 1 ; le semestre est différé au Lot 5.5).
-- Tables vidées ci-dessus : on recrée la colonne proprement.
alter table quazian_quizzes drop column if exists classe_id;
alter table quazian_quizzes add  column classe_id uuid references classes(id) on delete set null;

alter table codex_sessions  drop column if exists classe_id;
alter table codex_sessions  add  column classe_id uuid references classes(id) on delete set null;

-- scriptorium_unites : on AJOUTE classe_id (FK), en gardant `classe` (texte) en
-- legacy le temps que le Lot 6 (Scriptorium) migre proprement le lien. Ça évite
-- de casser les nombreux affichages qui lisent encore unite.classe.
alter table scriptorium_unites   add  column if not exists classe_id uuid references classes(id) on delete set null;

-- ── 4. Scoping du travail par inscription (élève × classe) ──────────────────
-- eleve_id est conservé (RLS simple) ; inscription_id ajoute la dimension classe
-- → deux inscriptions = deux flux distincts.
alter table fragments_depots        add column if not exists inscription_id uuid references inscriptions(id) on delete cascade;
alter table fragments_themes        add column if not exists inscription_id uuid references inscriptions(id) on delete cascade;
alter table fragments_essais        add column if not exists inscription_id uuid references inscriptions(id) on delete cascade;
alter table fragments_syntheses     add column if not exists inscription_id uuid references inscriptions(id) on delete cascade;
alter table fragments_presentations add column if not exists inscription_id uuid references inscriptions(id) on delete cascade;
alter table fragments_oraux         add column if not exists inscription_id uuid references inscriptions(id) on delete cascade;
alter table quazian_card_states     add column if not exists inscription_id uuid references inscriptions(id) on delete cascade;
alter table quazian_quiz_scores     add column if not exists inscription_id uuid references inscriptions(id) on delete cascade;
alter table quazian_sessions        add column if not exists inscription_id uuid references inscriptions(id) on delete cascade;
alter table quazian_flashcards      add column if not exists inscription_id uuid references inscriptions(id) on delete cascade;
alter table codex_travaux           add column if not exists inscription_id uuid references inscriptions(id) on delete cascade;
alter table codex_erreurs           add column if not exists inscription_id uuid references inscriptions(id) on delete cascade;

create index if not exists idx_fragments_depots_inscription on fragments_depots(inscription_id);
create index if not exists idx_fragments_themes_inscription on fragments_themes(inscription_id);
create index if not exists idx_quazian_card_states_inscription on quazian_card_states(inscription_id);

-- ── 4bis. Unicité : « par élève » → « par inscription » ─────────────────────
-- Le schéma de base portait des contraintes uniques sur eleve_id (ex.
-- fragments_themes unique(eleve_id), upsert onConflict 'eleve_id'). Un élève
-- bi-classe a désormais DEUX jeux de fragments → ces uniques casseraient le
-- second insert. On retire toute contrainte unique impliquant eleve_id sur les
-- tables de travail concernées, puis on pose l'unicité par inscription. Sans
-- danger : les tables ont été vidées ci-dessus.
do $$
declare r record;
begin
  for r in
    select rel.relname, con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where con.contype = 'u'
      and nsp.nspname = 'public'
      and rel.relname in ('fragments_themes','fragments_depots','fragments_essais','fragments_syntheses')
      and exists (
        select 1 from unnest(con.conkey) ck
        join pg_attribute att on att.attrelid = con.conrelid and att.attnum = ck
        where att.attname = 'eleve_id'
      )
  loop
    execute format('alter table %I drop constraint %I', r.relname, r.conname);
  end loop;
end $$;

alter table fragments_themes    drop constraint if exists fragments_themes_inscription_key;
alter table fragments_themes    add  constraint fragments_themes_inscription_key            unique (inscription_id);
alter table fragments_depots    drop constraint if exists fragments_depots_inscription_semaine_key;
alter table fragments_depots    add  constraint fragments_depots_inscription_semaine_key    unique (inscription_id, semaine_id);
alter table fragments_essais    drop constraint if exists fragments_essais_inscription_epreuve_key;
alter table fragments_essais    add  constraint fragments_essais_inscription_epreuve_key    unique (inscription_id, epreuve_id);
alter table fragments_syntheses drop constraint if exists fragments_syntheses_inscription_semestre_key;
alter table fragments_syntheses add  constraint fragments_syntheses_inscription_semestre_key unique (inscription_id, semestre_id);

-- ── 5. RLS des nouvelles tables ─────────────────────────────────────────────
alter table classes        enable row level security;
alter table inscriptions   enable row level security;
alter table classe_modules enable row level security;

-- 5.1 classes : prof = tout ; élève = lecture des classes où il est inscrit
drop policy if exists classes_prof_all on classes;
create policy classes_prof_all on classes
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists classes_eleve_read on classes;
create policy classes_eleve_read on classes
  for select
  using (exists (
    select 1 from inscriptions i
    where i.classe_id = classes.id and i.eleve_id = auth.uid() and i.statut = 'active'
  ));

-- 5.2 inscriptions : prof = tout ; élève = ses propres inscriptions (lecture)
drop policy if exists inscriptions_prof_all on inscriptions;
create policy inscriptions_prof_all on inscriptions
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists inscriptions_eleve_read on inscriptions;
create policy inscriptions_eleve_read on inscriptions
  for select
  using (eleve_id = auth.uid());

-- 5.3 classe_modules : prof = tout ; élève = lecture (nécessaire à l'accès dérivé)
drop policy if exists classe_modules_prof_all on classe_modules;
create policy classe_modules_prof_all on classe_modules
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists classe_modules_eleve_read on classe_modules;
create policy classe_modules_eleve_read on classe_modules
  for select
  using (exists (
    select 1 from inscriptions i
    where i.classe_id = classe_modules.classe_id and i.eleve_id = auth.uid() and i.statut = 'active'
  ));

-- ── 5bis. RLS Quazian : visibilité des quizz par classe (corrige Lot 0.3) ────
-- Politiques permissives additionnelles (OR avec l'existant) : l'élève peut lire
-- un quizz lancé/fermé d'une de ses classes et ses questions, et gérer sa propre
-- session/réponses/score. C'est ce qui manquait pour que la passation marche.
alter table quazian_quizzes     enable row level security;
alter table quazian_questions   enable row level security;
alter table quazian_sessions    enable row level security;
alter table quazian_answers     enable row level security;
alter table quazian_quiz_scores enable row level security;

drop policy if exists quazian_quizzes_eleve_classe on quazian_quizzes;
create policy quazian_quizzes_eleve_classe on quazian_quizzes
  for select
  using (
    statut in ('lance', 'ferme')
    and exists (
      select 1 from inscriptions i
      where i.classe_id = quazian_quizzes.classe_id
        and i.eleve_id = auth.uid() and i.statut = 'active'
    )
  );

drop policy if exists quazian_questions_eleve_classe on quazian_questions;
create policy quazian_questions_eleve_classe on quazian_questions
  for select
  using (
    exists (
      select 1 from quazian_quizzes q
      join inscriptions i on i.classe_id = q.classe_id
      where q.id = quazian_questions.quiz_id
        and q.statut in ('lance', 'ferme')
        and i.eleve_id = auth.uid() and i.statut = 'active'
    )
  );

drop policy if exists quazian_sessions_eleve_own on quazian_sessions;
create policy quazian_sessions_eleve_own on quazian_sessions
  for all using (eleve_id = auth.uid()) with check (eleve_id = auth.uid());

drop policy if exists quazian_quiz_scores_eleve_own on quazian_quiz_scores;
create policy quazian_quiz_scores_eleve_own on quazian_quiz_scores
  for all using (eleve_id = auth.uid()) with check (eleve_id = auth.uid());

drop policy if exists quazian_answers_eleve_own on quazian_answers;
create policy quazian_answers_eleve_own on quazian_answers
  for all
  using (exists (select 1 from quazian_sessions s where s.id = quazian_answers.session_id and s.eleve_id = auth.uid()))
  with check (exists (select 1 from quazian_sessions s where s.id = quazian_answers.session_id and s.eleve_id = auth.uid()));

-- ── 6. Retrait de l'ancien modèle d'accès par élève ─────────────────────────
-- L'accès n'est plus stocké par élève : il est dérivé de la classe.
drop table if exists module_assignments;

-- NB : profiles.classe (texte libre) est CONSERVÉE temporairement comme champ
-- legacy (plus écrite ; remplacée par les inscriptions). Elle sera retirée dans
-- une passe de nettoyage une fois tous les affichages migrés.

commit;

-- ============================================================================
-- Après exécution : créer une/des classe(s) et inscrire l'élève via l'interface
-- prof, puis réaffecter l'unité Scriptorium à une classe et donner l'accès aux
-- modules par classe. (Aucune donnée de classe n'est seedée ici.)
-- ============================================================================
