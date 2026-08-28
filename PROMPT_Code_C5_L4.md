# PROMPT — Session Code : C5-L4 — Les onglets de la lecture

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5. Ce que le lot construit, son manifeste et son « fait quand » font foi au `07-Implementation.md` §2 — ils sont recopiés ci-dessous avec **leurs versions au moment de l'écriture**.
>
> ⭐ **Ton lot est le jumeau de `C4-L6`, joué le 22/08 sur Codex** — même geste, même critère *(« un écran sans porte n'existe pas »)*, mêmes trois composants de navigation, **mêmes tentations**. ⛔ **Tu n'as ni son prompt ni son relevé à lire** : un relevé ne fait pas partie des six pièces de la recette, et **la règle de manifeste interdit à une session Code d'aller en chercher un** ; ce qui de C4-L6 t'était utile est **dans ce prompt**, et le reste est **dans le code, commenté** — `utils/codex-onglets/` *(les deux listes et les trois règles, avec leurs motifs)* et les commentaires de `components/nav/configModules.ts`. **Ce prompt ne recopie pas C4-L6 : il dit ce qui diffère, et ce qui diffère est réel.**

---

## ⭐⭐ CE QUI A ÉTÉ TRANCHÉ AVANT TOI — ne le rouvre pas

**Ton entrée au `07-` §2 était, jusqu'à la fabrication de ce prompt, une phrase de onze mots : *« Exercices, Livres et Paramètres, côté professeur et côté élève. »* Sans manifeste, sans « fait quand ».** Or **trois des six pièces de la recette s'y recopient** — c'est exactement ce qui était arrivé à `C4-L8-bis` et à `C4-L6`. **L'entrée a donc été complétée d'abord**, et le `07-` passe en **2.58**. Deux points ont demandé un arbitrage, et **Louis les a rendus le 27/08** :

| | La question | La réponse de Louis, 27/08 |
|---|---|---|
| **①** | **L'ordre des onglets** — et d'abord la **face élève**, où « Paramètres » n'existe dans aucun module | ⭐ **L'onglet qui garde la RACINE vient en tête, des deux côtés** : **Livres · Exercices · Paramètres** au professeur, **Livres · Exercices · Examens** à l'élève. *(La phrase d'ouverture de l'entrée — « Exercices, Livres et Paramètres » — nommait l'inventaire, pas l'ordre.)* |
| **②** | **Le déménagement de `app/prof/conception/`** dans l'atelier de son mode, en boîte pour toi depuis le 22/08 | ⛔ **Non — un renvoi, comme Codex.** *« Ça va me demander un peu plus de réflexion, donc pour le moment on fait juste un renvoi. Je verrai plus tard comment je veux vraiment organiser tout ça. »* |

⭐ **Et ta boîte aux lettres a été vidée dans ce prompt** *(`PLAN_DE_CHANTIER.md` §5)* — **quatre items**, tous entrés en piège ou au manifeste : les trois écrans orphelins d'Aletheia *(§D)*, le déménagement reporté *(piège 2)*, ce que `C5-L2` a changé sous tes pieds *(§D et §G)*, et **le motif de la porte de mode qui n'atteint pas l'écran sur le chemin heureux** *(§H)*. **Tu n'as pas de relevé à aller lire** : la règle de manifeste te l'interdit, et tout ce qui t'était adressé est ici.

---

## Le manifeste — recopié du `07-Implementation.md` §2

> *Manifeste* : **ce document, §1 et §5** · `01-routeur.md` §2 et §10 — **relu et validé**, le **périmètre modulaire** *(ce qu'Aletheia porte de chaque côté, et le point d'entrée du cycle)* et les **ancres**, dont l'explication de texte de la semaine 1 · `02-exercices.md` §6 A, B, C et D · `06-Palimpseste.md` §1 et §5.

« Ce document » est le `07-Implementation.md`. **Quatre pièces, et rien de plus.**

| Pièce | Où | Statut requis | Au moment de l'écriture |
|---|---|---|---|
| `07-Implementation.md`, **§1 et §5** | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | aucun — un lot n'exige pas un statut de la source qui le déclare *(`07-` §2)* | **VERSION 2.58** · RELU ET VALIDÉ · **le §1 et le §5 sont OUVERTS À L'IMPLÉMENTATION**, ainsi que l'inventaire des lots du §2 |
| `01-routeur.md`, **§2 et §10** | même dépôt | **relu et validé** *(explicite au manifeste)* | **VERSION 5.7** · VALIDÉ ET GELÉ |
| `02-exercices.md`, **§6 A, B, C et D** | même dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | **VERSION 5.6** · VALIDÉ ET GELÉ |
| `06-Palimpseste.md`, **§1 et §5** | même dépôt | **déposé** *(entrée sans statut explicite)* | **VERSION 2.6** · VALIDÉ ET GELÉ |

⚠️ **Ce qui n'est PAS au manifeste, et le motif compte.** Le **chemin du livre** — les fiches de lecture par séance, le capstone, le diagnostic de compréhension — n'a d'autre domicile que le **code** et les `SPEC_Aletheia_*.md` du dépôt `palimpseste`. **Ils ne sont pas au manifeste parce que tu ne changes aucune règle qu'ils gouvernent** : tu ranges cette face sous un onglet, tu ne touches pas à ce qu'elle fait. *La règle de manifeste veut que ce qui n'y figure pas ne se lise pas — ici, elle t'épargne une lecture de deux mille lignes qui ne t'apprendrait rien sur ton lot.*

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

> **Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, cumulatifs ; « VALIDÉ ET GELÉ » vaut *relu et validé*.
>
> **La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ici, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.
>
> **Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot.

Concrètement : vérifie que les quatre pièces **existent**, que le `07-` porte **VERSION 2.58**, le `01-` **5.7**, le `02-` **5.6** et le `06-` **2.6**, et que le `01-` vaut au moins *relu et validé*. **La clause granulaire n'a ici aucun objet** : ce manifeste ne compte **aucune fiche de compétence**, et ce lot ne mesure rien.

### Tes trois dépendances sont jouées, poussées, et en production

*(`PLAN_DE_CHANTIER.md` §3 : « C5-L4 — les onglets de la lecture | C5-L1 · C5-L2 · C5-L3 | idem C4-L6 ».)* **Vérifie chacune par son chemin, pas par sa ligne au plan :**

- **C5-L1** — la conception côté professeur : `utils/generateur/`, `app/prof/conception/reference/[id]/`, `app/prof/conception/textes/`. *Joué le 26/08, `774ba34`. Aucune migration.*
- **C5-L2** — la passation de lecture côté élève : `app/eleve/modules/aletheia/exercice/[depotId]/`, `app/deroule/PageDuDeroule.tsx`, et l'option `atelier` de `lireDepotMaison` *(`utils/deroule/depot.ts:169`)*. *Joué le 27/08, `36aabdf` + `e4d1dc2`. Aucune migration.*
- **C5-L3** — les mesures en réception : la porte de mode dans `utils/chaine/chaine.ts` *(`competencesDeLExercice`, `motifDesEcartees`)*, et `scripts/recette/reception-c5l3.mjs`. *Joué le 27/08, `c738aee`. Aucune migration.*

**Et deux lots dont tu ouvres les portes sans les toucher** : **C4-L4** *(la passation en classe — `utils/passation/`, `components/passation/EcranProf` et `EcranEleve`)* et **C4-L9** *(la conception des examens diagnostiques — `components/examens/EncartAConcevoir`, `SignalDeLancement`, `utils/examens/`)*. **Si l'un de ces chemins manque, arrête-toi et signale-le, ne devine pas** — un onglet qui pointe vers un écran absent est pire que pas d'onglet.

### Quatre contrôles machine à jouer AVANT d'écrire une ligne

1. `npm test` — **il doit être vert avant que tu commences**, sinon tu ne sauras pas ce que tu as cassé. *(`utils/codex-onglets/onglets.test.ts` et `regles.test.ts` couvrent déjà `hrefDuDeroule`, `atelierDUnFormatif` et `visibleDansLaClasse`.)*
2. `npx tsc --noEmit` — même motif.
3. **L'inventaire des routes**, à faire à la main et à écrire au relevé : `find app/prof/aletheia app/eleve/modules/aletheia -name page.tsx`. **Tu dois retrouver, de chaque côté, CINQ pages et un layout** *(vérifié le 27/08)* — soit **dix routes en tout**, avant les tiennes. Un écart veut dire qu'un lot a bougé sous toi : lis-le avant de continuer.
4. **L'état des six interrupteurs**, par requête sur `scriptorium_params`. ⚠️ **`C5-L2` les a trouvés à ON en bac à sable ET EN PROD le 27/08**, quand le `07-` §5 les dit « à OFF jusqu'à la recette ». **C'est un constat d'état, déjà relevé et non réparé** : tes onglets seront donc visibles et pleins dès la première seconde. **Tu n'en allumes ni n'en éteins aucun**, et tu remets le tien comme tu l'as trouvé.

### Ce que tu peux écrire dans une source, et ce que tu ne peux pas

- **Le `07-` §1, le `07-` §5 et l'inventaire des lots du `07-` §2 sont ouverts à l'implémentation** : ce que la construction fait apparaître **s'y écrit depuis ton relevé, sans accord préalable**. ⚠️ **Le §3, le §4, le §6 et la règle de manifeste du §2 sont GELÉS.**
- **Partout ailleurs, une session Code ne corrige jamais une source** *(`07-` §2)*. Une source **fausse** — pas incomplète, fausse — reçoit **`[faux]`** au point de l'erreur, et une ligne à la section **DETTES** du `INVENTAIRE_Non_Tranches.md`, avec l'avant et l'après. **La prochaine dette est `D10`** *(D9 a été posée par C5-L3 le 27/08)*.

---

## La mission — reprise du `07-Implementation.md` §2

> **C5-L4 — Les onglets de la lecture.** **Aletheia prend trois onglets de chaque côté, et ce ne sont pas les mêmes.**
>
> Côté **professeur** : **Livres** — ce que l'onglet « Classe » porte aujourd'hui : les classes, l'avancée par livre, la trajectoire diagnostique, le détail d'un élève —, **Exercices** — *tout ce qui touche un exercice de lecture vit sous un seul onglet* : le renvoi à la conception, le dépôt d'un texte et la validation de sa **référence décomposée**, les **passations en classe**, les **examens diagnostiques à concevoir** — et **Paramètres**, tel quel.
>
> Côté **élève** : **Livres**, sa séance de lecture, **Exercices**, ce qu'il travaille à la maison, et **Examens**, où vit la passation en classe. ⭐ **Livres vient en tête et garde la racine du module, des DEUX côtés** *(décision de Louis, 27/08)* — **l'onglet qui garde la racine vient en tête**. *Le partage de cette face est celui du `06-Palimpseste.md` §1 — « lecture formative, à la maison » d'un côté, « lecture diagnostique, en classe » de l'autre —, et l'onglet Livres est ce que le `01-routeur.md` §2 appelle, côté élève, « un lieu, hors du cycle ».*
>
> **Et c'est le lot qui ouvre les portes d'Aletheia.** Comme Codex avant lui, chaque lot y a posé ses écrans **sans les rattacher**, sur consigne. *Un écran sans porte n'existe pas.*
>
> **Une clause qui ne vient pas de la navigation** : sur une copie dont le traitement a **abouti**, l'écran de la passation **ne dit pas** qu'une compétence a été **écartée** par la porte de mode de `C5-L3`. Le motif est déjà en base ; il n'y a rien à recalculer.
>
> *Ce lot ne construit ni le déroulé (`C4-L3`), ni le flux de passation (`C4-L4`), ni la conception d'un examen (`C4-L9`), ni la conception d'un exercice de lecture (`C5-L1`), ni sa passation (`C5-L2`), ni les mesures en réception (`C5-L3`) : il les **range** et les rend **atteignables**.*

**Et rien d'autre.** Ce lot est **une réorganisation de navigation, l'ouverture des portes qu'elle rend possible, et une phrase d'écran qui manquait**. Il ne change **aucune règle métier**, n'écrit **aucune mesure**, ne pose **aucun interrupteur**, et n'a **aucune migration attendue**. La réussite se mesure autant à ce qui **bouge** — deux barres d'onglets, trois écrans enfin atteignables — qu'à ce qui **ne bouge pas** : `utils/deroule/`, `utils/passation/` *(hors la phrase du §H)*, `utils/chaine/`, `utils/examens/`, `utils/generateur/` et **tout le chemin du livre** doivent sortir de ce lot **inchangés**, ou l'écart se justifie ligne par ligne au relevé.

---

## Les pièges — les décisions dont l'oubli coûte une session

*Les renvois nomment leur document ; « §1 », « §5 » nus pointent au `07-Implementation.md`. En cas de doute entre ce prompt et la source : **la source a raison**. Les chemins et les numéros de ligne sont datés du **27/08** — vérifie-les, ne les crois pas.*

### A. Les frontières — ce que ce lot ne construit pas

1. ⛔ **Tu ne construis aucun tableau de bord, et surtout pas « l'écran de la semaine ».** Le `01-` §2 est net : *« Le tableau de bord est le point d'entrée du cycle : le héros "à faire maintenant" et la liste compacte "ensuite cette semaine" »*. Cet écran-là est **C6-L2**. ⚠️ **Et le `02-` §6 C te tend le même piège d'un autre côté** : le **récapitulatif de semaine** *(les trois compétences travaillées, les forces)* et le **bilan de fin de semaine** y sont décrits — **ils appartiennent au routeur, pas à ton onglet**. Ton onglet Exercices élève est **une liste et une porte**.
2. ⛔ **Tu ne déménages pas `app/prof/conception/` — décision de Louis, 27/08 :** *« ça va me demander un peu plus de réflexion, donc pour le moment on fait juste un renvoi »*. **Ton onglet Exercices y renvoie par un lien**, exactement comme celui de Codex *(`app/prof/codex/page.tsx:176`)*. ⭐ **Et l'écran t'attend déjà** : `app/prof/conception/page.tsx` porte une section **« Les deux portes »**, avec `/prof/conception/nouvelle?porte=aletheia` et `?porte=codex`. ⚠️ *Le coût du déménagement, pour mémoire et pour que personne ne le retente en passant : **10 `revalidatePath`** sur des chemins Aletheia dans **6 fichiers**, `utils/integrite-preuve.ts:154`, `app/prof/corpus/page.tsx:237`, `components/examens/EcranConceptionExamen.tsx:102` et `:114`, et l'entrée « Conception » du Pilotage *(`components/nav/configNavigation.ts:37`)*. **Un `revalidatePath` sur un chemin mort ne lève aucune erreur** : l'écran reste périmé, et personne ne sait pourquoi.*
3. ⛔ **Tu ne touches à aucun onglet de Codex.** `C4-L6` est joué, clos et en production ; ses deux onglets de chaque côté sont **le résultat d'une décision de Louis**, pas un brouillon. **La symétrie ne se joue que dans un sens** : tu copies ses patrons, tu ne « corriges » pas ses choix.
4. ⛔ **Tu ne changes rien au chemin du livre.** `app/eleve/modules/aletheia/[livreId]/[semaine]`, `[livreId]/capstone`, `app/prof/aletheia/eleve/[eleveId]`, `donnees.ts`, `data.ts` : ils **déménagent sous un onglet ou restent où ils sont**, ils ne se réécrivent pas. *La règle de manifeste te l'interdit de toute façon : leurs spécifications ne sont pas dans ton manifeste.*
5. ⛔ **Aucune migration n'est attendue, et aucun septième interrupteur.** Le `07-` §5 l'écrit en toutes lettres : *« Aucun lot n'en crée un septième pour ses écrans. Un onglet, une liste, une porte ne sont pas des fonctionnalités à gater. »* Si une migration s'avérait nécessaire, interroge d'abord la nécessité — **une réorganisation de navigation qui demande une colonne a probablement dépassé son périmètre**.
6. ⛔ **Aucune lettre, aucune note, aucun pourcentage côté élève, dans aucun de tes trois onglets.** *« Côté élève, par défaut : sa trajectoire et sa cible. Pas de lettre »* *(`06-` §5)*, et *« rien ne s'affiche du profil tant que `profil_provisoire` est vrai »* *(`01-` §9)*. **Un onglet qui range des exercices n'est pas un endroit où l'on découvre son niveau.**
7. ⛔ **Tu ne construis pas de file de validation pour Aletheia.** `nombreAValiderCodex` *(`utils/codex-onglets/liste.ts`)* lit **`codex_travaux`**, qui est la **synthèse en classe de Codex** — il n'y a **aucun équivalent côté lecture**, et le retour d'un exercice de lecture est publié par la chaîne. **Ne fabrique pas une file qui n'existe pas** ; si tu conclus qu'il en manque une, **dis-le, ne la construis pas**.
8. ⛔ **Tu ne fabriques pas une « synthèse en classe » pour Aletheia.** Elle est une **écriture** *(`06-` §1)*, elle vit dans Codex, et **son nom est arrêté** : *« Son nom est "la synthèse en classe", et pas un autre »* *(`01-` §10)*. Ton onglet **Examens** élève ne porte que les **examens diagnostiques de lecture** — l'explication de texte de la semaine 1.

### B. La barre d'onglets — un domicile unique, et deux rendus

9. ⭐ **Les sous-onglets d'un module ont UN SEUL domicile : `components/nav/configModules.ts`.** **N'écris pas d'onglets dans `app/prof/aletheia/layout.tsx` ni dans `app/eleve/modules/aletheia/layout.tsx`** : les deux ne portent que `data-module="aletheia"` et `TuileAccentModule`, et c'est tout ce qu'ils doivent porter. *(Vérifié : douze lignes pour celui du professeur, six pour celui de l'élève.)*
10. ⚠️ **Deux composants rendent la même liste, et il faut les deux.** `components/nav/EnTeteSite.tsx` la rend en **Barre 2, `hidden sm:block`** *(desktop)* ; `components/nav/SousNavModuleMobile.tsx` la rend en **`sm:hidden`** *(mobile)*. Les deux lisent `sousOngletsPour(mod, role)`. **Un onglet ajouté à `configModules.ts` apparaît des deux côtés sans autre geste** — et un onglet écrit ailleurs n'apparaît qu'à moitié.
11. ⚠️ **`components/SousNavModule.tsx` — sans le préfixe `nav/` — est un TROISIÈME composant, et il n'est pas le tien.** Il ne sert qu'à `app/prof/calendrier/layout.tsx`. **Ne t'en sers pas, et ne le supprime pas.**
12. ⭐ **Le commentaire de l'interface te nomme déjà, et il devient faux avec ton lot.** `configModules.ts:73-77` écrit : *« Ce n'est plus "le cas de tous les modules sauf Scriptorium" : Quazian (C7·L2), Fragments (C8·L3) et Codex (C4-L6) en portent aussi. **Aujourd'hui, seul ALETHEIA n'en a pas — ses onglets sont C5-L4.** »* **Corrige-le au passage** : un commentaire faux dans le fichier qui fait foi coûte plus cher qu'un onglet mal placé.
13. ⭐ **Deux mécaniques d'activation existent, et elles ne se mélangent pas dans un même module.** Par la **route** *(`href` + `prefixes[]`, résolu par `ongletActifParRoute`)* — c'est ce qu'emploient **Aletheia**, Codex, Fragments prof et Quazian prof. Par le **paramètre `?vue=`** — c'est Scriptorium, Fragments élève, Quazian élève. **`SousNavModuleMobile` choisit l'une ou l'autre par `onglets.some(o => !!o.vue)`** : une liste qui mélange les deux se comporte de travers. ⭐ **Aletheia est piloté par la ROUTE aujourd'hui, et il doit le rester** — le motif est celui que C4-L6 a écrit pour Codex : *« `?vue=` est absent d'une route de détail, et `vueDefaut` allumerait « Exercices » au-dessus d'une passation en classe ».* Tes cinq écrans de détail *(`[livreId]/[semaine]`, `capstone`, `exercice/<id>`, `passation/<id>`, `examen-diagnostique/<id>`)* doivent allumer **leur** onglet.
14. ⭐ **Sans `prefixes[]`, un écran de détail allume le mauvais onglet** — et chez toi le risque est maximal, parce que **l'onglet racine matche tout par préfixe**. `ongletActifParRoute` *(`configModules.ts:316`)* prend **le plus long préfixe qui matche**, `href` et `prefixes` confondus, en comparant sur `href.split('?')[0]` avec `pathname === base || pathname.startsWith(base + '/')`. **Déclare les préfixes au complet, des deux côtés**, ou l'utilisateur voit l'onglet sauter en cliquant une ligne de sa propre liste.
15. ⛔ **Les couleurs de `configModules.ts` ne se dérivent PAS des jetons de `globals.css`, et c'est écrit à dessein** : *« l'en-tête a sa propre palette, on NE la dérive PAS des tokens CSS existants »*. **L'`AGENTS.md` dit « jamais de hex en dur » : ce fichier est l'exception, elle est documentée, et la « corriger » casserait la Barre 2 des cinq modules.** Partout ailleurs — tes pages, tes listes, tes tuiles — **la règle des jetons s'applique sans réserve**. *Le bloc `couleurs` d'Aletheia existe déjà et ne se touche pas.*
16. ⚠️ **« Un module = 2-3 onglets »** *(`AGENTS.md`)*. **Tu en poses trois de chaque côté, et c'est le plafond** — il n'y a pas de place pour un quatrième. **La tentation est de garder un onglet « Diagnostic »** pour la trajectoire E→A : c'est exactement ce que la mission refuse — elle vit **sous Livres**, avec ce qu'elle décrit.
17. ⚠️ **La face élève est vue sur un téléphone.** `SousNavModuleMobile` impose `min-h-[44px]` sur ses liens *(« cible tactile, l'élève est sur téléphone »)*. **Vérifie tes trois onglets à 375 px** — trois libellés tiennent moins bien que deux, et « Exercices » et « Examens » commencent par les deux mêmes lettres.

### C. ⚠️⚠️ LE PIÈGE PROPRE À ALETHEIA — un segment dynamique EST À LA RACINE du module élève

18. ⚠️⚠️ **`app/eleve/modules/aletheia/[livreId]/` est au même niveau que `exercice/`, `passation/` et tes routes neuves.** Codex n'a pas ce problème : ses routes filles sont toutes des dossiers nommés. **Deux conséquences, et aucune n'est théorique.**
    - **Côté résolution Next** : une route **statique** l'emporte sur une route **dynamique** de même niveau — `/eleve/modules/aletheia/exercices` servira ton dossier, pas `[livreId]`. **Vérifie-le au navigateur, pas au raisonnement**, et lis `node_modules/next/dist/docs/` avant d'écrire une route : *cette version de Next n'est pas celle de ton entraînement* (`AGENTS.md`).
    - **Côté onglets** : une séance de lecture est `/eleve/modules/aletheia/<uuid>/3`. **Aucun préfixe statique ne la décrit** — elle ne peut être servie que par le **plus court** préfixe, celui de la racine. C'est ce qui rend l'ordre de Louis *(Livres en tête, gardant la racine)* techniquement le plus sûr : **Livres attrape par défaut, et les deux autres onglets se déclarent par leurs préfixes.**
19. ⚠️ **Singulier / pluriel à un caractère près.** Le déroulé est `/eleve/modules/aletheia/exercice/[depotId]` — **au singulier**, posé par C5-L2, et **il ne bouge pas**. Si ton onglet s'appelle `/eleve/modules/aletheia/exercices` — **au pluriel** —, les deux chaînes sont à une lettre l'une de l'autre. ⭐ **`ongletActifParRoute` s'en sort** — `===` est faux et `startsWith(base + '/')` aussi, dans les deux sens *(vérifié à la main)* — **mais un humain qui relit le fichier ne s'en sort pas.** Écris le commentaire qui le dit, ou choisis deux noms qui ne se ressemblent pas.
20. ⚠️ **Dix `revalidatePath` visent des chemins Aletheia, dans six fichiers** — `app/passation/actions.ts:47` et `:49` *(en `'layout'`)*, `app/deroule/actions.ts:48` *(`'layout'`)*, `app/eleve/modules/aletheia/actions.ts:49` et `:50`, `app/prof/aletheia/actions.ts:123` et `:203`, `app/prof/examens-diagnostiques/actions.ts:297`, `app/prof/scriptorium/actions.ts:1200` et `:1452`. ⭐ **Garder les racines aux onglets Livres est ce qui les laisse tous justes** : les trois `'layout'` couvrent alors le sous-arbre entier. **Toute route que tu déplaces doit être suivie là aussi.**

### D. Les portes à ouvrir — l'inventaire, vérifié le 27/08

21. 🔴 **`app/prof/aletheia/passation/[exerciceId]` — la passation en classe côté professeur — n'a qu'UN SEUL lien dans tout le dépôt** : `app/prof/conception/[id]/page.tsx:258`. **Ce lien reste** ; ton onglet Exercices en ajoute un second, depuis la liste. *Deux portes vers le même écran ne sont pas un doublon : ce sont deux chemins que le professeur emprunte à deux moments.*
22. 🔴 **`app/prof/aletheia/examen-diagnostique/[planifieId]` ne s'atteint que par `components/examens/EncartAConcevoir`** *(qui fabrique l'`href` à sa ligne 42)*, rendu aujourd'hui **en tête de `app/prof/aletheia/page.tsx`**. **Cet encart doit survivre à la réorganisation et se retrouver sous l'onglet Exercices** — c'est le *« le professeur voit ce qu'il a à concevoir, dans son module »* de C4-L9. ⚠️ **Il rend `null` sur liste vide**, et la liste est vide quand la porte du plan est fermée : **une page nue n'est pas la preuve qu'il est cassé.**
23. 🔴 **`app/eleve/modules/aletheia/passation/[depotId]` ne s'atteint que par `components/examens/SignalDeLancement`**, rendu sur la racine élève et alimenté par `signauxDeLancement(admin, user.id, 'aletheia')`. **Ce signal va sous Examens** — *« celui-là naît de l'assignation, celui-ci du lancement — deux événements, deux signaux »*. ⛔ **Ne le mets pas sous Exercices.**
24. ⚠️ **Et cet écran-là porte un défaut que `C5-L2` a relevé sans le corriger** : il **rouvre un `<main>` imbriqué** avec une autre largeur que le layout élève *(`<main className="mx-auto max-w-2xl p-4">`, aux deux branches du fichier)*. **C'est un écran de lecture, et tu es le lot des écrans de lecture** : soit tu le corriges et tu le dis, soit tu expliques pourquoi non. *Un `<main>` dans un `<main>` n'est pas une coquette : c'est un défaut d'accessibilité, et il se voit à la lecture au lecteur d'écran.*
25. ⭐ **`app/eleve/modules/aletheia/exercice/[depotId]` n'est plus orphelin — `C5-L2` lui a donné une liste, sur la racine élève.** ⚠️ **Ce que tu dois savoir** : les deux routes du déroulé *(Codex et Aletheia)* **se bornent l'une l'autre par l'atelier** — `lireDepotMaison`, option `atelier` *(`utils/deroule/depot.ts:169`)*, refuse un dépôt de lecture à la porte de Codex et l'inverse — et leur corps est **partagé** *(`app/deroule/PageDuDeroule.tsx`)*. ⭐ **Un onglet qui vient s'y ajouter n'a rien à réécrire : il a une liste à DÉPLACER.**
26. ⚠️ **`app/prof/aletheia/eleve/[eleveId]` a TROIS portes, et l'une d'elles est un écran d'intégrité.** La racine prof *(`Voir le détail →`)*, `app/prof/eleves/[eleveId]/page.tsx:82`, et **`utils/integrite-preuve.ts:154`**, qui fabrique `lienAnalyse` à la main. **Si cette route bouge, l'écran d'intégrité ment sans le dire.** *(C'est le défaut exact que C4-L6 a évité côté Codex, piège 23.)*
27. ⭐ **Le critère qui range tout ça : « un écran sans porte n'existe pas ».** À la fin du lot, **balaie `app/prof/aletheia/` et `app/eleve/modules/aletheia/` route par route** et démontre, pour chacune, **le clic qui y mène** en partant d'un onglet. Une route sans clic est soit une porte oubliée, soit une route morte — et les deux se disent au relevé.

