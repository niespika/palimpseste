# RELEVÉ — C4-L10 · Questionnement, la cinquième compétence dans la chaîne (23/08/2026)

**Prompt de séance** : `PROMPT_Code_C4_L10-Questionnement.md`.
**Sortie** : `main` = **`3561f19`** *(merge de `feat/c4-l10-questionnement`, `cce65b5`)*, **poussé**.
**Aucune migration, aucun SQL, aucun statut de recette posé.** `chaine_actif` rendu à OFF.

**En une ligne** : le Questionnement est dérivé, importé et branché ; **il mesure en `composer` et se
tait dans les quatre modes réceptifs**, faute que la chaîne descende la référence décomposée ; et le
portage a trouvé qu'**un observable requis de l'escalade sortait `ratee` à chaque mesure, sans un
symptôme** — corrigé une fois pour les six.

---

## 1. Le contrôle d'entrée

Les six pièces du manifeste existent. **Une version a bougé, et elle avertit sans bloquer** :

| Pièce | Attendu au prompt | Trouvé | Statut |
|---|---|---|---|
| `07-Implementation.md` §1 et §2 | VERSION **2.34** | **2.38** | RELU ET VALIDÉ ✅ |
| `03-competences.md` §1, §2, §9 | 2.1 | **2.1** | VALIDÉ ET GELÉ ✅ |
| `01-routeur.md` §3, §8.2, §11 | 5.5 | **5.5** | VALIDÉ ET GELÉ ✅ |
| `competences/questionnement.md` | 2.2 | **2.2** | RELUE ET VALIDÉE ✅ |
| `copies-tests/_commun/CONTRAT-MODULES.md` | déposé | pas de ligne VERSION | validé item par item ✅ |
| `copies-tests/questionnement/code.py` | déposé | calcul **v1.2** | ✅ |

⭐ **L'écart du `07-` n'est pas un défaut : il est l'histoire du lot.** 2.35 → 2.38 sont les
amendements de C4-L11 puis des trois portages précédents, **à l'inventaire des lots du §2 et au §1
seuls** — les sections ouvertes à l'implémentation. Le §2 *(règle de manifeste)*, le §3, le §4 et le
§6 n'ont pas bougé. En-tête relu avant de continuer, comme le contrôle d'entrée l'ordonne.

⚠️ **Le statut requis de la fiche est *relu et validé*, pas *versé et bancé*** — et il l'est. La
séance Expression avait inscrit ce seuil dans le code ; le vérifier était le premier point du socle.

---

## 2. ⭐ LA PORTE — C4-L11 devait être joué, et il l'est

La `cible_primaire` se déclare à l'écran de conception *(`app/prof/conception/nouvelle/Pipeline.tsx`,
`actions.ts`)*, descend jusqu'au contexte *(`utils/chaine/contexte.ts`)*, et **`cibleDuRetour` la lit
avant tout défaut** *(`utils/chaine/chaine.ts:364`)*. Commit `fb3ee68`, mergé par `80a31c4`.

⭐ **Vérifié en base, et pas seulement en lecture** : sur trois instances de recette, la
`cible_primaire` **bat l'ordre alphabétique** — le repli aurait dit « expression » dans les trois
cas —, et l'instance **sans cible** fait tomber l'alerte de repli. **Cinquième confirmation.**

---

## 3. Le socle, vérifié point par point

Les huit points de la séance Expression, tous présents, aucun refait :

| # | Point | Contrôle |
|---|---|---|
| 1 | Le verrou aligné sur *relu et validé* | `--resume` rend **les six** ouvertes ✅ |
| 2 | `utils/chaine/slots.ts` — tête invariante, substitution sous balise, refus des deux sens | présent ✅ |
| 3 | `code2(artefactP2, sortieCode1, ctx)` ; `code1` rend `mesures` + `document_p2` | présent ✅ |
| 4 | `conformite` déclaré et appelé à chaque passage | présent ✅ |
| 5 | Crochets pré-phase avec `slotsFournis` déclarés ; un slot `null` arrête en le nommant | présent ✅ |
| 6 | Canal privé `_audit` ; `refusFormeCode2` ; **`injection_p2` non construit** | présent ✅ |
| 7 | `utils/chaine/arrondi.ts` | présent ✅ *(et **inutile ici** — voir §8)* |
| 8 | `valeursDesParametres()` — un seul domicile, la forme dérivée est un BLOC | présent ✅ |

