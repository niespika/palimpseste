# Prompt — Scriptorium : planification des exercices (côté prof)

## 1. Vision

Le calendrier était la colonne vertébrale du site (couche temporelle transverse, en lecture seule). Scriptorium devient les muscles et les tendons : c'est là que vivent les contenus d'un cours, et c'est désormais là aussi que le cours se **planifie** — y compris les évaluations et les exercices.

**Principe cardinal : Scriptorium planifie, les modules conçoivent.** Un quiz reste conçu dans Quazian, même si sa date est fixée par Scriptorium. Un exercice d'écriture ou une synthèse sont conçus dans Codex, un exercice de lecture ou un examen sur le livre dans Aletheia — mais tous sont planifiés depuis Scriptorium. Cela implique de modifier la logique actuelle (voir §8).

## 2. Périmètre d'aujourd'hui

- On ne conçoit **pas** les nouveaux types d'exercices aujourd'hui — leur conception se fera dans leurs modules respectifs, plus tard.
- On crée aujourd'hui leur **possibilité** : la typologie des exercices, leur planification depuis le parcours Scriptorium, le statut « à concevoir », et la dérivation vers le « à faire » du prof.

## 3. Taxonomie des exercices

Deux axes structurants, à porter dans le modèle de données dès maintenant :

1. **Formatif vs évaluatif**
2. **En classe vs à la maison**

| Exercice | Module de conception | Nature | Lieu | État |
|---|---|---|---|---|
| Flashcards (révision) | Quazian | Formatif | Maison | Existant — **hors planification** (FSRS ambiant), compte seulement dans le budget temps |
| Exercice d'écriture | Codex | Formatif | Maison | **Nouveau type** |
| Exercice de lecture | Aletheia | Formatif | Maison | **Nouveau type** |
| Synthèse | Codex | Formatif | Classe | Existant — logique à modifier |
| Écriture diagnostique | Codex | Évaluatif | Classe | **Nouveau type** (variante diagnostique) |
| Lecture diagnostique | Aletheia | Évaluatif | Classe | **Nouveau type** (variante diagnostique) |
| Quiz | Quazian | Évaluatif | Classe | Existant — logique à modifier (date planifiée) |
| Examen sur le livre | Aletheia | Évaluatif | Classe | **Nouveau type** |
| Fragments (comptes-rendus) | Fragments | Évaluatif | Maison | Existant |
| Essai | Fragments | Évaluatif | Classe | Existant (déjà daté) |

Note importante : écriture et lecture existent en **deux variantes** — formative et diagnostique. La logique diagnostique reste à déterminer, mais les prompts seront distincts : la distinction doit être prévue dans le modèle dès aujourd'hui.

## 4. Budget temps élève (règles de dimensionnement)

Cible : un élève devrait fournir **~15 min de travail par heure de cours en philo tronc commun** (4 h/sem → 45 min–1 h de travail hebdomadaire) et **~25 min par heure en HLP** (3 h/sem → 1 h–1 h 30 hebdomadaire).

Durées indicatives par exercice :

- Révision des flashcards Quazian : 15–20 min/semaine (ambiant, non planifié).
- Exercice d'écriture ou de lecture : 30–40 min/semaine.
- Fragments ou lecture d'un livre : ~30 min toutes les deux semaines.

Vérification : philo TC = flashcards (15–20) + 1 exercice (30–40) ≈ 45 min–1 h ✓. HLP = flashcards (15–20) + 1 exercice (30–40) + fragment/livre en alternance (~30/sem en moyenne… soit ~15–30) ≈ 1 h–1 h 30 ✓.

## 5. Cadence hebdomadaire par défaut (à la maison)

- **Philo tronc commun** : 1 exercice par semaine, en cycle **écriture → écriture → lecture**.
- **HLP** : 2 exercices par semaine :
  - le même cycle écriture → écriture → lecture ;
  - en parallèle, une alternance **fragment / lecture de livre** (chacun une semaine sur deux).

## 6. Comportement à la création d'un parcours

1. À la création d'un parcours, les exercices par défaut sont **ajoutés automatiquement** selon la cadence du §5 (variable selon le profil de la classe : TC ou HLP).
2. Le prof peut **ajouter ou retirer** des exercices avant validation.
3. À la validation du parcours :
   - chaque exercice planifié apparaît dans son module de conception avec le statut **« à concevoir »** ;
   - la nécessité de le concevoir apparaît dans le **« à faire »** du tableau de bord prof.

### Synthèse automatique par cours

L'ajout d'un **cours** dans un parcours implique l'existence d'un exercice de **synthèse** : planifié automatiquement depuis Scriptorium et positionné dans le calendrier **à la fin du cours**, mais préparé et déclenché depuis **Codex** (la logique existante est conservée, seule la planification change de lieu).

## 7. Exercices diagnostiques

- Trois fenêtres : **septembre, décembre, février**.
- Ils ont lieu **en classe** et **s'ajoutent** à la cadence formative (qui, elle, a lieu à la maison) — ils ne la remplacent pas.
- Leur logique précise reste à déterminer ; on prévoit seulement aujourd'hui leur existence dans le modèle (variante diagnostique, prompts distincts, cf. §3).

## 8. Impacts sur la logique existante

- **Quazian** : les quiz n'ont pas de date aujourd'hui (brouillon → lancé en direct en classe). Introduire la notion de date planifiée, fixée par Scriptorium ; la conception (questions, portée, durée) reste dans Quazian.
- **Codex** : la synthèse est aujourd'hui créée manuellement en brouillon. Passer à une création/planification automatique depuis le parcours ; préparation et déclenchement restent dans Codex.
- **Calendrier** : les exercices planifiés doivent y apparaître à l'avance (aujourd'hui, quiz et synthèses n'apparaissent que rétrospectivement, via leur date de lancement).
- **À faire** : ajouter les règles de dérivation « exercice à concevoir » (la dérivation calendrier → à faire n'a qu'une seule règle aujourd'hui).

## 9. Questions ouvertes

- Que se passe-t-il au jour J si un exercice planifié est encore « à concevoir » ? (blocage, rappel renforcé, glissement de date ?)
- La « lecture de livre » de l'alternance HLP est-elle un exercice planifié via le parcours, ou reste-t-elle gouvernée par la logique livre/semaine existante d'Aletheia ?
- La cadence par défaut dépend-elle du volume horaire réel de la classe ou simplement de son type (TC / HLP) ?
- Le lieu (classe/maison) de certains exercices existants est à confirmer (essai, fragments) — le tableau du §3 pose une hypothèse.
