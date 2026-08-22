# PLAN DE CHANTIER — l'ordre des lots, et la fabrique de leurs prompts

**Ce document remplace `PLAN_CHANTIERS_RENTREE.md`**, qui travaillait au grain du chantier, sur cinq cycles de crédits et une date. Il travaille au grain du **lot**, et **il ne porte aucune date**.

---

## 0. Ce qu'il porte, et ce qu'il ne porte pas

| Il porte | Il ne porte pas |
|---|---|
| l'**ordre** des lots et leurs **dépendances** | **ce que chaque lot construit** — `07-Implementation.md` §2 |
| l'**état** : ce qui est joué, ce qui ne l'est pas | son **« fait quand »** et son **manifeste** — `07-` §2 |
| la **recette d'un prompt de lot** | le **schéma** — `07-` §1 |
| le **contrôle d'entrée** d'un prompt | les **règles** — les neuf sources |
| — | les **dates**, qui n'existent nulle part et n'ont pas à exister |

**Le partage tient à une raison.** Un lot change d'ordre souvent, et de contenu rarement. Deux documents qui portent le même contenu à deux rythmes divergent, et **c'est le plus récemment touché qui gagne par accident**. Ce document ne recopie donc jamais un manifeste : il y renvoie.

---

## 1. Le corpus, et la fin de la SPEC C3

**Neuf sources font foi.** `00-referentiel.md` · `01-routeur.md` · `02-exercices.md` · `03-competences.md` · `04-Instances_Exercices.md` · `05-GENERATEUR_Reference_Decomposee.md` · `06-Palimpseste.md` · `07-Implementation.md` · `08-FORMAT_IMPORT.md`. Plus les **sept fiches** de `competences/` et les **six fichiers** d'`instances/`.

**La SPEC C3 est archivée.** Relue en entier contre ce corpus : **230 de ses 325 items y ont un domicile**, elle **diverge en 39 endroits** — presque toujours à son désavantage —, et **dix de ses renvois pointent dans le vide**. Ce qui ne vivait qu'en elle et méritait de survivre a été versé dans le `07-`.

**Conséquence pour un prompt de lot** : il ne cite plus jamais C3. Son manifeste est celui du `07-` §2.

---

## 2. L'état

**Le moteur d'exercices est en construction, et le `SUIVI_SQL.md` en porte neuf migrations.** **C4-L1** *(le schéma, le seed, les touches à l'existant — trois migrations du 18/08)*, **C4-L8** *(la doctrine dérivée et la fabrique — quatre migrations du 20/08)* et **C4-L5** *(la chaîne et son complément — deux migrations du 21/08)* sont **joués en sandbox**. **Rien de C5 ni de C6 n'est construit.**

**Sept prompts de lot existent et sortent de la recette du §5** — `PROMPT_Code_C4_L1.md`, `C4_L2`, `C4_L3`, `C4_L4`, `C4_L5`, `C4_L8` et `C4_L8_bis`. Les deux premiers ont **écrasé** des prompts périmés, écrits contre une SPEC C3 aujourd'hui archivée. **C4-L1, C4-L5 et C4-L8 sont joués** ; **C4-L2 et C4-L3 se sont arrêtés au constat**, faute de leurs dépendances, et ont rendu chacun un relevé de questions ouvertes — **leurs prompts se refabriquent par la recette avant d'être rejoués** *(§5, leurs boîtes)*. **Celui de C4-L2 l'est, le 21/08** : ses deux dépendances étant jouées, sa boîte est vide et son manifeste est calé sur les versions courantes. **Celui de C4-L3 attend encore** — sa boîte porte neuf items, et **C4-L8-bis n'est pas joué**. **C4-L4 vient d'être fabriqué et n'est pas encore joué.** **C4-L8-bis aussi** — fabriqué le 21/08, et sa fabrication a d'abord dû **écrire son entrée au `07-` §2**, qui n'existait pas : le lot était né au §3 de ce document, jamais au manifeste. *Le `07-` passe en 2.21.*

⚠️ **Un lot s'est ajouté le 21/08, à la recette des trois dernières épreuves de C4-L8 : `C4-L8-bis`.** La recette a trouvé que `chargerLignesDepuisBase` lit `exercices_routes` **sans pagination** — PostgREST plafonne à **1000 lignes sur 3264** —, que **sept objets sur treize** n'ont dès lors **aucune consigne** à la conception, et que la **garde serveur** et le **contrôle d'import de la plateforme** jugent sur cette même doctrine tronquée. **Les 3264 routes SONT en base : c'est la lecture applicative qui plafonne**, et `derive-doctrine.py --verifie` ne peut pas le voir puisqu'il lit les sources. *Détail et preuves : `RELEVE_Recette_C4_L8_trois_epreuves_2026-08-21.md` §2, F1.*

