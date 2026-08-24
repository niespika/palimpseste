# PROMPT — Session Code : C4-L12 — Ce qui écrit ce que le routeur décide

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5. Ce que le lot construit, son manifeste et son « fait quand » font foi au `07-Implementation.md` §2 — ils sont recopiés ci-dessous avec leurs versions au moment de l'écriture.
>
> ⭐ **Le moteur existe, il est éprouvé, et RIEN NE LE FAIT TOURNER.** `poserLaSemaine` n'a **aucun appelant hors de `semaine.test.ts`**, son paramètre `candidatsPour` **aucun producteur**, et il y a **0 ligne de `routeur_decisions`**. Ce lot **n'invente aucune règle** : il écrit **l'orchestration et la persistance** que C4-L2 a laissées, et elles seules.
>
> ⭐⭐ **LE SECOND VERROU EST DANS CE LOT — NE L'ATTENDS DE NULLE PART.** `filtreR0` exige **DEUX** conditions, `statutRecette === 'evaluee'` **ET `lettre !== null`** *(`utils/routeur/ciblage.ts:61-63`)*. **La première est levée depuis le 23/08** — Louis a posé les six compétences à `evaluee` à l'écran de la fabrique. **La seconde ne l'est pas** : `competences_niveaux.lettre` **n'a aucun écrivain dans tout le dépôt**, et c'est ton **quatrième geste**.
>
> ⚠️ **Échéance : AVANT LE SEGMENT 2** *(semaines 2 à 4)*. Le segment 1 est **hors routage** — il sert les deux examens diagnostiques imposés en classe —, mais le segment 2 est celui où « le routeur tourne en régime de calibration ».

---

## Le manifeste — recopié du `07-Implementation.md` §2

> *Manifeste* : **ce document, §1 et §2** · `01-routeur.md` §4, §5, §6, **§8 et §8.8**, **§8.9**, **§9** *(les lettres — montée, descente, plafonds)* et §11 — **relu et validé** · `02-exercices.md` §4.

« Ce document » est le `07-Implementation.md`. Les trois pièces :

| Pièce | Où | Statut requis | Au moment de l'écriture |
|---|---|---|---|
| `07-Implementation.md`, **§1 et §2** | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | **aucun** — *« un lot n'exige pas un statut de la source qui le déclare »* *(`07-` §2)* | **VERSION 2.47** · RELU ET VALIDÉ · ⭐ **le §1 et l'inventaire des lots du §2 sont OUVERTS À L'IMPLÉMENTATION** — **tu les amendes depuis ton relevé, sans accord préalable**. ⛔ **La règle de manifeste du §2, elle, est GELÉE**, ainsi que le §3, le §4 et le §6 |
| `01-routeur.md`, **§4, §5, §6, §8, §8.8, §8.9, §9, §11** | même dépôt | **relu et validé** | **VERSION 5.5** · VALIDÉ ET GELÉ *(= relu et validé, plus la clause de procédure)* |
| `02-exercices.md`, **§4** | même dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | **VERSION 5.5** · VALIDÉ ET GELÉ |

⚠️ **Le manifeste ne borne AUCUNE de ces pièces à ses sections, et ce prompt ne les bornera pas non plus.** *« Le statut porte sur le FICHIER, jamais sur la section ; la section dit seulement où lire »* *(`07-` §2)*. Ce qui suit dit où lire **d'abord**, jamais où s'arrêter — et **cinq renvois hors section te seront indispensables**, tous dans des fichiers déjà au manifeste :

- le **`01-` §1** *(« le cycle = la semaine de travail » ; « l'exercice porte la cible »)* ;
- le **`01-` §3** — **l'état par élève × compétence** : le *signal de ciblage*, la *valeur de ciblage non plafonnée*, la *fenêtre d'évidence*, l'*historique des cibles*, et la phrase qui commande ton verrou : *« une compétence sans lettre n'est ni ciblable, ni sondable, ni plafonnée, et n'entre dans aucun départage »* ;
- le **`01-` §7** — **la proportion des modes** : c'est **PA1**, la toute première règle de la phase A, *« et elle vient en tête parce qu'elle est une ENTRÉE des règles de ciblage »* ;
- le **`01-` §10** — **ce qu'est une ancre** *(« `lieu` = `classe` ET `forme` = `sommatif` »)*, sans quoi ton quatrième geste ne sait pas ce qui fait descendre une lettre ;
- le **`07-` §5** — **l'allumage** et les six interrupteurs, et le **`07-` §1.3** — `competences_niveaux`, `competences_escalade`, `competences_montee`, `competences_actives_par_classe`, la **lettre initiale**, le **piège de la vacuité des parcours**.

**Ce que chaque pièce fait ici.**

- Le **`01-` §4** porte les **cinq couches** : le budget de l'ÉLÈVE *(couche 0)*, les **cinq segments** *(couche 1)*, la table des proportions grain × palier, la **table d'indexation du cran sur le palier** *(couche 3)*, et surtout la **couche 4 — tes trois filtres** : parcours, cours vu, non-spoiler. **C'est ta section la plus dense, et c'est celle du premier geste.**
- Le **`01-` §5** porte **les trois phases** — A le pool, B les six règles de pose, C les sondes sur la semaine entière —, *« le plafond borne, le plancher signale »*, le budget optionnel, et la clause **« Non tranché »** que tu ne trancheras pas.
- Le **`01-` §6** porte **R0 à R5** et la **règle de calibration du segment 2**, celle qui gouverne ton échéance.
- Le **`01-` §8, §8.8, §8.9** portent l'escalade, la **règle de montée** *(M-a à M-e)* et **qui sonder, dans quel ordre**.
- Le **`01-` §9** porte **les lettres** : montée par la trajectoire, descente par les ancres uniquement, plafonds, `profil_provisoire`, et la **clôture de la calibration**.
- Le **`01-` §11** porte **ce qu'il faut journaliser** : le point 1 *(chaque décision)*, le point 3 *(chaque escalade, et l'état d'escalade au moment de chaque mesure)*, le point 5 *(le tirage aléatoire journalisé)* et le **point 7** *(les minutes assignées et les minutes de budget — la moitié de la ligne d'assiduité qui est à toi)*.
- Le **`02-` §4** porte **l'éligibilité de parcours** : comment se lit `exclusions_parcours[]` *(« est exclu l'élève dont TOUS ses parcours figurent dans la liste »)* et ce que le `genre` de l'instance déclare.
- Le **`07-` §1.1** porte `exercices`, `exercices_depots`, la **`cible_primaire` et son ordre de lecture à trois crans**, la `borne_amont`, et le **rattachement d'un dépôt à sa semaine** *(dérivé d'`assigne_at`, sans colonne — posé par C4-L13 le 24/08)*. Le **§1.5** porte `routeur_decisions`, l'**état d'escalade au moment de la décision**, et le **partage de la ligne d'`assiduite_hebdo` avec C4-L13**.

**Rien de plus : la règle de manifeste veut que ce qui n'y figure pas ne se lise pas** *(`07-` §2)*. Quatre précisions pour que la règle ne fasse pas trébucher :

- l'`AGENTS.md` du dépôt n'est pas une source : Claude Code le charge d'office, il porte les conventions du repo — **dont la règle SQL absolue** ;
- ⛔ **`SPEC_C3_exercices_competences.md` est ARCHIVÉE : elle ne fait foi sur rien, et elle ne se cite jamais.** Elle traîne à la racine du dépôt `palimpseste` — **ne l'ouvre pas**. Il en va de même de `FUSION_revues_C3.md`, de `revue_adversariale_SPEC_C3.md` et de `AMENDEMENTS_C3_en_attente_2026-07-31.md` ;
- ⛔ **aucun relevé de lot ne se lit** — ni `RELEVE_C4_L2_2026-08-22.md`, ni `RELEVE_C4_L13_2026-08-24.md`, ni les autres. La règle de manifeste l'interdit, et ce n'est pas une privation : **ce que C4-L11, C4-L2 et la contre-épreuve du 23/08 avaient à te dire est entré en pièges ci-dessous**, versé par la boîte aux lettres du `PLAN_DE_CHANTIER.md` §5 ;
- **le code du dépôt n'est pas une source, c'est ton terrain.** Les fichiers et les lignes nommés dans les pièges sont des repères **vérifiés le 24/08**, pas des autorités : **en cas de doute entre ce prompt et une source du manifeste, la source a raison.**

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

**Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, **cumulatifs** ; « VALIDÉ ET GELÉ » vaut *relu et validé*.

**La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ci-dessus, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.

**Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot. ⚠️ *Ici la clause est sans objet : aucune fiche de compétence n'est à ton manifeste.* Elle est recopiée parce que la recette se recopie entière.

### Deux contrôles machine avant d'écrire une ligne, et trois constats en base

```bash
npm test
```

**`npm test` doit rendre `fail 0`.** *Mesuré le 24/08 : **1299 tests, 1299 pass, 0 fail, 0 skipped**, en ~3,7 s.* ⚠️ **Note le compte avant de commencer** : un test qui disparaît est aussi silencieux qu'un test qui tombe, et **un vert n'est une preuve que si l'on sait combien de vert il y avait**.

```bash
python3 scripts/derive-doctrine.py --verifie
```

**Il doit dire `IDENTIQUE` sur les douze tables, les empreintes de source et la fixture.** *Mesuré le 24/08 : **`FIXTURE : IDENTIQUE`**, doctrine chargée — 13 objets · 9 crans · 9 durées · 117 couples (objet × cran) · 3264 lignes de route.* ⚠️ **Pour toi la convention est PLEINEMENT EN VIGUEUR, à la différence de C4-L13** : ton vivier lit les tables de doctrine — les **durées**, les **crans et leurs codes**, les **objets et leurs `exclusions_parcours`**. **S'il dit DIVERGE, rejoue `--sql` ; jamais corriger la base à la main.**

**Et trois constats, à faire en base avant d'écrire quoi que ce soit** *(client admin, script de recette ou éditeur SQL)* :

- **`select count(*) from routeur_decisions`** — *dernier état connu : **0**.* C'est le chiffre que ton lot fait bouger, et c'est aussi la mesure de ce qui est en jeu : **cinq modules lisent `exercices_depots.routeur_decision_id` et rien ne l'a jamais écrit** *(piège 22)*.
- **`select competence, statut_recette from competences_statut_recette`** — *les **six** doivent être `evaluee`, posées le 23/08.* ⛔ **Ne repose aucun statut : constate-les.** Le statut est **GLOBAL** depuis `c4_statut_recette_global.sql` ; `competences_niveaux.statut_recette` est **DORMANTE** *(piège 34)*.
- **`select count(*) from competences_niveaux where lettre is not null`** — *dernier état connu : **0 sur 102 lignes d'état**.* C'est **ton verrou**, et il doit bouger.
- **Les six interrupteurs sont à OFF** — `exercices_actif`, `routeur_actif`, `competences_affichage_actif`, `fabrique_actif`, `chaine_actif`, `passation_classe_actif` *(`utils/allumage.ts:36-43`)*. **Ils ne bougent pas de ton fait** *(piège 36)*.

---

## La mission — reprise du `07-Implementation.md` §2

*Reprise du `07-Implementation.md` §2, entrée C4-L12.*

Le moteur existe, il est éprouvé, et **rien ne le fait tourner**. Ce lot **n'invente aucune règle** : il écrit **l'orchestration et la persistance** que C4-L2 a laissées, et elles seules. *Le partage avec C4-L2 tient à ce que le lot fait : là il **décide** — les règles, les trois phases, l'escalade, en fonctions pures ; ici il **exerce et inscrit**.*

**Il porte quatre gestes, et le premier commande les trois autres.**

### A. Le vivier — le rappel `candidatsPour` que la phase B interroge

Avec **les trois filtres de la couche 4** que son contrat exige et qu'aucun code ne tient : le **parcours**, le **cours vu**, le **non-spoiler**. ⚠️ **Sans lui, le moteur n'a rien à choisir** : *ce n'est pas un appel à brancher, c'est le vivier qu'il faut d'abord constituer.*

### B. L'orchestrateur par élève

Lire l'état **une fois**, appeler la liste de priorité puis la pose, **par élève et non par classe** *(la voie du professeur assigne à la classe entière, et c'est sa définition — `01-` §5, la voie mixte)*. ⚠️ **Il n'ouvre PAS son propre déclencheur hebdomadaire** : `C4-L13` en pose déjà un sur la même clé *(élève × cycle)*, et deux crons sur une même clé fabriquent deux lignes. **Ce lot se greffe sur celui de `C4-L13`.**

### C. La persistance de la décision

`routeur_decisions` avec sa **cible retenue**, la **règle qui l'a déclenchée**, les **sondes retenues**, l'**état d'escalade au moment de la décision** *(la colonne existe, posée par C4-L2, et rien ne l'écrit)* et la **borne amont** ; les dépôts en **`origine = 'routeur'`** ; et le **lien du dépôt à sa décision**, `routeur_decision_id`, **que CINQ modules lisent déjà et que rien n'écrit**.

### D. L'écriture de l'état après mesure

La **lettre**, l'**escalade** et la **montée**, que la chaîne froide te délègue nommément — *« Tu écris des MESURES ; le moteur en fera des lettres »* *(`utils/chaine/mesures.ts:10`)* — et que personne ne fait : `competences_niveaux.lettre` n'a **aucun écrivain**. ⚠️ **Sans ce geste, `jugerLaLettre`, `degreAppele` et la désescalade restent dormants le jour même où la semaine se posera.**

### ⚠️⚠️ Et un geste qui n'existe à AUCUN étage — ni écrivain, ni règle pure

La **recombinaison en 2-3 propositions iso-durée** et **le choix de l'élève**, au méso et au macro, aux crans de `produire` et de `transformer` — **sauf `transformation_guidee`**, qui n'offre qu'une proposition comme le micro et le `diagnostiquer` *(`01-` §4, couche 4)*. Deux colonnes en base, **zéro occurrence dans tout le code** *(vérifié le 24/08)*. *Sa forme est tranchée ; la place qu'y prend la préférence recueillie ne l'est pas, et ce lot se construit sans elle (`01-` §5, « Non tranché »).*

### Ce que ce lot NE porte PAS

- **aucune règle neuve** — elles sont toutes au `01-routeur.md`, et déjà écrites en fonctions pures ;
- **aucun écran** — l'assignation reste **en lecture seule** avec son override, et elle est jouée ;
- **les deux agrégats d'assiduité** et la ligne qui les porte — ils ont leur propre lot, `C4-L13`, **joué et déployé le 24/08** *(ce lot ne remplit que les **minutes** de cette ligne — pièges 17 et 18)* ;
- **le pull et le push**, qui sont C6-L3.

---

## Les pièges — les décisions dont l'oubli coûte une migration

*Tirés des sources du manifeste et **vérifiés sur pièces le 24/08**. Chacun porte son renvoi. **En cas de doute entre ce prompt et la source, la source a raison.***

### Ce qui existe déjà, et qu'il ne faut surtout pas réécrire

**1. ⭐⭐ SEPT FONCTIONS PURES T'ATTENDENT, ÉPROUVÉES, ET AUCUNE N'A D'APPELANT DE PRODUCTION.** `listeDePriorite` et `secondeInscriptionPA3` *(`ciblage.ts:467`, `:528`)* · `ordonnerLesSondes` *(`sondes.ts:76`)* · `poserLaSemaine` et `poserLesSondes` *(`semaine.ts:123`, `:266`)* · `jugerLaLettre` et `cloturerLaCalibration` *(`lettres.ts:165`, `:267`)* · `degreAppele`, `desescalade`, `interventionN1`, `brancherN2`, `dossierN3` *(`escalade.ts`)* · `deplacementsDeMasse`, `reporterAuGrainSuperieur` *(`montee.ts`)*. **Ton lot est une SOUDURE : tu leur donnes des entrées et tu persistes leurs sorties.** ⛔ *Vérifié le 24/08 : hors `*.test.ts`, aucune de ces fonctions n'est appelée nulle part.* **Si tu réécris une règle, tu as échoué.**

