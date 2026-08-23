# RELEVÉ — C4-L10 · Structure, la troisième compétence dans la chaîne (23/08/2026)

**Commit `45a534e`, sur `main`, poussé** *(donc déployé)*. 11 fichiers, +4 359 / −33, dont **quatre
neufs**. **Aucune migration** — `SUIVI_SQL.md` intact, et aucune n'était attendue.

⛔ **Ce relevé ne se lit pas depuis une autre session Code** : la règle de manifeste l'interdit, et
un relevé ne fait partie d'aucun manifeste. Ce qu'il a à dire aux lots à venir est **à la boîte aux
lettres du `PLAN_DE_CHANTIER.md` §5, entrée C4-L10, items 16 à 23**, et ce qu'il a à dire à la
recette est au `SUIVI_tests_manuels.md`, section *« C4 · L10 — la STRUCTURE »*.

⚠️⚠️ **S'IL NE FALLAIT LIRE QU'UNE CHOSE : la Structure est la seule des six à porter 112 couples
(P1, P2) réellement produits par le banc, et c'est la preuve que les cinq autres n'auront pas.**
Elle n'a ni gold ni vecteur P2 — les vecteurs embarqués prouvent presque rien. Les artefacts de run,
eux, se rejouent des deux côtés pour **zéro appel et zéro centime**, et les trois clés y sont
identiques. ⚠️ **Mais il a fallu les DÉSENVELOPPER** : sans cela le test était **vert et ne prouvait
rien**.

> **Le lot se rejoue tel quel, et il s'est rejoué en un jour pour la troisième fois.** Le socle posé
> par `C4-L10 · Expression` le 22/08 n'a manqué sur aucun de ses huit points ; **aucun canal n'a eu
> à être ajouté** à `BranchementCompetence` — et `prepareCopie`, le seul crochet que la Structure
> ouvre pour de bon, **y était déjà**, posé sans client. Ce lot ne porte que **les trois gestes de
> l'ouverture** sur une seule compétence — et il a trouvé, en les portant, **une source fausse**,
> **deux écarts de langage de plus**, et **deux défauts silencieux mesurés sur le corpus réel**.

---

## 1. Le contrôle d'entrée

Les **six pièces** du manifeste existent. Cinq aux versions attendues, une qui avait bougé :

| Pièce | Attendu au prompt | Constaté | Verdict |
|---|---|---|---|
| `07-Implementation.md` §1 et §2 | **2.34**, RELU ET VALIDÉ | **2.36**, RELU ET VALIDÉ | ⚠️ **la version a bougé → en-tête relu**, comme la règle le demande. Les amendements de la 2.35 et de la 2.36 viennent de **C4-L11** et portent sur les sections **ouvertes**. **Le §2 — la règle de manifeste — n'a pas bougé.** Rien de ce qui a changé ne contredit ce lot ; l'un de ces amendements le SERT *(voir §2)*. |
| `03-competences.md` §1, §2, §9 | **2.1**, VALIDÉ ET GELÉ | **2.1**, VALIDÉ ET GELÉ | ✅ |
| `01-routeur.md` §3, §8.2, §11 | **5.5**, VALIDÉ ET GELÉ | **5.5**, VALIDÉ ET GELÉ | ✅ *(+ le §8.3 que le §8.2 cite, et le §12 que ce prompt ouvre explicitement)* |
| `competences/structure.md` | **3.3**, RELUE ET VALIDÉE | **3.3**, RELUE ET VALIDÉE | ✅ — et c'est bien *relu et validé* qui est exigé, jamais *versé et bancé*. **Elle n'a pas bougé du lot** *(la leçon de l'Argumentation a quand même été appliquée : la recette ne l'épingle nulle part en dur)* |
| `copies-tests/_commun/CONTRAT-MODULES.md` | déposé | validé par Louis item par item, 1er-2 août | ✅ — **et c'est lui qui porte la source fausse** *(§10)* |
| `copies-tests/structure/code.py` | déposé | calcul **v1.1**, `--autotest` **tout passe** *(52 arbitrages réussis, 0 échoué)* | ✅ |

**Les deux constantes de vecteurs, comptées AVEC LEUR TYPE** *(le piège du `len()` sur une chaîne)* :
`TESTS_P2_PARFAIT` est une **liste vide**, `TESTS_CODE1_PARFAIT` une **liste de 1**.
`VERSION_GOLDS_TESTEE = None`, `PARAMS = {}`, `OBSERVABLES = ['niveau', 'cohesion_locale',
'coherence_globale', 'route_globale', 'profil_moyen']`. Le paquet de vecteurs porte ces types et ces
tailles, et le test les assert.

⚠️ **ET LES « NEUF GOLDS » DU DOSSIER `golds/` N'EN SONT PAS.** Ce sont neuf `Gabarit-CopieN.doc` —
des **gabarits Word vides**. La fiche §9 le dit en toutes lettres : *« le fichier qui fait foi est
`gold-structure.md`, celui qui porte un `version_golds` — **il n'existe pas encore** »*. **La
Structure repart au Run 1, golds d'abord.**

