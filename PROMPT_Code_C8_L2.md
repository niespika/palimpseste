# PROMPT Code — C8 · L2 : Fragments, validation par lot et bugs de fond

*(⚙️ modèle standard · une session = ce lot (règle R4) · `/clear` avant de commencer · branche `feat/c8-fragments` · **prérequis : L1 mergé** — la création de semaines doit remarcher avant ce lot)*

## Contexte

À ~90 élèves, la validation des dépôts hebdomadaires prend au professeur **3 à 7 heures par semaine** : c'est le goulot n° 1 du module. Ce lot le traite, plus trois bugs de fond connus.

## Objectif du lot

1. **Validation par LOT** (le cœur) : depuis la vue de suivi, sélectionner plusieurs dépôts et les valider/refuser d'un geste, avec un état visuel clair de ce qui est traité/restant. Cible du chantier : **30 dépôts validés en moins de 30 minutes**.
2. **Bug « Expression comptée deux fois »** (item 4) : diagnostiquer et corriger.
3. **Prompt hebdo par défaut dans le code** (item 6) : le prompt de la semaine a une valeur par défaut versionnée dans le code ; la personnalisation reste possible mais n'est plus obligatoire.
4. **Dates limites en fuseau `America/Toronto`** (item 7) — si L1 ne l'a pas déjà réglé.
5. **Synthèse de semestre MINIMALE** (item 5, version coupée) : générer + publier, rien de plus. Pas d'écran de réglage, pas d'historique.

## Coupes actives (pré-décidées au plan, confirmées au check-in du 12/08)

- **Toggle semestre : ne pas y toucher** (son retrait éventuel se tranche ailleurs).
- **Synthèse réduite** au strict générer + publier.
- **D12 différé.**
- Toute idée au-delà → `IDEES_post_rentree.md`.

## Règles du dépôt (AGENTS.md — rappel)

- **SQL** : lire `SUIVI_SQL.md` avant toute migration ; nouvelle migration = `.sql` à la racine + ligne au journal ; sandbox d'abord.
- Si la validation par lot demande une colonne ou un index, migration **additive** uniquement.
- UI : jetons de `globals.css` ; pas de refonte d'onglets ici (c'est L3).
- Question de conception qui surgit → noter, ne pas trancher (R7).

## Critère de sortie

Sur la sandbox : un lot de dépôts validé en une action, le compte d'Expression juste sur un cas qui doublait avant, une synthèse de semestre générée et publiée sur une classe de test. Reporter les tests au `SUIVI_tests_manuels.md` (section C8). Commit + merge si vert.
