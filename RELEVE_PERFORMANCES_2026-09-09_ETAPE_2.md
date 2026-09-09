# Performance — étape 2 : Assignation et navigation élève

Le 9 septembre 2026, suite de la première étape publiée (`fbf4c63`) et de l'accord de Louis pour poursuivre.

## Changements

- L'identité et le profil sont partagés entre les layouts professeur/élève, la garde du routeur et le tableau de bord élève pendant un même rendu React. Le client Supabase et les inscriptions bénéficient de la même portée. Aucun cache persistant ou partagé entre utilisateurs ; une nouvelle requête revérifie session, rôle et inscriptions. Le cookie de classe reste lu à chaque appel, même dans un rendu.
- Le layout élève charge la navigation en parallèle de la matérialisation du semestre. Il réutilise les inscriptions déjà lues pour calculer les modules de la navigation. Cette navigation garde l'union des classes ; les tâches du tableau de bord restent limitées aux classes sélectionnées.
- Assignation réutilise le flag lu par sa garde. Une semaine explicitement choisie n'exige plus la lecture du fuseau ; profils et décisions se lisent en parallèle. Un échec de lecture des profils est désormais signalé.
- Les signaux du tableau de bord élève (semaine, suggestions, fiches, examens et modules) se chargent en parallèle. Les lecteurs existants conservent leurs règles d'accès et leurs flags. Leur contenu et leur ordre d'affichage restent identiques.
- Le sélecteur de classe ne redemande plus une deuxième fois la page après l'action serveur. Celle-ci pose déjà le cookie et appelle `revalidatePath('/eleve', 'layout')`, qui renvoie l'interface actualisée. Cette modification concerne les deux présentations du sélecteur ; la recette navigateur ci-dessous couvre la présentation desktop.
- Le tableau de bord élève vérifie explicitement session et rôle avant ses lectures : son layout s'exécute en parallèle et ne suffisait pas à empêcher un accès à `user!.id` lors d'une session absente.

Aucune migration, modification des règles pédagogiques ou mise en cache durable des travaux. Le proxy conserve son contrôle `getUser()` ; cette étape ne prétend pas supprimer tout le coût de l'authentification.

## Assignation : diagnostic et comparaison

Une deuxième navigation de production, **avant ce correctif**, répond en **3,2 s** à 14:01:50 (Toronto), dont 2,80 s dans la fonction et 337 ms dans le proxy. La trace `2zp6j-1788976910363-aa6563097018` montre huit lectures successives : utilisateur 351 ms, profil 136 ms, flag 161 ms, fuseau 811 ms, flags 185 ms, dépôts 259 ms, profils des élèves 377 ms, décisions 461 ms. La lenteur de 14,5 s de la première observation n'est pas reproduite ; sa cause exacte reste indéterminée. On ne peut pas présenter les 3,2 s comme un gain du présent correctif.

Le script `scripts/recette/performance-navigation.mjs` compare l'ancien et le nouveau chargeur avec les **234 mêmes dépôts**, semaine du 7 septembre, en production **strictement en lecture seule**. Il bloque toute méthode autre que GET/HEAD et toute autre origine. Aucune identité ou copie de travail n'est conservée ; la comparaison complète des résultats se fait en mémoire.

| Collecte, hors garde/layout/rendu | Avant | Après |
|---|---:|---:|
| Paire 1 | 1 106 ms | 400 ms |
| Paire 2, ordre inversé | 823 ms | 571 ms |
| Paire 3 | 934 ms | 389 ms |
| Médiane | **934 ms** | **400 ms** |
| Requêtes | **5** | **3** |
| Dépôts et données affichées | 234 | **234, identiques** |

Les deux variantes sont réchauffées avant les trois paires. La nouvelle reçoit le flag déjà lu par la garde et la semaine choisie, comme la page réelle. Le gain de collecte est de **57 %** sur la médiane ; ce n'est pas une mesure de navigation Vercel ni un percentile représentatif de tous les utilisateurs.

Mesures : `scripts/recette/performance-navigation.mesures-2026-09-09.json`.

## Tableau de bord élève : parcours réel en sandbox

Deux compilations de production isolées, ancienne et nouvelle, même machine, même navigateur et même compte de recette avec deux classes. Les requêtes sont déclenchées dans Chrome ; l'instrumentation locale relève la réponse HTTP complète et les vrais appels Supabase après déduplication par Next. Elle ne mesure pas le temps jusqu'à l'interactivité du navigateur. Ce serveur d'instrumentation n'est pas utilisé par Vercel.

| Ouvertures complètes à chaud, classe identique | Avant | Après |
|---|---:|---:|
| Paire 1 | 2 243 ms | 1 859 ms |
| Paire 2, ordre inversé | 2 331 ms | 1 557 ms |
| Paire 3 | 2 434 ms | 2 471 ms |
| Médiane | **2 331 ms** | **1 859 ms** |
| Requêtes Supabase | **39** | **37** |

