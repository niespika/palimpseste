# PROMPT — Session Code : C6-L1 — La page du professeur

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5. Ce que le lot construit, son manifeste et son « fait quand » font foi au `07-Implementation.md` §2 — ils sont recopiés ci-dessous avec **leurs versions au moment de l'écriture**.
>
> ⭐⭐ **Ton lot n'est pas celui que son titre annonce.** *« La matrice classe × compétence en lettres »* **existe, elle est en production, et elle fait déjà tout ce que la première phrase de ta mission décrit** — les six colonnes, les lettres, `n`, l'historique par observable, et la classe d'origine de chaque mesure. **Ce qui reste à construire, c'est la seconde moitié de l'entrée** : *« c'est la page où le professeur voit ce qui demande son attention, et elle porte donc quatre drapeaux »*. ⛔ **Trois de ces quatre drapeaux sont DÉJÀ CALCULÉS par du code éprouvé, et JETÉS À LA POUBELLE** ; le quatrième n'a jamais eu d'écrivain. **Ce prompt te dit où ils tombent.**

---

## ⭐⭐ CE QUI A ÉTÉ TRANCHÉ AVANT TOI — ne le rouvre pas

**Trois questions se posaient à la fabrication de ce prompt, et Louis les a rendues le 27/08.**

| | La question | La réponse de Louis, 27/08 |
|---|---|---|
| **①** | **Où vit la page.** La matrice est déjà bâtie à `/prof/classes/[classeId]?vue=competences`, et c'est littéralement *« la vue par classe »* du `01-` §2 et du `06-` §5 | ⭐ **La page de C6-L1 EST cet onglet-là.** Tu n'y refais pas la matrice : **tu y ajoutes les quatre drapeaux**, bornés à la classe regardée, **et le diagnostic de rétention**. *Aucune entrée neuve au menu Pilotage.* |
| **②** | **Le diagnostic de rétention** — *« il s'y range plutôt que dans un onglet à part »* | ⭐ **Il DÉMÉNAGE sous ta page, et ses DEUX fils cassés se réparent dans le même geste.** *Ranger un écran qui ne montre rien n'est pas le ranger.* |
| **③** | **Le faisceau d'intégrité et le canal de signalement** — confirmer un signalement vaut aujourd'hui **+1 strike**, donc **blocage des dépôts au seuil** | ⭐ **Le module `exercices` entre dans la liste par migration, PLUS un type de faisceau qui ne compte AUCUN strike** : le professeur voit, confirme, et rien ne se bloque. *Le faisceau dit « quelqu'un d'autre a fait le travail » ; le strike parle d'effort. Ce ne sont pas les mêmes conséquences.* |

✅ **CES TROIS DÉCISIONS SONT ÉCRITES DANS LA SOURCE — tu n'as rien à y porter.** Sur demande de Louis, la fabrication les a versées au `07-` : les **trois** à l'**inventaire des lots du §2**, dans ton entrée, et la **troisième aussi au §1.2**, où vit le canal de signalement. **Le `07-` passe en 2.61**, les dérivés ont été rejoués *(`derive-instruments.py --ecris` : **exactement quatre valeurs changées** — `version` et `empreinte` du `07-` dans `MANIFESTE.ts` et `calame-retour.ts` ; `--verifie` rend `INSTRUMENTS : IDENTIQUE`, `npm test` **1684/1684**)*. ⭐ **Deux conséquences pour toi.** *(1)* **Ton « fait quand » a gagné une clause** — celle de l'arbitrage ② —, et elle est recopiée plus bas. *(2)* ⚠️ **Le `07-` porte désormais lui-même les deux imprécisions de ton manifeste** *(voir la section suivante)*, **relevées et NON corrigées : une ligne de manifeste appartient à Louis, pas à une session.**

⭐ **Et ta boîte aux lettres a été vidée dans ce prompt** *(`PLAN_DE_CHANTIER.md` §5)* — **un item, déposé le 27/08 par `C5-L2`** : *la file des contestations est désormais l'argument d'un refus*. Il entre au **piège 30**, avec la question qu'il rouvre. **Tu n'as aucun relevé à aller lire** : la règle de manifeste te l'interdit, et tout ce qui t'était adressé est ici.

---

## Le manifeste — recopié du `07-Implementation.md` §2

> *Manifeste* : **ce document, §1** · `01-routeur.md` §8 et §10 · `06-Palimpseste.md` §5 et §6.

« Ce document » est le `07-Implementation.md`. **Trois pièces, et rien de plus.**

| Pièce | Où | Statut requis | Au moment de l'écriture |
|---|---|---|---|
| `07-Implementation.md`, **§1** *(les cinq blocs, §1.1 à §1.5)* | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | aucun — un lot n'exige pas un statut de la source qui le déclare *(`07-` §2)* | **VERSION 2.61** · RELU ET VALIDÉ · **le §1 et le §5 sont OUVERTS À L'IMPLÉMENTATION**, ainsi que l'inventaire des lots du §2 |
| `01-routeur.md`, **§8 et §10** | même dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | **VERSION 5.7** · VALIDÉ ET GELÉ |
| `06-Palimpseste.md`, **§5 et §6** | même dépôt | **déposé** *(entrée sans statut explicite)* | **VERSION 2.6** · VALIDÉ ET GELÉ |

### ⚠️ Ce que le manifeste ne nomme pas, et pourquoi tu le lis quand même

**Le statut porte sur le FICHIER, jamais sur la section** *(`07-` §2, en toutes lettres : « citer `01-routeur.md` §4 exige le statut de `01-routeur.md` ; la section dit seulement **où lire** »)*. **Quatre sections de tes deux fichiers gelés portent de la matière que ton lot ne peut pas ignorer, et le manifeste ne les nomme pas.** Elles ne sont donc **pas hors périmètre** — elles sont dans des fichiers qui sont au manifeste, et le pointeur de section est un guide de lecture, pas une clôture. ⭐ **Le `07-` §2 porte désormais ce constat lui-même**, sous ton entrée, **relevé et NON corrigé** : *« une ligne de manifeste appartient à Louis, la ligne de manifeste d'un lot n'étant pas une décision d'implémentation »*. ⛔ **Ne la corrige donc pas non plus.** **Lis-les, c'est tout :**

- **`01-routeur.md` §9** — *c'est là, et non au §10, que vit la **cadence d'ancre** dont ton troisième drapeau est le signal* : *« une ancre par compétence `evaluee` tous les 6 cycles… si le plan manque cet objectif : signal non bloquant vers le professeur »*. Le §9 porte aussi **les deux autres drapeaux** que `jugerLaLettre` calcule *(voir §C)*.
- **`06-Palimpseste.md` §2** — *« toute contestation portant sur une citation absente part **directement en file professeur** »*, et *« la contestation… **remonte au professeur en drapeau si elle se répète** »*. **Ton premier drapeau et la file d'examen humain naissent tous les deux là.**
- **`06-Palimpseste.md` §7** — la **loi 25**, qui fait de cette file une **exigence**, pas un confort.
- **`06-Palimpseste.md` §3** — *« trois `pas_pu` d'affilée lèvent un drapeau professeur »*, et l'**incohérence de la restitution à chaud**. ⚠️ **Ce sont des drapeaux de plus que les quatre de ta mission** *(piège 4)*.

⛔ **`00-referentiel.md` n'est PAS au manifeste**, et ton entrée le cite pourtant une fois — sur le seuil qui deviendrait la cible. **La phrase qui t'importe est recopiée dans ta mission ci-dessous** : tu n'as pas à ouvrir le fichier.

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

> **Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, cumulatifs ; « VALIDÉ ET GELÉ » vaut *relu et validé*.
>
> **La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ici, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.
>
> **Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot.

Concrètement : vérifie que les trois pièces **existent**, que le `07-` porte **VERSION 2.61**, le `01-` **5.7** et le `06-` **2.6**. ⛔ **La clause granulaire n'a ici AUCUN objet** : ce manifeste ne compte **aucune fiche de compétence**, et **ton lot ne mesure rien** — il affiche ce que d'autres ont mesuré.

### Ta dépendance est unique, et elle est jouée