**Ce qui existe et se réutilise** : le patron RLS élève (`c1_rls_eleve.sql`), le journal de coût `api_couts`, le canal de signalement `signalerEnAttenteIA`, le module Calendrier, les jetons `globals.css`, le patron de validation par lot hérité de Fragments, **la chaîne de mesure et sa file** *(`utils/chaine/`, C4-L5)*, et **la doctrine dérivée** *(`scripts/derive-doctrine.py`, C4-L8)*.

---

## 3. L'ordre et les dépendances

### Les deux chemins

Le premier objet réel du dispositif est la **passation diagnostique** : une copie manuscrite, photographiée, transcrite, mesurée. C'est le **chemin technique** :

> **C4-L1** *(le schéma)* → **C4-L5** *(la chaîne de mesure)* → **C4-L4** *(la passation en classe)*

Mais une mesure ne devient une lettre que si la compétence est déclarée `evaluee`, et **ce statut se déclare à un écran**. C'est le **chemin du professeur**, et il est aussi court :

> **C4-L1** → **C4-L8** *(la fabrique : déposer les fiches, déclarer les statuts, déposer le corpus, concevoir)*

**Les deux se rejoignent avant la première passation.** Sans le premier, rien ne mesure ; sans le second, tout mesure en silence. Le routeur ne vient qu'ensuite, avec **C4-L2**, et le premier exercice fait à la maison avec **C4-L3**.

### Le graphe

| lot | dépend de | pourquoi |
|---|---|---|
| **C4-L1** — le schéma et les interrupteurs | — | **il bloque tout** : aucun autre lot n'écrit sans ses tables |
| **C4-L8** — la fabrique du professeur | C4-L1 | c'est le seul endroit d'où un statut de recette se pose, et où un corpus se dépose |
| **C4-L8-bis** — la doctrine LUE EN ENTIER | C4-L8 | **l'application n'en lit que 1000 lignes sur 3264** : sept objets sur treize n'ont plus aucune consigne, et la garde serveur comme le contrôle d'import jugent sur une doctrine tronquée *(F1, recette du 21/08)*. **Décision de Louis, 21/08 : son propre lot, et AVANT C4-L3.** |
| **C4-L5** — les mesures et les niveaux | C4-L1 | la chaîne froide écrit dans `exercices_squelettes` et `competences_mesures` |
| **C4-L4** — la passation en classe | C4-L1 · **C4-L5** | son « analyse en lot » *est* un appel de la chaîne |
| **C4-L2** — le pilotage et le cœur du routeur | C4-L1 · **C4-L8** | il ne cible que des compétences `evaluee`, et c'est L8 qui les déclare |
| **C4-L3** — l'élève, le formatif à la maison | C4-L1 · C4-L5 · **C4-L8-bis** | les six temps ont besoin du retour, donc de la chaîne — et **la banque de consignes doit être entière** avant qu'un élève lise ce qu'elle rend |
| **C4-L6** — les onglets de l'écriture | C4-L3 · C4-L4 | il n'y a rien à onglet avant qu'il y ait des écrans |
| **C4-L7** — la recette du flux | **tout C4** | un exercice de bout en bout, conception → retour final lu |
| **C5-L1** — la conception, côté professeur | C4-L1 · **C4-L8** | il travaille sur un corpus déposé et validé |
| **C5-L2** — la passation, côté élève | C5-L1 · C4-L3 | même déroulé, retour ancré au texte |
| **C5-L3** — les mesures en réception | C4-L5 | il tourne sur les quatre compétences qui ont une grille réceptive |
| **C5-L4** — les onglets de la lecture | C5-L1 · C5-L2 · C5-L3 | idem C4-L6 |
| **C6-L1** — la page du professeur | C4-L5 | une matrice de lettres suppose des lettres |
| **C6-L2** — ce que l'élève voit | C4-L5 | idem |
| **C6-L3** — « en faire plus » | C4-L2 | pull et push sont des opérations du routeur |
| **C6-L4** — le branchement de Fragments | C4-L5 | il passe par la même chaîne |

### Les prompts se fabriquent dans l'ordre du GRAPHE

**Jamais dans l'ordre des numéros.** Un prompt fabriqué avant sa dépendance ne se trompe pas — il **s'arrête au constat**, ce qu'on lui demande —, mais le relevé qu'il rend est en bonne part un relevé de questions **que la dépendance aurait fermées**. *C'est arrivé à C4-L2 et à C4-L3 : sur seize questions ouvertes, **six n'existaient que parce que C4-L8 n'était pas joué**.*

