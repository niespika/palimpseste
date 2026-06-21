# SPEC — Aletheia / Lot 1 : Scriptorium — type de contenu « Livre »

> Conventions transverses (flexibilité, tests, invariants) : voir `PLAN_Aletheia.md`.
> ⚠️ Ce lot **modifie le module Scriptorium existant**. Dépendances : aucune.

## Objectif

Permettre au prof d'ajouter un **Livre** dans Scriptorium (lecture autonome multi-semaines), à côté de l'ajout d'**unités** existant — sans rien casser de ce dernier.

## État actuel (à vérifier dans le code avant de coder)

Un bouton **« Ajouter du contenu »** (3 champs : *unité/semaine*, *Nom*, *Classe* multi-assignation) ; 2 onglets (**classes**, **unités**) affichant l'arborescence dans les deux sens.

## Détail

**1. Deux boutons à la place d'un.**
- **« Ajouter des unités »** : reprend **exactement** le comportement actuel de « Ajouter du contenu » (les 3 champs). C'est un simple renommage + le fait que ce ne soit plus le seul bouton. **Non-régression stricte.**
- **« Ajouter un livre »** (nouveau) : ouvre un formulaire dédié.

**2. Formulaire « Ajouter un livre ».**
- **Titre général** du livre.
- **Nombre de semaines** de lecture (pilote la suite du formulaire).
- **Date de début** de la lecture.
- **Classe(s)** (réutilise le composant de multi-assignation existant).
- **Bloc répété par semaine** (autant que le nombre de semaines) : **1 PDF**, **1 titre**, **chapitres** (texte libre, ex. « Chap. 1-4 »). Le bloc se génère/ajuste quand le nombre de semaines change.

**3. Persistance.**
- Le Livre est une **unité Scriptorium multi-semaines** : réutilise/étends le modèle d'unité existant plutôt que d'en dupliquer un parallèle. Chaque semaine porte `pdf_ref`, `titre`, `chapitres`. Un discriminant de type (unité simple vs livre) est probablement nécessaire — choisis ce qui colle au schéma réel (cf. `ARCHITECTURE.md`).
- Les **PDF** vont là où Scriptorium stocke déjà ses fichiers. Ils sont **ancrage IA uniquement** : prévois qu'ils soient lisibles côté serveur, **jamais exposés à l'élève** (Lot 2/4).

**4. Affichage.**
- Le livre apparaît comme **tuile sous l'onglet « Unité »**, et dans l'**arborescence de sa/ses classe(s)**. Réutilise les composants tuile + arbo existants.

## Flexibilité

- « Deux boutons » peut se traduire par deux boutons → deux formulaires, ou par un sélecteur de type — choisis l'idiome le plus naturel pour l'UI en place. Le **contrat** est : l'ajout d'unité garde son flux 3-champs **identique**, et un flux d'ajout de livre **distinct** existe.
- Si le modèle d'unité actuel se prête mal à un PDF + titre + chapitres par semaine, adapte (sous-table de semaines, JSON structuré, etc.) en restant cohérent avec l'existant — et signale ton choix.

## Tests (avant de continuer)

- Créer un **livre de test** (ex. 8 semaines, un PDF par semaine, titres + chapitres).
- Vérifier : il apparaît en **tuile sous « Unité »** ; on le retrouve dans l'**arbo de sa classe** ; les **PDF sont stockés et récupérables côté serveur** ; l'**ajout d'unité simple fonctionne toujours exactement comme avant** (non-régression).

## Fait quand

- Deux boutons en place ; ajout d'unité **inchangé**.
- Ajout de livre avec tous les champs + blocs par semaine (PDF + titre + chapitres).
- Livre visible comme tuile « Unité » et dans l'arbo classe.
- PDF stockés, lisibles côté serveur **uniquement**.
