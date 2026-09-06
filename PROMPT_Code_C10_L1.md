# PROMPT — Session Code : C10-L1 — « La semaine comptée se ferme »

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5, le **2026-09-05** au soir, à partir d'une décision de Louis prise le même jour, écran et base sous les yeux. Ce que le lot construit, son manifeste et son « fait quand » sont recopiés ci-dessous **avec leurs versions au moment de l'écriture**. ⚠️ **Lis d'abord la section qui suit : elle dit ce que la fabrication n'a pas pu écrire dans la source, et ce que tu vérifies avant tout.**
>
> ⛔⛔ **DÉCISION DE LOUIS, 05/09 AU SOIR : AUCUN INTERRUPTEUR.** La fermeture est une règle de l'assiduité, pas une fonctionnalité qui s'essaie — même motif que `C4-L13`. Tu n'ajoutes ni colonne à `scriptorium_params`, ni migration, ni porte. La règle « flag OFF » d'`AGENTS.md` est levée pour ce lot par cette décision, écrite au `07-` §2, chapitre `C10`.
>
> ⭐⭐ **TON LOT N'INVENTE AUCUN ÉTAT : IL LIT UN FAIT QUI EXISTE DÉJÀ EN BASE — « l'assiduité de cette semaine a été jouée pour cet élève » — ET IL EN TIRE UNE FERMETURE.** Aujourd'hui, un exercice du routeur reste jouable pour toujours : rien ne le ferme, rien ne le grise, il reste dans la liste « à faire », et un rendu tardif est mesuré par la chaîne alors que **la ligne d'assiduité de sa semaine est figée depuis le lundi 14:00**. Mesuré en production le 05/09 : **3 v1 rendues les 1er et 2 septembre sur le cycle du 24/08**, comptées nulle part. La décision de Louis : **au moment où l'assiduité est jouée, les exercices de la semaine comptée cessent d'être jouables.**

---

## ⚠️⚠️ CE QUE LA FABRICATION N'A PAS PU FAIRE — et ce que tu vérifies avant tout

| | Le fait | Ce que tu en fais |
|---|---|---|
| **①** | ✅ **L'entrée `C10-L1` du `07-Implementation.md` §2 EST ÉCRITE le 05/09 au soir, à la demande de Louis** — chapitre **`### C10 — la semaine se ferme`**, après `C7` ; le `07-` passe en **2.78**, et `derive-instruments --ecris` est rejoué *(diff : la version et l'empreinte, rien d'autre)*. Le §I en fin de prompt en garde la copie. ⚠️ **Rien n'est commité** dans le dépôt de conception — on n'y commite que sur demande. | ⛔ **Ton contrôle d'entrée commence là** : ouvre le `07-` §2, chapitre `C10`, et vérifie que l'entrée porte **mission, « fait quand » et manifeste** tels qu'au §I. Un écart se signale, il ne se corrige pas. ⚠️ Si `derive-instruments --verifie` dit DIVERGE à ton arrivée, **une autre séance a bougé une source après le 05/09** : lis son diff avant de rejouer `--ecris`, et ne rejoue que si le diff ne porte que version et empreinte. |
| **②** | ✅ **L'allumage, mesuré PAR REQUÊTE le 05/09** : `scriptorium_params.exercices_actif` à ON en production. Le routeur tourne depuis le 31/08 *(481 dépôts du routeur sur le cycle du 31/08, 62 élèves)*. | **Mesure-le toi-même** *(l'allumage se mesure, il ne se recopie pas)*. ⛔ Tu ne bascules aucun interrupteur. |
| **③** | ⭐ **Ta boîte aux lettres est VIDE — le lot est né le 05/09.** Mais **trois relevés te concernent** *(`C4-L13`, `C4-L12`, `C6-L2`)* et la règle de manifeste t'interdit d'aller les lire. | **Tout ce qui t'était adressé est ici, aux pièges.** Tu n'as aucun relevé à ouvrir. |
| **④** | ✅ **L'interrupteur est TRANCHÉ : aucun** *(décision de Louis, 05/09 au soir, en tête de ce prompt et au `07-` §2, chapitre `C10`)*. Un interrupteur aurait été une colonne de `scriptorium_params`, donc une migration ; `C4-L13` avait refusé le sien pour le même motif. | **Tu ne poses ni colonne, ni migration, ni porte.** Si une session future te demande un flag, c'est une décision à reprendre avec Louis, pas un geste de code. |

---

## Le manifeste — *(proposé par la fabrication, §I ; versions du 05/09)*

