# SPEC — Aletheia / Lot 5 : Capstone (carte d'architecture finale)

> Conventions transverses : voir `PLAN_Aletheia.md`. Dépendances : Lot 4.

## Objectif

À la fin des N semaines, générer une **carte de l'architecture du livre** — **courte et facile à lire** — qui révèle enfin la structure complète (tous les liens aval).

## Détail

**1. Prompt `ALETHEIA_CAPSTONE`.**
- Entrée **`PromptConfig`** éditable. Contenu = §5.3 de `aletheia-spec.md`.
- Variables : `{livre_entier}`, `{tous_les_devoilements}` (les `devoilement` des N semaines), `{toutes_syntheses_eleve}`.
- Invariants : **≤ ~300 mots, tient sur un écran** ; **tous les liens aval pleinement révélés** (l'élève a tout lu) ; **ancrage strict** + **citations** ; **réutilise le vocabulaire** que l'élève s'est approprié.
- Sortie : structure de **carte** (chapitres = nœuds, liens argumentatifs = arêtes) + un **court** texte de fil conducteur.

**2. Déclenchement.**
- Disponible **uniquement quand toutes les semaines de l'élève sont `DONE`**. Génère `aletheia_capstone.contenu`.
- Déclenchement automatique à la clôture de la dernière semaine **ou** bouton « Révéler la carte » une fois éligible — choisis l'idiome UX le plus naturel ; le **contrat** est la condition « toutes semaines `DONE` ».

**3. Vue dédiée.**
- Écran de lecture du capstone, lisible et aéré. Représentation de la carte au choix (liste structurée, schéma simple) — privilégie la **lisibilité** sur la sophistication graphique.

## Flexibilité

- Si une visualisation de graphe est trop lourde, une **carte textuelle structurée** (sections par chapitre + flèches de dépendance) suffit amplement — l'essentiel est que ce soit court et clair.
- Réutilise les composants d'affichage de retour existants si possible.

## Tests (avant de continuer)

- Sur un **parcours de test complet** (toutes semaines `DONE`), générer la carte.
- Vérifier : **≤ ~300 mots** ; **lisible** ; **tous les liens aval explicites** ; **ancrage + citations** ; vocabulaire cohérent avec celui de l'élève.

## Fait quand

- `ALETHEIA_CAPSTONE` dans `PromptConfig`, éditable.
- Génération **conditionnée** à « toutes semaines `DONE` ».
- Carte **courte, lisible, complète** ; **vue dédiée**.