*(`PLAN_DE_CHANTIER.md` §3 : « C6-L1 — la page du professeur | **C4-L5** | une matrice de lettres suppose des lettres ».)* **Vérifie-la par son chemin, pas par sa ligne au plan :**

- **C4-L5** — la chaîne de mesure et sa file : `utils/chaine/`, `competences_mesures`, `competences_squelettes`. *Jouée, deux migrations au `SUIVI_SQL.md` du 21/08.*

**Et quatre lots dont tu lis les sorties sans les toucher** : **C4-L2** *(les règles en fonctions pures — `utils/routeur/`)*, **C4-L12** *(l'écrivain — `utils/moteur/`, qui pose `competences_niveaux.lettre` et `competences_escalade`)*, **C4-L3** *(la contestation et la télémétrie du faisceau — `utils/deroule/`)* et **C4-L11** *(qui a fait atterrir l'opt-out à ton écran)*. **Si l'un de ces chemins manque, arrête-toi et signale-le, ne devine pas.**

### Cinq contrôles machine à jouer AVANT d'écrire une ligne

1. **`git status`.** ⚠️ **Au moment où ce prompt s'écrit, `main` est sur `49d58fe` et l'arbre porte SEPT entrées, dont quatre ne sont PAS de toi ni de la fabrication** : `SUIVI_SQL.md` modifié, `scripts/derive-doctrine.py` modifié, et **`retrait_production_2026-08-27.sql` à la racine, non suivi** *(un retrait de DONNÉES gardé, pas une migration de schéma)*. ⭐ **Trois viennent de la fabrication de ce prompt** : `PROMPT_Code_C6_L1.md` et `PLAN_DE_CHANTIER.md`, plus **`utils/chaine/derive/MANIFESTE.ts` et `calame-retour.ts`**, réécrits par le `--ecris` qui a suivi le passage du `07-` en **2.61** — **quatre valeurs, la version et l'empreinte du `07-`, rien d'autre**. ⛔ **Ne défais aucun des deux groupes, ne commite pas le premier**, et dis au relevé ce que tu as trouvé. *Un lot qui commite le travail d'une autre séance le lui vole.* ⚠️ **Et une autre séance travaillait sur ce dépôt le 27/08** : reconstate `git log --oneline -3` avant de te fier à un numéro de commit de ce prompt.
2. `npm test` — **il doit être vert avant que tu commences**, sinon tu ne sauras pas ce que tu as cassé. *(Mesuré le 27/08 : **1684 / 1684**, 47 suites, 0 échec.)*
3. `npx tsc --noEmit` — même motif.
4. **L'état des six interrupteurs**, par requête sur `scriptorium_params`. ⭐ **Ils sont à ON, en bac à sable comme en production, et c'est une DÉCISION DE LOUIS du 27/08** *(`07-` §5, « Ce que l'allumage est devenu »)*. **Celui qui commande ta page est `competences_affichage_actif`** : la grille ne part même pas quand il est fermé *(`app/prof/classes/[classeId]/page.tsx:100`)*. ⛔ **Tu n'en allumes ni n'en éteins aucun, et tu remets le tien comme tu l'as trouvé** — *« une recette qui remet un interrupteur en écrivant une constante ne le remet pas : elle l'impose »* *(`07-` §5)*.
5. **L'état de la matrice, à l'écran, avant d'y toucher** : `/prof/classes/<uuid>?vue=competences`. **Tu dois voir la grille des six colonnes.** Si tu ne la vois pas, cherche pourquoi **avant** d'écrire quoi que ce soit — c'est le socle de ton lot.

### Ce que tu peux écrire dans une source, et ce que tu ne peux pas

- **Le `07-` §1, le `07-` §5 et l'inventaire des lots du `07-` §2 sont ouverts à l'implémentation** : ce que la construction fait apparaître **s'y écrit depuis ton relevé, sans accord préalable**. ⚠️ **Le §3, le §4, le §6 et la règle de manifeste du §2 sont GELÉS.**
- ⭐⭐ **ET AMENDER UNE SECTION OUVERTE DU `07-` FAIT MÉCANIQUEMENT DIVERGER LES DÉRIVÉS.** *(Règle apparue à `C5-L4`, écrite au `07-` §5.)* Le geste de clôture est de **rejouer `python3 scripts/derive-instruments.py --ecris`**, **en dernier**, puis de vérifier que `--verifie` rend `INSTRUMENTS : IDENTIQUE` et que `npm test` repasse vert. ⛔ *Ne le joue pas au milieu de ta séance : tu ne saurais plus ce que tu as cassé.*
- **Partout ailleurs, une session Code ne corrige jamais une source** *(`07-` §2)*. Une source **fausse** — pas incomplète, fausse — reçoit **`[faux]`** au point de l'erreur, et une ligne à la section **DETTES** du `INVENTAIRE_Non_Tranches.md`, avec l'avant et l'après. **La prochaine dette est `D10`.**

---

## La mission — reprise du `07-Implementation.md` §2

> **C6-L1 — La page du professeur.** La **matrice classe × compétence** en lettres ; au clic, l'élève — son historique, la classe d'origine de chaque mesure, et **`n`, le nombre de mesures**. **Aucune confiance agrégée ne s'affiche** : rien ne la définit, et un chiffre qui ne mesure rien attire pourtant des décisions *(`06-Palimpseste.md` §5)*. Le diagnostic de rétention s'y range plutôt que dans un onglet à part.
>
> **C'est la page où le professeur voit ce qui demande son attention**, et elle porte donc **quatre drapeaux** :
>
> - les **contestations répétées** — *le seuil de répétition se règle ; il n'est pas arrêté*. **Il se lira sur la distribution observée** : combien d'élèves contestent, à quelle fréquence, et sur quoi — un seuil posé d'avance deviendrait la cible que le dispositif apprend à viser *(`00-referentiel.md` §5)*. **D'ici là, le drapeau se règle en configuration, et son absence de valeur ne bloque pas l'écran** ;
> - le **faisceau d'intégrité**, qui exige une confirmation humaine *(`06-Palimpseste.md` §6)* ;
> - la **fraîcheur d'ancre**, quand le plan d'évaluation manque la cadence *(`01-routeur.md` §10)* ;
> - les **dossiers N3** — leur file, leur date d'ouverture, et le **re-signalement** qui les remonte en tête quand ils restent sans traitement *(`01-routeur.md` §8)*. *Le moteur qui les ouvre appartient à C4-L2 ; c'est l'écran qui vit ici, parce que c'est ici que le professeur regarde.*

⭐ **Et l'entrée porte, depuis la 2.61, TROIS ARBITRAGES DE LOUIS et le constat dont ils naissent** — *la matrice existe et elle est en production*. **Ils sont en tête de ce prompt, et ils font partie de la mission au même titre que ce qui précède** : la page **est** l'onglet Compétences du profil de classe · le diagnostic de rétention **déménage et se répare** · le faisceau entre par le canal existant **avec un type qui ne compte aucun strike**. ⛔ **Ne les relis pas comme des suggestions.**

**Et rien d'autre.** Ce lot est **une page d'attention** : il **lit** ce que d'autres écrivent, il **fait remonter** ce qui se perdait, et il **donne un geste** au professeur là où l'entrée en demande un *(« se traite, et disparaît de la file »)*. Il n'écrit **aucune mesure**, ne change **aucune règle de ciblage**, ne pose **aucun interrupteur**, et ne touche **aucune ligne de `utils/chaine/`**. La réussite se mesure autant à ce qui **apparaît** — quatre drapeaux, une file qui se vide, un diagnostic qui parle enfin — qu'à ce qui **ne bouge pas** : `utils/chaine/`, `utils/routeur/` *(hors les entrées qu'on cesse de laisser vides)*, `utils/deroule/` et la grille elle-même doivent sortir de ce lot **inchangés**, ou l'écart se justifie ligne par ligne au relevé.

---

## Les pièges — les décisions dont l'oubli coûte une session

*Les renvois nomment leur document ; « §1 », « §5 » nus pointent au `07-Implementation.md`. En cas de doute entre ce prompt et la source : **la source a raison**. Les chemins et les numéros de ligne sont datés du **27/08** — vérifie-les, ne les crois pas.*

### A. Les frontières — ce que ce lot ne construit pas

1. ⛔⛔ **TU NE REFAIS PAS LA MATRICE. ELLE EST BÂTIE, ÉPROUVÉE ET EN PRODUCTION.** `utils/competences-classe.ts` *(`chargerGrilleCompetences`, ligne 313)*, `components/pilotage/GrilleCompetences.tsx` et `components/pilotage/MatriceCompetences.tsx`. Elle rend **les six colonnes du référentiel**, la **lettre posée**, `n`, **la fenêtre d'acquisition par observable**, la **série** de chaque observable, et elle **signale la mesure venue d'un autre cours** *(`PointObservable.ailleurs`)*. **La première phrase de ta mission est donc déjà tenue** — vérifie-le à l'écran, dis-le au relevé, et passe à la suite. ⚠️ *Son en-tête de fichier porte quatre avertissements durement acquis : lis-les avant d'y toucher, ils te feront gagner la journée.*
2. ⛔ **Tu ne construis aucun écran élève.** *« Ce que l'élève voit »* est **C6-L2** — sa trajectoire, sa cible, « quoi travailler », et **l'écran de sa semaine**. *« Côté élève, par défaut : sa trajectoire et sa cible. **Pas de lettre.** »* *(`06-` §5.)* **Rien de ce que tu écris ne s'affiche à un élève.**
3. ⛔ **Tu ne construis ni le pull ni le push** *(C6-L3)*, **ni le branchement de l'essai de Fragments** *(C6-L4)*.
4. ⛔ **Tu poses QUATRE drapeaux, et les sources en nomment au moins TROIS DE PLUS.** *« Trois `pas_pu` d'affilée lèvent un drapeau professeur »* et l'**incohérence de la restitution à chaud** *(`06-` §3)* ; la **discordance de deux paliers entre la trajectoire et l'ancre** *(`01-` §9)*. **Ton entrée en nomme quatre : tu en poses quatre.** ⭐ **Mais la mécanique que tu construis pour les quatre les servira tous** — si ton canal d'affichage les accueille sans code neuf, dis-le au relevé et laisse-les à un lot de correctifs, **avec leur liste**. *« Je ne fais pas X » n'est pas un dépôt : ça se nomme, avec les fichiers et les lignes.*
5. ⛔ **Tu ne touches ni au moteur de l'escalade, ni à la chaîne, ni aux règles de ciblage.** `utils/routeur/escalade.ts` porte `dossierN3` *(ligne 363)* et `enRegimeDEntretien` *(ligne 477)* ; `utils/moteur/etat-serveur.ts` les écrit. **Tu les LIS.** Le seul écart permis est de **cesser de laisser vide une entrée que le calcul attend** *(piège 15)* — et il se justifie au relevé.
6. ⛔ **Aucun septième interrupteur.** Le `07-` §5 : *« Aucun lot n'en crée un septième pour ses écrans. Un onglet, une liste, une porte ne sont pas des fonctionnalités à gater. »* ⭐ **Ta page a déjà le sien, et il n'a pas été créé pour elle** : `competences_affichage_actif` est **l'interrupteur de cet écran-là depuis toujours**.
7. ⛔ **Aucune note, nulle part** *(`06-` §5 : « la plateforme ne porte aucune note »)*. **Et aucune « confiance » agrégée** — *« rien ne la définit aujourd'hui, et un chiffre qui ne mesure rien attire pourtant des décisions »*. ⚠️ **Le piège est réel et il a un nom** : le jour où tu voudras résumer un drapeau en un score de 0 à 100, tu auras fabriqué exactement ce que cette phrase interdit.

### B. La matrice — ce qui existe, et les gardes qui la tiennent

8. ⚠️⚠️ **LA POPULATION DES MESURES EST CELLE DU ROUTEUR, PAS « TOUTES LES LIGNES ».** La lettre est écrite sur `mesuresQuiComptent(siennes, statutRecettePoseLe)` *(`utils/routeur/mesure.ts:127`)*, **qui retire deux populations** : les **sondes de montée** *(`01-` §8.8, M-e : « neutres pour tout le reste »)* et les mesures **antérieures à la pose du statut de recette** *(§1.3)*. ⛔ **Tout compte que tu ajoutes se fait sur la même population, en APPELANT la fonction** — jamais en recopiant la règle. *Une copie privée écrite pour l'ancienne forme a déjà coûté un écran entier.*
9. ⚠️ **« ACQUIS » A UNE DÉFINITION, ET CE N'EST PAS « RÉUSSI ».** La **réussite** porte sur **une** mesure *(seuil de la fiche)* ; l'**acquisition** porte sur la **fenêtre d'évidence** — les quatre dernières mesures qui comptent, taux **strictement > 2/3** *(`01-` §8.2 ; `estAcquis`, `SEUIL_ACQUISITION`)*. **C'est l'acquisition qui décide de l'escalade**, donc c'est elle que ton drapeau N3 doit refléter : sans quoi le professeur lit un nombre et le routeur en applique un autre.
10. ⚠️ **`competences_niveaux` N'A AUCUN `classe_id`** *(§1.3 : « clé (élève × compétence), et **pas de classe dans la clé** »)*. **La lettre est une propriété de l'ÉLÈVE, pas de son cours** — et le cas n'est pas théorique : deux élèves sont inscrits dans deux classes *(éprouvé en base par C4-L13)*. ⭐ **La matrice le résout déjà, et bien** : elle lit par élève, et **signale** la mesure venue d'un autre cours. **Tes drapeaux se bornent de la même manière** — par la population d'élèves de la classe, jamais par un `classe_id` sur la mesure, **qui est NULL la plupart du temps** *(§1.2)*.
11. ⚠️ **L'opt-out ne retire pas une lettre, il retire une compétence D'UN COURS** *(§1.3)*. `competences_actives_par_classe` est **lue par le routeur, jamais par la chaîne**. Une colonne en opt-out garde ses mesures et ses lettres ; l'écran dit *« retirée de ce cours »*. **Un drapeau sur une compétence en opt-out est du bruit** : décide ce que tu en fais, et écris-le.
12. ⚠️ **`profil_provisoire` supprime L'AFFICHAGE, jamais la valeur** *(§1.3, posé par C4-L12 : « la colonne porte la valeur PLAFONNÉE, c'est-à-dire l'ÉTAT ; la suppression d'affichage se fait à la LECTURE »)*. **Côté professeur, `06-` §5 est net : « les lettres, toujours. »** ⛔ *Ne va pas masquer une lettre au professeur au motif qu'un élève ne la verrait pas — la règle de masquage est une règle d'élève.*
13. ⚠️ **LE VIDE S'EXPLIQUE, ET IL A DEUX RAISONS QU'UN SEUL MESSAGE CONFOND.** *« La porte est fermée »* et *« il n'y a rien »* n'appellent ni la même phrase ni la même conduite *(`07-` §5, précisé par `C5-L4`)*. `MatriceCompetences.tsx` les distingue déjà, et **il en a une troisième — « une lecture a échoué »**. **Tes quatre drapeaux héritent de la règle** : un bloc de drapeaux vide sous un onglet qu'on vient de cliquer **doit dire pourquoi**. ⛔ **Et une lecture ratée n'est pas une base vide** : `supabase-js` **ne lève pas**, il rend `{ error }` — le patron des `incidents` est déjà là, sers-t'en.

### C. Les quatre drapeaux — et trois sont DÉJÀ CALCULÉS, puis JETÉS

14. ⭐⭐⭐ **`jugerLaLettre` REND UN TABLEAU `drapeaux[]`, ET PERSONNE AU MONDE NE LE LIT.** `utils/routeur/lettres.ts:165` le construit et y pousse **trois phrases écrites, prêtes à l'écran** : la **montée bloquée par incohérence répétée**, la **discordance de deux paliers avec l'ancre**, et **la cadence d'ancre manquée**. `utils/moteur/etat-serveur.ts:215` appelle la fonction, prend `verdict.valeurNonPlafonnee` et `verdict.plafond`… **et laisse tomber `verdict.drapeaux`.** *Vérifié par `grep` sur tout le dépôt le 27/08 : aucun lecteur, aucun test, nulle part.* ⛔ **C'est le cœur de ton lot, et le geste est petit** : il n'y a rien à recalculer, il y a un canal à ouvrir entre un calcul et un écran.
15. ⭐⭐ **ET DEUX DES TROIS NE SE DÉCLENCHENT MÊME PAS, PARCE QUE L'APPELANT NE LEUR DONNE RIEN.** `ContexteLettre` déclare `cyclesDepuisDerniereAncre` et `incoherenceRepetee` *(`lettres.ts:145-147`)* ; l'appel de `etat-serveur.ts:215` **ne passe ni l'un ni l'autre**. ⛔ **Ton troisième drapeau — la fraîcheur d'ancre — EST DONC STRUCTURELLEMENT MUET AUJOURD'HUI**, quel que soit l'état de la base. **La donnée existe** : `competences_niveaux.derniere_ancre` *(date et valeur, §1.3)*, `CYCLES_CADENCE_ANCRE = 6` *(`utils/routeur/config.ts:305`)*, et le cycle est la semaine du Calendrier *(`01-` §1)*. ⚠️ **Décide où tu le calcules — à l'écriture, ou à la lecture de l'écran — et dis pourquoi.** *Le §1 est ouvert à l'implémentation ; la forme t'appartient. Ce qui ne t'appartient pas, c'est de le laisser muet sans le dire.*
16. ⚠️ **LA CADENCE D'ANCRE EST UN SIGNAL NON BLOQUANT, ET LA LETTRE NE GÈLE PAS.** *« Rien n'est bloqué et la lettre ne gèle pas — elle continue de monter jusqu'au plafond ancre + 2 »* *(`01-` §9)*. ⛔ **Et la cadence NE SE DIFFÉRENCIE PAS PAR PARCOURS** : *« aucune cadence différenciée, aucune source d'ancre de remplacement, aucun traitement particulier d'un parcours n'est à construire »*. **Le signal joue à l'identique en TC et en HLP.**
17. ⭐ **LES DOSSIERS N3 — le moteur est écrit, la base est prête, et l'ÉCRAN est à toi.** `utils/routeur/escalade.ts:363` porte `dossierN3(etat, semainesDepuisOuverture)` avec son commentaire : *« Le moteur d'ouverture et de re-signalement est de ce lot ; **l'ÉCRAN de la file est C6-L1** »*. La table porte `dossier_n3_ouvert_at`, `dossier_n3_traite_at` et **un index partiel taillé pour ta file** — `idx_escalade_n3_ouvert … where dossier_n3_ouvert_at is not null and dossier_n3_traite_at is null` *(`c4_l1_schema.sql:756`)*. **Sers-t'en, n'en crée pas un second.**
18. ⛔⛔ **`dossier_n3_traite_at` N'A AUCUN ÉCRIVAIN — et c'est le mot « se traite » de ton « fait quand ».** *Vérifié : la colonne est lue par `utils/routeur/donnees.ts:208` et par `escalade.ts:370`, et **rien ne l'écrit**.* **Le geste du professeur est à toi**, et il est le seul geste d'écriture de ton lot sur cette table. ⚠️ **Il passe par le serveur** — *« toutes les écritures passent par le serveur »* *(§1)* — et **il ne doit pas désescalader** : `dossier_n3_traite_at` dit *« le professeur a pris le dossier »*, jamais *« l'observable est acquis »*. **La désescalade a sa règle, et elle est ailleurs** *(`01-` §8.6 : « dès que l'observable ciblé change de statut »)*.
19. ⚠️ **LE RE-SIGNALEMENT REMONTE EN TÊTE, IL NE COMPTE PAS.** *« Passé **3 semaines** sans traitement, il remonte en tête de l'écran professeur. **Ni plafond ni file d'attente.** »* *(`01-` §8.4 ; `SEMAINES_RESIGNALEMENT_N3 = 3`, `utils/routeur/config.ts:250`.)* ⛔ **« Ni plafond ni file d'attente » est une contrainte d'écran** : pas de « 5 premiers », pas de pagination qui cache le reste. **Si tu bornes, l'écran le dit.**
20. ⚠️ **UN DOSSIER N3 PORTE UN DOSSIER COMPLET, pas une ligne.** *« Drapeau professeur avec **dossier complet** : observable en échec, **interventions tentées**, **productions exemplaires** »* *(`01-` §8.4)*. Les trois se lisent : l'observable est la clé de `competences_escalade` ; les interventions se lisent au **degré** et à `entre_n1_at` ; les productions, par les mesures de l'observable et leurs dépôts. **Ne rends pas un dossier à un tiers vide en appelant ça une file.**
21. ⚠️ **LA CLÉ DE L'ESCALADE EST (élève × compétence × OBSERVABLE)** *(§1.3)* : *« un élève peut être en N2 sur un observable d'Argumentation et en régime normal partout ailleurs »*. **Un élève peut donc porter plusieurs dossiers N3 à la fois, sur la même compétence.** Ta file compte des **dossiers**, pas des élèves — et l'écran doit rendre les deux lisibles.
22. ⚠️ **N3 N'EXISTE QUE LÀ OÙ IL PEUT EXISTER** *(`01-` §8.1)* : compétence **`evaluee`**, **jamais en `profil_provisoire`**, et *« les compteurs ne démarrent qu'au **segment 3** »*. **Une file vide en septembre n'est pas une file cassée** — c'est le régime normal, et ton écran doit le dire plutôt que de laisser croire à une panne.

