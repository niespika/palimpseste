# Diagnostic — la lenteur côté professeur (mesuré en prod le 18/09/2026)

> Mesures prises depuis Montréal, dans Chrome, avec le compte professeur de Louis, sur
> `palimpseste.ink`, un jour après les cinq lots du côté élève (`DIAGNOSTIC_lenteur_eleve_2026-09-17.md`).
> Aucune écriture en prod : que des `GET`. Lectures serveur : observabilité Vercel (12 h),
> `pg_stat_statements` de la prod en session lecture seule, comptes de lignes par PostgREST.
> Les comptes d'allers-retours viennent de la lecture du code, pas de l'exécution.

## 0 quater. Lot P2 — la passation lit ses copies ensemble : CODÉ, éprouvé, NON déployé (18/09) — ÉTAT COURANT

**Ce qui change**

- `chargerVueProf` (`utils/passation/vues.ts`) : les noms, **tous les retours** et **toutes les
  attentes** de l'instance partent en trois lectures (`lireLesRetoursDeDepots`,
  `etatDesJobsDeDepots` via `attenteDesDepots`), et chaque copie retrouve les siens par son
  identifiant. Avant : deux lectures par copie, l'une après l'autre.
- Les lecteurs groupés lisent par tranches (100 dépôts pour les retours, 50 pour les jobs), avec le
  décompte exact de la base : une tranche dont le nombre de lignes diffère du décompte est relue
  dépôt par dépôt avec les lecteurs d'avant. Même tri (`created_at`), même liste par dépôt, même
  comportement en cas d'erreur (liste vide et une ligne au journal).
- Les trois pages de passation (Codex, Aletheia, Vestigia) font partir la porte de la copie annotée
  (et l'essai, pour Vestigia) avec la vue.

**Éprouvé**

- `tsc` propre, 2 685 tests verts.
- **`chargerVueProf` JSON-identique** ancien/nouveau sur les **16 instances** du bac à sable qui ont
  des dépôts (51 dépôts) ; 8,2 → 4,0 s pour les seize depuis Montréal.
- **9 écrans identiques** ancien/nouveau (Codex et Aletheia sur 6 instances, Vestigia, identifiant
  inconnu) avec la session prof du bac à sable ; en local 1,4-1,5 s → 0,7-0,8 s.
- Le repli sur troncature est joué contre une doublure de PostgREST (réponses plafonnées, décompte
  exact) : 120 dépôts × 25 jobs et 250 dépôts × 12 retours → tranches relues dépôt par dépôt,
  résultat identique au lecteur unitaire ; dépôts sans ligne → liste vide.
- **Passe adversariale** : rien de bloquant. Repris : le contrôle de troncature se fait sur le
  décompte de la base et non sur un plafond codé (une contrainte d'unicité borne de toute façon à
  4 jobs et 2 retours par dépôt) ; le journal nomme le premier dépôt de la tranche. Non repris : pas
  de test commité pour les lecteurs groupés (leurs modules importent `server-only`, que `npm test`
  ne charge pas — la doublure vit hors de l'arbre) ; `chargerVueEleve` lit encore ses retours en
  série après son `Promise.all` (une ligne pour `IDEES_post_rentree.md`).

**Non éprouvé** : la prod (avant : Codex 16 copies 1,9 s, 23 copies 2,4 s ; Aletheia 22 copies 2,35 s).

## 0 ter. Lot P1 remesuré en prod (18/09, déploiement `a6facc5` vérifié « Ready »)

| Écran | Avant | Après |
|---|---|---|
| Signalement › un dépôt | 2,9 s | **2,5 s** (3 tirs : 2,41 · 2,50 · 2,53) |
| Conception › une instance | 1,7 s | **1,4 s** (1,37 · 1,43) |

Moins que l'estimation. La raison, mesurée : la doctrine pèse **1,42 Mo de JSON** (routes 676 Ko,
`exercices_types_crans` 348 Ko pour 117 lignes, problèmes 164 Ko), et ce volume traverse la
passerelle à chaque rendu — 1,2 à 1,5 s depuis Montréal, sans doute 0,6 à 0,8 s depuis `pdx1`. La
profondeur en série n'était que la moitié du coût. **Le cache entre requêtes (P1.3), invalidé à
l'import, reste le levier** : il ramènerait ces deux pages autour de 0,8 s. Décision de Louis.

## 0 bis. Lot P1 — codé, éprouvé, DÉPLOYÉ (18/09) — ⚠️ état dépassé, voir 0 ter

**Ce qui change**

| Pièce | Avant | Après |
|---|---|---|
| `lireTable` (`utils/fabrique/doctrine.ts`) | décompte ∥ page 1, puis pages **en série** jusqu'à une page courte | décompte ∥ page 1 ; les pages suivantes que le décompte annonce partent **ensemble** ; puis, tant que la dernière page revient pleine, on continue en série. Même garde-fou, mêmes messages |
| `chargerDoctrineDepuisBase` | relue à chaque appel | `cache()` de React : **une lecture par rendu**, sur le même client admin (lui-même un par rendu) |
| Conception › instance | garde → doctrine → instance → … → édition (doctrine **encore**) → classes | doctrine ∥ instance ∥ édition ∥ classes partent ensemble ; attendus à leur place d'avant |
| Signalement › dépôt | garde → fuseau → file → porte → déroulé → édition (doctrine) | porte ∥ ligne du dépôt ∥ fuseau, puis file ∥ déroulé ∥ édition. Le déroulé et l'édition partent sur l'élève et l'exercice **du dépôt** ; si la file disait autre chose (impossible par construction : le signalement les copie du dépôt), on relit sur sa foi |

Le cache entre requêtes (P1.3) n'est **pas** fait : c'est une décision de Louis. La file entière reste
chargée sur la page d'un dépôt (P1.4) : elle part maintenant en parallèle, et elle est courte.

**Éprouvé**

- `tsc` propre, 2 685 tests verts (les 14 de `doctrine-lecture.test.ts` compris : pagination, décompte
  qui ment dans les deux sens, décompte absent, table vide, erreur de lecture).
- **Lignes de doctrine byte-identiques** entre l'ancien et le nouveau lecteur sur le bac à sable
  (1,45 Mo de JSON, 3 294 routes) ; depuis Montréal, 2 286 → 560 ms.
- **Treize écrans identiques** (texte et suite des identifiants) entre l'ancien code (worktree de
  HEAD, `next dev --webpack` sur 3100) et le nouveau (3000), avec une session prof par lien magique
  sur le bac à sable : 3 pages de conception (crans 5, 2, 4), 3 signalements de test × les deux
  moments, la liste des signalements, la liste de conception, et 3 chemins de refus (dépôt sans
  signalement, identifiants inconnus). Les 3 signalements de test ont été insérés puis effacés
  (`[recette P1 18/09]`, 0 restant).
