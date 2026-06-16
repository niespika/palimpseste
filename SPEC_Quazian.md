# Spécifications — Module Quazian (Flashcards + Quizz bayésien)

> *Palimpseste, module 2. Document de conception destiné à Claude Code.*
> **Avant l'implémentation, lire `ARCHITECTURE.md`, les six fichiers de specs du module Fragments d'érudition, et la spec du module Scriptorium.** Réutiliser l'existant : auth, pile, composants de graphiques de progression, patron « analyse IA avec mémoire + validation prof ». Aligner préfixes de tables et conventions. Ce document décrit le *quoi* et le *comment algorithmique*.

---

## 1. Contexte et intention

Quazian est le module d'apprentissage et d'évaluation de Palimpseste. Deux usages partageant une même base de concepts :

1. **Flashcards à répétition espacée** — pour travailler le cours efficacement, avec extraction IA pour alléger la création.
2. **Quizz bayésien** — pour évaluer en classe, en mesurant ce que l'élève sait *et* sa **calibration** (sait-il ce qu'il sait ?).

« Quazian » = Quizz bayésien.

**Quazian ne stocke pas le contenu de cours.** Cours et textes-sources vivent dans le **Scriptorium**, organisés en **unités** (semaine par défaut, renommables). Quazian *lit* ce contenu en lecture seule et le transforme en cartes et en questions ; seul ce travail lui appartient. Son interface se cale sur les unités du Scriptorium.

Il produit aussi un **tableau de bord prof** dont la fonction première est de **diagnostiquer** : distinguer l'élève qui ignore et le sait de l'élève qui se trompe avec assurance (§7).

---

## 2. Décisions de conception arrêtées

- Contenu de cours **externalisé dans le Scriptorium**, consommé en lecture seule.
- Interface **calée sur les unités** + **visibilité par unité** (cartes masquées aux élèves tant que le prof ne les a pas libérées).
- Cartes **atomiques** (§5.2) : une carte = une seule chose à récupérer (principe d'information minimale).
- Notation des quizz = **score de Brier** (règle de notation propre), §6.4.
- Diagnostic **« erreur confiante vs incertitude honnête »** au cœur du tableau de bord (§7).
- **Pas de double standardisation** (cote Z des cotes Z abandonnée), §6.4.
- Répétition espacée = **FSRS** via `ts-fsrs` (npm), pas de réimplémentation, §5.4.
- **Quizz mensuels**, 20 questions, fenêtre de 25 min + **fermeture manuelle anticipée** par le prof, §6.2.
- Réponse bayésienne via **répartition de 100 jetons** (et non curseurs renormalisants), §6.3.
- Ordre des **questions et réponses randomisé par élève**, §6.1–6.2.
- **Périmètre choisi par quizz** (récent ou cumulatif), §6.1.
- Question non répondue = **distribution uniforme** (+2,5) + flag de non-réponse, §6.4.
- Pas de lien bidirectionnel poussé par l'IA avec les Fragments. Cartes personnelles issues des fragments = étape ultérieure optionnelle bornée, §5.5.
- **Accès & rétention** des données : l'élève ne voit que ses propres performances ; le prof voit tout ; purge configurable (défaut : fin d'année, ou fin de cycle 2 ans pour les HLP), §9bis.
- Support cible : tablettes.

---

## 3. Vue d'ensemble fonctionnelle

```
   ┌───────────────────────────────────────────────┐
   │  SCRIPTORIUM (unités : cours + textes + images)│
   └───────────────────────┬───────────────────────┘
                           │ lecture seule (contrat)
                ┌──────────┴───────────┐
                ▼                      ▼
       extraction IA            périmètre concepts
                │                      │ (cumulé jusqu'à l'unité X)
                ▼                      │
      ┌──────────────────┐            │
      │ Pool de cartes    │            │
      │ ATOMIQUES, par    │            │
      │ unité + visibilité│            │
      └────────┬─────────┘            │
       validation prof          génération quizz mensuel
       + publication aux élèves  (20 Q, validation prof)
               │                      │
   (option : cartes perso             │
    fragments, §5.5)                  │
               ▼                      ▼
   ┌────────────────────┐  ┌──────────────────────────┐
   │ Révision élève FSRS │  │ Passation live (25 min)   │
   └────────┬───────────┘  │ jetons bayésiens, randomisé│
            │               │ rattrapage possible        │
            │               └───────────┬────────────────┘
            │                  Brier │ + retour post-quizz élève
            └──────────────┬──────────┘
                           ▼
              ┌──────────────────────────┐
              │  Tableau de bord prof     │
              │  progression + diagnostic │
              └──────────────────────────┘
```

