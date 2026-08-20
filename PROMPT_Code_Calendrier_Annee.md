# PROMPT Code — Calendrier · Année : on borne l'année, les semestres se déduisent

*(⚙️ modèle standard · une session = ce lot (règle R4) · `/clear` avant de commencer · branche `feat/calendrier-annee` depuis un `main` à jour · aucun prérequis de lot — le module Calendrier est en place depuis C8·L1)*

## Contexte

Le module Calendrier demande aujourd'hui de **concevoir des semestres**. L'écran « Semestres »
(`app/prof/calendrier/config/EcranSemestres.tsx`) ouvre un formulaire « Nouveau semestre » par plage
— un nom, deux dates — et recommence pour le suivant. Rien n'y dit qu'un second semestre existe,
rien ne borne l'année, et deux plages saisies l'une après l'autre ne se rejoignent que si le
professeur y pense : la garde de chevauchement (`config/actions.ts:30`) empêche qu'elles se
recouvrent, aucune n'empêche qu'un trou reste entre elles.

**Louis l'a tranché le 20/08 : ce qui se conçoit, c'est l'ANNÉE ; les semestres se bornent à
l'intérieur.** Trois dates, dans ses mots : *« j'indique la date de rentrée, la date de fin du 1er
semestre, et la date de fin d'année. Le premier semestre va du début de l'année à la fin du 1er
semestre. Le second va du lendemain de la date du 1er semestre, jusqu'à la fin de l'année. »*

**Ce n'est pas un changement de modèle de données, et il ne faut pas en faire un.** La table
`semesters` reste la source de vérité : **trente-huit lectures, dans vingt-deux fichiers** — Fragments (dépôts, thèmes,
synthèses, essais), Quazian (quiz, notes de semestre), le Scriptorium (plans d'évaluation, frise du
parcours), le calendrier prof et élève, le tableau de bord élève, `utils/sante.ts`. Ce lot **ne
touche à aucun d'eux**. Il change **la porte d'entrée** : au lieu d'écrire une ligne `semesters` à
la fois, l'écran en écrit deux d'un coup, à partir de trois dates. *Décision de Louis, même jour :
pas de table `annees`, pas de colonne `annee_id`, aucune migration. L'année scolaire continue de se
déduire des dates, comme elle le fait déjà en deux endroits (`config/page.tsx:16` et
`utils/frise-enseignement.ts:51`).*

## Objectif du lot

### 1. Le rail affiche « Année » à la place de « Semestres »

`config/page.tsx:12` (`SECTIONS`), `config/page.tsx:173` (`railItems`) et le fil de configuration
de `RailConfig.tsx` (« Fuseau → Semestres → Vacances → Classes ») passent à **Année**. Le résumé du
rail dit l'année scolaire et son état (ex. « 2026-2027 · S1 en cours ») ; l'avertissement
« semaines à générer » reste, sur la même règle qu'aujourd'hui (`config/page.tsx:188`).

### 2. Un écran « Année », trois dates, une seule action serveur

L'écran remplace `EcranSemestres.tsx`. Il porte :

- **un formulaire à trois `ChampDate`** — *Rentrée* · *Fin du 1er semestre* · *Fin de l'année* —
  et rien d'autre à saisir. Réutiliser `ChampDate.tsx` tel quel (locale FR, semaine lundi→dimanche,
  valeur `YYYY-MM-DD`, aucune dérive de fuseau).
- **les deux semestres en lecture** sous le formulaire, au patron de `CarteVivant`
  (`EcranSemestres.tsx:85`) : nom, plage, nombre de semaines pédagogiques, barre de progression
  pour celui en cours, écart « générées / prévues » et son bouton « Générer les semaines ».
  **Ils ne s'éditent plus directement** — on change les dates de l'année.
- **une action serveur unique** `enregistrerAnnee({ rentree, finS1, finAnnee })` qui crée **ou**
  met à jour les deux lignes : `S1 = [rentrée, fin S1]`, `S2 = [lendemain de fin S1, fin d'année]`.
  Noms par défaut « Semestre 1 » / « Semestre 2 », **et un nom déjà saisi ne se réécrit pas**.
- **l'onglet « Archives »** survit tel quel — il groupe déjà par année scolaire
  (`EcranSemestres.tsx:260-266`) et c'est exactement la maille de ce lot. « Archiver » et
  « Restaurer » portent désormais sur **l'année** (les deux semestres ensemble) ; la suppression
  garde ses vérifications de rattachement (`actions.ts:123-155`), et refuse l'année entière dès
  qu'**un** des deux semestres est utilisé.

### 3. Les bornes sont calées sur la semaine calendaire