**2. ⭐ ET DOUZE LECTURES T'ATTENDENT AUSSI.** `utils/routeur/donnees.ts` porte `lireLesMesures`, `lireLesNiveaux`, `lireLesEscalades`, `lireLaMontee`, `lireLesInscriptions`, `lireLOptOut`, `lireLeProfil`, `lireLesFiches`, `lireLesDecisions`, `lireLAssiduite`, `lireLesSeuils`, `lireLesInterrupteurs` — **toutes paginées, toutes traduites en objets que les modules purs savent manipuler.** `scripts/recette/routeur-c4l2.mjs` les appelle déjà toutes en lecture seule : **c'est ton point de départ, pas un exemple lointain.**

**3. ⛔ AUCUNE MIGRATION N'EST DUE — TOUTES TES COLONNES EXISTENT.** `routeur_decisions` porte `cible_retenue`, `regle_declenchee`, `alternatives_ecartees`, `sondes_retenues`, `propositions_iso_duree`, `choix_eleve`, `borne_amont`, `override_prof`, `tirage_aleatoire`, `degrade` *(`c4_l1_schema.sql:404-429`)* et `etat_escalade` *(`c4_l2_routeur.sql:170-171`)* ; `exercices_depots.routeur_decision_id` existe *(`:448`)* ; `competences_niveaux.lettre_initiale` / `lettre_initiale_at` existent *(`c4_l2_routeur.sql:142-144`)* ; les **trois colonnes de minutes** d'`assiduite_hebdo` existent *(`c4_l1_schema.sql:898-900`)*. ⚠️ **Si tu en écris une quand même**, applique la convention de dépôt ci-dessous **avant** de l'exécuter.

### Le vivier — le premier geste, et le plus long

**4. ⛔⛔ `poserLaSemaine` REND UN PLAN, PAS DES LIGNES.** Une liste ordonnée de renvois vers des `exercices.id` **qui existent déjà**, annotés de la règle qui les a fait entrer. **Le moteur CHOISIT dans un vivier ; il ne fabrique rien** — *« le routeur n'habille rien : il sélectionne parmi les instances que le professeur a déjà écrites »* *(`01-` §4, couche 4)*. Ce n'est donc **pas un appel à brancher** : c'est le vivier qu'il faut d'abord constituer.

