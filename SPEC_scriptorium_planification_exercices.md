# SPEC — Scriptorium : planification des exercices (plan annuel d'évaluation)

> Document de conception consolidé (synthèse de 4 contributions : modèle, flux-prof, intégrations, risques).
> Aucun code applicatif n'est écrit ici : le DDL et les signatures sont spécifiés pour approbation.
> Toute affirmation Next devra être re-vérifiée dans `node_modules/next/dist/docs/` à l'implémentation (version à breaking changes).
> Les divergences entre concepteurs sont **tranchées** (§0) ; chaque référence `fichier:ligne` a été re-vérifiée dans le repo au 2026-07-14.
> **Durci le 2026-07-14** : 3 contre-épreuves (schéma / régressions / temporalité), findings repliés — voir « Journal de durcissement » en fin de document.
> **Décisions PO repliées le 2026-07-15** (13 décisions D1–D13, §2bis). Principaux effets : `type_pedagogique` structuré sur `classes` + **propagation par copie** multi-classes ; `classe_id` **obligatoire** à la création d'une synthèse Codex ; réglage prof **quiz annoncé / surprise** ; fragment à **double lieu** (écrit = maison / oral = classe) ; **toutes les questions PO du §11 tranchées** (plus rien de bloquant).
> **Vérification post-décisions (2026-07-15, §13.2)** : 6 correctifs repliés — 1 **bloquant** (rétention élève **généralisée** de tout exercice `concu` non lancé, pas seulement les quiz : E2 + §8bis-3), 2 majeurs (AY de rapprochement P6 définie comme P1 ; `type_pedagogique` = exception additive assumée hors invariant byte-identique), 3 mineurs (P5 copie `config` ; contrat `placerDiagnostics` ; fail-closed ciblé du résidu Codex `classe_id null`).

---

## 0. Note de réconciliation — divergences tranchées

| Sujet | Retenu | Variantes écartées | Raison (une phrase) |
|---|---|---|---|
| Nom des tables | `scriptorium_params` / `scriptorium_plans_evaluation` / `scriptorium_exercices_planifies` | `plans_annuels`, `plan_annuel_classes`, `scriptorium_plan_classes`, `plan_exercices`, `planification_params` | Préfixe `scriptorium_*` (convention SPEC Parcours §4.0) ; « plans_evaluation » désambiguïse du plan des enseignements (parcours) ; « exercices_planifies » évite la collision avec de futurs objets « exercice » des modules. |
| Ancrage temporel du bras plan | **`semaine_lundi date` (lundi ISO) + `jour_prevu date` optionnel** — matérialisés à la génération, jamais recalculés | `date_prevue` seule (3 concepteurs) ; ordinal résolu à la lecture ; `indexContinu` stocké | La **semaine d'enseignement** est l'unité de la cadence, du budget et du panoptique ; une colonne unique `date_prevue` porterait deux sémantiques selon `lieu` (dimanche vs jour J) et exigerait quand même une colonne semaine pour l'idempotence (risques stockait `lundi_semaine` en plus) ; le régime « figé » (R1) est identique dans les deux formes. |
| Synthèse : granularité | **1 ligne par (plan/classe, parcours, cours)** — `plan_id NOT NULL` sur les deux bras | 1 ligne globale par (parcours, cours) résolue en N instances (flux-prof) | La session Codex est par classe : le lien 1↔1 `codex_session_id` ne tient qu'avec une ligne par classe ; le à-faire et le calendrier ont besoin d'instances par classe de toute façon. |
| Synthèse : référence parcours | **(parcours_id, contenu_id) + `max(semaine)` résolu à la lecture** | `creneau_id` FK SET NULL (risques) | `retirerCreneau` fait un DELETE réel et un cours peut occuper plusieurs créneaux : la paire (parcours, cours) est robuste aux déplacements, la FK créneau serait orpheline en permanence. |
| Sens du lien exercice↔objet module | **FK sur l'exercice** (`quiz_id`, `codex_session_id`, `on delete set null` + unicité partielle) | `exercice_id` sur `quazian_quizzes`/`codex_sessions` (intégrations) | Zéro colonne sur les tables vivantes ⇒ gate OFF no-op **par construction** et aucune sérialisation accidentelle côté élève ; la table plan nous appartient, l'étendre aux futurs types est un ALTER additif trivial. |
| Session Codex de la synthèse | **Créée à la « préparation »** (acte prof explicite) ; la synthèse naît `a_concevoir` | Auto-création de la session brouillon au hook `ajouterCreneau` (intégrations C7) | Aucune écriture automatique dans un module vivant depuis le builder ; « préparer » = le geste Codex existant (créer le brouillon), simplement proposé par le plan — la logique existante est conservée (PROMPT §6). |
| Statuts stockés | **`a_concevoir` / `concu` / `annule`** ; « réalisé », « en retard », « à recaler » **dérivés** | `pret`/`fait` stockés + `realise_at` (intégrations) | Dupliquer `lance_at` = drift garanti (leçon `capstone.eleve_id`) ; aucun hook n'est alors nécessaire dans `lancerQuizz`/`lancerSynthese`. |
| Chemin direct Quazian | **Auto-création de l'exercice** à la création d'un quiz hors plan (gate ON, plan validé existant) ; classe sans plan → quiz créé + signal | Refus dur (`creerQuizz` exige `exercice_id`, intégrations Q3) | « Toujours planifié » (PO 5) est satisfait par l'auto-création sans hostilité de flux ; auto-création **confirmée** par le PO (D3, §2bis). |
| Diagnostic non datable (fenêtre hors frise) | **Non généré + bandeau** ; « Étendre le plan » le crée quand le semestre existe | Ligne à `date null` + fenêtre comme statut dégradé (risques L7/L8) | Une ligne sans date complique chaque consommateur ; l'idempotence de la régénération couvre le rattrapage. |
| Fragments (alternance HLP) | **Zéro ligne générée** ; reflet lecture seule (panoptique + budget) depuis `fragments_semaines` | Lignes `type='fragment'` `concu` d'office (modèle) ; lignes indicatives prof (risques) | L'échéancier Fragments est global au semestre et gouverne les élèves : une ligne de plan afficherait une date concurrente sans rien rendre actionnable ; le recâblage par classe est un **chantier séparé différé** (D12, §1.3). |
| Régénération vs annulations | **L'annulation est respectée** (la ligne `annule` vivante bloque la re-création sur sa clé) ; le diff les liste | Résurrection arbitrée au diff sans mémoire (flux-prof F12.4) | Moindre surprise : une annulation est une décision du prof ; « **Réactiver** » (annule → a_concevoir) est **spécifié en V3**. |
| Kind calendrier | **Kinds existants réutilisés** (`quizz`/`epreuve`/`fermeture`/`jalon`) | Nouveau kind `exercice` (flux-prof K1) | Un kind neuf oblige à réviser tous les switch d'affichage des deux pages calendrier pour un gain nul. |
| Tâche « conçu non lancé » au jour J | **Pas en v1** | Tâche « Lancer le quiz » jour J (flux-prof J3) | Le déclenchement est un acte pédagogique libre en classe (PO 5) ; rappel doux **retenu mais différé** (D4, §2bis). |
| Jour par défaut (lieu classe) | Exercices ancrés semaine → **premier** jour de cours de la classe (repli lundi) ; synthèse (fin de cours) → **dernier** jour de cours (repli vendredi) | premier partout (risques) / dernier partout (intégrations) | Sémantiques différentes : un diagnostic ouvre la semaine, une synthèse clôt un cours. |

---

## 1. Vision & périmètre

**Principe cardinal (PROMPT §1) : Scriptorium planifie, les modules conçoivent.** Un quiz reste conçu dans Quazian, une synthèse dans Codex, un exercice de lecture dans Aletheia — mais leur **timing** vit désormais dans Scriptorium.

