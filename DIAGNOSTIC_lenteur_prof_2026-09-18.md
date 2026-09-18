# Diagnostic — la lenteur côté professeur (mesuré en prod le 18/09/2026)

> Mesures prises depuis Montréal, dans Chrome, avec le compte professeur de Louis, sur
> `palimpseste.ink`, un jour après les cinq lots du côté élève (`DIAGNOSTIC_lenteur_eleve_2026-09-17.md`).
> Aucune écriture en prod : que des `GET`. Lectures serveur : observabilité Vercel (12 h),
> `pg_stat_statements` de la prod en session lecture seule, comptes de lignes par PostgREST.
> Les comptes d'allers-retours viennent de la lecture du code, pas de l'exécution.

## 0 sexdecies. BILAN — tout est DÉPLOYÉ et remesuré en prod (18/09 soir) — ÉTAT COURANT

Même protocole qu'au §1 (fetch depuis une page ouverte, 1 chauffe + 3 tirs, médiane), déploiement
`1a02aeb` en service.

| Écran | Au départ (matin) | **Ce soir** |
|---|---|---|
| Conception › une instance | 1,7 s | **0,43 – 0,46 s** |
| Signalement › un dépôt | 2,9 s | **1,8 s** (premier tir sur une fonction froide : 3,1 – 3,8 s, le temps qu'elle lise la doctrine une fois) |
| Passation prof, 23 copies | 2,4 s | **0,97 s** |
| Classe 1HLP › Compétences | 3,0 s, 1 074 Ko | **2,2 s, 446 Ko** |
| Classe T5 › Compétences | 2,8 s, 706 Ko | **2,1 s, 314 Ko** |
| Classe 1HLP › Activité | 1,3 s | 1,3 s |
| Tableau de bord | 2,0 s | **1,6 – 1,8 s** — et la tuile « Coût API » dit maintenant **24,68 $**, stable sur trois tirs (18,55 $ faux avant) |
| Suivi Vestigia | 1,3 s | **0,81 s** |
| Calendrier | 1,0 – 1,2 s | **0,8 s** |
| Codex · Signalements · Aletheia | 0,85 · 0,75 · 1,1 s | 0,72 · 0,68 · 1,1 s |

**Ce qui reste**

- La page d'un signalement (1,8 s) : la file entière, le déroulé et l'édition partent ensemble, mais
  le déroulé garde ~15 lectures de profondeur (hérité du côté élève, lot 2 du 17/09).
- La classe en vue Compétences (2,1 – 2,2 s) : la matrice (17 lectures, agrégateurs Quazian et
  Aletheia encore sériels) et l'attention (mesures paginées, faisceau sériel — il écrit) fixent la
  durée du `Promise.all`.
- Le tableau de bord (1,6 – 1,8 s) : la chaîne du plan dans les tâches du calendrier et la file
  d'examen humain paginée.
- **À décider par Louis** : passer le rendu à `getClaims` (un saut de moins par page, un compte
  révoqué garde l'accès jusqu'à l'expiration du jeton, une heure).
- Chaque fonction Vercel neuve lit la doctrine une fois (0,7 s) : les premiers tirs après un
  déploiement ou une montée en charge sont plus lents sur signalement et conception.

## 0 quindecies. Lot P3 bis — la page de classe : codé, éprouvé, DÉPLOYÉ (18/09) — ⚠️ état dépassé, voir 0 sexdecies

**Ce qui change**

- **`chargerLeSocleDeLaClasse`** (`utils/matrice-pilotage.ts`) : les inscrits et leurs noms, lus une
  fois par la page et passés à la matrice. La page fait alors partir **ensemble** la matrice, la
  grille des compétences, l'attention et la rétention, qui ne dépendent que de ce socle ; avant,
  chacune attendait la précédente. Dans la matrice, les modules et les accès partent tout de suite ;
  dans l'agrégateur Vestigia, le semestre et les dépôts partent ensemble.
- **Attention** : les lots de 200 des contestations et des citations composées partent ensemble et
  s'attendent dans l'ordre. `drapeauxDuFaisceau`, qui contient une écriture, n'est pas touché.
- ⚠️ L'attention part maintenant AVANT que la matrice soit attendue ; elle contient une écriture
  idempotente (le signalement du faisceau, `upsert` ignoré s'il existe). La revue l'a jugé acceptable :
  la seule garde (la classe existe) est passée avant ce départ, rien ne refuse après, et la même ligne
  aurait été posée au rendu suivant. C'est écrit en commentaire dans la page.

**Éprouvé** : `tsc`, `eslint`, tests verts ; **10 écrans identiques** (4 classes en vue Compétences,
tri par nom, 3 en vue Activité, identifiant inconnu) ancien/nouveau au bac à sable ; en local, la vue
Compétences passe de 1,9-3,2 s à 1,0-1,9 s. Passe adversariale : rien de bloquant, deux commentaires repris.

**Non éprouvé** : la prod (avant : 1HLP Compétences 2,8 s, T5 2,6 s, Activité 1,3 s).

## 0 quaterdecies. Le cache de la doctrine et la tuile « Coût API » : codés, éprouvés, DÉPLOYÉS (18/09) — ⚠️ état dépassé, voir 0 sexdecies

**La doctrine gardée entre deux requêtes** (décision de Louis). `chargerDoctrineDepuisBase` garde la
doctrine assemblée en **mémoire du processus**, par projet Supabase, **trois minutes** ; un refus ne
se garde pas ; une doublure sans `supabaseUrl` (les tests) n'est jamais gardée ;
`oublierLaDoctrineGardee()` pour la recette. Ni `unstable_cache` (2 Mo par entrée, un saut réseau)
ni `'use cache'` (pas de `cacheComponents`). Les 17 tables ne sont écrites par aucun chemin de
l'application (vérifié par la revue) : la seule dérivation est `derive-doctrine.py --sql`, jouée à la
main ; **après une dérivation, la prod peut servir une doctrine vieille de trois minutes**.
⛔ **Les chemins qui ÉCRIVENT lisent une doctrine FRAÎCHE** (`chargerDoctrineFraiche`) : l'import
d'un fichier (`import-ecriture.ts`) et la conception d'une instance (`conception/actions.ts`)
valident contre la doctrine puis écrivent avec les tables du jour — une clé retirée par une
dérivation aurait été acceptée par la garde et écrite sans observable (trouvé par la revue).

**La tuile « Coût API »** lit ses cinq tables par `lirePagine` (pages sur `id`, décompte exact), avec une
fenêtre **fermée des deux côtés** (`created_at < maintenant`) : `api_couts` s'écrit sans arrêt et une
insertion entre le décompte et les pages déclarerait la lecture tronquée à tort (trouvé par la revue).

**Éprouvé** : 3 tests ajoutés (garde servie sans lecture, refus non gardé, doctrine fraîche qui relit) ;
2 688 tests verts ; script : sandbox et prod gardées séparément, 0 ms au second appel, refus relu ;
8 écrans à doctrine identiques ancien/nouveau (conception ×4, `nouvelle`, signalements ×2, accueil),
conception 1,1 → 0,5-0,8 s en local ; la tuile affiche **9,57 $** au bac à sable, stable sur trois
tirs, égal à la somme paginée calculée à part (contre 7,84 / 8,61 $ avant). En prod la somme vraie du
mois est **24,68 $** quand la tuile affichait 18,55 $.

## 0 terdecies. Lot P6 remesuré en prod (18/09) — calendrier prof 1,0-1,2 → **0,8 s** (mois 0,81 · semaine 0,86 · jour 0,77)

## 0 duodecies. Lot P6 — le calendrier : codé, éprouvé, DÉPLOYÉ (18/09) — ⚠️ état dépassé, voir 0 terdecies

**Ce qui change**

- **`assemblerEvenements`** (`utils/calendrier-evenements.ts`, partagé par le calendrier du
  professeur et celui de l'élève) : les cinq sources qui ne dépendent que de la fenêtre (classes,
  essais, quizz, sessions Codex, paires de livres gouvernés) et la porte du plan partent ensemble ;
  dans le bloc du plan, le réglage « quiz annoncé » (élève) part avec les plans, les exercices figés
  et les synthèses (prof) partent ensemble après les plans. Chaque source est attendue à sa place
  d'avant et pousse ses événements dans le même ordre (le tri final est stable).
- **Page calendrier prof** : la fenêtre se calcule d'abord ; les événements, les jours de cours et
  les classes partent avant le semestre et les vacances.

**Éprouvé**

- `tsc` et `eslint` propres, 2 685 tests verts.
- **12 écrans identiques** ancien/nouveau : calendrier prof en vues mois, semaine, jour, deux dates,
  deux filtres de classes (2,0-2,3 → 1,05-1,34 s en local) ; calendrier **élève** (compte de décor)
  en mois, semaine, jour (1,2 → 0,7 s). Le plan est ouvert au bac à sable et porte des exercices
  dans les deux ancrages : la source 5 a été exercée.
- **Passe adversariale** : rien de bloquant. Vérifié : le contrat fermé côté élève est inchangé
  (aucune synthèse lue, `quiz_annonce` lu seulement côté élève, paires appelées avec les mêmes
  arguments), l'ordre de poussée, une seule lecture de la ligne des réglages par rendu. Noté,
  préexistant : un élève sans inscription fait lire toutes les assignations actives
  (`IDEES_post_rentree.md`).

**Non éprouvé** : la prod (avant : calendrier prof 1,0-1,2 s ; élève 0,9 s le 17/09).

## 0 undecies. Lot P5 remesuré en prod (18/09)

| Écran | Avant | Après |
|---|---|---|
| Suivi Vestigia (toutes classes / une classe) | 1,2 – 1,3 s | **0,81 s** |
| Codex | 0,85 s | 0,72 s |
| Signalements | 0,75 s | 0,68 s |
| Compétences (réglages) | 0,57 s | 0,55 s |
| Intégrité, À risque, Scriptorium | 0,30 · 0,52 · 0,37 s | 0,33 · 0,53 · 0,37 s |

## 0 decies. Lot P5 — le suivi Vestigia et le socle des gardes : codé, éprouvé, DÉPLOYÉ (18/09) — ⚠️ état dépassé, voir 0 undecies

**Ce qui change**

- **Suivi Vestigia** (`app/prof/fragments-erudition/suivi/page.tsx`) : la garde passe par `lireIdentite`
  (déjà lue par le layout) ; le module part avec le semestre ; **les classes se lisent ensemble**
  (`Promise.all`), et dans chaque classe les profils, les thèmes et les dépôts partent ensemble, les
  analyses après. Résultats rangés dans l'ordre des classes.
- **Sept pages** (À risque, fiche élève, Scriptorium, validation Codex, intégrité, tirage,
  évaluations) **et deux gardes** (`utils/fabrique/acces.ts`, `utils/passation/garde.ts`) lisent
  l'identité par `lireIdentite` : mêmes refus, byte-identiques (`notFound` / `redirect` conservés
  page par page) ; un saut de moins en tête de chaque page.
- **La ligne des réglages** (`scriptorium_params`, une seule ligne, `check (id = 1)`) se lit par
  `lireLesReglages` dans les gardes fabrique et routeur, `lireLesTroisInterrupteurs`,
  `lireGatePlanActif`, `lireQuizAnnonceDefaut`, `lireLesSeuils`, `lireLesInterrupteurs`.
  **⛔ Pas `chaineActive`** : c'est l'interrupteur de sécurité de la chaîne IA, relu à chaque job ;
  il garde sa lecture directe (la revue a vérifié que le cache est de toute façon inactif dans une
  route API, mais un interrupteur de sécurité ne se met pas derrière un cache).
- **Chaînes garde → fuseau → chargeur** : signalements (fuseau part avec la garde), compétences (les
  trois interrupteurs partent avec les six lectures), Codex (synthèses à préparer lancées en tête ;
  classes et titres ensemble).
- Deux doublures de test déclarent le nouveau module (`utils/routeur/pilotage-serveur.test.ts`,
  `scripts/recette/fixtures/contexte-navigation.mjs` — ce dernier était déjà cassé depuis le 17/09
  par le `getUser` mémoïsé, hors `npm test`).

**Éprouvé**

- `tsc` et `eslint` propres, 2 685 tests verts.
- **22 écrans identiques** ancien/nouveau avec la session prof du bac à sable : suivi (toutes
  classes, une classe), À risque, fiche élève, Scriptorium ×2, validation, intégrité, tirage,
  évaluations, compétences, signalements, Codex ×2, conception ×2, routeur ×3, passation, calendrier,
  accueil. En local : Codex 1,16 → 0,57 s, signalements 0,55 → 0,35 s, validation 0,46 → 0,27 s,
  tirage 0,62 → 0,42 s, compétences 0,86 → 0,69 s ; suivi 0,94 → 0,79 s (4 petites classes).
- **Refus identiques** sur dix pages, en session **élève** (307 → `/eleve`) et **anonyme**
  (307 → `/login`), ancien et nouveau.
- **Passe adversariale** : rien de bloquant. Vérifié par elle : `React.cache` est un passe-plat dans
  les Route Handlers de Next 16 (aucun dispatcher installé), donc la chaîne relit sa porte à chaque
  job ; `scriptorium_params` est une ligne unique ; parité des refus ; rien de lancé n'écrit. Repris :
  un commentaire périmé, la doublure de la fixture de recette.

**Non éprouvé** : la prod (avant : suivi Vestigia 1,2-1,3 s ; les pages à garde manuelle, ~0,07 s
de moins chacune attendu).

## 0 nonies. Lot P4 remesuré en prod (18/09) — accueil 2,0 → **1,6 s**, À risque 0,7 → **0,52 s**, fiche élève 1,1 → **1,0 s**, calendrier 1,1 → 1,03 s

Moins que l'estimation (1,0 s) sur l'accueil : ce qui reste est la chaîne du plan dans les tâches
du calendrier (porte → plans → quatre lectures → synthèses → dates) et la file d'examen humain
paginée, chacune derrière l'autre à l'intérieur du `Promise.all`.

## 0 octies. Lot P4 — l'accueil : codé, éprouvé, DÉPLOYÉ (18/09) — ⚠️ état dépassé, voir 0 nonies

**Ce qui change** (patron `utils/lancer.ts` partout : des lectures, attendues à leur place d'avant)

- **`app/prof/page.tsx`** : les analyses ouvertes et les semaines de Vestigia, les quatre lectures de
  l'intégrité et le compte des exercices signalés partent avant le premier `Promise.all` ; les noms
  des inscrits partent dès que les inscriptions sont connues, et seuls les élèves « à valider » non
  inscrits se lisent après (même carte de noms).
- **`calculerSante`** (`utils/sante.ts`, servi aussi par « À risque » et la fiche élève) : quatre
  lectures indépendantes partent ensemble, les dépôts et les états FSRS dès que leurs entrées sont
  connues. 8 sauts → 3.
- **`tachesDeriveesDuCalendrier`** (`utils/calendrier-a-faire.ts`) : les têtes des cinq blocs partent
  au début ; les quatre lectures du plan ensemble ; les aperçus d'assignation en `Promise.all` (le
  socle de frise partage sa promesse) ; les noms des classes avec les créneaux. **L'ordre des tâches
  poussées est inchangé** (le tri final est stable).
- **`chargerLaFileDExamenHumain`** : les lots de 200 dépôts partent ensemble et s'attendent dans
  l'ordre ; les classes partent tôt. **`compterLesExercicesATraiter`** : ses deux lectures ensemble
  (la table des cas traités se lit entière : une ligne par exercice traité).

**Éprouvé**

- `tsc` propre, 2 685 tests verts. (`eslint` signale une règle `react-hooks/purity` sur `Date.now()`
  dans `page.tsx` : elle était déjà là sur HEAD, non touchée.)
- **Chargeurs JSON-identiques** ancien/nouveau : `calculerSante` (3 tirs, bac à sable ET prod en
  lecture seule — 14,6 Ko de résultat en prod, 2,5 → 0,8 s à froid), `chargerLaFileDExamenHumain`,
  `compterLesExercicesATraiter`. ⚠️ La file d'examen humain est **vide** des deux côtés : la voie
  des lots parallèles n'a pas été exercée par des données.
- **Écrans identiques** ancien/nouveau avec la session prof du bac à sable : l'accueil (3 tirs,
  montants « Coût API » masqués — voir ci-dessous), « À risque », deux fiches élève, le calendrier.
  Accueil en local : 2,7 → 1,4 s ; « À risque » 0,78 → 0,48 s ; fiche élève 1,3 → 0,85 s.
- **Passe adversariale** : rien de bloquant, rien à reprendre. Notés : la lecture entière des cas
  traités ne peut dépasser 1 000 lignes qu'après 1 000 exercices traités ; une lecture des classes
  part une fois de plus quand aucun élément non vu n'existe (lecture seule).

**⚠️ Trouvé en route, préexistant, hors lot — la tuile « Coût API » de l'accueil ment.**
`app/prof/CoutApi.tsx` lit `api_couts` du mois sans pagination ni tri ; la table porte **1 407
lignes ce mois-ci en prod** (1 621 au bac à sable). PostgREST en rend 1 000 sans le dire : le total
affiché est **partiel et varie d'un tir à l'autre** (7,84 $ puis 8,61 $ mesurés sur la même base).
Une ligne dans `IDEES_post_rentree.md` ; la réparation est une agrégation côté base ou une pagination
sur le décompte. Même risque, plus lointain, sur `exercices_signalements_eleve` (une ligne par dépôt signalé).

**Non éprouvé** : la prod (avant : accueil 2,0 s, « À risque » 0,7 s, fiche élève 1,1 s).

## 0 septies. Lot P3 remesuré en prod (18/09) — le POIDS baisse, le TEMPS presque pas

| Écran | Avant | Après |
|---|---|---|
| Classe 1HLP › Compétences | 3,0 s, **1 074 Ko** | **2,8 s, 451 Ko** |
| Classe T5 › Compétences | 2,8 s, 706 Ko | 2,6 s, 314 Ko |
| Classe 1HLP › Activité | 1,3 s | 1,3 s |

La sérialisation n'était pas le temps de cette page : ce qui reste est sa chaîne de lectures
(matrice de pilotage à cinq agrégateurs sériels, attention par lots de 200 en série, mesures
paginées). C'est un lot à part, « P3 bis », à mettre en file après P6. Le gain acquis est celui du
navigateur (moins à analyser, à hydrater) et du réseau mobile.

## 0 sexies. Lot P3 — la grille des compétences : codé, éprouvé, DÉPLOYÉ (18/09) — ⚠️ état dépassé, voir 0 septies

**Ce qui change**

- **`utils/competences-grille.ts`** (neuf, module pur, sans `server-only` — le composant client
  l'importe) : les formes que l'écran lit, et `observablesDeLaCellule`, qui recompose au champ près
  l'`ObservableEleve` d'avant à partir de la colonne et de la cellule.
- **`chargerGrilleCompetences`** : la fiche de chaque observable (`code`, `nom`, `ditALEleve`,
  `telemetriePure`, `sens`, `famille`, `ordre`) est portée **une fois par colonne**, dans l'ordre
  d'avant. Une cellule ne porte que ses nombres, **par code, et seulement si elle a au moins une
  mesure** (une cellule sans mesure envoie `{}`, ses observables valent tous le même « rien ») ; la
  date et la provenance de chaque mesure sont portées une fois par cellule, pas par observable.
- **`GrilleCompetences.tsx`** recompose les observables de la seule cellule ouverte.
- **Page de classe** : la liste de tous les élèves part avec la matrice ; la porte d'affichage, les
  seuils de l'attention et la porte des retours à relire passent par `lireLesReglages` (une lecture
  de `scriptorium_params` par rendu au lieu de quatre).

**Mesuré.** Charge RSC de la grille au bac à sable (4 classes × 2 opt-out) : **1 578 → 303 Ko**.
En prod, la vue Compétences de 1HLP pesait 847 Ko de grille sur 1 074 Ko de page.

**Éprouvé**

- `tsc` et `eslint` propres, 2 685 tests verts.
- **336 cellules sur 336 identiques** (4 classes du bac à sable, deux variantes d'opt-out) : la
  cellule recomposée par `observablesDeLaCellule` égale, champ par champ et dans l'ordre, la cellule
  de l'ancien chargeur ; colonnes et comptes identiques.
- **7 écrans identiques** ancien/nouveau (4 classes en vue Compétences, 2 en vue Activité, un
  identifiant inconnu) avec la session prof du bac à sable.
- **Vu à l'œil, sur les trois tailles** (1280, 768, 375) sur le bac à sable, classe T5 : la grille,
  la cellule « Elo · Expression » ouverte (25 mesures, lettre B), ses observables avec dernière
  valeur, acquisition et série de 12 points bornée (« + »).
- **Passe adversariale** : rien de bloquant. Repris : la porte d'affichage passe aussi par
  `lireLesReglages` ; l'ordre des imports ; un commentaire sur la branche 42703 devenue morte.
  Notée, non reprise : le cast `as EntreeObservableMesure` (une construction l'interdit).

**Piège payé.** Un composant client qui importe une **valeur** d'un module `server-only` entraîne tout
le module dans le bundle client : la page rendait 500 en local. D'où le module pur, séparé.

**Non éprouvé** : la prod (avant : 3,0 s et 1 074 Ko, `load` 6,3 s).

## 0 quinquies. Lot P2 remesuré en prod (18/09) — Codex 23 copies 2,4 → **0,97 s**, 16 copies 1,9 → **0,89 s**, Aletheia 22 copies 2,35 → **0,97 s**

## 0 quater. Lot P2 — la passation lit ses copies ensemble : codé, éprouvé, DÉPLOYÉ (18/09) — ⚠️ état dépassé, voir 0 quinquies

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