Gain médian d'environ **20 %** ; le troisième passage ne progresse pas. Les premières ouvertures, conservées dans les mesures, donnent 2 409 ms avant et 3 014 ms après, avec respectivement 190 et 572 ms cumulés pour les deux appels Auth. Le réseau et l'authentification varient : ces essais ne prouvent pas une amélioration du P95, ni un objectif d'une seconde atteint.

**Changement de classe :** sur l'ancienne version, choisir « Toutes les classes » produit une réponse POST et une deuxième réponse GET RSC, chacune avec **38 lectures** (76 au total). Sur la nouvelle, le même choix produit une seule réponse POST avec **36 lectures**. Choisir ensuite l'autre classe puis revenir à la première fonctionne aussi, sans second GET de rafraîchissement. Les temps des deux anciennes réponses ne sont pas additionnés, leur exécution pouvant se chevaucher avec le streaming.

Le texte visible du tableau de bord a été comparé avant/après : **identique** pour la première classe et pour « Toutes les classes ». La seconde classe est correctement affichée. Navigation vers Calendrier puis Moi réussie. Un élève tentant `/prof/routeur` est redirigé vers `/eleve`.

Mesures anonymes : `scripts/recette/performance-navigation-http.mesures-2026-09-09.json`. Instrumentation reproductible : `scripts/recette/serveur-performance-navigation.mjs`.

## Vérifications et limites

- **2 610 tests réussis**, compilation de production, TypeScript, ESLint ciblé et `git diff --check` réussis.
- Tests du vrai chargeur Assignation : flag OFF préservé, périmètre de semaine, données affichées, retrait autorisé/interdit, erreurs, identifiants de décisions dédupliqués et parallélisme effectif.
- Quatre scénarios supplémentaires sont exécutés dans un sous-processus avec de vrais rendus React serveur : 64 appels concurrents partagés, renouvellement du cache à chaque requête, session absente, refus élève/rôle révoqué, sélection de classe fraîche et séparation de deux élèves.
- Les tests des signaux élève bloquent les lecteurs pour vérifier qu'ils démarrent indépendamment, et contrôlent les périmètres une classe/toutes/sans classe ainsi que le filtrage de Scriptorium.
- Aucune écriture de travail d'élève en production. En sandbox, seules la session de recette et la préférence de classe du navigateur sont modifiées.
- La recette interactive du sélecteur est desktop ; sa variante mobile utilise la même fonction corrigée mais n'a pas été éprouvée séparément dans cette étape.
- Assignation conserve sa limite existante de 1 000 lignes et sa liste d'identifiants en URL (8 456 octets pour les décisions dans le diagnostic). Les changements présents ne règlent pas cette limite de croissance.
- L'objectif de fluidité partout reste ouvert. Scriptorium (textes complets dans les listes), Aletheia (rafraîchissements répétés), les autres collectes séquentielles du tableau de bord et la variabilité Auth restent des pistes à traiter par étapes.

## Contrôle avant livraison

À **14:28:37 Toronto**, contrôle limité aux horaires et décomptes des journaux : dernière navigation visible à **14:08:19**, appels récents automatiques. L'actualisation initiale des logs avait été refusée par l'approbation automatique au motif de leur confidentialité ; la lecture restreinte demandée pour vérifier l'activité, sans détail de requête ni données individuelles, a ensuite été acceptée. Ce contrôle ne détecte pas une personne qui reste dans un onglet sans requête réseau.

La déconnexion de recette ramène bien à `/login`. Les parcours ont été éprouvés avant publication ; le contrôle du déploiement est consigné après sa livraison.

**Publication non effectuée.** Le correctif est enregistré dans le commit local `356ff6c` sur `codex/performance-navigation`. La création de l'arbre GitHub a été refusée par l'approbation automatique : export de fichiers/relevés considérés potentiellement sensibles, propriété de la destination et autorisation de publication jugées insuffisamment établies. Le dépôt distant configuré est bien `https://github.com/niespika/palimpseste.git` ; aucun changement de branche distante ni déploiement de cette étape n'a eu lieu. Une confirmation explicite de publication du code et des relevés anonymisés est demandée à Louis. Les deux serveurs temporaires de comparaison ont été arrêtés ; les serveurs de développement préexistants sont conservés.

**Reprise de publication, le 9 septembre :** Louis autorise explicitement la publication du correctif et de ses relevés anonymisés sur GitHub, puis le déploiement (« oui vas y »). À **14:39:31 Toronto**, les 30 requêtes visibles de la fenêtre des 30 dernières minutes sont toutes des appels automatiques `/api/chaine` ; aucune navigation humaine visible. La publication reprend sur cette autorisation, sans modification supplémentaire du code testé.