### E. Côté professeur — les trois onglets

28. ⭐ **L'onglet Livres garde la racine `/prof/aletheia`, et c'est un choix, pas une facilité.** Le principe est celui que C4-L6 a suivi côté Codex : **la racine reste où son contenu est déjà**. Ici, la racine **est** la page des classes et des livres — et elle est la cible de `configNavigation.ts:61` *(« Modules → Aletheia »)*, de ses propres `Tuile href={/prof/aletheia?classe=<id>}`, et de six des dix `revalidatePath`. **L'onglet Exercices est donc une route NEUVE.** ⭐ **Et c'est LIVRES qui vient en tête** — **Livres · Exercices · Paramètres**, comme côté élève *(décision de Louis, 27/08)*. **La règle est celle-ci, et elle vaut des deux côtés : l'onglet qui garde la racine vient en tête** — arriver par « Modules → Aletheia » allume alors le **premier** onglet, comme chez Codex et chez Quazian. ⚠️ *Le dépôt connaît la forme contraire — **Fragments prof n'a aucun onglet sur sa racine** — : ne va pas t'en inspirer ici.* ⛔ **La phrase d'ouverture de l'entrée du `07-` §2 — « Exercices, Livres et Paramètres » — nomme l'inventaire, pas l'ordre** ; c'est le corps de l'entrée et son « fait quand » qui portent l'ordre.
29. ⚠️ **Ce que l'onglet Exercices doit réunir, et rien de plus que ce qui existe** : le **renvoi à la conception** *(piège 2)*, le **renvoi aux textes et aux références à valider** *(`/prof/conception/textes` — le dépôt d'un texte, sa décomposition et sa validation sont un geste **de lecture** par excellence, `02-` §6 A et C5-L1)*, l'**encart des examens diagnostiques à concevoir** *(piège 22)*, et l'**accès aux passations en classe** *(§F)*. **Tu ne fabriques aucune de ces quatre choses** — tu les mets sous le même toit.
30. ⚠️ **Le sélecteur de classes de la racine ne propose que les classes AYANT Aletheia** — `classesAvecModule(admin, moduleData.id)`, avec son commentaire : *« un livre peut être assigné à une classe sans le module […] la tuile promettait alors un parcours de lecture que l'élève ne verrait jamais »*. **Ne le remplace pas par une lecture de toutes les classes en réorganisant.**
31. ⚠️ **L'onglet Paramètres se garde tel quel — et il a un voisin qui écrit dans les mêmes colonnes.** `app/prof/aletheia/parametres/page.tsx` porte les prompts d'Aletheia ; **`app/prof/scriptorium/SectionParametresScriptorium.tsx` en édite d'autres, dans la même table `aletheia_params`**, et son commentaire dit pourquoi : *« leur maison logique est ici, pas dans /prof/aletheia »*. ⛔ **Ne les réunis pas** : deux écrans, deux domiciles, une seule table — c'est le partage voulu, et `sauvegarderParametresScriptorium` prend soin de **ne pas écraser** les colonnes de l'autre.
32. ⚠️ **Le diagnostic de compréhension est PROF-ONLY, et il déménage sous Livres avec le reste.** La page le dit à l'écran : *« usage prof, jamais montré à l'élève »*. ⛔ **Il ne traverse jamais vers un onglet élève**, sous aucun prétexte de symétrie.

