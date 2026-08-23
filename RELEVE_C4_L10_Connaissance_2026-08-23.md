# RELEVÉ — C4-L10 · Connaissance, la quatrième compétence dans la chaîne (23/08/2026)

**Commit `90770ea`, sur `main`, poussé** *(donc déployé)*. 12 fichiers, +3 461 / −24, dont quatre
neufs. **Aucune migration** — `SUIVI_SQL.md` intact, et aucune n'était attendue.

⛔ **Ce relevé ne se lit pas depuis une autre session Code** : la règle de manifeste l'interdit, et
un relevé ne fait partie d'aucun manifeste. Ce qu'il a à dire aux lots à venir est **à la boîte aux
lettres du `PLAN_DE_CHANTIER.md` §5, entrée C4-L10, items 24 à 31**, et ce qu'il a à dire à la
recette est au `SUIVI_tests_manuels.md`, section *« C4 · L10 — la CONNAISSANCE »*.

⚠️⚠️ **S'IL NE FALLAIT LIRE QU'UNE CHOSE : la Connaissance est ouverte et n'écrira AUCUNE MESURE
tant qu'aucune source ne déclare le CORPUS DE COURS.** Le portage est complet, éprouvé et vert ; le
blocage est au chantier de conception, la fiche le portait déjà, et aucun lot Code ne peut le lever.
Voir §7.

---

## 1. Le contrôle d'entrée

Les **six pièces** du manifeste existent, aux statuts requis.

| Pièce | Attendu au prompt | Trouvé | Verdict |
|---|---|---|---|
| `07-Implementation.md` §1 et §2 | VERSION 2.34 | **2.37**, RELU ET VALIDÉ | ⚠️ **version différente — en-tête relu**, comme le contrôle d'entrée le prescrit |
| `03-competences.md` §1, §2, §9 | 2.1, relu et validé | 2.1, VALIDÉ ET GELÉ | ✓ |
| `01-routeur.md` §3, §8.2, §11 | 5.5, relu et validé | 5.5, VALIDÉ ET GELÉ | ✓ |
| `competences/connaissance.md` | 2.2, **relu et validé** *(pas versé et bancé)* | 2.2, RELUE ET VALIDÉE | ✓ |
| `copies-tests/_commun/CONTRAT-MODULES.md` | déposé | validé par Louis item par item, 1-2 août | ✓ |
| `copies-tests/connaissance/code.py` | déposé | calcul **v1.3**, autotest **vert** | ✓ |

