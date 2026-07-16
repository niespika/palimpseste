-- ============================================================================
-- PLANIFICATION DES EXERCICES — Phase A (additive, NON-CASSANTE).
-- Fichier : plan_evaluation_phase_a.sql
-- ----------------------------------------------------------------------------
-- Lot 1 du chantier « Scriptorium — planification des exercices »
-- (cf. SPEC_scriptorium_planification_exercices.md §4).
--
-- Deux tables neuves (plan annuel d'évaluation par classe + exercices planifiés)
-- + une table de config/gate (scriptorium_params) + DEUX deltas ADDITIFS sur des
-- tables vivantes, tous deux inertes tant qu'aucun code gaté n'écrit :
--   (i)  classes.type_pedagogique (nullable, backfill NULL) — pour la propagation ;
--   (ii) arc bi-source codex_sessions.contenu_id — pour les synthèses de parcours.
--
-- Gate : scriptorium_params.plan_evaluation_actif (défaut false). Tout le chantier
-- reste invisible/inerte tant qu'on ne flippe pas. Lecture tolérante côté code
-- (lireGatePlanActif dégrade en false avant l'exécution de ce script).
--
-- Idempotence : create table/index if not exists ; add column if not exists ;
-- drop policy if exists + create policy ; insert ... on conflict do nothing ;
-- blocs DO/EXCEPTION pour les contraintes sur tables PRÉEXISTANTES.
-- Rejouable sans dommage. AUCUNE donnée existante modifiée.
-- ============================================================================

begin;

-- 1. Gate + réglages prof (table config 1-ligne, patron aletheia_params) --------
-- Table DÉDIÉE (ne pas s'adosser à calendrier_params, dont le .sql est encore
-- « à exécuter » — dépendance d'ordre de migration fragile).
create table if not exists scriptorium_params (
  id                  int primary key default 1 check (id = 1),
  plan_evaluation_actif boolean not null default false,
  -- Réglage prof (D5) : un quiz `concu` apparaît-il au calendrier ÉLÈVE avant
  -- lancement ? false = surprise (défaut), true = annoncé. Lu par le filtre
  -- `surface` de l'émission (E1/E2, lot 3/7).
  quiz_annonce_defaut boolean not null default false,
  updated_at          timestamptz not null default now()
);
insert into scriptorium_params (id) values (1) on conflict (id) do nothing;
-- Idempotent si la table préexiste (rejeu / évolution) :
alter table scriptorium_params add column if not exists plan_evaluation_actif boolean not null default false;
alter table scriptorium_params add column if not exists quiz_annonce_defaut   boolean not null default false;

-- 2. Type pédagogique STRUCTURÉ de la classe (delta additif, D1a) ---------------
-- Pour la PROPAGATION d'un plan (P5) et le hook de création de classe (P6).
-- NULLABLE, backfill NULL : renseigné par le prof (CreerClasse). JAMAIS dérivé de
-- classes.filiere (texte libre — D3). Aucune contrainte NOT NULL, aucune ligne
-- existante modifiée ; inerte tant que le code gaté ne le lit pas.
alter table classes add column if not exists type_pedagogique text
  check (type_pedagogique in ('tc', 'hlp', 'autre'));

-- 3. Plan annuel d'évaluation — 1 ligne par (classe, année scolaire) ------------
create table if not exists scriptorium_plans_evaluation (
  id             uuid primary key default gen_random_uuid(),
  classe_id      uuid not null references classes(id) on delete cascade,
  -- Année scolaire au format ENTIER de la frise (anneeScolaireDe) : 2026 = AY
  -- [2026-08-01, 2027-07-31]. JAMAIS dérivée de classes.annee_scolaire (texte
  -- libre '2025-2026') ni de classes.filiere (PO 3) ; dérivée de date_debut.
  annee_scolaire integer not null,
  gabarit        text not null check (gabarit in ('tc', 'hlp', 'vierge')),
  date_debut     date not null,      -- ancre de génération (date pure, snap frise)
  -- Boutons de génération extensibles sans migration :
  -- { "cycle": ["ecriture","ecriture","lecture"], "compterFragments": "hebdo" }
  config         jsonb not null default '{}',
  statut         text not null default 'brouillon' check (statut in ('brouillon', 'valide')),
  valide_at      timestamptz,
  created_by     uuid references profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),  -- maj applicative (convention repo)
  supprime_at    timestamptz                           -- soft-delete (réservé, P4)
);
-- Un seul plan VIVANT par classe et par année scolaire.
create unique index if not exists uk_plans_evaluation_classe_ay
  on scriptorium_plans_evaluation(classe_id, annee_scolaire) where supprime_at is null;
create index if not exists idx_plans_evaluation_classe on scriptorium_plans_evaluation(classe_id) where supprime_at is null;

-- 4. Exercices planifiés — le créneau + l'état de préparation, pas l'exercice ---
create table if not exists scriptorium_exercices_planifies (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references scriptorium_plans_evaluation(id) on delete cascade,

  -- ── Typologie (§3 du PROMPT — 2 axes + variante + module de conception) ────
  type_exercice text not null check (type_exercice in
    ('ecriture', 'lecture', 'synthese', 'quiz', 'examen_livre', 'fragment', 'essai')),
  diagnostique  boolean not null default false,
  nature        text not null check (nature in ('formatif', 'evaluatif')),
  lieu          text not null check (lieu in ('classe', 'maison')),
  module        text not null check (module in ('quazian', 'codex', 'aletheia', 'fragments')),
  -- Combinaisons du §3 VERROUILLÉES (assouplir = drop/add constraint, additif).
  constraint exercices_typologie_chk check (
       (type_exercice = 'ecriture'     and not diagnostique and nature = 'formatif'  and lieu = 'maison' and module = 'codex')
    or (type_exercice = 'ecriture'     and     diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'codex')
    or (type_exercice = 'lecture'      and not diagnostique and nature = 'formatif'  and lieu = 'maison' and module = 'aletheia')
    or (type_exercice = 'lecture'      and     diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'aletheia')
    or (type_exercice = 'synthese'     and not diagnostique and nature = 'formatif'  and lieu = 'classe' and module = 'codex')
    or (type_exercice = 'quiz'         and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'quazian')
    or (type_exercice = 'examen_livre' and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'aletheia')
    or (type_exercice = 'fragment'     and not diagnostique and nature = 'evaluatif' and lieu = 'maison' and module = 'fragments')  -- fragment ÉCRIT (D11), RÉSERVÉ 0 ligne v1
    or (type_exercice = 'fragment'     and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'fragments')  -- fragment ORAL (D11), RÉSERVÉ 0 ligne v1
    or (type_exercice = 'essai'        and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'fragments')  -- RÉSERVÉ 0 ligne v1
  ),
  fenetre_diagnostique text check (fenetre_diagnostique in ('septembre', 'decembre', 'fevrier')),
  constraint exercices_fenetre_chk check (fenetre_diagnostique is null or diagnostique),

  -- ── Ancrage temporel (arc exclusif — deux régimes, jamais mélangés) ─────────
  ancrage       text not null default 'semaine' check (ancrage in ('semaine', 'parcours')),
  semaine_lundi date,          -- lundi de la semaine d'enseignement visée, DATE PURE, FIGÉE
  constraint exercices_lundi_chk check (semaine_lundi is null or extract(isodow from semaine_lundi) = 1),
  jour_prevu    date,          -- jour précis optionnel (exercices en classe), dans la semaine
  constraint exercices_jour_chk check (
    jour_prevu is null or (semaine_lundi is not null
      and jour_prevu >= semaine_lundi and jour_prevu <= semaine_lundi + 6)
  ),
  -- Matière (référence FACULTATIVE, jamais le timing — PO 1) + bras 'parcours' (synthèse).
  -- RESTRICT = garde-fou ; le flux purgerContenuBiblio le gère AVANT le DELETE (§9.2-7, lot 5).
  parcours_id   uuid references scriptorium_parcours(id)  on delete restrict,
  contenu_id    uuid references scriptorium_contenus(id)  on delete restrict,
  constraint exercices_ancrage_chk check (
       (ancrage = 'semaine'  and semaine_lundi is not null)
    or (ancrage = 'parcours' and semaine_lundi is null and jour_prevu is null
        and parcours_id is not null and contenu_id is not null)
  ),
  constraint exercices_ancrage_parcours_chk check (ancrage = 'semaine' or type_exercice = 'synthese'),

  -- ── Statut de CONCEPTION (l'exécution est dérivée de l'objet lié, jamais stockée) ──
  statut        text not null default 'a_concevoir' check (statut in ('a_concevoir', 'concu', 'annule')),
  concu_at      timestamptz,
  origine       text not null default 'manuel'
                  check (origine in ('cadence', 'diagnostic', 'synthese_auto', 'manuel')),
  -- Ceinture : une ligne 'diagnostic' porte TOUJOURS sa fenêtre (sans quoi
  -- uk_exercices_diagnostic — NULLS DISTINCT — perdrait sa garantie d'idempotence).
  constraint exercices_diag_fenetre_chk check (origine <> 'diagnostic' or fenetre_diagnostique is not null),

  -- ── Liens vers les objets de modules EXISTANTS (une FK par module, additif) ──
  quiz_id           uuid references quazian_quizzes(id) on delete set null,
  codex_session_id  uuid references codex_sessions(id)  on delete set null,
  constraint exercices_lien_module_chk check (
    (quiz_id is null or type_exercice = 'quiz')
    and (codex_session_id is null or type_exercice = 'synthese')
  ),

  duree_estimee_min integer check (duree_estimee_min is null or duree_estimee_min between 1 and 240),
  titre         text,   -- PROF-ONLY : jamais sérialisé élève (anti-spoiler, §8bis)
  note          text,   -- idem
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  supprime_at   timestamptz    -- « retiré du plan » (tombstone)
);

-- Un objet de module ⇔ au plus UN exercice vivant (anti-drift). NB : ces index ne
-- ferment que la course INVERSE (un même quiz revendiqué par DEUX exercices) ; la
-- course « deux onglets créent chacun un quiz pour le MÊME exercice » est fermée
-- par le claim-UPDATE conditionnel (Q2/S4, lots 4/5).
create unique index if not exists uk_exercices_quiz
  on scriptorium_exercices_planifies(quiz_id) where quiz_id is not null and supprime_at is null;
create unique index if not exists uk_exercices_codex_session
  on scriptorium_exercices_planifies(codex_session_id) where codex_session_id is not null and supprime_at is null;
-- Une synthèse vivante par (plan, parcours, cours) — dédup de l'auto-création.
create unique index if not exists uk_exercices_synthese
  on scriptorium_exercices_planifies(plan_id, parcours_id, contenu_id)
  where type_exercice = 'synthese' and supprime_at is null;
-- Idempotence de génération : au plus UNE ligne de cadence par (plan, semaine, type)
-- et UNE ligne diagnostique par (plan, fenêtre, type). Les lignes `annule` vivantes
-- comptent (l'annulation est respectée par la régénération).
create unique index if not exists uk_exercices_cadence
  on scriptorium_exercices_planifies(plan_id, semaine_lundi, type_exercice)
  where origine = 'cadence' and supprime_at is null;
create unique index if not exists uk_exercices_diagnostic
  on scriptorium_exercices_planifies(plan_id, fenetre_diagnostique, type_exercice)
  where origine = 'diagnostic' and supprime_at is null;

create index if not exists idx_exercices_plan_semaine
  on scriptorium_exercices_planifies(plan_id, semaine_lundi) where supprime_at is null;
create index if not exists idx_exercices_a_concevoir
  on scriptorium_exercices_planifies(statut, semaine_lundi) where statut = 'a_concevoir' and supprime_at is null;
create index if not exists idx_exercices_parcours
  on scriptorium_exercices_planifies(parcours_id) where parcours_id is not null;

-- 5. Arc bi-source codex_sessions (2e delta additif sur table vivante) ----------
-- Une synthèse ancrée sur un COURS de bibliothèque (scriptorium_contenus) : la
-- colonne scriptorium_unite_id est NOT NULL aujourd'hui (codex_schema.sql:36) et
-- les cours de parcours vivent dans scriptorium_contenus. Même patron que
-- scriptorium_contenu_images. Inerte tant que le code gaté ne pose pas contenu_id
-- (toutes les lignes existantes satisfont le CHECK : unite_id non null, contenu_id null).
alter table codex_sessions alter column scriptorium_unite_id drop not null;
alter table codex_sessions add column if not exists contenu_id uuid
  references scriptorium_contenus(id) on delete restrict;
do $$ begin
  alter table codex_sessions add constraint codex_sessions_source_chk check (
    (scriptorium_unite_id is not null and contenu_id is null)
    or (scriptorium_unite_id is null and contenu_id is not null)
  );
exception when duplicate_object then null; end $$;

-- 6. RLS — authoring PROF-ONLY strict (patron parcours_phase_a.sql) -------------
-- AUCUNE policy SELECT élève, jamais (faute historique « RLS élève FOR ALL ») :
-- toute lecture au profit d'une surface élève passe par client admin + garde
-- applicative (patron du bloc Aletheia d'assemblerEvenements).
alter table scriptorium_params              enable row level security;
alter table scriptorium_plans_evaluation    enable row level security;
alter table scriptorium_exercices_planifies enable row level security;

drop policy if exists scriptorium_params_prof_all on scriptorium_params;
create policy scriptorium_params_prof_all on scriptorium_params
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists plans_evaluation_prof_all on scriptorium_plans_evaluation;
create policy plans_evaluation_prof_all on scriptorium_plans_evaluation
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists exercices_planifies_prof_all on scriptorium_exercices_planifies;
create policy exercices_planifies_prof_all on scriptorium_exercices_planifies
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;
