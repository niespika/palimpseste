# PROMPT Code — C7 · L1 : Quazian, remise en marche des flashcards et des quiz

*(⚙️ modèle standard · une session = ce lot (règle R4) · `/clear` avant de commencer · branche `feat/c7-quazian` · **prérequis : C8-L1 mergé** — il a réparé le calendrier, dont Quazian dépend peut-être aussi)*

## Contexte

**Constat du 24/07 (tests C1, sandbox) : la création de flashcards et de quiz est cassée** — Quazian ne reconnaît plus l'architecture Scriptorium actuelle (les contenus ont été réorganisés : livres/auteurs/signets, imports, suppression d'unités — voir les migrations `scriptorium_*` au `SUIVI_SQL.md`). Ce lot est une **remise en marche**, pas une refonte.

## Objectif du lot

1. **Diagnostic d'abord** : où Quazian lit-il l'ancienne architecture Scriptorium (tables, colonnes, routes) ? L'écrire en tête de PR avant de corriger.
2. **Réparer la création de flashcards** depuis les contenus actuels.
3. **Réparer la création de quiz.**
4. **Vérifier le « flashcards gelées » de l'intégrité** (item 5 du chantier) : ce mécanisme existe-t-il encore et fonctionne-t-il avec l'architecture actuelle ? **L'assumer ou le retirer** — pas d'état zombie. Si le retrait demande un arbitrage, le noter pour le soir plutôt que trancher.
5. Au passage : **affichages de notes cohérents** (item 6) si le correctif passe par ces écrans — sinon, noter pour L2.

## Hors périmètre de ce lot

- Les onglets, le commutateur 3 états, la génération sur « vu » → **L2**.
- Le diagnostic de fragilités et son rangement dans la matrice → **C6**, pas ici.
- Toute idée au-delà → `IDEES_post_rentree.md`.

## Règles du dépôt (AGENTS.md — rappel)

- **SQL** : lire `SUIVI_SQL.md` avant toute migration ; nouvelle migration = `.sql` à la racine + ligne au journal ; sandbox d'abord. Zone Quazian existante : `lot7_quazian.sql`, `calendrier_c1c_quazian.sql`.
- Réparation d'existant : pas de flag nouveau attendu.
- Question de conception → noter, ne pas trancher (R7).

## Critère de sortie

Sur la sandbox : des flashcards créées depuis un contenu réel, un quiz créé et passé par un élève de test. **Rejouer le test C11a-7** (reporté depuis le 26/07) : création d'un quiz → ligne `quazian` au journal des coûts avec `classe_id`, jamais d'`eleve_id` ; requête de contrôle en pied de `SUIVI_tests_manuels.md`. Reporter les tests au journal (section C7). Commit + merge si vert.