Décision de Louis : **l'app cale, et montre ce qu'elle a retenu.** Une fonction **pure**, dans
`utils/calendrier-grille.ts` à côté de `lundiOnOrBefore`, testée dans
`utils/calendrier-semaines.test.ts` :

```
calerAnnee(rentree, finS1, finAnnee) → { s1: {start, end}, s2: {start, end} }
  s1.start = lundi de la semaine de `rentree`        (lundiOnOrBefore)
  s1.end   = dimanche de la semaine de `finS1`       (lundiOnOrBefore + 6)
  s2.start = s1.end + 1 jour                          (donc un lundi)
  s2.end   = dimanche de la semaine de `finAnnee`
```

L'écran affiche les dates retenues sous le formulaire (« Semestre 1 : lundi 31 août → dimanche
24 janvier ») **avant** l'enregistrement, pour que le décalage se voie. *Sans ce calage, une fin de
S1 un mercredi donne une semaine calendaire à cheval : `calculerGrilleSemaines` la compte dans les
deux semestres et `synchroniserSemaines`, qui réconcilie par `semestre_id` + `date_debut`
(`actions.ts:314`), crée **deux lignes** `fragments_semaines` pour le même lundi — deux numéros,
deux échéances, sur la même semaine réelle.*

Refus à la saisie : dates manquantes, `finS1 < rentree`, `finAnnee < finS1`, et **une année qui
enjambe la frontière du 1er août** (`utils/frise-enseignement.ts:51` : l'année scolaire va du
1er août au 31 juillet ; une année à cheval ferait tomber les deux semestres dans deux AY et
casserait la frise du parcours, qui filtre par AY — `parcours/frise-serveur.ts:36-45`).

### 4. Le semestre actif se déduit de la date du jour

Décision de Louis : plus de bouton « Définir actif ». `is_active` reste une colonne matérialisée
— trop de lecteurs font `.eq('is_active', true)` pour qu'on la remplace en un lot — mais **elle
n'est plus saisie, elle est calculée**. Fonction **pure**, testée :

```
semestreActifAttendu(semestresVivants, aujourdhui) =
  1. celui dont start_date ≤ aujourd'hui ≤ end_date ;
  2. sinon le prochain à commencer (plus petit start_date > aujourd'hui) ;
  3. sinon le dernier terminé (plus grand end_date < aujourd'hui) ;
  4. sinon aucun.
```

*La règle 2 est celle qui compte à l'usage : elle rend le S1 de la rentrée actif dès sa saisie en
août, sans que le professeur ait à y revenir le jour J.*

Puis **une** fonction de matérialisation, idempotente et silencieuse, qui n'écrit **que** si le
drapeau en base diffère de l'attendu. Trois contraintes :

- « aujourd'hui » se lit dans le fuseau de l'école (`jourDansFuseau(new Date(), await lireFuseau())`,
  patron de `config/page.tsx:142`) — jamais `new Date()` local, jamais UTC brut.
- l'écriture passe par `createAdminClient()` (`utils/supabase/admin.ts`) : la policy `semesters` est
  prof-only (`calendrier_c1a.sql` §4) et la bascule doit avoir lieu même si c'est un **élève** qui
  ouvre l'app le premier ce matin-là.
- **le point d'appel se choisit, il ne se multiplie pas** : un seul endroit traversé par tout le
  monde (les layouts `app/prof/layout.tsx` et `app/eleve/layout.tsx` sont les candidats), et le
  coût d'une lecture par navigation doit être mesuré et dit en PR. Si le compte n'y est pas,
  proposer l'alternative en PR plutôt que de semer l'appel dans quinze pages.

### 5. L'existant est adopté, jamais recréé

La base porte déjà des semestres — **deux coexistent en sandbox** (entrée d'`IDEES_post_rentree.md`
« Le graphique "Ton parcours" de l'élève n'est pas scopé au semestre », constat C8·L3) — et un élève pilote y
travaille. Au chargement, l'écran cherche les semestres **vivants** (`archived_at is null`) dont
l'année scolaire est celle du jour :

| ce qu'il trouve | ce qu'il fait |
|---|---|
| **2** | pré-remplit les trois dates depuis leurs bornes (`rentree = S1.start`, `finS1 = S1.end`, `finAnnee = S2.end`) |
| **1** | pré-remplit rentrée et fin du S1 depuis lui, laisse la fin d'année vide — l'enregistrement **met à jour cette ligne** et crée l'autre |
| **0** | formulaire vide |
| **3 ou plus** | **n'écrit rien** : affiche la liste et demande d'archiver les surnuméraires. *Cas anormal, mais silencieux si on ne le regarde pas.* |