- Durées en local (Montréal → Ohio) : conception 4,5 → 1,7 s, 3,0 → 1,9 s, 2,5 → 1,1 s ;
  signalement 3,4 → 1,9 s, 2,6 → 1,2 s, 2,5 → 1,2 s.
- **Passe adversariale** : rien de bloquant. Un point repris (la première page part avec le décompte,
  pour que les seize tables à une page ne paient pas un saut de plus). Notés, non repris : un
  `depotId` qui existe mais n'est plus dans la file coûte maintenant le déroulé et l'édition avant
  le 404 (lectures seules) ; `cache()` mémoïse aussi un refus pour la durée du rendu (la page
  tombait déjà au premier `await`) ; la page de conception et `charger-edition.ts` lisent deux fois
  la même instance (préexistant).

**Non éprouvé** : la prod (à mesurer après déploiement : signalement 2,9 s, conception 1,7 s
avant) ; l'écran à l'œil (le rendu est prouvé identique au texte près, aucun composant ne change).

## 0. Ce qu'il faut retenir

- **Le côté prof n'a reçu aucun des cinq lots** : `utils/lancer.ts` n'y est utilisé nulle part.
  Il profite seulement du Lot 0 (`pdx1`) et du Lot 1 (proxy, `getUser` mémoïsé, `lireIdentite`).
- **La base n'est pas lente, le réseau n'est plus la cause.** Ce qui reste, c'est **la profondeur
  en série** : Vercel mesure **13 000 appels Supabase en 12 h à 140 ms de moyenne**, et les
  écrans prof en enchaînent 10 à 40 l'un derrière l'autre.
