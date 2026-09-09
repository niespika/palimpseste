# Performance — étape 1 : le routeur

Le 9 septembre 2026, à la suite de l'[audit](AUDIT_PERFORMANCES_2026-09-08.md) et de l'accord de Louis pour avancer étape par étape.

## Résultat mesuré

La collecte des budgets ne fait plus deux lectures successives par élève. Elle charge les profils, les inscriptions et l'assiduité en lots paginés, puis applique les mêmes règles de calcul.

| Collecte des budgets, 65 élèves de production | Avant (`b00bf4f`) | Après |
|---|---:|---:|
| Durée | 21 139 ms | 519 ms |
| Requêtes HTTP Supabase | 135 | 8 |
| Élèves retournés | 65 | 65 |
| Données de l'écran | Référence | Identiques |

Soit environ **40,7 fois plus rapide** pour cette collecte, et **94 % de requêtes en moins**. Les huit lectures incluent les décomptes exacts des trois collectes paginées. Le prototype de l'audit en faisait sept parce qu'il ne comptait pas les profils ; le correctif vérifie aussi leur exhaustivité.

**Portée de la mesure :** un passage de chaque version, depuis la même machine vers la base de production, en lecture seule. C'est la durée du chargeur serveur, pas celle du clic jusqu'au contenu utilisable sur Vercel, ni un P75/P95. Le proxy, la garde d'accès, le layout, le réseau du navigateur et le rendu ne sont pas inclus. L'ordre avant/après peut favoriser la seconde collecte par le réchauffement des connexions ; la suppression des lectures par élève est indépendante de cet effet.

La comparaison porte sur tout `ChargeBudgets` : budgets et réglages, inscriptions, préférences, assiduité, avertissements, élèves non servis et interrupteurs. Seuls les ordres des élèves et des noms de classes sont normalisés pour comparer leur contenu ; les anciennes inscriptions n'étaient pas triées. Le nouveau lecteur utilise un ordre stable pour paginer.

Le [script reproductible](scripts/recette/performance-routeur.mjs) refuse les écritures réseau et conserve uniquement nombres, durées, tailles et noms de tables. Les [mesures](scripts/recette/performance-routeur.mesures-2026-09-09.json) ne contiennent ni identifiants ni textes d'élèves. La lecture de production avait été explicitement autorisée par Louis.

```sh
node --import ./scripts/register-calibration-resolver.mjs scripts/recette/performance-routeur.mjs --production-lecture-seule
```

## Navigation et enregistrement

- Les trois onglets du routeur utilisent `Link`, avec le composant existant `LibelleSuivi` pour signaler une navigation en cours.
- Les liens de semaine, de classe et vers les signalements utilisent également `Link`, permettant la navigation sans recharger le document entier.
- L'enregistrement conserve sa garde professeur et sa revalidation serveur. Cette revalidation utilise désormais la collecte groupée, donc ne relance plus les 130 lectures individuelles.
- Aucun changement des règles pédagogiques, de l'authentification, du schéma SQL ou des interrupteurs. Aucun cache persistant de données personnelles ajouté.
- Une lecture des inscriptions ratée produit un incident visible, sans déclarer à tort toute la population « sans classe ». Une lecture d'assiduité ratée laisse les budgets disponibles, avec un incident explicite.

## Vérifications réalisées

- `npm test` : **2 603 tests réussis**, dont sept nouveaux cas sur le vrai chargeur et les vrais lecteurs avec Supabase simulé : nombre de requêtes, bi-classe/réglages/préférences, pagination à 1 001 élèves, erreurs et refus d'une liste partielle.
- TypeScript et ESLint ciblé réussis ; `git diff --check` sans erreur.
- Compilation de production réussie, dans une copie isolée pour préserver les serveurs de développement déjà ouverts. Le téléchargement des polices Google a nécessité l'accès réseau habituel du build.
- Recette Chrome sur la compilation de production, connectée à la **sandbox** : Budgets → Assignation → semaine précédente → Assiduité → autre classe → retour arrière.
- Enregistrement d'un budget resté au défaut : bouton désactivé pendant l'attente, puis message « Budget rendu au défaut de sa situation. » et bouton à nouveau actif.
- Rendu des onglets et des sélecteurs de classe contrôlé visuellement. La sandbox ne porte pas de compteurs d'assiduité : l'état vide et les sélecteurs y sont vérifiés ; les valeurs réelles d'assiduité sont couvertes par la comparaison de production en lecture seule.

Le test à 1 001 élèves vérifie la pagination simulée, pas les limites de longueur d'URL de l'infrastructure distante. Les lecteurs groupés existants utilisent une liste d'identifiants ; si la population augmente fortement, il faudra aussi répartir cette liste en lots bornés.

## Livraison et suite

Correctif préparé sur `codex/performance-navigation`, **non déployé en production à ce stade**. Ce relevé ne signifie donc pas que le site public est déjà accéléré, ni que l'objectif de fluidité partout est atteint.

Ordre de la suite :

1. Mettre en service cette première étape, puis mesurer ouverture du routeur et validation sur le site publié.
2. Traiter les chargements communs et un parcours élève complet : partager les lectures du contexte dans un rendu, paralléliser les lectures indépendantes, conserver les contrôles d'accès et la fraîcheur après écriture.
3. Alléger les listes Scriptorium en chargeant les textes complets à l'ouverture du détail.
4. Remplacer les rafraîchissements complets répétés d'Aletheia par une lecture ciblée du statut.
5. Mesurer les parcours professeur et élève, y compris téléphone, et traiter les lenteurs restantes à partir de ces mesures.

Critères de l'audit à vérifier après déploiement : réaction visuelle au clic sous 150 ms, pages courantes utiles sous une seconde au P75 et deux secondes au P95 sur une connexion de référence, confirmations d'écritures simples sous une seconde au P75. Ils restent des objectifs, pas des résultats déjà établis.