**Et un prompt ne se relance pas tel quel après une passe d'écritures.** Ses versions épinglées deviennent périmées — la version **avertit**, elle ne bloque pas —, mais surtout **son manifeste peut changer**, et ses **pièges** ignorent ce qui vient d'être tranché. **Repasser le prompt par la recette du §5** coûte moins cher que de laisser la session redécouvrir des décisions déjà prises.

### Une dépendance qui n'est pas un lot

**Les bancs.** Une fiche n'est *versée et bancée* qu'après sa porte de recette *(`03-competences.md` §9)*. C4-L5 et C5-L3 en dépendent — mais **le blocage est granulaire** : une fiche seulement déposée bloque **sa** compétence, pas le lot.

*Il n'y en a pas d'autre. En particulier, **aucune grille réceptive ne manque** : le critère du `02-` §3 veut qu'une compétence admette les modes réceptifs « si et seulement si son objet peut être celui d'un autre ». L'Expression est mono-mode `composer` et le déclare ; la Connaissance mesure ce que l'élève mobilise de mémoire, non ce qu'il reconnaît chez un auteur, et le déclare aussi. **Les quatre compétences qui peuvent avoir une grille réceptive en ont une.***

---

## 4. Les régimes de fonctionnement

**Aucun n'est un repli, et aucun n'attend qu'un lot soit en retard.** Ce sont des états normaux du dispositif, écrits dans les sources avec leur raison. **Ce document ne les recopie pas, il les liste.**

| régime | ce qui se passe | où c'est écrit |
|---|---|---|
| **Les deux voies** | le professeur conçoit, le routeur assigne, **et les deux écrivent dans les mêmes tables**. Aucune n'est le repli de l'autre | `07-` §5 |
| **La voie mixte** | quand peu de compétences sont `evaluee`, le routeur remplit avec celles qu'il a et **le solde du budget revient aux exercices communs**. C'est le professeur qui règle les statuts, donc c'est lui qui règle ce partage | `01-` §5 · `07-` §5 |
| **La branche d'échec** | quand aucun type ne porte l'observable visé, N1 **dégrade en retour mono-focal** et journalise `degrade` — le compteur dira à quelle fréquence le cas se présente | `01-` §6 |

---

## 5. La recette d'un prompt de lot

### Comment on en demande un

**Dans une session de conception**, une phrase suffit — la même à chaque fois, le numéro près :

> Fabrique-moi le prompt de session Code pour le lot **C4-L1**.
>
> La recette est au `PLAN_DE_CHANTIER.md` §5 *(dépôt `palimpseste`)* — six pièces, dans l'ordre. Ce que le lot construit, son manifeste et son « fait quand » sont au `07-Implementation.md` §2 *(dépôt `palimpseste-conception`)*. **Les neuf sources font foi ; la SPEC C3 est archivée, ne la cite jamais.** Écris le résultat dans `palimpseste/PROMPT_Code_C4_L1.md`.

**Dans Claude Code**, on ne dit rien : on colle le prompt dans une session fraîche. Il porte son manifeste, son contrôle d'entrée et sa condition de recette — si une pièce manque, il s'arrête de lui-même.

### Ce qu'il contient

Un prompt de lot se fabrique, il ne s'invente pas. **Six pièces, dans cet ordre.**

**1. L'en-tête.** *« À coller dans une session Claude Code fraîche. »* Une session, un lot.

**2. Le manifeste, recopié verbatim du `07-` §2**, avec pour chaque fichier son **statut requis** et sa **version au moment de l'écriture**. Rien de plus : la règle de manifeste veut que ce qui n'y figure pas ne se lise pas.

**3. Le contrôle d'entrée**, en deux temps, et les deux ne font pas la même chose :

> **Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, cumulatifs ; « VALIDÉ ET GELÉ » vaut *relu et validé*.
>
> **La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ici, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.
>
> **Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot.

**4. La mission**, reprise du `07-` §2 : ce que le lot construit, et rien d'autre.

**5. Les pièges**, tirés des sources du manifeste — les décisions dont l'oubli coûte une migration. Chacun avec son renvoi. *C'est la seule partie du prompt qui demande du jugement : elle se relit contre la source, pas contre le prompt précédent.*

**6. Le « fait quand »**, recopié du `07-` §2. C'est la condition de recette, et elle ne se négocie pas en séance.

**Et trois conventions de dépôt.** Les deux premières valent pour **tout lot qui touche la base** : **une ligne au `SUIVI_SQL.md` avant exécution**, jamais après ; et **les migrations sont additives et gatées** — les trois interrupteurs restent à OFF jusqu'à la recette. La troisième vaut pour **tout lot qui s'appuie sur la doctrine en base** : **elle est dérivée, jamais tapée, et il n'y a qu'un dériveur.** Avant de lire ces tables, jouer `python3 scripts/derive-doctrine.py --verifie` — il doit dire **IDENTIQUE** sur les onze tables, les empreintes de source et la fixture. **S'il dit DIVERGE, rejouer `--sql` ; jamais corriger la base à la main.**