- **Trois écrans sont franchement lents (2 à 3 s)**, tous pour une raison locale et nommée :
  1. **la page d'un signalement** (2,9 s) et **la page de conception** (1,7 s) rechargent la
     **doctrine entière** — 17 tables, 34 requêtes — à chaque rendu, et la conception la charge
     **deux fois** ;
  2. **la passation** (Codex, Aletheia, Vestigia : 1,9 – 2,4 s) lit les retours **copie par
     copie, en série** : 70 ms par élève, 23 élèves ;
  3. **la classe en vue « compétences »** (2,8 – 3,0 s, `load` à 6,3 s) sérialise **1 Mo** :
     la grille répète la fiche de chaque observable **pour chacun des 25 élèves**.
- **L'accueil** (2,0 s) tient à trois chargeurs en série : `tachesDeriveesDuCalendrier` (16 lectures
  en chaîne), `calculerSante` (8 en série) et la zone Vestigia (5 en série après le `Promise.all`).
- Tout le reste est entre 0,25 et 1,4 s. Les pages à une requête (classes, élèves, modules) sont
  à 0,25 s : **c'est le plancher**, et c'est ce que toutes les pages peuvent viser à 0,5 – 0,8 s.

## 1. Ce que le professeur attend aujourd'hui

Protocole : depuis une page déjà ouverte, chaque URL est chargée par `fetch` — un tir de chauffe,
puis trois tirs ; on garde la médiane de la fin d'arrivée du document. Serveur chaud (`pdx1`).
Le poids est celui du HTML décodé (la charge RSC comprise).

| Écran | Médiane | Poids | Lecture du code |
|---|---|---|---|
| **Classe › Compétences** (1HLP, 25 élèves) | **3,0 s** (2,8 s sur T5, 16 élèves) | **1 074 Ko** | ~45-55 lectures, ~22 en série ; grille de 1 400 observables sérialisés |
| **Signalement › un dépôt** | **2,9 s** | 49 Ko | file (~8) + `chargerLeDeroule` + **doctrine (34)** |
| **Passation prof** (Aletheia, 22 copies) | **2,35 s** | 134 Ko | 2 lectures **par copie**, en série |
| **Passation prof** (Codex, 23 copies) | **2,4 s** | 165 Ko | idem |
| **Passation prof** (Codex, 16 copies) | **1,9 s** | 141 Ko | idem — 70 ms par copie |
| **Tableau de bord** | **2,0 s** (2,4 s en navigation) | 49 Ko | ~40 lectures, ~28 en série |
| **Conception › une instance** | **1,7 s** (1,65 s) | 35 Ko | **doctrine ×2** (68) + gabarit |
| Classe › Activité | 1,3 s | 148 Ko | matrice : 17 lectures, 5 agrégateurs sériels |
| Vestigia › Suivi (par classe) | 1,3 s | 126-173 Ko | **5 lectures par classe, en série** (~40) |
| Aletheia (par classe) | 1,3 s | 46-104 Ko | ~20, boucles déjà parallèles |
| Vestigia (accueil du module) | 1,1 s | 87 Ko | ~29 |
| Vestigia › Suivi (toutes classes) | 1,2 s | 45 Ko | idem |
| Fiche élève (pilotage) | 1,1 s | 42 Ko | ~19, `calculerSante` en série |
| Calendrier | 1,1 s | 59 Ko | ~23, `assemblerEvenements` sériel (10) |
| Aletheia (accueil du module) | 1,1 s | 41 Ko | |
| Aletheia › fiche élève | 0,9 s | 113 Ko | |
| Codex (par classe) | 0,8 – 0,9 s | 54 Ko | 3 chargeurs en série |
| Signalements (liste) | 0,7 – 0,8 s | 39 Ko | garde → fuseau → file, 3 sauts avant la 1ʳᵉ donnée |
| Vestigia › fiche élève | 0,8 s | 49 Ko | |
| Codex › une copie | 0,7 s | 115 Ko | |
| Codex › examen diagnostique | 0,7 s | 87 Ko | |
| Quazian › quizz | 0,7 s | 55 Ko | |
| À risque | 0,7 s | 58 Ko | `calculerSante` en série |
| Scriptorium › Cours | 0,6 s | **549 Ko** | contenu des cours en clair |
| Routeur | 0,6 s | **188 Ko** | bien structuré |
| Compétences (réglages) | 0,6 s | 51 Ko | |
| Aletheia › examen diagnostique | 0,6 s | 49 Ko | |
| Quazian (par cible) | 0,5 – 0,7 s | 64 Ko | |
| Quazian, Quazian › cible | 0,5 s | 59-78 Ko | |
| Scriptorium (toutes vues sauf Cours) | 0,34 – 0,44 s | 38-51 Ko | déjà 12 `Promise.all` |
| Codex › validation, Allumage, Conception (liste), Intégrité | 0,30 – 0,36 s | 27-84 Ko | |
| Vestigia › essais, thèmes, semestres, tirage, vue d'ensemble | 0,24 – 0,30 s | 32 Ko | |
| **Classes, Élèves, Modules** | **0,24 – 0,27 s** | 34-37 Ko | 1 à 3 lectures — **le plancher** |