**Architecture à deux plans** (décision PO 1) :
- **(i) Plan des enseignements** = les Parcours (existant, déployé : `scriptorium_parcours*`, frise, snapshot d'horaire).
- **(ii) Plan annuel d'évaluation PAR CLASSE** (nouveau) = le timing des exercices : cadence hebdomadaire formative, fenêtres diagnostiques sept/déc/fév, quiz, examens. Le **contenu** d'un exercice peut référencer un parcours/contenu ; son **timing** relève du plan annuel — parce que les parcours d'une même classe **se chevauchent** (une cadence par parcours doublerait la charge et exploserait le budget §4 du PROMPT).

### 1.1 DANS ce chantier
- Tables neuves `scriptorium_params` (gate), `scriptorium_plans_evaluation`, `scriptorium_exercices_planifies` (RLS prof-only) + arc bi-source **additif** sur `codex_sessions` (`unite_id` XOR `contenu_id`).
- **Typologie complète du §3 du PROMPT** portée dans le modèle (2 axes + variante diagnostique), y compris les types dont le module de conception n'existe pas encore (`ecriture`, `lecture`, `examen_livre` : lignes planifiables, statut `a_concevoir`).
- **Plan annuel** : création explicite par classe, gabarit **explicite** TC/HLP/vierge (PO 3), génération de cadence + diagnostics, brouillon → validation, édition, régénération scopée avec diff.
- **Exception synthèse** (PO 2) : ancrée au parcours, auto-planifiée à l'ajout d'un cours, date résolue à la lecture (fin du cours), préparée/déclenchée dans Codex.
- **Quiz toujours planifié** (PO 5) : liaison exercice↔quiz, statut « conçu » = 100 % questions validées, déclenchement manuel intact.
- **Dérivations** : à-faire prof (« à concevoir », « en retard »), calendrier **prospectif** (aujourd'hui quiz/synthèses n'y sont que rétrospectifs), vue panoptique (données garanties, design différé — PO 6), budget temps élève (§4 du PROMPT, indicatif).
- **Correctif préalable P0** : résolution de classe Codex cassée au calendrier (`classe_id` **uuid** résolu par nom → null + uuid brut affiché comme nom ; périmètre de la fuite élève à recalibrer sur la policy réellement en base), §6.3.

### 1.2 HORS-scope (recensé, non fait ici)
- **Conception des nouveaux types** (`ecriture`/`lecture` formatives et diagnostiques, `examen_livre`) : prompts, artefacts, tables — chantiers modules ultérieurs, qui ajouteront leur FK `*_id` sur l'exercice (additif).
- **Recâblage Quazian/Codex → contenus** (pickers d'unités de `creerQuizz`/`creerSynthese`, cartes par unité) : chantier séparé, **de toute façon requis avant la rentrée** (la purge L7/L8 videra les unités) — à séquencer, pas à coupler (§9.4).
- **Recâblage Fragments par classe** (échéancier par classe au lieu du global semestre) : le plan **reflète**, ne possède pas (§6.7).
- **Reprise du timing des essais** par le plan : agrégés en lecture, mono-source `fragments_essais_classes` conservée.
- **Design UI de la vue panoptique** : ce SPEC garantit données + résolutions, esquisse le contenu (§7) ; la forme sera travaillée avec Design.
- **Consommation élève des exercices dans les modules** : appartient aux chantiers des types. Seule l'apparition **calendrier élève** des exercices `concu` est spécifiée ici (dernier lot, gated, anti-fuite §8bis).

### 1.3 Différé explicitement
- Édition légère des dates d'exercices depuis le calendrier prof (patron essais `is_editable`) — v1 : édition dans Scriptorium seulement.
- « Dupliquer le plan depuis N-1 » à la rentrée suivante.
- **Tâche/rappel « conçu non lancé » au jour J** : **retenu, différé** (v1 n'en crée pas ; ajout futur à faible coût — D4). Le déclenchement reste un acte libre (PO 5).
- **Recâblage Fragments PAR CLASSE** — ⚠️ **chantier séparé, à faire plus tard** (D12) : l'échéancier Fragments est aujourd'hui global au semestre (`fragments_semaines.semestre_id`), pas par classe. **En v1, essai ET fragments restent des REFLETS EN LECTURE SEULE** : le plan les affiche (panoptique + budget), Fragments reste **seul maître** de leur timing — aucune migration du timing dans le plan (§6.7, §7.3).

---

## 2. Décisions PO verrouillées (2026-07-14, non négociables)

1. **Architecture à deux plans.** (i) La planification des **parcours** (enseignements : contenus, cours, créneaux de livres) — existe déjà. (ii) Un **plan annuel d'évaluation par classe** — nouveau — qui porte le **timing** des exercices (cadence hebdomadaire formative, fenêtres diagnostiques sept/déc/fév). Le contenu d'un exercice peut référencer un parcours/contenu ; son timing relève du plan annuel. Justification : les parcours d'une même classe **se chevauchent** (ex. « Philo de la connaissance » 1/09→15/10, puis « Philo morale » 16/10→15/12, et en parallèle « Naissance de la tragédie » 15/09→5/12 qui porte les créneaux de lecture) — une cadence générée par parcours doublerait la charge élève et exploserait le budget temps du §4.
2. **Exception** : la synthèse de fin de cours (§6 du PROMPT) reste ancrée au **parcours** (timing = fin du cours dans le parcours), planifiée automatiquement à l'ajout d'un cours, préparée et déclenchée dans Codex.
3. **Cadence** : gabarit choisi **explicitement** par le prof (TC / HLP / vierge) au niveau du plan annuel de la classe. La colonne `classes.filiere` est du texte libre (`lot1_classe_schema.sql:30`) : ne **jamais** en dériver la cadence.
4. **Jour J d'un exercice encore « à concevoir »** : invisible côté élève + alerte « en retard » dans le à-faire prof. Pas de blocage dur, pas de glissement automatique de date.
5. **Quiz Quazian** : désormais **toujours planifié** (garantit un quiz préparé et sans erreur), mais le **déclenchement** reste un acte manuel du prof en classe (le flux actuel brouillon→lancement survit).
6. **Vue panoptique** : une vue prof, par classe, semaine après semaine, montrant à la fois le contenu enseigné (parcours) et les évaluations (plan annuel). La forme UI sera travaillée plus tard avec Design — le SPEC garantit seulement que les données et résolutions nécessaires existent, et esquisse le contenu.
7. **Hypothèse de travail (contre-épreuve tenue, §6.6)** : la « lecture de livre » de l'alternance HLP reste gouvernée par les créneaux livre des parcours (mode b Aletheia, déployé : `utils/aletheia-dates.ts`, échéances dimanche) et compte seulement dans le budget temps — **pas** un exercice planifié en double. Idem flashcards (« ambiantes », hors planification, §3 du PROMPT).

---

## 2bis. Décisions PO (2026-07-15) — repli des questions ouvertes

> Tranchées avec le PO le 2026-07-15. Elles **ferment** les 13 questions du §11 (durcissement 2026-07-14) et complètent le §2. Traçabilité section par section indiquée entre parenthèses.

- **D1 — Multi-classes = « plans par classe + propagation » (le « plan partagé » est écarté).**
  - **(a)** Nouvel attribut **structuré** `classes.type_pedagogique ∈ {tc, hlp, autre}` (colonne additive, idempotente, **NULLABLE**, backfill NULL). Le prof le renseigne ; **jamais dérivé de `classes.filiere`** (texte libre, D3). Delta UI : `CreerClasse.tsx` gagne un `<select>` type pédagogique (spec du delta seulement — §5.1, §9.2). (§4.1bis, §3, §5.1)
  - **(b)** Le plan reste **1 ligne par classe** (modèle §4.2 inchangé) — **pas** de table plan↔classes partagée, **pas** de lignes partagées.
  - **(c) Propagation** à la création d'un plan : l'app propose d'appliquer le **même gabarit + même `date_debut` + même `config` jsonb** aux autres classes **actives**, de **même `type_pedagogique`** et **même AY**, **sans plan vivant** ; le prof accepte/refuse (sélection fine). La propagation **génère des plans + exercices PARALLÈLES et INDÉPENDANTS** (chaque classe peut ensuite diverger librement : annuler/déplacer/recaler via `origine='manuel'`, sans impacter les autres). Aucune classe n'est verrouillée à une autre. (§5.1-P5)
  - **(d) Hook à la création d'une classe** : s'il existe déjà un plan d'une classe de même `type_pedagogique` pour l'AY, proposer de l'appliquer à la nouvelle classe (accepter/refuser). Convenance, **pas** d'automatisme silencieux. (§5.1-P6)
  - **(e)** §12 : « Plan-gabarit *partagé* multi-classes » → remplacé par la **propagation par copie** (indépendante). (§12)
- **D2 — P0 Codex + `classe_id` obligatoire (ancienne Q13 close).** Le fix P0 (§6.3, Lot 0) est **confirmé** (fail-closed). De plus, une synthèse Codex a **toujours** une classe → `classe_id` devient **OBLIGATOIRE** à la création d'une synthèse (`creerSynthese`) : la branche « statu quo : événement sans classe, visible de tous » est **supprimée**. La source de sessions sans classe est **tarie** ; le fix P0 (remap uuid **+ fail-closed CIBLÉ du résidu `classe_id null`** : chemin Codex n'émettant aucun événement élève quand `classe_id` est null — §6.3-(4)) reste le filet pour tout résidu. (§6.2, §6.3, §5.4-S4, §10-Lot 0)
- **D3 — Auto-création d'exercice pour un quiz créé hors plan : RETENUE** (ancienne Q1). (§0, §6.1-Q3, §12)
- **D4 — Rappel « conçu non lancé » au jour J : RETENU mais DIFFÉRÉ** (v1 n'en crée pas ; reliquat planifié à faible coût, ancienne Q2). (§1.3, §0)
- **D5 — Quiz annoncé vs surprise : RÉGLAGE prof** (ancienne Q3), **défaut `surprise`**. Porté dans `scriptorium_params.quiz_annonce_defaut` (bool, défaut `false` = surprise) ; câblé au filtre `surface` de l'émission élève (E1/E2, Lot 7). (§4.1, §6.4-E1/E2, §8bis-3)
- **D6 — Diagnostics (ancienne Q4) : CONFIRMÉS** — (a) 1 écriture + 1 lecture diagnostiques par fenêtre, (b) TC **et** HLP, (c) placement 1ʳᵉ/2ᵉ semaine candidate du mois civil entier (G3). (§5.2-G3)
- **D7 — « Fin du cours » synthèse = semaine du DERNIER créneau : CONFIRMÉ** (ancienne Q5, règles S). (§5.4-S1)
- **D8 — « Marquer conçu » manuel dès la v1 : CONFIRMÉ** (ancienne Q6, soupape V4). (§5.3-V4)
- **D9 — Cible du budget = par gabarit SEUL** (ancienne Q9, pas de modulation par heures réelles). (§7.3)
- **D10 — Budget par classe, PAS de cumul inter-classes en v1** (ancienne Q10). (§8-cas 18, §7.3)
- **D11 — Lieu des types existants corrigé** (ancienne Q12) : fragment **ÉCRIT = maison**, fragment **ORAL = classe**, essai = classe. Le type `fragment` **n'a donc pas un lieu unique** : le CHECK de typologie (§4.3) autorise `fragment` en **maison** (écrit) **ET** en **classe** (oral). Fragments = reflets 0-ligne en v1 (structurant pour l'avenir). (§4.3, §3, §6.7, §7.3)
- **D12 — Fragments par classe = petit chantier séparé différé** (anciennes Q7/Q8) : en v1, **essai ET fragments restent des reflets en lecture seule** (le plan reflète, Fragments reste maître de leur timing). (§1.3, §6.7, §7.3)
- **D13 — Cartes d'erreurs Codex : DÉGRADATION ACCEPTÉE en v1** (ancienne Q11) : pour une synthèse ancrée à un **contenu**, l'erreur est **tracée** (`codex_erreurs`) mais **aucune carte FSRS** n'est créée (faute de `scriptorium_unite_id`). Le recâblage flashcards→contenu est un **suivi**. **Ce n'est PAS une régression** : les synthèses ancrées **unité** restent intactes. (§6.2)

**Effet sur le §11** : les 13 questions Q1–Q13 sont **toutes tranchées** ; il ne subsiste **aucune question bloquante** (§11 réduit à un renvoi + reliquats non bloquants).

---

## 3. Concepts & vocabulaire

| Terme | Définition |
|---|---|
| **Plan annuel d'évaluation** | 1 ligne par (classe, année scolaire) : gabarit de cadence + ancre de génération + statut `brouillon`/`valide`. Le « plan » du prof pour évaluer cette classe cette année. |
| **Exercice planifié** | 1 ligne du plan : une typologie (§3 du PROMPT), un ancrage temporel, un statut de conception, éventuellement un lien vers l'objet du module (quiz, session Codex). Ce n'est **pas** l'exercice lui-même (qui vit dans son module) : c'est son créneau + son état de préparation. |
| **Typologie (2 axes + variante)** | `nature` (formatif/évaluatif) × `lieu` (classe/maison) + `diagnostique` (booléen, variante à prompts distincts — prévue dès le modèle, logique fine différée). 7 `type_exercice` : `ecriture`, `lecture`, `synthese`, `quiz`, `examen_livre`, `fragment` (réservé), `essai` (réservé). **`fragment` n'a pas un lieu unique** (D11) : écrit → `lieu='maison'`, oral → `lieu='classe'` (deux branches du CHECK §4.3). |
| **Ancrage `semaine`** | L'exercice vise une **semaine d'enseignement** : `semaine_lundi` (date pure du lundi, **figée à la génération, jamais recalculée**) + `jour_prevu` optionnel dans la semaine. Échéance effective (`dateEffectiveExercice`, §4.6 — **LA date unique** du fenêtrage calendrier, du à-faire et du retard) : `jour_prevu` si posé ; sinon **dimanche** (`+6`, convention Aletheia mode b) pour `lieu='maison'`, **lundi** (+ mention « jour à caler ») pour `lieu='classe'`. |
| **Ancrage `parcours`** | Exception synthèse (PO 2) : la ligne porte (parcours, cours) et sa date est **résolue à la lecture** = semaine du dernier créneau du cours, traduite par classe (snapshot publié > frise). |
| **Statut de conception** | `a_concevoir` → `concu` (posé par les actions de liaison, re-vérifié à la lecture) ; `annule` (retrait post-validation, tombstone). **Jamais** de statut d'exécution stocké. |
| **Dérivés (jamais stockés)** | « réalisé » = `lance_at` de l'objet lié ; « en retard » = `a_concevoir` ∧ échéance passée ; « à recaler » = `semaine_lundi` ne matche plus la frise courante (semaine devenue vacances/hors semestre). |
| **Fenêtre diagnostique** | Étiquette de génération/contrôle `septembre`/`decembre`/`fevrier` — pas un ancrage : l'ancrage reste `semaine_lundi` ; sortir de la fenêtre = signal, jamais blocage. |
| **Origine** | `cadence` (générée par le gabarit), `diagnostic` (fenêtres), `synthese_auto` (hook parcours), `manuel`. Clé d'idempotence de la génération. |
| **Gabarit** | TC (cycle écriture→écriture→lecture, 1/sem maison), HLP (même cycle ; fragments/lecture de livre **non générés**, cf. PO 7), vierge (rien). Paramètres fins dans `config` jsonb. **Choisi explicitement par plan** (PO 3) — distinct du `type_pedagogique` ci-dessous. |
| **Type pédagogique (classe)** | Attribut **structuré** `classes.type_pedagogique ∈ {tc, hlp, autre}` (nullable, renseigné par le prof, **jamais dérivé de `filiere`** — D1a/D3). Sert à la **propagation** d'un plan et au **hook de création de classe** (D1c/D1d) ; **distinct** du `gabarit` (le prof peut ouvrir un plan `vierge` sur une classe `tc`). |

---

## 4. Modèle de données + SQL esquissé

Fichier : **`plan_evaluation_phase_a.sql`** (racine, joué à la main, jamais automatiquement). 100 % additif, idempotent (`create table if not exists`, `create [unique] index if not exists`, `alter table … add column if not exists`, `drop policy if exists` + `create policy`, `insert … on conflict do nothing`, `do $$ … exception when duplicate_object $$` pour les contraintes sur table préexistante), dans `begin/commit`. **Zéro modification de `quazian_quizzes`, `scriptorium_parcours*`** ; **deux deltas ADDITIFS sur tables vivantes**, tous deux inertes tant qu'aucun code gaté n'écrit : (i) la colonne `classes.type_pedagogique` **nullable** (§4.1bis — backfill NULL, aucune contrainte NOT NULL, aucune ligne existante affectée) et (ii) l'arc bi-source de `codex_sessions` (§4.4, inerte tant qu'aucun code ne pose `contenu_id`).

### 4.1 Gate

```sql
-- Gate dark-launch (patron aletheia_params.mode_c_actif ; table DÉDIÉE : ne pas
-- s'adosser à calendrier_params, dont le .sql est encore « à exécuter »).
create table if not exists scriptorium_params (
  id int primary key default 1 check (id = 1),
  plan_evaluation_actif boolean not null default false,
  -- Réglage prof (D5) : un quiz `concu` apparaît-il au calendrier ÉLÈVE avant lancement ?
  -- false = surprise (défaut), true = annoncé. Lu par le filtre `surface` de l'émission (E1/E2).
  quiz_annonce_defaut   boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into scriptorium_params (id) values (1) on conflict (id) do nothing;
-- Idempotent si la table préexiste (rejeu / évolution) :
alter table scriptorium_params add column if not exists quiz_annonce_defaut boolean not null default false;
```

Lecture **tolérante** : `lireGatePlanActif(admin)` renvoie `false` si la table/colonne est absente (patron exact `lireModeCActif`, `utils/aletheia-dates.ts:502`) — le code dégrade proprement **avant** exécution du SQL. Le réglage `quiz_annonce_defaut` est lu par le même helper (tolérant : colonne absente → `false` = surprise).

### 4.1bis Type pédagogique de la classe (delta ADDITIF sur `classes`, D1a)

```sql
-- Attribut STRUCTURÉ pour la propagation (P5) et le hook de création de classe (P6).
-- NULLABLE, backfill NULL : renseigné par le prof (CreerClasse), JAMAIS dérivé de
-- classes.filiere (texte libre — D3). Aucune contrainte NOT NULL, aucune ligne existante
-- modifiée ; inerte tant que le code gaté ne le lit pas (propagation / hook).
alter table classes add column if not exists type_pedagogique text
  check (type_pedagogique in ('tc', 'hlp', 'autre'));
```

- **RLS/FK** : aucune nouvelle FK ; les policies `classes` existantes (`classes_prof_all`, `classes_eleve_read`, `lot1_classe_schema.sql:167-173`) couvrent la colonne sans changement — un élève lit déjà la ligne de SA classe (le nouveau champ est prof-écrit, non sensible).
- **Delta UI (spec seulement)** : `CreerClasse.tsx` gagne un `<select>` « Type pédagogique » (TC / HLP / Autre, **optionnel**, aucun défaut) ; `classes.filiere` reste un input texte libre distinct. Le formulaire n'écrit `type_pedagogique` que s'il est choisi. **Ce `<select>` n'est PAS gaté** (gater un simple attribut de classe serait bancal) : c'est une **exception additive ASSUMÉE** à l'invariant byte-identique gate OFF — champ **prof-only, optionnel, non sensible, SANS aucun consommateur gate OFF** (ses seuls lecteurs, la propagation P5 et le hook P6, sont gatés), **zéro risque comportemental**. L'invariant byte-identique est donc **scopé aux surfaces élève + flux vivants** (§9.1) et la recette de diff prof gate-OFF **excepte explicitement ce champ** (§9.1, §9.2-9). (§5.1, §9.2)
- **Idempotence** : `add column if not exists` — rejouable ; classes déjà créées → `type_pedagogique = NULL` (le prof le renseignera à la première ouverture d'un plan ou en éditant la classe).

### 4.2 Plan annuel

```sql
create table if not exists scriptorium_plans_evaluation (
  id              uuid primary key default gen_random_uuid(),
  classe_id       uuid not null references classes(id) on delete cascade,
  -- Année scolaire au format ENTIER de la frise (anneeScolaireDe) : 2026 = AY
  -- [2026-08-01, 2027-07-31]. JAMAIS dérivée de classes.annee_scolaire (texte libre
  -- '2025-2026') ni de classes.filiere (PO 3) ; dérivée de date_debut, défendue en action.
  annee_scolaire  integer not null,
  gabarit         text not null check (gabarit in ('tc', 'hlp', 'vierge')),
  date_debut      date not null,      -- ancre de génération (date pure, snap frise comme les parcours)
  -- Boutons de génération extensibles sans migration :
  -- { "cycle": ["ecriture","ecriture","lecture"], ... }
  config          jsonb not null default '{}',
  statut          text not null default 'brouillon' check (statut in ('brouillon', 'valide')),
  valide_at       timestamptz,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),   -- maj applicative (convention repo)
  supprime_at     timestamptz                            -- soft-delete
);
-- Un seul plan VIVANT par classe et par année scolaire.
create unique index if not exists uk_plans_evaluation_classe_ay
  on scriptorium_plans_evaluation(classe_id, annee_scolaire) where supprime_at is null;
```

### 4.3 Exercices planifiés

```sql
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
  -- Combinaisons du §3 VERROUILLÉES (assouplir plus tard = drop/add constraint, additif).
  constraint exercices_typologie_chk check (
       (type_exercice = 'ecriture'     and not diagnostique and nature = 'formatif'  and lieu = 'maison' and module = 'codex')
    or (type_exercice = 'ecriture'     and     diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'codex')
    or (type_exercice = 'lecture'      and not diagnostique and nature = 'formatif'  and lieu = 'maison' and module = 'aletheia')
    or (type_exercice = 'lecture'      and     diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'aletheia')
    or (type_exercice = 'synthese'     and not diagnostique and nature = 'formatif'  and lieu = 'classe' and module = 'codex')
    or (type_exercice = 'quiz'         and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'quazian')
    or (type_exercice = 'examen_livre' and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'aletheia')
    or (type_exercice = 'fragment'     and not diagnostique and nature = 'evaluatif' and lieu = 'maison' and module = 'fragments')  -- fragment ÉCRIT (maison) — RÉSERVÉ (0 ligne v1), D11
    or (type_exercice = 'fragment'     and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'fragments')  -- fragment ORAL (classe) — RÉSERVÉ (0 ligne v1), D11
    or (type_exercice = 'essai'        and not diagnostique and nature = 'evaluatif' and lieu = 'classe' and module = 'fragments')  -- RÉSERVÉ (0 ligne v1)
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
  -- RESTRICT = garde-fou qui SE DÉCLENCHE dans un flux vivant : purgerContenuBiblio
  -- (actions.ts:775) fait un DELETE DUR d'un contenu de corbeille → comportement
  -- spécifié §9.2-7 (détachement/refus AVANT le delete, jamais d'erreur 23503 brute).
  parcours_id   uuid references scriptorium_parcours(id) on delete restrict,
  contenu_id    uuid references scriptorium_contenus(id) on delete restrict,
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
  -- Ceinture : une ligne d'origine 'diagnostic' porte TOUJOURS sa fenêtre — sans quoi
  -- uk_exercices_diagnostic (NULLS DISTINCT) perdrait sa garantie d'idempotence (G6) :
  -- deux lignes diagnostic à fenêtre NULL coexisteraient sans violation.
  constraint exercices_diag_fenetre_chk check (origine <> 'diagnostic' or fenetre_diagnostique is not null),

  -- ── Liens vers les objets de modules EXISTANTS (une FK par module, additif) ──
  quiz_id           uuid references quazian_quizzes(id) on delete set null,
  codex_session_id  uuid references codex_sessions(id)  on delete set null,
  -- (futur, ADDITIF : aletheia_exercice_id, codex_exercice_id, epreuve_id…)
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
-- course « deux onglets créent chacun un quiz pour le MÊME exercice » passe ces
-- index sans erreur (deux UPDATE successifs de quiz_id sur la même ligne : le
-- second écrase le premier) → fermée par le claim-UPDATE conditionnel (Q2/S4).
create unique index if not exists uk_exercices_quiz
  on scriptorium_exercices_planifies(quiz_id) where quiz_id is not null and supprime_at is null;
create unique index if not exists uk_exercices_codex_session
  on scriptorium_exercices_planifies(codex_session_id) where codex_session_id is not null and supprime_at is null;
-- Une synthèse vivante par (plan, parcours, cours) — dédup de l'auto-création.
create unique index if not exists uk_exercices_synthese
  on scriptorium_exercices_planifies(plan_id, parcours_id, contenu_id)
  where type_exercice = 'synthese' and supprime_at is null;
-- Idempotence de génération : au plus UNE ligne de cadence par (plan, semaine, type)
-- et UNE ligne diagnostique par (plan, fenêtre, type) — les lignes `annule` vivantes
-- comptent (l'annulation est respectée par la régénération, §0).
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
```

**Contraintes applicatives** (server actions, en plus des CHECK) : `semaine_lundi` dans l'AY du plan ; `contenu_id` du bras parcours pointe un `type='cours'` (+ option ceinture-bretelles : FK composite `(contenu_id, contenu_type)` → `scriptorium_contenus(id, type)` sur le patron `parcours_creneaux_livre_type_fk` — recommandée) ; `annee_scolaire = anneeScolaireDe(date_debut)` ; cohérence quiz/session liés (classe du quiz = classe du plan).

### 4.4 Arc bi-source `codex_sessions` (2ᵉ delta additif sur table vivante — cf. §4.1bis)

Requis par la « préparation » d'une synthèse ancrée sur un **cours de bibliothèque** (`codex_sessions.scriptorium_unite_id` est `NOT NULL`, `codex_schema.sql:36`, et les cours de parcours vivent dans `scriptorium_contenus`). Même patron que `scriptorium_contenu_images` :

```sql
alter table codex_sessions alter column scriptorium_unite_id drop not null;
alter table codex_sessions add column if not exists contenu_id uuid
  references scriptorium_contenus(id) on delete restrict;
do $$ begin
  alter table codex_sessions add constraint codex_sessions_source_chk check (
    (scriptorium_unite_id is not null and contenu_id is null)
    or (scriptorium_unite_id is null and contenu_id is not null)
  );
exception when duplicate_object then null; end $$;
```

Inerte tant que le code gaté ne pose pas `contenu_id` (toutes les lignes existantes satisfont le CHECK). **Pas** de colonne `exercice_id` sur `codex_sessions` ni `quazian_quizzes` (lien côté plan, §0).

### 4.5 RLS

Prof-only strict `FOR ALL` sur les 3 tables neuves (patron exact `parcours_phase_a.sql:175-204`). **Aucune policy SELECT élève, jamais** (faute historique « RLS élève FOR ALL » de l'audit 2026-07-02) : toute lecture au profit d'une surface élève passe par **client admin + garde applicative** (patron `assemblerEvenements` bloc Aletheia, `utils/calendrier-evenements.ts:123`).

```sql
alter table scriptorium_params               enable row level security;
alter table scriptorium_plans_evaluation     enable row level security;
alter table scriptorium_exercices_planifies  enable row level security;
drop policy if exists plans_evaluation_prof_all on scriptorium_plans_evaluation;
create policy plans_evaluation_prof_all on scriptorium_plans_evaluation
  for all
  using      (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'prof'));
-- (idem exercices_planifies_prof_all, scriptorium_params_prof_all)
```

### 4.6 Helpers (nouveaux fichiers)

- **`utils/parcours-apercu.ts`** (extraction) : la brique privée « aperçu d'une assignation » (`friseApercu` + chargement snapshot) sort de `utils/aletheia-dates.ts` vers un module partagé, ré-importé par aletheia-dates (**byte-identique**, tests `aletheia-dates.test.ts` inchangés) et consommé par la résolution synthèse. *Alternative écartée : dupliquer ~40 lignes — deux résolveurs qui divergent au premier fix.*
- **`utils/plan-cadence.ts`** (PUR, testé au patron `frise-enseignement.test.ts`) : `genererCadence(frise, gabarit, config, aPartirDe)`, `placerDiagnostics(frise, annee_scolaire, aPartirDe)` (l'ancre est un PARAMÈTRE : les fenêtres antérieures à l'ancre ne sont pas générées, G3), `budgetSemaine(...)` (§7.3), constantes `DUREES_EXERCICES` et `CIBLES_GABARIT`. **Contrat `jour_prevu` des diagnostics (aligné G3/P5)** : `coursParJour` est de l'**I/O async par classe** (`utils/calendrier-cours.ts:7`, lit `teaching_patterns` + exceptions) — une fonction **pure** ne peut donc pas résoudre elle-même le `jour_prevu` « premier jour de cours de la classe » qu'exige G3 et sur lequel P5 fonde la **divergence inter-classes**. Deux formes admises (l'une **OU** l'autre, au choix de l'implémenteur) : **(i)** `placerDiagnostics` **reçoit les jours de cours pré-résolus en paramètre** (ex. `joursDeCoursParDate`, résolus par la couche I/O `utils/plan-exercices.ts` à partir de `coursParJour`) et **reste pure** ; **(ii)** elle **renvoie les diagnostics SANS `jour_prevu`** (seulement `semaine_lundi` + fenêtre) et la **couche I/O le remplit** depuis `coursParJour` (repli lundi). Dans les deux cas, la divergence des `jour_prevu` diagnostiques entre classes (§5.1-P5) est portée par la **couche I/O**, jamais par la fonction pure — la signature `placerDiagnostics(frise, annee_scolaire, aPartirDe)` reste pure quelle que soit la forme (elle ne fait **aucun** I/O `coursParJour`).
- **`utils/plan-exercices.ts`** (I/O client admin) : `lireGatePlanActif`, `dateEffectiveExercice(admin, exo)` — **LA date unique** consommée par E2 (fenêtrage ET émission), A1/A2 et le panoptique : bras `semaine` → `jour_prevu`, sinon dimanche (`maison`) ou lundi (`classe`) ; bras `parcours` → résolue §5.4 —, `exercicesDates(admin, { debut, fin, classeIds?, statuts? })`, `synchroniserStatutExerciceQuiz(admin, quizId)`, `resoudreDateSynthese(admin, planId, parcoursId, contenuId)`.

---

## 5. Cycles de vie & règles de génération

### 5.1 Création du plan (règles P)

- **P1.** Création explicite dans Scriptorium, onglet **« Évaluations »** (`?vue=evaluations`, mécanique `?vue=` existante de `app/prof/scriptorium/page.tsx`, onglet porté par la Barre 2) : une tuile par classe active (« Plan 2026-2027 · brouillon / validé / aucun »). Formulaire : **gabarit** radio TC/HLP/vierge, obligatoire, **aucun défaut pré-coché** — `classes.filiere` (texte libre) **et** `classes.type_pedagogique` (structuré) affichés en simple info grisée, **jamais** utilisés pour présélectionner le gabarit (PO 3) ; si `type_pedagogique is null`, invite non bloquante à le renseigner (utile à la propagation P5) ; **date de début** (`ChampDate`, défaut proposé = `start_date` du **premier semestre non archivé À VENIR** — `start_date ≥ aujourd'hui`, toutes AY confondues : en juillet, l'« AY courante » d'`anneeScolaireDe` est encore l'année écoulée, un défaut qui y pointerait (janvier passé) générerait un plan entièrement échu et inonderait le à-faire d'« en retard » fantômes, contre le cas #15 ; aucun semestre à venir → **aucun défaut** + bandeau « définis les semestres de la rentrée dans le Calendrier »), snappée à la frise (règle d'ancre des parcours) ; **avis non bloquant si `date_debut < aujourd'hui`** (« ce plan générera des exercices déjà échus »), répété à la validation (V2) ; **année scolaire** dérivée (`anneeScolaireDe(date_debut)`), affichée, non éditable.
- **P2.** Unicité : un plan vivant par (classe, AY) (`uk_plans_evaluation_classe_ay`). L'année suivante = un nouveau plan.
- **P3.** La génération (§5.2) s'exécute **à la création**, dans le brouillon (transposition du §6.1 du PROMPT). Un plan `brouillon` est **inerte** : aucune dérivation à-faire/calendrier/modules (double garde avec le gate).
- **P4 — Pas de suppression de plan en v1.** Aucune action ne pose `plans.supprime_at` (colonne + unicité partielle **réservées** à un futur « supprimer/recommencer le plan » — chantier explicite le jour venu, avec ses effets sur les exercices). Les prédicats des consommateurs (E2, A1/A2, panoptique) exigent néanmoins `supprime_at is null` **dès maintenant** : un plan soft-deleté par un futur bouton s'éteindra partout sans re-spécification.
- **P5 — Propagation à la création (D1c).** Juste **après** la création (et génération, §5.2) d'un plan pour une classe, `propagerPlan(planSourceId, classesCiblesIds[])` propose (écran de confirmation, **jamais silencieux**) d'appliquer le **même `gabarit` + même `date_debut` + même `config` jsonb** aux **classes candidates**. Candidates = classes **`statut='active'`**, de **même `type_pedagogique`** (non NULL) que la source, **sans plan vivant pour l'AY** (int `anneeScolaireDe(date_debut)`) — filtre d'affichage additionnel best-effort sur `classes.annee_scolaire` (texte) identique à la source, jamais contraignant. Le prof coche/décoche finement, accepte ou refuse tout. Pour **chaque** cible retenue : création d'un plan **indépendant** (nouvelle ligne `scriptorium_plans_evaluation`, `created_by`=prof, **copiant `gabarit`, `date_debut` ET la colonne `config` jsonb de la source** — sans la copie de `config`, un cycle personnalisé ou un réglage `compterFragments` (§7.3) divergerait dès la copie, produisant des jumeaux non conformes) **puis** génération §5.2 **sur la frise et les jours de cours PROPRES de la cible** (`coursParJour` diffère par classe : les `jour_prevu` diagnostiques divergent, la cadence maison est identique car le calendrier est global). Résultat : **plans + exercices parallèles et INDÉPENDANTS** — aucune ligne partagée, aucune classe verrouillée ; chaque cible diverge ensuite librement (V1/V3/R1). Idempotent : une cible acquérant entre-temps un plan vivant est ignorée (`uk_plans_evaluation_classe_ay`). **Gaté** (`plan_evaluation_actif` OFF → propagation absente, comme tout l'onglet). Le statut du plan propagé = **`brouillon`** (le prof valide chaque cible séparément) ; propager depuis un plan `brouillon` **ou** `valide` est permis (le gabarit copié, pas le statut).
- **P6 — Hook à la création d'une classe (D1d).** À la création d'une classe **via `CreerClasse`** (gate ON) : si la nouvelle classe porte un `type_pedagogique` non NULL **et** qu'il existe au moins un plan vivant d'une autre classe de **même `type_pedagogique`** pour **l'AY de rapprochement**, proposer (bandeau/CTA, **accepter/refuser**, jamais d'automatisme) d'appliquer ce plan à la nouvelle classe (même mécanique de copie que P5, une seule cible). **AY de rapprochement — définie EXACTEMENT comme le défaut de `date_debut` de P1** (répercussion du finding #19, jamais laissée implicite) : l'AY **entière** dérivée de `anneeScolaireDe(start_date)` où `start_date` = celui du **premier semestre non archivé À VENIR** (`start_date ≥ aujourd'hui`, toutes AY confondues) ; on n'apparie **QUE** les plans vivants dont `annee_scolaire` (int) **= cette AY**. **Jamais `anneeScolaireDe(today)` brut** — en été (création des classes de rentrée) il pointe l'**année écoulée**, ce qui rapprocherait un plan **échu** (jamais soft-deleté, P4) dont la copie P5 générerait un plan **entièrement échu** (les « en retard » fantômes que #19 a supprimés), **ou** raterait le plan de rentrée ; **jamais `classes.annee_scolaire`** (texte libre). **Aucun semestre à venir → aucune proposition** (comme P1 sans défaut). Refus = rien. Convenance de rentrée ; le chemin nominal reste « Créer le plan annuel » depuis l'onglet Évaluations. Gate OFF → aucune proposition (byte-identique à `CreerClasse` actuel).

### 5.2 Génération de la cadence et des diagnostics (règles G)

- **G1 — Matière première.** Frise d'enseignement de l'AY via `friseEnseignementContinue` (tous les semestres vivants de l'AY, vacances sautées, gardes M1/M3/M4 héritées). Semaines couvertes = de l'ancre (snap de `date_debut`) à la dernière semaine du dernier semestre défini. La frise sert à **générer, étiqueter et diagnostiquer** — jamais à re-résoudre les lignes du bras `semaine`.
- **G2 — Cadence formative (§5 du PROMPT).** Pour chaque semaine couverte `k` (0-indexée depuis l'ancre) : **TC** et **HLP** → 1 exercice `origine='cadence'`, `lieu='maison'`, `nature='formatif'`, `statut='a_concevoir'`, type = cycle `k mod 3` (écriture, écriture, lecture), `semaine_lundi` = lundi de la semaine, `jour_prevu = null` (échéance dérivée = dimanche). **vierge** → rien. L'alternance HLP fragment/lecture de livre n'est **pas générée** (PO 7 + §0) : comptée au budget seulement.
- **G3 — Diagnostics (§7 du PROMPT ; existence posée, logique fine différée ; hypothèses confirmées PO — D6).** Pour TC et HLP, par fenêtre (septembre AY, décembre AY, février AY+1) : 1 **écriture diagnostique** + 1 **lecture diagnostique** (`origine='diagnostic'`, `diagnostique=true`, `nature='evaluatif'`, `lieu='classe'`, `fenetre_diagnostique` posée). Placement : semaines candidates = semaines **COUVERTES** (au sens G1, donc **≥ ancre**) dont le **lundi tombe dans le mois cible** — une fenêtre entièrement antérieure à l'ancre n'est **pas générée** (même bandeau que la fenêtre en vacances ; sinon un plan créé en janvier — classe en cours d'année, cas #15 — placerait septembre/décembre dans le passé, « en retard » fantômes garantis) ; écriture → 1ʳᵉ candidate, lecture → 2ᵉ (ou la même s'il n'y en a qu'une) ; `jour_prevu` = premier jour de cours de la classe dans la semaine (`coursParJour`, `utils/calendrier-cours.ts:7` sur `teaching_patterns`), repli lundi. **Zéro candidate** (fenêtre en vacances / février sans S2 défini) → **non généré + bandeau** « fenêtre de février non couverte — définissez le semestre 2 puis “Étendre le plan” ».
- **G4 — « S'ajoutent sans remplacer ».** Les diagnostics n'évincent jamais l'exercice formatif maison de leur semaine (deux lignes la même semaine, marqueur distinct au panoptique) ; ils ne comptent **pas** au budget (le budget mesure le travail maison).
- **G5 — Semaines sans semestre défini.** Rien n'est généré au-delà du dernier semestre défini (le plan n'a pas de « longueur propre » à honorer, contrairement aux parcours — pas de statut `a_definir` ici). Bandeau informatif + action **« Étendre le plan »** (§5.6) au moment voulu. Avec la décision A2 du SPEC Parcours (semestres définis à l'avance), cas marginal.
- **G6 — Idempotence.** La génération ne crée une ligne que si sa clé (`uk_exercices_cadence` / `uk_exercices_diagnostic`, rendue TOTALE côté diagnostics par `exercices_diag_fenetre_chk`) est libre : relançable sans danger ; les lignes `annule` vivantes bloquent leur clé (annulation respectée).

### 5.3 Brouillon, validation, vie courante (règles V)

- **V1 — Édition en brouillon.** Grille une-ligne-par-semaine (libellé `S1 · sem. 3` + dates réelles — jamais d'`indexContinu` brut) : ajouter (tout type dont quiz/examen, `origine='manuel'`), retirer (**DELETE dur** en brouillon pour les lignes `cadence`/`diagnostic`/`manuel`, rien n'en dépend ; **exception `origine='synthese_auto'` : soft-delete (tombstone)** — l'anti-résurrection de S3 repose sur l'existence d'une ligne, un DELETE dur laisserait le prochain hook la recréer en silence), déplacer (changer `semaine_lundi`/`jour_prevu` — règle de bascule d'origine V3-a, valable dès le brouillon), changer le type d'un généré (le cycle E→E→L est un état initial, pas un invariant re-fluidifié). Chip budget recalculée à chaque édition.
- **V2 — Validation.** « Valider le plan » → `statut='valide'`, `valide_at=now()`. L'avis « date de début passée » de P1 est répété ici le cas échéant. Effets (gate ON) : les `a_concevoir` deviennent dérivables (à-faire §6.4, calendrier prospectif §6.4, listes « à concevoir » dans les modules — la requête est triviale (`where statut='a_concevoir' and type_exercice=X`) et les **surfaces sont livrées** : encart Quazian au lot 4, entrée Codex au lot 5, §10 — le PROMPT §6.3a exige que l'exercice APPARAISSE dans son module, pas seulement qu'un deep-link y mène). La validation n'est **pas un gel** : le plan reste éditable (V3). **Pas de dé-validation** (retour brouillon interdit — éviterait un état « validé puis caché » ambigu pour les dérivations).
- **V3 — Après validation.** Re-dater (`deplacerExercice` — **interdit si réalisé**, dérivé) avec trois règles :
  - **(a) Bascule d'origine.** Une ligne `origine='cadence'` déplacée devient **`origine='manuel'`** : elle sort du périmètre R1 et **libère sa clé `uk_exercices_cadence`** — sans cette bascule, tout déplacement vers une semaine portant déjà une ligne de cadence du même type violerait l'index (1 cas sur 3 dans le cycle E→E→L : la clé confondrait l'idempotence de génération et la position courante). Contrepartie documentée : la régénération peut recréer une ligne de cadence sur la semaine libérée — visible au diff (R1). Les lignes `diagnostic` **gardent** leur origine (leur clé d'idempotence est la fenêtre, pas la semaine — aucune collision possible) ; les `synthese_auto` ne se déplacent pas (date résolue, S1).
  - **(b) Avis hors frise.** Avis non bloquant si la semaine cible est hors frise (« cette semaine est hors enseignement ») — badge « à recaler » ensuite (J2).
  - **(c) Quiz lié.** Si un **quiz non lancé** est lié, `semester_id` du quiz est **re-résolu** (règle Q7) quand la semaine cible change de semestre — sinon un quiz planifié fin S1, conçu, re-daté début S2 resterait compté dans les notes de S1, la dérive que Q7 élimine ; semaine cible hors de tout semestre → déplacement **refusé** (un quiz doit compter dans un semestre, même message que Q7). Quiz lancé = réalisé = re-datation déjà interdite.

  Ajouter (`origine='manuel'`, effet immédiat) ; retirer → `statut='annule'` (soft, la ligne reste pour l'historique et bloque la régénération sur sa clé) ; **Réactiver** (action exposée sur les lignes `annule` du détail du plan) → `statut='a_concevoir'` après revalidation de la clé d'unicité concernée (`uk_exercices_cadence`/`uk_exercices_diagnostic`/`uk_exercices_synthese` — clé occupée → refus explicite « une ligne équivalente existe déjà »). Les annulés n'alimentent ni à-faire, ni calendrier, ni budget. **Aucun glissement automatique de dates, jamais** (PO 4) : ni au jour J, ni quand le calendrier change.
- **V4 — « Marquer conçu » (soupape ; confirmée dès v1 — D8).** Action manuelle `statut='concu'` sans objet lié — indispensable tant que les modules de conception d'`ecriture`/`lecture`/`examen_livre` n'existent pas (sinon leurs alertes sont inactionnables), et utile si le prof conçoit hors application. Re-vérification à la lecture : un `concu` **avec** `quiz_id` dont le prédicat re-dérivé est faux (question repassée `suggere`, quiz disparu) = diagnostic de drift, jamais de correction silencieuse.

### 5.4 Exception synthèse — ancrage `parcours` (règles S)

- **S1 — Semaine-cible (fin de cours = dernier créneau, confirmé PO — D7).** Un « cours » = un `scriptorium_contenus` `type='cours'` référencé par ≥1 créneau du parcours. Semaine-cible = **`max(semaine)`** des créneaux vivants du parcours référençant ce contenu (un cours étalé se synthétise après son dernier créneau). Recalculée à chaque lecture → **déplacer un créneau déplace la synthèse, par construction, sans écriture.**
- **S2 — Date réelle par classe.** Semaine-cible → date via l'aperçu de l'assignation de LA classe du plan : **snapshot publié prioritaire, repli frise recalculée** (conventions `utils/aletheia-dates.ts` réutilisées via `utils/parcours-apercu.ts` ; une semaine ne porte une date que si `statut === 'definie'`). Jour affiché = **dernier** jour de cours de la classe dans la semaine (repli vendredi) — la synthèse a lieu en classe, en fin de cours.
- **S3 — Auto-création (gate ON).** Hooks dans les actions parcours existantes : `ajouterCreneau` (`app/prof/scriptorium/actions.ts:1261`) — si créneau-contenu de `type='cours'` → pour chaque classe assignée `active` du parcours **possédant un plan vivant** (brouillon inclus : ligne créée dormante), upsert de la ligne synthèse (`ancrage='parcours'`, `origine='synthese_auto'`, `statut='a_concevoir'`) ; `assignerParcoursClasse` (`:1410`) — idem pour chaque cours déjà présent. Idempotent (`uk_exercices_synthese`). **Tombstone anti-résurrection** : l'auto-création vérifie l'existence **y compris soft-deletée/annulée** pour `(plan, parcours, contenu)` et s'abstient (l'index partiel seul laisserait réinsérer). Classe sans plan → **aucune ligne**, signal doux dans le builder, jamais un blocage d'`ajouterCreneau` (soupape de dark-launch : le flux Codex manuel reste le chemin nominal).
- **S4 — Préparation & déclenchement (PO 2).** Action « **Préparer la synthèse** » (depuis à-faire/panoptique/l'entrée Codex « Synthèses à préparer », lot 5) : crée la `codex_sessions` en brouillon **ancrée `contenu_id`** (arc §4.4 ; `classe_id` = l'uuid de la classe du plan — la colonne est **uuid FK** depuis `lot1_classe_schema.sql:90-91`, cf. §6.3), puis pose le lien par **claim-UPDATE conditionnel** : `update … set codex_session_id = :sessionId, statut='concu', concu_at=now() where id = :exerciceId and codex_session_id is null and supprime_at is null` avec vérification du **rowcount** — 0 ligne (deux « Préparer » concurrents : la pré-lecture est un confort TOCTOU, elle ne ferme rien) → **supprimer la session brouillon fraîchement créée** + message « une séance Codex est déjà liée à cette synthèse » (l'index `uk_exercices_codex_session` ne ferme que la course inverse, §4.3). Préparation résiduelle (durée, consignes) et **déclenchement** (`lancerSynthese`, `app/prof/codex/actions.ts:69`, brouillon → phase_1) **inchangés**. « Réalisée » = dérivé de `codex_sessions.lance_at`. **`classe_id` toujours non NULL** ici (uuid de la classe du plan) — cohérent avec **D2** qui rend `classe_id` obligatoire pour **toute** création de synthèse, y compris le `creerSynthese` manuel hors plan (§6.2/§6.3) : plus aucun chemin ne produit de session sans classe.
- **S5 — Retraits symétriques.** `retirerCreneau` (`:1319`) : si c'était le **dernier** créneau du cours dans le parcours → synthèses correspondantes : `a_concevoir` sans session = soft-delete silencieux ; avec session = confirmation explicite (« la synthèse de ce cours a déjà une séance Codex ; la retirer du plan ? La séance Codex n'est pas supprimée ») puis `annule`. `retirerParcoursClasse` (`:1456`) : synthèses non réalisées de (parcours, classe) → `annule` (sessions Codex jamais supprimées automatiquement ; une session lancée reste, historique du module). **`supprimerParcours` (`:1239`)** : l'action existante soft-delete le parcours puis DELETE ses créneaux et assignations **en masse, sans passer par `retirerCreneau`/`retirerParcoursClasse`** — le hook doit y être câblé aussi (gate ON) : toutes les synthèses non réalisées des plans liés à ce parcours (toutes classes) passent `annule`, même règle que `retirerParcoursClasse` ; sessions Codex intouchées (sans quoi elles resteraient `a_concevoir` vivantes et non datables à perpétuité — asymétrie incohérente avec la désassignation d'une classe). `supprimerSynthese` Codex (`:53`, brouillon) : FK `set null` + l'action remet l'exercice lié `a_concevoir` (symétrie Q5 ; l'annulation est un acte du plan, pas une conséquence). **Ré-assignation après retrait** : le hook S3 respecte les tombstones (cas #6), mais le signal de ré-assignation **liste** les synthèses restées annulées (« N synthèses restent annulées — réactiver ? », action Réactiver de V3) — l'annulation automatique de S5 n'est pas une décision du prof, elle doit rester réparable en un geste.
- **S6 — Cas non résolus.** Cours retiré (0 créneau), parcours désassigné/archivé, semaine-cible `a_definir`/`non_planifiable`, **ou semaine-cible absente du snapshot publié** (parcours allongé / créneau ajouté APRÈS publication : le repli snapshot→frise est **par assignation, pas par semaine** — convention `apercuDe`/`echeanceDepuisApercu` d'`utils/aletheia-dates.ts:345-352,74-78` délibérément conservée, aucun écart avec Aletheia) → synthèse **non datée** : ni événement, ni tâche « approche » ; badge diagnostic au panoptique avec le **bon motif** (« synthèse sans date : cours retiré / parcours non planifié / **horaire publié périmé → Re-publier l'horaire** » — le diff `calculerDiffHoraire` signale déjà les semaines ajoutées, le badge pointe le remède). La ligne n'est jamais supprimée automatiquement.

### 5.5 Jour J & dérive calendrier (règles J)

- **J1 — Jour J d'un `a_concevoir`** (PO 4) : **invisible élève structurellement** (rien n'a été conçu, donc aucun module n'expose rien ; un quiz brouillon est déjà invisible — `app/eleve/modules/quazian/page.tsx:52` filtre `statut in ('lance','ferme')`, ET la RLS `quazian_quizzes_eleve_classe` porte le même filtre au niveau policy ; côté Codex la policy vivante n'a **pas** ce filtre de statut → resserrement `statut <> 'brouillon'` au lot 5, §8bis-6) + tâche « **en retard** » côté prof (§6.5). Pas de blocage, pas de glissement ; sortie : conception, annulation ou re-datation manuelle.
- **J2 — Dérive calendrier détectée, jamais corrigée.** Les `semaine_lundi` étant figés, l'édition du calendrier (vacance ajoutée, semestre re-borné) ne décale **rien**. À la lecture, un `semaine_lundi` qui ne matche plus aucune `dateDebutLundi` de la frise courante → badge **« à recaler »** + bouton global « Recaler sur le calendrier » proposant, **par exercice, « reporter » (semaine d'enseignement suivante) OU « annuler »** (diff explicite avant application). Un report suit la règle de déplacement V3-a (ligne de cadence → `origine='manuel'`, ce qui libère sa clé — sans quoi ~1 report sur 3 violerait `uk_exercices_cadence` : la semaine suivante porte presque toujours sa propre ligne de cadence, du même type dans les paires écriture→écriture du cycle) ; si la clé cible est occupée par une ligne vivante du même type, le diff **force le choix** (reporter ailleurs ou annuler — fusion interdite) ; si le report **empile deux exercices maison la même semaine**, le diff l'affiche et la chip budget (§7.3) signale le dépassement — le prof arbitre. Symétrique du diff snapshot↔frise (`calculerDiffHoraire`, `frise-serveur.ts:121` — privée aujourd'hui, à exporter).

### 5.6 Régénération scopée (règle R)

- **R1.** « Changer de gabarit » et « Étendre le plan » (nouveau semestre défini) partagent `regenererPlan(planId, gabarit, aPartirDe)` : périmètre = exercices `origine in ('cadence','diagnostic')` ∧ `statut='a_concevoir'` ∧ `semaine_lundi ≥ aPartirDe` (défaut : aujourd'hui). Les conçus, réalisés, manuels, annulés et le passé ne bougent **jamais** (les lignes déplacées ayant basculé `manuel` — V3-a — sont donc préservées ; la régénération peut recréer une ligne de cadence sur leur semaine d'origine libérée, **visible au diff**). **Diff obligatoire** avant application (« 14 supprimés, 16 générés, 2 conservés (conçus), 1 semaine ignorée (annulé) ») — même philosophie que la re-découpe consciente des livres et la re-publication d'horaire. Application : soft-delete du périmètre + génération de la queue (cycle redémarré à `aPartirDe`) + update `gabarit`.

---

## 6. Intégrations par module (deltas sur le code réel)

### 6.1 Quazian — quiz toujours planifié, déclenchement manuel (règles Q)

Flux actuel vérifié : `creerQuizz` (`app/prof/quazian/quizz/actions.ts:21`, exige un semestre `is_active` `:66-71`, insert `statut='brouillon'`) ; validation des questions (`validerQuestion:107`, `modifierQuestion:122`, `regenererDisctracteurs:153`, `validerToutesQuestions:183`) ; `supprimerQuizz` (`:197`, brouillons seulement) ; `lancerQuizz` (`app/prof/quazian/quizz/[quizId]/lancer/actions.ts:16`, `lance_at`). **Ce flux survit intégralement.** Zéro colonne sur `quazian_quizzes` (lien côté plan, la date vit sur l'exercice — une seule vérité).

- **Q1 — Entrée de conception.** À-faire et panoptique deep-linkent `/prof/quazian/quizz?exercice={id}` ; `CreerQuizz` lit le paramètre, préremplit et **fige la classe** (celle du plan), passe `exercice_id` dans le FormData.
- **Q2 — Garde serveur.** `creerQuizz` avec `exercice_id` : vérifier existence, `type_exercice='quiz'`, statut vivant, classe cohérente, aucun quiz déjà lié (pré-lecture de **confort** : c'est un read-check TOCTOU, il ne ferme aucune course). En fin d'action, poser le lien par **claim-UPDATE conditionnel** — `update scriptorium_exercices_planifies set quiz_id = :quizId, updated_at = now() where id = :exerciceId and quiz_id is null and supprime_at is null` (le statut `concu`, lui, reste dérivé par Q4) — avec vérification du **rowcount** : 0 ligne (un autre onglet a gagné la course) → **supprimer le quiz fraîchement créé** (encore brouillon, rien n'en dépend) + message propre « un quiz est déjà lié à cet exercice ». `uk_exercices_quiz` ne ferme que la course inverse (un même quiz revendiqué par deux exercices, §4.3).
- **Q3 — Chemin direct (invariant PO 5 sans blocage).** Gate ON + la classe a un plan **validé** : un quiz créé directement dans Quazian demande sa semaine prévue et **auto-crée l'exercice** (`origine='manuel'`, `quiz_id` posé). Classe sans plan validé → quiz créé quand même + signal (« cette classe n'a pas de plan annuel — le quiz n'apparaîtra pas au calendrier prospectif »). Auto-création **confirmée** par le PO (D3) ; le durcissement « refus dur » est **écarté**.
- **Q4 — Prédicat `concu`.** `concu` ⇔ `quiz_id` posé ∧ **100 % des questions `statut_validation='valide'`** (« préparé et sans erreur », PO 5). Posé par `synchroniserStatutExerciceQuiz(quizId)` appelé en fin des **5 actions** touchant quiz/questions (liste ci-dessus) ; recalcul idempotent (COUNT), jamais de compteur dénormalisé ; re-vérifié à la lecture (drift → diagnostic).
- **Q5 — Suppression du quiz** (`supprimerQuizz`) : l'exercice lié retombe `a_concevoir` (l'action le remet ; le `set null` de la FK est le filet si la suppression passe par un autre chemin).
- **Q6 — Déclenchement.** `lancerQuizz` **ne change pas d'une ligne** : « réalisé » est dérivé de `lance_at` via `quiz_id` (aucun hook). Lancer avant/après le jour J est permis ; l'écart planifié/réalisé est une info de panoptique, pas une erreur.
- **Q7 — Semestre.** Quand `exercice_id` est fourni, résoudre `semester_id` par la **semaine planifiée**, pas par `is_active` (un quiz de S2 conçu pendant S1 doit compter dans les notes de S2). **Pas par contenance** de `semaine_lundi` dans `[start_date, end_date]` : la première semaine d'un semestre dont le `start_date` n'est pas un lundi a un lundi ANTÉRIEUR au semestre (`calculerGrilleSemaines` démarre à `lundiOnOrBefore`, `utils/calendrier-grille.ts:47` ; la frise ne tronque qu'en fin — rentrée mardi 01/09/2026 → semaine 1 au lundi 31/08, contenue dans aucun semestre). **Règle retenue** : prendre le `semestreId` de la semaine de frise dont `dateDebutLundi = semaine_lundi` (la frise porte déjà l'association ; équivalent robuste si l'on requête en SQL : chevauchement `semaine_lundi ≤ end_date ∧ semaine_lundi + 6 ≥ start_date`). **Repli si aucune semaine de frise ne matche** (exercice « à recaler », semaine déplacée au-delà du dernier semestre, semaine en vacances hors frise) : **refuser la création du quiz** avec « la semaine planifiée de cet exercice n'appartient à aucun semestre — recale l'exercice ou définis le semestre dans le Calendrier » (cohérent avec le refus actuel `actions.ts:66-71` et avec J2), jamais de repli silencieux sur `is_active`, jamais de `semester_id` null. La **re-datation** d'un exercice à quiz lié non lancé re-résout `semester_id` (V3-c). Vérifier que `app/prof/quazian/semestre/` ne suppose rien d'autre.

### 6.2 Codex — synthèse (voir §5.4) + arc bi-source

Deltas code (lot 5) : (a) `chargerCoursUnite` (`utils/codex-analyse.ts:47`, appelée `:116` analyse V1 et `:289` retour final) devient `chargerAncrageSession(session)` — si `contenu_id` : lire `scriptorium_contenus.texte_extrait` (même format), sinon chemin documents actuel ; (b) les ~8 sites d'affichage joignant `scriptorium_unites(label)` sélectionnent en plus `scriptorium_contenus(titre)` via un helper partagé `libelleSession` (`unite?.label ?? contenu?.titre`). **Trois de ces sites sont ÉLÈVE** et font partie du **lot 5** (sinon la première synthèse ancrée `contenu_id` lancée en classe s'ouvre avec un titre vide) : `app/eleve/modules/codex/actions.ts:44` (bannière « Synthèse en cours »), `:92` (historique) et `app/eleve/modules/codex/synthese/[sessionId]/page.tsx:31` (h2 du titre). Les deux actions passent déjà par le client **admin** (patchables telles quelles) ; la page synthèse, elle, lit la session avec le client **user** → le libellé doit y être résolu **côté serveur via le client admin** (patron des actions élève voisines), **jamais par jointure user sur `scriptorium_contenus`** : la table est RLS prof-only (`contenus_prof_all`, `parcours_phase_a.sql:180-184`), la jointure renverrait silencieusement null. Ces trois patchs sont **inertes** tant qu'aucune session ancrée `contenu_id` n'existe (seul le code gaté en crée).

**Point dur assumé — cartes d'erreurs.** La validation Codex promeut des erreurs en `quazian_flashcards` attachées à `session.scriptorium_unite_id` (`app/prof/codex/validation/actions.ts:144`) ; une session ancrée `contenu_id` n'a pas d'unité (et la nullabilité de `quazian_flashcards.scriptorium_unite_id` est invérifiable dans le repo — DDL d'origine hors git). **Décision (confirmée PO — D13)** : pour les sessions ancrées contenu, la **promotion en cartes est désactivée** (garde `if (!session.scriptorium_unite_id)`) — les `codex_erreurs` restent créées (retour élève complet, seule la carte FSRS manque) — jusqu'au chantier **suivi** « recâblage Quazian → contenus ». **Ce n'est PAS une régression** : les synthèses ancrées **unité** (`scriptorium_unite_id` non NULL) conservent leur promotion en cartes FSRS **intacte** ; seule la nouvelle branche `contenu_id` est dégradée. *Alternative écartée : ajouter `quazian_flashcards.contenu_id` maintenant — ouvrirait le recâblage Quazian entier par la petite porte.*

**`classe_id` obligatoire à la création (D2, lot 0).** `creerSynthese` (`app/prof/codex/actions.ts:35+`) **accepte aujourd'hui `null`** ; une synthèse a **toujours** une classe. Delta : `creerSynthese` **exige** un `classe_id` non NULL (uuid d'une classe du prof), sans quoi l'action **refuse** avec un message clair (« choisis une classe pour cette synthèse »). Effet : la **source** de sessions Codex sans classe est **tarie** — le fix P0 (§6.3) reste le filet fail-closed pour d'éventuels résidus `classe_id null` déjà en base, mais aucun **nouveau** ne peut naître. L'ancienne alternative « statu quo : événement sans classe visible de tous » (Q13) est **supprimée** ; l'UI de création de synthèse rend le champ classe requis. (Delta hors gate, apparié au lot 0 avec le fix P0.)

### 6.3 Correctif préalable P0 — calendrier Codex : résolution de classe cassée (hors gate, lot 0)

**Schéma réel (corrigé au durcissement — la première version de ce § s'appuyait sur un DDL périmé).** `codex_sessions.classe_id` est **uuid FK** → `classes(id)` depuis `lot1_classe_schema.sql:90-91` (exécuté en base ; les tables Codex ont été **TRUNCATE au même moment**, `lot1:66-70` — aucune ligne à valeur nominale ne peut exister, donc **pas de « repli par nom pour données historiques »** : ce serait du code mort). `codex_schema.sql:37` et le commentaire « classe_id TEXTUEL » d'`utils/calendrier-evenements.ts:95` sont périmés — corriger ce commentaire au passage. `creerSynthese` stocke l'uuid du formulaire (`app/prof/codex/actions.ts:35+`) et **accepte `null`**.

**Défaut vérifié.** `assemblerEvenements:104` résout la valeur (un uuid) dans `idParNom` — map indexée par **NOM** → échec → `classe_id: null` ; et la ligne `:110` sérialise l'**uuid brut comme `classe_nom`**. Côté prof : « Codex gris » + uuid affiché en guise de nom. Côté **élève**, le périmètre réel dépend de la policy en base : le repo contient DEUX policies contradictoires sur `codex_sessions` — `codex_schema.sql:137-141` (tout authentifié lit tout) et **F2** `review_fixes_2026-06-21.sql:155-166` (restreinte à SES classes + sessions `classe_id null`), exécutée et validée live d'après l'historique projet, et **valide** puisque la colonne est uuid (comparaison uuid = uuid). Si F2 est en base (probable), un élève ne lit pas les sessions des autres classes via le client user : la « fuite » se réduit aux sessions **`classe_id IS NULL`** (lisibles de tous) et au défaut d'affichage prof. **D2 supprime cette classe de cas à la source** : `creerSynthese` exige désormais une classe (§6.2), tarissant la création de sessions sans classe. Restent les rares **résidus** `classe_id null` déjà en base (créés depuis le TRUNCATE des tables Codex au lot1). **⚠️ Ils ne sont PAS couverts par le remap uuid ci-dessous** : ce fix ne remappe que les valeurs au **format uuid** (regex `RE_UUID`) ; un `classe_id` **NULL reste null** → l'événement passe le filtre partagé `e.classe_id === null` de la page élève (`app/eleve/calendrier/page.tsx:96`) et redevient **visible de TOUS les élèves**. Le résidu null est donc éteint par un **fail-closed CIBLÉ du chemin Codex** (point (4) ci-dessous), **pas** par le remap uuid ; le « événement général visible de tous » n'est **plus** une fonctionnalité, seulement un résidu à éteindre.

**Fix (lot 0, fail-closed).** (1) Si `s.classe_id` matche le **FORMAT uuid** (regex, patron `RE_UUID` d'`app/prof/scriptorium/actions.ts`), le prendre **tel quel** : un uuid d'une classe inconnue du spectateur ne passe pas le filtre `classeIds.has()` de la page élève — fail-closed par construction. **Surtout pas** un test d'appartenance `nomParId.has` : exécuté avec le client USER d'un élève, la map `classes` ne contient que SES classes (policy `classes_eleve_read`, `lot1:167-173`) → pour une session d'une autre classe le test échouerait → repli → `classe_id: null` → l'événement passerait le filtre `e.classe_id === null` — **fail-open précisément dans le cas visé**. (2) Poser `classe_nom: nomParId.get(cid) ?? null` (jamais l'uuid brut). (3) Conserver le repli par nom uniquement pour une valeur **non-uuid** (défense en profondeur ; aucune donnée ne devrait l'emprunter). **(4) Fail-closed CIBLÉ du résidu `classe_id null`** (correctif du défaut relevé ci-dessus) : quand `s.classe_id` est **NULL**, le chemin Codex **n'émet AUCUN événement élève**. `assemblerEvenements` reçoit `classeIds` **uniquement en contexte élève** (`classeIds` défini ; absent = prof — signature `utils/calendrier-evenements.ts:36-40`, la page élève passe `classeIds: [...classeIds]`, `app/eleve/calendrier/page.tsx:95`), donc le bloc Codex **saute la ligne** (`continue`) lorsque `s.classe_id` est null **et** `classeIds` est défini. Par **Q13**, une session Codex sans classe est un **résidu/bug**, pas un événement général légitime — à la différence d'un essai/quiz sans classe qui, lui, peut l'être. Ce fail-closed est **strictement ciblé Codex** : il **ne touche PAS** le filtre partagé `e.classe_id === null` de la page élève (les essais/quizz légitimement sans classe conservent leur visibilité — blocs 1/2 inchangés). Côté **prof** (`classeIds` absent), la session null reste **visible/auditable** (nom absent, plus d'uuid brut). **Audit ponctuel OPTIONNEL** : recenser les sessions déjà en base (`select id from codex_sessions where classe_id is null`) pour un **backfill prof** ciblé — sinon elles restent simplement **invisibles côté élève** (fail-closed), sans dette bloquante.

**Vérification préalable en base (lot 0, avant le fix)** : `select * from pg_policies where tablename = 'codex_sessions'` + type effectif de `classe_id` — recalibrer le périmètre du P0 (fuite élève réelle vs simple défaut d'affichage prof) sur ce constat. **Recette** : compte élève réel — session d'une autre classe invisible ; session de SA classe correctement nommée ; **`creerSynthese` sans classe → refusé** (D2, plus aucune session sans classe créable) ; **un résidu `classe_id null` en base → INVISIBLE côté élève** (fail-closed ciblé Codex, point (4) — et non plus « visible de tous » comme avant le correctif), tout en restant **auditable côté prof**. Bugfix + garde `classe_id` autonomes, à merger d'abord.

### 6.4 Calendrier — apparition prospective (règles E)

Extension d'`assemblerEvenements` (`utils/calendrier-evenements.ts:36` ; 4 sources aujourd'hui, quiz `:75-93` et synthèses `:95-116` **rétrospectifs** via `lance_at`) — nouvelle **source 5**, sous gate, lue via **client admin** (RLS prof-only, même raison que le bloc Aletheia `:123`) :

- **E1 — Anti-fuite par défaut (§8bis).** Signature : `assemblerEvenements(opts)` gagne **`surface?: 'prof' | 'eleve'`** (défaut **`'eleve'`**, fail-closed) — un commutateur de surface GÉNÉRAL, pas un booléen par cas : sous lui se rangent l'émission des `a_concevoir` (prof seulement) **et** la **rétention élève GÉNÉRALISÉE de tout exercice `concu` non encore lancé/exposé** (E2/§8bis-3 : synthèse tant que `codex_sessions.lance_at IS NULL`, `concu` sans objet de module jamais émis, quiz retenu **sauf** `quiz_annonce_defaut=true`) — le réglage D5 n'est donc qu'un **simple filtre** du lot 7 (lecture de `scriptorium_params.quiz_annonce_defaut`) sur l'**unique dérogation** quiz, pas une re-signature. Seule la page calendrier **prof** passe `'prof'`. Un appelant oublieux n'expose jamais rien au-delà du contrat élève.
- **E2 — Émission.** Exercices vivants non annulés des plans **`statut='valide' and supprime_at is null`** de classes **`statut='active'`** (prédicat COMPLET — ni E2 ni A1/A2 n'héritent d'un filtre implicite : le code actuel d'`assemblerEvenements` charge toutes les classes sans filtre de statut et les essais des classes fermées émettent aujourd'hui ; la source 5, elle, applique ce filtre ; `supprime_at` : cf. P4), date effective résolue dans `[debut, fin]` : `concu` → **émis côté prof toujours** ; **côté élève : RÈGLE DE RÉTENTION GÉNÉRALE (invariant §8bis-3)** — un exercice `concu` **non encore lancé/exposé à l'élève** n'est **JAMAIS** émis sous `surface='eleve'` : **(a) synthèse** (bras `parcours`) retenue tant que `codex_sessions.lance_at IS NULL` (symétrie exacte avec §8bis-6 ; une fois lancée, c'est l'événement RÉEL rétrospectif — bloc 3 — qui l'expose, jamais le prospectif, cf. E3) ; **(b) quiz** retenu tant que non lancé **SAUF si `quiz_annonce_defaut=true`** (D5, seule dérogation « annoncé » : quiz `concu` non lancé alors émis, libellé générique « Quiz » ; défaut `false` = surprise = retenu) ; **(c) exercices `concu` sans objet de module** (`ecriture`/`lecture`/`examen_livre` marqués `concu` via la soupape V4) **retenus par défaut** — aucun canal d'exposition élève n'existe pour eux en v1 (leurs modules de conception n'existent pas), donc **jamais émis** à l'élève ; `a_concevoir` → seulement si `surface='prof'`, label suffixé « (à concevoir) » ; `annule`/réalisé → jamais (E3). **Labels TOUJOURS génériques par type, sur les DEUX surfaces** (« Quiz », « Écriture — à la maison », « Lecture », « Synthèse », « Examen sur le livre »…) : `titre`/`note` ne sortent **jamais** d'`assemblerEvenements` — un seul objet `CalendarEvent` (un seul `label`) part vers les deux pages calendrier ; un label prof construit sur `titre` fuiterait chez les élèves au flip (§8bis-2) ; `titre`/`note` ne vivent que dans le détail du plan et la panoptique (surfaces prof dédiées). **Date = `dateEffectiveExercice` telle quelle** (§4.6 : maison → dimanche `semaine_lundi+6` ; classe → `jour_prevu`, sinon lundi + mention « jour à caler ») — le fenêtrage `[debut, fin]`, l'émission ET le retard (A2) utilisent **LA même date** : aucun objet fenêtré sur une date et affiché à une autre. Synthèses → instances résolues par classe (S2). `source_module` = **module de conception** → le filtre d'accès élève existant (`SLUG_PAR_SOURCE`, `app/eleve/calendrier/page.tsx:16`) s'applique sans modification. `classe_id` **toujours non null** (dérivé du plan). `source_id` = uuid de l'exercice (espace disjoint des quiz/sessions). `kind` réutilisés : quiz → `'quizz'`, évaluatif en classe (diagnostics, examen livre) → `'epreuve'`, échéance maison → `'fermeture'`, synthèse → `'jalon'`. `is_editable: false` en v1.
- **E3 — Dédoublonnage prospectif/réel.** Un exercice dont l'objet lié a un `lance_at` n'émet **plus** de prospectif : son événement réel existe déjà (blocs 2-3 inchangés). Avant lancement on voit la date prévue, après la date réelle — jamais les deux. **Cohérence avec la rétention élève généralisée (E2/§8bis-3)** : côté élève, un `concu` **non lancé** n'apparaît **ni** en prospectif (retenu — sauf quiz `quiz_annonce_defaut=true`) **ni** en réel (pas de `lance_at`) ; au lancement, le rétrospectif prend le relais — la bascule est **sans trou ni doublon** sur les deux surfaces. Les quiz/sessions legacy (sans exercice) continuent d'émettre leur rétrospectif.
- **E4 — Perf.** `maxDuration=60` déjà en place sur les deux pages calendrier. Le bras `semaine` coûte une requête (dates stockées) ; seules les synthèses résolvent la frise — mutualiser le cache d'aperçu par (parcours, classe) avec le bloc Aletheia (patron `apercuCache`, `utils/aletheia-dates.ts:344`).

### 6.5 À-faire prof (règles A)

Extension de `tachesDeriveesDuCalendrier` (`utils/calendrier-a-faire.ts:30` — une seule règle aujourd'hui, `joursAvant=10`, « conçu pour accueillir d'autres règles » ; consommé par `app/prof/page.tsx:25`, héros + fil « À préparer ») :

- **A1 — « À concevoir » (approche).** Exercices `a_concevoir` de plans `statut='valide' and supprime_at is null`, classes `statut='active'` (même prédicat qu'E2, écrit ici aussi — un implémenteur ne doit rien deviner), échéance effective (`dateEffectiveExercice`, la même qu'E2) ∈ `[today, +joursAvant]` → tâche « Concevoir : {libellé type} — {classe} », `href` = deep-link : quiz → Quazian (`?exercice=`) ; synthèse → « Préparer la synthèse » ; types sans module livré → détail du plan (`?vue=evaluations&plan={id}&exercice={id}`). Le fenêtrage est l'anti-explosion (un plan TC publié ≈ 30 lignes : le total vit au panoptique, pas dans le à-faire).
- **A2 — « En retard »** (PO 4). Échéance effective `< today` (même prédicat plan/classe qu'A1), toujours `a_concevoir`, **sans borne basse dans l'AY** (un retard ne s'efface pas en vieillissant) → tâche préfixée « En retard », triée en tête. Ajout d'un champ `urgence?: 'retard'` à `TacheCalendrier` (`:12-18`) pour le style (pastille) et l'éligibilité au héros. Sortie : conception, annulation, re-datation — jamais de glissement.
- **A3 — Client & gate.** Lecture avec le client **user** (RLS FOR ALL laisse passer le prof) ; les deux règles sous `lireGatePlanActif` (gate OFF → seule la règle essais tourne, byte-identique).

### 6.6 Aletheia — zéro delta, étanchéité vérifiée

- Les types `lecture` (formative/diagnostique) et `examen_livre` n'existent que comme lignes du plan (`module='aletheia'`, `a_concevoir`, deep-link vers le plan). Leur chantier ajoutera sa FK.
- **Contre-épreuve PO 7 (tenue).** Dupliquer la lecture HLP en exercice créerait deux dates pour la même séance (créneau résolu dimanche vs ligne de plan) — désaccord `ambigu` du résolveur (`utils/aletheia-dates.ts:43`) impossible à arbitrer, et échéance doublée au calendrier (le bloc 4 émet déjà « Aletheia — {livre} (séance n) »). Le générateur HLP ne crée **jamais** de ligne lecture-de-livre ; elle n'entre que dans le budget (lecture seule des créneaux, `resoudreDatesLivre:378`). Fragilité résiduelle assumée : si les créneaux-livre groupent plusieurs séances la même semaine, le plan **diagnostique** la sur/sous-charge (panoptique), il ne la corrige pas.
- **Étanchéité des canaux de dates** : `resoudreDatesLivre`/`resoudreDateSeance` ne lisent que `scriptorium_parcours*`/`semesters`/`holidays` — le plan n'y écrit pas ; réciproquement `dateEffectiveExercice` ne lit aucune table `aletheia_*`. Gates `mode_c_actif` et `plan_evaluation_actif` **indépendants** (aucune combinaison des 4 états ne crée de comportement croisé).
- **Examen sur le livre** : `ancrage='semaine'` (date choisie), jamais `parcours` — le lier aux créneaux recréerait la collision ci-dessus ; référence informative du livre possible via `note`/`contenu_id` facultatif.

### 6.7 Fragments — reflets, zéro ligne

- **En v1, essai ET fragments = REFLETS EN LECTURE SEULE** (D12) : le plan les **affiche** (panoptique + budget), Fragments reste **seul maître** de leur timing — **zéro ligne d'exercice**, aucune migration du timing dans le plan.
- **Comptes-rendus** : échéances = `fragments_semaines.date_limite` (globales au semestre), affichées côté élève inline (`app/eleve/calendrier/page.tsx:104-113`). Le panoptique les **projette** en lecture seule (« couloir Fragments ») ; aucune ligne d'exercice (§0). L'alternance HLP 1/2 **par classe** n'est pas exprimable dans le module actuel — écart assumé et affiché (« indicatif — Fragments suit son propre échéancier »), recâblage Fragments par classe = **chantier séparé différé** (D12, §1.3).
- **Lieu du type `fragment` (D11)** : le CHECK §4.3 réserve **deux** branches — fragment **écrit → `lieu='maison'`**, fragment **oral → `lieu='classe'`** (0 ligne en v1, structurant pour l'avenir). Conséquence budget : seul le fragment **écrit** (maison) compterait dans l'assiette maison ; le fragment **oral** (classe) n'y entre pas, comme les diagnostics (§7.3).
- **Essai** : déjà daté par classe (`fragments_essais_classes.date_essai`), déjà prospectif au calendrier et dérivé en à-faire, `lieu='classe'`. Le plan l'**agrège** (panoptique, budget) sans le posséder ; type `essai` réservé dans le CHECK pour une unification future explicite = **chantier séparé différé** (D12, §1.3).

---

## 7. Vue panoptique (PO 6 — données garanties, design différé)

**Où** : le **détail du plan** (onglet Évaluations → classe) **est** la panoptique — grille semaine-par-semaine enrichie d'une bande « enseignements » en lecture seule. Pas d'écran séparé. Classe **sans plan** : la panoptique s'affiche quand même (bandes enseignements/lectures/reflets + bouton « Créer le plan annuel »).

### 7.1 Loader serveur (`app/prof/scriptorium/evaluations/panoptique-serveur.ts`)

```ts
interface SemainePanoptique {
  lundi: string; dimanche: string                 // bornes (frise)
  semestreNom: string; pedaDansSemestre: number   // libellé « S1 · sem. 3 » (jamais indexContinu brut)
  // (1) Enseignements — parcours assignés actifs, créneaux résolus sur cette semaine
  enseignements: Array<{ parcoursTitre: string; ref: 'cours'|'texte'|'livre'; titre: string
                         tranche?: { debut: number|null; fin: number|null } }>
  // (2) Évaluations — exercices du plan (semaine_lundi = lundi) + synthèses résolues (S1-S2)
  exercices: Array<{ id: string; type: TypeExercice; diagnostique: boolean
                     nature: 'formatif'|'evaluatif'; lieu: 'classe'|'maison'
                     dateEffective: string; source: 'plan'|'synthese_parcours'
                     etat: 'a_concevoir'|'en_retard'|'concu'|'realise'|'a_recaler' }>  // 3 derniers DÉRIVÉS
  // (3) Échéances Aletheia mode b — pairesLivresGouvernes + resoudreDatesLivre
  lectures: Array<{ livreTitre: string; seances: number[]; echeance: string; ambigu: boolean }>
  // (4) Reflets hors plan — essais (fragments_essais_classes), grille fragments
  essais: Array<{ titre: string; date: string }>
  fragmentAttendu: boolean
  // (5) Budget (§7.3)
  budget: { min: number; max: number; cibleMin: number|null; cibleMax: number|null; depasse: boolean }
  // (6) Semaine calendaire HORS enseignement (vacances / hors frise) : émise
  // seulement si elle porte quelque chose (exercice, essai, reflet)
  estVacances: boolean
}
```

**Semaines hors frise — obligatoires au loader.** Les lignes étant indexées sur la frise, un `semaine_lundi` qui ne matche plus aucune semaine d'enseignement (vacance ajoutée, semestre re-borné — précisément le régime J2) ou un essai daté en semaine de vacances (`fragments_essais_classes.date_essai` est librement éditable) n'aurait **aucune ligne où apparaître** — or c'est exactement la dérive que la panoptique doit montrer. Deux dispositifs : (a) le loader émet **aussi** une ligne `estVacances: true` pour toute semaine calendaire de l'AY qui porte au moins un exercice/essai/reflet ; (b) la panoptique ouvre sur un **bandeau « hors frise »** agrégeant les exercices « à recaler » (y compris ceux dont la semaine ne matche plus rien du tout), relié au bouton « Recaler sur le calendrier » (J2).

### 7.2 Garantie « tout est résoluble » (critère de la décision 6)

| Couche | Source / résolution | État |
|---|---|---|
| Enseignements | `chargerAssignationsAvecApercu` (`frise-serveur.ts:143`, snapshot + diff) | ✅ existe |
| Exercices du plan | `scriptorium_exercices_planifies` groupés par `semaine_lundi` ; synthèses via `resoudreDateSynthese` | ce chantier |
| Lectures de livre | `pairesLivresGouvernes` (`aletheia-dates.ts:451`) + `resoudreDatesLivre` (`:378`) | ✅ existe |
| Essais / fragments | `fragments_essais_classes`, `fragments_semaines` | ✅ existe |
| Jours de cours | `coursParJour` (`utils/calendrier-cours.ts:7`, `teaching_patterns` + exceptions) | ✅ existe |
| Budget temps | `budgetSemaine` (§7.3) | ce chantier |

Perf : ~40 semaines × résolutions **mémoïsées par parcours** (patron `apercuCache`) ; `maxDuration=60` si nécessaire.

### 7.3 Budget temps élève (§4 du PROMPT — indicatif, jamais bloquant)

- Helper **pur** `budgetSemaine(exercicesMaison, lecturesSemaine, fragmentAttendu, gabarit)` + constantes `DUREES_EXERCICES` (écriture/lecture maison : 30–40 ; flashcards ambiantes : 15–20, toujours comptées ; fragment ou tranche de lecture : ~30/occurrence) et `CIBLES_GABARIT` (TC : 45–60 ; HLP : 60–90 ; vierge : aucune). **Cible par gabarit SEUL** (D9) — jamais modulée par le volume horaire réel de la classe (`teaching_patterns` ne donne que les jours, pas les heures). `duree_estimee_min` de la ligne prime sur la constante si posée.
- **Assiette par semaine et par classe** : exercices `lieu='maison'` vivants non annulés du plan + flashcards (constante) + lecture de livre (~30 si une échéance mode b résolue tombe dans la semaine) + fragment **écrit** (~30 si `fragments_semaines.date_limite` dans la semaine et module actif pour la classe). Les exercices en classe (dont le **fragment oral**, `lieu='classe'`, D11) et les diagnostics ne comptent pas.
- **Dépassement structurel HLP — documenté.** La vérification du PROMPT §4 suppose l'alternance fragment/lecture « une semaine sur deux » ; or l'échéancier Fragments **réel** est **hebdomadaire** (une `date_limite` par semaine d'enseignement du semestre, cf. `app/eleve/calendrier/page.tsx:104-113`). Pour une classe HLP à Fragments actif, l'assiette atteint donc 75–90 min **toutes** les semaines (borne haute sans lecture) et 105–130 les semaines à échéance de lecture mode b : la chip « dépasse » naîtrait **saturée** et perdrait toute valeur de signal. Replis : (a) réglage `config.compterFragments: 'hebdo' | 'quinzaine' | 'non'` (défaut `'hebdo'` = la réalité du module — le prof qui pratique l'alternance choisit `'quinzaine'`) ; (b) la part Fragments est **distinguée** dans la décomposition au survol. Cet écart est un argument de priorisation pour le **chantier différé** « recâblage Fragments par classe » (D12).
- **Règle d'agrégation verrouillée** : par **semaine calendaire (lundi→dimanche)** exclusivement — jamais par numéro de semaine (trois numérotations coexistent, risque S6 du SPEC Parcours).
- Affichage : chip « ~55 min / cible 45–60 », dépassement → teinte `attention` + décomposition au survol. Signal, pas blocage (le prof peut sciemment surcharger).

---

## 8. Cas limites & règles de robustesse

| # | Cas | Comportement |
|---|---|---|
| 1 | **Classe sans plan annuel** | Statu quo intégral : quiz brouillon→lancé, synthèses manuelles, calendrier rétrospectif. Tous les consommateurs traitent « 0 ligne ». Synthèse auto : signal doux, jamais un blocage d'`ajouterCreneau`. |
| 2 | **Parcours chevauchants** (exemple PO) | Non-problème par construction (cadence au plan) ; la panoptique liste 2+ parcours sur la même semaine. |
| 3 | **Exercice référençant un parcours/contenu soft-deleté** | Référence de matière facultative → badge « parcours/contenu retiré » (patron S7 du SPEC Parcours) ; le timing (plan) survit. FK `restrict` : se déclenche sur la **purge corbeille** (`purgerContenuBiblio`) — flux spécifié §9.2-7 (détachement/refus AVANT le DELETE), jamais d'erreur 23503 brute au prof. |
| 4 | **Cours retiré / parcours désassigné (synthèse)** | S5/S6 : annulation ou soft-delete selon l'engagement ; jamais de suppression auto d'une session Codex. |
| 5 | **Cours présent dans deux parcours (même classe)** | Deux synthèses (clé inclut `parcours_id`) : voulu, deux enseignements distincts, visibles au panoptique. |
| 6 | **Parcours ré-assigné après retrait** | Le hook S3 rejoue, upsert idempotent ; les tombstones (`annule`/soft-deleted) ne ressuscitent pas ; les réalisées subsistent (historique). Le signal de ré-assignation **liste** les synthèses restées annulées (« N synthèses restent annulées — réactiver ? », action Réactiver V3) : l'annulation de S5 était automatique, elle doit rester réparable en un geste. |
| 7 | **Vacance ajoutée / semestre re-borné après validation** | Aucune date ne bouge (bras `semaine` figé) ; badges « à recaler » + recalage explicite avec diff (J2). Synthèses (bras `parcours`) suivent snapshot/frise, comme Aletheia. |
| 8 | **S2 non défini à la création du plan** | Génération tronquée + bandeau (G5) ; fenêtre février non générée (G3) ; « Étendre le plan » à la définition. |
| 9 | **Changement de gabarit en cours d'année** | Régénération scopée + diff obligatoire (R1) ; conçus/réalisés/manuels/annulés/passé intouchés. |
| 10 | **Quiz lancé un autre jour que prévu** | Permis (PO 4/5) ; l'événement réel remplace le prospectif (E3) ; l'écart est une info panoptique. |
| 11 | **Quiz lié supprimé** / session brouillon supprimée | Exercice retombe `a_concevoir` (Q5/S5) ; `set null` = filet. Question re-modifiée après `concu` → les actions revalident (`modifierQuestion` repasse `valide`), sinon drift détecté à la lecture (V4). |
| 12 | **Deux onglets créent un quiz sur le même exercice** | Le **claim-UPDATE conditionnel** (Q2) fait perdre le second : 0 ligne mise à jour → son quiz fraîchement créé (brouillon) est supprimé + message propre. `uk_exercices_quiz` ne fermait que la course inverse (deux UPDATE successifs passaient, le second écrasait le premier → quiz orphelin silencieux). Même mécanisme pour « Préparer la synthèse » (S4). |
| 13 | **Deux exercices le même jour, même classe** | Autorisé (diagnostic + formatif, G4) ; budget/panoptique signalent. |
| 14 | **Re-datation d'un exercice réalisé** | Refusée (V3) ; d'un conçu → autorisée (le module lit la date par jointure). |
| 15 | **Classe créée en cours d'année** | Plan créable à tout moment ; génération depuis `date_debut` snappée — jamais rétroactive (pas d'« en retard » fantômes) : cadence (G2) ET diagnostics (G3, semaines couvertes ≥ ancre) ; garde P1 sur le défaut de `date_debut` (avis si date passée). |
| 16 | **Classe archivée / effacée** | Archivée : plan conservé, dérivations éteintes — filtre `classes.statut='active'` **écrit dans les prédicats E2/A1/A2** (pas un héritage implicite : le code actuel d'`assemblerEvenements` ne filtre pas par statut de classe, les essais des classes fermées émettent aujourd'hui — écart existant assumé, hors scope). Effacée : cascade DB depuis `classes(id)` — la RPC `effacer_classe` n'est **pas modifiée** (leçon du drift `capstone.eleve_id` : ne pas recréer le couplage) ; **recette dédiée obligatoire** (effacer une classe de test avec plan) vu l'historique de cette RPC. |
| 17 | **Frontière août / AY** | `annee_scolaire` int (convention `anneeScolaireDe`) ; unicité par (classe, AY) ; génération bornée à la frise de l'AY (aucun `non_planifiable` possible). `classes.annee_scolaire` (texte) et `filiere` jamais consultés. |
| 18 | **Élève multi-classes** (cookie `eleve_classe`) | Exercices par classe → scoping existant suffit à l'affichage ; le **cumul de charge** inter-classes n'est pas sommé en v1 (**D10**, tranchée). |
| 19 | **Explosion du à-faire à la validation** | Fenêtrage `joursAvant` + retards seulement (A1/A2) ; le total vit au panoptique. |
| 20 | **Gate OFF après plans validés (rollback)** | Dérivations et hooks s'éteignent, données intactes, ré-activation sans migration (`update scriptorium_params set plan_evaluation_actif=false`). |
| 21 | **`semaine_lundi` saisie en vacances** (édition manuelle) | Avis non bloquant (« cette semaine est hors enseignement ») — le prof décide ; badge « à recaler » ensuite. **Exception quiz** : créer un quiz sur une semaine hors frise, ou y déplacer un exercice à quiz lié, est **refusé** (Q7/V3-c — un quiz doit compter dans un semestre). |
| 22 | **Purge L7/L8 (unités)** | Orthogonale : le lien exercice↔quiz survit au recâblage des pickers (source des cartes ≠ contrat du lien). `creerQuizz`/`creerSynthese` orphelins d'unités = chantier recâblage à séquencer avant la rentrée **de toute façon** (§9.4). |
| 23 | **Parcours supprimé** (`supprimerParcours`) | Hook S5 étendu : synthèses non réalisées des plans liés → `annule` (toutes classes assignées) ; sessions Codex intouchées ; **recette dédiée au lot 5** (supprimer un parcours porteur de synthèses). |
| 24 | **Purge corbeille d'un cours référencé** (`purgerContenuBiblio`) | §9.2-7 : exercices bras `semaine` détachés (`contenu_id=null`, badge) ; lignes synthèse sans session → DELETE dur (tombstones compris — l'anti-résurrection est sans objet, contenu et créneaux disparaissent) ; ≥1 session Codex ancrée → **purge refusée** avec message métier. Jamais d'erreur FK brute. |

---

## 8bis. Invariants anti-fuite élève (section consolidée — référencée par §1.2, §4.3, E1, lot 7)

> L'invariant le plus sensible du SPEC, regroupé ici (il était éparpillé entre E1/E2 et le lot 7, et deux références pointaient un « §8.9 » inexistant).

1. **Jamais de policy SELECT élève** sur les 3 tables du plan (§4.5) — toute lecture au profit d'une surface élève passe par client admin + garde applicative (patron bloc Aletheia d'`assemblerEvenements`).
2. **`titre` et `note` ne sont jamais sérialisés hors surfaces prof** (détail du plan, panoptique). Ils ne transitent **jamais** par `CalendarEvent` : l'objet (un seul `label`) part vers les DEUX pages calendrier — les labels de la source 5 sont **génériques par type** sur les deux surfaces (E2), dès le lot 3, par construction (pas seulement détecté par la recette du lot 7).
3. **`surface: 'prof' | 'eleve'` fail-closed** (défaut `'eleve'`, E1) : émission des `a_concevoir` prof-only ; **rétention élève GÉNÉRALISÉE de TOUT exercice `concu` NON encore lancé/exposé** — sous `surface='eleve'`, un exercice `concu` non lancé n'est **jamais** émis : **synthèse** retenue tant que `codex_sessions.lance_at IS NULL` (symétrie §8bis-6) ; **exercice `concu` sans objet de module** (marqué via V4 : `ecriture`/`lecture`/`examen_livre`) **jamais émis** (aucun canal d'exposition élève en v1) ; **quiz** retenu tant que non lancé **SAUF** `scriptorium_params.quiz_annonce_defaut=true` (D5, défaut `false` = surprise = rétention — **unique dérogation** « annoncé »). Simple filtre du lot 7, aucun mécanisme à inventer après coup ; l'événement réel (post-`lance_at`) reste exposé par les blocs rétrospectifs (E3). Sans cette généralisation, la « Préparation » d'une synthèse (S4, `statut='concu'` des semaines avant `lancerSynthese`) rouvrirait au niveau **calendrier** la fuite que §8bis-6 ferme au niveau **API**.
4. **`classe_id` toujours non null** sur les événements de la source 5 (dérivé du plan) — jamais d'événement « général » involontaire.
5. **Invisibilité structurelle au jour J** (J1) : un exercice non conçu n'a d'objet dans aucun module — rien n'existe à cacher.
6. **Policy Codex resserrée (lot 5, additif)** : `codex_sessions_eleve_read` gagne `and statut <> 'brouillon'`. La policy vivante (F2, `review_fixes_2026-06-21.sql:156-166`) expose aujourd'hui les **brouillons** à la lecture API (PostgREST) — sans conséquence tant qu'ils naissent juste avant la classe, inacceptable quand S4 les prépare des semaines à l'avance (l'élève apprendrait l'existence et l'approche d'une synthèse ; la policy quiz, elle, filtre déjà `statut in ('lance','ferme')`). L'UI élève ne consomme que `phase_1`/`phase_2`/`fermee` (vérifié : `chargerSyntheseActive` filtre `:45`, historique filtre `fermee` `:93`) ; seule la branche « brouillon » de la page synthèse élève (atteinte par URL directe) devient inatteignable — elle affichera « Synthèse introuvable », acceptable.
7. **Recette élève du lot 7** : compte élève réel — zéro trace des `a_concevoir`, zéro titre prof — **ET lecture API brute** (curl PostgREST avec un JWT élève) sur `codex_sessions` (aucun brouillon lisible) et `scriptorium_exercices_planifies` (zéro ligne lisible).

---

## 9. Dark-launch & stratégie de déploiement

### 9.1 Gate unique et invariants

**Un seul gate** : `scriptorium_params.plan_evaluation_actif` (défaut `false`), lecture tolérante (dégrade avant SQL). **Invariants gate OFF (non négociables, patron mode C)** — **scopés aux SURFACES ÉLÈVE et aux FLUX VIVANTS** (zéro changement de comportement observable élève, zéro écriture dans un module vivant), **avec une seule exception additive assumée** : le `<select>` « Type pédagogique » **prof-only** de `CreerClasse` (attribut optionnel, non sensible, **sans aucun consommateur gate OFF** — ses lecteurs P5/P6 sont gatés ; §4.1bis, §9.2-9), délibérément **hors** de cet invariant : onglet Évaluations masqué ; **aucune écriture automatique** (hooks S3 court-circuités avant toute lecture) ; aucun événement calendrier neuf ; aucune tâche à-faire neuve ; écrans Quazian/Codex byte-identiques ; helpers court-circuitent — **`synchroniserStatutExerciceQuiz` teste `lireGatePlanActif` EN PREMIER** et sort si `false` (no-op strict : zéro lecture, zéro écriture — dans le scénario rollback du cas 20, les quiz ONT des exercices : un court-circuit « pas d'exercice lié » exigerait déjà une requête sur la table du plan et continuerait d'ÉCRIRE `statut`/`concu_at` à chaque action quiz, en contradiction avec cet invariant) ; le test « pas d'exercice lié » n'est que le **second** court-circuit, gate ON. La dérive de statut accumulée pendant un gate OFF est rattrapée par la re-vérification à la lecture (V4). Recette : diff de rendu prof+élève gate OFF vs `main`, **exceptant le seul `<select>` « Type pédagogique » prof-only de `CreerClasse`** (exception additive assumée ci-dessus ; **côté élève, le rendu reste strictement byte-identique**).

### 9.2 Liste fermée des flux vivants touchés (à surveiller en revue)

1. `ajouterCreneau` / `assignerParcoursClasse` / `retirerCreneau` / `retirerParcoursClasse` — hooks synthèse **gatés** (S3/S5).
2. `creerQuizz` / `supprimerQuizz` / actions de validation des questions — greffe liaison **gatée** (Q2–Q5, Q7).
3. `assemblerEvenements` — bloc source 5 **gaté** (E1–E4) + correctif P0 (hors gate, bugfix).
4. `tachesDeriveesDuCalendrier` — 2 règles **gatées** (A1–A2).
5. `codex_sessions` — DDL arc bi-source (inerte) ; `chargerCoursUnite`→`chargerAncrageSession` (chemin `contenu_id` atteignable uniquement par des sessions créées par le code gaté) ; garde promotion flashcards ; **`creerSynthese` — `classe_id` rendu obligatoire (D2, HORS gate, apparié au lot 0 avec le fix P0)**.
6. `effacer_classe` — cascade nouvelle via DB (RPC intouchée) : **recette dédiée**.
7. **`purgerContenuBiblio`** (`app/prof/scriptorium/actions.ts:775`) — purge corbeille d'un contenu : le DELETE dur heurterait les deux nouvelles FK RESTRICT (exercices tombstones compris — une FK voit TOUTES les lignes — et sessions ancrées `contenu_id`), et sa suppression directe des créneaux (`:787`) contournerait le hook S5. Comportement spécifié : AVANT le DELETE, (a) exercices bras `semaine` référents → `contenu_id = null` (badge « contenu retiré » ; le CHECK `exercices_ancrage_chk` INTERDIT ce détachement sur une synthèse, d'où le traitement séparé) ; (b) lignes synthèse du cours **sans session** (a_concevoir/annule/soft-deletées) → **DELETE dur** (l'anti-résurrection est sans objet : le contenu et ses créneaux disparaissent, aucun hook ne peut les recréer) ; (c) **≥1 session Codex ancrée** sur ce contenu (via `codex_session_id` d'une synthèse ou directement `codex_sessions.contenu_id`) → **purge refusée** avec message métier (« ce cours a des séances Codex — purge impossible » ; une session est de l'historique élève, on ne la détache pas). Les étapes (a)/(b)/(c) s'exécutent dès que les tables/colonnes existent (lecture tolérante), **indépendamment du gate** : des lignes créées gate ON survivent à un rollback et feraient sinon tirer une 23503 brute à la purge.
8. **`supprimerParcours`** (`:1239`) — hook S5 étendu (annulation des synthèses non réalisées, toutes classes) : le DELETE en masse des créneaux/assignations ne passe PAS par `retirerCreneau`/`retirerParcoursClasse`. Le snapshot d'horaire disparaît avec la ligne d'assignation (comportement existant, inchangé).
9. **`CreerClasse`** (création de classe, prof) — (a) DDL `classes.type_pedagogique` **additif nullable** (§4.1bis, inerte) ; (b) ajout d'un `<select>` type pédagogique **optionnel, prof-only, NON gaté** — **exception additive assumée** à l'invariant byte-identique gate OFF (champ non sensible, sans consommateur gate OFF ; §4.1bis, §9.1), que la recette de diff **excepte explicitement** ; (c) **hook de propagation P6 gaté** (proposer d'appliquer un plan existant de même `type_pedagogique`) — gate OFF → **aucune proposition** ; `CreerClasse` reste alors byte-identique **au `<select>` additif près** (aucune écriture nouvelle, **aucun effet élève** : le rendu et le comportement élève restent strictement inchangés). La **propagation P5** (à la création d'un plan) vit dans l'action de création de plan (`propagerPlan`, nouvelle) : elle **écrit** de nouveaux plans+exercices sur d'autres classes, mais **ne touche aucun flux vivant** (tables neuves uniquement) — gatée.

Rien d'autre. Élève : **aucune surface modifiée avant le lot 7, SAUF** (lot 5) les **3 libellés Codex** (§6.2 — inertes tant qu'aucune session ancrée `contenu_id` n'existe) et le **resserrement de policy** `codex_sessions_eleve_read` (§8bis-6, retire de la lecture des lignes que l'UI élève n'a jamais consommées).

### 9.3 Migration

Un seul fichier `plan_evaluation_phase_a.sql` (§4), manuel, additif, idempotent, rejouable, aucune donnée modifiée. Aucun backfill : quiz et sessions legacy vivent leur vie (rétrospectif intact) ; le plan annuel commence à la rentrée 2026. Au flip, le à-faire « quiz à concevoir » propose « **rattacher un brouillon existant** » (pose `quiz_id` — même claim-UPDATE conditionnel que Q2, sans quiz à supprimer en cas de course perdue : simple message) en plus de « créer ».

### 9.4 Prérequis & recommandations d'ordonnancement

- **Recommandé avant lot 1** : merger `feat/scriptorium-vue-livre` (branche non mergée qui touche Scriptorium — éviter les conflits).
- **Vocabulaire** : employer « séance(s) » conformément à `SPEC_aletheia_seances.md` dans les libellés touchant les livres (renommage UI-only en attente) — ne pas réintroduire « semaine » là où le SPEC dit « séance ».
- **Non-prérequis explicites** : le recâblage Quazian/Codex → contenus n'est **pas** un prérequis (le lien exercice↔objet est orthogonal à la source des cartes ; la session synthèse naît ancrée `contenu_id` par le nouveau code) — mais la purge L7/L8 rendra `creerQuizz`/`creerSynthese` orphelins d'unités avant la rentrée quoi qu'il arrive : **séquencer ce recâblage comme chantier propre**, ne pas le coupler.

---

## 10. Découpage en lots d'implémentation

Chaque lot est mergeable **gate OFF** et testable indépendamment.

| Lot | Contenu | Dépend de | Recette clé |
|---|---|---|---|
| **Lot 0 — P0 Codex + `classe_id` obligatoire** | Vérification préalable en base (`pg_policies` sur `codex_sessions` + type effectif de `classe_id`) puis fix résolution classe par **FORMAT uuid, fail-closed** + **fail-closed CIBLÉ du résidu `classe_id null`** (le chemin Codex n'émet aucun événement élève quand `classe_id` est null, §6.3-(4)) + `classe_nom` résolu + commentaire périmé corrigé (§6.3) **+ `classe_id` rendu OBLIGATOIRE à la création d'une synthèse (`creerSynthese`, D2)**. Hors gate, bugfix autonome. | — | Compte élève réel : session d'une autre classe invisible ; session de SA classe correctement nommée ; **`creerSynthese` sans classe → refusé (D2)** ; **résidu `classe_id null` → invisible côté élève** (fail-closed ciblé Codex, §6.3-(4)), auditable côté prof ; « Codex gris » prof résolu (nom affiché, plus d'uuid brut). |
| **Lot 1 — Schéma + moteur pur** | `plan_evaluation_phase_a.sql` (dont **ALTER `classes.type_pedagogique`** additif nullable — D1a — et **`scriptorium_params.quiz_annonce_defaut`** — D5) + RLS + extraction `utils/parcours-apercu.ts` (byte-identique, tests aletheia-dates verts) + `utils/plan-cadence.ts` + `utils/plan-exercices.ts` + tests (déroulé chiffré cadence TC/HLP sur la frise §5.2 du SPEC Parcours, fenêtres, idempotence, budget par lundi calendaire). | — | Tables + RLS prof-only ; **colonne `type_pedagogique` nullable, classes existantes intactes** ; `retirerCreneau`/`effacer_classe` de test OK ; gate absent → `false`. |
| **Lot 2 — UI prof plan annuel** | Onglet `?vue=evaluations`, création (P1–P4), génération (G1–G6), **propagation P5 + hook création de classe P6** (D1c/D1d, dont `<select>` `type_pedagogique` dans `CreerClasse`), édition brouillon (V1), validation (V2), vie courante (V3–V4), régénération + recalage (R1, J2), **réglage prof quiz annoncé/surprise** (D5, `quiz_annonce_defaut`). | 1 | Plan TC + HLP complets manipulés en preview ; **propagation → plans+exercices indépendants sur classes de même `type_pedagogique`/AY, divergence libre** ; **création de classe → proposition d'appliquer un plan existant** ; changement de gabarit avec diff ; « marquer conçu ». **Point de validation PO n°2 (produit en main).** |
| **Lot 3 — Dérivations prof** | À-faire (A1–A3, champ `urgence`) + calendrier prof prospectif (E1–E4, dédoublonnage). | 2 | Jour J `a_concevoir` → « en retard » en tête ; fenêtrage respecté ; quiz lancé → prospectif effacé. |
| **Lot 4 — Greffe Quazian** | Q1–Q7 (deep-link, garde + claim-UPDATE, prédicat conçu, chemin direct, semestre par semaine de frise) + **encart « À concevoir »** sur `/prof/quazian/quizz` (exercices `type='quiz'` `a_concevoir` des plans validés, tri par échéance, bouton = deep-link Q1 — PROMPT §6.3a : l'exercice apparaît DANS son module). | 2, 3 | Cycle complet : planifier → concevoir → valider questions → `concu` → lancer (inchangé) → réalisé dérivé ; suppression → retombe `a_concevoir` ; deux onglets → le second reçoit le message propre, aucun quiz orphelin. |
| **Lot 5 — Synthèse auto + Codex** | S1–S6 (hooks gatés — y compris `supprimerParcours` —, résolution, « préparer » avec claim-UPDATE créant la session ancrée `contenu_id`), `chargerAncrageSession`, `libelleSession` (**dont les 3 sites élève**, §6.2), entrée « **Synthèses à préparer** » sur `/prof/codex`, garde flashcards (§6.2), **resserrement policy** `codex_sessions_eleve_read` (§8bis-6), comportement `purgerContenuBiblio` (§9.2-7). **Le plus risqué (arc bi-source)** — tester sur bac-à-sable. | 2, 3 | Ajout d'un cours → synthèses par classe à plan ; déplacement de créneau → la date suit ; retrait → S5 ; **supprimer un parcours porteur de synthèses → toutes annulées** ; **purge corbeille d'un cours à synthèses** (refus si session, détachement sinon) ; préparation → session brouillon ; lancement inchangé ; **passage élève** : synthèse ancrée `contenu_id` lancée sur bac-à-sable → titre présent sur les 3 surfaces élève. |
| **Lot 6 — Panoptique + budget** | Loader §7.1, budget §7.3, badges dérivés (en retard / à recaler / synthèse sans date / semaine sans lecture HLP). | 2–5 | Semaine surchargée signalée ; dérive post-édition calendrier visible ; classe sans plan = vue dégradée utile. |
| **Lot 7 — Exposition élève + flip** | Émission élève des exercices `concu` au calendrier (invariants §8bis : libellés génériques par type, jamais `titre`/`note`, `classe_id` non null, filtre `SLUG_PAR_SOURCE` hérité, filtre `surface` selon `quiz_annonce_defaut` — D5) + **recette anti-fuite §8bis-7** (compte élève réel + lecture API brute PostgREST) + **flip du gate en prod**. | 3–6 | **Point de validation PO n°3 avant flip** ; vérifier le réglage `quiz_annonce_defaut` (défaut surprise = quiz `concu` non lancé invisible élève ; annoncé = visible, libellé générique « Quiz »). |

**Trois points de validation PO** : n°1 = ce SPEC (le régime temporel R1/§0 est **le point de non-retour**) ; n°2 = lot 2 en preview ; n°3 = avant flip.

---

## 11. Questions PO — toutes tranchées (2026-07-15)

> Les 13 questions ouvertes du durcissement 2026-07-14 (Q1–Q13) ont **toutes été tranchées** par le PO le 2026-07-15 (§2bis, D1–D13). **Aucune question bloquante ne subsiste.**

Correspondance Q → décision : **Q1**→D3 (auto-création retenue) · **Q2**→D4 (rappel jour J différé) · **Q3**→D5 (réglage annoncé/surprise, défaut surprise) · **Q4**→D6 (diagnostics confirmés) · **Q5**→D7 (fin de cours = dernier créneau) · **Q6**→D8 (« marquer conçu » confirmé) · **Q7/Q8**→D12 (Fragments par classe = chantier différé ; essai/fragments = reflets lecture seule) · **Q9**→D9 (budget par gabarit seul) · **Q10**→D10 (pas de cumul bi-classes en v1) · **Q11**→D13 (cartes Codex dégradées acceptées, pas une régression) · **Q12**→D11 (lieux : fragment écrit=maison / oral=classe, essai=classe) · **Q13**→D2 (`classe_id` obligatoire à la création d'une synthèse).

**Reliquats planifiés, NON bloquants** (suivis, hors v1) : rappel « conçu non lancé » au jour J (D4) · recâblage **Fragments par classe** (D12) · recâblage **flashcards→contenu** pour les cartes d'erreurs des synthèses ancrées contenu (D13) · unification future du timing des essais dans le plan (D12). Aucun ne conditionne le flip.

---

## 12. Alternatives écartées (une ligne chacune)

- **Cadence générée par parcours** — tuée trois fois : double charge (parcours chevauchants, exemple PO), timing mort avec la vie du parcours (désassignation/re-datation/soft-delete), trous de couverture entre parcours.
- **Ordinal/`indexContinu` résolu à la lecture pour le plan** — réintroduit le glissement silencieux (risque #10 du SPEC Parcours) sur la surface la plus sensible, contredit PO 4 ; `indexContinu` est interne et instable (schema-S6).
- **`date_prevue` unique au lieu de `semaine_lundi`+`jour_prevu`** — deux sémantiques dans une colonne selon `lieu`, et la colonne semaine revient quand même pour l'idempotence (§0).
- **Plan-gabarit *partagé* multi-classes — lignes partagées (patron parcours)** — écarté ; **partiellement adopté sous forme de propagation par COPIE** (D1, 2026-07-15) : à la création d'un plan (P5) et à la création d'une classe (P6), génération de plans+exercices **parallèles et INDÉPENDANTS** pour les autres classes de même `type_pedagogique`/AY (chaque classe diverge librement) — la réutilisation vit dans `gabarit` **+ copie**, jamais dans des lignes partagées ni un verrouillage inter-classes.
- **Deux tables formatif/évaluatif, ou une par module** — colonnes identiques à 95 %, duplication RLS/index/arc (précédent `scriptorium_contenus`).
- **Type `ecriture_diagnostique` séparé** — le PROMPT dit « variante » ; un type dupliquerait toutes les règles de liaison (flag `diagnostique`).
- **Statut d'exécution stocké (`fait`/`realise_at`)** — duplication de `lance_at` = drift garanti (leçon `capstone.eleve_id`) ; dérivé.
- **`exercice_id` sur `quazian_quizzes`/`codex_sessions`** — colonnes sur tables vivantes = no-op gate OFF par discipline au lieu de par construction ; le lien vit côté plan (FK réelles + unicité partielle).
- **Arc lâche `(objet_type, objet_id)` sans FK** — perd l'intégrité référentielle (déjà refusé au SPEC Parcours).
- **Synthèse en table dédiée** — un seul écart (l'ancrage) : l'arc `ancrage` suffit.
- **Synthèse une-ligne-globale par (parcours, cours)** — casse le lien 1↔1 avec la session Codex (par classe) et la symétrie « plan par classe ».
- **`creneau_id` FK pour la synthèse** — `retirerCreneau` DELETE réel + cours multi-créneaux : la paire (parcours, cours) + `max(semaine)` est robuste, la FK serait orpheline en permanence.
- **Auto-création de la session Codex au hook parcours** — écriture automatique dans un module vivant depuis le builder ; « préparer » explicite conserve la logique Codex existante.
- **Colonne `date_planifiee` sur `quazian_quizzes`** — deux vérités pour une même date.
- **Refus dur de `creerQuizz` sans exercice** — hostile au flux ; l'auto-création satisfait « toujours planifié » (**auto-création confirmée — D3** ; refus dur écarté).
- **Lignes d'exercice pour fragments/essais/flashcards/lecture de livre** — double source de timing sur des flux vivants pour zéro fonctionnalité ; agrégés en lecture (PO 7).
- **Lignes diagnostiques sans date (`fenetre` seule)** — complique chaque consommateur ; non-génération + « Étendre le plan » suffit.
- **Nouveau `KindEvenement 'exercice'`** — réviserait tous les switch d'affichage calendrier pour un gain nul.
- **Gate dans `calendrier_params`** — son SQL est encore « à exécuter » : dépendance d'ordre de migration fragile ; table `scriptorium_params` dédiée.
- **Blocage dur au jour J d'un exercice non conçu** — écarté par PO 4 (alerte « en retard », invisibilité élève structurelle).
- **Modifier la RPC `effacer_classe`** — la cascade DB suffit ; amender la RPC recréerait le couplage qui a déjà cassé deux fois.
- **Colonne `semaine_generation` immuable portant la clé d'idempotence de cadence** — réglerait aussi la collision au déplacement (durcissement), mais coûte une colonne de plus et la régénération écraserait les déplacements délibérés du prof ; la bascule `origine='manuel'` au déplacement (V3-a) obtient le même effet sans nouveau champ.
- **Détacher `contenu_id` des synthèses à la purge corbeille** — impossible : le CHECK `exercices_ancrage_chk` exige `contenu_id NOT NULL` sur le bras `parcours` ; d'où DELETE dur des lignes sans session + refus si session (§9.2-7).

---

## 13. Journal de durcissement (2026-07-14 — 3 contre-épreuves : schéma / régressions / temporalité)

Chaque finding a été contre-vérifié contre le code/SQL réels avant repli. **Verdict : 24 findings bruts → 22 distincts (1 doublon inter-lentilles #2/#11, 1 fusion #8+#17), tous CONFIRMÉS et REPLIÉS ; 0 écarté** — soit 1 bloquant, 10 majeurs, 11 mineurs.

| # | Finding (gravité) | Verdict | Repli |
|---|---|---|---|
| 1 | Course « deux onglets, même exercice » non fermée par `uk_exercices_quiz` (majeur) | **Confirmé** (l'index ne ferme que la course inverse ; deux UPDATE successifs passent) | Claim-UPDATE conditionnel + rowcount + suppression du quiz/session orphelin : Q2, S4, §4.3 (commentaire corrigé), cas #12. |
| 2+11 | `purgerContenuBiblio` bloqué par les FK RESTRICT + contourne S5, absent de §9.2 (majeur, 2 lentilles) | **Confirmé** (`actions.ts:788` DELETE dur ; `:787` créneaux directs) + subtilité découverte au durcissement : le CHECK d'ancrage interdit de détacher une synthèse | §9.2-7 (détacher bras `semaine`, DELETE dur des synthèses sans session, refus si session, hors gate), §4.3, cas #3/#24, alternative écartée, recette lot 5. |
| 3 | `supprimerParcours` contourne les hooks S5 (majeur) | **Confirmé** (`actions.ts:1247-1248` DELETE en masse) | Hook étendu dans S5, §9.2-8, cas #23, recette lot 5. |
| 4 | Cycle de vie des tombstones synthèse incohérent (majeur) | **Confirmé** (V1 DELETE dur vs S3 anti-résurrection ; « réactiver » annoncé §0, spécifié nulle part) | V1 (soft-delete des `synthese_auto` en brouillon), action « Réactiver » en V3, signal de ré-assignation listant les annulées (S5, cas #6). |
| 5 | §6.3 s'appuyait sur un schéma périmé (`classe_id` TEXT) (mineur) | **Confirmé** (`lot1_classe_schema.sql:90-91` : uuid FK ; tables Codex TRUNCATE → repli « par nom » = code mort) | §6.3 réécrit sur le schéma réel ; recette étendue au cas `classe_id null` (Q13). |
| 6 | Policy `codex_sessions_eleve_read` expose les brouillons à l'API (mineur) | **Confirmé** (F2 sans filtre de statut ; la policy quiz filtre, elle) | §8bis-6 (resserrement additif lot 5), J1 amendé, recette API brute §8bis-7. |
| 7 | Prédicats E2/A1 sous-spécifiés (plan vivant, classe active) + suppression de plan non tranchée (mineur) | **Confirmé** (`assemblerEvenements` ne filtre pas par statut de classe) | P4 (aucune suppression de plan en v1, `supprime_at` réservé) ; prédicats complets écrits dans E2 et A1/A2 ; cas #16. |
| 8+17 | Q7 : résolution du semestre par contenance — échoue pour la 1ʳᵉ semaine d'un semestre ne commençant pas un lundi ET pour toute semaine hors frise (mineur + majeur, fusionnés) | **Confirmé** (`calendrier-grille.ts:47` `lundiOnOrBefore` ; rentrée mardi 01/09/2026 → lundi 31/08) | Q7 réécrit : résolution par la semaine de FRISE (`dateDebutLundi = semaine_lundi`) + repli = refus explicite, jamais `is_active` ni null ; cas #21. |
| 9 | `uk_exercices_diagnostic` non totale si `fenetre_diagnostique` NULL (mineur) | **Confirmé** (NULLS DISTINCT) | CHECK `exercices_diag_fenetre_chk` ajouté (§4.3), G6 annoté. |
| 10 | Fix P0 fail-open (`nomParId.has` sous client user élève) + périmètre de fuite dépendant de la policy réelle (bloquant) | **Confirmé** (policy `classes_eleve_read` limite la map aux classes de l'élève ; F2 probablement en base → fuite réduite aux sessions sans classe) | §6.3 réécrit : match par FORMAT uuid (fail-closed), `classe_nom` résolu (plus d'uuid brut), vérification `pg_policies` préalable au lot 0, périmètre recalibré. |
| 12 | Synthèse ancrée contenu : titre vide sur 3 surfaces élève + piège RLS (jointure user sur `scriptorium_contenus`) (majeur) | **Confirmé** (page synthèse élève lit en client user ; `contenus_prof_all`) | §6.2 (3 sites élève au lot 5, résolution via admin), §9.2 corrigé (« aucune surface élève SAUF… »), recette élève lot 5. |
| 13 | Dérive `quiz.semester_id` à la re-datation d'un quiz conçu non lancé (majeur) | **Confirmé** (`semester_id` figé à la création, pas lu par jointure) | V3-c : re-résolution au déplacement ; hors semestre → refus ; Q7. |
| 14 | Un seul `label` partagé prof/élève ; « jamais titre » seulement au lot 7 ; Q3 verrouillée par E2 (majeur) | **Confirmé** (`CalendarEvent` unique vers les 2 pages) | E2 : labels TOUJOURS génériques par type dès le lot 3 ; E1 : `surface` (`'prof'` / `'eleve'`) fail-closed remplaçant `inclureAConcevoir` (Q3 devient un filtre) ; §8bis-2/3. |
| 15 | Invariant gate OFF du helper incompatible avec le rollback (cas #20) (mineur) | **Confirmé** (les quiz ont des exercices en rollback ; le test exige déjà une requête) | §9.1 : `lireGatePlanActif` testé EN PREMIER, no-op strict. |
| 16 | Références « §8.9 » pendantes (mineur) | **Confirmé** (le §8 est une table 1-24, pas de sous-section 8.9) | Section **§8bis** créée (invariants anti-fuite consolidés) ; références §1.2 et §4.3 re-pointées. |
| 18 | `uk_exercices_cadence` viole l'index au déplacement/recalage (clé = position courante) (majeur) | **Confirmé** (paires écriture→écriture du cycle : 1 collision sur 3) | V3-a : bascule `origine='manuel'` au déplacement (libère la clé, sort du périmètre R1) ; diagnostics inchangés (clé = fenêtre) ; J2 : reporter OU annuler par exercice, empilement signalé ; R1 annoté ; alternative `semaine_generation` écartée. |
| 19 | P1 : défaut de `date_debut` sur la mauvaise AY tout l'été, sans garde anti-passé (majeur) | **Confirmé** (`anneeScolaireDe` : juillet → AY écoulée) | P1 : défaut = premier semestre non archivé À VENIR (toutes AY) ; repli sans défaut + bandeau ; avis « date passée » en P1 et V2. |
| 20 | Deux définitions de la date d'un exercice en classe sans `jour_prevu` (dimanche §3/§4.6 vs lundi E2) (mineur) | **Confirmé** | `dateEffectiveExercice` devient sensible au lieu (classe → lundi, maison → dimanche) ; §3, §4.6, E2 alignés : fenêtrage = émission = retard, une seule date. |
| 21 | G3 : semaines candidates non restreintes aux semaines couvertes (≥ ancre) (mineur) | **Confirmé** (lettre de G3 ≠ intention ; signature sans ancre) | G3 réécrit (« couvertes, ≥ ancre ») ; `placerDiagnostics(frise, annee_scolaire, aPartirDe)` ; cas #15. |
| 22 | S2/S6 : semaine-cible absente d'un snapshot publié périmé → « sans date » avec motif faux (mineur) | **Confirmé** (`apercuDe` par assignation ; `echeanceDepuisApercu` → null) | S6 : cause ajoutée + badge dédié « horaire publié périmé → Re-publier l'horaire » (convention Aletheia conservée, écart zéro). |
| 23 | Budget §7.3 : HLP structurellement saturé (Fragments hebdomadaire, pas 1/2) (mineur) | **Confirmé** (`fragments_semaines` = échéances hebdomadaires) | §7.3 : dépassement documenté + réglage `config.compterFragments` (hebdo/quinzaine/non) + part Fragments distinguée au survol ; lié à Q7. |
| 24 | PROMPT §6.3a : listes « à concevoir » dans les modules livrées par aucun lot (mineur) | **Confirmé** (lot 4 = deep-link seulement) | Encart « À concevoir » sur `/prof/quazian/quizz` (lot 4) + entrée « Synthèses à préparer » sur `/prof/codex` (lot 5) ; V2 annoté. |

**Corrections de findings eux-mêmes (précisions apportées au repli)** : (i) le finding #2 proposait de détacher `contenu_id` des exercices y compris synthèses — impossible (CHECK `exercices_ancrage_chk`), remplacé par le traitement différencié §9.2-7 ; (ii) le finding #10-b doutait de la validité SQL de F2 (« uuid = text ») — F2 est valide, la colonne étant déjà uuid au moment de son exécution (lot 1 antérieur) ; (iii) le claim-UPDATE de Q2 ne pose PAS `statut='concu'` (le finding le suggérait par ellipse) — le statut reste dérivé par Q4.

### 13.1 Repli des décisions PO (2026-07-15)

Les 13 décisions PO **D1–D13** (récapitulées §2bis) ont été repliées dans tout le document. Traçabilité : **D1** (multi-classes = plans par classe + propagation par copie) → §2bis, §3, §4 intro, §4.1bis, §5.1-P5/P6, §9.2-9, §10-Lot 1/2, §12 ; **D2** (`classe_id` obligatoire synthèse) → §2bis, §5.4-S4, §6.2, §6.3, §9.2-5, §10-Lot 0 ; **D3** (auto-création quiz hors plan) → §0, §6.1-Q3, §12 ; **D4** (rappel jour J différé) → §0, §1.3 ; **D5** (réglage quiz annoncé/surprise) → §4.1, §6.4-E1/E2, §8bis-3, §10-Lot 1/7 ; **D6** (diagnostics) → §5.2-G3 ; **D7** (fin de cours = dernier créneau) → §5.4-S1 ; **D8** (« marquer conçu ») → §5.3-V4 ; **D9** (budget par gabarit) → §7.3 ; **D10** (pas de cumul bi-classes) → §8-cas 18, §7.3 ; **D11** (fragment double lieu) → §3, §4.3, §6.7, §7.3 ; **D12** (Fragments par classe différé, reflets lecture seule) → §1.3, §6.7, §7.3 ; **D13** (cartes Codex dégradées, pas une régression) → §6.2. **§11** ne contient plus aucune question bloquante (toutes tranchées).

### 13.2 — Durcissement du repli (2026-07-15, vérification post-décisions)

Contre-épreuve adversariale du repli des 13 décisions PO (§2bis) : **7 findings bruts → 6 distincts** (les **deux** findings « P6 AY courante » sont le **même** défaut ; le mineur « D1d AY frontière août » en est une **facette**, replié avec C2 — donc **non listé séparément**). Tous **CONFIRMÉS et REPLIÉS**, 0 écarté — **1 bloquant, 2 majeurs, 3 mineurs**. Aucun invariant durci antérieur (§13, #1–#24) n'est cassé.

| # | Correctif (gravité) | Verdict | Repli |
|---|---|---|---|
| C1 | **Rétention élève des exercices `concu` non lancés trop étroite** (BLOQUANT) — `quiz_annonce_defaut` (D5) ne retenait QUE les quiz ; or une **synthèse** passe `statut='concu'` dès la « Préparation » (S4), des semaines avant `lancerSynthese`, et la source 5 l'émettrait à l'élève (kind `jalon`, label « Synthèse »), **rouvrant au niveau calendrier la fuite que §8bis-6 ferme au niveau API** ; même trou pour un `ecriture`/`lecture`/`examen_livre` marqué `concu` par la soupape V4 sans objet de module exposé | **Confirmé** | **E2 + §8bis-3** généralisent la règle : sous `surface='eleve'`, **aucun** exercice `concu` **non encore lancé/exposé** n'est émis — (a) **synthèse** retenue tant que `codex_sessions.lance_at IS NULL` (symétrie exacte avec §8bis-6) ; (b) **quiz** retenu tant que non lancé **sauf** `quiz_annonce_defaut=true` (unique dérogation « annoncé ») ; (c) `concu` **sans objet de module** (V4) jamais émis (aucun canal d'exposition élève en v1). **E3 annoté** : bascule prospectif→réel sans trou ni doublon, cohérente sur les deux surfaces. |
| C2 | **P6 : « AY courante » non définie** (MAJEUR ; subsume le mineur « D1d frontière août ») — `anneeScolaireDe(today)` pointe l'année **écoulée** en été (création des classes de rentrée) → rapprocherait un plan **échu** (jamais soft-deleté, P4) dont la copie P5 génère un plan entièrement échu (« en retard » fantômes que #19 a supprimés), **ou** raterait le plan de rentrée | **Confirmé** | **P6** : AY de rapprochement définie **EXACTEMENT** comme le défaut `date_debut` de P1 — AY entière dérivée de `anneeScolaireDe(start_date)` du **premier semestre non archivé À VENIR** (`start_date ≥ aujourd'hui`) ; n'apparie que les plans vivants d'`annee_scolaire` (int) = cette AY ; **jamais `anneeScolaireDe(today)` brut, jamais `classes.annee_scolaire` texte** ; aucun semestre à venir → aucune proposition (répercussion #19). |
| C3 | **`<select>` `type_pedagogique` vs invariant byte-identique gate OFF** (MAJEUR) — §4.1bis/§9.2-9(b) ajoutent le champ **sans gate**, contredisant §9.2-9(c)/§9.1 « `CreerClasse` byte-identique gate OFF » (la recette de diff prof gate-OFF échouerait) | **Confirmé** | Arbitrage : champ **NON gaté** (gater un attribut de classe est bancal), mais invariant byte-identique **scopé aux surfaces élève + flux vivants** (§9.1) ; `classes.type_pedagogique` acté **exception additive ASSUMÉE** (prof-only, optionnel, non sensible, **sans consommateur gate OFF** — P5/P6 gatés, zéro risque comportemental) ; recette de diff §9.1 l'**excepte explicitement** (élève strictement byte-identique) ; **§4.1bis + §9.2-9 alignés**. |
| C4 | **P5 ne copie pas `config`** (MINEUR) — propage `gabarit`+`date_debut` mais **pas** la colonne `config jsonb` (cycle personnalisé, `compterFragments`) → jumeaux divergents dès la copie | **Confirmé** | **P5 (+ D1c)** : la copie inclut désormais **`config` jsonb** (avec `gabarit` + `date_debut`) **avant** de lancer la génération §5.2 sur la frise/jours de cours **propres** de la cible. |
| C5 | **Contrat `placerDiagnostics` incohérent** (MINEUR) — §4.6 la déclare **PURE**, mais G3 exige `jour_prevu` = premier jour de cours **de la classe** (`coursParJour`, I/O async) et P5 fonde la divergence inter-classes là-dessus ; une signature pure n'a aucun moyen de recevoir les jours de cours | **Confirmé** | **§4.6** : contrat clarifié — soit `placerDiagnostics` **reçoit les jours de cours pré-résolus** en paramètre (résolus par la couche I/O `utils/plan-exercices.ts` depuis `coursParJour`) et **reste pure**, soit elle **renvoie les diagnostics sans `jour_prevu`** et la **couche I/O le remplit** (repli lundi). Divergence inter-classes portée par l'I/O, **jamais** par la fonction pure. Aligné G3/P5. |
| C6 | **Résidus Codex `classe_id null` non couverts par le fix uuid** (MINEUR) — D2/§6.3 affirmaient « couverts par le fail-closed » : **FAUX**, le remap ne traite que le format uuid ; un **NULL reste null** → visible de tous (`page.tsx:96`). D2 ne tarit que la source **prospective** | **Confirmé** | **§6.3 + §10-Lot 0** : (a) affirmation inexacte **retirée** ; (b) **fail-closed CIBLÉ Codex** — le chemin Codex n'émet **aucun événement élève** si `classe_id` résout à null (`classeIds` défini = contexte élève → `continue`), car par **Q13** une session sans classe est un résidu/bug (≠ essai/quiz sans classe qui peut légitimement en manquer) ; **ne touche PAS** le filtre partagé des essais/quizz ; (c) **audit ponctuel optionnel** des sessions null (backfill prof, sinon invisibles élève). |

**Traçabilité des sections touchées** : C1 → §6.4-E2/E3, §8bis-3 ; C2 → §5.1-P6 ; C3 → §4.1bis, §9.1, §9.2-9 ; C4 → §5.1-P5 (+ §2bis-D1c) ; C5 → §4.6 ; C6 → §2bis-D2, §6.3, §10-Lot 0. **Renforcements croisés** : la rétention généralisée (C1) **consolide** #14 (labels génériques prof/élève) et §8bis-6 (policy Codex resserrée) ; le fail-closed ciblé (C6) **complète** #10 (fix P0 fail-closed) sans jamais toucher le filtre partagé de la page élève.
