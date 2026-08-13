# PROMPT Code — C8 · L3 : Fragments, onglets prof et élève

*(⚙️ modèle standard · une session = ce lot (règle R4) · `/clear` avant de commencer · branche `feat/c8-fragments` · **prérequis : L1 et L2 mergés**)*

## Contexte

Réorganisation d'interface issue de la revue prof-élève de Louis (`LISTE_revue_prof_eleve.md`), sous la règle R8 du plan : **un module = 2-3 onglets** (ici 4 côté prof, décision du plan). La logique métier ne change pas dans ce lot — c'est de la réorganisation et du design.

## Objectif du lot

**Côté prof — quatre onglets : Semaine · Suivi · Évaluations · Paramètres.**

1. **Suivi** = fusion des anciens « Thèmes » + « Vue d'ensemble » : par classe et par élève — thème, moyenne, taux de dépôt ; un clic sur l'élève = sa progression.
2. **Évaluations** = Essai | Synthèse en toggle.
3. **Semaine** et **Paramètres** : reprendre l'existant, rangé.

**Côté élève — trois onglets : Écrit · Oral · Essai**, design vérifié sur mobile (l'élève est sur téléphone — 375 px).

## Coupes actives

- Pas de redesign au-delà de la réorganisation : les 🚩 cosmétiques rencontrés → `IDEES_post_rentree.md`.
- Le mapping vers les axes de compétences (branchement C6) est **hors lot**.

## Règles du dépôt (AGENTS.md — rappel)

- UI : réutiliser les jetons de `globals.css` (couleurs et polices par module), **jamais de hex en dur**.
- Aucune migration attendue dans ce lot. Si une s'avérait nécessaire : `SUIVI_SQL.md` d'abord, ligne au journal.
- Question de conception → noter, ne pas trancher (R7).

## Critère de sortie

Les 4 onglets prof et les 3 onglets élève en place, navigation évidente, rien de cassé dans les flux réparés en L1-L2 (re-tester : créer une semaine, un dépôt, une validation par lot). **Rejouer le test C11a-8 (part Fragments)** : un dépôt analysé → la tuile Coûts voit monter « Fragments » ; requête de contrôle en pied de `SUIVI_tests_manuels.md`. Reporter les tests au journal. Commit + merge si vert.
