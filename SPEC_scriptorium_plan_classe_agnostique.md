# SPEC — Scriptorium : plan d'évaluation **class-agnostique**
## (modèle → assignation par classe → instances ajustables) + 3 exercices manquants

> **Statut** : à implémenter (Code). Additif, gaté par `scriptorium_params.plan_evaluation_actif`.
> **Prérequis lu** : `plan_evaluation_phase_a.sql`, `app/prof/scriptorium/evaluations/*`,
> `app/prof/scriptorium/parcours/*`, `PROMPT_Scriptorium_planification_exercices.md`,
> `SPEC_scriptorium_planification_exercices.md`.

---

## 0. Résumé exécutif

Aujourd'hui un **plan d'évaluation** naît lié à une classe (`scriptorium_plans_evaluation.classe_id NOT NULL`).
Pour « une conception → plusieurs classes », il n'existe que la **propagation** (`propagerPlan`),
qui *copie* le gabarit en plans indépendants.

On inverse le flux pour coller au raisonnement réel du prof :

1. **Concevoir** un *modèle* de plan **sans classe** (« mon plan d'évaluation de l'année »).
2. **Assigner** ce modèle à une ou plusieurs classes → chaque classe reçoit une **instance** de plan.
3. **Ajuster** l'instance de chaque classe (ajout/retrait/déplacement d'exercices), comme aujourd'hui.

C'est **exactement le patron déjà en place pour les parcours** (`scriptorium_parcours` class-agnostique →
`scriptorium_parcours_classes` avec `date_debut` par classe → publication). Le plan d'évaluation devient
ainsi symétrique de son objet frère et réutilise la mécanique éprouvée.

On ajoute aussi **3 types d'exercices** à la palette « + Ajouter… » :
**écriture diagnostique (classe)**, **lecture diagnostique (classe)** (déjà autorisés par le `CHECK`,
juste non exposés), et **Bac Blanc (classe)** — nouveau type, conçu dans **Codex**.

---

## 1. Contexte & problème

| | **Parcours** (déjà bon) | **Plan d'évaluation** (à corriger) |
|---|---|---|
| Objet de conception | `scriptorium_parcours` — **pas de `classe_id`** | `scriptorium_plans_evaluation` — **`classe_id NOT NULL`** |
| Ancrage temporel | semaines **relatives** (`creneau.semaine` = 1,2,3…) | dates **absolues** (`semaine_lundi`) |
| « Une conception → N classes » | assignation via `scriptorium_parcours_classes` (+ `date_debut` par classe, snapshot) | **propagation** = N copies indépendantes créées d'emblée liées à une classe |
| Point d'entrée | on crée l'objet, **puis** on choisit les classes | on **doit** choisir la classe d'abord |

Conséquence : les deux objets de planification de Scriptorium se conçoivent selon deux modèles mentaux
opposés, et le plan force un choix de classe avant même d'avoir pensé l'année.

