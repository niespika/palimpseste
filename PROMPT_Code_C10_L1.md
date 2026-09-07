# PROMPT — Session Code : C10-L1 — « La semaine comptée se ferme »

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5, dans la **nuit du 6 au 7 septembre 2026**. Il **remplace la version du 05/09** : les quatre sources du manifeste ont bougé depuis *(le `07-` de 2.78 à **2.81**, le `01-` de 5.8 à **5.15**, le `02-` de 6.5 à **6.7**)*, et la relecture contre les sources a **corrigé trois pièges de cette version-là**. Ils sont signalés ⟲ là où ils se trouvent.
>
> ⛔⛔ **DÉCISION DE LOUIS, 05/09 AU SOIR : AUCUN INTERRUPTEUR.** La fermeture est une règle de l'assiduité, pas une fonctionnalité qui s'essaie — même motif que `C4-L13`. Ni colonne à `scriptorium_params`, ni migration, ni porte. ⚠️ **C'est une exception assumée, pas un oubli** : `AGENTS.md` porte *« toute fonctionnalité nouvelle naît derrière un flag OFF »*, et le `07-` §1.5 écrit *« un lot peut avoir le sien, et il naît à OFF au même emplacement »*. La décision de Louis lève les deux **pour ce lot**, et elle est écrite au `07-` §2, chapitre `C10`. Elle se défend : un interrupteur ne serait qu'un `if` sur une **dérivation**, sans écriture à défaire — le retour en arrière est un redéploiement, pas une réparation de données.
>
> ⭐⭐ **TON LOT N'INVENTE AUCUN ÉTAT : IL LIT UN FAIT QUI EXISTE DÉJÀ EN BASE — « l'assiduité de cette semaine a été jouée pour cet élève » — ET IL EN TIRE UNE FERMETURE.** Aujourd'hui, un exercice du routeur reste jouable pour toujours : rien ne le ferme, rien ne le grise, il reste dans la liste « à faire », et un rendu tardif est mesuré par la chaîne alors que la ligne d'assiduité de sa semaine est figée depuis le lundi 18:00 UTC.
>
> ⏱️⏱️ **ET IL Y A UNE HORLOGE SUR CE LOT — LIS LE PIÈGE 40 AVANT DE COMMENCER.** La **première fermeture réelle en production tombe ce lundi 7 septembre à 18:00 UTC** *(14:00 à Montréal)*, sur **480 dépôts du routeur**, dont **212 jamais rendus**. Mesuré en prod à 02:20 UTC ce même lundi. Rien ne se ferme avant cet instant, même déployé ; tout se ferme d'un coup à cet instant, s'il est déployé.

---

## ⚠️⚠️ CE QUE LA FABRICATION A MESURÉ POUR TOI — et ce que tu vérifies avant tout

| | Le fait | Ce que tu en fais |
|---|---|---|
| **①** | ✅ **L'entrée `C10-L1` du `07-Implementation.md` §2 EST ÉCRITE ET COMMITÉE** — chapitre `### C10 — la semaine se ferme`, après `C7` ; commit `ef56909` du 05/09, `07-` alors en 2.78. **Son texte n'a pas dérivé d'un mot depuis** : il est identique en 2.81. Le §I en fin de prompt en garde la copie. | ⛔ **Ton contrôle d'entrée commence là** : ouvre le `07-` §2, chapitre `C10`, et vérifie que l'entrée porte **mission, « fait quand » et manifeste** tels qu'au §I. Un écart se signale, il ne se corrige pas. |
| **②** | ⚠️ **Le dépôt de conception porte du travail NON COMMITÉ** : le `07-` est en **2.81** et le `01-` en **5.15** dans l'arbre, quand les derniers commits disent 2.80 et 5.12. *(On n'y commite que sur demande.)* | **Lis l'arbre, pas le dernier commit.** Les versions de ton manifeste ci-dessous sont celles de l'arbre au 07/09 02:00 UTC. |
| **③** | ✅ **L'allumage, mesuré PAR REQUÊTE le 07/09 à 02:25 UTC.** **Prod** : `exercices_actif` **ON**, `routeur_actif` **ON**, `gabarit_actif` **OFF**, `juge_documents_actif` **OFF** ; *la colonne `chaine_cle_actif` n'existe pas en prod.* **Bac à sable** : `gabarit_actif` **ON**, `juge_documents_actif` **ON**, `chaine_cle_actif` **OFF**, et ⚠️ **`signalement_exercice_actif` OFF** alors qu'il est **ON en prod**. | **Remesure-le toi-même** *(l'allumage se mesure, il ne se recopie pas — il bouge entre deux séances)*. ⛔ Tu ne bascules aucun interrupteur. ⚠️ Le décalage du signalement compte pour ta recette : voir le piège 18. |
| **④** | ⭐ **Ta boîte aux lettres du `PLAN_DE_CHANTIER.md` §5 est VIDE — le lot est né le 05/09**, après la dernière entrée de la boîte. Mais **quatre lots dont tu dépends ont laissé des relevés**, et la règle de manifeste t'interdit d'aller les lire. | **La fabrication les a lus à ta place, en entier** *(`RELEVE_C4_L13`, `RELEVE_C4_L12`, `RELEVE_C6_L2`, `RELEVE_C6_L3`)*. **Tout ce qui t'était destiné est ici, aux pièges.** Tu n'as aucun relevé à ouvrir. |
| **⑤** | ⛔⛔ **DEUX ARBRES DE CODE COEXISTENT, ET ILS DIVERGENT SUR TES DEUX FICHIERS.** `feat/ecrans-passation` est **30 commits devant `main`**, `main` **22 devant elle**, et la branche porte seule `utils/deroule/etapes.ts` *(193 lignes)*, **+110 lignes sur `utils/deroule/vue.ts`** et **+6 sur `app/deroule/actions.ts`**. | **Piège 46 : mesure sur quel arbre tu es AVANT d'écrire une ligne**, et dis-le au relevé. |

---

## Le manifeste — *(recopié verbatim du `07-Implementation.md` §2, chapitre `C10` ; versions de l'arbre au 07/09)*

> *Manifeste* : **ce document, §1.1, §1.5 et §2** *(entrées `C4-L12`, `C4-L13`, `C6-L2`, `C6-L3`)* · `06-Palimpseste.md` **§2 et §5** — **relu et validé** · `02-exercices.md` **§6.C et §6.D** · `01-routeur.md` **§5**.

« Ce document » est le `07-Implementation.md`. **Quatre pièces**, toutes dans `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/`.

