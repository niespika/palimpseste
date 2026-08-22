# CARNET D'ÉCRITURES — ce que tes seize arbitrages demandent, et dans quel ordre

**Écrit le 20/08/2026**, à partir de tes réponses aux relevés C4-L2 et C4-L3 du 18/08 et de
l'`ETAT_DES_LIEUX_C4_L2_L3_2026-08-19.md`. **Rien n'est encore écrit dans les sources.**

Ce carnet porte quatre choses : **une correction** que je te dois sur L3-Q5 · **une vérification
qui tombe très bien** sur L2-Q3 · **la liste complète des écritures**, y compris celles que tu n'as
pas nommées · et **cinq points que tes réponses ne ferment pas**.

*Rappel de vocabulaire.* **C4-L2** = le pilotage et le cœur du routeur · **C4-L3** = l'élève, le
formatif à la maison · **C4-L5** = la chaîne de mesure · **C4-L8** = la fabrique du professeur ·
**la vf** = la version finale d'un exercice, après le retour · **N1, N2, N3** = les trois crans de
l'escalade.

---

# 1. Une correction, et elle simplifie les choses — L3-Q5

**Ce que je t'ai recommandé hier était mécaniquement faux.** J'avais dit : « porter l'observable
ciblé » veut dire `isole` **et** `exerce`, sinon l'escalade dégradée perdrait sa version finale.
J'ai vérifié la source depuis, et le raisonnement ne tient pas — **parce que le cas que je voulais
protéger est déjà protégé, autrement.**

Voici les trois pièces, dans l'ordre.

**(a) La règle de la vf pendant l'escalade ne porte QUE sur les crans de transformation.**
`01-routeur.md` §8.5, mot pour mot : *« le régime « pas de version finale » **des crans de
transformation** devient « plein » pour les exercices portant l'observable ciblé »*.

**(b) Les crans de transformation déclarent `isole`, et l'observable y est NOMMÉ.**
`02-exercices.md` §2.3.2 : *« **transformer · diagnostiquer** → `isole` — **sur l'observable que le
défaut isole, nommé** »*, et *« produire → `exerce` »*. Donc « porter l'observable ciblé » à un cran
de transformation n'a aucune ambiguïté : **le cran isole cet observable-là, ou il en isole un autre.**

**(c) Les crans de production sont DÉJÀ au régime plein.** La table des neuf crans du `02-` §2.2
donne `regime_v1vf` = **plein** aux crans 2, 6 et 8 — les trois crans de production, ceux qui
déclarent `exerce`. **La version finale y existe de toute façon**, escalade ou pas.

**Ce qu'il faut en conclure — et c'est une bonne nouvelle :**

| cran | `couverture_observables` | régime nominal | ce que l'escalade change |
|---|---|---|---|
| **transformation** (3, 5, 7) | `isole`, observable nommé | pas de vf | **plein**, si le cran isole l'observable ciblé |
| **production** (2, 6, 8) | `exerce` | **plein** | rien — la vf est déjà là |
| **diagnostic** (1, 4, 9) | `isole` | par paires | rien — N2 lit **la paire**, pas le delta |

⭐ **La branche d'échec du `01-` §6 est donc inoffensive** : quand N1 dégrade et sert un exercice qui
`exerce` l'observable au lieu de l'isoler, cet exercice **porte déjà une version finale**. Le delta
v1→vf ne vaut jamais NULL par ce chemin. **N2 n'est jamais aveugle.**

**Conséquence pratique : il n'y a RIEN à écrire dans le `01-`.** La règle est entièrement dérivable
de la table des neuf crans plus l'état d'escalade, et l'écran de C4-L3 n'a qu'à ne pas graver
« cran → régime » en dur — ce que son piège 8 lui interdisait déjà. **Une écriture de source en
moins.**

---

# 2. Une vérification qui tombe très bien — L2-Q3

**Ta règle de segments reproduit la table actuelle du `01-` §4 exactement.** Je l'ai vérifiée
arithmétiquement.

Ta règle, formalisée. Soit **C** le nombre de cycles de l'année *(`01-` §1 principe 2 :
`C = semaines de cours − 2`, lu au module **Calendrier**)*.

| segment | bornes |
|---|---|
| **1** | le cycle 1 |
| **2** | les cycles 2 à 4 |
| **3** | **arrondi au SUPÉRIEUR** du tiers de ce qui reste |
| **4** | **arrondi à l'INFÉRIEUR** du tiers de ce qui reste |
| **5** | **tout le reste** |