---

## 4. Modèle de données (proposition à réconcilier avec `ARCHITECTURE.md`)

Préfixe `quazian_`. Le contenu de cours vit dans `scriptorium_*`.

| Table | Rôle | Champs clés |
|---|---|---|
| `quazian_flashcards` | Pool de cartes atomiques | `id`, `classe_id`, `eleve_id` (null = partagée ; renseigné = perso §5.5), `scriptorium_unite_id`, `type` (`philosophe`/`concept`/`mouvement`/`these`), `format` (`recto_verso`/`cloze`), `recto`, `verso`, `concept_tag`, `statut` (`suggere`/`valide`/`archive`/`a_verifier`), `source` (`ia`/`prof`/`fragment`), `scriptorium_doc_id` (nullable), `created_by` |
| `quazian_publications` | Visibilité d'une unité aux élèves | `id`, `classe_id`, `scriptorium_unite_id`, `flashcards_visibles` (bool, défaut faux), `published_at` |
| `quazian_card_states` | État FSRS par élève × carte | `id`, `eleve_id`, `flashcard_id`, `difficulty`, `stability`, `due`, `last_review`, `state`, `reps`, `lapses` |
| `quazian_review_log` | Journal des révisions | `id`, `card_state_id`, `rating` (1–4), `reviewed_at`, `elapsed_days`, `scheduled_days` |
| `quazian_quizzes` | Instance de quizz mensuel | `id`, `classe_id`, `statut` (`brouillon`/`lance`/`ferme`), `scope_unites` (unités couvertes, choisies par le prof), `lance_at`, `ferme_at`, `duree_min` (défaut 25), `nb_questions` (défaut 20), `moyenne_cohorte` (figée à la fermeture), `ecart_type_cohorte` (figé) |
| `quazian_questions` | Questions d'un quizz | `id`, `quiz_id`, `enonce`, `options` (4), `index_correct`, `concept_tag`, `flashcard_source_id` (nullable), `statut_validation` |
| `quazian_sessions` | Participation d'un élève | `id`, `quiz_id`, `eleve_id`, `started_at`, `submitted_at`, `auto_submitted` (bool), `est_rattrapage` (bool), `ordre_questions`, `ordre_options` (permutations par élève) |
| `quazian_answers` | Réponse à une question | `id`, `session_id`, `question_id`, `p_a`, `p_b`, `p_c`, `p_d`, `repondu` (bool), `brier_brut` (−1..+1), `score` (−10..+10) |
| `quazian_quiz_scores` | Agrégat par élève × quizz | `id`, `quiz_id`, `eleve_id`, `score_moyen`, `note_formative_20`, `z_quiz` |
| `quazian_semester` | Note sommative par élève | `id`, `classe_id`, `eleve_id`, `z_moyen`, `note_relative_20`, `note_absolue_20`, `note_finale_20` |

---

## 5. Sous-module Flashcards

### 5.1 Source et organisation
- Quazian ne reçoit aucun dépôt. Il lit le texte extrait depuis le **Scriptorium**, **par unité**.
- Le pool de cartes se présente **unité par unité** (« Flashcards — Semaine 1 », etc.), dans l'ordre des unités.
- **Visibilité par unité** (`quazian_publications`) : le prof prépare ses cartes en brouillon et les **libère aux élèves** une fois le cours fait. Défaut = masqué. Les unités à venir n'apparaissent qu'au fur et à mesure des dépôts et générations.

### 5.2 Extraction IA — cartes atomiques
- **Principe d'information minimale** (Woźniak ; effet de test de Roediger & Karpicke ; difficultés désirables de Bjork) : **une carte = une seule chose à récupérer.**
- L'IA **décompose** une entité en une *grappe* de cartes atomiques, et ne produit jamais une carte chargée. Ex. « Nietzsche » → « Dates ? », « Courant ? », « Œuvre majeure ? », « Thèse cardinale ? ».
- Format `cloze` (texte à trous) privilégié quand c'est naturel.
- Quatre types : `philosophe`, `concept`, `mouvement`, `these`.
- **Garde-fous** : éviter les cartes liste/énumération (les éclater) ; les cartes restent la couche d'échafaudage (le travail argumentatif relève d'un autre module). Cartes générées en `statut = suggere`.

