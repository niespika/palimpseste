# Reprise — le gabarit, la bascule de lundi 7 septembre (écrit le 05/09 au soir)

> À coller dans une nouvelle séance Claude Code ouverte dans `palimpseste`. La mémoire du projet se charge
> seule ; ce message dit par où reprendre. Règles inchangées : jamais `git add -A` (l'arbre est partagé, commit
> par plomberie), un push est un déploiement, mesurer avant d'affirmer, rien en production sans mon « go »,
> et ne passe pas par l'API : les exercices et leurs revues se font EN SÉANCE (agents), pas par appels.

Lis d'abord `project_lundi_7_septembre_bascule_gabarit` et `project_avocat_de_leleve_revue_gabarit` dans la
mémoire, puis `project_c7_l4_fabrique_gabarit`. Vérifie l'état plutôt que de le supposer : `git fetch` puis
`git status`, `main` contre `origin/main`, les deux interrupteurs (`gabarit_actif`, `juge_documents_actif`)
dans les deux bases.

## Où on en est (05/09 au soir)
- Les deux vagues sont PRÊTES : `gabarit-v1.json` (6 clés) et `gabarit-v2.json` (32 clés) dans
  `palimpseste-conception/generateur/banque/`, 304 exercices, 0 refus aux deux contrôles d'import, reversés en
  bac à sable (304 `a_concevoir`). Elles ont été relues par deux avocats de l'élève, corrigées pièce par pièce sur
  mes commentaires, rejugées par des agents en séance. Une clé est sortie (`transition.annonce.ancienne_question`).
- Pages : « Vague 1 » https://claude.ai/code/artifact/98dd7f6d-0d98-427a-89cd-a7802431f6fe ·
  « Vague 2 » https://claude.ai/code/artifact/d01305fa-f424-4977-9097-d67f3b137fcd ·
  « L'avocat de l'élève, les clés au complet » https://claude.ai/code/artifact/2db40b0c-ff71-4ffa-9546-551316c02dcc
  (cette dernière montre l'état AVANT corrections, avec les constats).
- Le déroulé de dimanche est écrit : `scripts/recette/BASCULE_gabarit_lundi_7_septembre.md` (app, poussé).

## Ce que j'attends de toi
1. DIMANCHE, sur mon « go » : jouer le déroulé pas à pas — contrôle TS à blanc contre la prod, dépôt des deux
   vagues (`deposer-import.mjs --prod`), passage en `concu` (`passer-concu.mjs --prod --applique`), retrait de
   la banque 1.4 (`retirer-banque-14.mjs --prod --applique`, après avoir vérifié par requête que la Synthèse est
   `differee`), juge PUIS gabarit, smoke prod. Un relevé avant chaque geste, et me le montrer.
2. Après lundi : le surlignage de la phrase corrigée sur l'écran élève (demandé deux fois, pas fait) ;
   le `10-` décision 18 / §8 à amender avec les trois règles du 04/09 (place, tournure, copie) — l'éditer fait
   diverger la doctrine, rejouer `--sql` + `--fixture` des deux côtés ; les contre-exemples des fiches ; les
   crans 2·6·8.
3. Les prochaines vagues : les exercices proposés PAR TOI en séance, comme l'ancienne fabrique, avec le même
   contrôle en sortie et la revue à trois temps (corriger seulement le défaut vu → revue bornée → garder ou
   jeter). Idée à garder : les deux cas d'une clé sur deux SUJETS différents, pour que le second ne se
   reconnaisse pas à sa forme.
