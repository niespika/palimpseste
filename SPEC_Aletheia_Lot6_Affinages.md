# SPEC — Aletheia / Lot 6 : Affinages (optionnel)

> Conventions transverses : voir `PLAN_Aletheia.md`. Dépendances : Lot 2 (et le lot concerné par chaque affinage).

> Chaque affinage est **indépendant et facultatif** : prends-les dans l'ordre que tu veux, teste chacun isolément.

## A. Édition des prompts depuis la console dev

- Vérifie que les **trois prompts** (`ALETHEIA_FEEDBACK_1`, `ALETHEIA_FEEDBACK_2`, `ALETHEIA_CAPSTONE`) sont **visibles et éditables** depuis la console dev, comme les prompts des autres modules.
- Si le mécanisme `PromptConfig` générique les couvre déjà (Lots 3-5), il n'y a rien à faire — confirme-le simplement.
- **Test** : modifier un prompt depuis la console, relancer un retour, voir le changement pris en compte.

## B. Évaluation légère de la qualité des questions (option du retour 1)

- Toggle (off par défaut) ajoutant au retour 1 une remarque sur la **profondeur des questions** de l'élève : si une question est purement factuelle, y répondre puis proposer une **reformulation qui creuse davantage**.
- Encodé dans `ALETHEIA_FEEDBACK_1` (champ `remarque_questions`) ; le toggle décide de son affichage.
- **Test** : avec une question factuelle vs une question profonde, vérifier le comportement attendu et le toggle.

## C. Export / impression de la carte (capstone)

- Permettre à l'élève d'**exporter ou imprimer** sa carte d'architecture (PDF ou impression navigateur).
- **Test** : générer une carte, l'exporter, vérifier le rendu.

## D. Déblocage séquentiel des semaines (pacing)

- Option (off par défaut) : la semaine N+1 ne se débloque qu'à la **clôture (`DONE`) de N**, pour soutenir le rythme.
- Paramétrable (`AppConfig`).
- **Test** : activer l'option, vérifier que N+1 reste verrouillée tant que N n'est pas `DONE` ; désactivée, vérifier l'accès libre.

## Fait quand

- Chaque affinage retenu est **activable indépendamment** et **testé** ; les autres restent désactivés sans effet de bord.