### 5.3 Validation et enrichissement prof
- Valider, éditer, archiver, ajouter ses propres cartes. Bouton « aide IA » (verso depuis recto et inversement). Le prof a le dernier mot.
- Seules les cartes `valide` d'une unité **publiée** entrent en révision élève.

### 5.4 Révision élève (FSRS)
- Intégrer `ts-fsrs` ; ne pas réimplémenter. État + note de rappel (1–4) → prochain `due`. Persister/journaliser.
- Rappel noté **après** le verso. File quotidienne : cartes `due <= maintenant`.
- **Cible de rétention** configurable (défaut 0,90) — *ajustable aux tests*.
- La retrievability FSRS alimente le tableau de bord (§7).

### 5.5 Cartes personnelles issues des fragments (étape ultérieure, optionnelle)
> À construire après la boucle cœur ; coupable si l'on veut Quazian et Fragments indépendants.
- L'élève transforme un savoir qu'il a **lui-même écrit** dans ses fragments en cartes personnelles (consolidation de savoir auto-rédigé — effet de génération). Distinct du lien bidirectionnel abandonné.
- `source = fragment`, `eleve_id` renseigné (deck perso). C'est l'élève qui choisit.
- **Garde-fou anti-erreur** : avant entrée en file, l'IA confronte la carte au **corpus du Scriptorium** (autoritatif). Cohérente → `valide` ; en tension → `a_verifier` + message à l'élève, pas d'entrée en file. *(Synergie prévue : si le module Fragments vérifie un jour les erreurs factuelles/interprétatives des fragments à la source, ces cartes arriveront pré-validées.)*
- **Cloisonnement** : alimentent la révision seulement, **jamais le périmètre des quizz**. Source du deck marquée (partagé/perso) dans l'UI et le dashboard.

---

## 6. Sous-module Quizz bayésien