**Précision importante (simplification cachée)** : dans cette app, la **frise des semaines
d'enseignement est GLOBALE** (dérivée de la table `semesters`, non par classe — cf.
`construireFrise` / `semainesCouvertes`). Le **seul** paramètre réellement par classe est :
- la **date d'ancrage** `date_debut` (quand le plan de *cette* classe démarre), et
- le **jour** d'un exercice **en classe** (`jour_prevu`) — **choisi par le prof** parmi les jours de
  cours de la classe (**sans défaut** : l'exercice naît « à caler », le prof pose le jour — §5.6). Les
  exercices **à la maison** restent ancrés **à la semaine** (peu importe quand l'élève les fait).

Donc rendre le plan « class-agnostique » ne demande **pas** de tout ré-abstraire en relatif :
un modèle peut porter des dates absolues de la frise globale de son année scolaire, et l'assignation
ne recalcule par classe que `date_debut` (défaut = celui du modèle) et le `jour_prevu` des exercices
**en classe** (posé par le prof, « **à caler** » par défaut — §5.6). La date d'ancrage par classe est
**déjà** gérée par `propagerPlan` (même `date_debut`) ; le **choix du jour** est le seul vrai ajout
côté instance.

---

## 2. Cible conceptuelle

```
        scriptorium_modeles_plan            (class-agnostique, 1 par année scolaire visée)
        ├─ gabarit (tc/hlp/vierge), config, date_debut (ancre par défaut), annee_scolaire
        └─ scriptorium_modeles_plan_exercices   (cadence + diagnostics + tweaks, ancrés frise globale)
                     │
                     │  ASSIGNER (modèle → classes)         ← généralise propagerPlan
                     ▼
   ┌─────────────────────────────┬─────────────────────────────┐
   │ scriptorium_plans_evaluation│ scriptorium_plans_evaluation │  … 1 instance par classe
   │  classe A · modele_id=M      │  classe B · modele_id=M      │  (tables EXISTANTES, inchangées
   │  + _exercices_planifies      │  + _exercices_planifies      │   sauf ajout colonne modele_id)
   │  → ajustable librement        │  → ajustable librement        │
   └─────────────────────────────┴─────────────────────────────┘
```

Les **instances vivent toujours dans `scriptorium_plans_evaluation` / `_exercices_planifies`** :
tous les consommateurs aval (émission calendrier, « à faire » du prof, hooks de synthèse, panoptique,
rétention élève) continuent de lire les mêmes tables → **aucun casse en aval**.

---

## 3. Décision structurante retenue

**Copie à l'assignation** (et *non* modèle vivant).

- Assigner un modèle à une classe **matérialise une instance indépendante** (comme `propagerPlan`).
- Une fois l'instance créée, elle **diverge librement** ; les actions d'ajustement existantes s'y
  appliquent telles quelles.
- **Modifier le modèle ensuite ne redescend PAS** dans les instances déjà créées. Pour repousser une
  révision du modèle, le prof **ré-assigne** explicitement (geste conscient).

**Rationale** : c'est le comportement le plus simple, il réutilise la propagation existante presque
telle quelle, et il correspond au verbe employé par le prof (« l'**implémenter** pour chaque classe »).

> **Évolution future documentée (hors périmètre v1) — « Modèle vivant »** : garder le lien `modele_id`
> vivant, faire hériter les instances et introduire une **couche de surcharge par classe**
> (tombstones/overrides d'exercices) pour qu'une correction du modèle profite aux classes
> non-divergentes. Nettement plus lourd (résolution héritage + override, ré-publication). Le champ
> `modele_id` (§4.2) est posé dès maintenant pour ne pas fermer cette porte.

---

## 4. Modèle de données (migration additive, idempotente, gatée)

> Fichier suggéré : `plan_evaluation_modele.sql` (patron de `plan_evaluation_phase_a.sql` :
> `create table if not exists`, `add column if not exists`, `drop policy if exists` + `create`,
> blocs `DO/EXCEPTION` pour les contraintes sur tables préexistantes). **Rejouable sans dommage.**

### 4.1 Nouvelle table — le modèle (class-agnostique)

```sql
create table if not exists scriptorium_modeles_plan (
  id             uuid primary key default gen_random_uuid(),
  titre          text not null,                       -- ex. « Terminale tronc commun — 2026 »
  annee_scolaire integer not null,                    -- AY entier de la frise (cf. anneeScolaireDe)
  gabarit        text not null check (gabarit in ('tc','hlp','vierge')),
  date_debut     date not null,                       -- ancre PAR DÉFAUT (snap frise globale)
  config         jsonb not null default '{}',         -- cycle, compterFragments, … (cf. asPlanConfig)
  statut         text not null default 'brouillon' check (statut in ('brouillon','pret')),
  created_by     uuid references profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  supprime_at    timestamptz
);
create index if not exists idx_modeles_plan_ay
  on scriptorium_modeles_plan(annee_scolaire) where supprime_at is null;
```

> `statut` : `brouillon` (en cours de conception) → `pret` (assignable). Volontairement **pas**
> d'unicité classe×AY ici — un modèle n'appartient à aucune classe et on peut en avoir plusieurs
> par année (ex. un modèle TC + un modèle HLP).

### 4.2 Nouvelle table — les exercices du modèle

Même **typologie** que `scriptorium_exercices_planifies`, **sans** les colonnes propres à l'instance
(`jour_prevu`, `quiz_id`, `codex_session_id`, `concu_at`, statut de conception, liens de module) :
un exercice de modèle n'est ni « conçu » ni « lié » — il n'est qu'un **créneau typé**.

```sql
create table if not exists scriptorium_modeles_plan_exercices (
  id            uuid primary key default gen_random_uuid(),
  modele_id     uuid not null references scriptorium_modeles_plan(id) on delete cascade,

  -- Typologie : MÊME check que l'instance (voir §4.3 pour l'ajout bac_blanc).
  type_exercice text not null,
  diagnostique  boolean not null default false,
  nature        text not null check (nature in ('formatif','evaluatif')),
  lieu          text not null check (lieu in ('classe','maison')),
  module        text not null check (module in ('quazian','codex','aletheia','fragments')),
  constraint modele_exos_typologie_chk check ( /* … copie exacte de exercices_typologie_chk + bac_blanc … */ ),

  -- Ancrage : absolu sur la frise GLOBALE de l'AY (bras 'semaine') ou fenêtre (diagnostics).
  ancrage       text not null default 'semaine' check (ancrage in ('semaine')),  -- pas de bras 'parcours' ici (cf. §5.5)
  semaine_lundi date,
  constraint modele_exos_lundi_chk check (semaine_lundi is null or extract(isodow from semaine_lundi) = 1),
  fenetre_diagnostique text check (fenetre_diagnostique in ('septembre','decembre','fevrier')),
  constraint modele_exos_fenetre_chk check (fenetre_diagnostique is null or diagnostique),

  origine       text not null default 'manuel' check (origine in ('cadence','diagnostic','manuel')),
  duree_estimee_min integer check (duree_estimee_min is null or duree_estimee_min between 1 and 240),
  titre         text,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_modele_exos_modele on scriptorium_modeles_plan_exercices(modele_id);
-- Idempotence de génération, comme l'instance :
create unique index if not exists uk_modele_exos_cadence
  on scriptorium_modeles_plan_exercices(modele_id, semaine_lundi, type_exercice)
  where origine = 'cadence';
create unique index if not exists uk_modele_exos_diagnostic
  on scriptorium_modeles_plan_exercices(modele_id, fenetre_diagnostique, type_exercice)
  where origine = 'diagnostic';
```

> **Réutilisation** : la population initiale des exercices d'un modèle appelle **les mêmes générateurs
> purs** que `creerPlan` — `genererCadence(couvertes, gabarit, config)` +
> `placerDiagnostics(frise, ay, ancreLundi)` (utils `plan-cadence`) — sur la frise résolue depuis
> `date_debut`. On ne réécrit pas la logique de cadence, on la branche sur une nouvelle table.

### 4.3 Delta additif sur les tables existantes

**(a) Lien de provenance sur l'instance** (pose la porte du « modèle vivant » futur, inerte en v1) :

```sql
alter table scriptorium_plans_evaluation
  add column if not exists modele_id uuid references scriptorium_modeles_plan(id) on delete set null;
```

**(b) Nouveau type `bac_blanc`** — sur l'instance **et** le modèle. La typologie est un `CHECK`
verrouillé : on **drop + recreate** (additif, cf. note §4.3 du SPEC existant « assouplir = drop/add »).

```sql
-- type_exercice : ajouter 'bac_blanc'
alter table scriptorium_exercices_planifies drop constraint if exists <nom_check_type_exercice>;
alter table scriptorium_exercices_planifies add  constraint <…> check (type_exercice in
  ('ecriture','lecture','synthese','quiz','examen_livre','fragment','essai','bac_blanc'));

-- exercices_typologie_chk : ajouter la branche
--   (type_exercice='bac_blanc' and not diagnostique and nature='evaluatif' and lieu='classe' and module='codex')
alter table scriptorium_exercices_planifies drop constraint if exists exercices_typologie_chk;
alter table scriptorium_exercices_planifies add  constraint exercices_typologie_chk check ( /* branches existantes + bac_blanc */ );
```

> `exercices_lien_module_chk` n'a **pas** besoin de changer : un `bac_blanc` n'a ni `quiz_id` ni
> `codex_session_id` (tous deux `null`), ce que la contrainte autorise déjà.
> Les **deux diagnostics en classe** (`ecriture`/`lecture` + `diagnostique=true` + `classe`) sont
> **déjà** des branches valides de `exercices_typologie_chk` → **aucune migration** pour eux (§6.1).

### 4.4 RLS — prof-only strict

Mêmes policies que `plan_evaluation_phase_a.sql` (§6) : `enable row level security` sur les deux
nouvelles tables + policy `for all` gardée par `profiles.role = 'prof'`. **Aucune policy élève.**

### 4.5 Migration / compatibilité

Le gate `plan_evaluation_actif` est **`false`** (aucun flip dans le repo, `seed_prod.sql` n'y touche pas)
→ la fonctionnalité n'est pas ouverte aux élèves. Posture :

- **Coupe propre** : le **modèle** devient le point d'entrée d'authoring ; l'ancien flux
  « créer un plan directement sur une classe » (`FormulaireCreerPlan`) est **remplacé** par
  « créer un modèle » + « assigner ».
- **Défensif** : si des lignes `scriptorium_plans_evaluation` existent malgré tout (gate flippé à la
  main en DB), elles restent **valides** comme instances autonomes (`modele_id = null`) et éditables en
  place — rien n'est détruit ni migré de force. (Optionnel, si utile : un script one-shot pour
  « emballer » chaque plan orphelin dans un modèle. Non requis en v1.)

---

## 5. Flux applicatif

### 5.1 Créer / éditer un **modèle** (sans classe)

- **UI** : nouvel onglet/section « Modèles de plan » dans `app/prof/scriptorium/` (à côté de la vue
  actuelle). Formulaire de création = l'actuel `FormulaireCreerPlan` **moins** `classe_id`, **plus**
  un champ `titre` (le sélecteur de gabarit + `ChampDate` pour l'ancre par défaut restent).
- **Serveur** — `creerModele(titre, gabarit, date_debut)` : reprend la logique de `creerPlan`
  (résolution frise **avant** insert ; refus si aucune semaine couverte / semestres incohérents ;
  génération `genererCadence` + `placerDiagnostics` ; rollback si la génération échoue), mais écrit
  dans `scriptorium_modeles_plan(_exercices)` et **ne pose ni classe ni hooks de synthèse**.
- **Édition du modèle** : mêmes gestes que l'instance mais en CRUD simple sur la table modèle —
  `ajouterExerciceModele`, `retirerExerciceModele`, `deplacerExerciceModele`, `regenererModele`
  (change de gabarit avec aperçu diff, cf. `regenererPlan`). Pas de `marquerConcu`, pas de liaison
  module, pas de `preparerSynthese` au niveau modèle (concepts d'instance uniquement).
- **Grille** : réutiliser `GrillePlan` en mode « modèle » : mêmes semaines (frise globale de l'AY,
  libellées « Lundi jj/mm »), mais colonnes d'action réduites (pas de badge conçu/à-concevoir, pas de
  « Concevoir → »). Un exercice de modèle affiche seulement type · lieu · semaine.

### 5.2 **Assigner** un modèle à des classes

Composant calqué sur `AssignationClasses` (parcours) : liste des classes actives avec bouton
**Assigner / Retirer**, un `ChampDate` **`date_debut` propre à la classe** (défaut = `date_debut` du
modèle), et un état « assignée / non assignée ».

- **Serveur** — `assignerModeleClasse(modeleId, classeId, dateDebut | null)` : **généralise
  `propagerPlan`**. Pour chaque classe :
  1. Refuser si la classe a déjà une instance vivante pour cette AY
     (`uk_plans_evaluation_classe_ay` — mêmes gardes que `propagerPlan`).
  2. `dateDebut` retenue = celle passée, sinon `modele.date_debut`. Résoudre `semainesCouvertes(dateDebut)`.
  3. Insérer l'instance `scriptorium_plans_evaluation` (`classe_id`, `annee_scolaire`, `gabarit`,
     `date_debut`, `config`, `modele_id`, `statut='brouillon'`).
  4. **Matérialiser les exercices** dans `scriptorium_exercices_planifies` à partir des exercices du
     **modèle** (pas d'une régénération à sec) :
       - bras `semaine` : reprendre les lignes du modèle dont `semaine_lundi ∈ couvertes` ;
         pour les exercices **en classe**, `jour_prevu = null` (**« à caler »**, §5.6) — **pas de
         défaut** ; les exercices **maison** n'ont pas de jour ;
         `origine`/`type`/`diagnostique`/`nature`/`lieu`/`module` copiés tels quels ;
         `statut='a_concevoir'`.
       - diagnostics (`origine='diagnostic'`, ancrés fenêtre) : re-résoudre via `placerDiagnostics`
         pour la frise/AY (la fenêtre est class-agnostique) → semaine concrète + `jour_prevu` classe.
       - Toute ligne du modèle hors des semaines couvertes de **cette** classe (date de début plus
         tardive) → **non matérialisée**, signalée par le bandeau « à recaler » existant (J2). *Ne pas
         supprimer silencieusement.*
  5. Hooks de synthèse : `hookSyntheseBackfillPlan(admin, planId, classeId)` (best-effort, gate-first),
     **comme `creerPlan`/`propagerPlan`** — pour créer les synthèses des cours déjà en place.
- **Idempotence** : ré-assigner une classe déjà servie pour l'AY est un **no-op** (ignorée), exactement
  comme la propagation.
- **Retrait** — `retirerModeleClasse(modeleId, classeId)` : n'efface **pas** l'instance par défaut
  (elle a pu être ajustée / des synthèses lancées). Deux options à cadrer avec le prof à l'usage :
  soit détacher (`modele_id = null`, l'instance survit), soit proposer la suppression via
  `supprimerPlan` existant. **v1 : détacher** (le plus sûr).

### 5.3 **Ajuster** l'instance d'une classe

**Inchangé.** Toutes les actions actuelles de `evaluations/actions.ts`
(`ajouterExercice`, `retirerExercice`, `deplacerExercice`, `marquerConcu`, `preparerSynthese`,
`validerPlan`, `regenererPlan`, `recalerExercice`, `reglerCompterFragments`, …) opèrent sur l'instance
telle quelle. Le prof « implémente » son modèle classe par classe.

### 5.4 Vue « Par classe »

`chargerPlanDeClasse` / `chargerClassesAvecPlan` : ajouter `modele_id` au select et, si présent,
afficher un discret « issu du modèle *Titre* » (lecture seule). Aucun changement de comportement.

### 5.5 Synthèses (rappel, pour ne pas se tromper)

Les synthèses (`ancrage='parcours'`, auto-créées par les hooks parcours) restent un **concept
d'instance** (elles dépendent des parcours **assignés à la classe**). Elles **ne vivent pas** dans le
modèle (d'où `ancrage in ('semaine')` seul en §4.2). Elles apparaissent naturellement à l'assignation
via `hookSyntheseBackfillPlan`, comme aujourd'hui à la création du plan.

### 5.6 Ancrage : **semaine** (maison) vs **jour** (classe)

**Règle.** Un exercice **à la maison** (`lieu='maison'` : écriture, lecture formatives) est ancré **à la
semaine** — peu importe quand l'élève le fait. Un exercice **en classe** (`lieu='classe'` : quiz,
examen sur le livre, écriture/lecture diagnostiques, Bac Blanc, synthèse) doit être posé sur un **jour
précis choisi par le prof** — le 1er jour de cours de la semaine n'est qu'un *défaut*, pas une certitude.

- **DB** : **rien à migrer** — `jour_prevu` (date) + `exercices_jour_chk` (jour compris dans la
  semaine) existent déjà. Un `jour_prevu` null sur un exercice en classe = **« jour à caler »** (déjà
  affiché ainsi dans `GrillePlan`), état visible mais non bloquant, à résoudre par le prof.
- **Action** (instance) — `fixerJourExercice(exerciceId, jour)` : valide que `jour` tombe dans la
  semaine de l'exercice (`semaine_lundi ≤ jour ≤ semaine_lundi + 6`) **et** est un jour de cours de la
  classe (`coursParJour`), puis met à jour `jour_prevu` + `updated_at`. Réservée à `lieu='classe'`
  (refus explicite sur un exercice maison). L'échéance affichée en découle via `dateEffectiveSemaine`.
- **UI** (`GrillePlan`, instance) : pour chaque exercice **en classe**, un **sélecteur de jour** dont
  les options sont les **jours de cours de la classe** dans cette semaine (via `coursParJour`). Les
  exercices **maison** n'affichent **pas** de sélecteur (semaine seule).
- **Déplacement** : `deplacerExercice` continue de remettre `jour_prevu` au 1er jour de cours de la
  semaine cible (repli lundi) ; le prof re-cale ensuite si besoin. *(Comportement actuel conservé.)*
- **Modèle** : au niveau du **modèle** (class-agnostique), les exercices en classe restent ancrés **à
  la semaine** — le jour dépend de l'emploi du temps de chaque classe, il se choisit donc **sur
  l'instance**, après assignation. Cohérent avec la séparation modèle/instance.
- **Matérialisation (décidé)** : un exercice **en classe** naît **`jour_prevu = null` (« à caler »)** —
  pas de jour par défaut. Motif : un défaut silencieux se fait **oublier** ; « à caler » est un signal
  de travail explicite. Vaut à l'assignation (§5.2) **et** à l'ajout manuel (§6). *(Exception : la
  **synthèse** garde son défaut « dernier jour de cours », ajustable.)*
- **Dérivation « à faire » (nouveau)** : tant qu'un exercice en classe d'un plan **validé** a
  `jour_prevu is null`, il génère une tâche **« caler le jour »** dans le **« à faire » du prof**,
  **à côté** de sa tâche **« à concevoir »** ; deep-link vers la **grille du plan** (Scriptorium), où
  vit le sélecteur du §5.6. Le signal **disparaît dès que le jour est posé**.

  > **NB — principe « Scriptorium planifie, les modules conçoivent »** : *caler le jour* est un acte de
  > **planification** → l'action se fait dans Scriptorium (la grille du plan). Le *signal*, lui, est
  > co-affiché **là où apparaît « à concevoir »** (« à faire » du prof ; écho possible dans le module
  > de conception si tu le souhaites).

---

## 6. Les 3 exercices manquants dans la palette « + Ajouter… »

Cible : `TYPES_AJOUT` (UI, `GrillePlan.tsx`) et `TYPE_MANUEL` (serveur, `evaluations/actions.ts`) —
et leurs équivalents en mode modèle. Rappel : ces trois exercices sont **en classe** → l'ajout ne fixe
que la **semaine** ; leur **jour** se cale ensuite par classe via le sélecteur du §5.6.

### 6.1 Écriture diagnostique (classe) & Lecture diagnostique (classe) — *déjà dans le modèle DB*

Ces combinaisons sont **déjà** des branches valides de `exercices_typologie_chk`
(`ecriture|lecture + diagnostique=true + evaluatif + classe + codex|aletheia`). Il manque juste de
pouvoir les **poser à la main**. Aujourd'hui `ajouterExercice` code en dur `diagnostique: false`.

À faire :
- Élargir `TYPE_MANUEL` pour porter aussi `diagnostique` et être clé par un **id de palette**
  (pas par `type_exercice` seul, puisque écriture existe en 2 variantes) :

```ts
const TYPE_MANUEL = {
  ecriture:       { type_exercice:'ecriture',     diagnostique:false, nature:'formatif',  lieu:'maison', module:'codex'    },
  lecture:        { type_exercice:'lecture',      diagnostique:false, nature:'formatif',  lieu:'maison', module:'aletheia' },
  quiz:           { type_exercice:'quiz',         diagnostique:false, nature:'evaluatif', lieu:'classe', module:'quazian'  },
  examen_livre:   { type_exercice:'examen_livre', diagnostique:false, nature:'evaluatif', lieu:'classe', module:'aletheia' },
  ecriture_diag:  { type_exercice:'ecriture',     diagnostique:true,  nature:'evaluatif', lieu:'classe', module:'codex'    },
  lecture_diag:   { type_exercice:'lecture',      diagnostique:true,  nature:'evaluatif', lieu:'classe', module:'aletheia' },
  bac_blanc:      { type_exercice:'bac_blanc',    diagnostique:false, nature:'evaluatif', lieu:'classe', module:'codex'    },
} as const
```

- `ajouterExercice` lit la combinaison **entièrement** depuis `TYPE_MANUEL[id]` (dont `diagnostique`),
  pose `origine='manuel'`, `fenetre_diagnostique = null` (autorisé : `exercices_diag_fenetre_chk` ne
  contraint que `origine='diagnostic'`), et **laisse `jour_prevu = null`** (« à caler », §5.6) pour les
  `lieu='classe'` — le prof cale le jour ensuite.
- `TYPES_AJOUT` (UI) liste les 7 entrées avec libellés explicites, ex. groupées :
  - *Maison* : « Écriture (maison) », « Lecture (maison) »
  - *En classe* : « Quiz (classe) », « Examen sur le livre (classe) »,
    « Écriture diagnostique (classe) », « Lecture diagnostique (classe) », « Bac Blanc (classe) »

> **Note de conception** : un diagnostic auto (`origine='diagnostic'`, par fenêtre) et un diagnostic
> manuel (`origine='manuel'`, sur une semaine choisie) peuvent coexister la même semaine sans violer
> les index (clés d'unicité disjointes par `origine`). C'est acceptable ; si on veut l'éviter, ajouter
> un garde applicatif « une écriture diagnostique existe déjà cette fenêtre » à l'ajout manuel.

### 6.2 Bac Blanc (classe) — *nouveau type*

- **DB** : migration §4.3(b) — `bac_blanc` dans le `CHECK` de `type_exercice` + branche
  `bac_blanc + not diagnostique + evaluatif + classe + codex` dans `exercices_typologie_chk`
  (sur l'instance **et** le modèle).
- **Conception** : module **Codex** (décidé). Comme `examen_livre`/`ecriture`/`lecture`, **pas d'écran
  de conception dédié en v1** → dans `GrillePlan`, le Bac Blanc suit la branche « autres types » :
  bouton **« Conçu »** manuel (`marquerConcu`), *pas* de deep-link. Quand un chantier Codex « Bac
  Blanc » existera, il ajoutera son FK `*_id` + le deep-link (additif), sans toucher ce spec.
- **Placement** : manuel (via la palette), sur la semaine choisie. Pas de fenêtres automatiques en v1.
- **Budget/panoptique** : `lieu='classe'` → **ne compte pas** dans l'assiette maison (comme les
  diagnostics et le fragment oral) — aucun réglage à ajouter, la règle existante s'applique.

---

## 7. Impacts sur les lots / consommateurs existants

| Consommateur | Impact |
|---|---|
| Émission **calendrier** élève, **panoptique**, rétention élève | **Aucun** : ils lisent `scriptorium_exercices_planifies` (instances), inchangé. |
| **« À faire » prof** (dérivation) | **Nouvelle règle** : un exercice en classe `jour_prevu is null` (plan validé) dérive une tâche **« caler le jour »**, à côté de **« à concevoir »** (§5.6). |
| **Hooks de synthèse** (`hookSyntheseBackfillPlan`) | Appelés à l'**assignation** (comme à la création/propagation). |
| **Propagation** (`propagerPlan`) | Devient redondante avec l'assignation depuis modèle → **retirer de l'UI** ; garder la fonction ou la refactoriser en cœur commun de `assignerModeleClasse`. |
| **`creerPlan` (classe-first)** | Retiré de l'UI (§4.5). Peut rester en interne comme brique de matérialisation. |

---

## 8. Invariants à préserver (ne pas régresser)

- **Frise figée** : les `semaine_lundi` matérialisés ne bougent pas ; un décalage de calendrier se voit
  via « à recaler » (J2), il ne réécrit pas les dates.
- **1 instance vivante par (classe, AY)** : `uk_plans_evaluation_classe_ay` inchangé ; l'assignation
  refuse/ignore une classe déjà servie.
- **Prof-only** : aucune policy élève sur les tables modèle ; lecture élève des surfaces dérivées via
  client admin + garde applicative (patron existant).
- **Gate** : toutes les nouvelles actions passent `verifierProfGate` (refus si
  `plan_evaluation_actif=false`).
- **Additif / idempotent / rejouable** : migration sans `NOT NULL` rétroactif, sans donnée détruite.

---

## 9. Découpage en lots (implémentation incrémentale, gate OFF)

- **Lot A — Schéma** : `plan_evaluation_modele.sql` (tables §4.1/4.2, `modele_id` §4.3a, RLS §4.4)
  + migration `bac_blanc` §4.3b. Rejouable ; aucun code ne le lit encore.
- **Lot B — Palette d'exercices** : `TYPE_MANUEL`/`TYPES_AJOUT` + `ajouterExercice` (§6). *Indépendant
  du reste* — livrable seul, corrige tout de suite « il manque des exercices dans la liste » sur les
  instances existantes.
- **Lot C — Authoring modèle** : `creerModele` + CRUD modèle + `GrillePlan` mode modèle (§5.1) + onglet.
- **Lot D — Assignation** : `assignerModeleClasse` / `retirerModeleClasse` + composant type
  `AssignationClasses` (§5.2) ; retrait UI de `propagerPlan`/`creerPlan` (§7).
- **Lot E — Finitions** : mention « issu du modèle » (§5.4), nettoyage, doc.

---

## 10. Critères d'acceptation

1. **Palette** : sur une instance existante, « + Ajouter… » propose écriture diagnostique (classe),
   lecture diagnostique (classe) et Bac Blanc (classe) ; les poser crée une ligne conforme au `CHECK`
   (diagnostique/nature/lieu/module corrects, `origine='manuel'`, `jour_prevu` calculé en classe).
2. **Bac Blanc** : type accepté par la DB (instance + modèle) ; affiché « Bac Blanc » ; bouton « Conçu »
   manuel fonctionnel ; ne compte pas au budget maison.
3. **Modèle** : créer un modèle TC sans choisir de classe génère la cadence + les diagnostics attendus
   sur la frise de l'AY ; l'éditer (ajout/retrait/déplacement, changement de gabarit avec diff) marche
   sans aucune classe.
4. **Assignation** : assigner un modèle à 2 classes crée 2 instances **indépendantes** ; les `jour_prevu`
   des exercices en classe diffèrent selon l'emploi du temps de chaque classe ; une classe déjà servie
   pour l'AY est ignorée (idempotent).
5. **Divergence** : modifier l'instance de la classe A ne touche pas la classe B ni le modèle ; modifier
   le **modèle** après assignation ne touche **aucune** instance déjà créée.
6. **Date décalée** : assigner avec une `date_debut` postérieure à celle du modèle → les exercices
   antérieurs à l'ancre de la classe ne sont pas matérialisés et remontent dans « à recaler »
   (pas de disparition silencieuse).
7. **Non-régression** : émission calendrier, « à faire », synthèses, rétention élève identiques à
   avant sur une instance issue d'un modèle.
8. **Gate** : gate OFF → toutes les actions modèle/assignation refusent ; onglets masqués.
9. **Jour en classe vs semaine en maison** : un exercice **en classe** (quiz, examen, diagnostic, Bac
   Blanc) peut être calé sur **n'importe quel jour de cours** de sa semaine, **indépendamment par
   classe** ; le jour choisi survit au refresh et pilote l'échéance (`dateEffectiveSemaine`). Un
   exercice **à la maison** n'a **pas** de sélecteur de jour (ancré semaine). `fixerJourExercice`
   refuse un jour hors semaine ou hors jours de cours, et refuse un exercice maison.
10. **« Jour à caler » → à faire** : un exercice en classe d'un plan **validé** sans jour posé apparaît
   comme tâche **« caler le jour »** dans le « à faire » du prof (à côté de « à concevoir »), avec
   deep-link vers la grille du plan ; la tâche **disparaît dès que le jour est calé**. À la
   matérialisation (assignation / ajout manuel), les exercices en classe naissent **sans jour**
   (`jour_prevu null`), jamais avec un défaut.

---

## 11. Questions ouvertes / décisions différées

- **Modèle vivant** (§3) : reporté ; `modele_id` posé pour l'avenir.
- **Réutilisation inter-années** d'un modèle (le rejouer l'an prochain) : hors v1 (le modèle est lié à
  une AY). Faisable plus tard en stockant l'ancrage en **relatif** (n° de semaine) plutôt qu'en dates
  absolues — c'est le modèle des `scriptorium_parcours_creneaux`.
- **Retrait d'une classe** (§5.2) : v1 = détacher (`modele_id=null`, instance conservée). À confirmer à
  l'usage si « retirer » doit proposer la suppression.
- **Bac Blanc récurrent** : v1 = placement manuel. Si besoin de fenêtres fixes (façon diagnostics),
  chantier ultérieur additif.
- **Diagnostic manuel vs auto la même fenêtre** (§6.1) : autorisé par défaut ; garde applicatif
  optionnel.