> *Manifeste* : **ce document, §1.1, §1.5 et §2** *(entrées `C4-L12`, `C4-L13`, `C6-L2`, `C6-L3`)* · `06-Palimpseste.md` **§2 et §5** — **relu et validé** · `02-exercices.md` **§6.C et §6.D** · `01-routeur.md` **§5**.

« Ce document » est le `07-Implementation.md`. **Quatre pièces.**

| Pièce | Où | Statut requis | Au moment de l'écriture *(05/09)* |
|---|---|---|---|
| `07-Implementation.md`, **§1.1** *(les statuts du dépôt — `assigne → ouvert → v1_remis → retour_publie → vf_remis → clos`, plus `abandonne` et `retire` ; le retrait sort du dénominateur « pour l'avenir seulement »)*, **§1.5** *(`assiduite_hebdo`, par élève et par semaine, la semaine étant le CYCLE ; « une semaine déjà arrêtée ne se réécrit jamais »)*, **§2** *(les entrées `C4-L12` et `C4-L13` — un seul déclencheur hebdomadaire —, `C6-L2` — l'écran de la semaine et son bilan —, `C6-L3` — le bonus)* | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | aucun — un lot n'exige pas un statut de la source qui le déclare | **VERSION 2.78** · RELU ET VALIDÉ · ⚠️ **le §4 est GELÉ** ; ouverts à l'implémentation : le §1, le §5, l'inventaire des lots du §2 |
| `06-Palimpseste.md`, **§2** *(le déroulé d'un exercice — les six temps, la semaine de travail, « jamais à cheval sur deux semaines »)*, **§5** *(l'assiduité — « une semaine est FAITE quand l'élève a rendu au moins trois quarts de ses exercices ASSIGNÉS »)* | même dépôt | ⛔ **relu et validé** — *le seul statut exigé : ton lot ferme ce que le §5 compte* | **VERSION 2.6** · VALIDÉ ET GELÉ *(vaut relu et validé)* |
| `02-exercices.md`, **§6.C** *(l'écran de la semaine — ce que l'élève voit d'un coup d'œil)*, **§6.D** *(le déroulé et la passation — l'obligation de lecture du retour, étape 17)* | même dépôt | **déposé** | **VERSION 6.5** · VALIDÉ ET GELÉ |
| `01-routeur.md`, **§5** *(la construction de la semaine ; le pull — « un exercice demandé à la fois, JAMAIS IMPOSÉ »)* | même dépôt | **déposé** | **VERSION 5.8** · VALIDÉ ET GELÉ |

### ⚠️ Ce que le manifeste ne nomme pas, et pourquoi tu le lis quand même

- **`07-` §2, entrée `C4-L13`** — *« ce lot pose la LIGNE et ses deux agrégats ; `C4-L12` remplit les minutes de cette même ligne. Un seul déclencheur hebdomadaire, et c'est celui-ci »*. **C'est le fait que ton lot lit.**
- **`07-` §2, entrée `C6-L2`, et son bilan** — la définition de « à la fin » qu'elle a posée : *« plus aucun dépôt du cycle n'attend un geste de l'élève »*. **Ton lot lui ajoute une seconde porte** *(piège 9)*.

⛔ **`00-`, `03-`, `04-`, `05-`, `08-`, `09-`, `10-` et les fiches de `competences/` ne sont PAS à ton manifeste** : tu n'ouvres aucune compétence, tu n'assembles rien depuis la doctrine, tu n'importes rien, tu ne touches ni au juge ni au gabarit.

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

> **Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, cumulatifs ; « VALIDÉ ET GELÉ » vaut *relu et validé*.
>
> **La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ici, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.
>
> **Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot.

Concrètement : vérifie que les quatre pièces **existent**, que le `07-` porte **VERSION 2.78**, le `06-` **2.6**, le `02-` **6.5**, le `01-` **5.8** — et **fais le geste du §①** *(l'entrée `C10-L1` existe-t-elle ?)*. La clause granulaire est sans objet : tu n'ouvres rien.

### Tes dépendances sont jouées, toutes en production — vérifie-les par leur chemin, pas par leur ligne au plan

- **C4-L13** — la collecte : `utils/assiduite/collecte.ts` *(pur)*, `collecte-serveur.ts` *(`poserLaSemaineDAssiduite`)*, `app/api/assiduite/hebdo/route.ts`. **Une ligne `assiduite_hebdo (eleve_id, cycle_lundi)` par élève actif et par semaine de travail, posée le lundi 18:00 UTC, puis 18:20** *(`vercel.json`)*. *Prod, mesuré le 05/09 : 61 lignes sur le cycle `2026-08-24`, figées depuis le 31/08.*
- **C4-L12** — le routeur : `utils/moteur/cycle-serveur.ts` *(`poserLesSemainesDuRouteur`, greffé sur la même route, APRÈS la collecte)*, `utils/moteur/bonus-serveur.ts` *(le pull)*. **Chaque dépôt du routeur porte `exercices_depots.routeur_decision_id`, et sa décision porte `routeur_decisions.cycle_lundi` et `bonus`.** *Prod : 481 dépôts du routeur sur `2026-08-31`, 1 bonus.*
- **C6-L2** — l'écran de la semaine : `app/eleve/semaine/page.tsx`, `utils/eleve/semaine-serveur.ts` *(`chargerLaSemaineDeLEleve`)*, `utils/eleve/semaine.ts` *(`momentDeLaSemaine`, `friseDeLaSemaine` — purs)*.
- **C4-L3 / écrans de passation du 04/09** — le déroulé : `app/deroule/actions.ts` *(les vingt actions serveur)*, `app/deroule/PageDuDeroule.tsx`, `utils/deroule/vue.ts` *(`chargerLeDeroule`)*, `utils/deroule/depot.ts`, `utils/deroule/acces.ts` *(`lireLaPorte`, `garderEleveDeroule`)*. Les deux routes qui l'affichent : `app/eleve/modules/{codex,aletheia}/exercice/[depotId]/page.tsx`.
- **C4-L6 / Codex** — les listes : `utils/codex-onglets/liste.ts` *(`exercicesMaisonDeLEleve`)*, `regles.ts` *(`etatDeLExercice`, les tons)*, `accueil.ts` *(`grouperPourLAccueil`, `actionDeLaLigne`, `echeanceLisible`, `attenduDeLaLigne`)*, `app/eleve/modules/codex/page.tsx`, `app/eleve/modules/aletheia/exercices/page.tsx`.

**Si l'une manque, arrête-toi et signale-le.**

---

## La mission — ce que le lot construit, et rien d'autre

**Au moment où l'assiduité d'une semaine est jouée pour un élève, les exercices que le routeur lui a assignés sur cette semaine — imposés et bonus — cessent d'être jouables.** Quatre effets, et pas un cinquième :

1. **Le déroulé refuse tout geste de travail** — ouvrir, écrire, remettre la v1 comme la vf, se juger, la crédence, la désignation, la micro-question, la restitution, la confiance, les conditions — **avec le message de Louis, mot pour mot** :
   > **Il n'est plus possible de travailler sur les exercices de cette semaine. De nouveaux exercices t'attendent.**
2. **L'exercice fermé montre trois choses et rien d'autre** : **la consigne**, **la réponse de l'élève** *(sa v1, sa vf si elle existe)*, **son retour** *(et sa lecture reste possible, elle reste due)*. ⛔ **Ni matériau, ni candidats, ni distracteurs, ni zones** : *« il ne faut pas qu'il puisse voir les distracteurs »*.
3. **Il sort de la liste « à faire »** *(Codex et Aletheia)* : il s'y lit « fermé », sans bouton. Dans « Ma semaine », la semaine précédente le montre gris, « fermé », et le bouton disparaît.
4. **Le bilan de « Ma semaine » s'ouvre dès que l'assiduité est jouée**, même si des exercices restent non faits.

**Hors du lot, nommément** : les exercices assignés par le professeur *(`routeur_decision_id` nul — passations en classe et assignations à la main : c'est `C10-L2`, un bouton du professeur)* · le retrait par le professeur *(`retire`, il reste permis)* · les retours non écrits *(`C9`)* · la chaîne de mesure · toute migration · tout interrupteur *(§④)*.

---

## Les pièges — tirés des sources et du code, chacun avec son renvoi

### A. Le marqueur de fermeture — un FAIT lu, jamais un statut écrit

1. ⛔⛔ **« FERMÉ » N'EST PAS UN STATUT, ET TU N'EN ÉCRIS AUCUN.** Un exercice du routeur assigné sur le cycle **C** est fermé **si et seulement si la ligne `assiduite_hebdo (eleve_id, C)` existe**. C'est exactement « l'assiduité de cette semaine a été jouée pour cet élève » *(`07-` §1.5 ; entrée `C4-L13` : « une ligne posée n'est plus touchée »)*. **Aucune colonne neuve, aucune migration, aucun cron, rien à tamponner, rien à rejouer** — et une ligne posée au second passage de 18:20 ferme au second passage, d'elle-même.
   **Pourquoi pas un statut** : la collecte *(`comptesDeLaSemaine`)* lit `statut` par `estRendu` *(`utils/routeur/assiduite.ts`, `STATUTS_RENDUS`)*, et la matrice de pilotage, les faits/imposés de Scriptorium *(`utils/pilotage/attention-serveur.ts`)* et les règles de stagnation lisent le même `statut`. Un `ferme` qui écraserait `v1_remis` ou `retour_publie` ferait mentir tout ce qui compte. ⛔ **Et `abandonne`, `non_fait`, `clos` ont chacun un sens que le `02-` §6 et le `07-` §1.1 fixent** — tu n'en détournes aucun.
2. ⭐ **Un seul module pur porte la règle, et tout le monde l'appelle.** Propose `utils/deroule/fermeture.ts` : `estFermee({ routeurDecisionId, cycleLundi, semainesJouees })` — *dépôt du routeur* **et** *ligne existante* —, testé, sans `server-only`. ⚠️ **Le glob de `npm test` est `utils/**/*.test.ts`** : une règle posée sous `app/` ne serait jamais éprouvée. Un lecteur serveur à côté *(`fermeture-serveur.ts`)* lit les lignes `assiduite_hebdo` de l'élève **une fois** *(`select cycle_lundi where eleve_id = …`)* et rend un `Set<string>` ; les écrans le passent à la règle. ⛔ **Jamais une lecture par exercice** : 160 à 332 ms l'aller-retour depuis Vercel *(relevé du déclencheur, 30/08)*.
3. ⛔ **Le cycle d'un dépôt du routeur se lit sur SA DÉCISION** — `routeur_decisions.cycle_lundi`, **jamais dérivé d'`assigne_at`** ici *(la collecte, elle, dérive d'`assigne_at` parce qu'elle compte AUSSI les dépôts du professeur, dont la décision est absente ou sans cycle — `assignerALaClasse`, `app/prof/conception/actions.ts`, n'écrit pas cette clé)*. Le déroulé charge déjà `routeur_decision_id` *(`utils/deroule/depot.ts`, `CHAMPS`)* ; la liste *(`exercicesMaisonDeLEleve`)* joint déjà `routeur_decisions(bonus)` — **ajoute `cycle_lundi` à cette jointure**, ne fais pas une seconde requête.
4. ⭐ **Un bonus se ferme comme un imposé** *(décision de Louis, 05/09)*. Le pull écrit sa décision **sur le cycle courant** avec `bonus = true` *(`bonus-serveur.ts`)* : la même règle le prend, sans branche. ⚠️ Mais il **ne compte pas** dans l'assiduité *(`comptesDeLaSemaine` le sort des deux côtés — `C6-L3`)* : fermé, il n'entre pas non plus dans la frise ni dans le bilan *(`momentDeLaSemaine` filtre `!e.bonus`)*. **Ne change pas cela.**
5. ⚠️ **Les dépôts SANS décision de routeur ne sont jamais fermés par ce lot** — passations en classe *(lieu `classe`, 70 dépôts du cycle du 24/08 en prod)* et assignations à la main. Par construction de la règle *(piège 1)*, pas par un filtre de plus. *C'est `C10-L2`.*
6. ⚠️ **L'élève inscrit APRÈS le comptage d'une semaine n'a pas de ligne pour elle** *(`C4L13-19`, défaut assumé par Louis le 24/08)* : ses exercices de cette semaine-là, s'il en a, ne se ferment pas. **Ne le répare pas, dis-le au relevé.** *(Il n'en a normalement aucun : le routeur ne l'a pas encore servi.)*

### B. Le déroulé — refuser, puis montrer sans rien laisser fuir

7. ⛔⛔ **CE QUE L'ÉLÈVE NE DOIT PAS VOIR NE DOIT PAS PARTIR DU SERVEUR.** `chargerLeDeroule` *(`utils/deroule/vue.ts`)* construit la vue ; **c'est là, côté serveur, que la vue fermée se réduit** — matériau, candidats, distracteurs, zones, `reponse_attendue`, `version_corrigee` **retirés de l'objet**, pas cachés par une classe CSS ou un `hidden`. Un composant serveur sérialise tout ce qu'il reçoit dans la charge RSC : *« l'exercice pourrait lui être resservi »* — à un autre élève, ou dans un autre cycle du gabarit. Ajoute à `VueDuDeroule` un `fermee: boolean` et laisse le composant se replier dessus.
8. ⭐ **La garde vit dans CHAQUE action de travail, pas seulement dans la page.** `app/deroule/actions.ts` : `actionOuvrir`, `actionEnregistrerBrouillon`, `actionRemettre` *(v1 ET vf)*, `actionCredence`, `actionDesignation`, `actionOuvrirSeJuger`, `actionSeJuger`, `actionMicroQuestion`, `actionRestitution`, `actionConfiance`, `actionConditions`, `actionCollageBloque`, `actionCompterUneAide`. **Chacune relit le dépôt et refuse** avec le message de la mission — un onglet resté ouvert depuis dimanche soir doit être refusé à 14:01, pas seulement à la prochaine navigation. ⛔ **Restent PERMISES** : `actionValiderLaLecture` *(piège 10)*, `actionPointsContestes` et `actionContester` *(contester un retour est un droit sur le retour, pas un travail sur l'exercice)*, `actionSignalerUnProbleme` / `actionRetirerLeSignalement` *(le signalement d'un exercice par l'élève, 31/08)*, `actionEtatDeLAttente`, `actionChargerLeDeroule`.
9. ⭐ **Le message est celui de Louis, et il est UNIQUE** : *« Il n'est plus possible de travailler sur les exercices de cette semaine. De nouveaux exercices t'attendent. »* Il s'affiche **une fois** en tête de la vue fermée, et il est la réponse de chaque action refusée. ⚠️ **Il peut être faux pendant vingt minutes** : entre 18:00 et 18:20 UTC, un élève coupé par l'horloge au premier passage *(`enFileBornee`, `utils/moteur/cadence.ts`)* a sa semaine fermée et pas encore la nouvelle. **Assumé** — le second passage le sert ; ne bricole pas une seconde phrase.
10. ⛔⛔ **UN RETOUR NON LU BLOQUE TOUS LES RENDUS DE L'ÉLÈVE** *(`utils/retours-lus.ts`, `messageSiRetoursNonLus` — l'obligation de lecture du `02-` §6.D, étape 17)*. Si la fermeture empêchait de valider la lecture d'un retour arrivé après 14:00, **l'élève serait bloqué sur toute la semaine suivante**. La lecture du retour reste donc un geste permis sur un exercice fermé, et le bouton reste. **Éprouve-le par l'échec** : ferme, publie un retour, vérifie que le rendu suivant est bloqué, valide la lecture sur l'exercice fermé, vérifie qu'il se débloque.
11. ⚠️ **La vf a déjà une échéance rognée au dimanche** *(`echeanceDeLaVersionFinale`, `utils/deroule/echeance.ts`)*. Après fermeture, `attenduDeLaLigne` *(`accueil.ts`)* ne doit plus dire « version finale à rendre avant dim. » ni `echeanceLisible` « à rendre dim. 6 — dépassé » : la ligne dit **« fermé »**, et rien d'autre sur le temps. ⚠️ **Le retour arrivé après la fermeture** *(rendu à 13:59, retour à 14:00)* : lisible, jamais de vf — le dépôt reste `retour_publie` pour toujours, et c'est correct.
12. ⚠️ **`v1_remis` sans retour** *(46 dépôts en prod le 05/09, `C9`)* : fermé, il continue de dire « rendu — retour en préparation ». **Tu ne touches pas à cet état** — Louis l'a dit : *« il faut que je creuse »*. Ne fabrique pas « fermé, sans retour ».
13. ⚠️ **Un brouillon `ouvert` non remis est perdu à la fermeture** *(décision de Louis)*. La vue fermée d'un `ouvert` montre la consigne et **le brouillon tel quel, en lecture seule** *(c'est « sa réponse »)*, sans bouton.
14. ⚠️ **Le déroulé est partagé par Codex et Aletheia** *(`PageDuDeroule`, importé par les deux routes)* : une seule vue fermée, pas deux.

### C. Les listes et « Ma semaine »

15. ⭐ **`etatDeLExercice(statut, retour)` est pur et ne sait rien du temps** *(`regles.ts`)*. Donne-lui la fermeture en paramètre et fais-le rendre `{ ton: 'clos', libelle: 'fermé' }` pour `assigne` et `ouvert` fermés. ⛔ **Mais l'obligation de lecture passe DEVANT** : un `retour_publie` non lu fermé reste `a_lire` / « retour à lire » — c'est déjà la première ligne de la fonction, ne la déplace pas. Un `v1_remis` fermé reste `attente` *(piège 12)*. Le reste *(`clos`, `vf_remis`)* ne change pas.
16. ⭐ **La liste « à faire » se vide d'elle-même** : `grouperPourLAccueil` groupe par ton, et `actionDeLaLigne('clos')` rend `null` *(`accueil.ts`)*. **Ne réécris pas le regroupement.** Vérifie les deux listes *(Codex `page.tsx`, Aletheia `exercices/page.tsx`)*.
17. ⭐ **« Ma semaine », semaine précédente** *(`?cycle=`)* : la ligne se lit « fermé », grise, sans bouton *(`actionDeLaLigne` rend `null`)*. La consigne reste cliquable vers la vue fermée *(mission, effet 2)*.
18. ⭐⭐ **LE BILAN — deux portes, et la nouvelle est la tienne.** `momentDeLaSemaine` *(`utils/eleve/semaine.ts`)* rend `'bilan'` quand plus aucun imposé n'appelle un geste *(`APPELLE_UN_GESTE = a_lire, a_faire, en_cours`)* — la définition de `C6-L2`. **Ajoute** : `'bilan'` aussi **quand la ligne d'assiduité du cycle existe**, quels que soient les tons *(décision de Louis, point 8)*. ⚠️ Mais garde la première porte telle quelle *(l'élève qui finit le mercredi a son bilan le mercredi)*. ⚠️ Et `ceQuiManqueAuBilan` dit déjà « une de tes copies n'a pas encore été corrigée » : un bilan ouvert par la fermeture sur des copies non faites doit dire **combien n'ont pas été faites** — *un vide s'explique* *(`C5-L4`, `C6-L2` §10)*. Une phrase, pas un tableau.
19. ⚠️ **La ligne d'assiduité de la semaine COURANTE n'existe jamais** *(le cron compte la semaine écoulée)* : la semaine en cours ne se ferme donc jamais par ce chemin, quelle que soit l'heure. **C'est voulu.** Ne dérive rien du calendrier : le fait, c'est la ligne.

### D. Ce que la fabrication a mesuré, et que tu remesures

20. **Prod, 05/09** *(PostgREST, lecture seule)* : cycle `2026-08-24` → 70 dépôts, tous `classe`, **sans décision de routeur** ; cycle `2026-08-31` → 481 dépôts du routeur *(282 `assigne`, 45 `ouvert`, 49 `v1_remis`, 94 `clos`, 7 `retire`, 2 `non_fait`, 1 bonus)*. `assiduite_hebdo` : 61 lignes sur `2026-08-24`, **aucune sur `2026-08-31`** avant lundi 07/09 18:00 UTC. ⭐ **Donc, en prod, la première fermeture réelle tombe le lundi 07/09 à 14:00 Montréal**, sur les 481 dépôts du 31/08 — et **rien ne se ferme avant**, même déployé le samedi. *Le contrôle du lundi : après 18:06 UTC, la vue d'un `assigne` du 31/08 refuse ; celle d'un `assigne` du 07/09 travaille.*
21. **Bac à sable, 05/09** : **0 ligne `assiduite_hebdo`, 0 `routeur_decisions`**, 17 inscrits, 26 dépôts maison dont 16 `assigne`. ⭐ **Le décor existe** : `scripts/recette/essai-cron-hebdo.ts` *(`--constat` / `--essai` / `--retire`, bac à sable seulement, registre AVANT)* rejoue le cron d'un lundi donné et pose **les lignes ET les décisions**. `node --import ./scripts/register-calibration-resolver.mjs`, à cause du `server-only`. ⚠️ Le profil des cookies du smoke CDP est **partagé entre séances** ; ⚠️ le tap iPhone efface la sélection avant le click *(`--ios`)* — sans objet pour ce lot, qui ne surligne rien.
22. ⛔ **`supabase-js` ne lève pas** : `{ error }` partout, une lecture mal posée se lit comme une base vide. Ton lecteur de lignes *(piège 2)* **échoue en le disant** *(`incidents`, comme `chargerLaSemaineDeLEleve`)* — et **une lecture ratée n'est PAS une fermeture** : dans le doute, l'exercice reste ouvert *(fermer sur une erreur priverait un élève d'un travail qui compte encore)*. Éprouve ce sens-là.
23. ⚠️ **`<details open>` et l'hydratation** : Chrome restaure l'état au rechargement *(mémoire `reference_details_open_hydratation`)* — si tu replies des sections de la vue fermée, ne dépends pas de `open`.
24. ⚠️ **`flex-wrap` ne replie rien sans `min-width`** *(la ligne de synthèse écrasée à 12 px, tests verts)* : le message de fermeture en tête de vue se mesure aux trois largeurs.

---

## La convention de couture — ce que tu éprouves par EXÉCUTION

Ton lot succède à `C4-L13`, `C4-L12` et `C6-L2`. **Trois coutures, nommées sous la forme vérifiable** *(qui écrit · qui lit · un chemin réel y mène-t-il ?)* :

| couture | qui écrit | qui lit *(toi)* | l'épreuve |
|---|---|---|---|
| **la ligne** `assiduite_hebdo (eleve_id, cycle_lundi)` | `poserLaSemaineDAssiduite` — le cron du lundi, deux passages | ton lecteur *(piège 2)* | un élève du bac à sable, un dépôt du routeur sur le cycle **C**, **pas de ligne** → tout est ouvert ; `essai-cron-hebdo --essai` pose la ligne de **C** → **tout se ferme** : les 13 actions refusent, la vue est réduite, la liste dit « fermé », le bilan s'ouvre ; `--retire` → tout rouvre |
| **la décision** `routeur_decisions.cycle_lundi` + `bonus` via `exercices_depots.routeur_decision_id` | `poserLesSemainesDuRouteur`, `bonus-serveur` | ton `estFermee` | un dépôt **sans** décision *(assigné par le prof)* sur le même cycle, même élève, ligne posée → **reste ouvert** ; un bonus sur **C** → fermé |
| **l'obligation de lecture** `exercices_retours.lu_at` | l'élève, `actionValiderLaLecture` | `retoursNonLus` | piège 10, dans les deux sens |

**Le script se laisse au dépôt** : `scripts/recette/couture-c10l1.mjs`, mode constat, registre AVANT, retrait par marque, contrôles comptés et **confrontés en base par requête**. **Bac à sable uniquement** — aucune écriture en production par ce lot.

**Puis le smoke élève, à l'œil, aux trois largeurs** *(375 · 768 · 1280 — `capture-page.mjs` émule par CDP ; ⛔ `chrome --window-size` ne fait pas un écran de 375 px)* : la vue fermée d'un `assigne`, d'un `ouvert` avec brouillon, d'un `retour_publie` non lu, d'un `vf_remis` ; la liste Codex ; « Ma semaine » sur la semaine précédente, et son bilan. **Montre le rendu avec les données réelles du décor** *(consignes de 129 caractères en médiane, pas un titre de 31)* — pas « ça compile », pas « les tests passent ».

---

## Le « fait quand » — *(proposé par la fabrication, §I ; ne se négocie pas en séance)*

> *Fait quand* : **un exercice assigné par le routeur — imposé ou demandé — sur un cycle dont la ligne d'assiduité de l'élève existe n'accepte plus aucun geste de travail** : ouvrir, écrire, remettre v1 ou vf, se juger, crédence, désignation, restitution, confiance, conditions sont **refusés côté serveur** avec le message *« Il n'est plus possible de travailler sur les exercices de cette semaine. De nouveaux exercices t'attendent. »* ; **sa vue ne porte que la consigne, la réponse de l'élève et son retour** — matériau, candidats, distracteurs et zones **absents de la charge servie**, pas masqués ; **la lecture du retour reste possible et reste due** ; **il quitte la liste « à faire »** de Codex et d'Aletheia et se lit « fermé » ; **la semaine précédente de « Ma semaine » le montre fermé sans bouton, et son bilan est ouvert** ; **un dépôt sans décision de routeur, un dépôt de la semaine courante, un dépôt dont la ligne est illisible restent ouverts** ; **aucun statut n'est écrit, aucune migration, aucun interrupteur** ; le tout **prouvé par exécution en bac à sable** *(`couture-c10l1.mjs`, décor posé et retiré)* **et à l'œil aux trois largeurs**.

---

## Les conventions de dépôt et de clôture

- **Aucune migration, aucun interrupteur** : rien au `SUIVI_SQL.md`. Si ton lot croit en avoir besoin d'une, il s'arrête et le dit — c'est que la règle du piège 1 a été perdue en route.
- **Ta section au `SUIVI_tests_manuels.md`** : `## C10-L1 — La semaine comptée se ferme (séance du …)` — prouvé en séance coché **avec sa preuve**, ce qui reste décoché **avec sa condition de reprise** *(au moins : **`C10L1-x` — la première fermeture réelle en production, lundi 07/09 après 18:06 UTC**, et **la fermeture d'un élève servi au second passage, 18:20**)*.
- **Une source trouvée fausse se marque, elle ne se corrige pas** : `[faux]` au point de l'erreur, une ligne à DETTES de `INVENTAIRE_Non_Tranches.md`.
- **Ton relevé** : `RELEVE_C10_L1_<date>.md` ; ce qui est pour `C10-L2` ou pour `C9` va **dans leur boîte** au `PLAN_DE_CHANTIER.md` §5, par destinataire.
- ⛔ **`git add -A` est interdit** ; l'arbre porte le travail d'autres séances *(le gabarit)*. Fichier par fichier, `git status --short` avant chaque commit. **Pousser, c'est déployer** — et déployé avant lundi 18:00 UTC, ce lot **ne ferme rien avant lundi 18:00 UTC** *(piège 20)*.

---

## §H — Ce qui est hors de toi, et où ça va

- **`C10-L2` — le bouton du professeur « Clore les dépôts »** sur une passation en classe *(prompt fabriqué le même jour)*. Si ton `estFermee` peut lui servir *(un `ouvert_par_prof_at` fermé par un `clos_par_prof_at` ?)*, **dis-le dans sa boîte**, ne le construis pas.
- **`C9`** — les 46 `v1_remis` sans retour ; « fermé sans retour » est à eux.
- **Les assignations à la main du professeur** *(maison, `assignerALaClasse`)* : Louis les clôt lui-même ; leur bouton n'existe pas encore — **une ligne dans la boîte de `C10-L2`**.
- **La dérive d'une heure à l'heure normale** *(`0 18 * * 1` = 13:00 à Montréal dès le 01/11)* : ce n'est pas toi.

---

## §I — L'entrée `C10-L1` du `07-Implementation.md` §2 — copie de ce qui est écrit dans la source

*(Écrite le 05/09 au soir, à la demande de Louis, en tête du chapitre **`### C10 — la semaine se ferme`**, après `C7` ; `07-` **2.78**. La source fait foi ; cette copie est là pour que tu n'aies rien à chercher.)*

> **C10-L1 — La semaine comptée se ferme.** Au moment où l'assiduité d'une semaine est jouée pour un élève *(§1.5 ; `C4-L13`)*, les exercices que le routeur lui a assignés sur cette semaine — imposés et demandés *(`C6-L3`)* — **cessent d'être jouables** : le déroulé refuse tout geste de travail, v1 comme vf, avec un message unique — *« Il n'est plus possible de travailler sur les exercices de cette semaine. De nouveaux exercices t'attendent. »* —, l'exercice ne montre plus que **la consigne, la réponse de l'élève et son retour** *(jamais le matériau ni les distracteurs : l'exercice peut être resservi)*, la lecture du retour reste due *(`02-` §6.D)*, l'exercice quitte la liste « à faire » et se lit « fermé », et **le bilan de la semaine s'ouvre** *(`C6-L2`)*, même sur des exercices non faits. Un brouillon non remis se perd. **Le marqueur est un fait, pas un statut** : la ligne `assiduite_hebdo` de l'élève et du cycle **existe** — aucune colonne, aucun cron, aucun statut écrit ; les statuts gardent leur sens *(§1.1)* et l'assiduité, le pilotage et la stagnation continuent de les lire. **Un dépôt sans décision de routeur n'est jamais fermé par ce lot** *(passations en classe, assignations à la main : `C10-L2`)*. *Mesuré en prod le 05/09 : 3 v1 rendues après le comptage de leur semaine, comptées nulle part ; 15 dépôts de passation en classe encore ouverts dix jours après.*
>
> *Fait quand* : **[le « fait quand » ci-dessus, verbatim]**.
>
> *Manifeste* : **ce document, §1.1, §1.5 et §2** *(entrées `C4-L12`, `C4-L13`, `C6-L2`, `C6-L3`)* · `06-Palimpseste.md` **§2 et §5** — **relu et validé** · `02-exercices.md` **§6.C et §6.D** · `01-routeur.md` **§5**.
>
> **C10-L2 — Le professeur clôt les dépôts d'une passation.** Miroir du geste « ouvrir les dépôts » *(`C4-L4`, `ouvert_par_prof_at`)* : un bouton sur la page de la passation en classe pose **`abandonne`** *(§1.1 — « non-geste de l'élève », au dénominateur, jamais rendu)* sur les dépôts `assigne` et `ouvert` de l'instance ; les copies remises ne bougent pas ; le chemin de remise refuse déjà « Ce dépôt est clos ». **Confirmation, jamais un refus** ; idempotent. Les assignations à la main de la maison sont closes de la même main — leur bouton reste à nommer.