⚠️ **Un écart de prémisse, sans conséquence** : le prompt suppose la Structure **deuxième**
compétence branchée. Elle est la **troisième** — l'Argumentation est passée quelques heures plus tôt
le même jour. Rien de ce que le prompt dit n'en dépend, sauf l'échéance de la `cible_primaire`, qui
était déjà tenue.

---

## 2. ⭐ LA PORTE — C4-L11 devait être joué, et il l'est

Le prompt fait de cette vérification une **condition d'entrée bloquante** : *« brancher quand même ne
casse rien de visible, et c'est exactement le problème »*. Vérifié sur pièces, **avant d'écrire une
ligne** :

- `c4_l11_additifs.sql` est **☑ exécuté en sandbox le 23/08**, journal à l'appui ;
- `exercices.cible_primaire` existe, nullable, sous `CHECK` de domaine ;
- l'écran de conception la demande *(`app/prof/conception/nouvelle/Pipeline.tsx`, un `radio`)* et
  l'action l'écrit *(`app/prof/conception/actions.ts`)* ;
- `cibleDuRetour()` la lit **avant** tout repli, dans l'ordre du `07-` §1.1 : décision du routeur →
  `cible_primaire` → alphabet.

⭐ **Et la recette l'a éprouvé en base, sur TROIS instances** : une qui vise la Structure à trois
compétences, une qui la vise à deux, une qui ne vise rien. **Le repli alphabétique aurait dit
« argumentation » dans les trois cas** ; il ne sert que sur la troisième, et **l'alerte tombe**. *Le
piège de l'alphabet ne mord pas.*

---

## 3. Le socle, vérifié point par point

Les **huit points** du prompt, chacun en une commande :

| # | Le point | Constaté |
|---|---|---|
| 1 | Le verrou est aligné | `--resume` rend **les six compétences OUVERTES**, la Structure comprise, avec son compte de 8 observables |
| 2 | `utils/chaine/slots.ts` | présent — tête invariante *(10 634 caractères sur la Structure)*, substitution sous balise, refus des deux sens au chargement |
| 3 | `code2(artefactP2, sortieCode1, ctx)` | la signature est celle-là ; `code1` rend `mesures` + `document_p2` |
| 4 | `conformite` appelé à chaque passage | `chaine.ts` l'appelle d'office, ses alertes rejoignent celles de `code2` |
| 5 | Les crochets pré-phase ont leur canal | `prepareCopie`, `pre` par étage avec `slotsFournis`, `preP2` — ⭐ **et `prepareCopie` est celui que ce lot utilise** |
| 6 | Le canal privé `_audit` | les clés à tiret bas passent, `refusFormeCode2` porte le refus dur sur les trois clés publiques |
| 7 | `utils/chaine/arrondi.ts` | présent — **et il ne sert pas ici** : `grep round(` sur le module ne rend rien, la Structure ne calcule aucune densité |
| 8 | `valeursDesParametres()` | présent, forme en bloc — **et la Structure ne déclare aucun paramètre**, des deux côtés |

**Aucun point ne manquait. Aucun canal n'a eu à être ajouté.** La promesse de l'item 1 de la boîte
aux lettres tient pour la troisième fois.

---

## 4. Ce qui a été construit

| Fichier | Ce que c'est |
|---|---|
| `utils/chaine/branchements/structure.ts` **(neuf, 1 426 l.)** | le portage — `prepareCopie`, `code1`, `code2`, `conformite`, `lettre`, `releve`, et les **huit observables du §5** |
| `utils/chaine/branchements/structure.test.ts` **(neuf, 1 101 l.)** | **32 tests** : la comparaison au module, l'épreuve négative, et les assertions écrites **contre la fiche** |
| `scripts/vecteurs-structure.py` **(neuf, 860 l.)** | le harnais — il **rejoue le module à chaque exécution**, jamais une fixture figée |
| `scripts/recette/structure-c4l10.mjs` **(neuf, 525 l.)** | la recette en base, **par le même code que la route** |
| `utils/chaine/instruments.ts` | **+13 lignes** : l'import, l'entrée d'`INSTRUMENTS`, celle de `BRANCHEMENTS` |
| `utils/chaine/python.ts` | **+149** : les deux écarts de langage trouvés ici, et trois primitives *(§7)* |
| `utils/chaine/instruments.test.ts` | le registre des compétences ouvertes, et les spécificités de la Structure |
| `utils/chaine/derive/*` | **la version du `07-` seulement** — re-dérivés après le passage en 2.37 |

⭐ **Le diff hors `instruments.ts` est quasi nul, et c'est la mesure de réussite du prompt** :
`chaine.ts`, `mesures.ts`, `observables.ts`, `slots.ts`, `arrondi.ts`, `types.ts` — **intacts**.

---

## 5. Le portage — ce qui a été extrait, et ce qui a été durci

**EXTRACTION, PAS RÉGÉNÉRATION.** Le fichier est le portage, fonction pour fonction, de
`copies-tests/structure/code.py`, lui-même l'extraction d'`agregation-structure.py` v1.4 *« où les
arbitrages A1-A10 rendus par Louis le 30 juillet restent encodés tels quels »*. La table
d'extraction du contrat §7 a été suivie à la lettre.