| Pièce | Statut requis | Au moment de l'écriture *(07/09, 02:00 UTC)* |
|---|---|---|
| `07-Implementation.md`, **§1.1** *(les statuts du dépôt — `assigne → ouvert → v1_remis → retour_publie → vf_remis → clos`, plus `abandonne` et `retire` ; **le rattachement d'un dépôt à sa semaine**, ligne 157)*, **§1.5** *(`assiduite_hebdo`, par élève et par cycle ; « une semaine déjà arrêtée ne se réécrit jamais »)*, **§2** *(les entrées `C4-L12`, `C4-L13`, `C6-L2`, `C6-L3`)* | aucun — un lot n'exige pas un statut de la source qui le déclare | **VERSION 2.81** · **RELU ET VALIDÉ** · ⚠️ **le gel est section par section** : §2 *(la règle de manifeste seule)*, §3, §4 et §6 **GELÉS** ; le §1 et l'inventaire des lots du §2 **ouverts à l'implémentation** ; le §7 est un **REGISTRE** |
| `06-Palimpseste.md`, **§2** *(le déroulé d'un exercice — les six temps, la semaine de travail, « jamais à cheval sur deux semaines », **le temps 6 : « il se clôt par la validation "lu" »**)*, **§5** *(l'assiduité — « une semaine est FAITE quand l'élève a rendu au moins trois quarts de ses exercices ASSIGNÉS »)* | ⛔ **relu et validé** — *le seul statut exigé : ton lot ferme ce que le §5 compte* | **VERSION 2.6** · **VALIDÉ ET GELÉ** *(vaut relu et validé)* |
| `02-exercices.md`, **§6.C** *(l'écran de la semaine — ce que l'élève voit d'un coup d'œil)*, **§6.D** *(le déroulé et la passation en classe — l'obligation de lecture, étape 17)* | **déposé** | **VERSION 6.7** · **VALIDÉ ET GELÉ** |
| `01-routeur.md`, **§5** *(la construction de la semaine ; le budget optionnel — « un exercice demandé à la fois » ; « le bonus se marque **au journal** »)* | **déposé** | **VERSION 5.15** · **VALIDÉ ET GELÉ** |

### ⚠️ Ce que le manifeste ne nomme pas, et pourquoi tu le lis quand même

- **`07-` §2, entrée `C4-L13`** — *« ce lot pose la LIGNE et ses deux agrégats ; `C4-L12` remplit les minutes de cette même ligne. Un seul déclencheur hebdomadaire, et c'est celui-ci »*. **C'est le fait que ton lot lit.**
- **`07-` §2, entrée `C6-L2`** — la définition de « à la fin » qu'elle a posée. **Ton lot en discute une clause** *(piège 34, et c'est l'arbitrage du lot)*.
- **`07-` §1.1, ligne 157** — *« LE RATTACHEMENT D'UN DÉPÔT À SA SEMAINE SE DÉRIVE D'`assigne_at`, ET IL N'A PAS DE COLONNE »*. **C'est la jointure centrale de ton lot** *(piège 2)*.

⛔ **`00-`, `03-`, `04-`, `05-`, `08-`, `09-`, `10-` et les fiches de `competences/` ne sont PAS à ton manifeste** : tu n'ouvres aucune compétence, tu n'assembles rien depuis la doctrine, tu n'importes rien, tu ne touches ni au juge ni au gabarit.

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

> **Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, cumulatifs ; « VALIDÉ ET GELÉ » vaut *relu et validé*.
>
> **La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ici, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.
>
> **Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot.

Concrètement : vérifie que les quatre pièces **existent**, que le `07-` porte **VERSION 2.81**, le `06-` **2.6**, le `02-` **6.7**, le `01-` **5.15** — et **fais le geste du §①** *(l'entrée `C10-L1` est-elle intacte ?)*. La clause granulaire est sans objet : tu n'ouvres aucune compétence.

⚠️ **Le `01-` bouge vite.** Il est passé de **5.8 à 5.15 en cinq jours** *(refonte du routeur « à l'heure de la clé », 05→07/09)*. Une version encore différente à ton arrivée n'est pas une alerte : **relis son §5**, qui est ta seule pièce, et vérifie que « le bonus se marque au journal » et « le pull sert un exercice à la fois » y sont toujours. Le piège 50 dit ce que la refonte change pour toi — **et ce qu'elle ne change pas**.

### Tes dépendances sont jouées, toutes en production — vérifie-les par leur chemin, pas par leur ligne au plan

- **C4-L13** — la collecte : `utils/assiduite/collecte.ts` *(pur)*, `utils/assiduite/collecte-serveur.ts` *(`poserLaSemaineDAssiduite`)*, `app/api/assiduite/hebdo/route.ts`. **Une ligne `assiduite_hebdo (eleve_id, cycle_lundi)` par élève actif et par semaine écoulée**, posée le lundi **18:00 UTC**, puis **18:20** *(`vercel.json`)*.
- **C4-L12** — le routeur : `utils/moteur/cycle-serveur.ts` *(`poserLesSemainesDuRouteur`, greffé sur la même route, **APRÈS** la collecte)*, `utils/moteur/bonus-serveur.ts` *(le pull)*.
- **C6-L2** — l'écran de la semaine : `app/eleve/semaine/page.tsx`, `utils/eleve/semaine-serveur.ts` *(`chargerLaSemaineDeLEleve`)*, `utils/eleve/semaine.ts` *(`momentDeLaSemaine`, `friseDeLaSemaine` — purs)*.
- **C6-L3** — le bonus : la marque vit sur `routeur_decisions.bonus`, lue par la jointure de `exercicesMaisonDeLEleve`.
- **C4-L3 / écrans de passation** — le déroulé : `app/deroule/actions.ts` *(**le portier**, et les vingt actions)*, `app/deroule/PageDuDeroule.tsx`, `utils/deroule/vue.ts` *(`chargerLeDeroule`)*, `utils/deroule/depot.ts`, `utils/deroule/acces.ts`, `utils/deroule/contestation.ts`. Les deux routes qui l'affichent : `app/eleve/modules/{codex,aletheia}/exercice/[depotId]/page.tsx`.
- **C4-L6 / Codex** — les listes : `utils/codex-onglets/liste.ts` *(`exercicesMaisonDeLEleve`)*, `regles.ts` *(`etatDeLExercice`, `TonEtat`)*, `accueil.ts` *(`grouperPourLAccueil`, `actionDeLaLigne`, `echeanceLisible`, `attenduDeLaLigne`)*.

**Si l'une manque, arrête-toi et signale-le.**

---

## La mission — ce que le lot construit, et rien d'autre

**Au moment où l'assiduité d'une semaine est jouée pour un élève, les exercices que le routeur lui a assignés sur cette semaine — imposés et demandés — cessent d'être jouables.** Quatre effets, et pas un cinquième :

1. **Le déroulé refuse tout geste de travail** — ouvrir, écrire, remettre la v1 comme la vf, se juger, la crédence, la désignation, la micro-question, la restitution, la confiance, les conditions — **avec le message de Louis, mot pour mot** :
   > **Il n'est plus possible de travailler sur les exercices de cette semaine. De nouveaux exercices t'attendent.**
2. **L'exercice fermé montre trois choses et rien d'autre** : **la consigne**, **la réponse de l'élève** *(sa v1, sa vf si elle existe, son brouillon s'il n'a rien remis)*, **son retour** *(et sa lecture reste possible, elle reste due)*. ⛔ **Ni matériau, ni candidats, ni distracteurs, ni zones, ni réponse attendue** — *l'exercice peut être resservi.*
3. **Il sort de la liste « à faire »** *(Codex et Aletheia)* : il s'y lit « fermé », sans bouton. Dans « Ma semaine », la semaine précédente le montre fermé, sans bouton.
4. **Le bilan de « Ma semaine » s'ouvre** dès que l'assiduité est jouée, **même si des exercices sont restés non faits** — ⚠️ *avec l'exception nommée au piège 34, qui est l'arbitrage du lot.*

**Hors du lot, nommément** : les exercices assignés par le professeur *(passations en classe et assignations à la main — c'est `C10-L2`)* · le retrait par le professeur *(`retire`, il reste permis)* · les retours non écrits *(`C9`)* · la chaîne de mesure · toute migration · tout interrupteur.

---

## Les pièges — tirés des sources et du code, chacun avec son renvoi

*C'est la seule partie du prompt qui a demandé du jugement. Elle a été relue contre la source et contre le code, pas contre le prompt du 05/09 — et elle en corrige trois points, marqués ⟲.*

### A. Le marqueur — un FAIT lu, jamais un statut écrit

1. ⛔⛔ **« FERMÉ » N'EST PAS UN STATUT, ET TU N'EN ÉCRIS AUCUN.** Un exercice du routeur assigné sur le cycle **C** est fermé **si et seulement si la ligne `assiduite_hebdo (eleve_id, C)` existe**. C'est exactement « l'assiduité de cette semaine a été jouée pour cet élève ». **Aucune colonne neuve, aucune migration, aucun cron, rien à tamponner.**
   **Le prédicat est celui de `C4-L13`, mot pour mot** *(`07-` §1.5)* : *« la garde porte sur **l'existence de la ligne**, pas sur la date »*. ⛔ **Ne le reformule jamais en « la date du cycle est passée »** — ce prédicat-là fermerait la semaine en cours et les semaines de vacances *(pièges 10 et 11)*.

2. ⟲ ⛔⛔ **LE CYCLE D'UN DÉPÔT SE DÉRIVE D'`assigne_at`, PAR `lundiDuCycle(instant, fuseau)` — ET DE RIEN D'AUTRE.** *(`07-` §1.1, ligne 157 ; `utils/deroule/echeance.ts:111`.)* La source est catégorique : *« Le seul chemin TOTAL est `assigne_at` […] **Aucune colonne n'est ajoutée, et c'est le point** : une colonne de cycle sur le dépôt serait **un second domicile** de ce que `assigne_at` dit déjà, et deux domiciles finissent par diverger. »*
   ⚠️ **Le prompt du 05/09 disait le contraire** *(« le cycle se lit sur SA DÉCISION, jamais dérivé d'`assigne_at` ici »)* : **c'est corrigé**. `routeur_decisions.cycle_lundi` est bien `not null` et **donne la même valeur** — parce que `C4-L12` a fait poser `assigne_at` **à midi UTC du lundi du cycle servi**, à l'INSERT et jamais ensuite. Mais **la collecte d'assiduité, elle, dérive d'`assigne_at`** *(`utils/assiduite/collecte.ts:130`, `lundiDuCycle(new Date(d.assigneAt), fuseau)`)*. ⭐ **Si tu fermais sur un autre chemin que celui qui compte, la fermeture et le comptage pourraient désigner deux semaines différentes — exactement le mode de panne que ton lot existe pour supprimer.** **Dérive comme la collecte dérive.**
   ⛔⛔ **Et jamais en UTC.** Ni `date_trunc('week', assigne_at)` en SQL, ni `getUTCDay()`, ni un `.slice(0,10)`. *« Un dépôt du dimanche 20 h 30 à Toronto est le lundi 00 h 30 UTC »* — lu en UTC, il bascule d'une semaine, **à l'heure exacte à laquelle les élèves déposent**.

3. ⭐ **« ASSIGNÉ PAR LE ROUTEUR » A DEUX LECTURES CONCORDANTES — et la source en nomme une.** Le `07-` §1.5 dit : `exercices_depots.routeur_decision_id` *(« un dépôt sans décision — toute la voie du professeur — vaut donc `false` »)*. Le code en porte une seconde, **totale** : `exercices_depots.origine`, `not null`, sous `CHECK (origine in ('routeur','prof'))`, écrite `'routeur'` par **les deux** écrivains du routeur — `cycle-serveur.ts:819` *(l'imposé)* et `bonus-serveur.ts:399` *(le pull)*.
   ⚠️ **Elles peuvent diverger dans un seul sens** : `routeur_decision_id` est **nullable**, et sa clé étrangère est **`ON DELETE SET NULL`** — une décision supprimée laisserait un dépôt `origine = 'routeur'` **sans décision**. **Prends le discriminant de la source** *(`routeur_decision_id`)*, **et compte les divergences avec `origine` dans ton script de couture** : une divergence non nulle est une trouvaille à déposer, pas un cas à traiter en silence. *(Mesuré le 07/09 : aucune, dans les deux bases.)*

4. ⛔⛔ **N'ÉCRIS AUCUN DES QUATRE STATUTS QUI TE TENDENT LES BRAS.** Chacun casse quelque chose de nommé :
   - **`abandonne`** — *« exclu des règles de stagnation »* *(`07-` §1.1)* : tes 212 non-faits sortiraient **en silence** du signal de sur-place. C'est le geste « naturel », et c'est le plus coûteux.
   - **`retire`** — sort le dépôt **du dénominateur d'assiduité**, et c'est une décision **du professeur**, qui se journalise.
   - **`clos`** — compte comme **RENDU** dans la collecte *(`utils/routeur/assiduite.ts`, `STATUTS_RENDUS`)*, et **c'est la borne du retrait** : le professeur ne pourrait plus retirer l'exercice.
   - **`non_fait`** — existe déjà, avec son sens, et reste au dénominateur.
   ⭐ **Le motif profond** : la collecte, la matrice de pilotage, les faits/imposés de Scriptorium *(`utils/pilotage/attention-serveur.ts`)* et les règles de stagnation lisent **le même `statut`**. Un statut écrit par toi ferait mentir les quatre d'un coup.

5. ⛔⛔ **N'ÉCRIS RIEN DANS `assiduite_hebdo`.** La ligne est **partagée** : `C4-L13` y pose `exercices_assignes`, `exercices_termines`, `semaine_faite` ; **`C4-L12` y remplit les trois colonnes de minutes**, dans la même requête, juste après. Un `upsert` de ta part sur cette clé effacerait le budget de l'autre lot. **Tu la lis. Point.**

6. ⭐ **Un bonus se ferme comme un imposé, et par le même test** *(décision de Louis, 05/09)*. Le pull écrit `origine = 'routeur'` et une décision `bonus = true` **sur le cycle courant** : la règle du piège 1 le prend sans branche. ⚠️ **Mais il ne compte ni au numérateur ni au dénominateur** de l'assiduité *(`C6-L3`)*, et `momentDeLaSemaine` **l'exclut** du calcul du moment *(`utils/eleve/semaine.ts:131`, `.filter((e) => !e.bonus)`)*. **Ne change pas cela** : un bonus fermé ne retient pas le bilan, et ne l'ouvre pas non plus.

7. ⭐ **Un module pur porte la règle, un lecteur serveur unique porte la lecture.** Propose `utils/deroule/fermeture.ts` : `estFermee({ assigneAt, routeurDecisionId, fuseau, cyclesComptes })`, testé, **sans `server-only`**. ⚠️ **Le glob de `npm test` est `utils/**/*.test.ts`** : une règle posée sous `app/` ne serait **jamais** éprouvée. Le lecteur serveur *(`fermeture-serveur.ts`)* lit les cycles de l'élève **en une requête** — `select cycle_lundi from assiduite_hebdo where eleve_id = …` — et rend un `Set<string>`. ⛔ **Jamais une lecture par exercice** : 160 à 332 ms l'aller-retour depuis Vercel.

8. ⛔⛔ **`assiduite_hebdo` A LA RLS ACTIVE ET **UNE SEULE** POLICY — `assiduite_hebdo_prof_all`, `role = 'prof'`. IL N'Y A AUCUNE POLICY ÉLÈVE, ET C'EST UN INVARIANT VOULU.** *(Mesuré au `pg_policies` du bac à sable, 07/09.)* Lue depuis un client à session élève, la table rend **zéro ligne, sans erreur** — et **ton lot ne fermerait jamais rien, en silence, pour toujours**. `tsc` vert, tests verts, écran normal.
   ⭐ **La parade existe déjà et elle est partout dans le code élève** : tous les chemins que tu touches tournent en **service-role** — `createAdminClient()` dans `utils/deroule/vue.ts:25`, `utils/deroule/depot.ts:35`, `utils/codex-onglets/liste.ts`, `utils/eleve/semaine-serveur.ts`. **La garde est le CODE, pas la policy** *(`utils/deroule/depot.ts:138` : « le client admin contourne la RLS »)*. **Lis avec `admin`, et prouve-le depuis une vraie session élève au smoke** — pas seulement depuis ton script.

9. ⚠️ **`supabase-js` NE LÈVE PAS** : `{ error }` partout. Ton lecteur **échoue en le disant** *(le patron `incidents` de `chargerLaSemaineDeLEleve`)*, et **une lecture en ERREUR n'est PAS une fermeture** : dans le doute, l'exercice reste ouvert — fermer sur une panne priverait un élève d'un travail qui compte encore. ⛔⛔ **Mais attends : un tableau VIDE n'est pas une erreur.** C'est précisément ce que rend une lecture mal cliente *(piège 8)*. Le fail-open te protège d'une panne ; **il ne te protège pas d'un mauvais client**, et il transformerait ce défaut-là en « tout va bien ». **Les deux cas s'éprouvent séparément.**

10. ⚠️ **La ligne de la semaine COURANTE n'existe jamais** — le déclencheur compte **la semaine écoulée** *(`07-` §1.5 : « La semaine EN COURS n'est jamais en base — seule l'écoulée l'est »)*. La clause « un dépôt de la semaine courante reste ouvert » du « fait quand » **n'est donc pas une garde à écrire** : elle tombe du prédicat. ⛔ **Mais le point d'entrée sait poser une semaine NOMMÉE** : un décor de couture qui l'appellerait sur la semaine courante fermerait la semaine courante et invaliderait ta preuve.

11. ⛔ **LES SEMAINES DE VACANCES N'ONT JAMAIS DE LIGNE, ET N'EN AURONT JAMAIS** *(`07-` §1.5 : « Les semaines de vacances sortent du dénominateur PAR OMISSION : la collecte ne pose aucune ligne pour elles […] et cette colonne n'existe pas »)*. **Un exercice du routeur assigné sur une semaine de vacances ne se fermera donc JAMAIS par ton lot.** C'est un trou **permanent**, pas transitoire. ⛔⛔ **Ne le répare surtout pas en posant une ligne** : la semaine entrerait au dénominateur, faux pour tout élève, chaque année. **Dis-le au relevé, et dépose-le dans la boîte de `C10-L2` si un bouton du professeur doit le couvrir.**

12. ⭐ **Une ligne MANQUANTE se rattrape** *(`07-` §1.5 : « une ligne manquante se rattrape, parce qu'une semaine jamais comptée n'a jamais été montrée à personne »)*. **Donc la fermeture est rétroactive** : un rattrapage tardif ferme d'un coup les exercices d'une vieille semaine. ⛔ **Ta fermeture se dérive donc à CHAQUE lecture** — jamais un cache, jamais une valeur écrite, jamais un champ dénormalisé.

13. ⚠️ **L'élève inscrit APRÈS le comptage d'une semaine n'a pas de ligne pour elle** *(défaut connu, assumé par Louis le 24/08)* : ses exercices de cette semaine-là ne se ferment pas. **Ne le répare pas, dis-le au relevé.**

14. ⛔⛔ **LE DÉCLENCHEUR A DÉJÀ ÉTÉ COUPÉ EN VOL — le 31/08, 59 élèves servis sur 62, sans un mot.** Sous ton lot, **les trois oubliés garderaient leur semaine ouverte pendant que leurs 59 camarades la perdent** : la fermeture sera **partielle à l'intérieur d'une même classe**, et invisible. *(La file bornée a été poussée le 02/09 ; le second passage de 18:20 est là pour cela.)* **Ne bricole aucune parade** — mais **nomme le cas dans ton relevé**, et vérifie au smoke qu'un élève sans ligne voit un écran cohérent, pas un demi-écran.

15. ⭐ **Le déclencheur passe DEUX FOIS le même lundi** — `0 18 * * 1` puis `20 18 * * 1` *(`vercel.json`, mesuré 07/09)*. Une ligne posée au second passage ferme **au second passage**, d'elle-même. ⚠️ **Ta fermeture est une dérivation : elle est idempotente par construction.** Si tu te surprends à écrire quoi que ce soit pour la rendre idempotente, c'est que le piège 1 a été perdu en route.

### B. Le déroulé — refuser au PORTIER, réduire au CHARGEUR

16. ⟲ ⭐⭐ **IL Y A UN PORTIER UNIQUE, ET IL EST DÉJÀ ÉCRIT.** `portier(depotId, ecriture = true)` — `app/deroule/actions.ts:73` — **appelé par dix-huit des vingt actions**. ⭐ **Les deux qui ne l'appellent pas sont exactement les deux cas particuliers de ce lot**, et c'est une confirmation, pas une exception : `actionChargerLeDeroule` *(piège 17 — c'est là que va la RÉDUCTION, pas le refus)* et `actionCollageBloque` *(piège 18 — elle contourne volontairement toute garde d'écriture)*. **Mesuré : 18 appels, 20 actions.** Il porte déjà, dans son `if (ecriture)`, exactement les deux gardes de ta famille : `messageSiBloque` et `messageSiRetoursNonLus`. ⭐ **Ta garde entre là, en une fois, à côté des deux autres** — pas dans treize actions recopiées.
    ⚠️ **Le prompt du 05/09 demandait la garde dans chaque action** : **c'est corrigé**, et le gain n'est pas cosmétique — treize copies, c'est treize occasions d'en oublier une quand une quatorzième action naîtra.
    ⭐ **Et les six appels `portier(depotId, false)` restent PERMIS par construction** *(lignes 110, 188, 216, 230, 624, 636)* : ce sont les lectures et les gestes qui portent sur **le retour**, pas sur l'exercice — dont `actionValiderLaLecture` *(piège 19)*, `actionPointsContestes` et `actionContester`. **Contester un retour est un droit sur le retour, pas un travail sur l'exercice.**

17. ⭐ **`actionChargerLeDeroule` NE PASSE PAS PAR LE PORTIER** *(`app/deroule/actions.ts:93` — elle appelle `garderEleveDeroule` directement)*. **C'est voulu, et c'est ta seconde insertion** : le refus va au portier, **la réduction va dans `chargerLeDeroule`** *(piège 22)*. Deux endroits, deux rôles, et aucun des deux ne fait le travail de l'autre.

18. ⛔ **`actionCollageBloque` N'APPELLE PAS LE PORTIER DU TOUT — elle contourne volontairement la garde d'écriture** — c'est une **trace d'intégrité** *(les petits malins)*, et la fermer effacerait la preuve d'un collage tenté sur un exercice fermé. **Laisse-la passer.** ⚠️ Même remarque pour `actionSignalerUnProbleme` / `actionRetirerLeSignalement` : signaler un exercice reste un droit. ⚠️⚠️ **Et son interrupteur est OFF en bac à sable, ON en prod** *(§③)* : pour éprouver ce chemin, il faut l'allumer en bac à sable — **et le rendre à OFF ensuite**, en le disant au relevé.

19. ⟲ ⛔⛔ **LA VALIDATION DE LECTURE RESTE PERMISE, ET ELLE ÉCRIT UN STATUT — `statut = 'clos'`.** `utils/deroule/contestation.ts:177` : quand `clotUnDeroule` *(régime `plein` → moment `final` ; régime réduit → moment `chaud`)*, elle pose `statut: 'clos'` sur le dépôt. **Ce n'est pas ton lot qui écrit** — c'est le geste de l'élève, et il existait avant toi. ⛔ **Ne le « répare » pas au nom de « aucun statut n'est écrit »** : cette clause parle de **la fermeture**, pas des gestes qui restent permis.
    ⭐ **Et c'est ce qui rend la lecture indispensable** : sans elle, le dépôt reste `retour_publie`, la ligne reste `a_lire`, et **le bilan ne s'ouvre jamais** *(piège 34)*. La lecture est la seule porte de sortie de l'exercice fermé.
    ⚠️ **Corrige aussi ta représentation du blocage.** Le prompt du 05/09 affirmait qu'un retour non lu bloque tous les rendus de l'élève : **mesuré, c'est faux pour la maison.** La source de `messageSiRetoursNonLus` qui lit `exercices_retours` filtre `exercices.lieu = 'classe'` *(`utils/retours-lus.ts:128`)* — c'est celle de `C6-L4`, pour les essais de Fragments. **Un retour de maison non lu ne bloque rien aujourd'hui.** La raison de laisser la lecture ouverte n'est donc pas le déblocage : c'est le bilan, et c'est le `06-` §2 temps 6 — *« il se clôt par la validation "lu" »*.

20. ⛔⛔ **LA VUE RÉDUITE DOIT GARDER `regime` INTACT.** `actionValiderLaLecture` appelle `chargerLeDeroule` **puis lit `vue.regime`** pour décider si la lecture clôt le dépôt *(`app/deroule/actions.ts:626-629`)*. Un `regime` vidé par ta réduction ferait que **la lecture cesse de clore** — le dépôt resterait `retour_publie` pour toujours, la ligne `a_lire` pour toujours, **et le bilan ne s'ouvrirait jamais**. *Le champ n'a l'air de rien ; il tient la sortie de l'exercice fermé.*

21. ⚠️ **`actionOuvrir` EST APPELÉE À CHAQUE MONTAGE DE L'ÉCRAN, ET SON REFUS EST JETÉ.** Refuser là ne montrera **jamais** le message. **Le message de fermeture s'affiche depuis la VUE** *(un drapeau `fermee` en tête d'écran)*, et le refus du portier n'est que la garde de dernier ressort — pour l'onglet resté ouvert depuis dimanche soir, qui doit être refusé **à 18:01**, pas à la prochaine navigation.

22. ⛔⛔ **CE QUE L'ÉLÈVE NE DOIT PAS VOIR NE PART PAS DU SERVEUR — ET C'EST UNE LISTE BLANCHE.** `chargerLeDeroule` *(`utils/deroule/vue.ts`)* est **le seul endroit** où la charge se construit, et `VueDuDeroule` porte **50 champs**. **Nomme ce qui RESTE** — `depotId`, `ouvert`, `titre`, `consigne`, `texteV1`, `texteVf`, `retourChaud`, `retourFinal`, `contestations`, `regime` *(piège 20)*, `echeance`, `v1RemiseLe`, plus ton `fermee` — **et vide tout le reste**.
    ⛔ **Une liste noire est fausse le jour où un lot ajoute un 51ᵉ champ**, et personne ne le verra : un composant serveur sérialise dans la charge RSC **tout ce qu'il reçoit**. Le motif est écrit à la source : *« l'exercice peut être resservi »* — à un autre élève, ou au même dans un autre cycle.
    À vider nommément, entre autres : `texteSupport`, `sujet`, `coTexte`, `cas`, `corrections`, `etalon`, `demonstration`, `contenuDemonstration`, `guide`, `rappel`, `langue`, `verdictCalibration`, `seJuger.offre`, `gestesRestants`, `competencesDeLaConfiance`.

23. ⛔⛔ **LES DISTRACTEURS NE SONT PAS UN CHAMP.** Ils descendent sous le nom **`candidats`**, dans l'offre de crédence portée par `cas`. Chercher « distracteurs » dans la vue ne rend rien, et laisser `cas` partir **livre la réponse d'un exercice qui sera resservi**.

24. ⛔ **NE RÉDUIS PAS DANS `lireContexte`.** Le même module nourrit **l'écran ET la chaîne de mesure** *(`utils/chaine/contexte.ts`)* : une réduction posée là ferait mesurer la chaîne sur un contexte amputé. **La réduction est à la sortie de `chargerLeDeroule`, et nulle part ailleurs.**

25. ⚠️ **`VueDuDeroule.ouvert` PORTE DÉJÀ UN SENS** — l'interrupteur `exercices_actif` *(« Faux, l'écran se ferme poliment »)*. **N'y loge pas la fermeture** : deux causes sous un drapeau, et le message de Louis s'afficherait quand le professeur éteint le module. **Ajoute `fermee: boolean`.**

26. ⚠️ **SOUS LE GABARIT, LA VUE FERMÉE A TROIS CHAMPS DE PLUS À RETIRER** — `probleme`, `constituant`, et les **pièces servies** du cran 2 *(le texte à trou)*. ⛔ **Même si `gabarit_actif` est OFF en production** : il est **ON en bac à sable** *(§③)*, c'est là que tu éprouves, et il sera ON en prod. **La liste blanche du piège 22 les couvre par construction** — c'est une raison de plus de la préférer.

27. ⚠️ **LE BROUILLON EST EN BASE, PAS EN LOCAL.** *« Un brouillon non remis se perd »* ne supprime rien : **il cesse d'être remettable**. La vue fermée d'un `ouvert` montre **la consigne et le brouillon tel quel, en lecture seule** — c'est « sa réponse » —, sans bouton. **N'efface aucun texte.**

28. ⭐ **LE PRÉCÉDENT EXACT EXISTE : `ExerciceEnRevision`**, servi par un second lecteur en lecture seule. **Regarde-le avant d'inventer un écran** : la vue fermée est le même genre d'objet, et la moitié du travail y est déjà faite.

29. ⭐ **Le déroulé est partagé par Codex et Aletheia** *(`PageDuDeroule`, importé par les deux routes)* : **une seule vue fermée**, pas deux.

30. ⛔ **REFUSER LES GESTES NE DOIT JAMAIS REFUSER LA CHAÎNE.** Le retour d'une v1 déjà remise **doit continuer d'arriver** après la fermeture — sans lui, la lecture ne peut pas rester due, et le bilan ne s'ouvre pas *(piège 19)*. **Ta garde est sur les actions serveur de l'élève**, jamais sur la file ni sur la route de la chaîne.

### C. Les listes, « Ma semaine », et le bilan

31. ⭐ **`etatDeLExercice(statut, retour)` est pur et ne sait rien du temps** *(`utils/codex-onglets/regles.ts:191`)*. Donne-lui la fermeture en paramètre et fais-le rendre « fermé » pour `assigne` et `ouvert` fermés. ⛔ **Mais l'obligation de lecture passe DEVANT** — c'est la première ligne de la fonction *(`regles.ts:200`)*, et elle cite le `02-` §6.D. **Ne la déplace pas** : un `retour_publie` non lu, même fermé, reste **`a_lire` / « retour à lire »**. Un `v1_remis` fermé reste `attente` — *« rendu, retour en préparation »* est vrai *(piège 30)*.

32. ⚠️ **`TonEtat` EST EXHAUSTIF EN TROIS ENDROITS.** `type TonEtat = 'a_faire' | 'en_cours' | 'a_lire' | 'attente' | 'clos'` *(`regles.ts:187`)*, plus `const GROUPE: Record<TonEtat, Groupe>` *(`accueil.ts:48`)* et `const RANG: Record<TonEtat, number>` *(`regles.ts:280`)*. Un sixième ton coûte **trois** modifications — et `Record` te les signalera. ⭐ **Demande-toi d'abord si tu en as besoin** : `clos` groupe déjà hors du « à faire », et `actionDeLaLigne('clos')` rend déjà `null`. **Un libellé peut suffire là où un ton coûte un type.** Tranche, et dis pourquoi au relevé.

33. ⭐ **UN SEUL PRODUCTEUR ALIMENTE LES QUATRE SURFACES** — Codex, Aletheia, « Ma semaine » et la tuile du tableau de bord lisent toutes `exercicesMaisonDeLEleve` *(`utils/codex-onglets/liste.ts:181`)*. **Fais entrer la fermeture là**, et les quatre suivent. ⭐ **Et la jointure existe déjà** : `liste.ts:193` sélectionne `routeur_decisions(bonus)` — `assigneAt` y est déjà rendu *(ligne 78)*. **Aucune seconde requête n'est nécessaire.**

34. ⭐⭐⭐ **L'ARBITRAGE DU LOT — LE BILAN, ET UNE CONTRADICTION APPARENTE ENTRE LA MISSION ET `C6-L2`.**
    **Le fait.** `momentDeLaSemaine` rend `'bilan'` quand **aucun** imposé ne porte un ton de `APPELLE_UN_GESTE = ['a_lire', 'a_faire', 'en_cours']` *(`utils/eleve/semaine.ts:108,133`)*. Or `a_lire` en fait partie, et `C6-L2` l'a voulu, mesuré, écrit : *« un dépôt rendu dont le retour est publié mais non lu attend encore un geste, et **retient le bilan** […] **La semaine ne se referme donc jamais sur un retour que l'élève n'a pas ouvert.** »* *(`07-` §2, entrée `C6-L2`.)* Ta mission dit : *« le bilan de la semaine s'ouvre […] **même sur des exercices non faits** »*.
    ⭐ **Comment la fabrication tranche, et pourquoi.** **Les deux tiennent, parce qu'ils ne parlent pas des mêmes exercices.** La clause de la mission dit *« même sur des exercices **non faits** »* — c'est-à-dire `a_faire` et `en_cours`, jamais rendus. **Elle ne dit rien d'un retour publié non lu**, qui n'est pas un exercice non fait mais un exercice **rendu, corrigé, et dont l'élève n'a pas ouvert le retour**. ⛔ **Donc : la fermeture ouvre le bilan malgré `a_faire` et `en_cours`, et laisse `a_lire` le retenir.** La règle de `C6-L2` survit intacte, la lecture reste due *(`06-` §2, temps 6)*, et elle a une porte de sortie *(pièges 19 et 20)*.
    ⚠️ **Ce que cela coûte, et qu'il faut dire** : un élève qui n'ouvre jamais son retour n'a jamais son bilan. C'est déjà vrai aujourd'hui, ce n'est pas une régression de ton lot — mais **la fermeture le rend visible sur une semaine morte**, où l'élève ne reviendra peut-être pas. ⭐ **La vue fermée doit donc porter le bouton de lecture, bien en vue**, et la ligne « Ma semaine » doit dire *« retour à lire »*, pas *« fermé »*.
    ⛔ **Ne prends pas l'autre voie sans Louis.** Ouvrir le bilan « quels que soient les tons » — ce que le prompt du 05/09 proposait — **annule silencieusement une règle que `C6-L2` a trouvée en recette**. Si Louis la veut quand même, elle est à lui, pas à toi : **pose la question, applique cet arbitrage-ci en attendant, et porte-la en tête de ton relevé.**

35. ⚠️ **`ceQuiManqueAuBilan` dit déjà « une de tes copies n'a pas encore été corrigée »** : un bilan ouvert par la fermeture sur des exercices non faits doit dire **combien n'ont pas été faits** — *un vide s'explique*. **Une phrase, pas un tableau.** ⚠️ **Et le zéro se lit « faite par construction »** : `completion()` rend `null`, pas `0`, pour un élève sans exercice assigné. L'écran du bilan doit le savoir.

36. ⭐ **« Ma semaine » navigue DÉJÀ par `?cycle=`** : la semaine précédente est atteignable, et c'est la même page. **Aucune route neuve.** La ligne fermée s'y lit « fermé », sans bouton *(`actionDeLaLigne('clos')` rend `null`)* ; **la consigne reste cliquable** vers la vue fermée *(mission, effet 2)*.

37. ⛔ **UN COMMENTAIRE T'INTERDIT NOMMÉMENT CE QUE TU DOIS FAIRE.** `utils/eleve/semaine-serveur.ts:16` : *« ⛔⛔ `assiduite_hebdo` NE SE LIT PAS ICI, ET ELLE NE LE POURRA JAMAIS. Son écrivain est un cron HEBDOMADAIRE (C4-L13) qui compte UNE SEMAINE CLOSE — **premier comptage réel le lundi 2026-09-07** —, et elle est VIDE dans les deux bases au 28/08. »*
    ⭐ **Il avait raison, et il est daté.** Il parlait de **la frise de la semaine EN COURS**, qui compte les dépôts en direct — et de la table vide. Ton lot lit la ligne d'une **semaine passée**, et le comptage qu'il annonçait a lieu **le jour où tu joues**. ⛔ **Amende ce commentaire délibérément, avec le motif et la date**, et ne le contourne jamais en silence : le prochain lecteur doit trouver la raison, pas la contradiction.

### D. Ce que la fabrication a mesuré, et que tu remesures

38. **Production, mesurée le 07/09 à 02:20 UTC** *(PostgREST, lecture seule — `PROD_SUPABASE_URL` + `PROD_SUPABASE_SECRET_KEY`)*. **565 dépôts**, **63 élèves**.
    - **480 dépôts du routeur, tous sur le cycle `2026-08-31`** : **184 `assigne`**, **150 `clos`**, **80 `v1_remis`**, **35 `retire`**, **28 `ouvert`**, **3 `non_fait`** — et **1 seul bonus**.
    - **85 dépôts sans décision de routeur**, tous `origine = 'prof'`, assignés les 25 et 26/08 : 48 `retour_publie`, 22 `v1_remis`, **15 `ouvert`**. *(Ce sont les quinze de la passation en classe que le `07-` cite. Ils ne sont pas à toi.)*
    - **`assiduite_hebdo` : 61 lignes, toutes sur `2026-08-24`, aucune sur `2026-08-31`.** Et **aucun dépôt du routeur sur `2026-08-24`** — le routeur n'a servi qu'à partir du 31/08.

39. ⭐ **CONSÉQUENCE IMMÉDIATE : rien ne se ferme aujourd'hui, même déployé.** Le seul cycle qui porte une ligne n'a **aucun** dépôt du routeur. **Tu peux déployer sans rien fermer.**

40. ⏱️⏱️ **ET LA PREMIÈRE FERMETURE RÉELLE TOMBE CE LUNDI 07/09 À 18:00 UTC** *(14:00 à Montréal)*, quand le déclencheur posera les lignes du cycle `2026-08-31` : **480 dépôts se ferment d'un coup**, dont **212 qui n'ont jamais été rendus** *(184 `assigne` + 28 `ouvert`)* et **80 qui attendent un retour**. ⛔ **C'est un événement visible par 63 élèves, irréversible sans redéploiement, et il n'a pas d'interrupteur** *(en-tête)*. **Le moment du déploiement est donc une décision de Louis, pas un détail de fin de séance : demande-la explicitement avant de pousser**, et dis-lui ces chiffres. *(Et note que ce même lundi porte la bascule vers le gabarit — `scripts/recette/BASCULE_gabarit_lundi_7_septembre.md`.)*

41. ⚠️ **LES TROIS V1 TARDIVES QUI MOTIVENT LE CHAPITRE NE SONT PAS À TOI — mesuré.** Le `07-` §2, chapitre `C10`, cite en preuve *« trois v1 rendues les 1er et 2 septembre sur le cycle du 24/08, comptées nulle part »*. **Les trois portent `origine = 'prof'` et n'ont aucune décision de routeur** *(assignées les 25 et 26/08 ; v1 les 01/09 12:07, 02/09 02:09 et 02/09 11:42)*. **Ton lot ne les aurait pas fermées** : elles relèvent de `C10-L2`.
    ⭐ **La thèse générale du chapitre reste vraie** — rien ne ferme un exercice du routeur —, **c'est la preuve citée qui appartient à l'autre lot**, et **le routeur n'a encore aucun cas historique** puisqu'il n'a servi qu'un seul cycle, non compté. ⛔ **Ne corrige pas la source** : pose **`[faux]`** au point de l'erreur et **une ligne à la section DETTES** de `INVENTAIRE_Non_Tranches.md`, avec l'avant / après. **Et dépose la mesure dans la boîte de `C10-L2`** — elle chiffre son urgence.

42. ⚠️ **LE RENVOI `02-` §6.D EST FAUX POUR TON FLUX — seconde dette de source.** La mission écrit *« la lecture du retour reste due (`02-exercices.md` §6.D) »*. Or **le §6.D est « La passation en classe »**, dont la seule mention de lecture est l'étape 17, sur une copie ramassée et publiée à la main — **un flux que ta mission exclut explicitement**. **L'obligation de lecture d'un exercice de MAISON est au `06-Palimpseste.md` §2, temps 6** : *« il se clôt par la validation "lu" »*. ⛔ **Même geste : `[faux]` et DETTES**, en proposant le renvoi juste. *(Le §6.D reste à ton manifeste : il porte l'étape 17, que `etatDeLExercice` cite — piège 31.)*

43. **Bac à sable, mesuré le 07/09 à 02:25 UTC** *(`psql`, `SUPABASE_DB_URL` → `aoakpxxlyvthzueaywna`)* : **0 ligne `assiduite_hebdo`, 0 `routeur_decisions`, 51 dépôts, 0 dépôt du routeur.** ⭐ **Le décor existe** : `scripts/recette/essai-cron-hebdo.ts` *(`--constat` / `--essai` / `--retire`)* rejoue la route d'un lundi donné — **collecte PUIS routeur, dans cet ordre**, qui est la règle *(l'inverser perd les minutes en silence)* — et pose **les lignes ET les décisions**. Il **refuse explicitement toute base autre que le bac à sable** *(`essai-cron-hebdo.ts:46`)*. Lancement : `node --import ./scripts/register-calibration-resolver.mjs`, à cause du `server-only`.
    ⛔⛔ **MAIS SON LUNDI EST FIGÉ : `const LUNDI = '2026-08-31'` (ligne 35).** Un seul passage te donnera des **décisions** sur `2026-08-31` et une **ligne** sur `2026-08-24` — c'est-à-dire **rien de fermé**. **Il te faut deux lundis consécutifs** : joue `2026-08-31` *(les décisions)*, puis `2026-09-07` *(la ligne qui les ferme)*. **Fais du `LUNDI` un paramètre**, ne le modifie pas en dur. ⚠️ **Et son en-tête est périmé sur un point** — il annonce le cron « à 09:30 UTC », quand `vercel.json` dit **18:00 et 18:20**. *(Le relevé de `C4-L13` porte la même valeur périmée. Le fichier fait foi.)*

44. ⛔⛔ **`essai-cron-hebdo.ts --retire` VIDE TOUTE LA TABLE `assiduite_hebdo`, pas seulement son décor** — et `scripts/recette/routeur-c4l12.mjs --retire` supprime l'assiduité **du cycle entier, tous élèves confondus**, alors que son en-tête affirme ne toucher qu'à son décor. **Les deux sont bornés au bac à sable** — mais dans le bac à sable, ils effaceront **le décor d'une autre séance** en même temps que le tien. **Mesure `assiduite_hebdo` avant et après**, et **ton script à toi retire par MARQUE**, jamais par table.

45. ⛔ **LE DÉCLENCHEUR NE SE LANCE PAS À LA MAIN.** Sa garde est `Authorization: Bearer ${CRON_SECRET}` *(`app/api/assiduite/hebdo/route.ts:101`)*, et **`CRON_SECRET` ne vit que dans Vercel** — il n'est ni dans `.env.example` ni dans `.env.local`. Vercel l'envoie de lui-même. **Tu ne peux donc pas déclencher la fermeture réelle depuis un shell** : en bac à sable, tu appelles `poserLaSemaineDAssiduite` **directement**, comme le décor le fait.

46. ⛔⛔ **SUR QUEL ARBRE TRAVAILLES-TU ? MESURE-LE AVANT D'ÉCRIRE.** `ls utils/deroule/etapes.ts` : **présent → tu es sur `feat/ecrans-passation`** *(le déroulé « un écran, une tâche » du 04/09, plus `C7-L6`, `C7-L7`, `C7-L8`)* ; **absent → tu es sur `main`**. Les deux arbres divergent sur **`utils/deroule/vue.ts` (+110 lignes)** et **`app/deroule/actions.ts` (+6)** — **tes deux fichiers**.
    ⭐ **Ce qui ne bouge pas d'un arbre à l'autre, vérifié** : les **vingt actions serveur portent les mêmes noms**, et le **portier est le même**. Ta garde du piège 16 tient des deux côtés.
    ⛔ **Demande à Louis sur quelle base le lot se joue, et dis-le en tête de ton relevé.** Écrire sur `main` ce qui devra être refait sur la branche est un coût qui se paie deux fois.

47. ⚠️ **`main` EST DÉJÀ 10 COMMITS DEVANT `origin/main`** *(mesuré après `git fetch`, 07/09 02:30 UTC)* — dérivations de doctrine, le cran 2 qui isole, les prompts `C7-L7`/`C7-L8`, et **3 lignes sur `utils/deroule/vue.ts`**. ⛔⛔ **Pousser, c'est déployer — et ce sera déployer ces dix-là aussi.** Vérifie-le, dis-le à Louis, et **ne pousse pas sans son « go »** *(piège 40)*.

48. ⚠️ **Trois défauts d'écran déjà payés, qui te concernent** : **`<details open>` et l'hydratation** — Chrome restaure l'état au rechargement, ne dépends pas de `open` si tu replies des sections ; **`flex-wrap` ne replie rien sans `min-width`** — la ligne de synthèse écrasée à 12 px, tests verts ; **`chrome --window-size=375` ne fait PAS un écran de 375 px** — `scripts/recette/capture-page.mjs` émule par CDP et mesure le débordement.

49. ⛔ **Ne ré-exporte JAMAIS un type depuis `app/deroule/actions.ts`** : un `export type` dans un module `'use server'` **tue tout le module à l'exécution**, `tsc` et les tests verts. Ton `fermee` et ta règle vivent sous `utils/`.

50. ⭐ **CE QUE LA REFONTE DU ROUTEUR (05→07/09) CHANGE POUR TOI — et ce qu'elle ne change pas.** Le `01-` §5 a gagné **la semaine de méthode** : le routeur pose désormais, pour deux objets, **une séquence de crans sur un ou deux devoirs** *(E-D : `1·3 ‖ 4·2` ; C-B : `1·3 ‖ 2` ; A : `4` seul)*.
    ⭐ **Ce qui ne change pas — l'essentiel.** *« La méthode est l'exception à l'espacement du §8.10 : les crans de la séquence se servent sur le même devoir, **la même semaine**. »* **Une séquence tient donc dans un cycle**, et ta fermeture ne la coupera jamais en deux **entre** deux semaines. Le vocabulaire de la semaine n'a pas bougé, et `cycle_lundi` reste ce qu'il était.
    ⚠️ **Ce que cela ajoute.** Une semaine fermée au milieu d'une séquence emporte **les crans restants** — l'élève qui en était au 3 ne verra jamais le 2 ni le 4, et rien ne les rattrape. **C'est la règle, et elle ne souffre pas d'exception** : ⛔ **ne laisse pas « finir une séquence commencée »** — ce serait un second prédicat de fermeture, donc un second domicile. **Dis-le au relevé**, c'est une conséquence que le chapitre `C10` n'a pas pu prévoir : il a été écrit le 05/09, la séquence sur deux devoirs date du 07/09.
    ⚠️ **Et rien de tout cela ne tourne encore en production** : `gabarit_actif` est **OFF** en prod, `chaine_cle_actif` **n'y a même pas de colonne**, et `C7-L6`/`L7`/`L8` vivent sur une branche non poussée *(§⑤)*.

---

## La convention de couture — ce que tu éprouves par EXÉCUTION

Ton lot succède à **`C4-L13`**, **`C4-L12`**, **`C6-L2`** et **`C6-L3`** *(les quatre dépendances déclarées au `07-` §2)*. **Quatre coutures, nommées sous la seule forme qui les rend vérifiables** — *qui écrit · qui lit · un chemin réel y mène-t-il ?*

| couture | qui écrit | qui lit *(toi)* | l'épreuve, par exécution |
|---|---|---|---|
| **la ligne** `assiduite_hebdo (eleve_id, cycle_lundi)` | `poserLaSemaineDAssiduite` — le cron du lundi, **deux passages** | ton lecteur *(piège 7)*, **en service-role** *(piège 8)* | un élève du bac à sable, un dépôt du routeur sur le cycle **C**, **pas de ligne** → tout est ouvert ; le décor pose la ligne de **C** → **tout se ferme** : le portier refuse les gestes d'écriture, la vue est réduite, la liste dit « fermé », le bilan s'ouvre ; retrait → **tout rouvre** |
| **la semaine d'un dépôt** `assigne_at` → `lundiDuCycle(instant, fuseau)` | `poserLesSemainesDuRouteur` *(midi UTC du lundi servi)* et `bonus-serveur` *(au clic)* | ta dérivation, **la même que la collecte** *(piège 2)* | un dépôt **du dimanche 20 h 30 heure de l'école** : ta dérivation et `comptesDeLaSemaine` doivent lui donner **le même cycle**. ⭐ *C'est le contrôle qui vaut tous les autres.* Et un **bonus** *(piège 6)* → fermé comme un imposé |
| **la voie du professeur** `routeur_decision_id` / `origine` | `app/prof/conception/actions.ts` *(assignation)*, `utils/essai/branchement-serveur.ts` | ton discriminant *(piège 3)* | un dépôt **sans** décision, **même élève, même cycle, ligne posée** → **reste ouvert**. Et compte les divergences `origine='routeur'` vs `routeur_decision_id is null` : **zéro attendu** |
| **la lecture du retour** `exercices_retours.lu_at`, et le `clos` qu'elle pose | l'élève, `actionValiderLaLecture` | `etatDeLExercice`, `momentDeLaSemaine` | ferme, publie un retour, **valide la lecture sur l'exercice fermé** → le dépôt passe `clos` *(piège 19)*, la ligne quitte `a_lire`, **et le bilan s'ouvre** *(piège 34)*. **Éprouve aussi l'inverse** : retour non lu → bilan retenu |

**Le script se laisse au dépôt** : `scripts/recette/couture-c10l1.mjs`, sur le patron des **75 `scripts/recette/*.mjs`** du dépôt, et des **cinq `couture-*.mjs`** en particulier *(`couture-c5l4`, `c6l1`, `c6l2`, `c6l3`, `c6l4` — mesuré le 07/09)* — **mode constat**, **registre AVANT**, **retrait par marque** *(piège 44)*, contrôles **comptés et confrontés en base par requête**, base rendue à son état d'entrée **et vérifiée**. ⛔ **Bac à sable uniquement — aucune écriture en production par ce lot.**

**Puis le smoke élève, à l'œil, aux trois largeurs** *(375 · 768 · 1280 — `capture-page.mjs`, piège 48)*, **depuis une vraie session élève** *(le lien magique — c'est le seul chemin qui éprouve le piège 8)* : la vue fermée d'un `assigne`, d'un `ouvert` **avec brouillon**, d'un `retour_publie` **non lu**, d'un `vf_remis` ; la liste Codex ; « Ma semaine » sur la semaine précédente, et son bilan. **Montre le rendu avec les données réelles du décor** — pas « ça compile », pas « les tests passent ». *(⚠️ Le profil de cookies du smoke CDP est partagé entre séances.)*

---

## Le « fait quand » — *(recopié du `07-` §2 ; ne se négocie pas en séance)*

> *Fait quand* : **un exercice assigné par le routeur — imposé ou demandé — sur un cycle dont la ligne d'assiduité de l'élève existe n'accepte plus aucun geste de travail** : ouvrir, écrire, remettre v1 ou vf, se juger, crédence, désignation, restitution, confiance, conditions sont **refusés côté serveur** avec le message *« Il n'est plus possible de travailler sur les exercices de cette semaine. De nouveaux exercices t'attendent. »* ; **sa vue ne porte que la consigne, la réponse de l'élève et son retour** — matériau, candidats, distracteurs et zones **absents de la charge servie**, pas masqués ; **la lecture du retour reste possible et reste due** ; **il quitte la liste « à faire »** de Codex et d'Aletheia et se lit « fermé » ; **la semaine précédente de « Ma semaine » le montre fermé sans bouton, et son bilan est ouvert** ; **un dépôt sans décision de routeur, un dépôt de la semaine courante, un dépôt dont la ligne est illisible restent ouverts** ; **aucun statut n'est écrit, aucune migration, aucun interrupteur** ; le tout **prouvé par exécution en bac à sable** *(script de couture laissé au dépôt, décor posé et retiré)* **et à l'œil aux trois largeurs**.

⚠️ **Une seule clause de ce « fait quand » a été précisée par la fabrication, et pas amendée** : *« son bilan est ouvert »* se lit avec **le piège 34** — le bilan s'ouvre malgré les exercices **non faits**, et un **retour publié non lu** continue de le retenir, comme `C6-L2` l'a écrit. **Si Louis veut l'autre lecture, elle est à lui.**

---

## Les conventions de dépôt et de clôture

- **Aucune migration, aucun interrupteur** : **rien au `SUIVI_SQL.md`**. Si ton lot croit avoir besoin d'une migration, **il s'arrête et le dit** — c'est que le piège 1 a été perdu en route.
- ⚠️ **Tu ne touches pas à la doctrine en base** — tu ne lis aucune de ses tables. La convention du dériveur *(`derive-doctrine.py --verifie`)* ne t'oblige donc pas. ⚠️ **En revanche, si tu amendes le `07-` ou une fiche** *(pièges 41 et 42 : `[faux]`)*, **`npm test` passe au ROUGE** sur `instruments.test.ts` tant que `python3 scripts/derive-instruments.py --ecris` n'est pas rejoué. *Ne t'affole pas d'un rouge sans rapport avec ton code : c'est celui-là.*
- **Ta section au `SUIVI_tests_manuels.md`** *(il n'en porte aucune pour `C10` aujourd'hui)* : `## C10-L1 — La semaine comptée se ferme (séance du …)` — ce qui est prouvé en séance **coché avec sa preuve**, ce qui reste **décoché avec sa condition de reprise**. **Au moins** : `C10L1-x` — **la première fermeture réelle en production, lundi 07/09 après 18:06 UTC**, sur les 480 dépôts du cycle `2026-08-31` ; et **la fermeture d'un élève servi au second passage de 18:20**.
- **Une source trouvée fausse se marque, elle ne se corrige pas** : **`[faux]`** au point de l'erreur, **une ligne à la section DETTES** de `INVENTAIRE_Non_Tranches.md`, qui porte l'avant / après. **Tu en as deux, déjà mesurées** *(pièges 41 et 42)*.
- **Ton relevé** : `RELEVE_C10_L1_<date>.md`. Ce qui est pour `C10-L2`, pour `C9` ou pour un autre lot va **dans leur boîte** au `PLAN_DE_CHANTIER.md` §5, **par destinataire** — *« je ne fais pas X, c'est ton lot » n'est pas un dépôt.*
- ⛔ **`git add -A` est INTERDIT** : l'arbre porte le travail d'autres séances *(le gabarit, les prompts C7)*. **Fichier par fichier**, `git status --short` avant chaque commit.
- ⛔⛔ **Pousser, c'est déployer** — et ce lot a une horloge. **Ne pousse pas sans le « go » de Louis** *(pièges 40 et 47)*.

---

## §H — Ce qui est hors de toi, et où ça va

- **`C10-L2` — le bouton du professeur « Clore les dépôts »** sur une passation en classe *(prompt fabriqué le 05/09)*. **Trois choses vont dans sa boîte** : les **trois v1 tardives** qui sont à lui, mesurées *(piège 41)* ; les **15 dépôts `ouvert` du 25-26/08** encore ouverts douze jours après ; les **exercices d'une semaine de vacances**, que rien ne fermera jamais *(piège 11)*. **Si ton `estFermee` peut lui servir, dis-le dans sa boîte — ne le construis pas.**
- **`C9`** — les 80 `v1_remis` sans retour du cycle `2026-08-31` *(mesuré 07/09)* : « fermé sans retour » est à eux. **Tu ne fabriques pas cet état** : un `v1_remis` fermé continue de dire *« rendu — retour en préparation »*, ce qui est vrai *(piège 30)*.
- **Les assignations à la main du professeur** : Louis les clôt lui-même ; **leur bouton n'existe pas encore** — une ligne dans la boîte de `C10-L2`.
- **La dérive d'une heure au passage à l'heure normale** *(`0 18 * * 1` = 13:00 à Montréal dès le 01/11)* : ce n'est pas toi.
- **Le retard du déclencheur sur trois élèves du 31/08** *(piège 14)* : c'est `C4-L13`. **Tu le nommes, tu ne le répares pas.**

---

## §I — L'entrée `C10-L1` du `07-Implementation.md` §2 — copie de ce qui est écrit dans la source

*(Chapitre `### C10 — la semaine se ferme`, écrit le 05/09 au soir, commité `ef56909`, **inchangé en 2.81**. La source fait foi ; cette copie est là pour que tu n'aies rien à chercher.)*

> *Chapitre ouvert le 05/09/2026 au soir, par décision de Louis, écran et base sous les yeux. Mesuré en production le même jour : rien ne ferme un exercice du routeur — l'échéance portée par le dépôt n'est qu'une pastille, le déroulé ne la lit pas, et un rendu tardif est mesuré par la chaîne alors que la ligne d'assiduité de sa semaine est figée depuis le lundi 14:00 (trois v1 rendues les 1er et 2 septembre sur le cycle du 24/08, comptées nulle part) ; quinze dépôts de passation en classe du 24/08 restaient `ouvert` dix jours après. Aucun interrupteur (décision de Louis, 05/09 : la fermeture est une règle de l'assiduité, pas une fonctionnalité qui s'essaie — même motif que `C4-L13`), aucune migration.*
>
> **C10-L1 — La semaine comptée se ferme.** Au moment où l'assiduité d'une semaine est jouée pour un élève *(§1.5 ; `C4-L13`)*, les exercices que le routeur lui a assignés sur cette semaine — imposés et demandés *(`C6-L3`)* — **cessent d'être jouables** : le déroulé refuse tout geste de travail, v1 comme vf, avec un message unique — *« Il n'est plus possible de travailler sur les exercices de cette semaine. De nouveaux exercices t'attendent. »* —, l'exercice ne montre plus que **la consigne, la réponse de l'élève et son retour** *(jamais le matériau ni les distracteurs : l'exercice peut être resservi)*, la lecture du retour reste due *(`02-exercices.md` §6.D)*, l'exercice quitte la liste « à faire » et se lit « fermé », et **le bilan de la semaine s'ouvre** *(`C6-L2`)*, même sur des exercices non faits. Un brouillon non remis se perd. **Le marqueur est un fait, pas un statut** : la ligne `assiduite_hebdo` de l'élève et du cycle **existe** — aucune colonne, aucun cron, aucun statut écrit ; les statuts gardent leur sens *(§1.1)* et l'assiduité, le pilotage et la stagnation continuent de les lire. **Un dépôt sans décision de routeur n'est jamais fermé par ce lot** *(passations en classe, assignations à la main : `C10-L2`)*. **Ce que l'élève ne doit pas voir ne part pas du serveur** : la vue fermée se réduit là où elle se construit, pas à l'écran.
>
> *Fait quand* : **[recopié plus haut, verbatim]**.
>
> *Manifeste* : **ce document, §1.1, §1.5 et §2** *(entrées `C4-L12`, `C4-L13`, `C6-L2`, `C6-L3`)* · `06-Palimpseste.md` **§2 et §5** — **relu et validé** · `02-exercices.md` **§6.C et §6.D** · `01-routeur.md` **§5**.

⚠️ **Deux phrases de cette entrée sont contredites par la mesure** — les trois v1 *(piège 41)* et le renvoi `02-` §6.D *(piège 42)*. **Elles se marquent `[faux]`, elles ne se corrigent pas.** Le reste tient.