### D. Les contestations — un drapeau et une file, et ce ne sont pas la même chose

23. ⚠️⚠️ **DEUX CHOSES DISTINCTES ARRIVENT ICI, ET LES CONFONDRE EN PERD UNE.** *(a)* **Le drapeau des contestations RÉPÉTÉES** — *« la contestation est journalisée, n'altère rien automatiquement, et **remonte au professeur en drapeau si elle se répète** »* *(`06-` §2)* : c'est le **premier** de tes quatre. *(b)* **La FILE d'examen humain** — *« toute contestation portant sur une **citation absente** part **directement** en file professeur — ce qui satisfait aussi l'exigence d'examen humain de la loi (§7) »*. **La seconde n'attend aucune répétition, et elle n'est pas un confort.**
24. ⭐ **LE SEUIL DE RÉPÉTITION EST TRANCHÉ PAR LA SOURCE, ET IL EST TRANCHÉ EN TA FAVEUR.** Ton entrée l'écrit : *« le drapeau **se règle en configuration**, et **son absence de valeur ne bloque pas l'écran** »*. ⛔ **Tu ne chiffres donc rien** — *« un seuil posé d'avance deviendrait la cible que le dispositif apprend à viser »*. ⭐ **Le patron du paramètre existe déjà et il est nommé** : `scriptorium_params.exercices_retour_longueur`, `text` nullable, posé par C4-L11 *(`c4_l11_additifs.sql`)*, **avec sa règle « NULL vaut la valeur par défaut »**. **Un paramètre n'est pas un interrupteur** *(`07-` §5)*.
25. ⭐ **LA MARQUE EST DÉJÀ EN BASE, ET ELLE A ÉTÉ POSÉE POUR TOI.** `exercices_metacognition.contestation_points` est **une liste d'actes** — `{point_id, texte, at, citation_absente}` *(`utils/deroule/types.ts:156`)* —, et `utils/deroule/contestation.ts:126` laisse une trace serveur qui te nomme : *« L'écran du professeur est à C6-L1 ; la marque `citation_absente` la rend trouvable. »* ⛔ **N'invente aucune file** : *« une seconde file serait un second domicile, et deux domiciles divergent »*.
26. ⚠️ **ELLE EST PAR POINT, ET C'EST UNE LISTE D'ACTES** *(§1.2)*. *« Deux points contestés portent deux textes courts »*, et *« un même point recontesté **remplace** son acte : c'est une correction de saisie, pas une seconde contestation »* — `contestation.ts` le fait déjà en filtrant sur `point_id`. ⛔ **Ton compte de répétition compte donc des ACTES DISTINCTS, jamais des écritures.**
27. ⛔⛔ **ET RIEN NE MARQUE UNE CONTESTATION COMME EXAMINÉE.** `ActeContestation` porte `point_id`, `texte`, `at`, `citation_absente` — **et aucun `traite_at`**. Ta file *« se traite »*, comme celle des N3 : **il te faut une marque, et la forme t'appartient** *(le §1 est ouvert : « la forme physique appartient à la session Code — colonne, table fille ou JSONB »)*. ⚠️ **Si tu l'écris dans le JSONB, souviens-toi que l'écriture est un `upsert` sur `depot_id` et que l'élève peut contester en même temps** : lis-modifie-écris n'est pas atomique. *`journaliser_collage()` de `c4_l4_collage_journal.sql` est le patron d'un ajout atomique dans un jsonb, si tu en as besoin.*
28. ⚠️ **UNE CONTESTATION N'ALTÈRE RIEN AUTOMATIQUEMENT** *(`06-` §2 ; `contestation.ts` : « ce module n'écrit que dans `exercices_metacognition` — il ne touche ni au retour, ni à la mesure, ni au statut du dépôt »)*. **Ton écran n'a donc AUCUN bouton qui corrige une mesure.** *Contester n'est pas corriger ; regarder n'est pas corriger non plus.*
29. ⚠️ **LE RETOUR EST SEGMENTÉ, ET C'EST CE QUI REND TON COMPTE POSSIBLE.** *« Chaque point d'un retour porte un identifiant stable. Sans lui, une contestation ne peut pas désigner ce qu'elle conteste : elle devient un commentaire libre, et **le drapeau des contestations répétées n'a plus rien à compter** »* *(§3 ; §1.2)*. **Pour montrer CE QUI est contesté, remonte au point du retour par son identifiant** — `exercices_retours.texte` est la liste, ne la redécoupe pas.
30. ⭐ **L'ITEM DE TA BOÎTE — ET IL ROUVRE UNE QUESTION LE JOUR OÙ TON ÉCRAN EXISTE.** *(Déposé le 27/08 par `C5-L2`.)* `C5-L2` **refuse, avant publication**, un retour dont une citation étiquetée « copie » est en réalité une phrase du **texte support** — et **le motif de ce refus est l'absence de ton écran** : laissée passer, la faute devient une contestation `citation_absente` qui part en file, **et l'élève a déjà lu « Tu écris : … » sous une phrase qu'il n'a pas écrite**. ⚠️ **Quand ton écran existe, la question se rouvre : faut-il continuer de refuser, ou laisser passer et compter sur l'examen humain ?** ⛔ **Tu ne la tranches pas en passant** — *le refus coûte un retour et un rejeu de l'étape `retour_v1`, et il est aujourd'hui le seul geste qui protège l'élève*. **Pose-la à Louis au relevé, avec ce que ton écran change au calcul.**