**Ce qui a été porté** : `_n` · `_absent` · `_couture_vide` · `_geste_manque` · `_statut_derive` ·
`_statut` · `_bornes` · `_niveau_couture` · `_relation` · `lire_squelette` · `cohesion_locale` ·
`coherence_globale` · `croisement` · `recette` · `calculer` · `prepare_copie` · `code1` · `code2` ·
`conformite`. Les arbitrages **A1, A2, A4, A5, A6, A7, A8, A9, A10** portent chacun leur commentaire
d'origine et leur mesure — *« composer le statut fait tomber la divergence entre passages de 38,5 %
à 26,9 % »*, *« composer la nature : 84 % d'accord, la divergence tombe de 11,5 % à 5,8 % »*.

**CE QUI A ÉTÉ DURCI, ET POURQUOI.** Le contrat §3 pose que *« le module ne lève jamais d'exception :
elle traverserait le banc et emporterait la trace avec elle »*, et prescrit *« une alerte, pas une
valeur par défaut »*. **Quinze des vingt-sept formes du balayage font pourtant LEVER le module** —
`.get` sur un non-dictionnaire, `for … in` sur un nombre, `len()` sur un entier. Chacune rend ici
**une alerte nommée**, et un verdict sort quand même :

`JOINTURES_ILLISIBLES` · `BLOCS_ILLISIBLES` · `PARTIES_ILLISIBLES` · `PROMESSE_ILLISIBLE` ·
`GESTES_ILLISIBLES` · `ETAPES_ILLISIBLES` · `CRIBLE_ILLISIBLE` · `OBJETS_DISTINCTS_ILLISIBLES`

⚠️ **Chaque durcissement est marqué `⚠️ PORTAGE`, et AUCUN ne se déclenche sur un vecteur du
module.**

⭐⭐ **ET UNE FORME N'EST PAS UN DURCISSEMENT MAIS LA SÉMANTIQUE — la confondre inventerait un
verdict.** `for x in v` sur une **CHAÎNE** rend ses **CARACTÈRES** en Python. Donc
`gestes: "manque"` — qu'un modèle peut très bien écrire au lieu d'une liste — **ne porte AUCUN geste
« manque »** : Python y voit `m`, `a`, `n`, `q`, `u`, `e`. Un portage qui la lirait comme un geste
unique **fabriquerait une motivation**, ferait passer la couture de `plaquée` à `motivée`, et
monterait la copie d'un cran. *Un test le fixe, et la mutation correspondante tombe.*

---

## 6. La seconde moitié — les huit observables du §5

**Les deux listes n'ont pas un élément commun.** Le module rend `niveau`, `cohesion_locale`,
`coherence_globale`, `route_globale`, `profil_moyen` — ce que le banc compare aux golds. Le §5 de la
fiche en déclare **huit autres**, et le `CONTRAT-MODULES.md` §8 le constate : *« 0 sur 8 en
Structure »*. **Porter le module est la moitié du travail.**

| Observable | Famille | Ce qu'il a fallu calculer |
|---|---|---|
| `jointure_presente` | proportion | **les coutures HORS SEUILS** dont le statut n'est pas `absente` — et le périmètre est celui d'APRÈS le garde-fou de réintégration |
| `charniere_motivee` | proportion | les charnières `motivée` **APRÈS CRIBLE**, jamais avant |
| `charniere_formule` | comptage rapporté | les charnières que le crible a **RÉELLEMENT rétrogradées** — une rétrogradation non appariée est consignée et ignorée, donc elle ne compte pas ici non plus |
| `bloc_relie` | proportion | les relations nommées **du tissu** — ⚠️ voir §11 |
| `promesse_presente` | binaire | `a_probleme` **OU** `a_annonce` — ⭐ c'est là que le « et/ou » devient visible |
| `plan_tenu` | binaire, `sans_objet_si: n/a` | la clause d'ordre, **`n/a` quand elle ne s'applique pas** — et jamais `null` |
| `bloc_unite` | proportion | les blocs **de DÉVELOPPEMENT** à idée directrice — les blocs de service en sont exclus |
| `derive` | comptage rapporté | les blocs de développement `hors annonce` **+ le doublon + le retour en arrière**, chacun pesant au plus 1 : c'est la seule lecture que la sortie déclarée de P2 permet |

**LES DEUX DÉNOMINATEURS SONT DES PHRASES**, et le relevé les porte sous leur nom exact —
`les charnières du squelette` et `les blocs de développement`. `observables.ts` cherche l'entrée
**sous ce nom** ; il en manque une, et l'observable sort en `n/a` **sans un mot**.

⭐ **Trois demandaient un calcul propre, pas une lecture** : `jointure_presente` *(le périmètre
post-garde-fou)*, `charniere_formule` *(les rétrogradations effectivement appariées, que seule
`cohesion_locale` connaît)* et `derive` *(qui croise le squelette et deux booléens de P2)*.

⭐⭐ **ET UN `PASSAGE MANQUÉ` NE LES FAIT PAS TAIRE.** Quand P2 ne rend pas ses deux jugements
obligatoires, aucun verdict ne sort — c'est la règle. Mais **sept des huit observables n'en dépendent
pas**, et ils se rendent quand même ; **seul `derive` dit son alerte nommée**. *Les perdre serait
perdre sept signaux d'escalade sur une copie que la chaîne a pourtant lue.* Le cas n'est pas
théorique : **65 des 112 couples réels y tombent.**

