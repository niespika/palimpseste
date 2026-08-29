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

## C4-L7 — la traversée du flux, de bout en bout

    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
         --import ./scripts/register-calibration-resolver.mjs \
         scripts/recette/traversee-c4l7.mjs [--classe] [--maison] [--routeur] \
                                            [--reprise] [--route] \
                                            [--sans-appel] [--garde-le-decor] \
                                            [--retire]

**Ce n'est pas la recette d'un lot qui construit** : C4-L7 ne construit rien, il éprouve **la
couture** — ce qu'aucun lot ne peut voir seul, parce que chacun s'arrête à sa frontière et que le
trou est *entre* eux. Le script n'appelle **que le code des écrans**, avec le client admin.

**Sans drapeau de section, seul l'état d'entrée est lu** — les six interrupteurs, les sept statuts
de recette, `routeur_decisions`, et le compte des lettres. C'est un constat gratuit et sans effet.

| Drapeau | Ce qu'il traverse |
|---|---|
| `--classe` | un **examen diagnostique conçu** → passation → transcription → lot → chaîne → **l'ANCRE** (`lieu = classe`, `forme = sommatif`) → correction → publication → **lecture** |
| `--maison` | instance conçue → assignation → déroulé → **les trois gestes de la remise** → remise → chaîne → mesure et lettre-équivalente → version finale → **deux squelettes** → retour final → `delta_v1_vf` NULL **avec son alerte** |
| `--routeur` | le constat **par différence** : ce que la voie du professeur ne produit pas, et le motif nommé en deux parts |
| `--reprise` | un job **tué après P1**, réclamé au bail expiré, chaîne rejouée entière — *un* squelette, *une* mesure au bout (`C4L5-3`) |
| `--route` | les **trois portes** de `/api/chaine` et son compteur `{reclames, traites, tuesEnVol}` (`C4L11-B`) |

⚠️ **`--sans-appel` d'abord.** Il saute tout ce qui dépense : la structure, les gardes et les états
s'éprouvent entièrement sans un appel de modèle. On ne dépense qu'ensuite.

⭐ **`--garde-le-decor` ÉCRIT SON REGISTRE**, dans `.traversee-c4l7-registre.json`, et `--retire` le
consomme. C'est la réponse à la règle du dossier — *« qui l'emploie tient son propre registre de ce
qu'il laisse, et le retire à la clôture »* — et c'est la seule façon de retirer un décor gardé, qui
par définition survit au processus qui l'a semé.

⚠️ **Les interrupteurs sont ouverts NOMMÉMENT, un par un, pour la durée d'un contrôle**, et remis
comme trouvés **y compris sur interruption** (`finally`). `chaine_actif` vit dans la base partagée
où `/api/chaine` tourne à la minute : on l'ouvre pour un traitement, et on le referme.

⚠️⚠️ **L'ORDRE DU NETTOYAGE, ET IL A COÛTÉ TROIS MESURES ORPHELINES.**
`competences_mesures.depot_id` est en **`on delete set null`** : supprimer un dépôt **sans supprimer
ses enfants d'abord** laisse des mesures sans dépôt, **invisibles à tout contrôle qui compte par
dépôt**. Le script supprime donc, pour chaque dépôt : `competences_mesures`, `exercices_squelettes`,
`exercices_retours`, `exercices_jobs`, `exercices_metacognition`, **puis** le dépôt.

⭐ **Toute lecture passe par `lu(nom, { data, error })`, qui LÈVE sur `error`** — *« `supabase-js` ne
lève pas : un `select` d'une colonne absente rend `{data: null, error}`, et `(data ?? []).length`
rend alors zéro, qui ressemble à une mesure »*. Six contrôles ont déjà rougi pour l'avoir ignoré.

## Le décor d'écran du profil d'Élo — `decor-eleve-elo.mjs`

    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
         --import ./scripts/register-calibration-resolver.mjs \
         scripts/recette/decor-eleve-elo.mjs [--seme|--etat|--retire]

⛔ **Ce n'est PAS une recette** : il n'éprouve rien et ne rend aucun verdict. Il
sème un élève crédible **et s'arrête là**, pour qu'on puisse travailler l'UI
élève — l'affichage des compétences et la passation des exercices — avec de la
matière dedans. **Il ne se nettoie pas tout seul : `--retire`.**