**En navigation réelle** (Navigation Timing, onglet en arrière-plan) : tableau de bord — premier
octet 20 ms (la coquille `loading.tsx` part tout de suite), document complet à **2,4 s**, `load` à
4,0 s. Classe › Compétences — document à **3,2 s**, `load` à **6,3 s**, 1 086 Ko décodés pour
45 Ko transférés (le HTML se compresse 24 fois : il est fait de répétitions).

**Vu à l'écran en prod** : le tableau de bord affiche « à traiter maintenant », santé de la cohorte
(52 %), les cinq classes ; la classe 1HLP en vue Compétences affiche « ce qui demande votre
attention » avec ses 2 signaux de citation composée.

## 2. Ce qui n'est PAS la cause

- **La base.** Les requêtes PostgREST les plus lentes en moyenne font 26 à 85 ms
  (`exercices` 85 ms × 14 appels, `exercices_depots` 56 ms × 102, `competences_fiches` 38 ms ×
  425). Les 2 624 requêtes applicatives distinctes totalisent 1 332 s de CPU depuis le 18/08. Ce qui
  domine `pg_stat_statements`, ce sont les lectures d'authentification (`users`, `sessions` :
  258 000 appels chacune, 0,1 ms) — le `getUser` de chaque requête.
- **Le réseau entre Vercel et la base.** Depuis le Lot 0 les fonctions sont à côté de la base.
- **Les erreurs et les délais** : 0 % d'erreur, 0 % de dépassement sur 12 h.
- **Le transfert** : 10 à 45 Ko sur le fil par page, même pour la page de 1 Mo.

## 3. Les causes, écran par écran

### 3.1 La doctrine rechargée à chaque rendu — signalement (2,9 s), conception (1,7 s)

`chargerDoctrineDepuisBase` (`utils/fabrique/doctrine.ts:766`) lit **17 tables** en deux vagues
parallèles, et chaque table coûte une lecture paginée **plus** un décompte (`lireTable`, `:640`).
`exercices_routes` porte **3 294 lignes** : 4 pages **en série** (PostgREST plafonne à 1 000), donc
la vague ne finit qu'au 5ᵉ saut. Aucun `cache()` : la doctrine se relit à chaque appel.

- `app/prof/conception/[id]/page.tsx:66` la charge, puis **`charger-edition.ts:55` la recharge**
  dans le même rendu : 68 requêtes, deux fois 5 sauts, pour des tables qui ne changent qu'à
  l'import.
- `app/prof/signalements/[depotId]/page.tsx` enchaîne : `garderProf` (3 lectures en série,
  `utils/routeur/acces.ts`), `lireFuseau`, **toute la file des signalements** (`chargerLaFileDesSignalements`,
  ~8 lectures en série, `utils/signalements/serveur.ts:235`) pour retrouver **un** dépôt, `lireLaPorte`,
  `chargerLeDeroule` (déjà groupé par le Lot 2), puis **la doctrine** via `chargerLEditionDeLInstance`.

### 3.2 Les retours lus copie par copie — passation (1,9 – 2,4 s)

`chargerVueProf` (`utils/passation/vues.ts:113`) :

```ts
for (const d of depots) {
  const [retours, attente] = await Promise.all([lireLesRetours(admin, d.id), attenteDuDepot(admin, d.id)])
```