⚠️ **L'écart de version du `07-` n'a pas bloqué, et il ne devait pas** : *« la version avertit, le
statut bloque »*. Son en-tête a été relu — **2.35 → 2.37 sont des amendements de C4-L11 et de
C4-L10 · Structure aux SEULES sections ouvertes** *(l'inventaire des lots du §2, le §1, le §5)* ; le
régime de gel, la règle de manifeste et le §4 n'ont pas bougé.

**Le type des constantes a été vérifié avant leur taille** *(leçon de l'Expression, où un `len()` sur
une chaîne avait rendu « 52 vecteurs » qui étaient 52 caractères)* : `TESTS_P2_PARFAIT` est une
**liste de 18**, `TESTS_CODE1_PARFAIT` une **liste de 4**, `VERSION_GOLDS_TESTEE` vaut **`None`**.
Conforme au prompt sur les trois.

**Ce que le dossier porte en plus, ou en moins** : `copies-tests/connaissance/` ne contient que ses
deux prompts dérivés et son module — **ni gold, ni copie, ni critère, ni run stocké**. La contre-
épreuve des 112 couples réels dont la Structure a bénéficié n'existe pas ici *(vérifié :
`find … -name '*.json'` rend zéro ; seules l'Expression et la Structure en ont)*.

---

## 2. ⭐ LA PORTE — C4-L11 devait être joué, et il l'est

La `cible_primaire` **est construite** : la colonne existe *(`c4_l11_additifs.sql`)*, le champ est à
l'écran de conception *(`app/prof/conception/nouvelle/Pipeline.tsx:412`, `actions.ts:148`)*, et
**`cibleDuRetour` la lit avant tout défaut** *(`utils/chaine/chaine.ts:364-367`)*.

⭐ **Et cela a été vérifié EN BASE, pas seulement en lecture de code** : sur trois instances semées,
la cible du retour est `connaissance` là où le repli alphabétique aurait dit `argumentation` — **la
quatrième confirmation du chantier**. Sur l'instance **sans** `cible_primaire`, l'alerte tombe et le
repli désigne bien `argumentation`, que personne ne vise.

---

## 3. Le socle, vérifié point par point

Les **huit points** posés par `C4-L10 · Expression` le 22/08 sont là, vérifiés en une commande
chacun.

1. **Le verrou est aligné** — `--resume` déclare **les six** compétences OUVERTES à la dérivation,
   la Connaissance en **v2.2** avec ses **8** observables de télémétrie.
2. **`utils/chaine/slots.ts`** — tête invariante, substitution sous balise de matériau, refus des
   deux sens au chargement, `FOURNISSEURS_NATIFS` nommé **en un seul endroit**.
3. **`code2(artefactP2, sortieCode1, ctx)`** — la signature porte la sortie de `code1`.
4. **`conformite`** déclaré au branchement et appelé **à chaque passage** *(`chaine.ts:675`)*.
5. **Les crochets pré-phase ont leur canal** — `prepareCopie`, `pre` par étage avec `slotsFournis`
   déclarés, `preP2` dont **un `null` arrête la mesure en nommant le slot**.
6. **Le canal privé `_audit`** et `refusFormeCode2` sur les trois clés publiques ; **`injection_p2`
   n'existe pas**, et le refus de slot le dit plutôt que d'ouvrir une échappatoire.
7. **`utils/chaine/arrondi.ts`** existe.
8. **`valeursDesParametres()`** — un seul domicile. ⭐ **La Connaissance est l'une des deux fiches
   directement concernées** : ses six paramètres sortent en **nombres**, quand
   `instrument.parametres.seuil_ratio_haut` porte bien un **BLOC** *(`defaut`, `bornes`, `statut`)* —
   vérifié en recette, les deux à la suite.

**Aucun canal n'a eu à être ajouté à `BranchementCompetence` — la promesse de l'item 1 de la boîte
aux lettres tient pour la quatrième fois.**

---

## 4. Ce qui a été construit

| Fichier | Nature | Ce qu'il porte |
|---|---|---|
| `utils/chaine/branchements/connaissance.ts` | **neuf**, 1 059 l. | le portage : `pre_p1`, `pre_p2`, `code1`, `code2`, `conformite`, la lettre, le relevé de télémétrie |
| `utils/chaine/branchements/connaissance.test.ts` | **neuf**, 811 l. | 44 tests — le module en référence, le balayage, l'épreuve négative en assertions |
| `scripts/vecteurs-connaissance.py` | **neuf**, 685 l. | le harnais : importe le module, joue ses crochets, rend entrées ET sorties en JSON |
| `scripts/recette/connaissance-c4l10.mjs` | **neuf**, 509 l. | la recette en base, par le même code que la route |
| `utils/chaine/python.ts` | +96 l. | `separeParBlancs`, `stripCaracteres`, `formateFlottant`, `strFlottant` — **une fois pour les six** |
| `utils/chaine/instruments.ts` | +22 l. | l'import et le branchement, avec leur motif |
| `utils/chaine/instruments.test.ts` | ±25 l. | « trois compétences ouvertes » devient **quatre** ; « les trois autres » devient **les deux** |
| `PLAN_DE_CHANTIER.md` · `SUIVI_tests_manuels.md` | ±266 l. | la boîte aux lettres, la section de clôture |
| trois dérivés | empreintes | conséquence des `[faux]` et de l'amendement du `07-` |

⛔ **`utils/chaine/chaine.ts` n'a pas été touché d'une ligne.** *« Ta réussite se mesure à un diff
quasi nul hors d'`instruments.ts` »* — c'est le cas : hors du branchement, de son test, de son
harnais et de sa recette, le lot pèse **+143 lignes**, dont 96 dans le module de formes partagé.

---

## 5. Le portage — ce qui a été extrait, et ce qui a été durci

**La table d'extraction, suivie à la lettre.**

| Vers | Depuis `copies-tests/connaissance/code.py` |
|---|---|
| `extractions[0].pre` | `pre_p1` |
| `jugement().preP2` | `pre_p2` |
| `code1` | `code1` |
| `code2` | `detecte_justesse` + `detecte_diversite` + `croisement` + `code2` |
| `conformite` | `conformite` |

**Une dette de source, suivie sans être corrigée.** `pre_p1(texte, params=None)` prend **le TEXTE**
quand le `CONTRAT-MODULES.md` §2 et `banc.py` passent **le CONTEXTE** — vérifié en appelant :
`AttributeError: 'dict' object has no attribute 'strip'`. **Le portage suit LE CONTRAT**, qui est au
manifeste, et lit la copie dans le contexte. *L'Expression porte le même défaut ; la dette est au
registre, **D4**.*

**Ce que le portage durcit, et rien de plus.** Le module lève sur quelques formes que P1 ou P2
peuvent prendre — une `citation` ou une `source` qui est un nombre ou un objet *(`.strip()` sur un
non-texte)*, un `restitution_de_cours` qui est un mot *(`int("oui")`)*, des numéros d'unité de types
mêlés *(`sorted()` sur `str` et `int`)*. Le contrat §3 l'interdit — *« le module ne lève jamais
d'exception »* — et prescrit *« une alerte, pas une valeur par défaut »*. **Quatre durcissements,
chacun marqué ⚠️ PORTAGE, aucun ne se déclenchant sur un vecteur.**

⭐ **Et la sémantique de Python est portée, pas réparée** — la leçon de la Structure. Une chaîne est
itérable et rend ses **caractères** : `unites_mobilisees: "abc"` donne **trois** unités illisibles,
`mentions_vides: "xy"` donne `n_mentions_vides = 2`. `str()` d'un conteneur reprend le `repr()` de
ses éléments : un `type: ["reference"]` vaut `"['reference']"`, **hors catalogue** — là où
`String(["reference"])` de JavaScript aurait rendu `"reference"`, **compté le registre, et ne rien
dit**. Les deux cas sont au balayage.

**Une décision d'implémentation, déclarée.** Le module cherche la production sous
`mesures._production` puis `sortie_p1._production` — **que rien ne remplit jamais** —, et son alerte
de repli dit le motif : *« la production n'est pas jointe au CONTEXTE »*. Dans la chaîne **elle
l'est** (`ctx.contexteExercice.copie`), et le portage la lit là **en troisième recours** : c'est le
contrôle du module, alimenté par l'entrée qu'il nomme, non un contrôle nouveau. Sur les vecteurs, où
le contexte est vide, **le repli « NON EXÉCUTÉ » tombe exactement comme dans le module** — les 14 cas
de `conformite` sont identiques des deux côtés. *Signalé à Louis en fin de séance ; l'annuler tient
en une ligne.*

⭐ **Le contrôle d'existence des citations reste OÙ IL EST.** La Connaissance est l'un des **deux**
modules sur six à le porter, et **le seul à le porter dans `conformite`** *(l'Expression le porte
dans `code1`)* — un `[à valider]` du contrat §8. Le portage ne l'uniformise pas.

---

## 6. La seconde moitié — les huit observables du §5, et les DEUX dénominateurs

**Le module rend cinq observables ; le §5 de la fiche en déclare huit ; les deux listes sont
DISJOINTES.** *(Le seul croisement de tout le corpus est `question_specifique`, au Questionnement.)*

| Observable du §5 | Famille | D'où il vient |
|---|---|---|
| `mobilisation` | comptage | `mesures.n_unites` |
| `diversite_registres` | comptage | `mesures.registres` |
| `diversite_sources` | comptage | `mesures.sources` |
| `taux_justesse` | **proportion** | **calcul propre** — `justes / jugées`, divisé EN ENTIER par `code2` |
| `contresens` | comptage rapporté | **calcul propre** — `contresens` **+** attributions `erronee`, parmi les jugées |
| `unite_plaquee` | comptage rapporté | **calcul propre** — `apropos = plaque`, parmi les jugées |
| `inverifiable` | comptage rapporté | **calcul propre** — `n_inv`, rapporté au relevé entier |
| `etendue_rappel` | ordinal | la valeur du juge, ou `null` |

⚠️ **`rapporte_a` est un texte libre, et il en existe DEUX valeurs distinctes** —
`les unités jugées, les inverifiable exclues (§4)` et `les unités du relevé`. `observables.ts`
cherche l'entrée **sous ce nom exact** ; il en manquerait une et les observables concernés
sortiraient en `n/a` **sans un mot**. Les deux sont au relevé, et un test les fixe.

⭐ **`taux_justesse` est la seule `proportion` de la fiche, et elle NOMME sa population, exclusion
comprise** — *« proportion d'unités `juste`, les `inverifiable` hors du dénominateur »* au §5, et
*« la majorité stricte des unités JUGÉES sont justes »* au champ `sens` du bloc machine. **Les deux
endroits disent la même chose** : rien à arbitrer, contrairement à l'Argumentation *(population non
nommée)* et à la Structure *(deux populations nommées, et pas la même)*. **Vérifié aux deux endroits,
comme l'item 21 de la boîte aux lettres le demande.**