Le calcul pour l'année de référence, **C = 32** — le reste après les segments 1 et 2 vaut
`R = 32 − 4 = 28`, et `R / 3 = 9,33` :

| segment | ta règle donne | la table du `01-` §4 dit | |
|---|---|---|---|
| 3 | `⌈9,33⌉ = 10` cycles → **5 à 14** | semaines **5 à 14** | ✅ |
| 4 | `⌊9,33⌋ = 9` cycles → **15 à 23** | semaines **15 à 23** | ✅ |
| 5 | `28 − 10 − 9 = 9` cycles → **24 à 32** | semaines **24 à 32** | ✅ |

**Les trois tombent juste.** Ce n'est donc pas un changement de règle : **c'est la généralisation de
la table qui existe.** On remplace une colonne de bornes fixes par la règle qui les produit, et rien
ne bouge pour une année à 34 semaines. *Le contenu des cinq lignes — proportions micro / méso /
macro, plancher macro de 25 % au segment 5, conditions d'examen — ne change pas d'un mot.*

---

# 3. La liste complète des écritures

**Les huit sources sont GELÉES.** Chaque écriture demande donc ton accord explicite et une entrée au
journal de `CONTEXTE.md`. Les lignes marquées ⭐ sont celles que tu n'as pas nommées et qui découlent
de tes arbitrages.

## 3.1 `01-routeur.md`