**Et une convention de clôture**, pour tout lot : **sa section au `SUIVI_tests_manuels.md`** — ce qui a été prouvé en séance, **coché avec sa preuve**, et ce qui **reste à jouer en recette**, décoché. Le protocole de ce fichier la demande déjà *(« chaque spec/session ajoute sa section ici au moment où elle est close »)* ; **elle est écrite ici parce qu'aucune pièce du prompt ne la portait — et que C4-L1 comme C4-L8 s'étaient donc clos sans elle.** Un reste de recette qui ne vit que dans un relevé ne se rappelle à personne.

**Et une convention de dette**, pour tout lot : **une source trouvée fausse se marque, elle ne se corrige pas** *(`07-` §2)*. Deux gestes — **`[faux]`** au point de l'erreur, et **une ligne à la section DETTES** du `INVENTAIRE_Non_Tranches.md`, qui porte l'avant / après. *Le relevé du lot en rend compte comme du reste ; c'est le registre qui fait foi pour la passe de réconciliation — **un relevé de plus est un endroit de plus à fouiller**, et il y en a déjà quinze.*

**Et une convention d'ouverture de compétence**, pour **tout lot qui ouvre une compétence dans la chaîne** : **trois gestes, dans cet ordre**, et le troisième demande la fiche sous les yeux — `python3 scripts/derive-instruments.py --ecris`, puis **l'import du dérivé**, puis **le branchement** *(quel prompt est P1, lequel est P2, ce que Code1 prépare, ce que Code2 agrège, et le calcul du `delta_v1_vf`)*. Le `utils/chaine/LISEZ-MOI.md` les porte. **Elle est écrite ici parce qu'elle n'a pas de destinataire** : le relevé de C4-L5 l'adressait à *« tout lot qui ouvre une compétence »*, ce qui n'est pas un lot — **un message sans destinataire ne se verse dans aucun prompt**, et sa seule maison est cette section.

### La boîte aux lettres des lots — ce qu'un lot joué laisse à un lot à venir

**Un relevé ne se transmet pas tout seul, et il ne DOIT pas** : la règle de manifeste interdit à une session Code d'aller le lire, et un relevé ne fait pas partie des six pièces ci-dessus. Ce qu'un lot joué a compris **pour un autre lot** se dépose donc **ici, par destinataire**. ⭐ **Fabriquer un prompt commence par vider la boîte de son lot** — chaque item entre en piège ou au manifeste, puis se raye d'un ✅ et de sa date. *Sans ce dépôt, la seule parade est la mémoire de qui était là.*

**C4-L3 — neuf items.** ⚠️ *À porter dans sa **RECONSTRUCTION**, jamais en retouche du prompt actuel.*

1. Ne **pas** copier `app/prof/conception/[id]/page.tsx:48` : le patron élève est `composerApercu`, qui rend `candidats: string[]` et **jamais la ligne** *(revue bornée §9)*.
2. `correctionServieAvantLeSuivant` ne doit pas entrer dans la charge utile du cas 1 *(id.)*.
3. Le filtre `statut != 'retire'` sur `exercices_depots` **n'existe nulle part** *(id.)*.
4. Les policies élève s'ouvrent **table par table**, en excluant explicitement `exercices_cas`, `exercices_squelettes` et `exercices_metacognition` *(id.)*.
5. Toute nouvelle fonction `security definer` se **révoque de `public, anon, authenticated`** — `from public` seul ne ferme rien — **et vérifie son appelant** *(id., §2)*.
6. **DÉCISION DE LOUIS (21/08)** : le **balisage markdown des 336 consignes se REND à l'écran**, il ne se nettoie pas. Le gras est du sens, pas de la décoration. Coût : un rendu markdown **restreint — gras et italique seulement** — dans l'écran élève. *C'est le seul des cinq arbitrages du 21/08 qui n'a rien écrit dans une source : il n'existe QUE dans cette boîte.*
7. **Ne réécris pas l'aperçu** : `composerApercu` *(`utils/fabrique/conception.ts`)* porte déjà les règles de placement ; il n'y aura qu'un rendu pour les deux voies *(`RELEVE_C4_L8_2026-08-20.md` §8)*.
8. Tu **déclenches par une écriture en file** — `mettreEnFile(admin, depotId, 'mesure_v1' | 'mesure_vf')`, idempotent ; l'attente se lit par `etatDesJobs(admin, depotId)`. Le **retour est déjà segmenté** *(`exercices_retours.texte`, tableau `jsonb` à identifiants stables)* : **ne le découpe pas, affiche-le**. Et **c'est toi** qui portes `aide_consommee` : passe-la à `traiterDepot` *(`RELEVE_C4_L5_2026-08-21.md` §6)*.
9. **DÉCISION DE LOUIS (21/08) — le mêlage des candidats est À TOI.** `composerApercu` compose `[...tirerTrois(banque), reponseAttendue]` : **la bonne réponse n'est jamais mêlée, elle est en position 4 à tous les coups** *(constaté à l'écran, recette du 21/08, F2)* — alors que le commentaire du même fichier promet « QUATRE candidats, **mêlés** ». L'aperçu du professeur **reste tel quel** : son tirage est **délibérément déterministe**, pour qu'un rechargement ne change pas ce qu'il relit. **Le tirage réel de la passation vit chez toi**, et c'est lui qui doit mêler — sans quoi un élève apprend que la dernière est la bonne. ⚠️ *Ceci ne contredit pas l'item 7 : tu ne réécris pas `composerApercu`, tu écris le tirage de passation qui n'existe pas encore.*