⚠️ **Un dénominateur nul rend `null` — donc `n/a` —, jamais 0** : une copie dont tout est
invérifiable n'a pas « 0 % de justesse », elle n'en a pas. Et ⛔ **rien ne s'arrondit** : ni la fiche
ni le module ne le demandent, et un arrondi inventé déplacerait une valeur autour du seuil de 0,5.
*(Une première écriture arrondissait à six décimales ; le test l'a fait tomber le jour même.)*

**Sur un PASSAGE MANQUÉ**, le partage suit la chaîne : ce que **`code1`** a compté est un fait du
relevé de P1, vrai quoi que le juge ait rendu, et reste au relevé ; ce que **le juge** nourrit n'a
pas eu lieu et sort en `n/a`, **chacun avec son alerte nommée**.

---

## 7. ⚠️⚠️ LE BLOCAGE — le corpus de cours, et pourquoi ce n'est pas un lot Code

La Justesse se juge contre **deux référents, dans cet ordre** *(fiche §1)* : **le corpus du cours de
la classe**, puis le savoir du modèle en repli. Le premier *« fait foi quand le cours diverge de la
doctrine des manuels : l'élève est jugé sur ce qu'on lui a enseigné, et non sur le canon »*.

`pre_p2` le réclame au contexte de l'exercice. **Ce que la chaîne sert tient en quatre noms** —
`sujet`, `consigne`, `copie`, `mode` *(`chaine.ts:517`)* —, et **`corpus_cours` n'existe nulle part
dans le dépôt** : vérifié par grep sur `utils/`, `app/`, `scripts/`, il n'apparaît que dans les
commentaires de `instruments.ts` et dans un test de `slots.ts`.

**Servi à `null`, le slot arrête la mesure EN LE NOMMANT.** C'est la conduite prescrite par le
contrat §2 — *« c'est ainsi qu'un module dit “le contexte ne porte pas ce qu'il me faut” sans jamais
lever d'exception ni inventer une valeur »* — et **la seule juste** : servir un vide au juge aurait
produit une lettre calculée sur un référent absent.

**Constaté sur un dépôt réel, pas supposé** :

```
alerte : connaissance : REFUS : `preP2` ne peut pas servir « corpus_cours »
         — le contexte de l'exercice ne le porte pas
```

- **quatre squelettes écrits**, celui de la Connaissance portant **son extraction et pas son
  jugement** — la chaîne s'est arrêtée exactement entre les deux ;
- **aucune mesure de Connaissance**, `mesuresEcrites = 3` ;
- **les trois autres compétences ont mesuré normalement**, avec leurs trois lettres : l'arrêt d'une
  chaîne n'en emporte aucune autre.

⭐ **Le canal, lui, est bon** : dès qu'un contexte porte un corpus, `pre_p2` le sert — éprouvé dans la
recette, les deux cas à la suite. **C'est LA SOURCE qui manque.**

⭐⭐ **Et la fiche le savait.** Son §8, **« Les vraies questions ouvertes »**, ne porte qu'une ligne, et
c'est celle-là : *« Le corpus de cours n'est déclaré dans aucune source qui fait foi : le
`01-routeur.md` §2 le mentionne en passant, dans sa table des modules. Le premier référent de la
Justesse repose donc sur un objet que le chantier n'a jamais écrit »*, condition de fermeture *« la
séance qui écrira l'assembleur, ou celle qui déclarera le corpus dans une source »*.

⛔ **Aucun lot Code ne peut le trancher.** Déclarer le corpus, c'est dire **ce qu'il est**, d'où il
vient *(Scriptorium ?)*, sa granularité, et par quel canal le contexte de l'exercice le sert — quatre
décisions de conception. Reste `C4L10C-19`, **avec la condition de fermeture de la fiche, mot pour
mot**.

---

## 8. ⭐⭐ LA TROUVAILLE — deux écarts de langage de plus, et le second ne se voit qu'aux seuils déplacés

L'item 10 de la boîte aux lettres en comptait quatre, l'item 17 en a ajouté deux. **En voici deux
autres**, tous deux dans `utils/chaine/python.ts`, **écrits une fois pour les six**.

### 7ᵉ — le FORMATAGE d'un flottant

`round()` était le premier écart connu. **Le formatage `%.1f` / `%.2f` en est un autre, et il
n'était pas porté.** Python formate en tranchant les égalités exactes **AU PAIR** ; `toFixed` les
tranche **vers le haut**.

| valeur | `"%.1f"` Python | `toFixed(1)` | | `"%.2f"` Python | `toFixed(2)` |
|---|---|---|---|---|---|
| **6.25** | **`6.2`** | `6.3` | | `6.25` | `6.25` |
| **0.25** | **`0.2`** | `0.3` | | `0.25` | `0.25` |
| **31.25** | **`31.2`** | `31.3` | | `31.25` | `31.25` |
| **0.625** | `0.6` | `0.6` | | **`0.62`** | `0.63` |
| **0.125** | `0.1` | `0.1` | | **`0.12`** | `0.13` |

⚠️ **Et l'égalité exacte n'est pas une curiosité de laboratoire.** La part d'unités invérifiables
vaut `100·k/n` : **une unité sur SEIZE fait 6,25 % pile**, cinq sur seize 31,25 %, une sur huit
12,5 %, huit sur quarante ouvrent un rapport de 0,625. **Aucun des 18 vecteurs ne tombe dessus** —
ils tombent sur des valeurs rondes. Mesuré : sur douze valeurs, `arrondi(x,n).toFixed(n)` reproduit
Python **partout**, et `toFixed` seul diverge **sur trois**.

→ `formateFlottant(x, n)`, adossé à `arrondi()`.

### 8ᵉ — `str()` d'un flottant Python, et il a fallu déplacer les seuils pour le voir

`python.ts` le nommait déjà, **en le tenant pour théorique** : *« la seule divergence connue […] cela
ne touche QUE des textes d'alerte, jamais un verdict »*. **Il touche une TRACE**, et le « fait quand »
exige l'identité sur les trois clés.

Python distingue `5` de `5.0` et écrit `« 5.0 »` ; **le type se perd en JSON**, et JavaScript écrit
`« 5 »`. Au défaut `seuil_ratio_haut = 4.5`, **les deux textes coïncident et rien ne se voit**. Le
jour où le banc règle le seuil sur un entier — ce que le balayage d'un paramètre *provisoire (réglage
empirique)* fait —, la trace diverge :