### E. Le faisceau d'intégrité — la décision de Louis, et les deux listes fermées

31. ⭐ **LE CANAL EST NOMMÉ PAR LA SOURCE, ET IL NE S'EN CRÉE PAS UN SECOND.** *« Le drapeau d'intégrité passe par le canal qui existe déjà — **`signalerEnAttenteIA`** (`utils/integrite.ts`), qui écrit dans **`integrite_signalements`**, déduplique par rendu et s'éteint par son propre interrupteur. **Un lot le réutilise, il n'en crée pas un second.** »* *(§1.2.)* `signalerEnAttenteIA` est à `utils/integrite.ts:174`.
32. ⭐⭐ **CE QUE LOUIS A TRANCHÉ, ET IL FAUT LES DEUX MOITIÉS.** *(a)* **Le module `exercices` entre dans la liste** — *« le module `exercices`, lui, rejoindra la liste — mais avec le FAISCEAU, à C6-L1 »* *(§1.2)*. ⚠️ **C'est un `CHECK` INLINE en base** : `module text not null check (module in ('aletheia','codex','fragments'))` *(`integrite_petits_malins.sql:19`)* — **il se droppe et se recrée, ce n'est pas « une ligne additive »** *(la leçon exacte de `C4-L16`)*. Et `ModuleIntegrite` + `LABEL_MODULE` sont **deux listes fermées côté TypeScript** *(`utils/integrite.ts:14` et `:17`)*. *(b)* **Un type de faisceau qui ne compte AUCUN strike.** ⛔ **Les cinq types existants parlent tous d'EFFORT** — `vide`, `aveu_non_travail`, `hors_sujet`, `section_na`, `bacle` — et le §1.2 le dit en toutes lettres : *« un type de signalement n'est pas un signal du faisceau mais **un strike**, dont le mécanisme parle d'**effort** et **bloque les dépôts au seuil** »*. **Le faisceau dit autre chose : « quelqu'un d'autre a fait le travail ».**
33. ⚠️⚠️ **OÙ LE STRIKE SE COMPTE, ET LE VERROU QUE TU DOIS RESPECTER.** `signalerEnAttenteIA` écrit déjà `statut: 'en_attente'` et `compte_strike: false` — **elle ne strike pas**. **C'est `confirmerSignalement` qui strike** *(`utils/integrite.ts:198`)*, et son idempotence repose sur un **compare-and-set** : `.update({compte_strike: true}).eq('compte_strike', false)`. ⛔ **Si ton type ne compte pas de strike, tu ne peux pas te contenter de ne pas incrémenter** — laisser `compte_strike` à `false` rendrait la confirmation **rejouable à l'infini**. **Décide comment tu fermes l'idempotence** *(`acquitte_at` est déjà un candidat, et `acquitterSignalement` s'en sert)*, **et écris-le.**
34. ⚠️ **`chargerPreuve` A TROIS BRANCHES, ET IL LUI EN FAUDRA UNE QUATRIÈME.** `utils/integrite-preuve.ts:68` route sur `fragments | aletheia | codex`, **et le format de `rendu_ref` diffère par module** — son en-tête le dit : *« on ne fait donc JAMAIS un `split(':')` global : le parsing est conditionné au module »*. **Choisis ta forme de `rendu_ref`, écris-la dans le commentaire, et souviens-toi de la contrainte d'unicité `(eleve_id, module, rendu_ref)`** : c'est elle qui déduplique. *Un dépôt porte deux versions ; un faisceau par version et un faisceau par dépôt ne comptent pas la même chose.*
35. ⚠️ **LES SEPT SIGNAUX SONT COLLECTÉS, ET LA CONVERGENCE N'A AUCUN ÉCRIVAIN.** *Où chacun vit, vérifié le 27/08* : la **durée** *(`utils/deroule/duree.ts`, tag `tres_courte`)* · le **rythme et l'apparition par blocs** et le **nombre de sessions** *(`exercices_depots.saisie_telemetrie`, quatre compteurs par version — `utils/deroule/telemetrie.ts`)* · les **collages bloqués** *(`exercices_depots.collages_bloques`, garde `depots_collages_chk`, ajout atomique — `c4_l4_collage_journal.sql`)* · le **`delta_v1_vf` nul** et l'**incohérence v1 / auto-jugement**, *« produits par la chaîne »* *(§1.2 ; `competences_mesures.delta_v1_vf` et `exercices_metacognition`)* · et le **style discordant**, *« signal faible »*, **qui n'a aucun producteur**. ⛔ **`telemetrie.ts` refuse explicitement de conclure** : *« on n'écrit ici aucun seuil de suspicion, aucun drapeau, aucun verdict… ce module COMPTE, il ne conclut rien »*. **C'est toi qui conclus — et « conclure » veut dire lever un drapeau qui exige une confirmation humaine, jamais rendre un verdict.**
36. ⛔⛔ **DEUX GARDES QUE LE FAISCEAU NE FRANCHIT PAS.** *(1)* **Il ne regarde QUE le formatif fait à la maison** *(`06-` §6 : « les deux examens diagnostiques et l'essai Fragments se font en classe, à la main, sous surveillance »)*. **Une passation en classe n'entre jamais dans ton compte.** *(2)* **`delta_v1_vf` NULL n'est PAS zéro** — *« une passation en classe n'a pas de version finale, et lire son NULL comme un zéro fabriquerait un faux signal »* *(`06-` §6 ; `01-` §11)*. ⚠️ **Le même piège vaut pour tous tes compteurs** : `nouvelleTelemetrie()` part à zéro, et *« zéro n'est pas "pas de mesure" »* — un rythme sur dénominateur vide rend `null`, jamais 0.
37. ⛔ **UNE TENTATIVE D'INJECTION N'EST PAS UN SIGNAL DU FAISCEAU** *(§1.2, écrit exprès pour éviter qu'on l'y range)*. *« Les sept signaux disent tous la même chose — quelqu'un d'autre a fait le travail — tandis qu'une injection dit que l'élève a essayé de manipuler le correcteur : autre phénomène. »* **La remonter serait un huitième signal au `06-` §6, une décision de doctrine, plus une ligne à la table de traitement de la lettre d'information** *(`06-` §7)*. ⛔ **Ne l'ajoute pas en passant.**
38. ⚠️ **LA CONVERGENCE N'EST CHIFFRÉE NULLE PART.** *« Quand les signaux convergent »* — le `06-` §6 ne dit pas combien. ⭐ **Ton entrée donne le patron pour l'autre seuil non chiffré** *(piège 24)* : **un réglage de configuration, dont l'absence de valeur ne bloque pas l'écran**. **Prends le même, ou dis pourquoi tu prends autre chose** — et **journalise ce que tu comptes**, sans quoi personne ne pourra régler ce qu'il ne voit pas. ⛔ **Aucun seuil en dur au milieu d'une comparaison** : *« enfoui dans une boucle, il deviendrait une règle que personne n'aurait prise »* *(`telemetrie.ts`, sur `SEUIL_PAUSE_MS`)*.
39. ⚠️ **L'INTERRUPTEUR DU CANAL EST `integrite_params.actif`, ET IL N'EST PAS À TOI.** `lireParamsIntegrite` le lit, `signalerEnAttenteIA` **sort sans rien écrire** quand il est à OFF. ⛔ **Chaque écran lit LE SIEN** *(`07-` §5)* : ta page est gardée par `competences_affichage_actif`, et le canal par le sien. **Ne les confonds pas, et n'en bascule aucun.**

### F. Le diagnostic de rétention — il déménage, et il est muet

40. ⭐⭐ **L'ÉCRAN EXISTE, ET IL EST ORPHELIN.** `app/prof/quazian/diagnostic/page.tsx` — trois vues *(Par classe · Par unité · Flashcards)*. ⛔ **Vérifié le 27/08 : AUCUN lien du dépôt ne mène à cette page.** Elle n'est pas dans `sousOngletsProf` de Quazian *(`components/nav/configModules.ts` : Flashcards · Quizz · Paramètres)*, et la racine `/prof/quazian` n'y renvoie pas. **Seule sa variante par élève est atteignable**, depuis `app/prof/eleves/[eleveId]/page.tsx:78`. *« Un écran sans porte n'existe pas » — c'est le critère de C4-L6, et c'est exactement ce que « plutôt que dans un onglet à part » veut dire.*
41. ⛔⛔ **ET IL EST DOUBLEMENT MUET — LES DEUX FILS SONT NOMMÉS, ET LOUIS A DEMANDÉ QU'ON LES RÉPARE.** *(`IDEES_post_rentree.md:67`, « renvoyé à C6 ».)* *(a)* `app/prof/quazian/diagnostic/actions.ts:98` filtre `scriptorium_unites` sur **`type='unite'`** → **zéro ligne** depuis la réorganisation du Scriptorium. *(b)* Il agrège les réponses par **`quazian_quizzes.scope_unites`** — colonne que **les quiz créés depuis C7-L1 laissent vide** au profit de `scope_contenus`. **L'écran ne montre donc rien, même une fois des quiz passés.** ⭐ **Le correctif est déjà éprouvé ailleurs** : `utils/quazian-cibles.ts` / `chargerCiblesQuazian` — *c'est exactement le geste que Codex a reçu le 14/08*. **Réutilise-le, ne le réécris pas.**
42. ⛔ **QUAZIAN N'ÉCRIT PAS DANS LE PROFIL DE COMPÉTENCES, ET RIEN NE DOIT L'Y FAIRE ENTRER.** *« Quazian : mesure continue de la Connaissance… **il n'écrit pas dans le profil de compétences** »* *(`01-` §2)*, et *« Quazian mesure sa rétention en continu et n'écrit pas dans le profil : c'est le signal du **renvoi hors routeur**, jamais une lettre »* *(`01-` §6, R4)*. ⛔ **Le diagnostic de rétention se RANGE à côté de la matrice ; il n'entre dans aucune cellule, et il ne produit aucune lettre.** *Une colonne « Connaissance » nourrie de flashcards serait le contraire exact de la règle.*
43. ⚠️ **NE CONFONDS PAS QUATRE CHOSES QUI PORTENT LE MOT « DIAGNOSTIC »** : le **geste `diagnostiquer`** *(un cran, `02-` §2.3.1)* · l'**examen diagnostique** *(l'ancre, `01-` §10)* · le **diagnostic de compréhension** *(Aletheia, E→A, prof-only)* · et le **diagnostic de RÉTENTION** *(Quazian — le tien)*. **Tes libellés n'en désignent qu'un.**