⭐ **La boîte aux lettres de C4-L10 a été vidée avant d'écrire une ligne** : 31 items, dont le **30**
qui commandait le premier geste — *« liste les slots que ton `pre_p2` réclame, et cherche chacun dans
`contexteExercice` »*, avec sa mention nominative : *« La Synthèse et le Questionnement : vérifiez
vos référents avant tout le reste. »* **C'est ce geste qui a trouvé le fait central du lot** *(§11)*.

---

## 4. Ce qui a été construit

| Fichier | Lignes | Ce qu'il porte |
|---|---|---|
| `utils/chaine/branchements/questionnement.ts` | 980 | le portage : `preP2`, `code1`, `_crible`, `code2`, la télémétrie, `conformite` |
| `utils/chaine/branchements/questionnement.test.ts` | 937 | 38 tests — la confrontation au module, l'épreuve négative, les contrôles de socle |
| `scripts/vecteurs-questionnement.py` | 668 | le harnais : importe le module **à chaque exécution**, joue ses crochets, rend entrées et sorties |
| `scripts/recette/questionnement-c4l10.mjs` | 541 | la recette réelle, en base, par le même code que la route |

**Modifié hors de là — et c'est tout** : `instruments.ts` *(2 imports, 2 entrées de registre, 1
type élargi — 39 lignes)*, `instruments.test.ts` *(l'inventaire : quatre ouvertes → cinq — 21
lignes)*, `observables.ts` *(le correctif du §7 — 17 lignes)*, et les deux dérivés `MANIFESTE.ts` /
`calame-retour.ts` *(4 lignes chacun : la version du `07-`, après un `--ecris` conventionnel)*.

⭐ **« Ta réussite se mesure à un diff quasi nul hors d'`instruments.ts` » : 17 lignes, et elles
ferment un trou.**

---

## 5. Le portage — ce qui a été extrait, et ce qui a été durci

**La table d'extraction, suivie à la lettre** :

```
preP2       ← pre_p2      (le référent : sa nature, et son texte)
code1       ← code1       (les champs du relevé, le pré-verdict, la BORNE HAUTE des `limite`)
code2       ← _crible + code2
conformite  ← conformite
```

⛔ **Aucun `pre_p1`, aucun `prepare_copie`** : le module n'en définit pas, et **les deux slots de P1
sont NATIFS** — `{copie}` et `{sujet}`. C'est **le cas le plus simple des six** : `slotsFournis` est
vide à P1. P2 en porte trois, dont **`SLOT_DOCUMENT_P2 = "squelette_phase_1"` DÉCLARÉ par le
module** — obligatoire à plus d'un slot —, et **le document n'est pas le référent**.

**Ce qui a été durci, et pourquoi.** Le contrat §3 interdit au module de lever ; `_crible`, `code2`
et `conformite` ne s'en protègent pas. Chaque point de levée devient une **alerte nommée**, marqué
`⚠️ PORTAGE` en commentaire, **et aucun ne se déclenche sur un vecteur** : un `deplacement` qui est
un nombre, un `crible` qui est un nombre, une prose qui est un nombre, un P1 ou un P2 qui n'est pas
un objet.

⛔ **Ce qui n'a PAS été durci, et surtout pas** : `for x in v` sur une **chaîne** rend ses
**caractères** en Python. Un `crible` rendu en texte par le juge ne porte donc **aucune**
requalification — il en porte autant d'illisibles que de caractères. Un portage qui l'aurait lu comme
une entrée unique **aurait fabriqué une requalification**. `itere()` le porte, et un test l'assère :
`"valide"` rend **six** entrées illisibles, pas une.

⚠️ **Un durcissement a été RETIRÉ après que le balayage l'eut trouvé.** `pre_p2` faisait
`texteStrippe(question_directrice)` et rendait `null` sur une valeur non textuelle ; **le module, lui,
ne strippe que si c'est une chaîne, puis fait `probleme or None`** — une question directrice rendue en
liste **traverse**. Rendre `null` aurait arrêté une mesure que le module laisse passer. Corrigé : la
valeur passe, et `str()` de Python la met en texte à l'injection du slot — `['q']`, jamais `q`.

---

## 6. La seconde moitié — les neuf observables du §5