```
  PORTE 2 fermée : rapport 8.33 > 5.0     (Python)
  PORTE 2 fermée : rapport 8.33 > 5       (portage naïf)
```

⭐ **Le type ne se retrouve qu'À LA DÉCLARATION** : un paramètre dont la fiche écrit
`bornes: [0.0, 100.0]` est un flottant, `bornes: [0, 100]` un entier. → `strFlottant()`, un ensemble
`PARAMS_FLOTTANTS` au branchement, **et un test qui le confronte aux types Python réels du module** —
il ne peut donc pas diverger en silence. *La note d'en-tête de `repr()` a été rectifiée : l'écart
n'est plus théorique.*

### Et la BOM, qui corrige l'item 17 dans un sens qu'il ne disait pas

L'item 17 nommait les blancs que **Python a en plus** *(les séparateurs `\x1c`-`\x1f`, le NEL)*.
⚠️ **Dans un `_n` qui finit par `" ".join(s.split())`, ceux-là ne discriminent RIEN** : le `split()`
final les retire déjà aux deux bords, et le `.strip()` initial est redondant. ⭐ **Ce qui reste
discriminant, c'est le blanc que JAVASCRIPT a en plus** — la **BOM (U+FEFF)**, que `trim()` mange et
que `strip()` garde. Vérifié en Python : `_n("﻿reference")` vaut `"﻿reference"`, **hors
catalogue** ; un portage en `trim()` aurait compté le registre, **sans une alerte**.