Ce qu'il pose sur **Élo** (`test@test.com`), classe **T5** : les deux examens
diagnostiques menés jusqu'à `retour_publie` *(copies, transcriptions, jobs,
retours — l'un lu, l'autre non)*, **quatre exercices de la maison dans les
quatre états** que la liste sait rendre, **13 mesures dont 5 ancres**, et les
**lettres** *(4 des 6 compétences ; `connaissance` et `questionnement` n'ont
aucune ancre, donc aucune lettre — c'est la règle du `01-` §9, pas un trou)*.

⭐ **Deux choses qu'il fait et qui valent pour les suivants.**
**(1) Les observables se DÉRIVENT de l'instrument** : le script n'écrit aucun
seuil, il lit `instrumentDuRouteur(c)` et fabrique, pour chaque observable, une
valeur qui réussit ou rate *son* seuil du jour — un changement de fiche ne
périme pas le décor. **(2) Les dépôts se retrouvent SANS le registre**, alors
qu'`exercices_depots` n'a aucune colonne texte libre : par le `depot_id` des
mesures / retours / jobs marqués, **et** par le couple *(Élo × les quatre
instances)*, qui sont des constantes du fichier — le contrôle d'entrée refusant
de semer si l'une porte déjà un dépôt d'Élo, le couple est univoque. ⛔ Aucun
champ porteur de sens n'est détourné en drapeau de provenance.

⚠️ **La seule chose que la marque ne sait pas rendre** : l'**état d'avant** des
deux examens *(ils préexistent, on les MODIFIE)*. Il ne vit qu'au registre
`.decor-eleve-elo.json`. Sans lui, `--retire` retire tout le semé, **laisse les
deux examens décorés**, et imprime la liste exacte des colonnes à remettre.

⚠️ **Il ne touche AUCUN interrupteur** : il les mesure et **refuse** si l'un des
trois nécessaires *(`exercices_actif`, `passation_classe_actif`,
`competences_affichage_actif`)* est fermé. Un décor destiné à rester à l'écran
ne peut pas emprunter une porte : il la rendrait fermée en partant.

---

## `reparation-etats-c4l12-24.mjs` — la réparation des états perdus (`C4L12-25`)

⛔ **Ce n'est pas une recette** : il ne sème rien, ne monte aucun décor, n'a rien
à retirer. Il **rejoue `ecrireLEtatApresMesure`**, le chemin de production, sur
des mesures **déjà en base** — *rien ne s'invente, et aucun `upsert` n'est écrit
à la main*.

```
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
     --import ./scripts/register-calibration-resolver.mjs \
     scripts/recette/reparation-etats-c4l12-24.mjs --base=sandbox|prod [--repare] [--oui-la-prod]
```

**Quatre gardes.** `--base` **obligatoire, sans défaut** *(un défaut de paramètre
est ce qui écrit dans la mauvaise base)* · **constat par défaut**, `--repare`
pour écrire · écrire en prod exige **`--oui-la-prod` en plus** · et le **registre
horodaté de l'état AVANT** part sur le disque *(gitignoré — il porte des
identifiants d'élèves)* **avant** la moindre écriture.

⭐ **La cible se dérive, et elle est resserrée.** Une paire (élève × compétence)
est *suspecte* si elle porte une mesure et que sa ligne de niveau **manque** ou
est **plus vieille** que la dernière mesure. ⛔ Mais « plus vieille » ne prouve
rien seul : **une mesure semée par un décor n'appelle jamais l'écrivain**, son
retard est légitime, et la réparer fabriquerait une lettre depuis un décor
*(constaté au bac à sable le 29/08)*. Le discriminant est **la signature du
défaut** — une charge perdue emporte, pour un même élève, une compétence
**neuve** *(ligne absente)* **et** une **déjà lettrée** *(ligne périmée)*. On ne
répare donc que les élèves portant **au moins une ligne absente** ; les autres
sont **écartés ET NOMMÉS** à la sortie.

**Idempotent** : un second passage rend *« aucune réparation à faire »*.
**Joué en production le 29/08** — 13 élèves, 26 lettres, 0 erreur.

## `epreuve-reparation-c4l12-25.mjs` — l'épreuve du précédent

⛔ **Bac à sable uniquement**, aucun chemin vers la production. `--seme` /
`--retire`.

Il existe parce que le script de réparation **sélectionne, journalise et
contrôle** au bac à sable, mais que **sa boucle d'écriture n'y a rien à faire** :
aucun élève du bac à sable ne porte la signature du défaut. *Un correctif dont le
chemin d'écriture n'a jamais tourné n'est pas éprouvé.*

Il pose la signature exacte sur un élève choisi **inerte** *(0 mesure,
0 escalade, 0 montée — vérifié au semis, et il s'arrête si ce n'est plus vrai)*,
et **jamais sur l'élève `89662514`**, qui porte le décor d'une autre séance.

⚠️ **Deux choses qu'il FABRIQUE, et qu'il faut savoir** : *(1)* la **compétence
déjà lettrée** — hors du décor voisin, le bac à sable ne porte aucune ligne avec
`lettre_initiale` ; *(2)* ses deux mesures sont **`classe` + `sommatif`**, donc
des **ancres**, comme les treize de la production — sans ancre, une compétence
sans lettre n'en recevrait aucune et le décor n'éprouverait rien.

⭐ **Le retrait passe par un registre sur le disque**, écrit avant le premier
geste et rendu **ligne par ligne**, avec comparaison de l'état après. Le registre
**meurt avec un `--retire` réussi** ; s'il échoue, il reste, et le message le dit.