Deux lectures par copie, **une copie après l'autre**. Mesuré : 16 copies → 1,9 s, 22-23 copies →
2,35-2,4 s, soit **70 ms par élève**. Les trois passations (Codex, Aletheia, Vestigia) partagent ce
chargeur, et la page Aletheia ajoute `chargerEntretienDeConception` en série derrière.

### 3.3 La grille des compétences pèse 1 Mo — classe › Compétences (3,0 s, `load` 6,3 s)

`chargerGrilleCompetences` (`utils/competences-classe.ts:399`) construit
`cellules[eleveId][competence].observables[]`, et chaque observable porte **sa fiche** (`nom`,
`ditALEleve`, `telemetriePure`, `sens`, `famille`, `ordre`) **et** sa série de mesures. Compté dans
la charge RSC : **1 400 observables** (25 élèves × 56) et **2 207 points** de série, 848 Ko pour la
seule ligne `1b`. Le composant `GrilleCompetences` est client (`'use client'`), donc tout est
sérialisé. Le HTML se compresse à 45 Ko, mais le serveur le fabrique, et le navigateur le lit,
l'analyse et l'hydrate : c'est le `load` à 6,3 s.

À cela s'ajoutent, en série sur le chemin : `lireFuseau` → `chargerMatricePilotage` (17 lectures,
5 agrégateurs sériels de 3 à 6 lectures) → `tousEleves` → grille ∥ fuseau → attention ∥ rétention.
`chargerLAttentionDeLaClasse` (`utils/pilotage/attention-serveur.ts:1036`) lit lui-même 3 fois la
ligne `scriptorium_params` et fait ses lots de 200 en série.

### 3.4 L'accueil — trois chargeurs sériels derrière un `Promise.all`

`app/prof/page.tsx:26` lance bien six blocs ensemble, mais :

- **`tachesDeriveesDuCalendrier`** (`utils/calendrier-a-faire.ts:43`) : 16 sites de lecture,
  presque tous sériels, avec une chaîne à trois étages (`:313` créneaux → `:318` éléments → `:332`
  classes). C'est le plus long des six, donc **il fixe la durée du `Promise.all`**.
- **`calculerSante`** (`utils/sante.ts:74`) : 8 lectures, toutes en série, dont 5 indépendantes
  (`modules`, `classe_modules`, `inscriptions`, `semesters`, `fragments_semaines`). Appelé aussi par
  « À risque » et la fiche élève.
- **`chargerLaFileDExamenHumain`** : paginé en série, puis `inscriptions` → `classes` en série.
- Après le `Promise.all`, **la zone Vestigia** enchaîne 5 lectures en série (`page.tsx:51-82` :
  analyses → dépôts → inscriptions → profils → semaines), puis un second `Promise.all`, puis
  `compterLesExercicesATraiter` (2 lectures en série).

Profondeur en série estimée : ~28, à 70 ms le saut, c'est les 2,0 s mesurées.

### 3.5 Le suivi Vestigia — cinq lectures par classe, en série (1,2 – 1,3 s)

`app/prof/fragments-erudition/suivi/page.tsx:94` : `for (const c of classes)` avec **cinq `await`
dans la boucle** (inscriptions, profils, thèmes, dépôts, analyses). Aucune classe ne dépend d'une
autre. Aucun `Promise.all` dans le fichier. Avant la boucle : `getUser` → `profiles` → semestre →
module → classes → semaines, six sauts en série.

### 3.6 Les motifs transverses (2 à 4 sauts sur presque chaque page)

- **La garde refaite à la main.** Le layout a déjà lu `getUser` et `profiles` (`lireIdentite`,
  mémoïsé), mais dix pages et deux gardes les relisent : `a-risque`, `eleves/[eleveId]`,
  `fragments-erudition/suivi`, `scriptorium`, `codex/validation`, `integrite`, `tirage`,
  `evaluations`, `utils/fabrique/acces.ts:31`, `utils/passation/garde.ts:29`, `utils/routeur/acces.ts`.
  Le `getUser` est mémoïsé par client, mais **le `profiles.select('role').single()` ne l'est pas** :
  un saut de plus, toujours en tête de page.
