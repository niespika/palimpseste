-- ============================================================================
-- PLAN D'ÉVALUATION — Modèle class-agnostique + type bac_blanc (additive, NON-CASSANTE).
-- Fichier : plan_evaluation_modele.sql
-- ----------------------------------------------------------------------------
-- Lot A du chantier « Scriptorium — plan d'évaluation class-agnostique »
-- (cf. SPEC_scriptorium_plan_classe_agnostique.md §4). Fait suite à
-- plan_evaluation_phase_a.sql (les tables d'INSTANCE existent déjà).
--
-- Deux tables neuves (le MODÈLE sans classe + ses exercices) + une colonne de
-- provenance modele_id sur l'instance (inerte, porte du « modèle vivant » futur)
-- + un nouveau type d'exercice bac_blanc (sur l'instance ET le modèle).
--
-- Gate : réutilise scriptorium_params.plan_evaluation_actif (défaut false, posé
-- par plan_evaluation_phase_a.sql). Rien n'est lu tant qu'on ne flippe pas ;
-- lireGatePlanActif dégrade en false avant l'exécution de ce script. AUCUNE
-- policy élève sur les nouvelles tables (authoring PROF-ONLY strict).
--
-- Idempotence : create table/index if not exists ; add column if not exists ;
-- drop constraint/policy if exists + add/create. Les DEUX CHECK de typologie de
-- scriptorium_exercices_planifies (table PRÉEXISTANTE) sont assouplis en
-- drop+add — patron « assouplir = drop/add constraint » (phase_a §4, ligne 88).
-- Rejouable sans dommage. AUCUNE donnée existante modifiée ni détruite.
-- ============================================================================

begin;

-- 1. Le MODÈLE — plan d'évaluation class-agnostique (aucune classe) --------------
-- « Mon plan d'évaluation de l'année », conçu une fois puis ASSIGNÉ à N classes
-- (chaque assignation matérialise une instance indépendante — cf. §5.2, lot D).
-- statut : brouillon (conception) → pret (assignable). PAS d'unicité classe×AY
-- (un modèle n'appartient à aucune classe ; plusieurs modèles/AY sont permis :
-- un TC + un HLP par ex.).
create table if not exists scriptorium_modeles_plan (
  id             uuid primary key default gen_random_uuid(),
  titre          text not null,                       -- ex. « Terminale tronc commun — 2026 »
  -- Année scolaire au format ENTIER de la frise (anneeScolaireDe) : 2026 = AY
  -- [2026-08-01, 2027-07-31]. Dérivée de date_debut, comme l'instance.
  annee_scolaire integer not null,
  gabarit        text not null check (gabarit in ('tc', 'hlp', 'vierge')),
  date_debut     date not null,      -- ancre de génération PAR DÉFAUT (snap frise globale)
  -- Mêmes boutons de génération que l'instance :
  -- { "cycle": ["ecriture","ecriture","lecture"], "compterFragments": "hebdo" }
  config         jsonb not null default '{}',
  statut         text not null default 'brouillon' check (statut in ('brouillon', 'pret')),
  created_by     uuid references profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),  -- maj applicative (convention repo)
  supprime_at    timestamptz                           -- soft-delete
);
create index if not exists idx_modeles_plan_ay
  on scriptorium_modeles_plan(annee_scolaire) where supprime_at is null;

