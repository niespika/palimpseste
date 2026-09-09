# Audit des performances — 8 septembre 2026

**Palimpseste peut être sensiblement accéléré avec des corrections ciblées. Le premier chantier doit être le routeur : son écran Budgets effectue deux lectures successives par élève, puis recommence pour le suivant.** La mesure sur les 65 élèves actuels donne 135 requêtes et 23,565 secondes pour sa seule collecte. Un prototype de collecte groupée donne les mêmes budgets en 7 requêtes et 0,483 seconde.

Ce résultat porte sur les lectures de production exécutées depuis le poste local, **pas sur le temps complet d'une page Vercel**. Il prouve un gaspillage et une solution possible ; il ne promet pas que toute la plateforme deviendra 49 fois plus rapide.

Le signalement de Louis précise le périmètre : routeur particulièrement lent, navigation entre pages et onglets lente des deux côtés, attente sur les boutons de validation. Le temps de génération des retours IA est donc secondaire dans cet audit.

## Mesures et limites

- Lecture du code du checkout `afd70d3`, avec les modifications locales déjà présentes, notamment dans Aletheia. Aucun fichier applicatif modifié par cet audit.
- Lecture des guides de la version installée de Next.js, **16.2.9**, notamment chargement des données, compilation et revalidation.
- Mesures Supabase en lecture seule, après autorisation explicite de Louis. Le script n'autorise que GET/HEAD vers l'origine de production configurée. Les données individuelles restent en mémoire ; les résultats enregistrés ne contiennent ni noms, ni identifiants d'élèves, ni copies.
- Un essai du chargeur actuel et un essai du prototype, dans le même processus. Les latences incluent réseau, API et transfert jusqu'au poste local, ainsi que la lecture d'une copie de la réponse pour en mesurer la taille. Ce ne sont pas des temps SQL isolés. L'ordre actuel puis prototype peut avantager les connexions déjà ouvertes ; il n'explique pas la suppression des 128 requêtes.
- Consultation de Vercel Observability en production, fenêtre **12 dernières heures**, vers **20 h 35–20 h 38, Montréal**, le 8 septembre.
- Inspection du build local existant du **8 septembre, 19 h 23**, sans reconstruire ni remplacer le serveur de développement. Sa correspondance exacte avec le déploiement courant n'est pas établie.
- Vérification dans Chrome de l'écran réel du routeur : trois onglets et 65 formulaires visibles dans le document. Aucun budget modifié.

Les mesures anonymisées sont dans [le relevé JSON](scripts/recette/audit-performances-2026-09-08.mesures.json). Le [script de mesure](scripts/recette/audit-performances-2026-09-08.mjs) est conservé pour reproduire le diagnostic ; il produit son résultat dans `/tmp/palimpseste-perf-results.json`.

**Ce qui n'a pas été mesuré :** délai clic → contenu utilisable sur un ensemble de sessions élèves, performance mobile, latence des écritures de validation, charge simultanée d'une classe, plans d'exécution SQL, CPU/IO de Supabase, distribution complète des temps par type de requête. Aucun test de charge ni aucune génération IA n'a été lancé.

## 1. Routeur : 130 lectures individuelles évitables — priorité immédiate

Dans [chargerBudgets](app/prof/routeur/serveur.ts:65), la boucle attend `lireLesInscriptions(admin, e.id)`, puis `lireLeProfil(admin, e.id)`, pour chaque élève. Les deux fonctions effectuent chacune une requête. Les élèves sont traités successivement.

Avec les données actuelles, le coût est **2 × 65 + 5 = 135 requêtes**. Les cinq autres sont la liste des élèves, deux lectures de paramètres et deux appels pour l'assiduité : décompte et page de résultats.

| Collecte mesurée | Actuelle | Prototype groupé |
|---|---:|---:|
| Élèves | 65 | 65 |
| Requêtes HTTP | 135 | 7 |
| Durée totale | 23,565 s | 0,483 s |
| Concurrence maximale observée | 2 | 6 |
| Incidents de la collecte actuelle / erreurs HTTP | 0 / 0 | — / 0 |
| Budgets identiques pour les 65 élèves | Référence | Oui |