### F. La liste des passations de lecture — la seule lecture que tu écris

33. ⭐ **`passationsDeClasseCodex` *(`utils/codex-onglets/liste.ts`)* est nommée Codex et filtre en dur `=== 'codex'`.** ⭐⭐ **Le geste est EXACTEMENT celui que `C5-L2` a fait sur `exercicesMaisonDeLEleve` : la cible devient un paramètre, et le prédicat ne change pas d'un caractère.** *« Deux ateliers, deux portes, un seul prédicat. »* **Ne duplique pas la fonction** — un second exemplaire divergera au premier correctif.
34. ⛔ **L'ORDRE DE RÉSOLUTION DU MODULE NE S'INVERSE PAS, et c'est le piège le plus coûteux de cette section.** La **ligne de plan d'abord** — `scriptorium_exercices_planifies.type_exercice`, où `lecture` ⇒ Aletheia et `ecriture` ⇒ Codex —, **le mode ensuite**, et seulement à défaut de ligne de plan. ⚠️ **Le motif est écrit dans le code et il est mesurable** : *« l'explication de texte mesure l'Expression EN `composer` — la règle des modes l'enverrait dans Codex quand le `06-` §1 la range en LECTURE »*. **C'est l'ordre exact de `utils/examens/signal.ts`, et on ne l'inverse pas.**
35. ⚠️ **`passation_classe_actif` à OFF ne vide pas cette liste** : l'interrupteur garde l'**ÉCRAN** *(`utils/passation/acces.ts`)*, pas l'inventaire. **Un vide expliqué, jamais un onglet qui clignote** *(`07-` §5)*.
36. ⚠️ **`fenetre_debut` est NULLABLE, et l'écran ne demande jamais de date.** Trie sur **deux clés** — l'instant, puis l'identifiant — ou l'ordre changera d'un rechargement à l'autre sous les yeux du professeur. *(C4-L6 a vu six passations dont aucune n'en portait.)*
37. ⚠️⚠️ **Les trois pièges de supabase-js, et ils mordent dans les listes.** *(1)* **Il ne lève pas** : il rend `{ error }` — une lecture ratée n'est pas « rien à faire », on la journalise. *(2)* **Il plafonne toute réponse à 1000 lignes sans rien signaler** : pour un compte, `count: 'exact', head: true`, jamais des lignes qu'on compterait ensuite. *(3)* **Son constructeur de requête est paresseux** : du code qui paraît parallèle peut être séquentiel — `Promise.all` sur des requêtes déjà lancées, pas sur des constructeurs.
38. ⛔ **Le moteur ne porte AUCUNE policy élève sur ses tables** *(§1)* : *« lecture élève : ses propres lignes, strictement ; toutes les écritures passent par le serveur »*. **Tes listes élève se lisent côté serveur, avec le client admin, filtrées sur `eleve_id` dans le code** — le patron est `utils/examens/signal.ts`. ⚠️ **N'ouvre aucune policy pour rendre une liste plus simple à écrire.**
39. ⛔ **Deux tables ne sont jamais jointes dans une liste élève** — les **squelettes** et la **métacognition** *(§1)*. *« C'est la garde la plus facile à casser et la plus coûteuse : elle donne la grille et les réponses. »* Les seuls voisins licites sont `exercices` *(la consigne)* et `exercices_retours` *(publié / lu)*.

### G. Côté élève — les trois onglets, et les gardes qu'on perd en déménageant

40. ⭐ **Livres garde la racine : la page existante NE BOUGE PAS.** Ce qui en **sort**, ce sont deux blocs et deux seulement : la **liste des exercices de lecture** posée par C5-L2 *(la `<section>` « Mes exercices de lecture », plus le message de vide et l'appel à `lireLaPorte` / `exercicesMaisonDeLEleve`)* → onglet **Exercices** ; et le **`SignalDeLancement`** → onglet **Examens**. **Tout le reste — les livres, les séances, le stepper, le capstone — reste où il est.**
41. ⛔⛔ **LES QUATRE GARDES DU HAUT DE LA PAGE SE REJOUENT SUR CHAQUE ONGLET.** `contexteAletheia(supabase, user.id)` *(`app/eleve/modules/aletheia/data.ts:26`)* rend `{ moduleActif, inscriptions, active, toutes, horsClasse }`, et la racine en tire **quatre sorties anticipées** : module non activé · module indisponible pour ce compte · état « Toutes » *(→ `ChoixClasseModule`)* · classe en contexte sans Aletheia *(→ `ModuleHorsClasse`)*. **Un onglet qui ne les rejoue pas rend une page vide au lieu de dire pourquoi.** ⭐ **Le patron est `app/eleve/modules/codex/examens/page.tsx`**, qui rejoue `module.actif` puis `seuilModule` avec ce commentaire : *« les deux gardes précèdent le contenu de l'onglet […] un onglet qu'on clique doit dire POURQUOI il refuse, jamais rendre une page vide »*. ⚠️ **Réutilise `contexteAletheia`, n'en écris pas une variante.**
42. ⚠️ **`CarteMessage` porte son propre « ← Retour », et c'est un piège que le smoke élève du 27/08 a trouvé.** Son paramètre `avecRetour` existe parce que la carte sert à **deux endroits qui n'ont pas le même besoin** : aux retours **anticipés**, elle EST la page et son retour est le seul ; **dans** la page, le corps en rend déjà un, et il doublait. ⛔ **Chaque nouvel onglet doit déclarer ce qu'il porte** — et le défaut n'est visible qu'à l'œil, aucun test ne compte les liens d'une page.
43. ⭐ **Le vide s'explique, et pas n'importe où.** C5-L2 a écrit la règle et son motif : le bloc des exercices **ne s'affiche que s'il y a quelque chose**, et le message *« les exercices de lecture ne sont pas encore ouverts »* n'apparaît **que quand la porte est fermée**. ⚠️ **Sous un onglet dédié, la règle change de forme** : un onglet Exercices vide **doit dire quelque chose**, parce qu'on vient de cliquer dessus exprès. *Distingue les deux vides — « la porte est fermée » et « tu n'as rien à faire » — et écris-les tous les deux.*
44. ⚠️ **La porte de l'onglet Exercices est `exercices_actif`, et elle se lit DANS le module partagé, jamais au site d'appel.** `exercicesMaisonDeLEleve` appelle `lireLaPorte` elle-même — *« une garde qu'on peut oublier en écrivant un second écran n'est pas une garde »*. ⛔ **Et c'est `exercices_actif` seul** : `chaine_actif`, `fabrique_actif` et `passation_classe_actif` appartiennent à leurs lots. *`chaine_actif` en particulier est **le seul des six qu'une machine bascule** — la coupure de coût l'éteint au plafond mensuel : l'emprunter comme garde d'écran fermerait un onglet que personne n'a décidé de fermer (`07-` §5).*
45. ⚠️ **La classe en contexte borne tout ce qui s'affiche** *(`01-` §2, « dans les modules on reste par classe »)*. `visibleDansLaClasse` porte la règle, et **une instance sans classe n'est pas « l'autre classe »** : `exercices.classe_id` est nullable, et l'écarter ferait disparaître un exercice que l'élève doit faire. **Un élève bi-classe ne doit jamais voir sous ses onglets Aletheia le travail de l'autre classe.**
46. ⚠️ **L'obligation de lecture est une règle, pas une décoration** *(`02-` §6 D, étape 17)*. `etatDeLExercice` la fait **passer devant l'état du dépôt** — un retour publié non lu se dit même si la version finale est partie. **Elle doit rester visible après la réorganisation, sous l'onglet où vit la chose à lire.**

### H. La copie qui a abouti et qui se tait — le quatrième item de ta boîte

47. ⭐⭐ **`etatChaineDeLaCopie()` *(`utils/passation/file-copie.ts`)* ne sert son `motif` que sur DEUX états — `echec` et `sans_retour`.** Sur **`abouti`**, il rend `phrase: 'Traitement terminé.'` et **`motif: null`** *(la branche `if (c.aUnRetour)`)*. ⚠️ **Conséquence mesurée le 27/08 sur l'exercice de PRODUCTION** — 23 dépôts, 13 remis, `argumentation:[expliquer]` + `structure:[expliquer]` : le professeur lit **treize fois « Traitement terminé. »** et **n'apprend jamais que la moitié des compétences élues n'a pas été mesurée**. *Une mesure qui n'a pas eu lieu ne se voit pas — c'est précisément ce que la porte de mode existait pour dire.*
48. ⭐ **Le motif est DÉJÀ en base, et il n'y a rien à recalculer.** `C5-L3` a fait sa moitié : `motifDesEcartees()` *(`utils/chaine/chaine.ts`)* écrit dans `exercices_jobs.dernier_message`, servi par les deux résumés persistés — éprouvé par la file réelle : *« 2 écartée(s) — structure, argumentation : mode "expliquer" non couvert par l'instrument de structure… »*. ⭐ **Deux formes possibles, et C5-L3 les nomme** : un état `abouti` qui **porte son motif** quand il y a des écartées, **ou** un **sixième compteur** à la section « LA FILE ». **Choisis, et dis pourquoi.**
49. ⚠️ **Le chemin où TOUT est écarté fonctionne déjà — ne le casse pas en réparant l'autre.** Un exercice qui n'élit que des couples non couverts ne produit aucun squelette, donc aucun retour → l'état est **`sans_retour`**, **qui sert `motif`**, et le professeur lit les deux phrases. ⛔ **C'est le cas MIXTE qui se tait**, et c'est celui de la prod.
50. ⚠️⚠️ **L'écran est PARTAGÉ avec Codex.** `utils/passation/file-copie.ts` et `components/passation/EcranProf` servent les deux modules — ta correction profite à Codex aussi. **Dis-le au relevé**, et **rejoue la section C4-L4 du `SUIVI_tests_manuels.md`** : tu viens de toucher un écran qui n'est pas seulement le tien.
51. ⚠️ **Une trace n'est pas un état** *(leçon de C5-L2-bis)* : `dernier_message` d'un job **n'est pas** l'état du dépôt. Tu **lis** une trace pour l'afficher ; tu n'en **déduis** pas un état. **Vérifie à l'écran, sur `/prof/aletheia/passation/<exerciceId>`, section « LA FILE » et les lignes par élève** — c'est là que C5-L3 a constaté le silence.

### I. Les mots — ce qui a un nom, et ce qui vient d'en changer

52. ⭐ **L'onglet prof s'appelle « Livres », et « Classe » disparaît.** *(C'est le geste symétrique de « Synthèses » qui a disparu avec son onglet chez Codex.)* Vérifie qu'aucun texte d'écran ne continue d'appeler cette page « la classe » alors que l'onglet dit « Livres ».
53. ⚠️ **Ne confonds pas quatre choses qui portent toutes le mot « lecture » ou « diagnostic »** : l'**exercice de lecture** *(maison, six temps, C5-L2)* · l'**examen diagnostique de lecture** *(l'explication de texte de la semaine 1, en classe, `01-` §10)* · la **séance de lecture d'un livre** *(le chemin Aletheia historique)* · le **diagnostic de compréhension** *(E→A, prof-only, `TrajectoireDiag`)*. **Tes libellés d'onglets et de listes n'en désignent qu'un à la fois.**
54. ⭐ **Aletheia est l'atelier de la lecture, et le `01-` §2 dit ce qu'il porte côté élève** : *« un lieu, hors du cycle : l'historique, le corpus, les conseils, la progression, le plan de cours »*, et *« tout exercice qui a demandé une production se consulte dans son atelier — Codex s'il porte `composer`, Aletheia sinon »*. **C'est la phrase qui légitime tes trois onglets** — et la même phrase dit que **pendant le cycle**, l'atelier *« se montre, il ne se visite pas »*. Ton onglet est un lieu **d'après**, pas un second point d'entrée.
55. ⚠️ **Le CRLF des `<textarea>`, pour mémoire** : un formulaire HTML soumet en **CRLF**, le stocké est en **LF**, et **cela vaut aussi pour les server actions React** *(mesuré à C5-L1 le 26/08)*. ⛔ *Ton lot ne devrait écrire aucun texte libre — si tu en écris un, tu viens de dépasser ton périmètre.* **C'est écrit ici pour que tu le remarques, pas pour que tu le traites.**

---

## Le « fait quand » — recopié du `07-Implementation.md` §2

> *Fait quand* : Aletheia porte **trois onglets de chaque côté** — Livres, Exercices et Paramètres pour le professeur ; Livres, Exercices et Examens pour l'élève ; depuis l'onglet Exercices du professeur, **un exercice de lecture se conçoit**, **un texte se dépose et sa référence se valide**, **une passation en classe se suit** et **un examen diagnostique se conçoit** ; **tout écran de lecture posé par les lots précédents s'atteint sans connaître d'identifiant**, des deux côtés ; l'élève trouve **sa séance sous Livres**, **son exercice de lecture sous Exercices** et **sa passation en classe sous Examens** ; **une copie dont le traitement a abouti dit ses compétences écartées** quand il y en a ; et **rien de ce que C4-L4, C4-L9, C5-L1, C5-L2 et C5-L3 ont éprouvé ne casse** — leurs sections du `SUIVI_tests_manuels.md` se rejouent vertes.

**C'est la condition de recette, et elle ne se négocie pas en séance.** Trois précisions sur la manière de la prouver :

- **« s'atteint sans connaître d'identifiant » se démontre par un CLIC, pas par un raisonnement.** Pour chacune des dix routes de la section D, écris au relevé **le chemin complet depuis un onglet**.
- **« rien ne casse » se démontre en REJOUANT**, pas en relisant. Les scripts existent : `scripts/recette/passation-c4l4.mjs`, `examens-c4l9.mjs`, `generateur-c5l1.mjs`, `lecture-c5l2.mjs`, `reception-c5l3.mjs`. **Rejoue au moins ceux qui traversent Aletheia, et dis lesquels.**
- **« une copie qui dit ses écartées » se prouve sur le cas MIXTE, pas sur l'autre.** ⛔ *L'exercice du bac à sable `473b2c25` n'élit QUE des couples non couverts : il tombe en `sans_retour`, **qui sert déjà son motif** — le prouver sur lui ne prouve rien de neuf.* ⭐ **Le cas à prouver est celui de la production** : deux compétences passent, deux sont écartées, le retour s'écrit, l'état devient `abouti` — et c'est là que l'écran se tait. ⚠️ *Une session Code ne s'authentifie pas : le smoke prof se fait avec Louis, dans une session qu'il ouvre.*

---

## Les conventions — `PLAN_DE_CHANTIER.md` §5

### ⭐⭐ De couture — et tu es le second destinataire, après `C5-L3`

**Pour tout lot qui succède à un autre** — c'est-à-dire **tout lot dont le `07-` §2 lui déclare une dépendance** : le lot **éprouve la couture avec le ou les lots dont il dépend**, et **pas seulement sa propre frontière**. **Trois gestes.**

1. **Nommer les coutures qu'il traverse**, une par une, sous la seule forme qui les rend vérifiables — *qui écrit cette colonne · qui la lit · **un chemin réel y mène-t-il ?***
2. **Les éprouver par EXÉCUTION, jamais par lecture** : faire passer une donnée d'un bout à l'autre et **constater**, comme les **vingt-sept** `scripts/recette/*.mjs` du dépôt le font déjà.
3. **Laisser le script au dépôt**, avec son **mode de retrait** — *c'est lui, pas le relevé, qui se rejouera à la prochaine revue.*

⭐ **Elle est écrite parce que c'est le seul défaut qu'aucun lot ne peut voir depuis sa place.** Le défaut central de `C4-L7` — *un retour de la maison ne pouvait jamais atteindre l'élève* — a traversé **dix lots** sans que rien ne l'arrête : *« chacun est juste à sa frontière, et **le trou est ENTRE eux** »*.

⭐⭐ **TA COUTURE SE NOMME EN UNE PHRASE, et elle est la question même de ton lot :**

> **Un exercice de lecture, de sa conception à son retour lu, se traverse-t-il d'un bout à l'autre en ne cliquant QUE sur des onglets ?**

**Elle traverse tes trois dépendances d'un coup** — C5-L1 conçoit, C5-L2 fait passer, C5-L3 mesure — **et deux lots de plus** — C4-L4 pour la classe, C4-L9 pour l'examen diagnostique. ⭐ **Le modèle du script existe et il est de ton jumeau** : `scripts/recette/decor-c4l6.mjs`, avec son `--retire`. **Le tien sème un décor** *(un dépôt de lecture assigné · une passation de classe ouverte · une copie mesurée dont deux compétences ont été écartées)*, **appelle les lectures que tes onglets appellent** — `exercicesMaisonDeLEleve(..., 'aletheia')`, ta liste des passations de lecture, `signauxDeLancement(..., 'aletheia')`, `etatChaineDeLaCopie()` — et **constate que chacune sert sa ligne, et que l'`href` qu'elle rend est servi par une route qui accepte le dépôt**. ⛔ **Pas de lecture de code en guise de preuve.**

⚠️ **Elle ne demande pas de réparer ce qu'elle révèle.** Ce que le passage montre **se dépose** au `SUIVI_tests_manuels.md` avec sa condition de reprise. ⚠️ **Et le corollaire vaut ici aussi** : *« je ne fais pas X, c'est ton lot » n'est pas un dépôt* — une couture que tu déclares hors périmètre **se nomme au destinataire, dans SA boîte** *(`PLAN_DE_CHANTIER.md` §5)*, ou elle n'existe pour personne.

### Du dépôt

**Aucune migration n'est attendue.** Si une s'avère nécessaire : **une ligne au `SUIVI_SQL.md` AVANT exécution**, jamais après — date, fichier, zone, cases **Sandbox** et **Prod** ; un fichier `.sql` à la racine **plus son rollback, écrit avant l'exécution et présent sur le disque** ; **additive et gatée** ; **bac à sable d'abord**.

⚠️ **Le reste du protocole n'est pas ici : il est en tête du `SUIVI_SQL.md`, règle R6** — sandbox d'abord et jamais l'inverse · **ne jamais rejouer un fichier de l'Archive** · protocole renforcé sur les **tables vivantes** · **répétition à blanc sur le CORPS du fichier**, jamais sur le fichier entier *(son `commit;` validerait ta transaction d'essai)*. **Lis-le avant d'écrire une migration** — c'est aussi la règle absolue de l'`AGENTS.md`.

**Les six interrupteurs restent où ils sont, et comme tu les trouves** — `exercices_actif`, `routeur_actif`, `competences_affichage_actif`, `fabrique_actif`, `chaine_actif`, `passation_classe_actif`. ⛔ **Aucun septième pour tes onglets** *(`07-` §5, en toutes lettres)*.

**La doctrine en base est dérivée, jamais tapée, et il n'y a qu'un dériveur.** ⭐ *Ton lot ne devrait lire aucune table de doctrine — il range des écrans, il n'assemble pas d'instance.* Si l'un d'eux en lit une, joue `python3 scripts/derive-doctrine.py --verifie` avant : il doit dire **IDENTIQUE** sur les **douze** tables, les empreintes de source et la fixture. **S'il dit DIVERGE, rejoue `--sql` ; jamais corriger la base à la main.**

### De clôture

**Ta section au `SUIVI_tests_manuels.md`**, au moment où le lot se clôt : ce qui a été **prouvé en séance, coché avec sa preuve**, et ce qui **reste à jouer en recette, décoché, avec sa condition de reprise nommée**. *Un reste de recette qui ne vit que dans un relevé ne se rappelle à personne.*

⭐⭐ **Et une case qui t'attend déjà, décochée, avec ton nom dessus** : **`C5L3-11-bis`** — *« l'écran ne montre pas le motif quand tout va bien — déposé à `C5-L4` »*, condition de reprise : toi. **Si tu la lèves, coche-la** ; si tu ne la lèves pas, **réécris sa condition** — un reste dont la condition est fausse est pire qu'un reste.

⚠️ **Et un renvoi de périmètre laisse sa trace, AVEC SA LISTE** *(la leçon de C4-L6)*. Tu vas en produire : le déménagement de la conception *(reporté par Louis, il retourne à `IDEES_post_rentree.md` avec sa nouvelle date)*, le `<main>` imbriqué si tu ne le corriges pas, les six interrupteurs à ON. **Tout ce que tu constateras sans le réparer se nomme, avec les fichiers et les lignes.**

### De dette

**Une source trouvée fausse se MARQUE, elle ne se corrige pas** *(`07-` §2)*. Deux gestes : **`[faux]`** au point de l'erreur, et **une ligne à la section DETTES** du `INVENTAIRE_Non_Tranches.md`, qui porte l'**avant / après**. **La prochaine dette est `D10`.** ⚠️ *Ne confonds pas avec le **`07-` §1**, le **`07-` §5** et l'**inventaire des lots du `07-` §2**, **tous ouverts à l'implémentation** : ceux-là, tu les amendes depuis ton relevé, sans accord préalable — ce n'est pas une dette, c'est ton travail.* ⛔ **Le `01-`, le `02-` et le `06-` sont GELÉS : si tu conclus qu'il leur manque quelque chose, tu le DIS À LOUIS, tu ne l'écris pas.**

### D'ouverture de compétence

⛔ **Sans objet — ce lot n'ouvre aucune compétence dans la chaîne**, et les six sont déjà ouvertes. **Ne joue pas `derive-instruments.py --ecris`.**

### Et le hors-périmètre

Toute idée ou découverte hors du lot → **une ligne dans `IDEES_post_rentree.md`**, pas dans le code *(`AGENTS.md`)*. **Note-les, ne les joue pas.**

---

## ⭐ Ce que tu dois rendre à Louis

**Quoi qu'il arrive dans la séance — lot fini, lot partiel, lot arrêté au constat —, tu rends d'abord ce tableau, dans le terminal, en tête de ta réponse finale :**

| | Ce qu'il fallait | État | La preuve |
|---|---|---|---|
| **①** | les trois onglets prof — Livres · Exercices · Paramètres | … | … |
| **②** | les trois onglets élève — Livres · Exercices · Examens | … | … |
| **③** | les dix routes, chacune atteinte par un clic depuis un onglet | … | … |
| **④** | la copie `abouti` qui dit ses compétences écartées | … | … |
| **⑤** | ⭐ **la couture** — l'exercice de lecture traversé d'un bout à l'autre, par exécution | … | … |

⚠️ **Trois états seulement, et le mot se choisit sans détour** : **FERMÉ** *(construit et prouvé — dis par quoi)* · **PARTIEL** *(construit, non prouvé — dis ce qui manque à la preuve)* · **NON FAIT** *(dis pourquoi, et à qui ça revient)*. ⛔ **« En cours » n'est pas un état.** ⛔ *Pour la couture, **FERMÉ** veut dire « éprouvée par exécution, script au dépôt » — jamais « lue et jugée correcte ».*

### Et ce que ton relevé doit porter, après lui

Le nom du fichier : **`RELEVE_C5_L4_2026-XX-XX.md`**, à la racine du dépôt `palimpseste`. **Après le tableau, huit choses au minimum**, en plus du récit :

1. **L'inventaire des routes, AVANT et APRÈS**, avec pour chacune **le clic qui y mène** — c'est la preuve du « fait quand », et rien d'autre ne la remplace ;
2. **ce que `configModules.ts` porte désormais**, `prefixes` compris, et **ce que tu as vérifié de l'allumage** — en particulier qu'une séance de lecture `/eleve/modules/aletheia/<uuid>/<n>` allume **Livres** et pas autre chose *(piège 18)* ;
3. **la liste des passations de lecture** — où elle vit, comment elle a été paramétrée plutôt que dupliquée, et **la preuve que l'ordre ligne-de-plan-puis-mode est respecté** *(piège 34)* ;
4. **ce que la copie `abouti` dit maintenant**, la forme choisie et son motif, **et le fait que Codex en profite aussi** *(piège 50)* ;
5. ⭐⭐ **LA COUTURE, ET SON SCRIPT** — la couture nommée *(qui écrit, qui lit, quel chemin réel y mène)*, la preuve **par exécution**, et le **chemin du script laissé au dépôt avec son mode de retrait**. ⛔ *Elle se rend même si le lot s'est arrêté au constat.*
6. **les renvois de périmètre, AVEC LEUR LISTE** — fichiers et lignes ;
7. **toute source trouvée fausse**, avec son `[faux]` et sa ligne au registre ;
8. **ce qui reste à jouer en recette**, avec sa condition de reprise — parce que c'est cela qui part au `SUIVI_tests_manuels.md`.

⭐ **Et deux amendements t'appartiennent sans accord préalable** : l'**inventaire des lots du `07-` §2** *(ton état de clôture)* et le **`07-` §5** *(ce que tu auras appris de l'allumage — au minimum l'état réel des six interrupteurs, si tu le reconstates)*.