### G. Le grain, les mots et les gardes qui traversent

44. ⚠️⚠️ **LES TROIS PIÈGES DE `supabase-js`, ET ILS MORDENT DANS LES LISTES.** *(1)* **Il ne lève pas** : il rend `{ error }` — une lecture ratée n'est pas « rien à signaler », on la journalise et l'écran le dit. *(2)* **Il plafonne toute réponse à 1000 lignes sans rien signaler** : pagine, ordonne sur une clé unique, et **confronte au `count: 'exact'`** — le patron est `lirePagine` *(`utils/routeur/donnees.ts`)*, et `utils/competences-classe.ts` s'en sert déjà en le disant. *(3)* **Son constructeur de requête est paresseux** : du code qui paraît parallèle peut être séquentiel — `Promise.all` sur des requêtes **déjà lancées**, pas sur des constructeurs. ⚠️ **`competences_mesures` GRANDIT** — une ligne par élève, par compétence et par dépôt.
45. ⛔ **LE MOTEUR NE PORTE AUCUNE POLICY ÉLÈVE SUR SES TABLES** *(§1 : « lecture élève : ses propres lignes, strictement ; **toutes les écritures passent par le serveur** »)*. **Ta page est prof-only et se lit côté serveur, avec le client admin.** ⚠️ **N'ouvre aucune policy pour rendre une lecture plus simple à écrire**, et **n'expose jamais à un client** ce que `exercices_squelettes` et `exercices_metacognition` portent : *« c'est la garde la plus facile à casser et la plus coûteuse : elle donne la grille et les réponses »* *(§1)*. **Ta preuve de contestation est un cas limite** : elle montre **le point du retour publié**, pas le squelette.
46. ⚠️ **`mesure_at`, `dossier_n3_ouvert_at`, `acquitte_at` SONT DES INSTANTS.** Ils se formatent **dans le fuseau de l'école**, lu **une fois** côté serveur *(`lireFuseau`, `utils/fuseau-serveur.ts`)* et passé en prop — c'est ce que fait déjà `app/prof/classes/[classeId]/page.tsx`. ⛔ **Une date pure reste en UTC** : la règle est au `utils/fuseau` et elle a déjà coûté un lot.
47. ⚠️ **UN COMPTE DE SEMAINES N'EST PAS UN COMPTE DE JOURS DIVISÉ PAR SEPT.** Le **cycle** est la semaine du Calendrier *(`01-` §1 ; `utils/moteur/calendrier-serveur.ts`)*, et **les semaines de vacances n'en sont pas** *(`06-` §5 ; `07-` §1.5 : « elles sortent du dénominateur PAR OMISSION »)*. **Tes « 3 semaines » de re-signalement et tes « 6 cycles » de cadence se comptent en cycles, pas en `Date`.**
48. ⚠️ **RÉUTILISE LES JETONS DE `globals.css`, jamais un hex en dur** *(`AGENTS.md`)*. ⭐ **L'unique exception documentée est `components/nav/configModules.ts`** *(la palette de l'en-tête)* — **et tu n'y touches pas** : tu ne poses aucun onglet. **Le vocabulaire visuel de ta page est celui du Pilotage**, et `MatriceCompetences.tsx` en porte déjà le patron *(`border-bordure`, `bg-surface`, `text-encre-douce`, `border-retard` pour un incident)*.
49. ⚠️ **UN MODULE = 2-3 ONGLETS** *(`AGENTS.md`)*. **Le profil de classe en porte DEUX** — Activité · Compétences *(`components/pilotage/BasculeVue.tsx`)*. ⛔ **N'en ajoute pas un troisième pour tes drapeaux** : ton entrée dit *« la page où le professeur voit ce qui demande son attention »*, **une page, pas trois**. *Si tu conclus qu'il en faut un troisième, dis-le et argumente ; ne le pose pas en passant.*
50. ⚠️ **CETTE VERSION DE NEXT N'EST PAS CELLE DE TON ENTRAÎNEMENT.** Lis `node_modules/next/dist/docs/` avant d'écrire une route, une action ou un `searchParams` *(`AGENTS.md`)*. ⛔ **Et ne lance jamais `next build` pendant que `next dev` tourne** — le cache `.next` se corrompt.
51. ⚠️ **LE CRLF DES `<textarea>`, pour mémoire** : un formulaire HTML soumet en **CRLF**, le stocké est en **LF**, et **cela vaut aussi pour les server actions React** *(mesuré à `C5-L1` le 26/08 ; le piège a mordu trois fois)*. ⛔ *Ton lot ne devrait écrire aucun texte libre. Si tu en écris un — un motif de traitement, une note de dossier —, normalise à l'écriture, et dis-le.*

