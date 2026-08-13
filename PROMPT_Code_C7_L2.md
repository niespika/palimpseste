# PROMPT Code — C7 · L2 : Quazian, onglets, génération et commutateur trois états

*(⚙️ modèle standard · une session = ce lot (règle R4) · `/clear` avant de commencer · branche `feat/c7-quazian` · **prérequis : L1 mergé** — la création doit remarcher avant d'être réorganisée)*

## Contexte

Suite de la remise en marche : l'interface au patron du plan (règle R8 : un module = 2-3 onglets), et la version coupée — pré-décidée — de la génération de cartes.

## Objectif du lot

1. **Onglets « Flashcards · Quiz »**, prof et élève — l'onglet « Semaine » disparaît.
2. **Génération de cartes, version « bouton Générer »** (la coupe pré-décidée du chantier, confirmée au check-in du 12/08) : sur chaque élément de contenu, un bouton génère 1-2 cartes qui entrent en **file de validation prof** (valider / corriger / jeter). **Le déclencheur automatique sur « vu » n'est PAS dans ce lot** — c'est la version post-rentrée ; ne pas en poser l'ébauche.
3. **Commutateur élève à trois états : Toutes les classes / X / Y.** « Toutes » agrège le tableau de bord et le calendrier ; les modules restent par classe (v1). **Le scoping par classe doit être respecté par Quazian ET par Codex élève** — un bi-classe ne voit jamais les contenus de l'autre classe dans le mauvais contexte.
4. **Affichages de notes cohérents** (item 6) si L1 ne l'a pas absorbé.

## Coupes actives

- **Design des Paramètres : non** (coupe pré-décidée).
- Déclencheur « vu » automatique : post-rentrée.
- Diagnostic de fragilités : C6.
- Toute idée au-delà → `IDEES_post_rentree.md`.

## Règles du dépôt (AGENTS.md — rappel)

- Si la file de validation demande une table ou une colonne : lire `SUIVI_SQL.md` d'abord, migration **additive**, `.sql` à la racine + ligne au journal, sandbox d'abord.
- La génération de cartes appelle l'API → **journaliser les coûts dans `api_couts`** comme les 14 sites existants (`enregistrerCoutApi()`, module `quazian`, `classe_id` renseigné, jamais d'`eleve_id` pour du contenu partagé).
- UI : jetons de `globals.css`, pas de hex en dur.
- Question de conception → noter, ne pas trancher (R7).

## Critère de sortie

Sur la sandbox : cartes générées au bouton sur un élément réel, validées en file, visibles côté élève ; un compte bi-classe voit juste dans les trois états du commutateur ; les 2 onglets en place des deux côtés. Reporter les tests au `SUIVI_tests_manuels.md` (section C7). Commit + merge si vert.