> ✅ **Un item de plus est éteint, et ne compte donc pas dans les neuf.** L'accord du patron `interroger` était la seconde décision du §9 de la revue bornée ; **elle a été écrite dans la source le 21/08** *(`04-` §14.1, patron retourné)* et se dérive désormais. Un message qui trouve son domicile dans une source **sort de la boîte**.

**C4-L2 — ✅ BOÎTE VIDE, 21/08.** Les deux items sont entrés en piège au `PROMPT_Code_C4_L2.md`, **refabriqué le 21/08** selon la recette ci-dessus *(il était écrit contre le `07-` v2.1 et le `01-` v5.0 ; il l'est désormais contre les v2.23 et v5.4)*.

1. ✅ **21/08 — piège 46 du prompt.** `competences_actives_par_classe` **est remplie par C4-L8** depuis le statut et l'opt-out : le routeur la **lit**, il ne l'écrit pas. Et `exercices_depots.origine = 'prof'` existe déjà — la voie mixte le trouve dans **les tables du routeur**, pas dans une table à part *(`RELEVE_C4_L8_2026-08-20.md` §8)*.
2. ✅ **21/08 — pièges 38 et 45 du prompt.** **Le registre s'élit chez toi** : passe-le à `traiterDepot({ registre })`. La **cible primaire**, les **sondes** et le drapeau de **sonde de montée** se lisent sur `routeur_decisions` — sans décision, la chaîne prend la première compétence mesurée. Les colonnes que tes règles lisent — `distance_contexte`, `delai_jours`, `delai_mesures`, `delta_v1_vf`, les deux résultats de la paire — **sont écrites par la chaîne, jamais interprétées par elle** *(`RELEVE_C4_L5_2026-08-21.md` §6)*.

⚠️ *Et une question ouverte qui le concerne, non tranchée* : **où doit vivre le partage primaire / secondaire / sonde, hors de `routeur_decisions` ?** *(`RELEVE_C4_L5_revue_2026-08-21.md`, item 2.)* ⚠️ **Elle reste ouverte** — le prompt la porte au **piège 48**, avec la consigne de ne pas la trancher en passant.

**C4-L4 — ✅ BOÎTE VIDE, 21/08.** Les deux items sont entrés en piège au `PROMPT_Code_C4_L4.md`, fabriqué le 21/08 selon la recette ci-dessus.

1. ✅ **21/08 — pièges 1, 2 et 28 du prompt.** Le traitement **en lot** passe par **la même file** : mets chaque dépôt en file et laisse la route tourner. Le retour **édité par le professeur** s'écrit dans la **même forme segmentée** que le retour engendré — la garde de base le refuse sinon *(`RELEVE_C4_L5_2026-08-21.md` §6)*.
2. ✅ **21/08 — pièges 46, 47 et 48 du prompt.** **`maxDuration = 60` contre un contrat de latence de trois minutes** — le seul item du corpus explicitement marqué *« à trancher AVANT C4-L4 »* *(`RELEVE_C4_L5_revue_2026-08-21.md`, item 5 : à un job par tour, cent quarante copies demandent cent quarante tours de cron)*. **Tranché par Louis le 21/08 : passage au plan payant, exécuté le jour même.** Ce qui reste n'est plus un arbitrage mais un geste — **poser la cadence et monter `maxDuration`** *(§6 ci-dessous)*.

> ⚠️ **La fabrication du prompt a tranché la fin de cet item.** Il se terminait par : *« la contrainte de latence reste la condition de recette de C4-L4, pas celle de C4-L5 »*. **La source sépare deux contrats** : le `07-` §1.1 écrit que le traitement en lot d'une passation est *« explicitement différé »* et *« ne porte aucune exigence de latence »*, et que **les trois minutes sont celles du retour MAISON** *(`01-` §12)*. **Ce qui reste condition de recette de C4-L4 est donc double, et ce n'est pas le contrat de trois minutes** : la **transcription en quelques secondes par copie**, pendant l'heure de cours *(`02-` §6.D)*, et la **vérification de la cadence de planification que l'offre autorise** — que le `07-` §1.1 nomme *« une condition de C4-L4, au même titre que le test de charge de la transcription (§7) »*.

**C5-L1 — un item.** L'**écran de validation de la référence existe** *(`app/prof/conception/reference/[id]/`)* et suit le `05-` §4.4 : **à réemployer, pas à construire** *(`RELEVE_C4_L8_2026-08-20.md` §8)*.

**C5-L3 — un item.** Les étapes de notation **réceptives** sont **écrites aux fiches et inactives** ; la chaîne les servira **par le même branchement**, et *« les niveaux se calculeront rétroactivement en rejouant l'étape validée »* *(`RELEVE_C4_L5_2026-08-21.md` §6)*.

> **Ce qui n'entre PAS dans cette boîte** : un message adressé à **tout lot** n'est pas un message, c'est une **convention** — sa place est au-dessus, avec les cinq autres. Les deux qui ont fait ce chemin : *« la doctrine est dérivée, jamais tapée »* et *« trois gestes pour ouvrir une compétence »*.


---

## 6. Ce qui reste ouvert, et qui ne bloque rien

- **La table de conversion 0-3 du Monitoring** — la fiche le dit elle-même : *« Ce n'est pas un trou : `n/a` est une valeur déclarée dans l'échelle, elle se compare comme les autres, et le jour où la table arrive le calcul cesse de la rendre. »* Elle se remplit sur la collecte de l'année *(`competences/monitoring.md` §9)*.
- **La préférence de l'élève** — sa forme est tranchée, la place qu'elle prend dans le ciblage ne l'est pas *(`01-` §5)*. C4-L2 se construit sans elle.
- **La `cible_primaire` de l'exercice conçu par le professeur** — la décision est prise et **écrite** *(`07-` §1.1)* : sur la voie du professeur, l'écran de conception la lui demande. **La colonne, le champ à l'écran et sa lecture par la chaîne sont reportés à un lot de correctifs** — rien ne les attend, puisque tant qu'aucune fiche n'est *versée et bancée* la chaîne ouvre **zéro compétence** et n'écrit aucune mesure. En attendant, la chaîne prend **l'ordre alphabétique, assumé comme convention**, et **lève une alerte** dès que ce repli sert sur plus d'une compétence. *« La première compétence mesurée » lisait l'ordre des clés d'un `jsonb` — donc le nom le plus court.* **Condition de fermeture : avant la première fiche versée et bancée — et de toute façon avant C4-L7**, dont la recette de bout en bout la traverse.
- **La colonne `exercices_squelettes.prompt_version`** — **elle disparaît** *(`01-` §11 et `07-` §1.2, 21/08 : rien n'est versionné par phase, l'`instrument_version` bouge dès qu'un prompt bouge)*. Le retrait part au **même lot de correctifs** : la table est **vide** et la colonne est nullable — mais ⚠️ **la chaîne l'écrit** : `utils/chaine/chaine.ts` la pose **deux fois**, avec exactement la valeur d'`instrument_version`. *Ce qui confirme l'arbitrage — c'est bien le même chiffre copié — et change le geste : **une colonne ET deux écritures**, pas une colonne seule.* **Même condition de fermeture que ci-dessus.**
- **Le déclencheur de la chaîne n'existe pas.** `app/api/chaine/route.ts` est écrit, protégé et éprouvé — et **rien ne l'appelle** : aucun cron déclaré, aucun ordonnanceur en base. *Le passage en plan payant est décidé ; ce qui reste est de poser la cadence.* La contrainte est écrite au source *(`07-` §5, « Ce que la chaîne exige de l'hébergement »)*. Le geste part au **même lot de correctifs**, et il en appelle deux autres :
  - **`maxDuration` porté à la mesure du contrat de latence** — le chiffre actuel a été posé pour un plafond d'hébergement qui n'en était pas un ;
  - **une garde de budget sur la boucle de la route** — elle réclame un job **sans réserver la durée de son traitement**, et `reclamerJobs` incrémente `tentatives` **à la prise**. Le dernier job de chaque invocation est donc tué en vol, sans clôture, et **brûle une tentative** ; trois fois, et c'est `echec_definitif` sur une copie jamais traitée. *Ce n'est pas un cas limite : c'est le dernier job de chaque tour.*

  **Condition de fermeture : avant la première passation réelle.** *La recette de bout en bout de C4-L7 peut se jouer en appelant la route à la main.*

- ~~**Les deux constats de la revue bornée de C4-L8**~~ — ✅ **CLOS LE 21/08 : JOUÉS EN SANDBOX ET PROUVÉS.** *(§6.5 et §8 du relevé.)* **La vue** : `security_invoker = true` **et** `revoke all … from anon` — l'épreuve par l'échec, à trois temps dans une transaction annulée, a montré **le contournement à l'œil** *(sous `anon`, la vue rendait une ligne d'assiduité d'un élève réel)*, puis **0**, puis **`REFUSE 42501`**, témoin positif à 4 aux quatre lignes ; ⭐ le balayage de tout le schéma `public` répond **AUCUNE autre vue**. `est_prof` et `handle_new_user` portent leur `search_path = public, pg_temp` ; `est_prof` reste grantée aux deux rôles, `handle_new_user` **garde sa place** *(le retrait est un lot de nettoyage, pas un correctif)*. **Le résumé** : `Doctrine.resume` nomme les **douze** comptes et en croise trois contre une autre source, `OUTIL` en **1.2**, cinquième dérivation jouée à **19:58:43 UTC**, `SOURCES : IDENTIQUE`, onze tables `IDENTIQUE`, `FIXTURE : IDENTIQUE`, **`npm test` 414/414**. Relevé : `RELEVE_Correctifs_RLS_et_Resume_2026-08-21.md`.
  - ✅ ~~**CE QUI RESTAIT**~~ — **CLOS LE 21/08 EN RALLONGE, à la demande de Louis.** Les **sept** fonctions `security definer` portent désormais `search_path = public, pg_temp` *(`divergent_encore = 0`, privilèges inchangés, répétition à blanc et rollback vérifiés par requête)*, et ⭐ **`handle_new_user()` est RETIRÉE** — orpheline constatée par requête *(0 trigger · 0 fonction · 0 policy · 0 dépendance)*, `drop` **sans `cascade`**, `profiles` intacte. ⚠️ **Il reste UN point, et il n'est pas une requête** : le **smoke test** — créer un élève depuis l'écran professeur —, **le chemin de mardi 25**. *Le texte d'origine, pour mémoire :* les **cinq autres fonctions `security definer`** *(`chaine_depense_du_mois`, `effacer_classe`, `poser_statut_recette`, `poser_statut_recette_monitoring`, `retirer_inscription`)* portaient **déjà** un `search_path`, et il vaut **`public` SEUL** — sans `pg_temp`, donc avec le schéma temporaire cherché **implicitement en premier**. **La base porte désormais deux formes.** Risque nul aujourd'hui *(elles sont fermées à `anon` et `authenticated` : seul `service_role` les appelle, et l'attaque supposerait déjà d'être `service_role`)* — **mais c'est une divergence de doctrine, et elle va au même lot de correctifs.**
  - ⚠️ **Trouvé au passage, et qui ne relève d'aucun lot** : depuis une séance Cowork en nuage, **la base Supabase est injoignable** — les domaines `supabase.com`/`supabase.co` ne sont pas sur la liste blanche du mandataire *(`403` au CONNECT, même en 443)* et **aucun port hors 443 ne sort** ; le shell qui voit les dossiers montés n'a **ni `psql` ni DNS**. Les deux chemins qui marchent sont **le navigateur de Louis** et **son terminal**. *Les ouvrir dans la liste blanche débloquerait `psql` et l'API de gestion Supabase.*

- ⭐ **La dévalidation d'une référence ne défait pas les instances déjà assignées — TRANCHÉ par Louis le 21/08 : le message honnête suffit.** La recette du 21/08 *(C4L8-3)* a montré ce que la plateforme fait exactement : elle **ferme la conception à venir** *(la porte Aletheia passe de un texte à zéro, la référence revient en file, la garde serveur refuse en source comme en cible)* et **ne retient rien de ce qui est déjà assigné** — l'instance reste `assigne`, ses dépôts gardent leur échéance, aucun bandeau, et « Assigner à la classe » reste actif. Le `02-` §6 A veut qu'**aucune** instance ne tourne sur une référence non relue, et le `08-` §7 en fait son blocage n° 1 : **la règle est donc laissée ouverte, et on l'assume** — le retour à l'écran dit le nombre d'instances concernées et invite à les retirer une à une. ⚠️ **Ce qui la rouvrirait** : une passation réelle sur une référence dévalidée en cours de route. Aujourd'hui `exercices_actif` est à OFF et rien n'est servi. *(Louis, 21/08 : « un message honnête suffit. (je crois) » — le doute est noté avec la décision.)*

- ⭐ **L'opt-out doit DÉMÉNAGER au profil de la classe — TRANCHÉ par Louis le 21/08.** Le `07-` §1.3 le loge *« au profil de la classe, au tableau de pilotage »* ; il vit à **`/prof/competences` §4**, en matrice classes × compétences *(constaté à la recette, C4L8-2 — le bouton **marche**, il n'est pas au bon endroit)*. Le profil de classe *a* un onglet « Compétences » *(`/prof/classes/[id]?vue=competences`)*, mais c'est une **« Zone en construction »** avec cinq colonnes inventées — *Analyser · Interpréter · Argumenter · Problématiser · Conceptualiser* — et « Aucune donnée réelle » : **ce ne sont pas les six du `07-` §1.2**. Le geste part au **même lot de correctifs**, et il en porte deux : **déplacer le bouton** *(`app/prof/competences/OptOutClasses.tsx`, l'action `poserOptOut` ne bouge pas)* et **décider du sort de la zone en construction**, qui affiche aujourd'hui un référentiel qui n'existe pas. ⚠️ **Rien ne l'attend** : `competences_actives_par_classe` est la même table, et C4-L2 la **lit** sans savoir d'où elle est écrite.

- **Trois angles morts de l'outillage de dérivation** — trouvés en rejouant les dérivations le 21/08. **Aucun ne fausse une donnée aujourd'hui** ; tous les trois vont au **même lot de correctifs**, même condition de fermeture.
  - **`exercices_types_crans` est écrite par `--sql` et jamais lue par `--verifie`.** Douze tables remplies, **onze** contrôlées — et la manquante est justement celle où la couche type se remplit aux crans de production. Un contrôle qui rend onze `IDENTIQUE` laisse alors croire que rien ne bouge.
  - **Les DEUX chaînes de dérivation embarquent le chemin absolu de la racine** dans ce que leur contrôle compare — `_derivation.racine` dans la fixture de `derive-doctrine.py`, `racine_conception` dans le `MANIFESTE.ts` de `derive-instruments.py`. Sur une autre machine, les deux disent `DIVERGE` alors que **tout le reste est identique à l'octet** *(éprouvé : régénérer depuis une autre racine ne change que cette ligne-là)*. **Conséquence : `npm test` ne peut passer que sur la machine du professeur** — ni en intégration continue, ni sur un second poste, ni en conteneur.
  - **`cran` est un entier dans `exercices_crans` et une chaîne dans `exercices_types_crans`.** Même notion, deux types. Rien ne casse tant que personne ne joint les deux tables.

- **Le gabarit de Calame : trois exigences du `07-` §4 que le lot ne tient pas encore.** Le §4 a été réécrit **après** la construction et la revue de C4-L5, en tranchant le domicile de `ton` et de `longueur`. **Aucune de ces trois n'est un défaut du lot** — ce sont des conséquences d'un arbitrage arrivé ensuite. Toutes vont au **même lot de correctifs**, même condition de fermeture.
  - **La dérivation n'émet pas le gabarit découpé en sections nommées.** Le §4 l'exige — *« pour qu'un remplacement ait quelque chose d'identifié à remplacer »* — et `utils/chaine/derive/calame-retour.ts` rend le gabarit **en un seul bloc**, `regles_verrouillees` et `sections_editables` n'étant que des métadonnées posées à côté. **La règle 7 est donc déclarée ouverte et matériellement inremplaçable.**
  - **La `longueur` n'a pas son paramètre de plateforme.** Le §4 lui en donne un, *« au même endroit que les interrupteurs (§5), **NULL valant la règle 7** »*. Il n'existe pas.
  - **Le `ton` partagé n'est pas reçu.** Le §4 dit que la couche contrat le **reçoit**, sans en porter de copie. L'appel du retour n'envoie que la phrase de rôle et le gabarit substitué ; `scriptorium_params.rag_prompt_ton` n'est lu **nulle part** dans la chaîne.

  ✓ **Vérifié au même passage, et sain** : les **deux sens de « registre »** ne se confondent nulle part dans le code. `{{REGISTRE}}` ne reçoit que le registre de **retour**, typé sur ses trois valeurs, et la clause *« interrogatif en v1 seulement »* est déjà tenue **par le code**, avec alerte quand il rétrograde.

---

## 7. Ce qui ne relève d'aucun chantier

**La lettre d'information de la loi 25.** Son contenu fait foi au `06-Palimpseste.md` §7, et elle est due avant la première passation. **Elle ne touche pas la plateforme et n'appartient à aucun lot** — c'est une pièce à écrire, pas à construire.