---

## Le « fait quand » — recopié du `07-Implementation.md` §2

> *Fait quand* : la matrice affiche des **lettres réelles** ; un **dossier N3 ouvert apparaît, se traite, et disparaît de la file** ; ⭐ **et le diagnostic de rétention s'atteint depuis cette page et MONTRE QUELQUE CHOSE** *(clause ajoutée par l'arbitrage ② du 27/08 — un écran rangé et toujours muet n'est pas rangé)*.

**C'est la condition de recette, et elle ne se négocie pas en séance.** Quatre précisions sur la manière de la prouver :

- **« des lettres réelles » se prouve SUR DES DONNÉES, pas sur une capture d'écran vide.** ⚠️ **Au 26/08, le bac à sable portait 102 niveaux à `lettre` NULLE** sous des mesures qui, elles, portaient leur lettre-équivalente *(constaté par `utils/competences-classe.ts`)*. **Compte ce que tu vois, dis d'où il vient, et distingue « aucune lettre » de « aucune mesure ».** ⭐ *La production porte 13 copies mesurées : c'est là que la matrice a le plus de chances d'être pleine — en lecture seule.*
- **« se traite, et disparaît de la file » se démontre PAR UN CYCLE COMPLET**, en base : un dossier N3 semé, vu dans la file, traité par le geste de l'écran, **absent de la file au rechargement**, et **`dossier_n3_traite_at` non nul en base**. ⛔ *Une file qu'on n'a jamais vue se vider n'est pas une file.*
- **Les quatre drapeaux se prouvent CHACUN par un cas semé, pas par un raisonnement.** Écris au relevé, pour chacun : **la donnée qui le lève**, **la phrase qu'il affiche**, et **ce qu'il fait quand la donnée disparaît**.
- ⭐ **La quatrième clause se prouve DEUX FOIS, et la seconde est la vraie** : *(a)* **le clic** — depuis ta page, on atteint le diagnostic de rétention sans connaître d'identifiant ; *(b)* **ce qu'il montre** — des fragilités **réelles**, sur des quiz réellement passés. ⛔ *Une page qui rend « Aucune donnée de quizz pour cette sélection » sur une base qui en porte n'a pas levé la clause : c'est exactement le symptôme des deux fils cassés (piège 41).*