-- 2. Les exercices du MODÈLE — un créneau typé, ni « conçu » ni « lié » -----------
-- Même typologie que l'instance MOINS les colonnes propres à l'instance (statut de
-- conception, concu_at, jour_prevu, quiz_id/codex_session_id, parcours_id/contenu_id).
-- Un exercice de modèle n'est qu'un créneau : type + lieu + semaine (frise globale).
-- Ancrage verrouillé à 'semaine' seul : PAS de bras 'parcours' — les synthèses
-- (ancrage='parcours') sont un concept d'INSTANCE (auto-créées par les hooks à
-- l'assignation), elles ne vivent jamais dans le modèle (§5.5).
create table if not exists scriptorium_modeles_plan_exercices (
  id            uuid primary key default gen_random_uuid(),
  modele_id     uuid not null references scriptorium_modeles_plan(id) on delete cascade,

  -- ── Typologie : copie exacte de exercices_typologie_chk + bac_blanc (§4.3) ──
  type_exercice text not null check (type_exercice in
    ('ecriture', 'lecture', 'synthese', 'quiz', 'examen_livre', 'fragment', 'essai', 'bac_blanc')),
  diagnostique  boolean not null default false,
  nature        text not null check (nature in ('formatif', 'evaluatif')),
  lieu          text not null check (lieu in ('classe', 'maison')),
  module        text not null check (module in ('quazian', 'codex', 'aletheia', 'fragments')),
  constraint modele_exos_typologie_chk check (
       (type_exercice = 'ecriture'     and not diagnostique and nature = 'formatif'  and lieu = 'maison' and module = 'codex')
    or (type_exercice = 'ecriture'     and     diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'codex')
    or (type_exercice = 'lecture'      and not diagnostique and nature = 'formatif'  and lieu = 'maison' and module = 'aletheia')
    or (type_exercice = 'lecture'      and     diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'aletheia')
    or (type_exercice = 'synthese'     and not diagnostique and nature = 'formatif'  and lieu = 'classe' and module = 'codex')       -- inerte : jamais posé dans un modèle (§5.5)
    or (type_exercice = 'quiz'         and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'quazian')
    or (type_exercice = 'examen_livre' and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'aletheia')
    or (type_exercice = 'bac_blanc'    and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'codex')        -- Bac Blanc (classe), conçu dans Codex (§6.2)
    or (type_exercice = 'fragment'     and not diagnostique and nature = 'evaluatif' and lieu = 'maison' and module = 'fragments')    -- fragment ÉCRIT (D11), RÉSERVÉ 0 ligne v1
    or (type_exercice = 'fragment'     and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'fragments')    -- fragment ORAL (D11), RÉSERVÉ 0 ligne v1
    or (type_exercice = 'essai'        and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'fragments')    -- RÉSERVÉ 0 ligne v1
  ),
  fenetre_diagnostique text check (fenetre_diagnostique in ('septembre', 'decembre', 'fevrier')),
  constraint modele_exos_fenetre_chk check (fenetre_diagnostique is null or diagnostique),

  -- ── Ancrage : absolu sur la frise GLOBALE de l'AY. 'semaine' seul (cf. ci-dessus). ──
  ancrage       text not null default 'semaine' check (ancrage in ('semaine')),
  semaine_lundi date,          -- lundi de la semaine visée, DATE PURE, FIGÉE
  constraint modele_exos_lundi_chk check (semaine_lundi is null or extract(isodow from semaine_lundi) = 1),

  origine       text not null default 'manuel' check (origine in ('cadence', 'diagnostic', 'manuel')),
  -- Ceinture (comme l'instance) : une ligne 'diagnostic' porte TOUJOURS sa fenêtre
  -- (sans quoi uk_modele_exos_diagnostic — NULLS DISTINCT — perdrait son idempotence).
  constraint modele_exos_diag_fenetre_chk check (origine <> 'diagnostic' or fenetre_diagnostique is not null),
  -- Ceinture cadence/manuel : un créneau non-diagnostique DOIT vivre sur une semaine
  -- (sinon uk_modele_exos_cadence — NULLS DISTINCT — perdrait son idempotence). Les
  -- diagnostics sont exemptés (ancrés fenêtre ; leur semaine est re-résolue PAR CLASSE
  -- à l'assignation, §5.2). Équivalent modèle de exercices_ancrage_chk de l'instance.
  constraint modele_exos_semaine_chk check (origine = 'diagnostic' or semaine_lundi is not null),

  duree_estimee_min integer check (duree_estimee_min is null or duree_estimee_min between 1 and 240),
  titre         text,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_modele_exos_modele on scriptorium_modeles_plan_exercices(modele_id);
-- Idempotence de génération (miroir de l'instance ; pas de supprime_at ici : les
-- retraits du modèle sont des DELETE durs — aucun tombstone à exclure).
create unique index if not exists uk_modele_exos_cadence
  on scriptorium_modeles_plan_exercices(modele_id, semaine_lundi, type_exercice)
  where origine = 'cadence';
create unique index if not exists uk_modele_exos_diagnostic
  on scriptorium_modeles_plan_exercices(modele_id, fenetre_diagnostique, type_exercice)
  where origine = 'diagnostic';

-- 3. Lien de provenance sur l'INSTANCE (pose la porte du « modèle vivant » futur) -
-- Inerte en v1 : on ne fait qu'ÉTIQUETER l'instance créée par assignerModeleClasse.
-- on delete set null : supprimer un modèle NE détruit PAS les instances déjà
-- matérialisées (elles ont pu diverger / des synthèses ont pu être lancées).
alter table scriptorium_plans_evaluation
  add column if not exists modele_id uuid references scriptorium_modeles_plan(id) on delete set null;

-- 4. Nouveau type bac_blanc sur l'INSTANCE (table préexistante → drop+add) --------
-- Bac Blanc (classe), conçu dans Codex : evaluatif, en classe, non diagnostique.
-- DEUX CHECK à étendre (les deux vivent sur scriptorium_exercices_planifies) :
--   (a) la liste inline auto-nommée de type_exercice ;
--   (b) exercices_typologie_chk (la branche complète 5 axes).
-- Le nouveau CHECK est un SUR-ENSEMBLE de l'ancien → aucune ligne existante n'est
-- invalidée (revalidation immédiate sûre). drop-if-exists + add = rejouable.
-- NB : exercices_lien_module_chk (bac_blanc n'a ni quiz_id ni codex_session_id →
-- deux clauses satisfaites) et exercices_ancrage_parcours_chk (bac_blanc reste
-- ancrage='semaine') n'ont PAS besoin de changer EN v1.
-- ⚠️ Futur : le jour où un chantier Codex « Bac Blanc » voudra PERSISTER un lien
-- (poser codex_session_id sur un bac_blanc), il faudra AUSSI drop+add
-- exercices_lien_module_chk pour élargir le bras codex à
-- type_exercice in ('synthese','bac_blanc') — sans quoi l'INSERT du lien échouera
-- sur ce CHECK. Livrer la colonne/FK SANS ce changement casserait l'écriture
-- (SPEC §6.2 : « ajoutera son FK *_id + le deep-link, additif »).

-- (a) Liste des valeurs autorisées (contrainte inline auto-nommée par Postgres).
alter table scriptorium_exercices_planifies
  drop constraint if exists scriptorium_exercices_planifies_type_exercice_check;
alter table scriptorium_exercices_planifies
  add constraint scriptorium_exercices_planifies_type_exercice_check check (type_exercice in
    ('ecriture', 'lecture', 'synthese', 'quiz', 'examen_livre', 'fragment', 'essai', 'bac_blanc'));

-- (b) Typologie verrouillée : ajout de la branche bac_blanc.
alter table scriptorium_exercices_planifies
  drop constraint if exists exercices_typologie_chk;
alter table scriptorium_exercices_planifies
  add constraint exercices_typologie_chk check (
       (type_exercice = 'ecriture'     and not diagnostique and nature = 'formatif'  and lieu = 'maison' and module = 'codex')
    or (type_exercice = 'ecriture'     and     diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'codex')
    or (type_exercice = 'lecture'      and not diagnostique and nature = 'formatif'  and lieu = 'maison' and module = 'aletheia')
    or (type_exercice = 'lecture'      and     diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'aletheia')
    or (type_exercice = 'synthese'     and not diagnostique and nature = 'formatif'  and lieu = 'classe' and module = 'codex')
    or (type_exercice = 'quiz'         and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'quazian')
    or (type_exercice = 'examen_livre' and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'aletheia')
    or (type_exercice = 'bac_blanc'    and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'codex')        -- NOUVEAU (§6.2)
    or (type_exercice = 'fragment'     and not diagnostique and nature = 'evaluatif' and lieu = 'maison' and module = 'fragments')    -- fragment ÉCRIT (D11), RÉSERVÉ 0 ligne v1
    or (type_exercice = 'fragment'     and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'fragments')    -- fragment ORAL (D11), RÉSERVÉ 0 ligne v1
    or (type_exercice = 'essai'        and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'fragments')    -- RÉSERVÉ 0 ligne v1
  );

-- 5. RLS — authoring PROF-ONLY strict (patron plan_evaluation_phase_a.sql §6) -----
-- AUCUNE policy SELECT élève, jamais : un modèle n'est jamais lu par un élève
-- (les surfaces élève lisent les INSTANCES via client admin + garde applicative).
alter table scriptorium_modeles_plan          enable row level security;
alter table scriptorium_modeles_plan_exercices enable row level security;

drop policy if exists modeles_plan_prof_all on scriptorium_modeles_plan;
create policy modeles_plan_prof_all on scriptorium_modeles_plan
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

drop policy if exists modele_exos_prof_all on scriptorium_modeles_plan_exercices;
create policy modele_exos_prof_all on scriptorium_modeles_plan_exercices
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));

commit;