| # | § | ce qu'on écrit | vient de |
|---|---|---|---|
| 1 | **§4** | les bornes des cinq segments deviennent une **règle dérivée du Calendrier** *(voir la partie 2)* | L2-Q3 |
| 2 | **§4, couche 4** | ⭐ le non-spoiler nomme sa donnée : **la position de lecture se lit sur le dernier travail de livre rendu dans Aletheia** *(`aletheia_travaux.semaine_index`)* | L2-Q7 |
| 3 | **§4, couche 4** | ⭐ le « cours déjà vu » gagne sa **valeur à trois états** — `generique` *(servable toujours)* · **rien** *(jamais servable)* · **lié à un ou plusieurs cours** *(servable dès qu'au moins un est en partie vu)* | L2-Q7 |
| 4 | **§6, R3** | on **efface** *« Montée en charge forcée avant les périodes d'explication de texte »* | L2-Q8 |
| 5 | **§8.2** | ⭐ la règle générale : ce que « une mesure réussie sur un observable » veut dire, et **où le seuil se lit** *(la fiche, jamais le routeur)* | L2-Q1 — **produit par la séance dédiée** |
| 6 | **§8.3** | la réparation du **« plancher »** | L2-Q2 — **produit par la séance dédiée** |
| 7 | **§8.9** | le **palier cible vaut B**, lu sur la **lettre affichée** | L2-Q5 |

⛔ **§8.5 : rien.** Voir la partie 1.

## 3.2 `02-exercices.md`

| # | § | ce qu'on écrit | vient de |
|---|---|---|---|
| 8 | **§6 B** | ⭐ le **geste de rattachement** : à la conception d'un exercice — ou après —, le professeur lie **le sujet ou le texte** à un ou plusieurs cours | L2-Q7 |

## 3.3 `06-Palimpseste.md`

| # | § | ce qu'on écrit | vient de |
|---|---|---|---|
| 9 | **§2** | la chasse aux fautes : *N* est **compté en code à partir du relevé de la chaîne**, et non **détecté** en code. *« Hors lettre, hors calibration » ne bouge pas.* | L3-Q6 |
| 10 | **§5** | ⭐ l'assiduité : un exercice **retiré par le professeur** sort du dénominateur **pour l'avenir**, et **une semaine déjà close ne se recalcule pas** | L2-Q4 |

## 3.4 `07-Implementation.md`

| # | § | ce qu'on écrit | vient de |
|---|---|---|---|
| 11 | **§1** | la **table de correspondance (compétence × observable)** — la banque « se juger » : formulation en langue élève, question, liste fermée des réponses, version. **Créée et remplie par C4-L8, lue par C4-L3.** | L3-Q1 |
| 12 | **§1.1** | ⭐ **l'appui en champs propres sur `exercices`** — `defaut`, `distracteurs`, `reponse_attendue`, `guide` —, **en miroir du `08-` §5.2** | L3-Q3 |
| 13 | **§1.1** | ⭐ le statut **`retire`**, distinct de `abandonne`, sur `exercices_depots.statut` — retrait permis **jusqu'à `clos`** | L2-Q4 |
| 14 | **§1.1** | ⭐ le **rattachement au cours** d'un sujet et d'un texte, à trois états | L2-Q7 |
| 15 | **§1.2 ou §4** | le retour se rend **SEGMENTÉ** — une liste de points, chacun avec son identifiant stable, son ancrage et son texte ; **`points_ids` devient un index**. ⚠️ **C'est une obligation sur C4-L5**, qui engendre le retour. | L3-Q7 |
| 16 | **§1.3** | ⭐ l'**horodatage de bascule** du statut de recette sur `competences_niveaux`, **écrit par C4-L8 dans le même geste que le statut** | L2-Q6 |
| 17 | **§1.1** | ⭐ la **forme de `exercices_demonstrations.contenu`** : une enveloppe unique avec un discriminant **`forme`**, un corps par forme | L3-Q8 |
| 18 | **§2, C4-L8** | ⭐ son manifeste et son « fait quand » s'allongent de **quatre choses** : la banque « se juger » · la date de bascule · le rattachement des sujets et textes aux cours · **l'avertissement « démonstration manquante pour (compétence × grain) »** | L3-Q1, L2-Q6, L2-Q7, L3-Q8 |
| 19 | **§2, C4-L3** | ⭐ son manifeste gagne **`01-routeur.md` §3** *(la fenêtre d'évidence)*, pour que l'écran puisse **dériver** les observables faibles | L3-Q4 |
| 20 | **§2** | ⚠️ **le panneau des cinq segments au Plan d'évaluation — aucun lot ne le porte.** Voir le point ouvert **O2**. | L2-Q3 |

## 3.5 `08-FORMAT_IMPORT.md`

| # | quoi | vient de |
|---|---|---|
| 21 | **L'arbitrage du document** : ses **18 refus, 3 blocages et 6 signalements** | L3-Q3 |
| 22 | ⭐ `sujets[]` **et** `textes[]` gagnent le **rattachement au cours**, à trois états | L2-Q7 |
| 23 | ⭐ une **cinquième banque, `demonstrations[]`**, avec son discriminant `forme` | L3-Q8 |
| 24 | le document passe de **`[à valider]`** à **arrêté** | — |

## 3.6 Les fiches de compétence

| # | où | ce qu'on écrit | vient de |
|---|---|---|---|
| 25 | **`competences/synthese.md`** | on **efface** la montée en charge **et son motif** *(« condenser un texte qu'on s'apprête à expliquer… »)* — tu as tranché : on le perd | L2-Q8 |
| 26 | **les six fiches**, volet `notation` du bloc machine | **un seuil par observable** | L2-Q1 — **produit par la séance dédiée** |

## 3.7 Hors sources

| # | où | quoi |
|---|---|---|
| 27 | `PLAN_DE_CHANTIER.md` §2 et §6 | ⭐ l'**ordre de fabrication des prompts** — L8, puis L5, puis L2 et L3 — et le §6 perd la borne de segment, qui cesse d'être ouverte |
| 28 | `PROMPT_Code_C4_L2.md` et `PROMPT_Code_C4_L3.md` | ⭐ **ré-épingler les versions et compléter les pièges.** Voir le point ouvert **O5**. |

---

# 4. Les cinq points que tes réponses ne ferment pas

## O1 — Le non-spoiler n'a toujours pas d'échelle de comparaison ⛔

Tu as choisi de lire la position de lecture de l'élève **dans Aletheia**. Bien. Mais la règle du
`01-` §4 dit *« le routeur n'assigne jamais **au-delà** de la position de lecture »* — donc il faut
**comparer** deux choses sur une même échelle ordonnée :

- **où en est l'élève** → `aletheia_travaux.semaine_index`, un **index de semaine** ;
- **où se situe cette référence** → `exercices_references.localisation`, qui est **du texte libre**.

**On ne peut pas comparer un entier à du texte libre.** Il faut soit donner à la référence un index
comparable, soit changer ce que « au-delà » veut dire. **Une phrase, mais elle n'existe pas encore.**

## O2 — Le panneau des cinq segments n'appartient à aucun lot ⚠️

**Bonne nouvelle d'abord : l'écran existe déjà.** Le Plan d'évaluation est construit et vivant —
`app/prof/scriptorium/evaluations/`, les tables `scriptorium_modeles_plan` et
`scriptorium_modeles_plan_exercices`, et l'interrupteur **`plan_evaluation_actif` est à ON**. Tu ne
demandes donc pas un écran neuf : tu demandes **un panneau de plus sur un écran qui tourne.**

**Mais aucun lot du `07-` §2 ne touche cet écran.** Trois sorties :

- **(a) l'ajouter à C4-L2** — il construit déjà trois écrans professeur, et c'est lui qui possède la
  règle des segments. *La plus économique.*
- **(b) un petit lot dédié**, parce que le Scriptorium n'est pas le pilotage des exercices.
- **(c) hors C4** — comme la lettre de la loi 25 : une pièce à construire qui n'appartient à aucun
  chantier.

**Ma recommandation : (a).** Le calcul est une fonction pure du Calendrier, et le panneau n'est qu'un
affichage de ce que le routeur dérive déjà. *Une ligne à trancher.*

## O3 — Le rattachement au cours : quelle valeur par défaut ? ⚠️

Tu poses trois états, dont **« rien » = jamais servable**. Conséquence directe : **un sujet ou un
texte importé sans ce champ n'est jamais servi.** C'est un défaut **sûr** — rien ne part avant que tu
l'aies trié — mais il faut le vouloir :

- soit **le champ est facultatif à l'import**, et son absence vaut « jamais servable » ;
- soit **le champ est obligatoire**, et le `08-` §7.1 **refuse** un sujet qui ne le porte pas.

*Le `08-` porte déjà un champ voisin, `notions`, dont il dit lui-même que « aucune règle ne la lit
aujourd'hui ». À arbitrer en même temps : les deux vivent-ils côte à côte, ou l'un remplace-t-il
l'autre ?*

## O4 — Une année trop courte casse la règle des segments ⚠️

Ta règle suppose au moins **5 cycles** : en dessous, le reste `R = C − 4` est nul ou négatif, et les
segments 3, 4 et 5 sont vides. Ça n'arrivera pas dans la vraie vie, mais **une règle qui se dérive
d'un calendrier réglable par le professeur doit dire ce qu'elle fait quand le calendrier est absurde**.
*Une phrase : un plancher, ou un signalement non bloquant.*

## O5 — Les prompts C4-L2 et C4-L3 ne se relancent pas tels quels ⚠️

Tu comptes dire à Calame que « tout est tranché » et la laisser continuer. **Ça ne suffira pas, pour
deux raisons.**

1. **Les versions épinglées seront toutes périmées.** `01-`, `02-`, `06-`, `07-`, `08-` et les six
   fiches vont toutes bouger. Le contrôle d'entrée ne **bloquera** pas — la recette dit *« le statut
   bloque, la version avertit »* — mais chaque session commencera par relire six en-têtes.
2. **Le manifeste de C4-L3 change vraiment** : il gagne `01-` §3. Ce n'est pas un numéro de version,
   c'est une pièce de plus à lire — et son piège 9 change avec.

**Le geste juste est de repasser les deux prompts par la recette** *(`PLAN_DE_CHANTIER.md` §5)* une
fois les écritures faites : ré-épingler les versions, et **verser dans les pièges les huit décisions
qui les concernent**. C'est moins cher que de laisser Calame redécouvrir ce qu'on vient de trancher.

---

# 5. L'ordre pour la suite

| # | quoi | ce que ça débloque |
|---|---|---|
| **1** | **La séance « seuil de réussite d'un observable »** — questions Q1 et Q2 fusionnées. Prompt fourni : `PROMPT_Session_Seuil_Observable.md` | tout le §8 du routeur, donc C4-L2 ; le rappel du temps 1 de C4-L3 ; une part de C4-L5 |
| **2** | **La séance d'arbitrage du `08-FORMAT_IMPORT.md`** — ses 18 refus / 3 blocages / 6 signalements, **plus les deux ajouts** : le rattachement au cours, et la banque des démonstrations | L3-Q3, L3-Q8, L2-Q7, et **tout C4-L8** |
| **3** | **La passe d'écritures** — `01-`, `02-`, `06-`, `07-`, `competences/synthese.md`, et les quatre points ouverts ci-dessus | les manifestes de L8 et L5 deviennent justes |
| **4** | **Fabriquer les prompts C4-L8 et C4-L5**, par la recette du `PLAN_DE_CHANTIER.md` §5 | — |
| **5** | **Les jouer** — L8 d'abord, L5 ensuite | C4-L2 et C4-L3 deviennent jouables |
| **6** | **Repasser C4-L2 et C4-L3 par la recette** *(point ouvert O5)*, puis les relancer | — |

*Les étapes 1 et 2 sont indépendantes l'une de l'autre et peuvent se faire dans l'ordre que tu veux.
L'étape 3 vient après la 2, parce que la forme de l'appui et celle des démonstrations sortent du
`08-`.*