⚠️ *Une session Code ne s'authentifie pas : le smoke prof se fait avec Louis, dans une session qu'il ouvre.*

---

## Les conventions — `PLAN_DE_CHANTIER.md` §5

### ⭐⭐ De couture — et ta couture est la question même de ton lot

**Pour tout lot qui succède à un autre** — c'est-à-dire **tout lot dont le `07-` §2 lui déclare une dépendance** : le lot **éprouve la couture avec le ou les lots dont il dépend**, et **pas seulement sa propre frontière**. **Trois gestes.**

1. **Nommer les coutures qu'il traverse**, une par une, sous la seule forme qui les rend vérifiables — *qui écrit cette colonne · qui la lit · **un chemin réel y mène-t-il ?***
2. **Les éprouver par EXÉCUTION, jamais par lecture** : faire passer une donnée d'un bout à l'autre et **constater en base**, comme les **vingt-huit** `scripts/recette/*.mjs` du dépôt le font déjà.
3. **Laisser le script au dépôt**, avec son **mode de retrait** — *c'est lui, pas le relevé, qui se rejouera à la prochaine revue.*

⭐ **Elle est écrite parce que c'est le seul défaut qu'aucun lot ne peut voir depuis sa place.** Le défaut central de `C4-L7` — *un retour de la maison ne pouvait jamais atteindre l'élève* — a traversé **dix lots** sans que rien ne l'arrête : *« chacun est juste à sa frontière, et **le trou est ENTRE eux** »*.

⭐⭐ **TA COUTURE SE NOMME EN UNE PHRASE, et elle est exactement ce que ton lot a trouvé :**

> **Un signal levé par le moteur atteint-il l'œil du professeur — et son geste redescend-il jusqu'à la base ?**

**Elle traverse ta dépendance et trois lots de plus.** *Cinq coutures à nommer, et quatre d'entre elles sont aujourd'hui COUPÉES :*

| # | Qui écrit | Qui lit | Chemin réel ? |
|---|---|---|---|
| **①** | `utils/moteur/etat-serveur.ts` → `competences_niveaux.lettre` | la matrice | ✅ **existe** — c'est le seul qui passe |
| **②** | `jugerLaLettre` → `verdict.drapeaux[]` | *personne* | ⛔ **coupé** *(piège 14)* |
| **③** | `etat-serveur.ts` → `competences_escalade.dossier_n3_ouvert_at` | *personne* | ⛔ **coupé** *(piège 17)* |
| **④** | `contestation.ts` → `contestation_points[].citation_absente` | *une trace serveur* | ⛔ **coupé** *(piège 25)* |
| **⑤** | `telemetrie.ts` + `collage.ts` + la chaîne → les sept signaux | *personne* | ⛔ **coupé** *(piège 35)* |

⭐ **Le modèle du script existe et il est récent** : `scripts/recette/couture-c5l4.mjs`, avec son `--retire` et son `--garde-le-decor`. **Le tien sème un décor** *(un dossier N3 ouvert depuis plus de trois semaines · une contestation sur citation absente · une compétence sans ancre depuis plus de six cycles · un dépôt maison dont les signaux convergent)*, **appelle les lectures que ta page appelle**, et **constate que chacune sert sa ligne**. ⛔ **Pas de lecture de code en guise de preuve.** ⛔ **Aucun appel de modèle payé par le script.**

⚠️ **Elle ne demande pas de réparer ce qu'elle révèle.** Ce que le passage montre **se dépose** au `SUIVI_tests_manuels.md` avec sa condition de reprise. ⚠️ **Et le corollaire vaut ici aussi** : *« je ne fais pas X, c'est ton lot » n'est pas un dépôt* — une couture que tu déclares hors périmètre **se nomme au destinataire, dans SA boîte** *(`PLAN_DE_CHANTIER.md` §5)*, ou elle n'existe pour personne.

### Du dépôt

⚠️ **UNE MIGRATION EST ATTENDUE — le `CHECK` du module d'intégrité** *(piège 32)*, **et peut-être une seconde** *(la marque de traitement d'une contestation, piège 27 ; le paramètre du seuil, piège 24)*.

**Pour chacune** : **une ligne au `SUIVI_SQL.md` AVANT exécution**, jamais après — date, fichier, zone, cases **Sandbox** et **Prod** ; un fichier `.sql` à la racine **plus son rollback, écrit avant l'exécution et présent sur le disque** ; **additive et gatée** ; **bac à sable d'abord**.