**5. ⭐ LA FORME DU CANDIDAT EST DÉJÀ FIGÉE PAR LA SIGNATURE — huit champs, et pas un de plus.** `Candidat` *(`semaine.ts:66-78`)* : `exerciceId`, `competence`, `grain`, `geste`, `cran`, `mode`, `dureeMin`, `ciblesSecondaires`. ⛔ **`dureeMin` NE SE SAISIT JAMAIS À LA MAIN** : *« la SEULE valeur que le budget décompte »*, et `dureeExercice(doctrine, objet, cran)` la donne *(`utils/fabrique/doctrine.ts:353-358`, dérivée du **geste du cran** et du **grain de l'objet**)*.

**6. ⚠️⚠️ LE CRAN EST UN NUMÉRO EN BASE ET UN CODE DANS LES RÈGLES — et rien ne fait le pont pour toi.** `exercices.cran` est un **`integer` sous `check (cran between 1 and 9)`** depuis C4-L11 *(`c4_l11_cran_forme.sql:94-101` ; l'arbitrage entier est écrit à `utils/cran.ts`)*, quand `Candidat.cran` est une **chaîne** et que `cransDeSonde(palier)` rend des **`CodeCran`** — `production_etayee`, `transformation_aveugle`… *(`utils/routeur/types.ts:52-58`, `montee.ts:59`)*. ⭐ **Le pont existe déjà dans la doctrine** : `d.crans[n].code` *(`doctrine.ts:130-147`)*, `exercices_crans.code` étant `text not null unique`. ⛔ **N'écris pas une seconde table de correspondance** — ce serait un second domicile de ce que la doctrine dérive.

**7. ⚠️ LE FILTRE DE PARCOURS A DEUX MOITIÉS, ET SEULE LA PREMIÈRE EXISTE.** Côté **élève** : `parcoursDeLEleve` et `budgetDeLEleve` sont écrits, appelés, et portent **le piège de la vacuité** avec ses trois motifs — `aucune_inscription`, `aucun_parcours`, `parcours_hors_dispositif` *(`budget.ts:67`, `:95-146`)*. ⛔ **Le piège de la vacuité est une condition de recette du `07-` §1.3, et il t'incombe de ne pas le rouvrir** : *« la règle d'exclusion — est exclu l'élève dont TOUS ses parcours figurent dans la liste — est **vraie par vacuité** sur un ensemble vide, et exclurait l'élève de tout »*. Côté **exercice** : `exercices_types.exclusions_parcours` est **écrit, semé, lu au modèle de doctrine** *(`doctrine.ts:119`, `:264`, `:520`)* — **et comparé nulle part.** Le `genre` de l'instance ne l'est pas davantage.

**8. ⛔ LE `genre` ET `exclusions_parcours[]` NE SE MÉLANGENT PAS — c'est le rapport au genre terminal qui décide lequel s'applique** *(`02-` §4)*. **Exclusion** : le TYPE déclare `exclusions_parcours[]` quand l'objet ne change pas avec le genre terminal — *la problématisation → `["hlp"]`, et c'est le seul cas.* **Variante** : l'INSTANCE déclare son `genre` pour les **trois objets terminaux** — introduction, conclusion, partie. **`generique` va à tout le monde ; un bi-classe reçoit les deux côtés, et c'est voulu.**

**9. ⚠️ LE COURS VU — `cours_etat` EST ÉCRIT, ÉDITABLE, `select`é PAR L'ÉCRAN DE CONCEPTION, ET LARGUÉ AU MAPPING.** Il vit sur **deux** tables, pas une : `exercices_textes.cours_etat` et `exercices_sujets.cours_etat`, à valeurs `generique` / `liste` / `aucun` *(`c4_l8_fabrique.sql:383-386`, `:423`)*. ⛔ **`aucun` veut dire JAMAIS SERVABLE**, et le commentaire de la colonne le dit : *« l'absence a un sens fort — elle ne dit pas "pas encore rempli", elle dit "jamais servi" »*. Le rattachement effectif vit à `exercices_textes_cours` / `exercices_sujets_cours`, **où `cours_id` NULL signifie « déclaré mais pas encore apparié »** — donc pas servable non plus.

**10. ⭐ « DÉJÀ VU » NE S'INVENTE PAS : LA FONCTION EXISTE, C'EST CELLE QUI ALIMENTE LE RAG.** `01-` §4, couche 4, le dit mot pour mot. `chargerMatiereClasse(admin, classeId, aujourdHui)` et `semaineCourante(apercu, aujourdHui)` *(`utils/scriptorium-corpus.ts:297`, `:29`)* rendent, par classe, les éléments d'instance avec leur **statut vu / en cours / à venir**. ⛔ **N'écris pas une seconde règle de « vu »** — *« une seule règle, un seul endroit »*, dit son en-tête. ⚠️ **Le rattachement se fait à la CLASSE**, et un bi-classe en a deux : *« servable dès qu'AU MOINS UN cours a été en partie vu »*.

**11. ⛔⛔ LE NON-SPOILER — `borne_amont` EST UNE COLONNE QUE RIEN N'ÉCRIT, À SES DEUX DOMICILES.** `exercices.borne_amont` *(`c4_l1_schema.sql`, jsonb)* et `routeur_decisions.borne_amont` *(`:418`)* : **zéro écrivain**, et le seul endroit du dépôt qui en parle est un commentaire *(`utils/examens/conception.ts:352`)*. ⚠️ **L'écran du corpus DOCUMENTE DÉJÀ L'ABSENCE au lieu de l'exercer** : *« Hors livre — le texte ne porte aucune semaine, et le non-spoiler n'a rien à comparer sur lui »* *(`app/prof/corpus/Rattachement.tsx:105`)*. **Ta décision : quel domicile tu écris, et pourquoi.** *Position de repli : la décision, parce que le `01-` §11 point 1 la nomme là — « la `borne_amont` retenue est journalisée à la décision » — et parce que la borne est une propriété de l'assignation, pas de l'instance.*

**12. ⚠️⚠️ LA CHAÎNE DU NON-SPOILER FAIT DEUX SAUTS, ET LES DEUX IDENTITÉS DE LIVRE NE SONT PAS LA MÊME.** *« L'échelle de comparaison est le plan de lecture du livre — ses semaines numérotées —, et la position de l'élève est la dernière de ces semaines qu'il a lui-même terminée »* *(`01-` §4)*. En base : `exercices_textes.plan_semaine` + `plan_livre_id` **→ `aletheia_livre_reference(id)`** *(`c4_l8_fabrique.sql:354-355`)*, dont l'`unique (scriptorium_livre_id)` **→ `scriptorium_unites`** *(`aletheia_carte_diagnostic.sql:28-37`)* ; et la position de l'élève vit à **`aletheia_travaux(eleve_id, scriptorium_livre_id, semaine_index)`**, avec son `statut` `DRAFT → … → DONE` *(`aletheia_lot2.sql:65-82`)*. ⛔ **`plan_livre_id` ne pointe donc PAS sur le livre, mais sur son artefact de référence** — un saut de plus. ⚠️ **Le `CHECK` `textes_plan_couple_chk` garantit que la semaine et le livre déclaré vont ensemble**, jamais l'un sans l'autre.

**13. ⚠️ ET « SEMAINE » NE VEUT PAS DIRE SEMAINE : `plan_semaine` EST UN ORDINAL DE SÉANCE.** `utils/aletheia-seance.ts:1-27` porte le contrat de terminologie : *« une SÉANCE est un morceau auto-suffisant de la découpe d'un livre : un ORDINAL. Ce n'est JAMAIS une date, JAMAIS une semaine calendaire »* — les colonnes gardent le nom hérité *(`aletheia_travaux.semaine_index`, `exercices_textes.plan_semaine`)*, elles **signifient un ordinal**. L'écran du corpus le redit : *« l'ordinal de découpage du livre, jamais le numéro affiché à l'élève »*. ⛔ **Ne compare jamais une `plan_semaine` à un `cycle_lundi`.** ⭐ Et le §4 donne le repli quand la position est inconnue : **un texte court hors livre**.

**14. ⚠️ « QUELLE SÉANCE L'ÉLÈVE A-T-IL TERMINÉE » N'EST PAS TRANCHÉ PAR LA SOURCE.** Les six statuts d'`aletheia_travaux` ne portent pas le mot « terminée ». *Position de repli : `DONE`, et à défaut `VF_SUBMITTED` — le travail est rendu, la lecture est faite.* **Écris ta lecture en commentaire, fixe-la par un test, et dis-la au relevé.**

### L'orchestrateur — et le déclencheur qu'il n'ouvre pas

**15. ⭐ LE PATRON DE L'ORCHESTRATION EXISTE, IL NE MANQUE QUE DEUX GESTES.** `app/prof/routeur/serveur.ts` *(`chargerBudgets`, l. 63-107)* lit déjà l'état par `donnees.ts` puis appelle les fonctions pures **élève par élève**, avec sa boucle `try/catch` qui **remonte les incidents au lieu de les taire** — *« une lecture ratée n'est pas une base vide »*. **Il ne lui manque que la liste de priorité et la pose.** ⚠️ **Mais c'est un ASSEMBLEUR D'ÉCRAN** : ne mets pas ton écrivain sous `app/` *(piège 37)*.

**16. ⭐ ET LE PATRON DES SEGMENTS AUSSI.** `chargerLesSegments()` *(`serveur.ts:317-343`)* lit `semesters` non archivés + `holidays`, passe par `calculerGrilleSemaines`, saute les vacances et appelle `decouperEnSegments`. **C'est de là que sort le segment courant**, et donc la règle de calibration du §6, le démarrage des compteurs d'escalade au segment 3, et la table de proportions. ⚠️ **Le semestre est GLOBAL au professeur** — aucun lien élève↔semestre, aucun lien classe↔semestre : le rattachement se fait **par les dates**.

**17. ⛔⛔ UN SEUL DÉCLENCHEUR HEBDOMADAIRE, ET C'EST CELUI DE `C4-L13` — IL EXISTE, IL EST ARMÉ, ET IL TOURNE.** `/api/assiduite/hebdo`, cadencé `30 9 * * 1` *(`vercel.json`)*, garde `Authorization: Bearer ${CRON_SECRET}` — **secret absent de l'environnement valant 401** —, `maxDuration = 60`. **La route est MINCE À DESSEIN, et son en-tête dit pourquoi** : *« tout le travail vit à `utils/assiduite/collecte-serveur.ts`, et le point de greffe s'appelle `poserLaSemaineDAssiduite()` »*. ⛔ **N'ouvre pas un second cron sur la clé (élève × cycle)** : le `07-` §2 l'interdit **des deux côtés**.

**18. ⛔⛔⛔ LE PIÈGE LE PLUS CHER DU LOT — SI TU CRÉES LA LIGNE D'ASSIDUITÉ, TU ÉTEINS LA COLLECTE EN SILENCE.** Le `07-` §1.5 écrit : *« `C4-L12` remplit les minutes de **la ligne qu'il trouve**, il n'en ouvre pas »*. **Ce n'est pas une politesse, et voici le mécanisme, lisible dans le code de C4-L13** *(`utils/assiduite/collecte-serveur.ts`)* :

> - La collecte compte **la semaine ÉCOULÉE** ; toi, tu poses **la semaine qui commence** — *« tout se décide à la construction du cycle, AVANT qu'aucun exercice ne soit servi »* *(`01-` §5)*. **Le même déclencheur, deux lundis différents.**
> - Quand la semaine comptée est **arrêtée** *(`retraitCompteDansLaSemaine` rend `recalculer: false`)*, la collecte **lit les lignes déjà posées et SAUTE tout élève qui en a une** — *« une ligne posée n'est plus touchée ; une ligne manquante se rattrape »*.
> - ⛔ **Donc : si tu poses la ligne de la semaine W en y mettant tes minutes, la collecte trouvera cette ligne le lundi de W+1 et n'écrira JAMAIS les agrégats.** `exercices_assignes` reste au **défaut 0**, `completion()` rend `null`, `semaineFaite()` rend **`true`** — *« faite par construction »* — et **la classe entière se lit VERTE pour toujours.** *C'est exactement le mode de panne que C4-L13 a passé son lot à fermer : « une collecte en panne ressemble à une classe parfaite ».*
>
> ⭐ **Deux issues, et une seule ligne de code les sépare.** *(a)* **Écris par `.update()`, jamais par `.upsert()`** : un `update` sur `(eleve_id, cycle_lundi)` touche **0 ligne** quand elle n'existe pas, ce qui est littéralement « la ligne qu'il trouve ». *(b)* **Décale d'un tour** : à chaque déclenchement, remplis les minutes de la semaine que la collecte vient de poser — tu les retrouves dans **ton propre journal**, `routeur_decisions` du cycle précédent portant les exercices posés et leurs durées —, **puis** pose la semaine suivante. **Choisis, et dis-le au relevé** : la prochaine session ne doit pas refaire ce raisonnement.

**19. ⛔ LES DEUX FAITS D'API DU PARTAGE DE LIGNE, ÉPROUVÉS EN BASE PAR C4-L13 — ils valent pour toi à l'identique, dans l'autre sens.** *(1)* **Une clé que tu n'envoies pas garde sa valeur ; une clé envoyée à `null` efface sans un mot.** ⛔ **N'envoie donc JAMAIS `exercices_assignes`, `exercices_termines` ni `semaine_faite`** — ce sont les colonnes de C4-L13, sur ta ligne. *(2)* **Un `upsert` EN LOT unifie les colonnes de son tableau** : une clé présente sur une seule ligne devient une colonne de toutes, et celles qui ne la portaient pas **partent à `NULL`**. ⭐ **Le miroir de ta garde existe déjà, lis-le** : `verifierLaCharge()` et `CLES_INTERDITES` *(`utils/assiduite/collecte.ts:174` et `:243-262`)* lèvent si une clé de minutes entre dans la charge de la collecte, **ou** si les jeux de clés d'un envoi sont hétérogènes. **Écris la garde symétrique, et éprouve-la.**

**20. ⚠️ LES TROIS COLONNES DE MINUTES SONT SOUS CONTRAINTE, ET LA TROISIÈME EST UN COUPLE.** `minutes_assignees >= 0`, `minutes_budget_plancher >= 0`, `minutes_budget_plafond >= 0`, **plus** `assiduite_budget_ordre_chk` : `plafond >= plancher` *(`c4_l1_schema.sql:898-904`)*. ⚠️ **Or `budgetDeLEleve` AVERTIT sans refuser quand le professeur règle un plafond sous le plancher** *(`budget.ts:139-143` ; `reglerLeBudget` fait de même)* : **un réglage parfaitement accepté à l'écran fera échouer ton écriture en base.** Et **supabase-js ne lève pas** — il rend `{ error }` *(piège 27)*. **Décide ce que tu fais de ce cas, et ne le laisse pas passer en silence.**

### La persistance de la décision

**21. ⛔ IL Y A UN `insert` DANS `routeur_decisions`, ET CE N'EST PAS UN PRÉCÉDENT À PROLONGER.** `app/prof/routeur/actions.ts:163-166` — **même table, même clé (élève × `cycle_lundi`)**. ⚠️ **Mais c'est un patron de FORME, pas de fond** : cet `insert` est un **journal d'override**, il pose `regle_declenchee: 'override_prof'` **sans aucune cible**, il vit dans le `else` — **la branche où le dépôt n'a PAS de décision** —, et il **ne repose jamais `routeur_decision_id` sur le dépôt**. *La ligne qu'il crée ne peut donc jamais être relue comme la décision d'un dépôt : elle naît orpheline.* **La tienne doit pouvoir l'être.**

**22. ⭐⭐ `exercices_depots.routeur_decision_id` — CINQ MODULES LE LISENT, ET RIEN NE L'A JAMAIS ÉCRIT.** Les deux écrans du routeur *(`serveur.ts:153-193`, `actions.ts:118-159`)*, la métacognition de la passation *(`utils/passation/metacognition.ts:130-153`)*, le contexte de la chaîne *(`utils/chaine/contexte.ts:171`, `:320-334`)* et la mesure du déroulé *(`utils/deroule/mesure.ts:104-110`)*. **C'est la surface qui devient juste le jour où la colonne se remplit, et elle est plus large qu'un écran.** ⚠️ **Un dépôt, une décision** : c'est ce lien, et lui seul, qui fait qu'un dépôt retrouve sa cible.

**23. ⚠️⚠️ LA FORME DE `sondes_retenues` EST DÉJÀ FIGÉE PAR SES LECTEURS — et `SondePosee` ne la porte pas entière.** `utils/chaine/contexte.ts:325-334` lit un **tableau d'objets** `{ competence, sonde_montee }` ; `app/prof/routeur/serveur.ts:125` lit `{ competence, motif, sonde_montee }`. **Or `poserLesSondes` rend `{ competence, exerciceId, motif, priorite, tirage }`** *(`semaine.ts:237-244`)* — **sans `sonde_montee`**. ⭐⭐ **C'est TOI qui poses ce booléen, et c'est lui qui allume M-e** : `utils/chaine/chaine.ts:783` écrit `competences_mesures.sonde_montee` **depuis ta décision**, et il vaut `false` sur toutes les mesures existantes. **Tant que tu ne l'écris pas, `deplacementsDeMasse` et toute la règle de montée restent inertes.** ⚠️ **Et ne confonds pas les deux sondes** *(`01-` §8.8)* : la **sonde de montée** vérifie l'aisance au-dessus du palier et **ne compte pas** dans N1 ; la **sonde secondaire** mesure en silence et **compte**.

**24. ⚠️ LE TIRAGE ALÉATOIRE SE JOURNALISE, ET LES FONCTIONS PURES NE TE DISENT PAS CE QU'ELLES ONT TIRÉ.** Le `01-` §11 point 5 l'exige — *« un départage non journalisé rend le comportement du routeur irreproductible »* —, la colonne `tirage_aleatoire jsonb` existe, et `ordonnerLesSondes` comme `poserLesSondes` **reçoivent `tirer` en paramètre exprès, « pour que le tirage soit REPRODUCTIBLE et JOURNALISABLE : le module ne tire pas seul »** *(`sondes.ts:70-78`)*. ⭐ **Enveloppe ta fonction `tirer` pour capter l'ensemble des ex æquo ET le choisi** : `tirage: true` seul ne journalise rien.

**25. ⛔ `exercices.cible_primaire` RESTE NULL SUR TA VOIE, ET UNE GARDE POSÉE D'AVANCE T'ATTEND.** *« Sur la voie du routeur elle reste NULL : la cible est la sortie de la couche 2 et vit à la décision »* *(`07-` §1.1)*. L'ordre de lecture a **trois crans** — décision → `cible_primaire` → **repli alphabétique** — et il est en code, `cibleDuRetour` *(`utils/chaine/chaine.ts:413-418`)*. ⭐ **`alerteDeCoexistence()` *(`:447`)* est une garde qui « NE PEUT PAS SE LEVER AUJOURD'HUI » — elle le pourra à partir de ton lot.** ⚠️ **La première branche du `07-` §1.1 doit être juste le jour où ce lot existe** : c'est la seule fois où elle sera vérifiable pour la première fois.

**26. ⚠️⚠️ ÉCRIRE LA DÉCISION CHANGE UN ÉCRAN ÉLÈVE QUE PERSONNE NE T'A DEMANDÉ DE TOUCHER.** `compterLesCiblages()` *(`utils/deroule/vue.ts:538-545`)* compte les lignes de `routeur_decisions` où `cible_retenue = <compétence>`, et `momentDeLaDemonstration(foisCiblee)` bascule de **`avant` à `en_retour`** dès la première *(`utils/deroule/rappel.ts:189`)*. **C'est voulu — *« le routeur distingue les deux cas SUR L'HISTORIQUE DES CIBLES »* (`06-` §2) — et c'est aujourd'hui figé à « avant » pour tout le monde.** ⭐ **Ton lot le débloque ; vérifie-le, et dis-le.**

**27. ⚠️ LE PLAFOND DE 1000 LIGNES, ET LA REQUÊTE LA PLUS PROCHE DE LA TIENNE EST LE CONTRE-EXEMPLE.** Le patron du dossier est `lirePagine` *(`donnees.ts:47-79`)* : **paginer · ordonner sur une clé unique · confronter au `count: 'exact'`**, sinon `LectureTronquee`. ⚠️ *Son `Promise.resolve` n'est pas décoratif : « un constructeur de requête supabase-js est PARESSEUX, il ne part qu'au premier `then` ».* ⛔ **`chargerAssignation()` *(`serveur.ts:150-157`)* borne `exercices_depots` à une semaine SANS `.range()` ni décompte**, et `elevesEtClasses()` *(`:56-59`)* lit tous les élèves de même. **PostgREST plafonne sans rien signaler — `error` reste nul.** ⭐ **Et supabase-js NE LÈVE PAS en écriture non plus** : lis le `{ error }` de chaque écriture. *Le bon geste est à `utils/assiduite/collecte-serveur.ts` (« COLLECTE PERDUE ») et à `utils/cout-api.ts:55-61`.*

**28. ⛔ N'OUVRE AUCUNE POLICY ÉLÈVE, ET PASSE PAR LE CLIENT ADMIN.** Les vingt tables du moteur n'ont **qu'une** policy chacune, `*_prof_all`, posée par la boucle `do $rls$` de `c4_l1_schema.sql:1043-1062`. ⭐ **« Zéro policy élève » est un invariant CONTRÔLÉ PAR REQUÊTE dans deux migrations déjà jouées** — `c4_l3_deroule.sql:271-276` et `c4_l9_examens_diagnostiques.sql:373-378`, drapeau `zero_policy_eleve`, et il couvre nommément `routeur_decisions` et `assiduite_hebdo`. **Ouvrir une policy élève ferait basculer deux vérifications passées.**

**29. ⚠️ LE DÉPÔT QUE TU POSES A DEUX GARDES ET UNE COLONNE INTOUCHABLE.** `origine` est sous `check (origine in ('routeur','prof'))` — **la tienne est `'routeur'`**, et c'est ce qui distingue les deux voies *dans les mêmes tables*. Le trigger `trg_depot_lieu` refuse toute trace de version finale sur un exercice de `lieu = 'classe'` *(`c4_l1_schema.sql:975-994`)*. ⛔⛔ **Et `assigne_at` NE SE RÉÉCRIT JAMAIS** : c'est lui qui **fige la semaine d'assiduité d'un dépôt** *(`07-` §1.1, posé par C4-L13)*, et le patron le dit — *« un `upsert` qui repose `statut` et `assigne_at` ferait repasser à `assigne` un élève déjà à `v1_remis` […] et l'assiduité le recompterait »* *(`app/prof/conception/actions.ts:389-419`)*. **N'insère que les lignes manquantes.**

**30. ⚠️ LE VIVIER SE CONSOMME, ET LA SOURCE NE DIT PAS JUSQU'OÙ.** `candidatsPour` reçoit `dejaPoses` et rend ce que la couche 4 laisse — *« déjà consommés au fur et à mesure par l'appelant »* *(`semaine.ts:118-121`)*. **Dans la semaine, c'est écrit.** ⚠️ **D'un cycle à l'autre et d'un élève à l'autre, non** : rien n'interdit de resservir la même instance, et c'est même normal entre élèves *(une instance, plusieurs dépôts)*. ⛔ **Mais resservir la même instance au MÊME élève serait un défaut silencieux.** *Position de repli : exclure du vivier d'un élève toute instance dont il porte déjà un dépôt.* ⚠️ **Et le statut de l'instance** — `a_concevoir → concu → assigne → clos` — **plus `exercices.bloque`** *(`c4_l8_fabrique.sql:561`)* : **n'entre au vivier que ce qui est `concu` ou `assigne` et non bloqué.** *L'écran de conception refuse déjà d'assigner une instance bloquée ou non conçue* *(`actions.ts:358-362`)*.

### L'écriture de la lettre — le second verrou, et il est plus subtil qu'il n'y paraît

**31. ⛔⛔ `jugerLaLettre` NE FABRIQUE JAMAIS UNE PREMIÈRE LETTRE — et sans première lettre, ton verrou ne tombe pas.** *« Sans lettre, rien ne se juge »* : la fonction rend `{ lettre: null, mouvement: 'aucun' }` dès que `etat.lettre` est nul *(`lettres.ts:177-180`)*, et le `01-` §9 le confirme — *« une compétence SANS LETTRE n'en reçoit pas ici : **sa première lettre vient de sa première ancre** »*. ⭐ **La première lettre vient donc du COLD START** *(`01-` §4)* : les **deux examens diagnostiques** de la semaine 1, avec `profil_provisoire` ; et pour l'élève **absent** à une passation, **la médiane de sa classe** — `medianeDeClasse()` existe déjà *(`lettres.ts:308`)*. ⛔ **Cette médiane n'est JAMAIS écrite dans `derniere_ancre` : ce n'est pas une mesure de cet élève.** ⚠️ **Et `lettre_initiale` doit être écrite dans le même geste** — la colonne existe *(`c4_l2_routeur.sql:142-144`)*, **elle n'a aucun écrivain**, et elle a **un seul lecteur** : `plafondApplicable()` *(`lettres.ts:93-104`)*, sans qui *« une compétence sans ancre monterait sans borne »*.

**32. ⛔⛔ N'ÉCRIS JAMAIS `verdict.lettre` TEL QUEL DANS LA COLONNE — TU REFERMERAIS LE VERROU QUE TU VIENS D'OUVRIR.** `Verdict.lettre` est **ce qui s'affiche**, et il vaut **`null` sous `profil_provisoire`** *(`lettres.ts:74-76`, `:233`)*. Or `filtreR0` teste `lettre !== null` sur la colonne : **pendant tout le segment 2 — celui de ton échéance — `profil_provisoire` est vrai, et une colonne mise à `null` viderait R0 exactement quand la calibration a besoin de lui** *(le §6 est formel : « la règle de calibration — R0 s'applique »)*. ⭐ **Le partage est écrit ailleurs, et il est net** : *« sous `profil_provisoire`, aucune lettre ne S'AFFICHE »* — c'est une **règle de lecture**, jamais d'écriture ; et le `07-` §1 range **« la valeur de ciblage non plafonnée »** parmi les **six valeurs qui ne sont pas des colonnes**. *Position de repli : la colonne porte la valeur **plafonnée**, la suppression d'affichage se fait à la lecture (elle a déjà son interrupteur, `competences_affichage_actif`), et `valeurNonPlafonnee` se recalcule à chaque cycle sans jamais se stocker.* **Écris ton choix au `07-` §1.3 et dis-le au relevé.**

**33. ⚠️ TON QUATRIÈME GESTE A DEUX MOMENTS, ET UN SEUL EST « APRÈS UNE MESURE ».** La **montée**, la **descente par l'ancre**, la **désescalade** et les **compteurs** se jugent **au fil des mesures** — c'est là que la chaîne délègue *(`utils/chaine/mesures.ts:10`)*. Mais **`cloturerLaCalibration` est un événement de BORNE DE SEGMENT** *(`01-` §9, « segment 2 seulement, l'exception meurt à la bascule » ; `lettres.ts:267`)* : *« à la bascule, chaque lettre est jugée UNE FOIS »*, et `profil_provisoire` y bascule. **Il ne peut pas vivre dans la chaîne** : il appartient au passage hebdomadaire. ⭐ **De même, `01-` §5 est catégorique : « AUCUNE MESURE DU CYCLE EN COURS N'ALIMENTE SA PROPRE CONSTRUCTION » — `delai_mesures`, `delai_jours`, `etat_escalade` et la fenêtre d'évidence sont lus UNE FOIS, à la construction.** *Seul `historique_cibles` s'accumule pendant la pose.*

**34. ⚠️ `competences_niveaux` A UN TRIGGER À L'INSERT, ET SA COLONNE DE STATUT EST DORMANTE.** `trg_statut_porte_sa_date` *(`c4_l8_fabrique.sql:154-173`)* pose `statut_recette_pose_le := now()` à l'insert et **lève** si le statut change sans que la date suive. ⛔ **N'écris donc JAMAIS `statut_recette` sur cette table** : il est **GLOBAL** depuis `c4_statut_recette_global.sql` — `competences_statut_recette`, une ligne par compétence —, et la colonne par élève *« devient DORMANTE et est commentée comme telle »*. ⚠️ **Beaucoup d'élèves n'ont AUCUNE ligne, et c'est normal** : `lireLesNiveaux` **énumère les compétences, pas les lignes trouvées** *(`donnees.ts:172-190`)*. **Ton écriture crée donc des lignes autant qu'elle en met à jour** — et les **deux faits d'API du piège 19 valent ici aussi**.

**35. ⚠️ L'ESCALADE ET LA MONTÉE ONT DES CLÉS QUE PERSONNE N'A ENCORE ÉCRITES.** `competences_escalade` est clé **(élève × compétence × OBSERVABLE)** — *« un élève peut être en N2 sur un observable d'Argumentation et en régime normal partout ailleurs »* *(`07-` §1.3)* — et **son seul écrivain du dépôt est un décor de recette** *(`scripts/recette/deroule-c4l3.mjs:1134`, qui insère puis supprime)*. `competences_montee` est clé **(élève × compétence × GRAIN)** et **n'a aucun écrivain du tout** : `lireLaMontee` *(`donnees.ts:216`)* est son unique accès. ⛔ **`cran_atteint` et rien de plus** — *« la distribution NE SE STOCKE JAMAIS : elle divergerait du jour où on l'écrirait »* *(M-c)*. ⭐ **Et ne redouble pas les gardes** : `degreAppele` refuse déjà tout seul hors `evaluee`, sous `profil_provisoire`, et **avant le segment 3** *(`escalade.ts:150-186`)*.

### Ce qui devient faux le jour de ton commit

**36. ⛔ NE GATE RIEN, ET NE BASCULE AUCUN DES SIX.** Ils sont à `utils/allumage.ts:36-43` et **restent à OFF jusqu'à la recette**. ⭐ **`routeur_actif` est LE TIEN À LIRE**, jamais à ouvrir — *« un lot lit LE SIEN, jamais celui d'un voisin »* *(`07-` §5)* —, et **aucun septième interrupteur ne naît** : *« un onglet dont l'interrupteur est à OFF s'affiche, et son contenu dit pourquoi il est vide »*. ⚠️⚠️ **Et son avertissement à l'écran d'allumage DEVIENT FAUX LE JOUR OÙ TU ÉCRIS LA LETTRE** : *« L'OUVRIR NE SUFFIT PAS À ALLUMER LE ROUTEUR […] rien n'écrit encore la lettre, et c'est le quatrième geste de C4-L12 »* *(`utils/allumage.ts:98-105`)*. **Récris-le dans le même geste, ou il apprendra une fausse panne au professeur.**

**37. ⛔⛔ `utils/routeur/` SE DÉCLARE SANS ÉCRIVAIN, ET C'EST UN ÉTAT VÉRIFIÉ.** *« RIEN DANS CE DOSSIER N'ÉCRIT — aucun `insert`, `update`, `upsert` ni `rpc` »* *(`utils/routeur/LISEZ-MOI.md:24-31`)*. ⭐ **C4-L13 a gardé cette phrase vraie en logeant son écrivain ailleurs — `utils/assiduite/`, `collecte.ts` (pur) + `collecte-serveur.ts`** —, et le LISEZ-MOI le dit désormais. **Fais de même**, ou mets le LISEZ-MOI à jour dans le même commit. ⚠️ **Et garde tes règles PURES** : `import 'server-only'` rend un module **inexécutable sous `npm test`**, et le glob est `utils/**/*.test.ts` **et rien d'autre** — *« une règle posée sous `app/` ne serait JAMAIS éprouvée, sans qu'aucun message ne le dise »*.

**38. ⚠️ ET LA DERNIÈRE SECTION DE CE MÊME LISEZ-MOI EST DÉJÀ PÉRIMÉE — vérifie-le et corrige-le.** *« Ce qui reste décoché en recette »* affirme que *« `MANIFESTE_INSTRUMENTS` porte `ouverte: false` sur les six »* *(`LISEZ-MOI.md:101-110`)*, et en conclut que **l'escalade ne peut pas se prouver sur données réelles**. ⛔ **C'est faux depuis C4-L10** : les **six** compétences portent `"ouverte": true` *(`utils/chaine/derive/MANIFESTE.ts`, fichier DÉRIVÉ — il ne s'édite pas à la main)*. **L'obstacle que cette section nomme est tombé ; l'écrire encore, c'est décourager la seule recette qui vaille.**

**39. ⛔ LE DÉCOR DE C4-L2 A ÉTÉ RÉPARÉ PAR C4-L13 — NE LE RECASSE PAS.** `scripts/recette/routeur-c4l2-decor.mjs` semait des minutes en dur *(50 / 45 / 60)* et son `--retire` supprimait **par signature de minutes** : *« le jour où `C4-L12` pose de vraies minutes, ce filtre EFFACE DES LIGNES RÉELLES »*. **Les deux dents sont fermées** — le retrait consomme un **registre** des couples réellement semés, et le semis est un `insert` des seuls couples absents. ⚠️ **Il n'existe toujours aucun drapeau de provenance sur `assiduite_hebdo`** : ta recette doit distinguer un semis d'une mesure **par son registre**, jamais par une valeur.

**40. ⭐ LE GESTE QUI N'EXISTE À AUCUN ÉTAGE, ET CE QU'IL FAUT EN FAIRE.** `propositions_iso_duree` et `choix_eleve` : **deux colonnes, zéro occurrence dans tout le code** *(vérifié le 24/08 sur `app/`, `utils/`, `scripts/`, `components/`)*. **Sa forme est tranchée** *(couche 4 : 2-3 propositions au méso et au macro, aux crans de `produire` et de `transformer`, sauf `transformation_guidee` ; une seule partout ailleurs)*. ⚠️ **Les propositions ont toutes LE MÊME BUDGET DE TEMPS**, et c'est ce qui garde le remplissage **déterministe** — *« si les options avaient des durées inégales, le choix de l'élève déplacerait le budget restant et le routeur devrait replanifier après chaque clic »*. ⛔ **Ce qui n'est PAS tranché est la place qu'y prend la préférence recueillie** *(`01-` §5, « Non tranché »)* : **le lot se construit sans elle, et tu ne la tranches pas en passant.** *`noterLeRecueil` pose déjà la date et un texte libre, et « AUCUNE RÈGLE DE CE LOT NE LA LIT ».*

---

## Le « fait quand » — recopié du `07-Implementation.md` §2

*Recopié du `07-Implementation.md` §2. C'est la condition de recette, et **elle ne se négocie pas en séance**.*

- **une semaine réelle se pose par élève**, dans ses bornes, sur au moins une compétence `evaluee` ;
- la décision est **en base et relisible** — un dépôt retrouve sa cible par `routeur_decision_id`, et la chaîne la lit **sans tomber sur le repli alphabétique** ;
- les **sondes secondaires** sont posées sur la **semaine entière**, jamais exercice par exercice ;
- l'**écart au plancher se journalise** quand la boucle s'arrête sous lui, et le solde revient à la voie mixte **en le disant** ;
- et **une lettre s'écrit** depuis une mesure.

*Échéance* : **AVANT LE SEGMENT 2** *(semaines 2 à 4)*. **Le segment 1 est hors routage** — il sert les deux examens diagnostiques imposés en classe —, mais le segment 2 est celui où *« le routeur tourne en régime de calibration »* et où *« la calibration est le fait du routeur : ce ne sont pas nécessairement des exercices imposés par le professeur »* *(`01-` §4, couche 1)*.

⭐ **Lis la deuxième clause comme une exigence de PREUVE MESURÉE, pas de code écrit.** « Sans tomber sur le repli alphabétique » se constate : `cibleIndeterminee()` *(`chaine.ts:425`)* pousse une alerte nommée dans le bilan d'un dépôt — **elle doit cesser de sortir sur un dépôt routé.** ⭐ **Et la cinquième : « une lettre s'écrit » se prouve par requête**, `select count(*) from competences_niveaux where lettre is not null`, qui vaut **0** à ton entrée.

⚠️ **Le « fait quand » ne demande PAS que le routeur soit allumé** — les six interrupteurs restent à OFF, et `routeur_actif` avec eux. **Il demande que le geste existe et soit éprouvé**, par une traversée de recette qui monte le décor, appelle ton point d'entrée et confronte ce qui est en base. *Le dossier `scripts/recette/` en porte les patrons ; `scripts/recette/routeur-c4l2.mjs` lit déjà tout ce dont tu as besoin, et `scripts/recette/assiduite-c4l13.mjs` §E **joue déjà ce que tu vas faire** — il remplit les minutes d'une ligne posée et vérifie qu'elles survivent.*

---

## Les conventions — `PLAN_DE_CHANTIER.md` §5

### Du dépôt

**Ce lot ne devrait avoir besoin d'aucune migration** — toutes les colonnes qu'il écrit existent *(piège 3)*. **Si tu en écris une quand même** :

**Une ligne au `SUIVI_SQL.md` AVANT exécution, jamais après** — date, fichier, zone, cases Sandbox/Prod. **La migration est additive et gatée** : les **six** interrupteurs restent à OFF. ⚠️ **Le reste du protocole n'est pas ici : il est en tête du `SUIVI_SQL.md`, règle R6** — sandbox d'abord, ne jamais rejouer un fichier de l'Archive, protocole renforcé sur les tables vivantes, et **répétition à blanc sur le CORPS du fichier, jamais sur le fichier entier** *(son `commit;` validerait la transaction d'essai)*. **Lis-le avant d'écrire ta migration** *(c'est aussi la règle absolue de l'`AGENTS.md`)*. ⚠️⚠️ **`exercices_depots` et `assiduite_hebdo` sont des tables VIVANTES** : des dépôts réels y sont, un élève pilote travaille dans cette base, et **la collecte d'assiduité tourne toutes les semaines depuis le 24/08**.

**La doctrine dérivée : PLEINEMENT EN VIGUEUR.** Ton vivier lit les durées, les crans et les objets. **`python3 scripts/derive-doctrine.py --verifie` doit dire `IDENTIQUE` sur les douze tables avant que tu ne lises ces tables** ; **s'il dit DIVERGE, rejoue `--sql` ; jamais corriger la base à la main.** ⛔ **Et `utils/chaine/derive/MANIFESTE.ts` est un fichier DÉRIVÉ** — sortie de `scripts/derive-instruments.py --ecris` — **qui ne s'édite jamais à la main.**

**L'ouverture d'une compétence : SANS OBJET** — les six sont ouvertes depuis le 23/08, et le lot ne se rejoue plus.

### De clôture

**Ta section au `SUIVI_tests_manuels.md`**, au moment où le lot se clôt : ce qui a été **prouvé en séance, coché avec sa preuve**, et ce qui **reste à jouer en recette, décoché, avec sa condition de reprise NOMMÉE**. *« Un reste décoché avec sa condition de reprise nommée est un dépôt de boîte aux lettres réussi — il se retrouve d'un `grep`, il vieillit avec le lot qui l'a écrit, et il n'oblige personne à lire un relevé »* *(`PLAN_DE_CHANTIER.md` §5)*.

⭐⭐ **ET TROIS ENTRÉES DÉCOCHÉES D'AUTRES LOTS PORTENT TON NOM COMME CONDITION DE REPRISE — va les lire, et dis ce que tu leur fais** *(un `grep C4-L12 SUIVI_tests_manuels.md` les rend)* :

- **`C4L2-12`** — *« une semaine réellement remplie »*. ⚠️ Sa condition écrite *(« un statut `evaluee` posé à la fabrique »)* est **datée d'avant le 23/08 au soir** : ce n'est plus elle qui bloque, c'est la lettre.
- **`C4L2-11`** — *« l'escalade sur données réelles, une fenêtre d'évidence remplie »*.
- **`C4L7-2`** — l'absence de routage, **déclarée avec son motif en deux parts** par C4-L7 : *« la compétence qui manquait — AUCUNE ; le geste qui manquait — L'ÉCRITURE DE LA LETTRE »*. **C'est l'entrée que ton lot rend enfin vraie.**

### De dette

**Une source trouvée fausse se MARQUE, elle ne se corrige pas.** Deux gestes : **`[faux]`** au point de l'erreur, et **une ligne à la section DETTES** du `INVENTAIRE_Non_Tranches.md`, qui porte l'**avant / après**. ⚠️ *Ne confonds pas avec le `07-` §1 et l'inventaire des lots du §2, qui sont **OUVERTS À L'IMPLÉMENTATION** : ceux-là, tu les amendes depuis ton relevé, sans accord préalable — ce n'est pas une dette, c'est ton travail.*

### Et une garde de séance

⚠️ **UNE AUTRE SESSION PEUT TRAVAILLER DANS CE DÉPÔT PENDANT QUE TU LIS.** Le `PLAN_DE_CHANTIER.md`, le `SUIVI_tests_manuels.md` et les LISEZ-MOI portent régulièrement des modifications qui ne sont pas d'un lot. **Vérifie `git status` avant d'écrire, écris par ancres plutôt qu'en pleine page, et ne rends jamais compte de ce que tu n'as pas fait.** ⚠️ **`git add -u` n'ajoute pas les fichiers neufs** : relis `git status` et `git show --stat` avant de pousser — **pousser, c'est déployer**. ⚠️ **Ne lance jamais `next build` pendant qu'un `next dev` tourne** : le cache `.next` s'en corrompt.

---

### Et ce que ton relevé doit porter

Le nom du fichier : `RELEVE_C4_L12_2026-XX-XX.md`, à la racine du dépôt `palimpseste`. **Sept choses au minimum**, en plus du récit :

1. **La forme du vivier** *(pièges 4 à 14)* — comment les trois filtres se composent, où vit chacun, et **ce que tu as tranché sur le non-spoiler** : quel domicile de `borne_amont` tu écris, et ce que « séance terminée » veut dire pour toi.
2. ⭐ **Ce que tu as fait du partage de ligne avec `C4-L13`** *(piège 18)* — `.update()` ou décalage d'un tour —, **et la preuve que la collecte d'assiduité écrit toujours ses agrégats après ton passage.** *C'est le point où ce lot peut casser un lot déjà en production, et c'est le seul.*
3. **La forme de `sondes_retenues` que tu écris** *(piège 23)*, et **la première mesure réelle qui porte `sonde_montee: true`** — ou l'aveu qu'il n'y en a pas encore.
4. **Ce que tu écris dans `competences_niveaux.lettre` sous `profil_provisoire`** *(piège 32)*, **ce que tu as amendé au `07-` §1.3** pour l'y écrire, et **d'où vient la PREMIÈRE lettre** *(piège 31 : cold start, médiane, `lettre_initiale`)*.
5. **Où vit ton écrivain** *(piège 37)*, et ce que tu as fait des **deux fichiers qui deviennent faux le jour de ton commit** — l'avertissement de `utils/allumage.ts` et la dernière section du `utils/routeur/LISEZ-MOI.md`.
6. **Le bilan que rend ton point d'entrée**, et ce qu'il distingue : *« rien à poser »* de *« pas passé »*. *Le patron voisin le fait — `BilanCollecte` de `utils/assiduite/collecte-serveur.ts` porte `elevesAttendus`, `lignesPosees`, `lignesFigees`, `motif` et `erreurs`, et `app/api/chaine/route.ts:205-208` en donne la doctrine : « `reclames` et `traites` SE COMPARENT, et c'est la preuve que la garde tient ».*
7. **Ce qui reste à jouer en recette, avec sa condition de reprise nommée** — parce que c'est cela qui part au `SUIVI_tests_manuels.md`, et de là aux lots suivants.

⭐ **Et deux choses à dire même si elles sont petites** : **la recombinaison en 2-3 propositions iso-durée** — construite, ou nommément laissée avec son motif *(piège 40)* — et **le basculement de `momentDeLaDemonstration`** *(piège 26)*, qui change un écran élève que personne ne t'a demandé de toucher.
