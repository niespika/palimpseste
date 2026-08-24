# Les outils de recette

> ⚠️ **CE FICHIER NE COUVRE QUE C4-L5 ET LES DEUX OUTILS DE C4-L8 / C4-L8-bis.**
> Les recettes de **C4-L2, L3, L4, L6, L9, L10 (les six compétences) et L11**
> existent en fichiers ici et ne sont documentées **que par leur propre en-tête** :
> ouvre le `.mjs`, ses vingt premières lignes disent ce qu'il fait et ce qu'il sème.

## Ce que tout script de recette d'ici garantit — et l'exception qui n'en est pas une

**La règle du dossier** : un script **sème son décor et le retire**, dans le même
run, et la sandbox revient à son état d'avant — vérifié par requête, jamais supposé.
Deux scripts font exception et **séparent les deux gestes** :
`routeur-c4l2-decor.mjs` (`--seme` | `--retire`, l'un des deux obligatoire) et
`decor-c4l6.mjs` (six gestes, dont `--etat` et `--retire`).

⛔ **`--garde-le-decor` SAUTE LE NETTOYAGE, ET LE REJOUER SANS LUI NE RATTRAPE PAS.**
Deux scripts le portent — `deroule-c4l3.mjs` et `examens-c4l9.mjs` —, et le second le
dit en toutes lettres : *« pour nettoyer, rejouer ce script sans `--garde-le-decor`
ne suffira pas »*. C'est pourtant le mode dont une **traversée de bout en bout** a
besoin, puisqu'elle veut que le décor du maillon précédent tienne : **qui l'emploie
tient son propre registre de ce qu'il laisse, et le retire à la clôture.**
⚠️ *Et ne prends pas pour un nettoyage le fait que `deroule-c4l3.mjs` remette les
interrupteurs comme trouvés **même** avec `--garde-le-decor` : il rend les portes,
pas les lignes.*

## C4-L5 — la chaîne de mesure

    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
         --import ./scripts/register-calibration-resolver.mjs \
         scripts/recette/chaine-c4l5.mjs [--sans-appel]

Il appelle **le même code que la route** — la file, la chaîne, la facture, le
Monitoring — et éprouve en base ce qu'aucun test pur ne prouve : la clé
d'idempotence, le **bail** et une **expiration provoquée**, une reprise qui
n'écrit pas de seconde mesure, un passage réel (l'étage du Monitoring), le
journal par appel avec sa `phase`, et la coupure automatique. Il **sème son
décor et le retire** : la sandbox revient à son état d'avant, vérifié par
requête. `--sans-appel` saute la seule partie qui dépense.

## Les deux outils de recette de C4-L8

Ils appellent **le même code que les écrans** — le parseur de fiche et l'écrivain
d'import — avec le client admin, pour prouver en base ce que l'écran fait à la
main. Ils ne remplacent pas la recette à l'écran : ils la doublent par requête.

    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
         --import ./scripts/register-ts-resolver.mjs \
         scripts/recette/deposer-fiches.mjs

    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
         --import ./scripts/register-ts-resolver.mjs \
         scripts/recette/deposer-import.mjs <chemin-du-fichier.json>

`deposer-fiches.mjs` lit les sept fiches de `competences/` dans l'autre dépôt et
les dépose ; `deposer-import.mjs` dépose un fichier d'import et imprime le
verdict — refus, blocages, signalements, comptes entrés / refusés / bloqués /
ignorés.

### Le fichier d'import de la recette C4L8-1

`recette_c4l8_materiau_codex.json` — **un seul matériau `genere`**, celui qui a
servi à jouer la porte Codex de bout en bout le 21/08
(`SUIVI_tests_manuels.md` § C4 · L8, C4L8-1) : `mat-lien-codex-0001`,
`argument` × `composer`, support `extrait`, famille « le lien manque ».
Il est **idempotent** — redéposé, son `id` est reconnu et l'entrée est ignorée,
le compte des ignorées s'affiche banque par banque.

    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
         --import ./scripts/register-ts-resolver.mjs \
         scripts/recette/deposer-import.mjs \
         scripts/recette/recette_c4l8_materiau_codex.json

⚠️ Le déposer ne suffit pas à le rendre servable : il entre `a_valider` et se
**valide en file**, à l'écran du corpus. Et son `observable` (`lien_explicite` ·
argumentation) est une **propriété du matériau**, pas la cible de l'instance :
celle-ci vient de la route, à la conception.

## Le fichier d'import de la recette C4-L8-bis

`recette_c4l8bis_partie_routee.json` — **le fichier qui prouve le refus n° 15**,
et sa disparition. Il porte **un matériau** et **une instance** sur `partie` ×
`composer` au **cran 3**, avec un `observable_isole` **réellement routé** :
`garant_present` · argumentation (`SUIVI_tests_manuels.md` § C4 · L8-bis,
L8bis-11).

**Ce qu'il éprouve, et pourquoi il ne s'éprouve que par un dépôt.** `partie`
était l'un des **sept objets aveugles** de C4-L8-bis : la doctrine étant lue
tronquée à mille lignes, aucune de ses 594 routes ne revenait, et le contrôle
d'import **refusait** cette instance —

    [R15] exercice ex-l8bis-partie-composer-03-garant_present-0001 :
    l'observable `garant_present` (argumentation) n'est routé ni pour
    `partie`, ni pour `composer` (`04-`)

— alors que la route **existe en base**. Depuis que la lecture se pagine, le même
fichier **entre** : `verdict : IMPORTABLE`. ⚠️ **C'est le seul chemin qui prouve
ce contrôle** : il lit la doctrine par une porte que rien ne relie à l'écran de
conception, et une lecture ne le montre pas — **il faut déposer**.

    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
         --import ./scripts/register-ts-resolver.mjs \
         scripts/recette/deposer-import.mjs \
         scripts/recette/recette_c4l8bis_partie_routee.json

Il est **idempotent** : redéposé, ses deux `id` sont reconnus et les deux entrées
sont ignorées — rien n'entre, rien n'est refusé.

Reste **un signalement, et il est légitime** : *famille « le garant manque »
(partie) : un seul membre — aucune paire ne pourra s'y faire*. Le fichier ne
porte qu'un matériau ; **un cran de diagnostic en exigerait deux**, le cran 3
n'en demande qu'un.

⚠️ Comme celui de C4L8-1, le déposer ne le rend pas servable : le matériau entre
`a_valider` et se **valide en file** à l'écran du corpus ; l'exercice entre
`a_concevoir` et se valide de même. Et son observable **vient de la route**, pas
du fichier — celui-ci ne fait que le nommer, et le contrôle vérifie qu'il est
routé.