**Le module n'en calcule aucun.** Ses quatre `OBSERVABLES` sont ce que le banc compare aux golds ; le
`03-` §1, gelé, dit qui applique les autres : *« pas le module, la chaîne froide »*.

| Observable | Famille | Où il se lit |
|---|---|---|
| `question_presente` | binaire, **`valeur_reussie` EN LISTE** | `mesures.forme_question` |
| `question_propre` | binaire | le jugement P2 — `code2` le lit mais ne le rend pas |
| `notions_en_tension` | binaire | `mesures`, valeur **RÉSOLUE** par la borne haute |
| `question_specifique` | binaire, `sans_objet_si: n/a` | ⭐ **recopié du verdict de `code2`** |
| `enjeu` | binaire | `mesures`, résolue |
| `debat_situe` | binaire | `mesures.reponses_concurrentes` — **seul renommage de la fiche** |
| `recadrage` | binaire, `valeur_reussie: "oui"` | ⚠️ **calcul propre** |
| `recadrage_verbal` | comptage rapporté, seuil 0,5, `moins_de` | ⚠️ **calcul propre** |
| `recadrage_non_tenu` | idem | ⚠️ **calcul propre** |

⭐⭐ **`question_specifique` est le SEUL observable du corpus qui soit dans les deux listes** — sur 24
de module et 56 de télémétrie, *« un seul observable croise les deux listes »* *(`03-` §9)*, et c'est
le nôtre. **Un seul calcul, deux lectures** : le relevé **recopie** le verdict, il ne le refait pas.
Une mutation qui lui donne un second domicile tombe.

⛔ **`recadrage` N'EST PAS `seuil_franchi`, et la confusion aurait été silencieuse.** Le §5 dit *« au
moins un recadrage `valide` après crible »*, sans un mot du palier ; le §4 dit que le seuil exige **en
plus** la base Bon. Sur une base Moyen avec un recadrage valide : `recadrage = oui`,
`seuil_franchi = non`. ⭐ **Et le cas s'est produit sur la copie réelle de la recette** *(§14)*.

⚠️ **Le dénominateur part au relevé sous son nom littéral — « les recadrages tentés »** :
`observables.ts` le cherche à la lettre. Il vaut le nombre de recadrages retenus par `code1`, **les
non jugés compris** — un recadrage que le juge n'a pas jugé reste une *tentative* de l'élève, et
c'est le seul élément **écarté des deux numérateurs qui porte quand même la propriété mesurée**.

---

## 7. ⭐⭐ LA TROUVAILLE — un observable REQUIS sortait `ratee` à chaque mesure, sans un symptôme

`question_presente` est déclaré au §5 comme *« `forme_question` ∈ {`question_explicite`,
`tension_affirmee`} »*, et son bloc machine porte donc une **LISTE** :

```yaml
question_presente:
  famille: binaire
  reussie: vaut
  valeur_reussie: [question_explicite, tension_affirmee]
```

⛔ `utils/chaine/observables.ts` faisait `valeur === entree.valeur_reussie` — **une égalité stricte
contre un tableau est fausse pour TOUTE valeur.** L'**écriture** de la mesure était juste ; c'est la
**lecture du verdict** qui était fausse — donc `tauxDeReussite`, donc **tout le §8 du routeur**.

⚠️⚠️ **C'est pire qu'un `n/a`.** Un `n/a` sort du dénominateur ; là, l'élève **ratait le plancher à
chaque copie**, et `question_presente` est l'un des **sept observables requis** au sens de la
précondition d'escalade *(§5 de la fiche)*. L'escalade aurait poussé, pour toujours, sur un défaut
qui n'existait pas.

⭐ **C'est le seul observable du corpus dans ce cas** — vérifié par extraction sur les six dérivés :
un seul `valeur_reussie` en liste, sur 56. **C'est pourquoi quatre portages ne l'avaient pas vu.**

⭐ **Rien n'était faux à la source** : le `03-` §1 nomme `valeur_reussie` sans dire qu'elle est
scalaire, et `derive-instruments.py` l'accepte telle quelle. **C'est le cadre qui était en retard.**
Corrigé en **quatre lignes additives**, `observables.ts` et le type d'`instruments.ts`, **écrit une
fois pour les six** ; aucune autre fiche n'en porte, donc aucun effet ailleurs. Un test l'assère sur
les cinq valeurs du catalogue, et la recette le revérifie en base.