Aucune ligne n'est supprimée, aucun `id` ne change : les dépôts, quiz, plans et semaines déjà
rattachés survivent tels quels.

## Pièges

**P1 — La garde de chevauchement va se mordre la queue.** `chevauchementSemestre` (`actions.ts:30`)
est *fail-closed* et compare à tous les semestres vivants. Écrire S1 puis S2 quand l'année se
déplace crée un **état intermédiaire** où le nouveau S1 recouvre l'ancien S2 → refus. Passer une
**liste** d'ids à exclure (les deux semestres de l'année éditée), pas un seul. La garde doit
continuer de protéger contre les *autres* années : ne pas la désarmer.

**P2 — Les semaines se resynchronisent pour les DEUX semestres.** `synchroniserEnSilence`
(`actions.ts:460`) est appelée par semestre. Après un enregistrement d'année, elle tourne deux fois.
Elle est *best-effort* et n'échoue jamais bruyamment — d'où le compteur « générées / prévues » de
l'écran, qui doit rester visible pour les deux cartes.

**P3 — Déplacer les bornes produit des semaines « hors calendrier ».** `synchroniserSemaines` ne
supprime jamais une ligne (à raison : des dépôts y sont rattachés) et renvoie `horsCalendrier`
(`actions.ts:436`). Un recul de la rentrée peut en produire une poignée d'un coup. Le compteur doit
**apparaître** sur la carte du semestre concerné — l'entrée d'`IDEES_post_rentree.md`
« Les semaines hors calendrier sont comptées, jamais montrées » (constat C8·L1) note que ce chiffre ne vit
aujourd'hui que dans un message fugace. *Les montrer suffit ; les réparer est hors périmètre.*

**P4 — Renuméroter sous un dépôt déjà fait.** Entrée d'`IDEES_post_rentree.md` (constat C8·L1) : décaler
un semestre renumérote les semaines, et l'élève qui avait lu « Semaine 7 » lira « Semaine 6 ».
Aujourd'hui sans conséquence (les dates se saisissent avant la rentrée) ; l'écran Année rend le
déplacement **plus facile**, donc plus probable. Ne rien geler dans ce lot — mais **avertir avant
d'enregistrer** dès qu'un semestre de l'année porte au moins un dépôt.

**P5 — Les vacances appartiennent à un semestre, pas à l'année.** FK `holidays.semester_id`
(`calendrier_c1a.sql` §2) et contrainte « la période doit être comprise dans les dates du semestre »
(`actions.ts:218` et `:255`). Déplacer les bornes peut faire sortir une période existante de son
semestre. **Ne rien détruire.** Si la période tombe **entièrement** dans l'autre semestre de la même
année, la rattacher (changement de FK, rien de perdu) ; sinon la **signaler** sur l'écran Vacances,
et laisser le professeur trancher. Une période à cheval sur la frontière S1/S2 se signale, elle ne
se découpe pas toute seule.

**P6 — Deux définitions de l'année scolaire cohabitent.** `anneeScolaire()` (`config/page.tsx:16`,
rend « 2026-2027 ») et `anneeScolaireDe()` (`utils/frise-enseignement.ts:51`, rend `2026`). Même
frontière (août), deux implémentations. Ce lot en fait sa notion centrale : **n'en garder qu'une**
— celle d'`utils/`, testée (`frise-enseignement.test.ts:56`) — et dériver le libellé d'affichage.

**P7 — « Le premier semestre créé devient actif ».** Cette règle (`actions.ts:69-74`) et
`definirSemestreActif` (`actions.ts:114`) disparaissent avec le calcul de l'actif. Vérifier qu'aucun
autre appelant ne les utilise avant de les retirer, et retirer le bouton « Définir actif »
(`EcranSemestres.tsx:172`), pas seulement le masquer.

**P8 — La frise du parcours se porte mieux, mais elle regarde.** `friseEnseignementContinue`
(`utils/frise-enseignement.ts`) rend un `avisBloquant` sur chevauchement et tronque la dernière
semaine d'un semestre dont l'`end_date` n'est pas un dimanche (test `frise-enseignement.test.ts:200`).
Le calage du §3 éteint le second cas et le statut `a_definir` (« semestre de la même AY encore à
créer ») devient rare — **le vérifier**, ne pas le supposer : l'aperçu du plan d'évaluation
(`scriptorium/evaluations/plan-serveur.ts`) doit rester sans avis après enregistrement d'une année.

**P9 — `EcranVacances` refuse de s'afficher sans semestre** (« Crée d'abord un semestre »,
`EcranVacances.tsx:78`). Le message doit renvoyer vers **Année**.