La médiane des durées HTTP de l'essai actuel est de **169 ms**. Les seules lectures individuelles de profils et d'inscriptions accumulent presque toute l'attente. Leur volume total reste faible : il s'agit principalement d'allers-retours répétés.

**Solution proposée :** lire les colonnes de budget dans la première requête de profils, puis charger les inscriptions collectivement avec [lireLesInscriptionsDesEleves](utils/routeur/donnees.ts:317), qui existe déjà. Charger assiduité et paramètres en parallèle lorsque leurs entrées sont disponibles. Garder `budgetDeLEleve` comme unique règle de calcul.

Le prototype valide l'égalité des objets `budget`, pas toute la page ni toutes les situations possibles. L'intégration devra préserver les classes, la préférence recueillie, l'assiduité, les incidents et les avertissements, et paginer la lecture des profils. Elle devra aussi couvrir élève sans classe, classe inactive, bi-classe et budget personnalisé.

**Ne pas simplement lancer les 130 appels en parallèle.** Cela raccourcirait l'attente isolée tout en conservant une charge inutile et des pointes de concurrence. La lecture groupée supprime le travail.

Effort indicatif : **une demi-journée à une journée**, recette comprise. Critère principal : un nombre de requêtes qui dépend du nombre de pages de résultats, plus du nombre d'élèves.

## 2. Onglets et boutons du routeur : ils amplifient le même défaut

Les onglets de [la page du routeur](app/prof/routeur/page.tsx:75), les liens de changement de semaine de [VueAssignation](app/prof/routeur/VueAssignation.tsx:205) et plusieurs liens de classe/semaine de `VueAssiduite.tsx` sont des balises `<a>` ordinaires. Ils déclenchent une navigation complète du document. La navigation principale du site utilise déjà `next/link` : ce défaut n'est donc pas uniforme.