⭐ **Le geste à transmettre, et il coûte deux minutes** : pour chaque observable, **regarde le TYPE
de `valeur_reussie` dans le DÉRIVÉ**, jamais dans la prose de la fiche.

---

## 8. Les écarts de langage — deux seulement mordent, et un NEUVIÈME est apparu

⭐ **Le fait rassurant d'abord** : le module **n'importe pas `re`** et n'appelle **ni `round()`, ni
`%.1f`, ni `.casefold()`, ni `.split()`, ni `len()` d'une chaîne**. Sur les huit écarts que les lots
précédents ont accumulés, **la moitié ne peut pas mordre ici**. ⚠️ **`arrondi.ts` lui est inutile** :
la seule division — celle des deux `comptage rapporté` — est faite par `observables.ts`.

**Ce qui mord, et qui est éprouvé sur ce qui le discrimine** :

- **(a) les BLANCS.** `strip()` de Python retire `\x85` (NEL) et `\x1c`-`\x1f` que `trim()` garde, et
  **garde la BOM `U+FEFF` que `trim()` mange**. Les deux sens sont au balayage, sur les valeurs de
  catalogue *(un `\x85limite\x85` est `limite` pour Python et hors catalogue pour JS ; un
  `﻿limite` est l'inverse)* **et** sur les `cite` du crible.
- **(b) le `str()` implicite.** `str(['limite'])` rend `['limite']` là où `String(['limite'])` rend
  **`limite`** — ⚠️ **un port naïf y aurait vu un `limite`, donc une borne haute, donc un palier de
  plus.** `str({})` rend `{}` contre `[object Object]`. Et **`str(None)` rend `None` contre
  `undefined`**, dans le texte de l'alerte `test_illisible`, **sur un chemin atteignable** — le
  `deduit` vaut `None` dès que le verdict du juge est `valide` ou a été remis à `null`.
- **(c) la VÉRITÉ d'une valeur.** `[]` et `{}` sont FAUX en Python, VRAIS en JavaScript.
- **(d) ⭐ LE NEUVIÈME, ET IL N'ÉTAIT PAS PORTÉ : `s[:n]`.** Python tranche une chaîne par **POINTS DE
  CODE**, `String.prototype.slice` par **unités UTF-16**. Le module s'en sert pour citer les **40
  premiers caractères** d'une requalification inappariable — donc dans la **troisième clé**, que le
  « fait quand » exige identique. Le balayage l'éprouve sur `𝔔` *(hors du plan de base)* et sur un
  émoji en tête.
  ⛔ **Il est porté DANS LE BRANCHEMENT, pas dans `python.ts`, et c'est délibéré** : `python.ts` est
  le module des formes **écrites une fois pour les six**, et celle-ci n'a **qu'un client**. *« On ne
  bâtit pas un canal sans client »* vaut aussi pour une primitive. **Si la Synthèse en a besoin,
  elle la promeut.**

⛔ **Ce qu'il ne fallait PAS « améliorer »** : `v in <chaîne>` est une recherche de **sous-chaîne**,
sans frontière de mot — `"enonce"` ⊂ `"enoncees"`, `"absent"` ⊂ `"absentes"`. Une note *« entre
enoncees et absentes »* sur `enjeu` fait donc lire `['enonce', 'absent']`. **Porté tel quel**, et
fixé par un cas de balayage nommé *« croisée »* ; poser un `\b` que Python ne pose pas aurait changé
un verdict.

---

## 9. Les preuves

**Le harnais ne fige rien** : `scripts/vecteurs-questionnement.py` **importe le module à chaque
exécution**, joue ses crochets, et rend ses entrées **et** ses sorties. Le jour où le module bouge,
le test le dit — *« des vecteurs qui pourrissent en silence valideraient le calcul contre une
référence morte »* *(contrat §5)*.

| Preuve | Compte |
|---|---|
| Vecteurs embarqués du module | **30** |
| Vecteurs d'alerte | **7** |
| Cas de référent *(7 embarqués + 19)* | **26** |
| Cas de conformité | **19** |
| Balayage — cascade entière | **3 072** |
| Balayage — conjonction *(les 2 valeurs + une illégale)* | **81** |
| Balayage — crible entier + lots multiples | **188** |
| Balayage — borne `limite` *(8 parties × 8 notes)* | **64** |
| Balayage — normalisation *(les écarts de langage)* | **108** |
| Balayage — appariement + formes illisibles | **40** |
| **TOTAL** | **3 635** |

**Les TROIS CLÉS sont comparées** — `verdicts`, `trace` **et** `alertes` —, plus `code1.mesures`,
`code1.document_p2` et `code1.alertes`. *« Une trace qui diverge dit qu'un chemin de calcul a changé,
même quand le verdict tombe juste. »*

⚠️⚠️ **LES DEUX NOMS DU « FAIT QUAND » N'EXISTENT PAS DANS CE MODULE.** Ni `TESTS_P2_PARFAIT` ni
`TESTS_CODE1_PARFAIT` : il porte `VECTEURS` (30), `ALERTES_ATTENDUES` (7), `VECTEURS_REFERENT` (7),
plus 2 cas de conformité écrits en dur dans `autotest()`. ⛔ Un `getattr(m, "TESTS_P2_PARFAIT", [])`
aurait rendu **un zéro qui ressemble à une mesure** : le harnais **l'écrit** *(`meta.absentes`)*, et
le premier test du fichier vérifie que les deux valent `false`. ⚠️ **Le TYPE est vérifié aussi** —
chez l'Expression, `TESTS_CODE1_PARFAIT` est une **chaîne**, et un `len()` y avait rendu « 52
vecteurs » qui étaient 52 caractères. Ici les cinq constantes sont bien des listes.

**Le reste** : `npm test` **1198/1198** *(38 neufs)* · `tsc --noEmit` **rien** · `eslint` **0 erreur**
*(4 avertissements sur des paramètres imposés par la signature, même forme que `structure.ts`)* ·
`derive-instruments.py --verifie` **IDENTIQUE**.

---

## 10. ⭐⭐ L'ÉPREUVE NÉGATIVE — 55 mutations, 53 tombées, et les deux survivantes DÉMONTRÉES

Le portage a été cassé **règle par règle** — 11 mutations sur la cascade, 3 sur le seuil, 8 sur le
crible, 5 sur la borne `limite`, 9 sur les écarts de langage, 12 sur la télémétrie, 7 sur le contrat
— et le test rejoué à chaque fois.

⚠️ **Au premier passage, CINQ ont survécu, et TROIS étaient de vrais trous — DEUX dans la
TÉLÉMÉTRIE**, exactement comme les items 11, 20 et 27 de la boîte aux lettres l'annonçaient.

⚠️⚠️ **LE MOTIF EST NEUF, ET PLUS RETORS QUE LE VECTEUR SYMÉTRIQUE.** `question_presente` lisant
`question_posee`, et `question_propre` lisant un champ du relevé, **passaient tous les deux** — parce
que mes assertions vérifiaient qu'un observable **EXISTE et n'est pas `n/a`**, jamais **CE QU'IL
VAUT**. Un relevé complet, sans `n/a`, avec ses neuf clés : tout était vert, et deux observables
lisaient le mauvais champ.

⭐ **La parade, et elle a fermé les deux d'un coup** : une copie où **chaque champ lu porte une valeur
différente des autres ET différente de sa valeur réussie**. Un échange de deux observables, ou la
lecture d'un voisin, se voit alors immédiatement. **Assère la VALEUR, jamais la seule présence.**
*(La troisième survivante était un vecteur manquant : sans un cas « la note ne nomme QU'UNE valeur »,
`len(lus) < 2` et `len(lus) < 1` rendent la même chose partout.)*

⭐ **Les deux survivantes qui restent sont du CODE ÉQUIVALENT — et l'équivalence a été ÉTABLIE, pas
affirmée.** Deux tests la démontrent par exhaustion : les seules valeurs où la vérité de Python et
celle de JavaScript divergent sont `[]` et `{}`, dont le `str()` — `[]` et `{}` — n'égale ni
`limite` ni **aucune** des huit valeurs d'échelle ; et `sorted()` et `.sort()` coïncident sur les
**huit parties** des trois noms de champ, tous ASCII. ⭐ **Les primitives fidèles sont gardées quand
même** : le jour où le module change, la fidélité est déjà là.

**C'est la confirmation de l'item 27** : quand la parade est appliquée d'emblée, ce qui survit n'est
plus un oubli.

---

## 11. ⚠️⚠️ CE QUI NE MESURE PAS — le référent dans les quatre modes réceptifs

**Le fait central du lot, et il a été trouvé au premier geste** *(item 30 de la boîte aux lettres)*.

La fiche §4 le déclare sans ambiguïté : le référent de `question_specifique` est *« les termes exacts
du sujet en `composer`, le problème réel du texte dans les modes réceptifs, **tel que la référence
décomposée le porte — c'est son champ `armature.question_directrice`
(`05-GENERATEUR_Reference_Decomposee.md` §3), et le module n'en lit aucun autre** »*. Le module le lit
bien là, et ses `VECTEURS_REFERENT` tiennent **le nom du champ ET son niveau d'imbrication** — *« le
module a longtemps lu `reference["probleme"]`, qui n'a jamais existé, et rien ne le voyait »*.

⛔ **`contexteExercice` de la chaîne porte QUATRE noms** — `sujet`, `consigne`, `copie`, `mode` — et
`utils/chaine/contexte.ts` ne lit `exercices.reference_id` **que** pour en déduire un référent
`texte | cours | null`, **jamais le contenu**. Servi à `null`, le slot **arrête la mesure en le
nommant**, ce qui est la conduite prescrite *(`CONTRAT` §2)*.

**Constaté en base, pas supposé.** Sur un dépôt réel en `interroger` :

```
alerte : questionnement : REFUS : `preP2` ne peut pas servir « referent »
                          — le contexte de l'exercice ne le porte pas
```

…aucune mesure de questionnement écrite, **et les autres compétences du même dépôt mesurent
normalement** *(`expression = A`)*. ⭐ **Le canal est bon** : servi une référence sérialisée, `pre_p2`
la lit sous le seul champ que le module lit, et un test le prouve.

⭐⭐ **CE N'EST PAS LE CORPUS DE COURS, ET LA DIFFÉRENCE COMMANDE QUI DOIT AGIR.** Chez la Connaissance,
**aucune source ne déclarait l'objet** — sa fiche §8 le portait dans ses « vraies questions ouvertes »,
et c'était du chantier de conception. **Ici la source le déclare**, l'écran de conception **refuse un
texte dont la référence n'est pas validée** *(`02-` §6 A)*, et `exercices_references` la porte,
`armature` comprise. **C'est de la plomberie de chaîne, pas une lacune de conception.**

⚠️ **La portée est grande.** Le Questionnement est l'une des **deux seules** compétences à qui la
table de proportion s'applique **en entier** — **≥ 40 %** en échelle réceptive et **≥ 15 %** en
`interroger` *(fiche §1.4)* —, et **chez les HLP il n'est ciblé QU'en modes autres que `composer`**
*(`01-` §3, R2)*. **Plus de la moitié de ses mesures sont muettes.**

⛔ **Non corrigé, et c'est la décision de Louis, prise en séance** : poser le fournisseur natif touche
`contexte.ts` et `chaine.ts`, hors du périmètre d'un lot dont *« la réussite se mesure à un diff quasi
nul hors d'`instruments.ts` »*. **Relevé** : registre des ouverts **57**, `SUIVI_tests_manuels.md`
**`C4L10Q-15`**, boîte aux lettres item **32-39** et bloc de confirmation.

---

## 12. ⚠️⚠️ RR4 refuse un retour qui dit « recadrage » ou « enjeu »

Observé **une fois sur deux tours** de recette :

```
alerte : retour refusé : RR4 : le texte nomme des observables — recadrage
```

`fuitesRR4` *(`utils/chaine/retour.ts:374`)* cherche chaque code d'observable **en SOUS-CHAÎNE** dans
le texte du retour. La règle est juste pour `garant_circulaire` ou `densite_friction` ; elle **mord à
faux** sur `enjeu` et `recadrage`, qui sont **le vocabulaire même du levier** que la fiche prescrit au
juge — *« interroger ta problématique, redéfinir un mot, montrer qu'elle en cachait une autre »*.

⭐ **Mesuré, pas supposé : sur les 56 observables de télémétrie des six fiches, DEUX SEULEMENT sont
des mots français ordinaires, et les deux sont au Questionnement.**

⛔ **Non corrigé** : RR4 est au `01-routeur.md` §12, **source gelée**, et la règle est bonne — c'est
son **implémentation** qui est plus large que son intention. **Trois issues, et c'est un arbitrage** :
le **mot isolé** plutôt que la sous-chaîne *(le plus simple, et cela ne relâche rien)* · la fiche
**renomme** ses deux codes *(mais un code est le nom d'une colonne de télémétrie)* · le prompt de
retour **proscrit** ces deux mots *(le plus fragile — un prompt n'est pas une garde)*.
**Registre des ouverts 58 ; `C4L10Q-16`.**

---

## 13. ⚠️⚠️ Le trou silencieux d'un champ LIBRE — et il ouvre le palier le plus haut

**Le « contrôle gratuit » du contrat §7 a été fait, et il est parfait sur ce qu'il couvre** : les
**DIX** champs à liste fermée — `forme_question`, `notions_en_tension`, `enjeu`,
`reponses_concurrentes`, `recadrages[].type`, `question_propre`, `question_specifique`,
`crible[].verdict`, `crible[].test`, `confiance` — **lèvent tous une alerte** sur une valeur hors
catalogue, et **le portage n'a eu à en créer aucune**. C'est le bénéfice de l'extraction, pour la
cinquième fois.

⚠️⚠️ **Mais SIX champs sont LIBRES, et deux d'entre eux décident du seuil.** `deplacement` et
`reprise` sont du verbatim qu'aucune liste fermée ne peut garder, et ils commandent `pre_verdict` et
`reprise_absente`. **Mesuré sur la même copie, toutes choses égales par ailleurs** :

| Ce que P1 rend | Niveau | Seuil | Alertes |
|---|---|---|---|
| honnête — l'élève n'a rien écrit *(`[aucun]` / `[aucune]`)* | **Bon** | fermé | `promotion_refusee` |
| **inventé** — un déplacement et une reprise que l'élève n'a pas écrits | **ACQUIS** | **ouvert** | **ZÉRO** |

⚠️ C'est le pendant exact du `source` de la Connaissance *(item 30d)* — sauf qu'ici ça ne coûte pas un
cran : **ça ouvre le palier le plus haut de la compétence**. ⛔ **Ne pas ajouter l'alerte au
branchement** *(elle ferait diverger la troisième clé)*. **C'est le `[à valider]` du contrat §8**,
partagé avec l'Argumentation, la Structure et la Synthèse : *aucun contrôle d'existence des citations
contre la copie*. **Relever, laisser le Run 1 dire la fréquence.** *(`C4L10Q-17`.)*

---

## 14. ⭐ Ce que la recette a montré sur une copie réelle

`scripts/recette/questionnement-c4l10.mjs` — **50 contrôles, 50 passés**, par le même code que la
route, sur un décor `problematisation` *(l'objet propre de la compétence)* à trois compétences, **7
appels réels**, décor **retiré**, `chaine_actif` rendu à OFF.

⭐⭐ **LE SECOND PLANCHER A MORDU DU PREMIER COUP.** La copie de recette portait **tout** pour Acquis —
question explicite, notions articulées, enjeu énoncé, réponse concurrente énoncée, **et un recadrage
valide après crible**. Le juge a rendu `question_propre: "reprise_enonce"`, **parce que sa première
phrase EST le sujet retourné**, et la cascade a donné **Absent (E)**. La fiche §4 l'avait écrit :
*« une copie qui recopie l'énoncé au point d'interrogation est parfaitement spécifique, et ce champ
est le seul qui l'attrape ».*

⭐⭐ **Et la dissociation du §6 s'est vue en vrai** : `recadrage = oui` **avec** `niveau = E`. L'élève a
recadré, **la télémétrie le sait**, sa lettre ne le dit pas — c'est exactement ce que le §5 veut. La
chaîne l'écrit : *« le seuil ouvre Acquis, il n'élève jamais la base : un recadrage valide sur un
palier de base Absent ne fait pas monter la copie. »*

**Le reste** : 3 squelettes *(le questionnement portant extraction **et** jugement)*, 3 mesures
*(`questionnement=E, expression=A, structure=D`)*, `instrument_version = 2.2`, `delta_v1_vf` **NULL**,
**les neuf observables en base, aucun `n/a`**. Idempotence : une reprise **rejoue la chaîne**
*(7 appels — ce n'est pas un cache)* et **n'écrit aucune seconde mesure** ; le bilan le dit par
`mesuresDejaLa = 3`, jamais par `appels === 0`.

⚠️ **Latence à trois chaînes : 55 s** — **exactement la mesure de la Structure au même nombre**, deux
fois indépendamment. La courbe reste plate.

⚠️⚠️ **ET LA RECETTE A ROUGI POUR UNE RAISON QUI N'EN ÉTAIT PAS UNE.** Au premier tour, six contrôles
disaient « 0 mesure écrite » quand la chaîne en avait écrit trois : le `select` demandait
`competences_mesures.alertes`, **une colonne qui n'existe pas**, et **`supabase-js` ne lève pas** — il
rend `{ data: null, error }`, et `(data ?? []).length` rend alors **zéro, qui ressemble à une
mesure**. ⭐ **La parade tient en cinq lignes** : un `lu(nom, { data, error })` qui **lève sur
`error`**, employé sur toute lecture. ⚠️ **Deuxième fois en deux lots** *(item 31)* — et le motif est
plus général que le champ : **c'est le retour ignoré qui ment.**

---

## 15. Ce qui a été déposé, et où

| Document | Ce qui y est écrit |
|---|---|
| `SUIVI_tests_manuels.md` | la section du lot — **15 entrées cochées** avec leur preuve, **8 décochées** avec leur condition de reprise en toutes lettres |
| `PLAN_DE_CHANTIER.md` §5 | la boîte aux lettres de C4-L10 — **items 32 à 39**, plus le bloc « ce que le cinquième portage a confirmé » ; l'entrée **C4-L7** amendée |
| `INVENTAIRE_Non_Tranches.md` | **items 57 et 58** en PILE 2 ; l'item **47** *(le `delta`)* amendé une quatrième fois |
| `07-Implementation.md` §2 | l'inventaire des lots — **état au 23/08 au soir**, cinq sur six, et les trois faits transverses. Le document passe en **2.39** |

⛔ **Aucun `[faux]` posé dans une source, et c'est un fait du lot** : rien de ce que le portage a
trouvé n'était une **source fausse**. Les deux ouverts qu'il laisse sont des dettes de **CADRE**
*(du code applicatif)* et un **arbitrage**.

⛔ **Rien n'a été commité au dépôt de conception** — il porte plusieurs sessions non commitées dans
les mêmes fichiers ; seuls les fichiers ont été amendés, à Louis de décider quand ils partent.

---

## 16. Les questions ouvertes que ce lot NE tranche pas

1. **Le fournisseur de la référence décomposée** *(registre 57)* — tranché en séance : **relever, ne
   rien toucher**. Le branchement est prêt à la lire.
2. **RR4 et les codes qui sont des mots ordinaires** *(registre 58)* — trois issues, aucune choisie.
3. **Le contrôle d'existence des citations contre la copie** — `[à valider]` du contrat §8, partagé
   avec trois autres compétences. Le Run 1 dira la fréquence.
4. **Un exercice à PLUSIEURS modes pour la même compétence** *(`C4L10Q-18`)* — `modes_par_competence`
   est un tableau, le module lit **un** mode. Le portage retient la lecture **prudente** *(réceptif
   dès que l'un des modes l'est)*, documentée et testée. ⭐ **Le cas n'existe pas en base** : sur les
   16 couples (exercice × compétence), **aucun** ne porte plus d'un mode. Aucune source ne dit ce
   qu'un exercice multi-modes veut dire pour un référent.
5. **La `trace` structurée contre `SortieCode2['trace']: string[]`** *(`C4L10Q-19`)* — la conversion
   est contenue et nommée ; élargir le type toucherait les tests des quatre branchements déjà écrits.
6. **`question_propre` sans `sans_objet_si`** *(`C4L10Q-20`)* — asymétrie avec
   `question_specifique` ; **le cadre tranche dans le sens de la fiche par un autre chemin**
   *(la sentinelle globale `NA`)*, et un test le fixe. À voir à la révision du `03-` §1.
7. **`recadrages[].type` n'est consommé par rien** — contrôlé au catalogue, jamais relu ; aucune
   règle, aucun palier, aucun observable ne le lit. *Constat, sans conséquence aujourd'hui.*

---

**Le lot suivant est `C4-L10 · Synthèse`, et son obstacle est nommé et entier** : son `code1` ne rend
pas `document_p2`, sur ses deux chemins de sortie — *le seul défaut de ce contrat dont rien ne
témoigne*. **À traiter au chantier de conception AVANT de l'ouvrir.**