---

## 7. ⭐⭐ LA TROUVAILLE — les blancs, et le `\w` unicode

L'Argumentation avait trouvé quatre écarts de langage *(`repr`, `str` d'un conteneur, `casefold`, le
`\b` unicode)*. **En voici deux de plus, et ils ont la même signature : aucun vecteur ne les voit,
une copie réelle les rencontre.**

### (a) LES BLANCS DE PYTHON NE SONT PAS CEUX DE JAVASCRIPT

**Vérifié caractère par caractère sur U+0000-U+3000** *(et `str.isspace()` ≡ `\s` de `re`)* :

| | Python | JavaScript |
|---|---|---|
| `\x1c`-`\x1f` *(séparateurs de fichier, groupe, enregistrement, unité)* | **blanc** | pas blanc |
| `\x85` *(NEL)* | **blanc** | pas blanc |
| `﻿` *(la BOM)* | pas blanc | **blanc** |

**Où ça mord, et ça mord partout** : `_n()` fait un `.strip()` **de Python** sur **toutes** les
valeurs d'énumération du squelette — statut, relation nommée, rôle, forme du problème,
correspondance à l'annonce —, et `prepare_copie` découpe sur `\n\s*\n+`.

⚠️ **Ce que ça coûte, mesuré par les vecteurs discriminants** :

- une ligne « vide » faite d'un `\x85` est **une frontière de bloc** pour Python et pas pour
  JavaScript → **une couture de plus ou de moins** ;
- `« étape 1 »` et `« étape\x1f1 »` sont **la même étape** pour Python — `\s+` les réduit toutes deux
  à une espace — donc du **TISSU**, et deux étapes différentes pour JavaScript, donc une
  **CHARNIÈRE**. *La couture change de population, et avec elle deux observables du §5.*
- un `\x1f` au bord d'un statut « motivée » le rend **reconnaissable** pour Python : la cohésion est
  satisfaite, la copie est **Bon**. Un `trim()` y verrait une valeur hors catalogue et composerait.
- et **dans l'autre sens** : la BOM au bord de « question » ne se strip PAS pour Python — le problème
  n'est **pas** posé, et un `trim()` dirait l'inverse.

### (b) LE `\w` DE PYTHON EST UNICODE — et celui-là coûte plus cher encore

Le contrôle de recette de la Structure cherche un décompte par
`(?<![\w/.,-])\d{1,3}(?![\w/,-])`. **Vérifié en Python** :

> `« la 3ème partie »` → **AUCUN nombre.** `« café3 »` → **AUCUN nombre.**

Le `è` et le `é` sont des caractères de mot pour Python, et ferment l'anti-regard. Pour JavaScript,
non. **Porté naïvement, le contrôle aurait accusé le juge d'avoir compté à chaque copie qui écrit
« 3ème »** — la chose la plus ordinaire qu'un juge puisse écrire en français.

### Ce que `utils/chaine/python.ts` porte désormais