- **Les interrupteurs lus colonne par colonne.** `lireLesReglages` (`utils/scriptorium-params.ts:38`,
  `cache()`) existe, mais 13 sites lisent encore `scriptorium_params` directement :
  `utils/fabrique/acces.ts:44,55` (deux lectures dans la même garde), `utils/routeur/acces.ts:50`,
  `classes/[classeId]/page.tsx:65`, `utils/pilotage/attention-serveur.ts:1037`,
  `porte-retours-a-relire.ts:13`, `retour-a-relire-serveur.ts:24` (trois lectures dans un seul
  chargeur), `utils/plan-exercices.ts:18,117`, `utils/chaine/acces.ts:21`,
  `utils/signalements/serveur.ts:55` (celui-ci passe par `lireLesReglages`, c'est bien).
- **Garde → fuseau → chargeur, trois sauts avant la première donnée** : `signalements/page.tsx:37-40`,
  `conception/page.tsx:34-35`, `competences/page.tsx:58-59`, `routeur/page.tsx:49`,
  `codex/page.tsx:87-97`.
- **`assemblerEvenements`** (`utils/calendrier-evenements.ts:46`) : 10 lectures en série, les quatre
  premières indépendantes. Partagé avec le côté élève (noté « hors lots » le 17/09).

## 4. Recommandations — six lots, par gain décroissant

Le patron est celui du côté élève : **les lectures indépendantes partent ensemble (`lancer`), et
s'attendent à leur place** ; jamais une écriture ; l'équivalence se prouve en exécutant l'ancien et
le nouveau code côte à côte sur les mêmes données. Les gains sont estimés à 70 ms par saut en
série retiré, borne prudente au vu des mesures.

### Lot P1 — la doctrine se lit une fois (signalement 2,9 → ~1,2 s ; conception 1,7 → ~0,9 s)

1. Envelopper `chargerDoctrineDepuisBase` dans `cache()` de React : la conception ne la lira plus
   qu'une fois par rendu (34 requêtes de moins, 5 sauts de moins). Aucun changement de résultat.
2. Dans `lireTable`, lire **les pages en parallèle** : le décompte part déjà en avance ; il suffit
   de l'attendre d'abord pour connaître le nombre de pages, puis de lancer les `range` ensemble.
   `exercices_routes` passe de 4 sauts à 2. Le contrôle « tronqué » reste tel quel.
3. Mettre la doctrine **en cache entre les requêtes** (`unstable_cache` ou `'use cache'` de Next 16,
   à vérifier dans `node_modules/next/dist/docs/`), invalidée par `revalidateTag` à la fin de
   `import-ecriture.ts`. C'est le seul endroit qui l'écrit. Décision de Louis : le cache rend une
   doctrine possiblement vieille de quelques secondes après un import.
4. La page d'un signalement ne doit pas charger **toute la file** pour un dépôt : lire le
   signalement du dépôt (`lireLeSignalementDuDepot` existe déjà) et ne garder la file que pour la
   navigation « précédent / suivant », en la lançant en parallèle.

### Lot P2 — la passation lit ses copies ensemble (2,4 → ~0,8 s)

Dans `chargerVueProf`, remplacer la boucle par **deux lectures groupées** : `exercices_retours`
`.in('depot_id', ids)` et l'attente `.in(...)`, puis répartir par dépôt — ou, à défaut,
`Promise.all(depots.map(...))`. Les trois passations en profitent. Sur la page Aletheia, lancer
`chargerEntretienDeConception` en même temps que la vue. À éprouver : mêmes `copies[]` avant/après
sur les 3 exercices mesurés (16, 22, 23 copies), en comparant la sérialisation.

### Lot P3 — la grille des compétences cesse de répéter les fiches (3,0 → ~1,5 s ; `load` 6,3 → ~3 s)

1. Sortir de chaque cellule les champs **qui ne dépendent pas de l'élève** (`nom`, `ditALEleve`,
   `telemetriePure`, `sens`, `famille`, `ordre`) vers un dictionnaire `observables[competence][code]`
   passé une fois ; la cellule ne garde que ses nombres et sa série. C'est 1 400 fiches → 56.