**P10 — Ne pas reconduire le `confirm()` natif.** `EcranSemestres` est nommément dans la liste de
l'entrée transversale d'`IDEES_post_rentree.md` (« remplacer les `confirm()` natifs », quatre
morsures documentées, dont une demi-recette perdue le 13/08). L'écran étant réécrit, la suppression
d'une année se confirme **dans la page**, au patron
`app/prof/quazian/quizz/[quizId]/lancer/TableauLive.tsx` (commit `89625fc`) : dire ce
qui va partir, `catch` autour de l'action, erreur affichée en clair.

**P11 — Dates pures partout.** Tout est `YYYY-MM-DD` en régime UTC, comparaisons lexicales
(`utils/calendrier-grille.ts`, en-tête de `utils/frise-enseignement.ts`). La seule conversion en
instant est `date_limite` = `finDeJourDansFuseau(dimanche, tz)` (`actions.ts:398`) — et le test de
régression de l'item 7 est déjà écrit (`calendrier-semaines.test.ts:103`).

## Hors périmètre de ce lot

- **Plus de deux semestres** (trimestres, sessions d'été). Le modèle les permet, l'écran non. Toute
  demande dans ce sens → `IDEES_post_rentree.md`.
- **Réparer les semaines hors calendrier** (les montrer suffit), **geler le `numero` sous un dépôt**,
  **le taux de dépôt qui compte les semaines de vacances** : trois entrées d'`IDEES_post_rentree.md`
  que ce lot croise sans les traiter.
- **Recâbler les lecteurs de `is_active`** : ils continuent de lire la colonne.
- **La coexistence de deux années vivantes** (préparer 2027-2028 pendant 2026-2027) : l'écran
  travaille sur l'année scolaire du jour. À noter, pas à construire.

## Règles du dépôt (AGENTS.md — rappel)

- **Aucune migration n'est attendue** : le lot n'ajoute ni table ni colonne. Si une seule ligne de
  SQL devient nécessaire, elle suit le protocole — **lire `SUIVI_SQL.md` AVANT**, fichier `.sql` à
  la racine **+ ligne au journal avant exécution**, sandbox d'abord. Ne jamais rejouer un fichier
  de l'Archive.
- **Réparation et resserrement d'existant** : aucun flag nouveau attendu.
- **UI** : jetons de `globals.css`, jamais de hex en dur. Réutiliser `ChampDate`, `EnteteEcran`,
  `RailConfig` et le patron de carte existants — l'écran doit être reconnaissable.
- **Question de conception → noter en fin de session, ne pas trancher** (R7).

## Critère de sortie

`npm test` vert, dont **les nouveaux tests purs** : `calerAnnee` (rentrée un mercredi, fin de S1 un
mercredi, S2 qui démarre bien le lundi suivant, année d'une seule semaine) et `semestreActifAttendu`
(dans le S1, dans le S2, avant la rentrée, après la fin d'année, aucun semestre).

Puis en sandbox, dans Chrome (**pas** l'aperçu embarqué — règle d'or du `SUIVI_tests_manuels.md`) :

1. **Adoption** — ouvrir Année : les semestres déjà en base pré-remplissent les trois dates, aucune
   ligne créée, aucun `id` changé (le vérifier en base).
2. **Saisie** — trois dates non calées (un mercredi, un mardi, un jeudi) : l'écran montre les dates
   retenues, l'enregistrement crée/met à jour **deux** lignes, et **aucune** date de début de
   semaine n'est portée par deux lignes `fragments_semaines` (requête de contrôle en PR).
3. **Déplacement** — reculer la rentrée d'un mois : les deux semestres suivent, la numérotation se
   recale, l'avertissement « dépôts existants » paraît s'il y en a, le compteur « hors calendrier »
   s'affiche, et **aucune ligne n'est supprimée**.
4. **Actif** — le semestre en cours porte le drapeau ; en base, une seule ligne à `is_active = true`.
   La règle 2 se vérifie par le test pur, pas en bougeant l'horloge de la machine.
5. **Fragments vit** — le module affiche ses semaines, un dépôt élève passe (le smoke test de la
   règle 5 du `SUIVI_SQL.md` : connexion élève test + une soumission).
6. **Le parcours vit** — l'aperçu du plan d'évaluation d'une classe s'affiche sans avis bloquant.
7. **Vacances** — une période existante déplacée hors de son semestre est signalée ou rattachée,
   jamais perdue.

Reporter les tests au `SUIVI_tests_manuels.md` (nouvelle section « Calendrier · Année »). Commit +
merge si vert.