`CAR_BLANC_PYTHON` · `CAR_MOT_PYTHON` *(⚠️ **corrigé** : c'est `\p{L}\p{N}_`, et **non** `\p{Pc}` —
vérifié, `‿` n'est PAS un caractère de mot en Python)* · `CAR_CHIFFRE_PYTHON` *(`\d` est unicode
aussi)* · `strip` · `remplaceBlancs` · `trie` *(l'ordre des points de code)*.

⭐ **Plus trois primitives de sémantique** : `estVrai` *(`[]` et `{}` sont **FAUX** en Python, VRAIS
en JavaScript — un `v or []` porté naïvement change de chemin)*, `itere` *(voir §5)*, et
`longueur` — ⚠️ **le cas qui décide** : `etapes_annoncees` rendu en **CHAÎNE** a une `len()` de 16,
donc « il y a des étapes », donc **la clause d'ordre du §4 s'applique**. Un
`Array.isArray(v) ? v.length : 0` y rendrait 0 et sauterait la clause — **un autre verdict, sans un
symptôme.**

*Écrit une fois, pour les six.*

---

## 8. Les preuves

### (a) ⭐⭐ LA CONTRE-ÉPREUVE — 112 couples (P1, P2) réellement produits par le banc

`TESTS_P2_PARFAIT` est **vide**, `TESTS_CODE1_PARFAIT` porte **UN** vecteur, il n'y a **aucun gold**.
Les vecteurs embarqués ne prouvent presque rien. Mais `copies-tests/structure/resultats/` porte
**112 couples réels** :

| Origine | Couples | Ce qu'ils portent de particulier |
|---|---|---|
| `CopieN-passM-*.json`, 17/07 | **15** | squelettes **d'AVANT la v1.4** : ils déclarent `statut`, un `niveau` hors catalogue *(« entre-parties »)*, et rangent les blocs **DANS `parties[]`, en dictionnaires** |
| `run-20260730-155319/`, 30/07 | **27** | schéma v1.4 : ni `statut` ni `niveau`, le code compose les deux |
| `nested-*/` ×3, bancs 5×5 | **70** | 5 P1 × 5 P2 par copie — **c'est là que la variance de P2 se voit** |

**Les deux côtés les rejouent sur les mêmes entrées, et LES TROIS CLÉS sont identiques** —
`verdicts`, `trace` **mot pour mot**, `alertes`. **Zéro appel, zéro centime.**

⚠️⚠️ **ET IL A FALLU LES DÉSENVELOPPER — sans quoi la contre-épreuve était verte et ne prouvait
rien.** Les `-p2.json` du 30/07 **ne portent pas la sortie de P2** : ils portent une **enveloppe de
run**, `{"jugements_modele": …, "calcul_code": …}`. Passée telle quelle, elle n'a ni `doublon` ni
`retour_en_arriere` → **les 97 couples tombaient TOUS en `PASSAGE MANQUÉ`** → le test passait, et il
ne prouvait qu'une chose : que les deux côtés savent refuser une sortie tronquée. **Regarder les CLÉS
d'un artefact avant de le croire.**

⛔ **`calcul_code` n'est PAS comparé**, et c'est délibéré : c'est la sortie d'un **ancêtre** du module
*(30/07)*, qui a bougé depuis. *« Des vecteurs qui pourrissent en silence valideraient le calcul
contre une référence morte »* — contrat §5.

### (b) LE BALAYAGE — 1 289 cas, dans la même fonction du même module

`balayage_cohesion` **400** · `balayage_coherence` **336** · `balayage_statut` **210** ·
`balayage_nature` **96** · `balayage_paliers` **96** · `balayage_recette` **76** ·
`balayage_formes` **27** · `balayage_blancs` **23** · `balayage_champs_blancs` **17** ·
`conformite_cas` **8**.

⭐ **Deux balayages ont été refaits pour passer PAR LES CROCHETS.** Ils appelaient d'abord
`croisement()` et `recette()` **directement** : ils prouvaient l'accord de deux fonctions, pas celui
de deux chaînes. *« Ce qui se compare au module se compare par les crochets, comme le banc le fait. »*
Les seize cellules du croisement sont désormais atteintes **par des squelettes**, et le test vérifie
qu'elles le sont toutes — sans quoi le contrôle ne contrôlerait rien.

### (c) ⭐⭐ L'ÉPREUVE NÉGATIVE — 29 mutations, 5 survivantes, puis 0

Le portage a été cassé **règle par règle**, et le contrôle regardé. **Au premier passage, cinq ont
survécu — et TROIS des cinq étaient dans la TÉLÉMÉTRIE**, exactement comme la boîte aux lettres
l'annonçait *(item 11)*.

**La parade qu'elle prescrit a marché mot pour mot** — des comptes **asymétriques**, et **au moins un
élément écarté du décompte qui porte quand même la propriété mesurée** :

| Survivante | Ce qui l'a fermée |
|---|---|
| `bloc_relie` rapporté aux seules relations lisibles | **une couture de tissu à relation ILLISIBLE** |
| `derive` compté sur tous les blocs | **un bloc de SERVICE déclaré « hors annonce »** |
| `promesse_presente` réparé en « ET » | **les cas où UN SEUL terme du « et/ou » est présent** |
| le garde-fou Absent ouvert par toute forme | **deux formes HORS catalogue** *(voir ci-dessous)* |
| `_n()` avec le `trim()` de JavaScript | **17 valeurs d'énumération bordées de blancs** |

⚠️ **UN PIÈGE D'ATTEIGNABILITÉ, ET IL EST RETORS.** Le garde-fou Absent ne s'interroge **que si la
copie atteint Absent** — or **toute forme du catalogue** rend `a_probleme` vrai, ce qui empêche la
cohérence de tomber en défaillance forte, ce qui empêche Absent. **La lecture stricte était donc
structurellement INÉPROUVABLE**, et la mutation survivait sans rien casser. Il a fallu des formes
**hors catalogue**, celles qu'un modèle écrit vraiment : `« question posée »` **l'ouvre**
*(`startswith("question")`)*, `« tension »` **ne l'ouvre pas**. ⭐ **Toujours vérifier que la règle
qu'on éprouve est ATTEIGNABLE par la chaîne** ; sinon, on contrôle un chemin mort.

**Au second passage — et re-joué une troisième fois sur le fichier exactement tel qu'il est
commité — les 29 tombent.** *Le fichier est restauré à l'identique après chaque mutation, vérifié
par `diff`.*

### (d) Les portes automatiques

`npm test` **1116 / 1116** *(dont 32 neufs)* · `npx tsc --noEmit` **rien** · `npx eslint`
**0 erreur** *(2 avertissements sur des paramètres de contrat volontairement non lus, chacun
commenté — les mêmes que sur l'Argumentation)* · `derive-instruments.py --verifie` **IDENTIQUE** sur
les dix dérivés · `--resume` **ouverte, v3.3, 8 observables** · `verifierCoherence()` **[]**.

### (e) La recette en base — 60 contrôles, 60 passés

Sept vrais appels, sur un dépôt réel à **TROIS compétences** : **trois squelettes**, **trois
mesures**, la lettre **« C »**, les **huit observables écrits et aucun en `n/a`**, `delta_v1_vf`
**NULL**, une ligne d'`api_couts` **par appel** *(`p1, p1, p1, p2, p2, p2, retour`)* et **aucune**
pour `code1`/`code2`. **Reprise** : aucune seconde mesure, aucun second squelette. **Décor retiré**,
`chaine_actif` **revenu à OFF**, **aucun statut de recette posé**.

⭐ **Deux constats que seule la Structure peut faire** : **P1 a rendu exactement autant de blocs que
la copie en portait de paragraphes** *(5 pour 5 — « le découpage t'est donné, tu n'en fusionnes
aucun »)*, et **il n'a qualifié aucune jointure** — ni `statut`, ni `niveau`, exactement comme la
fiche §3 le pose.

⭐ **La latence à TROIS compétences : 55 s**, contre **47-52 s à deux** et **39 s à une**, pour un
contrat de moins de trois minutes. **La courbe est plate** : de deux à trois coûte **~4 s**, quand
d'une à deux en coûtait ~13. *Le retour est l'appel commun, et les chaînes froides tournent bien en
parallèle.* ⚠️ **À six, l'extrapolation reste à faire.**

---

## 9. ⭐⭐ CE QUE PORTER RETIRE — le « et/ou » que le modèle réparait, mesuré

Le prompt l'annonçait comme *« le premier écart à chercher, et il est déjà nommé »*. Il est
confirmé, et **chiffré sur le corpus réel**.

La route de la promesse s'ouvre, au P2, sur *« problème **et/ou** plan annoncés »* — ce qui la rendait
formellement ouverte sur **103 des 118 cellules**, et **aucune des cent cellules du banc ne l'a
prise** : les deux modèles la lisaient comme exigeant un plan, et **réparaient le « et/ou » sans le
dire**.

**Le code applique le texte.** Sur les 112 couples réels :

| Problème posé, plan annoncé | Couples |
|---|---|
| ni l'un ni l'autre | 14 |
| **un problème SEUL** | **60** |
| **un plan SEUL** | **9** |
| les deux | 29 |

⭐ **69 couples sur 112 ne portent qu'UN SEUL des deux termes** — et sur ceux-là, le code ouvre la
route là où un « et » la fermerait.

⚠️ **Et la route ouverte est PLUS FACILE** : sa clause *« étapes réalisées dans l'ordre »* devient
**vide** sans annonce. Sur une copie faible, cela donne `défaillance` au lieu de `défaillance
forte` — **la coupure D/C du routeur, et elle tient à un « ou »**. Quatre assertions écrites contre
la fiche le fixent, dans les deux sens.

*L'écart est nommé, mesuré, et il ne se corrige pas : la fiche fait foi.*

---

## 10. ⚠️ LA SOURCE FAUSSE — le contrat dit « personne encore »

`copies-tests/_commun/CONTRAT-MODULES.md` **§2**, table des six crochets, **ligne 1** :

> `prepare_copie(texte, params)` … *« **personne encore** — prévu pour Structure **si** un texte
> normalisé est acté (les lignes vides sont des frontières de blocs) »*

**La Structure LE DÉFINIT, et il est acté depuis le run 1** *(décision D9)*.
`copies-tests/structure/code.py` porte `prepare_copie`, copié de `numerote()` de
`banc-structure.py`, et il découpe sur les lignes vides pour rendre la copie **renumérotée `[¶1]`,
`[¶2]`…**.

⚠️ **Ce n'est pas une nuance de rédaction** : c'est **le SEUL des six crochets dont la sortie change
ce que le MODÈLE LIT**, et la table du contrat est précisément l'endroit où un portage va chercher
qui l'utilise. *Son autotest porte d'ailleurs un vecteur discriminant écrit exprès (RM4) — « un
retour DUR à l'intérieur d'un paragraphe crée un bloc de plus, donc une couture qui n'existe pas sur
la page ».*

**`[faux]` posé dans la cellule** ; correction écrite au registre des ouverts, **dette D3**.

⚠️ **Au passage, dans le même document** : le **§8** écrit que les deux listes d'observables
*« comptent **55** et 24 »* — la dérivation en compte **56**, et le `03-competences.md` §9 porte la
même erreur. *Déjà relevée au `PLAN_DE_CHANTIER.md` §5 ; consignée à la dette pour que la passe de
réconciliation la trouve aux deux endroits.*

---

## 11. ⚠️⚠️ UN OBSERVABLE À DEUX POPULATIONS DANS LA MÊME FICHE

Le prompt disait, au piège 11 bis : *« ⭐ Ton cas : tes QUATRE `proportion` sont nommées, exclusion
comprise. **Vérifie-le et passe** : tu n'as rien à arbitrer ici. »* **Vérifié — et il y a une
ride.**

`bloc_relie` est nommé **deux fois, et pas pareil** :

| Où | Ce qui est écrit | La population |
|---|---|---|
| **§5**, la table | *« proportion **du tissu** dont la relation est nommée »* | **le tissu ENTIER** |
| **bloc machine**, champ `sens` | *« la majorité des relations du tissu sont nommées — **la majorité qui module au §4, point 4** »* | et le §4-4 compare `oui > non`, **excluant** toute couture dont la relation est illisible |

**Les deux lectures ne divergent que sur un cas** : une `relation_nommee` qui n'est ni « oui… » ni
« non… ». 2 oui / 1 non / 2 illisibles **module vers le HAUT** au §4 et rend **0,4** au §5 — donc
**raté** au seuil de 0,5.

⚠️⚠️ **ET LE CAS N'EST PAS THÉORIQUE : il apparaît 68 fois sur les 112 couples réels** *(le champ
absent, sur les squelettes d'avant la v1.4)*.

⭐ **Le portage a suivi LA TABLE DU §5**, parce qu'elle nomme sa population en toutes lettres et
qu'**une session Code ne corrige pas une source**. La lecture est commentée dans le branchement,
**fixée par un test discriminant** — le squelette asymétrique porte exprès une couture de tissu à
relation illisible —, et **relevée**. *Si l'arbitrage tombe dans l'autre sens, c'est **une ligne à
changer**, pas une refonte.*

⛔ **Ce n'est PAS le cas de l'Argumentation** *(item 48)*, où la population n'était **pas nommée du
tout**. Ici elle l'est — la question est que **deux phrases de la même fiche en nomment deux
différentes**. → **registre des ouverts, item 50.**

---

## 12. ⚠️ QUATRE VALEURS ILLISIBLES QUI NE LÈVENT AUCUNE ALERTE

Le contrat §7 impose un **« contrôle gratuit à faire pendant l'extraction »** : lister ce que le
modèle réparait sans le dire, et vérifier que chaque cas devient **une alerte, pas un trou**. Fait —
et **mesuré**, plutôt que raisonné.

**Le module tient la règle sur onze motifs**, tous réellement rencontrés sur le corpus :

`PASSAGE MANQUÉ` (65) · `RECETTE` (27) · `CONFORMITE` (27) · `CRIBLE_NON_APPARIE` (26) ·
`GARDE_FOU_REINTEGRATION_SEUILS` (21) · `SQUELETTE_INCOHERENT` (15) · `PROMESSE_INCOHERENTE` (14) ·
`NIVEAU_HORS_CATALOGUE` (12) · `COPIE_SANS_COUTURE` (3) · `OBJETS_DISTINCTS_HORS_PERIMETRE` (3) ·
`TROU_DECLARE_ACQUIS` (1)

⭐ **Le portage n'a eu à en créer aucune** — c'est le bénéfice de l'extraction, pour la troisième
fois.

⚠️ **Mais quatre cas y échappent, et seul le comptage les a montrés** :

| Le cas | Ce qu'il fait en silence | Sur le corpus |
|---|---|---|
| `relation_nommee` illisible | sort des **DEUX** comptes `oui` et `non` | **68 / 112** |
| `entre` dont on ne peut lire deux numéros | la couture devient **du tissu par défaut**, et **aucune charnière ne peut plus s'en composer** *(« bloc Alain → bloc neurosciences »)* | **11 / 112** |
| `statut` hors catalogue | retombe sur la composition | 0 ici |
| `role` hors catalogue | compté comme **du développement** | 0 ici |

⭐ **Les trois derniers replis sont DÉFENDABLES** — le fait fait foi, c'est la règle A8. **C'est leur
SILENCE qui est le défaut**, pas leur valeur.

⛔ **Le portage ne les a PAS ajoutées** : une alerte de plus ferait diverger le branchement du module
sur la **troisième clé**, et le « fait quand » exige l'identité. **La correction appartient au
module, donc au chantier de conception.** ⚠️ **Ce n'est pas un `[faux]`** : le contrat dit vrai,
c'est le module qui ne le tient pas partout. → **registre des ouverts, item 51.**

---

## 13. ⭐ L'OBSTACLE ANNONCÉ N'EN ÉTAIT PAS UN

La boîte aux lettres annonçait, depuis le tour de l'Expression, **trois obstacles** pour les
compétences restantes — dont *« la **Structure** et son `prepare_copie` face au correctif CRLF de
C4-L4 »*. **Vérifié sur pièce : les deux ne se contredisent ni ne se doublent.**

- `normaliserRetours()` ramène `\r\n?` à `\n` **et ne nettoie rien d'autre** *(« ni la ponctuation,
  ni les espaces, ni les lignes vides, ni les fautes »)* ; il tourne à **l'ÉCRITURE** du dépôt ;
- `prepare_copie` découpe et renumérote à la **LECTURE**.

**Le premier garantit au second que ses `\n` sont des `\n`.**

⭐ **Et le crochet tient même sur du CRLF brut** — son `\n\s*\n+` avale le `\r`, qui est un blanc des
deux côtés. *C'est précisément ce qui rendait le défaut de C4-L4 invisible de ce côté-ci : ce n'est
jamais `prepare_copie` qui planchait, c'est `blocs()`.*

⚠️ **UNE SEULE NUANCE, RELEVÉE ET NON ARBITRÉE** : `blocs()` — **ce que l'écran compte pour
l'élève** — coupe sur `\n[ \t]*\n+`, le module sur `\n\s*\n+`. **Une ligne « vide » faite d'une
espace insécable est UNE frontière pour la mesure et AUCUNE pour l'écran.** Le compteur de blocs que
l'élève voit et celui que la Structure lit divergeraient d'un. *Un test le fixe dans les deux sens ;
la question est au `SUIVI_tests_manuels.md`.*

**Deux obstacles restent, et les deux appartiennent au chantier de CONCEPTION** : la **Synthèse**
dont `code1` ne rend pas `document_p2`, la **Connaissance** dont `pre_p1` prend le TEXTE.

---

## 14. Ce qui a été déposé, et où

| Où | Quoi |
|---|---|
| `PLAN_DE_CHANTIER.md` §5, **boîte aux lettres C4-L10** | **items 16 à 23** — les canaux qui n'ont pas eu à bouger, le cinquième et le sixième écart de langage, la sémantique qu'il ne faut PAS durcir, les artefacts de run **et leur enveloppe**, l'épreuve négative et son piège d'atteignabilité, l'observable à deux populations, la méthode du contrôle gratuit, la fiche qui compte sur ce qu'elle ne définit pas. **+ le bilan du troisième portage** *(latence, cible, retour, obstacle levé, nuance `blocs()`)* |
| `SUIVI_tests_manuels.md` | section **« C4 · L10 — la STRUCTURE »** : **16 entrées cochées** avec leur preuve, **4 levées ailleurs**, **6 restes** avec leur condition de reprise nommée |
| `INVENTAIRE_Non_Tranches.md` | **items 50 et 51** *(neufs)*, **item 47 amendé** *(le `delta` : trois fiches sur trois)*, **dette D3** *(neuve)*, comptes à jour |
| `copies-tests/_commun/CONTRAT-MODULES.md` §2 | **`[faux]`** dans la cellule du crochet 1 |
| `07-Implementation.md` §2 | l'inventaire de C4-L10 porte **l'état au 23/08** ; le document passe en **2.37** *(inventaire du §2 seul — section ouverte à l'implémentation)* |

⛔ **AUCUN STATUT DE RECETTE N'A ÉTÉ POSÉ, et aucun n'est proposé.** La Structure est
`mesuree_silencieusement` — son état de naissance. **Rien n'a changé pour un élève.**

⚠️ **Aucune migration.** `SUIVI_SQL.md` **intact**, et aucune n'était attendue *(piège 4)*.

---

## 15. Les questions ouvertes que ce lot NE tranche pas

1. **La population de `bloc_relie`** — le §5 et le §4 n'en nomment pas la même, **68 cas réels
   concernés**. Le portage a suivi le §5 et fixé la lecture par un test. *Registre, item 50.*
2. **Les quatre valeurs illisibles sans alerte** — décision de **module**, à prendre **avant le
   Run 1** de la Structure. *Registre, item 51.*
3. **Le `delta_v1_vf`** — trois fiches sur trois se taisent, **et la Structure compte dessus** : son
   §8 fait des *« deltas v1→vf »* l'arbitre empirique de sa seule vraie question ouverte, la
   pondération cohérence/cohésion. *Registre, item 47, amendé deux fois.*
4. **Le contrôle d'existence des citations n'existe pas sur la Structure**, dont le P1 rend **quatre
   champs de verbatim**. ⭐ *Le module reçoit pourtant la copie — `code1` la lit sous
   `contexte["copie"]` — **et ne s'en sert jamais** : le canal est là, le client n'y est pas.*
   `[à valider]` du contrat §8.
5. **Le pari du §8 est actif et se voit** : *« une copie saisie sans retour à la ligne est lue comme
   dépourvue d'architecture »* — 3 `COPIE_SANS_COUTURE` et 21 réintégrations de seuils sur le
   corpus. **Sa condition de fermeture est une contrainte D'INTERFACE, pas de mesure.**
6. **P1 a sous-déclaré ses parties marquées** sur le dépôt réel — la copie ouvre deux paragraphes par
   « D'abord » et « Dans un second temps », que le prompt nomme explicitement comme marqueurs, et
   `parties` est revenu **vide**. ⭐ **La charnière est née quand même, par la troisième branche de
   la cascade A10** *(deux étapes annoncées différentes)* : **les deux routes ne sont donc pas
   redondantes**, et sur cette copie **seule la seconde a servi**. *Une copie sans annonce de plan
   n'aurait eu ni l'une ni l'autre.* **Condition de reprise : le Run 1.**
7. **La pondération cohérence/cohésion** reste la vraie question ouverte de la fiche — et **elle
   n'est pas un paramètre** : `PARAMS` est vide des deux côtés. *« Le jour où elle se tranche, elle
   entre au bloc machine en paramètre. »*

---

## 16. Ce qui reste, après ce lot

**Trois compétences ouvertes** au moment du commit — `expression`, `argumentation`, `structure` —,
**trois en attente** : `connaissance`, `synthese`, `questionnement`. **C4-L10 se rejoue tel quel pour
chacune**, et la boîte aux lettres porte **vingt-trois items** pour elles.

⚠️ **Le smoke prof et élève reste à jouer** — rien n'a été vu dans un navigateur : tout ce qui
précède est prouvé **par requête et sur pièce**, jamais à l'œil. *Le même reste que C4L10-13 et
C4L10A-13 : il s'accumule, et il se jouera d'un coup.*