---

## 9. L'épreuve négative — 40 mutations, 40 tuées, et ce que les deux survivantes disaient

Le portage a été cassé **exprès, règle par règle**, par un harnais qui patche le fichier et relance
le test. **La télémétrie D'ABORD**, comme l'item 11 de la boîte aux lettres l'a appris : 10 mutations
sur les huit observables et les deux dénominateurs, 30 sur le calcul.

⭐ **Les DIX mutations de télémétrie sont tombées du premier coup.** La parade des items 11 et 20 —
comptes **asymétriques**, et **au moins un élément écarté du décompte qui porte quand même la
propriété mesurée** *(une unité `inverifiable` ET `erronee`, ou `inverifiable` ET `plaque`)* — marche
mot pour mot. Les items 11 et 20 disaient « deux sur quatorze » puis « cinq sur vingt-neuf », toutes
dans la télémétrie ; **ici, zéro**.

⚠️ **Deux mutations ont survécu au premier passage, et NI L'UNE NI L'AUTRE N'ÉTAIT UN TROU.**

**(a) `ratio > seuil` → `>=` — un CHEMIN MORT.** Énumération jusqu'à **n = 4 000** : **aucun** couple
(unités, invérifiables) ne met le rapport exactement à 4,5 sans que la PORTE 1 ait déjà arrêté la
copie *(`200k = 9(k+j)j` n'a pas de solution entière sous le plafond)*. La stricte inégalité
contrôlait un chemin que la chaîne ne peut pas prendre. L'item 20 le disait de l'atteignabilité
d'une **branche** ; **c'est aussi vrai d'un opérateur de comparaison**.
⭐ **Et le remède est général : balaye les SEUILS, pas seulement les entrées.** Cinq des six
paramètres sont *provisoire (réglage empirique)* et **se balayeront au banc** ; à
`seuil_ratio_haut = 5.0`, cinq unités dont une invérifiable donnent un rapport de **5,0 pile**.
→ `balayage_seuils_deplaces`, neuf paramétrages, 108 cas, dix lignes de harnais. **La mutation
tombe** — et c'est ce balayage qui a trouvé le 8ᵉ écart de langage, en prime.

**(b) `strip()` → `trim()` dans `_n` — un ÉQUIVALENT**, jusqu'à la BOM *(voir §8)*.

⭐ **La leçon, et elle est encourageante** : quand la parade des items 11 et 20 est appliquée d'emblée,
**ce qui survit n'est plus un oubli — c'est une règle inatteignable ou du code équivalent**, et
l'analyse d'une survivante devient une question sur **la règle**, pas sur le portage.

*Le harnais de mutations était un outil de séance ; il a été retiré. Ce qui reste est permanent : les
assertions « FICHE » du test, adossées à la fiche sur des cas discriminants.*

---

## 10. Les preuves

| Contrôle | Résultat |
|---|---|
| `derive-instruments.py --resume` | Connaissance **OUVERTE**, v2.2, **8** observables de télémétrie |
| `derive-instruments.py --verifie` | **IDENTIQUE** (10 dérivés) |
| `verifierCoherence()` | **[]** — aucun écart |
| `competencesOuvertes()` | `expression, argumentation, structure, connaissance` |
| `competencesEnAttenteDeBranchement()` | `synthese, questionnement` |
| `npm test` | **1 160 passés, 0 échoué** *(entrée : 1 116 ; **44 neufs**)* |
| `npx tsc --noEmit` | rien |
| `npx eslint` sur les fichiers du lot | **0 erreur, 0 avertissement** |
| harnais des vecteurs | **1 023 cas**, trois clés identiques |
| épreuve négative | **40 mutations, 40 tuées, 0 survivante** |
| recette `--sans-appel` | **38 contrôles, 38 verts**, aucun coût |
| recette complète | **54 contrôles, 54 verts**, 8 appels réels |

**Le détail des 1 023 cas** : 18 vecteurs `code2` + 4 vecteurs `code1` + 252 distributions de la
cascade + 112 unités à deux propriétés + 230 couples des deux portes + 108 aux seuils déplacés +
108 couples (registres, sources) + 39 relevés à `code1` + 37 formes de `_n` + 26 étendues + 16
appariements + 16 croisements + 15 pré-relevés + 21 `pre_p2` + 14 `conformite` + 7 de formatage.

⚠️ **Le harnais rejoue le module À CHAQUE EXÉCUTION** — jamais une fixture recopiée. *« Des vecteurs
qui pourrissent en silence valideraient le calcul contre une référence morte »* (contrat §5). Le jour
où le module bouge, le test le dit. **Et un module en échec n'est PAS une raison de sauter** : le
test crie plutôt que de se taire.

**Le dépôt réel.** Un `paragraphe` de la maison, cran 6, mesurant **quatre** compétences, sur une
copie écrite pour porter les faits que le §3 nomme. P1 a rendu **5 unités couvrant LES QUATRE
REGISTRES**, **zéro décompte**, **zéro verdict de justesse** — *« c'est ce qui l'empêche de corriger
l'élève en le relevant »* —, et a rangé **« Comme le dit Kant, il faut y réfléchir » dans
`mentions_vides`**, sans en faire une unité : **le pari du §8 tient sur son premier cas réel.**
`code1` sur ce relevé : **5 unités, 4 registres, 3 sources, 1 mention vide, 2 `[posee_seule]`**. Le
pré-relevé mécanique a numéroté **8 phrases, 181 mots**, et le message réellement assemblé les porte.
La tête invariante de P1 fait **4 476 caractères et ne porte aucun slot** — elle se cache.

**Idempotence** : `traiterDepot` rejoué, **3 mesures avant, 3 après**. **Décor retiré** — plus aucune
entrée `RECETTE-C4L10-CON` en base, vérifié par requête. **`chaine_actif` rendu à OFF.**

⛔ **Aucun statut de recette posé, aucun proposé.** La Connaissance est `mesuree_silencieusement`.
**Rien n'a changé pour un élève.**

---

## 11. ⚠️⚠️ LE PREMIER TROU SILENCIEUX MESURÉ SUR COPIE RÉELLE — et il est dans un champ LIBRE

Le « contrôle gratuit » du contrat §7 a été fait **en comptant, pas en raisonnant** *(item 22)*. Tous
les champs à liste fermée alertent — `type` hors catalogue, `justesse`/`attribution`/`apropos`/
`referent` hors liste *(l'unité est écartée, donc la bijection tombe, donc `PASSAGE MANQUÉ`)*,
`etendue` hors liste, `citation` vide ou illisible. **Le portage n'a eu à créer aucune alerte** —
bénéfice de l'extraction, pour la quatrième fois.

⚠️⚠️ **Mais `source` est un TEXTE LIBRE, et il n'a aucun garde-fou possible — et il a mordu sur la
PREMIÈRE copie réelle.** La fiche §3 veut *« l'auteur, l'œuvre ou le domaine que la copie nomme, mots
exacts »* ; P1 a rendu :

```
sources relevées : ["Bergson", "distinction que nous avons vue en cours", "", "Aristote"]
```

**Mesuré, toutes choses égales par ailleurs** — même relevé, seule la `source` de l'unité 2 changée :

| | registres | sources | Diversité | **NIVEAU** | alertes |
|---|---|---|---|---|---|
| relevé RÉEL | 4 | **3** | **haut** | **ACQUIS** | **0** |
| la même, source vide | 4 | **2** | satisfaite | **BON** | **0** |

**Une seule entrée mal formée fait passer la copie de Bon à Acquis, sans une alerte.** Aucune liste
fermée ne peut le garder ; `SOURCES_PEUT_ETRE_IDENTIQUES` ne l'attrape pas non plus, puisqu'il ne
cherche que les inclusions entre désignations.

⛔ **Non corrigé, et délibérément** : ajouter une alerte ferait diverger la troisième clé, et le
« fait quand » exige l'identité *(item 22 : « ne les ajoute pas au branchement, relève-les »)*.
Reste `C4L10C-20`, **condition de reprise : le Run 1 de la Connaissance**, qui dira quelle part des
`source` relevées ne sont pas des désignations. Trois issues possibles, toutes de conception :
resserrer le prompt P1, ajouter un `source_canonique` au relevé *(le §8 l'envisage déjà, mais pour
un autre motif — les graphies multiples)*, ou accepter le bruit et le mesurer.

**Un second trou, plus petit** : le champ `phrases` du relevé est déclaré au §3 et `pre_p1` numérote
**pour lui** — **et ni `code1`, ni `code2`, ni `conformite` ne le lisent jamais**. Rien ne vérifie
qu'il pointe une phrase existante. Relevé *(`C4L10C-21`)*, non corrigé.

---

## 12. ⚠️ Le bilan d'un dépôt nomme ce qui est SOUMIS, pas ce qui est MESURÉ

Trouvé parce que la recette a rougi sur trois assertions — **et c'est la recette qui avait tort.**

`bilan.competencesMesurees` se calcule **AVANT** les passages
*(`competencesFroides.filter(ouvertes.has)`, `chaine.ts:276`)*, et `competencesEcartees` ne porte que
les écartements **de pré-vol** *(statut `differee`, compétence non branchée)* ou les chaînes qui
**ont levé**. Une chaîne qui tourne et **refuse proprement** — le cas de la Connaissance — reste dans
« mesurées » et dit son motif **en alerte**.

⭐ **Rien n'est tu** : `mesuresEcrites` valait **3** quand `competencesMesurees` en comptait **4**, et
`resumerBilan` affiche les deux côte à côte. **Le chiffre qui ne ment pas est `mesuresEcrites`.**

⚠️ **Mais le cas n'existait pas avant** : la Connaissance est **la première compétence du chantier
refusée EN COURS DE CHAÎNE plutôt qu'au pré-vol**. ⛔ **Non corrigé** — `chaine.ts` est bâtie et
éprouvée. Relevé *(`C4L10C-24`)* ; c'est un candidat naturel pour un lot de correctifs.

---

## 13. Les sources touchées, et les deux dettes déposées

**Ce qu'une session Code a le droit d'écrire** : le `07-` §1 et l'inventaire des lots du §2 sont
**ouverts à l'implémentation**. Partout ailleurs, **on marque, on ne corrige pas**.

- **`07-Implementation.md` → 2.38**, inventaire du §2 **seul** : l'entrée de C4-L10 porte l'état au
  23/08 au soir — **quatre** compétences ouvertes —, et nomme l'état neuf que ce portage fait
  apparaître : **une compétence ouverte qui ne mesure pas**. *Rien d'autre n'a bougé.*
- **`competences/connaissance.md`** — `[faux]` **D5** dans la prose du §4.
- **`copies-tests/_commun/CONTRAT-MODULES.md`** §2, ligne 2 — `[faux]` **D4**.
- **`INVENTAIRE_Non_Tranches.md`** — les deux dettes, avec leur avant / après ; le compte passe de
  **3 à 5**.

| # | La source | Ce qu'elle dit | Ce qu'elle devrait dire |
|---|---|---|---|
| **D4** | `expression/code.py` et `connaissance/code.py`, `pre_p1` | prend **le TEXTE** | **le CONTEXTE.** Le banc lèverait une `AttributeError` au premier run **sur les deux**. ⭐ Le `code1` de la Connaissance porte déjà le patron du repli : **deux lignes par module**. ⚠️ **À traiter AVANT le Run 1**, pas à la passe de réconciliation |
| **D5** | `competences/connaissance.md` §4, `etendue_rappel.sans_objet_si` | *« rendue hors du contexte de classe »* — une **phrase** | **une VALEUR.** Le `03-` §1 le définit comme *« la valeur qui met la mesure hors du dénominateur »*, et `observables.ts` la compare **à l'exact** : le champ est **INERTE**. Rien n'est faussé — la mise hors dénominateur passe par le `n/a` — mais **c'est une garde qu'on croit lue**. Attend la passe |

⛔ **Le `[faux]` de D4 n'a PAS pu être posé au point de l'erreur** : un module est **haché au
manifeste** *(contrat §1)* et aucun lot Code ne l'édite *(« un module modifié pour faciliter un
portage casse le banc qui l'a validé »)*. Il est posé au `CONTRAT-MODULES.md` §2, **le seul endroit
où un portage va chercher qui utilise le crochet**.

⚠️ **Marquer une fiche change son `empreinte_source`** → `--verifie` a dit **DIVERGE** → **`--ecris`
rejoué**, jamais un dérivé corrigé à la main. Diff : **l'empreinte seule** — le `[faux]` est dans la
prose, les prompts et le bloc machine sont identiques à l'octet. *Et c'est pourquoi il est dans la
prose : un `[faux]` dans un bloc dérivé partirait au modèle.*

⛔ **Le dépôt `palimpseste-conception` n'a PAS été commité** — sa règle est de n'y commiter que sur
demande explicite, et il mêle du travail non commité de plusieurs séances.

---

## 14. Ce qui a été déposé, et où

| Destinataire | Où | Quoi |
|---|---|---|
| **C4-L10**, pour la Synthèse et le Questionnement | `PLAN_DE_CHANTIER.md` §5 | **items 24 à 31** : aucun canal ajouté (4ᵉ fois) · le 7ᵉ écart *(formatage)* · le 8ᵉ *(`str()` d'un flottant)* · l'épreuve négative qui change de nature · **balaye les SEUILS** · la BOM · ⭐⭐ **vérifie tes slots de `pre_p2` contre `contexteExercice` AVANT d'écrire une ligne** · le bilan qui nomme ce qui est soumis |
| **C4-L7**, la recette du flux | `SUIVI_tests_manuels.md` | `C4L10-15` : **deux** compétences en attente, pas trois · `C4L5-4` **inchangée : quatre fiches sur quatre se taisent** |
| **La conception** | `INVENTAIRE_Non_Tranches.md` | **D4** *(avant le Run 1)* et **D5** *(à la passe)* |
| **Le lot de correctifs** | `SUIVI_tests_manuels.md` | `C4L10C-24` — le bilan d'un dépôt |
| **La recette** | `SUIVI_tests_manuels.md` | **18 cochés avec leur preuve, 7 restes avec leur condition de reprise en toutes lettres** |

⭐ **Le geste que ce lot recommande le plus fort aux deux séances qui restent**, et il coûte deux
minutes : **liste les slots que ton `pre_p2` réclame, et cherche chacun dans `contexteExercice`.** Ce
que la chaîne sert tient en **quatre noms**. La Connaissance a fait tout son portage avant de
découvrir que son premier référent n'existait pas.

---

## 15. Les questions ouvertes que ce lot NE tranche pas

1. **Le corpus de cours** — ce qu'il est, d'où il vient, sa granularité, son canal. *Décision de
   conception ; condition de fermeture à la fiche §8.*
2. **La `source` libre qui gonfle `diversite_sources`** — resserrer le prompt, ajouter un
   `source_canonique`, ou mesurer le bruit. *Le Run 1 dira la fréquence.*
3. **`delta_v1_vf`** — **quatre fiches sur quatre se taisent** ; le mot n'apparaît pas une fois dans
   `competences/connaissance.md`. *Une case du gabarit du `03-` §1 que personne n'a remplie.*
4. **L'effet du contrôle d'existence des citations, et son uniformisation** — `[à valider]` du
   contrat §8, **deux modules sur six, à deux crochets différents**. *Le portage garde le sien où il
   est.*
5. **Où le portage lit la production dans `conformite`** — la lecture retenue *(troisième recours sur
   `ctx.contexteExercice.copie`)* est déclarée au code et au `SUIVI` ; **l'annuler tient en une
   ligne** si Louis préfère la lecture stricte.
6. **Le champ `phrases` que personne ne lit.**