**Solution :** utiliser `Link` pour ces navigations internes, préserver le layout et ajouter l'indicateur `LibelleSuivi` existant aux changements d'onglet. La documentation [Next.js sur la navigation](https://nextjs.org/docs/app/getting-started/linking-and-navigating) décrit la navigation cliente et le préchargement associés à `Link`.

L'action [reglerLeBudget](app/prof/routeur/actions.ts:39) met à jour une ligne, puis appelle `revalidatePath('/prof/routeur')`. Le retour visuel peut donc attendre la reconstruction coûteuse de l'écran complet. Le même principe vaut pour le recueil de préférence. **La durée des écritures n'a pas été chronométrée** ; le code suffit toutefois à relier le clic de validation à la collecte lente.

Corriger la collecte d'abord. Ensuite, faire renvoyer à l'interface le résultat utile de la modification et étudier une mise à jour limitée à la ligne concernée, avec confirmation réelle du serveur et affichage d'erreur. Vérifier également les parcours qui combinent `revalidatePath` dans l'action et `router.refresh()` côté client : certains peuvent produire une actualisation supplémentaire, à confirmer par trace réseau.

Ne pas retirer les invalidations globalement : elles maintiennent aussi les compteurs et les autres vues cohérents. Next 16 documente en outre que `revalidatePath` peut faire rafraîchir les pages déjà visitées lors d'une navigation ultérieure. [Comportement documenté](https://nextjs.org/docs/app/api-reference/functions/revalidatePath).

Effort indicatif : **une demi-journée** pour les liens et retours de clic du routeur ; traitement des autres boutons progressivement, sur les parcours les plus utilisés.

## 3. Navigation générale : un coût commun, puis des collectes en cascade

Le proxy appelle [updateSession](utils/supabase/middleware.ts:42), qui attend `supabase.auth.getUser()` avant de laisser continuer la requête. **Vercel mesure le middleware à 223 ms en moyenne, 246 ms au P75 et 465 ms au P95** sur la fenêtre consultée. Il existe donc un coût commun significatif avant le travail propre aux pages.

Les layouts professeur et élève relisent utilisateur et profil, puis attendent la matérialisation du semestre. Le layout élève charge ensuite son contexte de classe et les modules accessibles. Des pages et gardes relisent à leur tour ces informations.

Ces répétitions sont des **appels logiques visibles dans le code** ; leur nombre n'est pas automatiquement le nombre de requêtes réseau, car Next peut dédupliquer certains GET identiques pendant un rendu. Le proxy appartient toutefois à une étape distincte. Une trace par requête est nécessaire avant d'annoncer une économie exacte.

**Solutions proposées :**

1. Centraliser le contexte authentifié, le profil et les inscriptions ; partager les lectures identiques à l'échelle du rendu avec `React.cache`, en utilisant des arguments stables. Conserver les contrôles d'autorisation des actions et accès aux données.
2. Examiner `getClaims()` pour la vérification du proxy, **uniquement après vérification de la configuration de signature et du comportement attendu à la révocation**. Supabase peut vérifier localement un jeton asymétrique avec les clés publiques en cache ; avec une clé symétrique, cette méthode contacte encore Auth. Ce gain est conditionnel, pas acquis. [Documentation Supabase](https://supabase.com/docs/reference/javascript/auth-getclaims).
3. Prévoir un cache court et une invalidation explicite pour les réglages partagés peu variables : fuseau, calendrier, catalogues et certains paramètres. Les permissions et données personnelles demandent des clés et une stratégie de fraîcheur adaptées.

Le fuseau et la matérialisation du semestre utilisent **déjà** `React.cache`. Cela évite certaines répétitions dans un rendu, sans constituer un cache durable entre utilisateurs. Le semestre n'est normalement pas réécrit à chaque ouverture : son drapeau est seulement ajusté si nécessaire. Il serait incorrect de présenter cette fonction comme une écriture systématique.

L'[accueil élève](app/eleve/page.tsx:77) enchaîne plusieurs collectes par classe/module, puis les signaux de semaine, suggestions et autres informations. La [page de séance Aletheia](app/eleve/modules/aletheia/[livreId]/[semaine]/page.tsx:198) attend successivement résolution d'inscription, exposition, séance, échéance, livre, accès séquentiel, réglages et gabarit. Certaines dépendances sont nécessaires, d'autres peuvent être regroupées une fois l'accès autorisé.

**Solution :** dessiner les dépendances de chaque page, charger ensemble les lectures indépendantes et réutiliser le même contexte d'exposition. Isoler les blocs secondaires derrière des frontières `Suspense` pour que leur attente ne retarde pas le contenu principal. [Principes de collecte et streaming Next.js](https://nextjs.org/docs/app/getting-started/fetching-data).

Les fichiers `loading.tsx` existent déjà au niveau professeur, élève et de plusieurs modules. Ajouter un autre écran d'attente ne réduit pas la durée des requêtes. Les chargements du layout restent également à traiter : une frontière située sous le layout ne les absorbe pas.

Effort indicatif : **deux à quatre journées**, en commençant par un parcours professeur et un parcours élève, avec mesure avant/après.

## 4. Scriptorium : des textes complets chargés pour construire les listes

La collecte initiale de [ScriptoriumPage](app/prof/scriptorium/page.tsx:91) lit tous les `scriptorium_documents`, dont `texte_extrait`, avant de distinguer le contenu utile à chaque vue. La bibliothèque charge aussi les textes complets et les passe aux composants clients des listes, même si l'utilisateur n'ouvre qu'un item.

| Données de production mesurées | Lignes | JSON actuel | Même résultat sans `texte_extrait` |
|---|---:|---:|---:|
| `scriptorium_documents` | 37 | 440 498 octets | 8 038 octets |
| `scriptorium_contenus` | 11 | 123 345 octets | 2 323 octets |

Les décomptes exacts confirment que ces deux lectures ne sont pas tronquées dans l'état actuel. La seconde mesure concerne toute la table de contenus ; les onglets de bibliothèque appliquent en pratique un filtre de type et en lisent une partie.

**Ces volumes sont des JSON non compressés mesurés côté serveur, pas le trafic total du navigateur.** Ils montrent que le texte représente environ 98 % des données de ces sélections. Dans une liste qui n'affiche que titres et compteurs, transporter tout le texte est évitable.

**Solution :** séparer métadonnées de liste et détail éditable, charger le texte à l'ouverture du document, filtrer les lectures sur la vue et les identifiants concernés. Pour les images, éviter une signature individuelle accompagnée d'une garde professeur répétée : `getUrlSignee` refait actuellement cette garde avant chaque signature. Un lecteur interne autorisé peut signer les chemins utiles en lot, sans supprimer la garde de l'action publique.

Effort indicatif : **une à deux journées**. Recette : même bibliothèque, mêmes droits et possibilités d'édition, volume initial fortement réduit, détail disponible à l'ouverture.

## 5. Rafraîchissements automatiques et agrégats : limiter l'effet de groupe

[PollStatut](app/eleve/modules/aletheia/PollStatut.tsx:22) exécute `router.refresh()` toutes les **4 secondes** pendant la préparation d'un retour. Il redemande le rendu de la route, dont la collecte de séance et son contexte. Le minuteur de 90 secondes propose une relance mais n'arrête pas le polling.

**Ordre de grandeur, pas une charge observée :** 30 élèves attendant simultanément correspondent à 450 demandes de rafraîchissement par minute si le rythme est maintenu. Le navigateur peut ralentir les onglets masqués ; le code n'organise lui-même ni pause sur visibilité ni espacement progressif.

**Solution :** interroger seulement le statut et une version du résultat via un endpoint authentifié et autorisé ; rafraîchir le contenu complet uniquement quand le statut change. Prévoir absence de chevauchement, pause lorsque la page est masquée, reprise au retour et intervalle progressif. Une solution Realtime est possible, mais un petit endpoint suffit à supprimer l'essentiel du gaspillage sans ajouter d'infrastructure.

Autre point de croissance : [calculerSante](utils/sante.ts:81) lit dépôts, analyses et états de cartes pour en calculer des agrégats dans le serveur applicatif. [CoutApi](app/prof/CoutApi.tsx:53) lit cinq sources pour afficher un total mensuel, sans frontière `Suspense` dédiée. Certaines de ces lectures n'ont pas de pagination : en grossissant, elles peuvent aussi atteindre le plafond PostgREST et rendre des totaux incomplets.

**Solution :** filtrer les lignes utiles en base, calculer les agrégats en SQL lorsque les plans d'exécution le justifient et isoler les totaux secondaires du chargement principal. Ne pas simplement poser un `limit()` qui rendrait un total faux. Toute migration devra suivre `SUIVI_SQL.md`, avec sandbox avant production.

Effort indicatif : **une journée** pour le statut Aletheia ; **une à deux journées** pour les premiers agrégats, après mesures ciblées. Ces durées peuvent recouper le travail sur les collectes générales.

## 6. Poids du navigateur et hébergement : à traiter après les attentes évitables

Le build local donne l'inventaire suivant des fichiers JavaScript d'entrée : union des fichiers de route/layout et du runtime commun, sans compter deux fois le même fichier.

| Route | JavaScript brut | Estimation gzip locale |
|---|---:|---:|
| Accueil élève | 562 ko | 163 ko |
| Accueil professeur | 575 ko | 167 ko |
| Routeur | 586 ko | 169 ko |
| Séance Aletheia élève | 623 ko | 180 ko |
| Scriptorium professeur | 1 079 ko | 296 ko |

Unités décimales, arrondies. CSS, polices, HTML/RSC, polyfill conditionnel et dépendances différées ne sont pas inclus. Le runtime est partagé entre pages et peut déjà être en cache. **Ce tableau n'est donc pas une mesure de téléchargement à chaque clic.**

Scriptorium mérite de séparer les éditeurs de ses différentes vues et de différer ceux qui ne sont pas ouverts. Les convertisseurs HEIC, EXIF, PDF et DOCX disposent déjà d'imports dynamiques à plusieurs endroits ; supprimer ces dépendances au motif qu'elles existent dans `package.json` ne constitue pas un diagnostic de performance. Les quatre familles de polices passent déjà par `next/font` avec `display: swap` ; leur préchargement pourra être examiné avec une vraie trace réseau mobile.

Vercel affiche sur la fenêtre consultée : **47 ms de CPU actif au P75**, **245 Mo de mémoire moyenne sur 2,05 Go**, **1,9 % de démarrages à froid**, et **7,6 % de throttling CPU au P75**. Ces agrégats ne prouvent pas l'absence de pointes ou d'un problème Supabase, mais ils ne justifient pas de commencer par augmenter l'abonnement ou réécrire le site. Le service est déjà affiché en calcul Fluid, dans une équipe Pro.

Vercel affiche environ **28 000 appels à Supabase**, latence **210 ms**, et le middleware ajoute son propre temps. La priorité la mieux étayée est de réduire le nombre d'allers-retours et leur enchaînement. Vérifier ensuite la proximité des régions Vercel/Supabase et les requêtes SQL lentes. La région réelle des fonctions et celle de la base n'ont pas été vérifiées ici ; aucune migration de région n'est recommandée sans cette vérification.

## Ordre d'intervention proposé et critères de réussite

| Ordre | Intervention | Résultat à vérifier |
|---|---|---|
| 1 | Collecte groupée des budgets | Environ 7 lectures avec la population actuelle, budgets et avertissements inchangés ; chargement indépendant du nombre d'élèves hors pagination |
| 2 | Liens internes et validation du routeur | Onglets sans rechargement du document ; une modification de budget ne déclenche pas plusieurs reconstructions inutiles |
| 3 | Contexte commun et collectes des pages fréquentes | Réduction mesurée des phases successives ; premiers contenus utiles disponibles sans attendre les blocs secondaires |
| 4 | Statut Aletheia léger et listes Scriptorium | Rafraîchissement complet seulement sur changement ; textes détaillés chargés à la demande |
| 5 | Agrégats, bundles et SQL guidés par les traces | Débits stables avec une classe simultanée ; totaux exacts au-delà de 1 000 lignes ; baisse des octets réellement transférés |

Les durées ci-dessus sont des estimations de travail, pas des engagements de livraison. Les étapes 1 et 2 forment un premier chantier limité, avec un gain attendu particulièrement fort sur le point le plus pénible signalé.

Pour chaque étape, relever **avant et après** : délai clic → contenu utilisable, délai clic → confirmation d'une écriture, nombre/durée des accès Supabase et octets HTML/RSC/JS. Tester un premier accès et une navigation à chaud, avec cache normal puis réseau mobile simulé, sur téléphone, tablette et ordinateur. Inclure les élèves mono-classe et bi-classe avec leurs données réelles autorisées ; tester la concurrence dans le bac à sable.

Objectifs de recette proposés, à confirmer avec la référence de production : retour visuel du clic en moins de 150 ms ; pages courantes utiles en moins d'une seconde au P75 et de deux secondes au P95 sur la connexion de référence ; confirmation des écritures simples en moins d'une seconde au P75. Le routeur doit d'abord satisfaire la réduction structurelle des requêtes, même si sa durée complète reste à mesurer.

Instrumenter les parcours avec des identifiants de requête et des durées par étape, sans noms ni contenus d'élèves. Le TTFB seul ne suffit pas : une coquille ou un écran de chargement peut arriver avant le contenu utile. La ligne Vercel du routeur affichait seulement **5 invocations et 39 ms de “P75 Duration”** : elle n'est pas corrélée au chargement testé et peut agréger des requêtes différentes. **Elle ne valide ni n'invalide les 23,565 secondes du chargeur mesuré isolément.** Il faut une trace du clic complet pour rapprocher ces chiffres.

Sources opérationnelles consultées : [Vercel Functions](https://vercel.com/niespikas-projects/palimpseste/observability/vercel-functions), [External APIs](https://vercel.com/niespikas-projects/palimpseste/observability/external-apis), [Middleware](https://vercel.com/niespikas-projects/palimpseste/observability/middleware). Ces tableaux sont évolutifs ; les valeurs relevées sont conservées dans le JSON joint. La [documentation d'Observability](https://vercel.com/docs/observability/insights) précise les catégories de mesures.

**Livré : cet audit, les chiffres et un prototype de mesure séparé. Aucun changement de comportement, aucune migration et aucun déploiement effectués.**