2. Borner `serie` plus court par défaut (ou la charger au clic sur l'observable) : 2 207 points
   partent pour un écran qui n'en montre qu'un par cellule à la fois.
3. Dans le rendu : `chargerMatricePilotage` et `tousEleves` ensemble ; les cinq agrégateurs de la
   matrice (`utils/matrice-pilotage.ts:175-421`) chacun en lectures groupées ; les trois lectures de
   `scriptorium_params` de l'attention remplacées par `lireLesReglages`.
⚠️ Lot de **structure de données** : `GrilleCompetences.tsx` et son type changent. Il faut le
rendu identique à l'œil (Louis) et non seulement les tests.

### Lot P4 — l'accueil (2,0 → ~1,0 s)

- `calculerSante` : les cinq premières lectures ensemble, puis dépôts → analyses ∥ états FSRS.
  Profite aussi à « À risque » et à la fiche élève.
- `tachesDeriveesDuCalendrier` : les blocs (thèmes, épreuves, plan, annonces, synthèses,
  assignations, parcours) partent ensemble ; la chaîne créneaux → éléments → classes se réduit en
  lisant les classes avec les créneaux.
- Zone Vestigia de `page.tsx` : `analysesOuvertes` et `semainesV` dès le premier `Promise.all` ;
  `inscriptions` pour les noms est déjà lu (`inscriptionsActives`) — la relecture `inscAValider`
  peut s'y substituer.
- `compterLesExercicesATraiter` : ses deux lectures ensemble, et lancé dans le premier `Promise.all`.

### Lot P5 — le suivi Vestigia et le socle des gardes (suivi 1,3 → ~0,5 s ; −2 à −4 sauts partout)

- `suivi/page.tsx` : `Promise.all(classes.map(async (c) => …))` autour du corps de la boucle, et
  dedans, profils ∥ thèmes ∥ dépôts ; puis analyses. Avant la boucle : `semestre ∥ module` ensemble.
- Les dix pages et trois gardes qui relisent `getUser` + `profiles` passent par `lireIdentite()`.
- Les 13 lectures directes de `scriptorium_params` passent par `lireLesReglages` (une par rendu).
- Les enchaînements garde → fuseau → chargeur : le fuseau et le chargeur partent avec la garde, la
  garde s'attend en premier (mêmes refus).

### Lot P6 — le calendrier et le reste (1,1 → ~0,7 s)

- `assemblerEvenements` : les quatre lectures indépendantes ensemble ; partagé prof/élève, donc
  éprouvé sur les deux comptes (Élo et le prof).
- `codex/page.tsx:87-97` : les trois chargeurs ensemble.
- `chargerInstanceDeClasse` (Scriptorium, `instance-serveur.ts:209-284`, 7 sauts) — seulement si
  Louis ouvre souvent la vue d'une instance.

### Hors lots, à décider par Louis

- **Le `getUser` du rendu** reste un vrai appel réseau à chaque page (les 258 000 lectures
  `users`/`sessions`). Passer aussi le rendu à `getClaims` retirerait un saut de tout, au prix d'un
  compte révoqué qui garde l'accès jusqu'à l'expiration du jeton (1 h). Même arbitrage que le 17/09.
- **Scriptorium › Cours** renvoie 549 Ko de contenu de cours en clair, en 0,6 s. Rapide, mais lourd
  sur téléphone. À couper par cours si l'onglet sert en classe.

## 5. Non mesuré, limites

- **Les actions serveur prof** (valider un thème, publier un retour, arbitrer un signalement) : ce
  serait écrire en prod. Elles refont pour la plupart `garderProf` puis un chargeur, donc les lots
  P1 et P5 les accélèrent aussi.
- **Le téléphone** : pas de bridage réseau dans l'extension ; la page de 1 Mo y sera plus lente
  que 6 s à l'analyse.
- **Le `load`** est mesuré onglet en arrière-plan : Chrome y bride les minuteurs ; l'écart document →
  `load` (1,6 à 3 s) est en partie un artefact, comme le 17/09.
- Les comptes de lectures sont lus dans le code, pas comptés à la sonde. Le côté élève a montré que
  l'écart est faible (42 sauts comptés, 6,3 s mesurées à 150 ms le saut).
- Vercel donne la latence moyenne par hôte (140 ms), pas par route : le coût du saut varie selon la
  requête (85 ms de moyenne pour la lecture d'`exercices`, 0,1 ms pour `users`).