⛔⛔ **`integrite_signalements` EST UNE TABLE VIVANTE** — elle porte les signalements réels d'élèves réels, et son `CHECK` est **inline**. **Le protocole renforcé de la règle R6 s'applique** : lis-la en tête du `SUIVI_SQL.md` avant d'écrire une ligne. **Sandbox d'abord et jamais l'inverse · ne jamais rejouer un fichier de l'Archive · répétition à blanc sur le CORPS du fichier**, jamais sur le fichier entier *(son `commit;` validerait ta transaction d'essai)*. **C'est aussi la règle absolue de l'`AGENTS.md`.**

**Les six interrupteurs restent où ils sont, et comme tu les trouves** — `exercices_actif`, `routeur_actif`, `competences_affichage_actif`, `fabrique_actif`, `chaine_actif`, `passation_classe_actif`. ⛔ **Aucun septième** *(`07-` §5, en toutes lettres)*.

**La doctrine en base est dérivée, jamais tapée, et il n'y a qu'un dériveur.** ⭐ *Ton lot ne devrait lire aucune table de doctrine — il montre des lettres, il n'assemble pas d'instance.* Si l'un de tes écrans en lit une, joue `python3 scripts/derive-doctrine.py --verifie` avant : il doit dire **IDENTIQUE** sur les **douze** tables, les empreintes de source et la fixture. **S'il dit DIVERGE, rejoue `--sql` ; jamais corriger la base à la main.**

### De clôture

**Ta section au `SUIVI_tests_manuels.md`**, au moment où le lot se clôt : ce qui a été **prouvé en séance, coché avec sa preuve**, et ce qui **reste à jouer en recette, décoché, avec sa condition de reprise nommée**. *Un reste de recette qui ne vit que dans un relevé ne se rappelle à personne.*

⭐⭐ **Et une case qui t'attend déjà, décochée, avec ton nom dessus** : **`C4L3-19`** — *« la file professeur des contestations sur citation absente n'a pas d'écran… **Adressé à C6-L1** »* *(`SUIVI_tests_manuels.md:2765`)*. **Si tu la lèves, coche-la** ; si tu ne la lèves pas, **réécris sa condition** — *un reste dont la condition est fausse est pire qu'un reste*.

⚠️ **Et un renvoi de périmètre laisse sa trace, AVEC SA LISTE** *(la leçon de C4-L6)*. Tu vas en produire : les trois drapeaux hors de tes quatre *(piège 4)*, le septième signal du faisceau qui n'a aucun producteur *(piège 35)*, la question que ton écran rouvre chez `C5-L2` *(piège 30)*. **Tout ce que tu constateras sans le réparer se nomme, avec les fichiers et les lignes.**

⭐ **Deux entrées d'`IDEES_post_rentree.md` te concernent, et l'une d'elles se ferme avec toi** : celle du **diagnostic Quazian** *(ligne 67, « à reprendre en C6 »)* — **raye-la quand tu l'auras réparée** ; et celle de l'**intégrité** *(« un prof ne peut PAS bloquer un élève qui n'a jamais été signalé »)*, **qui n'est pas de ton périmètre** mais que ton passage dans ce code rendra tentante. **Ne la joue pas.**

### De dette

**Une source trouvée fausse se MARQUE, elle ne se corrige pas** *(`07-` §2)*. Deux gestes : **`[faux]`** au point de l'erreur, et **une ligne à la section DETTES** du `INVENTAIRE_Non_Tranches.md`, qui porte l'**avant / après**. **La prochaine dette est `D10`.**

⚠️ *Ne confonds pas avec le **`07-` §1**, le **`07-` §5** et l'**inventaire des lots du `07-` §2**, **tous ouverts à l'implémentation** : ceux-là, tu les amendes depuis ton relevé, sans accord préalable — ce n'est pas une dette, c'est ton travail.* ⛔ **Le `01-` et le `06-` sont GELÉS : si tu conclus qu'il leur manque quelque chose — et le renvoi de ton troisième drapeau au `01-` §10, quand la règle vit au §9, en est un candidat sérieux —, tu le DIS À LOUIS, tu ne l'écris pas.**

### D'ouverture de compétence

⛔ **Sans objet — ce lot n'ouvre aucune compétence dans la chaîne**, et les six sont déjà ouvertes. ⚠️ **Ne joue `derive-instruments.py --ecris` QUE si tu as amendé une section ouverte du `07-`**, et **en dernier** *(voir le contrôle d'entrée)*.

### Et le hors-périmètre

Toute idée ou découverte hors du lot → **une ligne dans `IDEES_post_rentree.md`**, pas dans le code *(`AGENTS.md`)*. **Note-les, ne les joue pas.**

---

## ⭐ Ce que tu dois rendre à Louis

**Quoi qu'il arrive dans la séance — lot fini, lot partiel, lot arrêté au constat —, tu rends d'abord ce tableau, dans le terminal, en tête de ta réponse finale :**

| | Ce qu'il fallait | État | La preuve |
|---|---|---|---|
| **①** | la matrice montre des **lettres réelles** *(constat, pas construction)* | … | … |
| **②** | le drapeau des **contestations répétées**, et la **file d'examen humain** | … | … |
| **③** | le drapeau du **faisceau d'intégrité**, module `exercices`, **sans strike** | … | … |
| **④** | le drapeau de la **fraîcheur d'ancre** — celui qui était muet par construction | … | … |
| **⑤** | la **file des dossiers N3** : elle apparaît, elle se traite, elle se vide | … | … |
| **⑥** | le **diagnostic de rétention**, rangé sous la page **et qui montre quelque chose** | … | … |
| **⑦** | ⭐ **la couture** — les cinq canaux du tableau, éprouvés par exécution | … | … |

⚠️ **Trois états seulement, et le mot se choisit sans détour** : **FERMÉ** *(construit et prouvé — dis par quoi)* · **PARTIEL** *(construit, non prouvé — dis ce qui manque à la preuve)* · **NON FAIT** *(dis pourquoi, et à qui ça revient)*. ⛔ **« En cours » n'est pas un état.** ⛔ *Pour la couture, **FERMÉ** veut dire « éprouvée par exécution, script au dépôt » — jamais « lue et jugée correcte ».*

### Et ce que ton relevé doit porter, après lui

Le nom du fichier : **`RELEVE_C6_L1_2026-XX-XX.md`**, à la racine du dépôt `palimpseste`. **Après le tableau, neuf choses au minimum**, en plus du récit :

1. **Ce que la matrice montrait AVANT ton lot**, chiffres en main — combien de lettres, combien de mesures, dans quelle base — parce que c'est le socle et que personne ne l'a jamais écrit ;
2. ⭐⭐ **LES CINQ CANAUX DU TABLEAU DE COUTURE**, un par un : qui écrit, qui lit, **et ce que tu as branché** — c'est le cœur du lot, et le reste en découle ;
3. **Chaque drapeau, avec la donnée qui le lève et la phrase qu'il affiche** — plus **ce qu'il fait quand la donnée disparaît** ;
4. **Le geste de traitement** *(N3 et contestations)* : où il écrit, comment il est idempotent, et **pourquoi il ne désescalade pas** ;
5. **Le faisceau** : ta règle de convergence, où elle se règle, ce qu'elle journalise, et **la forme de `rendu_ref`** ;
6. **La migration**, avec sa ligne au `SUIVI_SQL.md`, son rollback, et **la preuve que le `CHECK` recréé porte exactement les quatre valeurs** ;
7. **Le diagnostic de rétention** : sa porte, ses deux fils réparés, et **ce qu'il montre maintenant sur des données réelles** ;
8. **Les renvois de périmètre, AVEC LEUR LISTE** — fichiers et lignes ;
9. **Ce qui reste à jouer en recette**, avec sa condition de reprise — parce que c'est cela qui part au `SUIVI_tests_manuels.md`.

⭐ **Et deux amendements t'appartiennent sans accord préalable** : l'**inventaire des lots du `07-` §2** *(ton état de clôture — et, si tu le juges utile, la **précision du pointeur de section** de ton manifeste)* et le **`07-` §1** *(ce que la construction aura précisé de la forme d'un drapeau, d'une marque de traitement, ou du canal d'intégrité)*. ⚠️ **Si tu y touches, rejoue `derive-instruments.py --ecris` EN DERNIER**, et vérifie que `npm test` repasse vert.