### 6.1 Création et génération
- Quizz **mensuel**, **20 questions**. Le prof **choisit le périmètre** (`scope_unites`) : le dernier mois seulement, ou cumulatif. Concepts lus du Scriptorium (périmètre cumulé jusqu'aux unités choisies) croisés avec les cartes **partagées** validées (cartes perso §5.5 exclues).
- QCM à 4 options : 1 bonne réponse + 3 distracteurs IA.
- **Qualité des distracteurs** (critique) : *plausibles* — erreurs fréquentes, confusions classiques — jamais absurdes.
- Le prof **valide / édite / régénère** questions et distracteurs avant lancement.

### 6.2 Passation en direct
- Lancement en classe → `statut = lance`, `lance_at = now()`, `ferme_at = lance_at + duree_min` (défaut 25 min).
- **Fermeture** : automatique à `ferme_at`, **ou manuelle anticipée** par le prof dès que tout le monde a fini. À la fermeture : on fige `moyenne_cohorte` et `ecart_type_cohorte`, on calcule les scores. (La fenêtre de 25 min est volontairement généreuse ; pas de multiplicateur de tiers-temps par élève dans cette version.)
- **Ordre des questions et des réponses randomisé par élève** (`ordre_questions`, `ordre_options`) : réduit la copie, gomme les effets d'ordre.
- Sessions non soumises → auto-soumises (`auto_submitted = true`). Horodatage côté serveur.
- **Rattrapage** (`est_rattrapage = true`) : un élève absent repasse le quizz plus tard sur tablette. Son score est calculé contre la **cohorte figée** (mean/SD à la fermeture initiale), sans modifier les notes déjà rendues aux autres.

### 6.3 Interface de réponse bayésienne — répartition de 100 jetons
- L'élève alloue **100 points** aux 4 réponses (boutons +/− ou tap). Une réponse ne change que lorsqu'il la touche — **aucune renormalisation automatique**, donc pas de valeur qui rebouge dans son dos.
- Compteur « il te reste X points » ; soumission possible à 0 restant ; impossible de dépasser 100.
- Raccourcis : bouton « je ne sais pas → 25/25/25/25 ». État par défaut au chargement : 25/25/25/25 (point neutre honnête).
- *(Plan B si l'on revient aux curseurs après tests : verrou « ne plus toucher » par curseur, renormalisation sur les seuls curseurs non verrouillés.)*

### 6.4 Notation — algorithmes (référence, à implémenter exactement)

Pour **une question** : probabilités `p₁..p₄` (∈[0,1], somme = 1, soit jetons/100), issues `o₁..o₄` (1 = bonne, 0 sinon).

**(a) Score de Brier**
```
BS    = Σᵢ (pᵢ − oᵢ)²        ∈ [0, 2]
brut  = 1 − BS                ∈ [−1, +1]
score = 10 × brut             ∈ [−10, +10]
```
Vérifications : 100 % sur la bonne → +10 ; 100 % sur une mauvaise → −10 ; 25 % partout → +2,5. Règle *propre* : ne pas simplifier.

**(a-bis) Question non répondue** : traitée comme distribution **uniforme** 25/25/25/25 → `score = +2,5`, avec `repondu = false`. C'est la représentation fidèle de « aucune information » : ni 0 (ignorance punie), ni score négatif (savoir faux). Le flag permet au prof de distinguer « n'a pas eu le temps » d'un « 25 % assumé » — même note, information préservée. La justice se fait au relatif (le +2,5 tombe sous la moyenne si les autres ont bien répondu).

**(b) Score du quizz**
```
score_moyen = moyenne des 20 scores       ∈ [−10, +10]
```

**(c) Note formative par quizz (absolue, feedback)**
```
note_formative_20 = clamp( a + b × score_moyen , 0, 20 )
```
Configurable (défaut `a = 10, b = 1`). ⚠️ 25 % partout → +2,5 → 12,5/20 par défaut ; recentrer via `a, b` si trop généreux.

**(d) Cote Z par quizz (relative à la cohorte)**
```
z_quiz = (score_moyen − moyenne_cohorte) / ecart_type_cohorte
```
Sur la cohorte **figée** à la fermeture. Si `ecart_type = 0` → `z_quiz = 0`. ⚠️ Cadence mensuelle = peu de quizz par semestre → cote Z plus bruitée : la fiabilité des 20 questions et le blend (f) compensent.

**(e) Note sommative de semestre — sans seconde standardisation**
```
z_moyen          = moyenne des z_quiz de l'élève
note_relative_20 = clamp( centre + pente × z_moyen , 0, 20 )
```
Mapping **fixe, choisi par le prof** (défaut `centre = 14`, `pente = 3`). Échelle stable d'un semestre à l'autre. Quizz manqué non rattrapé = exclu de la moyenne.

**(f) Composante de maîtrise (blend)**
```
note_absolue_20 = clamp( a + b × (moyenne des score_moyen du semestre), 0, 20 )
note_finale_20  = w × note_relative_20 + (1 − w) × note_absolue_20
```
`w` configurable. **Défaut recommandé `w = 0,5`** (et non 1) : en cadence mensuelle, faire compter la maîtrise réelle amortit le bruit du classement relatif. Décision pédagogique prof.

---

## 7. Tableau de bord prof, diagnostic et retour élève

### 7.1 Trois profils par élève × concept
- **Maîtrise** — scores élevés et stables.
- **Lacune (incertitude honnête)** — scores proches de +2,5 (distribution plate). Ne sait pas *et le sait*. Remède : exposition.
- **Idée fausse (erreur confiante)** — scores nettement négatifs (forte proba sur une mauvaise option). Se trompe *avec assurance*. **Profil le plus précieux à remonter** — un QCM ordinaire ne le distingue pas d'une lacune.

### 7.2 Signaux et synthèse IA
- Croiser avec la **retrievability FSRS** par concept.
- Rapport hebdomadaire de fragilités (patron « analyse IA avec mémoire »). Le prof décide ; l'IA signale.

### 7.3 Vues prof
- **Classe** : carte de chaleur concept × profil ; concepts les plus fragiles.
- **Élève** : progression flashcards (partagé/perso), historique des notes, profil de calibration, concepts en idée-fausse.
- Réutiliser les composants de graphiques des Fragments.

### 7.4 Retour post-quizz à l'élève
- Dès que le prof ferme le quizz, retour **direct sur la tablette** : pour chaque question, la bonne réponse, *sa* répartition de jetons, et son score à la question.
- Objectif pédagogique central : l'élève **apprend à se calibrer** en voyant où sa confiance était mal placée. C'est tout l'intérêt du format bayésien — autant le récolter.
- *(v2 possible : vue « ta calibration dans le temps » — l'élève est-il systématiquement trop sûr de lui ?)*

---

## 8. Découpage en étapes d'implémentation

> Dépendance : le **Scriptorium** (au moins son contrat de lecture et ses unités) doit exister avant l'étape 1, ou être construit en parallèle.

1. **Étape 1 — Pool de cartes** : lecture par unité depuis le Scriptorium, extraction IA de cartes **atomiques**, validation/enrichissement prof, **publication par unité** (visibilité élèves).
2. **Étape 2 — Révision élève FSRS** : `ts-fsrs`, file quotidienne, écran de révision, journalisation.
3. **Étape 3 — Création de quizz** : périmètre choisi par le prof, génération de 20 questions + distracteurs, validation prof.
4. **Étape 4 — Passation live** : lancement, connexion tablette, **randomisation par élève**, UI **jetons**, fenêtre 25 min + fermeture manuelle, **rattrapage**, score de Brier (avec non-réponse = uniforme), **retour post-quizz** à l'élève.
5. **Étape 5 — Notes** : agrégation (formative, z_quiz sur cohorte figée, sommative, blend `w = 0,5`), paramètres prof.
6. **Étape 6 — Tableau de bord & diagnostic** : profils maîtrise/lacune/idée-fausse, croisement FSRS, rapport de fragilités IA, vues classe/élève, **accès & rétention** (§9bis).
7. **Étape 7 (optionnelle, différée) — Cartes personnelles depuis les fragments** (§5.5).

---

## 9. Critères d'acceptation (transverses)

- [ ] Quazian ne possède aucun upload ; contenu lu du Scriptorium en lecture seule, **par unité**.
- [ ] Le pool de cartes est organisé par unité, avec **visibilité élève par unité** (défaut masqué).
- [ ] Les cartes générées sont **atomiques** (une chose par carte) ; pas de carte chargée ni de liste.
- [ ] Seules les cartes `valide` d'une unité **publiée** entrent en révision.
- [ ] FSRS via `ts-fsrs` ; aucune réimplémentation.
- [ ] Quizz = 20 questions ; fenêtre 25 min **+ fermeture manuelle** par le prof ; statistiques de cohorte **figées** à la fermeture.
- [ ] Ordre questions **et** réponses randomisé par élève.
- [ ] Rattrapage possible ; scoré contre la cohorte figée, sans modifier les notes déjà rendues.
- [ ] UI **jetons** : aucune renormalisation automatique ; somme = 100 garantie UI **et** serveur.
- [ ] Brier conforme au §6.4(a) (+10 / −10 / +2,5) ; non-réponse = uniforme +2,5 avec flag `repondu = false`.
- [ ] **Retour post-quizz** affiché à l'élève après fermeture.
- [ ] Aucune seconde standardisation dans l'agrégation semestre.
- [ ] Mappings /20, blend `w`, cible de rétention = **paramètres prof**, pas de constantes en dur.
- [ ] Le tableau de bord distingue visiblement « lacune » et « idée fausse ».
- [ ] Le périmètre des quizz ne dépend que du Scriptorium et des cartes partagées ; cartes perso exclues.
- [ ] Si §5.5 implémenté : dépendance Fragments **en lecture seule** ; carte-fragment vérifiée contre le Scriptorium avant révision.

## 9bis. Accès et rétention des données (mineurs)

- **Cloisonnement** : un élève ne voit que **ses propres** performances (notes, cartes, retours) ; le **prof voit tout** pour ses classes.
- **Rétention** : purge **configurable**, défaut **fin d'année scolaire** ; option **fin de cycle 2 ans** pour les classes suivies sur deux ans (HLP).
- Cadre à valider avec l'établissement (Loi 25, Québec) avant déploiement réel.

---

## 10. Points laissés ouverts (à ajuster aux tests)

- UI jetons : ergonomie fine de l'allocation ; éventuel retour aux curseurs + verrou (plan B).
- Mapping `a`, `b` de la note formative.
- `centre`, `pente` de la note sommative ; valeur de `w` (défaut recommandé 0,5).
- Cible de rétention FSRS (0,90).
- Durée de rétention des données (fin d'année vs cycle 2 ans).
- Maintien ou retrait de l'étape 7 (cartes personnelles).
