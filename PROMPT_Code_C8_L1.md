# PROMPT Code — C8 · L1 : Fragments, remise en marche du calendrier et des semaines

*(⚙️ modèle standard · une session = ce lot (règle R4) · `/clear` avant de commencer · branche `feat/c8-fragments`)*

## Contexte

Fragments est le module de dépôts hebdomadaires (écrit/oral/essai) utilisé par ~90 élèves. **Constat du 24/07 (tests C1, sandbox) : il est cassé et bloquant** — Fragments ne reconnaît plus la nouvelle architecture du calendrier : **impossible de créer des semaines, donc aucun dépôt possible**. La rentrée est le 25 août. Ce lot est une **réparation**, pas une refonte.

L'audit du 2 juillet signalait « deux définitions de la semaine N » (deux endroits du code calculent différemment quelle est la semaine courante). Le bug actuel en est le cousin probable : le calendrier a été refondu (`calendrier_c1a.sql` → `calendrier_config_archivage.sql`, cutover `calendrier_c1b_cutover.sql` qui a **droppé `fragments_semestres`**), et Fragments lit encore l'ancien monde quelque part.

## Objectif du lot

1. **Diagnostic d'abord, correctif ensuite.** Trouver précisément où Fragments lit l'ancienne architecture (table droppée, ancienne définition de semaine, référence semestre). Écrire le diagnostic en tête de PR avant de corriger.
2. **Réparer la création de semaines** depuis l'écran prof, sur la nouvelle architecture calendrier.
3. **Vérifier le flux complet** : créer une semaine → l'élève la voit → un dépôt passe.
4. **Comprendre et corriger le bug calendrier/semaine lié aux semestres** (item 3 du chantier) — pas seulement le contourner : le diagnostic doit dire pourquoi.
5. Au passage, si le correctif touche les dates : **les dates limites se calculent en fuseau `America/Toronto`**, jamais en UTC (item 7 du chantier).

## Hors périmètre de ce lot

- La validation par lot, la synthèse de semestre, le prompt hebdo → **L2**.
- Les onglets et le design → **L3**.
- Le toggle semestre : **ne pas le retravailler** — sa coupe (retrait si superflu) se tranche au check-in, pas ici.
- Toute idée ou découverte hors réparation → une ligne dans `IDEES_post_rentree.md`, pas dans le code.

## Règles du dépôt (AGENTS.md — rappel)

- **SQL** : lire `SUIVI_SQL.md` AVANT toute migration. Nouvelle migration = fichier `.sql` à la racine + ligne au journal (date, fichier, zone, cases Sandbox/Prod). Sandbox d'abord. Ne jamais rejouer un fichier de la section Archive — `fragments_semestres` a été droppée volontairement, ne pas la recréer.
- **Aucun flag nouveau nécessaire** a priori : c'est une réparation d'existant, pas une feature.
- UI : jetons de `globals.css`, pas de hex en dur.
- Si une question de conception surgit → la noter en fin de session, ne pas trancher ici (règle R7).

## Critère de sortie

Sur la sandbox : création d'une semaine dans une classe de test, dépôt élève réussi dans cette semaine, et le diagnostic écrit (cause racine, fichiers touchés). Reporter le test au `SUIVI_tests_manuels.md` (section C8, à créer si absente). Commit + merge de la branche à la fin du lot si vert.
