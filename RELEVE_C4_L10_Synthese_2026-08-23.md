# RELEVÉ — C4-L10 · Synthèse : la sixième compétence entre dans la chaîne

**Séance du 23/08/2026.** Deux gestes, dans deux dépôts, et un seul relevé les rassemble : **une
réparation** au module de calibration *(dépôt de conception)*, puis **le portage** du branchement
*(dépôt `palimpseste`)*. La première n'était pas mon lot — elle l'est devenue par mandat explicite de
Louis, parce que le second était impossible sans elle.

---

## 1. CE QUE J'AI RÉPARÉ — `copies-tests/synthese/code.py` *(dépôt de conception)*

### Le défaut, et pourquoi rien n'en témoignait

`code1` rendait `mesures` **sans `document_p2`**, sur ses **deux** chemins de sortie *(lignes 312 et
418)*, avec un commentaire ligne 264 qui affirmait que « `document_p2` n'est pas une clé du
contrat ». **C'est faux** : le `CONTRAT-MODULES.md` §2 l'exige **dès que le module définit `code1`**,
et `_commun/banc.py` ligne 580 fait `sys.exit("REFUS : code1 ne rend pas la clé « document_p2 »…")`.

⚠️ **Conséquence, vérifiée : LE BANC N'A JAMAIS PU TOURNER SUR LA SYNTHÈSE.** Son autotest passait ses
57 vecteurs parce qu'il ne vérifie pas le contrat ; `verifie-module.py` rendait **REÇU** ; le défaut
était latent depuis l'écriture du module. C'est exactement ce que le contrat annonce : *« le seul
défaut de ce contrat dont rien ne témoigne : les verdicts sortent, l'autotest est vert, la trace est
propre. »*

### Ce que le §4 m'a fait écrire, et pourquoi

⛔ **Ce n'était pas un ajout de clé.** Le prompt P2 de la Synthèse ne porte **qu'un slot**,
`{squelette}`, et le module n'a **aucun `pre_p2`** : `document_p2` est donc **tout ce que son juge
verra**, et rien d'autre. Ce qu'il doit contenir n'avait jamais été décidé, puisque le banc s'arrêtait
avant d'y arriver.

**Le §4 le décide, en trois phrases, et nulle part ailleurs :**

- *« le juge lit **le squelette nu** »* → le relevé aveugle de P1A, tel que le §3.1 le déclare :
  `unites`, `rapports`, `apports`, `these_forme` ;
- *« **Aucun nombre n'est injecté**, et la production continue ne lui est jamais donnée »* → ni le
  pré-relevé mécanique, ni les `mesures`, ni aucune clé à tiret bas ;
- *« Le juge nomme l'origine du contresens, **et il en a les moyens** : la référence déclare le statut
  d'énonciation de chaque phrase »* → **ses moyens n'ont pas d'autre route que ce document.**

⭐ **D'où DEUX FORMES, comme l'amorce le pressentait.** Sur le référent **texte**, le document porte en
plus **l'alignement de P1B** *(§3.2)* **et la référence décomposée** — sans elle, la seconde tâche du
juge est littéralement impossible : il ne pourrait ni comparer une unité à celle qu'elle vise, ni
nommer son statut d'énonciation, ni reconnaître une *lecture déclarée défendable*. Sur le référent
**cours**, ni l'un ni l'autre : *« le cours n'a pas de référence décomposée, et ne doit pas en
avoir »* *(§1, acté)*, la fidélité est *« référent texte seulement »* *(§4)*, et le prompt P2 rend
alors `"fidelite": []`.

**La référence part entière** : la trier serait décider, depuis le code, ce que le juge n'a pas le
droit de voir — quand le §4 la lui accorde sans réserve.

⚠️ **Un piège trouvé en réparant** : `code1` écrit `_corr` **dans** les entrées de `p1["alignement"]`.
Le document en est donc une **copie filtrée des clés à tiret bas** — sinon un canal privé serait parti
au prompt du juge.

### Ce que la réparation ne touche pas

**Tu ajoutes ce qui manque, tu ne réécris rien d'autre.** `mesures` est inchangé, les garde-fous sont
inchangés, `conformite` est inchangé, `code2` est inchangé. Le seul autre changement est la phrase
fausse de la ligne 264, qui **part avec la correction**.

### Les preuves — zéro appel, zéro réseau, zéro coût

| Contrôle | Avant | Après |
|---|---|---|
| `python3 copies-tests/synthese/code.py --autotest` | 57 vecteurs, 0 échec | **66 vecteurs, 0 échec** *(les 57 intacts + 9 neufs qui témoignent de la clé)* |
| `verifie-module.py --module … --config … --fiche …` | REÇU *(il ne voyait pas le défaut)* | **REÇU** |
| `banc.py` · `apres_p1` — **la ligne 580 qui refusait** | REFUS | **PASSE, sur les DEUX référents** |
| prompt P2 assemblé | — | **6 359 car. (cours) · 7 630 (texte)**, aucun slot non servi |

⭐ **L'épreuve négative de la réparation : SIX mutations sur six tombent** — la clé retirée du chemin
cours, du chemin texte, le `_corr` qui fuit, un nombre injecté, la référence servie sur le cours, le
squelette amputé de ses apports.

⛔ **Aucun run payé du banc n'a été lancé.** Le pilote a été conduit **en boîte**, avec un transport
factice : le chargement, `verifie_slots_p2`, `verifie_slots_p1` et `apres_p1` ont été joués sur les
deux référents sans une requête.

⚠️ **`verifie-module.py` réclame `pyyaml`**, absent du `python3` du système. Un venv dans le
scratchpad de session a servi ; **rien n'a été installé sur la machine**.

### ⚠️ Ce que la réparation a fait apparaître, et que je n'ai PAS corrigé

**`mesures["termes_reference"]` est LU par `code2` (ligne 490) et ÉCRIT PAR PERSONNE.** Le garde-fou
**acté** `apport_apparie` — *« un apport dont le terme se retrouve dans la référence n'ouvre pas le
seuil »* — est donc **inerte**, au module comme au portage, et rien ne le dit. ⛔ Hors du mandat, qui
ne lève l'interdiction du piège A-2 que **pour `document_p2`, et pour elle seule**. *Registre des
ouverts.*

---

## 2. CE QUE J'AI PORTÉ — le branchement de la Synthèse *(dépôt `palimpseste`)*

### ⛔ LA SEULE DÉCISION QUE J'AI DÛ FAIRE PRENDRE — la population de `copie_verbatim`

Cinq des six `proportion` du §5 écrivent leur fraction. **`copie_verbatim` est *« part d'unités en
`copie` »*, sans dénominateur** — la seule des six —, et la fiche distingue **au moins deux
populations** : « unités » et « unités couvrantes ». ⚠️ **La question porte deux fois** : sur
l'observable de télémétrie, **et** sur la branche **Absent** du §4 *(« reprise verbatim dominante »)*.
Trois unités dont une `copie` et deux `apport` donnent **1,0** sur les couvrantes et **0,33** sur
toutes les unités.

**Ce que j'ai apporté à l'arbitrage** : le module divise par **`couvrantes`** ; et le §4 « Ce que le
code compose » #3 met *« la part de reprise verbatim »* dans **la même énumération** que *« la part
intégrative (`fusion` + `generalisation` **sur les unités couvrantes**) »*, le qualificatif n'étant
écrit qu'une fois, sur la première.

⭐ **Tranché par Louis le 23/08 : les unités couvrantes, comme le module.** *C'est une décision de
source, et elle est marquée comme telle dans le code.*

### La forme de cette chaîne, qui n'est celle d'aucune autre

⭐⭐ **TROIS APPELS, ET DEUX QUAND LE RÉFÉRENT EST LE COURS.** *« Relevé aveugle → aligneur → juge →
code »*, *« parce que l'alignement EST sa mesure »* *(`01-` §11)* ; sur le cours, *« l'aligneur ne
tourne pas »* *(`07-` §1.2)*. C'est la seule des six dans ce cas, et `extractions()` le lit sur
`ctx.referent` — il ne le devine pas.

**Les crochets portés** : `pre_p1a`, `pre_p1b`, `code1`, `code2`, `conformite`. **Aucun
`prepare_copie`, aucun `pre_p2`** — le prompt de jugement n'a qu'un slot, donc c'est le document,
sans déclaration.

### ⭐ L'autre moitié du portage : TREIZE observables de télémétrie

Le module n'en rend que **trois** *(`niveau`, `palier_base`, `seuil_franchi` — ce que le banc compare
aux golds)*. Le §5 en déclare **treize** : c'est **le plus gros paquet des six**, et c'est chez la
Synthèse que l'écart entre le portage et le travail réel est le plus grand.

- **Un se RECOPIE** : `apport_organisateur` a mot pour mot la définition de `seuil_franchi` — *« au
  moins un apport survivant au crible »*. **Un seul calcul, deux lectures** : le relevé recopie le
  verdict de `code2`, il ne le refait pas. ⚠️ Les deux **codes** restent distincts : ils vivent dans
  deux listes qui *« ne se croisent qu'une fois sur tout le corpus »*, et ce n'est pas ici.
- **Six se LISENT aux mesures** — dont ⚠️ **`elagage`, QUI PORTE LES INVERSIONS, ET NON LE TAUX
  D'ÉLAGAGE.** Son `sens` le dit — *« l'observable rend **deux nombres**, le verdict ne lit que
  celui-là »* — et son `porte_sur` le nomme : *« les inversions comptées à part »*. Le second nombre
  part à la **trace**, où il se lit sans rien décider.
- **Six demandent un CALCUL PROPRE** : `couverture_essentielles` *(après la fidélité — c'est
  exactement ce que la règle d'agrégation lit)*, les trois rétrogradations du crible *(comptées par
  étiquette, après l'appariement des termes)*, et les deux contresens *(après la borne basse)*.

⚠️ **DEUX dénominateurs**, portés au relevé **sous leur nom exact** : *« les apports tentés »* — qui
vaut `nb_apports`, ce que **l'élève** a écrit, et non le nombre de criblés — et *« les unités
appariées à la référence »*, qui vaut `couvrantes`.

### Les preuves

| Contrôle | Résultat |
|---|---|
| `derive-instruments.py --resume` | six compétences **OUVERTES**, `synthese v3.4 — 13 observables` |
| `derive-instruments.py --verifie` | **IDENTIQUE** *(10 dérivés)* |
| `verifierCoherence()` | **aucun écart** — les trois référents éprouvés |
| **Le portage contre le module, LES TROIS CLÉS** | **6 069 cas**, dont 19 où le module lève |
| `npm test` | **1 230 passés, 0 échoué** *(entrée : 1 228/1 230 — deux entrées de registre à jour)* |
| `npx tsc --noEmit` | **rien** |
| `npx eslint` | **0 erreur**, 2 avertissements `no-unused-vars` sur des paramètres imposés par la signature |
| `scripts/recette/synthese-c4l10.mjs` | **64 contrôles, 64 passés**, en base, sur un dépôt réel |

⭐⭐ **L'ÉPREUVE NÉGATIVE : 61 MUTATIONS, 61 TOMBÉES, ZÉRO SURVIVANTE.** *Les quatre portages
précédents en comptaient 2/14, 5/29, 2/40 et 5/55.* ⚠️ **Mais pas du premier coup : ONZE
survivaient**, et les traiter est le vrai travail de la séance — voir §3.

### Le dépôt réel — ce que la chaîne écrit vraiment

**Référent cours** *(la synthèse en classe, `01-` §10)* : **6 appels, 46 s à deux chaînes**, un
squelette, **une mesure, lettre A**, et **les treize observables en base**. Le relevé de P1A porte 6
unités, 5 rapports et 3 apports ; le crible en rend deux `organisateur` et un `vide` — *« la mémoire
est une question complexe »*, exactement le chapeau que la copie de recette portait pour lui. ⭐
**L'extraction est rangée PAR PHASE — `{ p1a: … }` —, et le cours n'en a qu'UNE** ; le jugement porte
`"fidelite": []`, comme le prompt le prescrit sans alignement.

**Référent texte** : **aucune mesure, aucun squelette**, et la chaîne le dit par une alerte nommée —
voir §4.

**Idempotence** : une reprise rejoue bien la chaîne *(6 appels — ce n'est pas un cache)* et n'écrit
**aucune seconde mesure**. Le décor a été **retiré** *(vérifié par requête)* et `chaine_actif` est
**revenu à OFF**.

⛔ **Aucun statut de recette n'a été posé, et aucun n'est proposé.** La Synthèse est
`mesuree_silencieusement` — son état de naissance.

---

## 3. LES ONZE SURVIVANTES DE L'ÉPREUVE NÉGATIVE — et ce qu'elles ont appris

⭐⭐ **Le fait le plus utile de la séance, et il vaut pour toute reprise.** Au premier passage,
**onze mutations sur cinquante-neuf survivaient**. Aucune n'était un portage faux : toutes disaient
que **le contrôle ne contrôlait pas ce qu'il croyait**.

**(a) DEUX étaient des trous réels de télémétrie.**

- `elagage` rendant le **taux** au lieu des **inversions** survivait parce que, sur mon cas de
  référence, les deux valaient **0**. Il a fallu une référence où le taux d'élagage n'est **pas** nul
  et où **aucune inversion** n'a lieu — une illustration couverte, une autre jamais, et la thèse de
  leur moment couverte.
- `taux_compression` sans son **alerte nommée** survivait parce qu'aucune assertion ne la demandait.
  *« Chaque observable du §5 a sa valeur au relevé, ou son alerte nommée »* — la seconde moitié se
  vérifie aussi.

**(b) QUATRE étaient masquées par une DISJONCTION, et c'est le motif neuf.**

⚠️⚠️ Les quatre comparaisons du palier — `partInt <= 0.5`, `rendus < pe`, `couvEss < pr`,
`partiels > plafond` — survivaient toutes. **Elles n'étaient pas fausses : un autre terme du `ou`
faisait déjà tomber le palier à Moyen**, et déplacer l'inégalité ne changeait rien.

⭐ **L'item 28 de la boîte aux lettres — « balaye les seuils » — est nécessaire mais NE SUFFIT PAS.**
Il faut en plus que **tous les autres termes soient confortablement au-dessus**, pour que la frontière
éprouvée soit **la seule à décider**. D'où une référence bâtie exprès : quatre essentielles *(donc
`couvEss ∈ {0, ¼, ½, ¾, 1}`)*, quatre moments déclarés *(donc `rendus ∈ {0, ¼, ½, ¾}`)*, **aucune
fonction `illustre`** *(donc aucune inversion, jamais)* — et deux familles d'alignement dont l'une met
`partInt` à **½ pile**. **4 800 cas de frontière**, et les quatre mutations tombent.

**(c) QUATRE étaient des écarts de langage éprouvés AU MAUVAIS ENDROIT.**

Les balayages faisaient bien passer des blancs, des ligatures et des identifiants — mais **jamais dans
le champ qui en dépend** :

- `casefold()` → `toLowerCase()` : il fallait la **ligature `ﬁ`** *(qu'une OCR produit)* **dans une
  note de « limite »**, où elle décide d'un palier — `casefold` la replie en `fi`, `toLowerCase` non ;
- `strip()` → `trim()` : il fallait la **BOM dans un `terme_cite`**, où l'appariement du crible décide
  du seuil, donc d'Acquis ;
- les **blancs de Python** *(`\x85`, `\x1c`-`\x1f`)* : même champ, même conséquence ;
- `sorted()` → `.sort()` : il fallait des identifiants **à deux chiffres** — le tri par défaut de
  JavaScript est **lexical**, et `[10, 2]` y reste `[10, 2]`.

**(d) UNE était un décompte qui ne se voyait pas.** Une unité du relevé qui n'est pas un objet fait
**lever** le module ; le portage la traverse — mais il ne se taisait pas assez fort. ⚠️ Au passage :
`len(unites)` de Python porte sur **la liste brute**, et le portage compte désormais pareil.

---

## 4. ⚠️⚠️ CE QUE LA SYNTHÈSE NE MESURE PAS, ET POURQUOI CE N'EST PAS UNE PANNE

**Elle mesure sur le référent COURS. Elle se tait sur le référent TEXTE.**

Son aligneur réclame `{reference_decomposee}`. ⛔ **La chaîne ne descend pas la référence
décomposée** : `contexteExercice` porte **quatre noms** — `sujet`, `consigne`, `copie`, `mode` —, et
`contexte.ts` ne lit `exercices.reference_id` **que** pour en déduire un référent
`texte | cours | null`. Servi à `null`, le slot **arrête la mesure en le nommant** — le comportement
voulu *(`CONTRAT` §2)*. **Constaté en base** : *« synthese : REFUS : le contexte de l'exercice ne
porte pas de quoi servir reference_decomposee à P1B »*, **aucune mesure, aucun squelette**, et
l'expression du même dépôt mesure normalement.

⭐⭐ **C'EST LE MÊME CANAL MANQUANT QUE CELUI DU QUESTIONNEMENT, ET UN SEUL GESTE FERME LES DEUX.**
`exercices_references` porte **`contenu`** *(la référence décomposée, dont le Questionnement lit
`armature.question_directrice`)* **ET** `source_contenu_id → scriptorium_contenus.texte_extrait` *(le
texte source)*. ⚠️ **Et la Synthèse a besoin des deux** : la référence pour l'aligneur et pour le
document du juge, **le texte source pour le pré-relevé** — sans lui, `taux_compression` sort en `n/a`
*(il n'est pas requis, §5)* et les recouvrements verbatim ne se cherchent pas.

⛔ **Ce n'est pas le cas du corpus de cours de la Connaissance** : là, **aucune source ne déclarait
l'objet**. Ici la source le déclare, l'écran de conception refuse un texte dont la référence n'est pas
validée, et la table la porte. **C'est du CODE, et une décision de Louis.**

⚠️ **Un troisième cas, et la fiche le tranche** : `contexte.ts` peut rendre `referent: null` — ni
synthèse en classe, ni `reference_id`. L'aligneur est alors demandé lui aussi, et son slot vide arrête
la mesure : *« sans référent, il ne reste rien à mesurer qui soit de la Synthèse »* *(§1)*.

---

## 5. CE QUE JE N'AI PAS FAIT, ET POURQUOI

- **`delta` n'est pas déclaré.** Le mot « delta » n'apparaît **pas une seule fois** dans
  `competences/synthese.md`. ⚠️ **SIX FICHES SUR SIX SE TAISENT — le corpus entier** : ce n'est plus
  un oubli de fiche, c'est une case du gabarit du `03-` §1 que personne n'a remplie. La chaîne le dit
  par une alerte et laisse **NULL** — et NULL n'est pas 0.
- **Aucune source n'a été corrigée, et aucun `[faux]` n'a été posé.** Rien de ce que le portage a
  trouvé n'est une source fausse.
- **Aucune migration**, aucune ligne au `SUIVI_SQL.md` : ce lot ne touche que du code.
- **`termes_reference` n'a pas été réparé** *(voir §1)* : le corriger ferait diverger le portage du
  module que le banc validera.
- **Le canal du socle n'a pas bougé.** ⭐ La promesse de l'item 1 de la boîte aux lettres tient **pour
  la sixième et dernière fois** : `BranchementCompetence` n'a pas gagné une ligne, et le contexte
  s'enrichit déjà entre P1A et P1B — `sorties['p1a']` était posé, sans client, par la séance
  Expression.

---

## 6. LE SEUL POINT DU LOT QUI N'A PAS ÉTÉ OBSERVÉ

**Le retour engendré n'a pas été inspecté** sur ce tour : le script ne lisait pas `bilan.retourEcrit`.
La ligne est ajoutée pour le prochain tour. ⭐ **Le geste que l'item 37 me demandait est fait par
l'analyse** : sur les treize codes de cette fiche, **un seul est un mot français ordinaire —
`elagage`** —, et `fuitesRR4` compare **en sous-chaîne et sans replier les accents** : un retour qui
écrit « élagage » ne déclenche rien, un retour qui écrirait « elagage » ferait refuser tout le retour.
*Le risque est réel mais mince ; il n'a pas été observé.*

---

# ADDENDUM — 23/08, après coup : la référence décomposée descend dans `contexte.ts`

*À la demande de Louis, et hors du lot : ce que le relevé ci-dessus laissait comme
« décision de Louis » est fait. Trois choses en sont sorties, dont deux que
personne n'aurait vues sans servir une VRAIE référence.*

## Ce que j'ai posé

**`contexte.ts` joint `exercices_references`** : `contenu` donne la référence
décomposée, `source_contenu_id → scriptorium_contenus.texte_extrait` donne le
matériau. `chaine.ts` les sert à `contexteExercice`, sérialisés ; `FOURNISSEURS_NATIFS`
passe de quatre noms à six. **Une seule jointure ferme les deux manques** — le
référent texte de la Synthèse, et les quatre modes réceptifs du Questionnement, qui
lisait déjà `ctx.contexteExercice.reference` en attendant ce jour.

⛔ **Servie SEULEMENT si la référence est VALIDÉE**, et ce n'est pas une prudence :
`garde_reference_validee`, en base, **lève une exception** dès qu'un
`artefact_jugement` s'écrit sur une référence non validée. Tant que la chaîne
s'arrêtait avant P2, la garde ne tirait jamais ; en servant la référence, elle
tirerait — et une exception de base emporte la trace, au lieu d'une mesure qui
s'arrête proprement en nommant ce qui manque.

## ⛔ TROUVAILLE 1 — le module et la source ne parlent pas le même format

**Le format qui fait foi n'est pas celui que le module lit.**
`copies-tests/_commun/verifie-reference.py` déclare le schéma **CLOS** :
`phrases {n, fonctions, statuts}` · `moments {m, de, a, fonction, cible, statuts,
etiquette}` · `armature` · `concepts` · `lectures` · `hesitation`. ⚠️ Or
`synthese/code.py` lit `reference["unites"]` et `moments[].unites` — **ni l'une ni
l'autre n'existe**. *Le Questionnement, lui, lit `armature.question_directrice` :
canonique.*

⭐ **Descendre la référence sans traiter ça aurait été pire que de ne rien faire** :
`code1` aurait composé un palier **Moyen** sur des décomptes tous nuls — statuts
vides, toutes les correspondances « inexistantes », zéro couvrante — et servi une
lettre C à un élève. **Un arrêt propre échangé contre une mesure fausse.**

**Ce que j'ai fait, et pourquoi c'est le harnais qui le fait.** Le contrat §7 :
*« le parsage tolérant appartient au BANC, pas au module : les crochets reçoivent
des objets propres »*. Le banc est le harnais du module en calibration, la chaîne
l'est en production — **normaliser la source vers ce que le module lit est le
travail du harnais**. La correspondance est mécanique et garantie :
`phrases[].n → unites[].u` *(`verifie-reference.py` : « la segmentation qui fait
foi — LA MÊME QUE LE PRÉ-RELEVÉ DE LA SYNTHÈSE »)*, et `de..a → moments[].unites`
*(le validateur garantit que les moments pavent les phrases, sans trou ni
chevauchement, à partir de 1)*.

⛔ **Elle est ADDITIVE, et c'est le point** : on ajoute `unites` **à côté** de
`phrases`, jamais à leur place. Le juge lit la référence **entière** par
`document_p2` — c'est là qu'il prend le **statut d'énonciation** dont le §4 dit
qu'« il en a les moyens », et les **lectures déclarées défendables**. Les remplacer
aurait fait juger la fidélité sans ce qui la décide.

⭐ **Et deux verrous, pas un** : `pre_p1b` refuse de servir une référence
illisible — **avant le premier appel payé** — et `code2` refuse de composer si elle
arrivait par une autre route, par le canal que la boîte aux lettres prescrit
(*« `document_p2` EST le relevé, et `code2` le reçoit ; `mesures` reste comparable
octet pour octet »*).

## ⚠️⚠️ TROUVAILLE 2 — une dette de source : `relance`

La vraie référence en base porte **`relance`** sur 4 de ses 17 phrases. Le
`02-exercices.md` §6 pose la liste des fonctions **OUVERTE**, initiée à
`defend_these · illustre · explique · relance`, et dit ce qu'elle vaut : *« `relance`
est la phrase qui ouvre la suite sans rien avancer […] **Elle ne porte aucun contenu
à restituer : une phrase dont `relance` est la seule fonction n'est pas une unité de
restitution.** »* ⛔ **Le bloc machine de la Synthèse n'en déclare que TROIS.**

⭐ **La conduite reste juste** — ces phrases sortent des décomptes de couverture,
exactement ce que la source prescrit — mais **par deux alertes chacune** *(« fonction
inconnue » puis « aucune fonction lisible »)* au lieu d'une exclusion nommée. **La
fiche est en retard sur le `02-` §6.** *Marquée, non corrigée — c'est la convention
du chantier.*

## ⭐ TROUVAILLE 3 — la règle « ne rien créditer » tient sur pièce

La recette a servi la seule référence validée de la base — un texte de Descartes — à
une copie qui restitue un cours sur la mémoire. **L'aligneur a rendu six `apport`,
zéro correspondance** : *« une unité de la référence n'est restituée que si l'unité
de l'élève la dit effectivement, jamais parce que ça va de soi »* (fiche §1). Zéro
couvrante, donc zéro fidélité — et le prompt du juge le prescrit. **La règle absolue
de l'extraction s'observe, et elle tient.**

## Les preuves

| Contrôle | Résultat |
|---|---|
| Portage contre module, les trois clés | **6 069 cas** — inchangés, la normalisation est un no-op sur les vecteurs |
| **Épreuve négative** | **65 mutations, 65 tombées, 0 survivante** *(6 neuves sur le canal)* |
| `npm test` · `tsc` · `eslint` | **1 234/1 234** · rien · 0 erreur |
| Recette en base, **16 appels de plus** | référent **cours** : mesure **A**, retour engendré · référent **texte** : squelette à **deux phases** `p1a,p1b`, mesure **E**, et **`taux_compression = 0,58`** — le matériau est descendu |

⚠️ **Un rouge, et c'était mon attendu, pas le code** : j'avais assuré que le juge
rendrait des fidélités, en oubliant que mon propre décor est délibérément incohérent.
L'assertion est corrigée pour asserter la vraie règle *(zéro couvrante ⇒ zéro
fidélité)* ; **elle n'a pas été rejouée** — la relancer coûtait un run payé pour
prouver ce que le run précédent avait déjà montré.

## Ce qui reste

- **Le corpus de cours de la Connaissance** — le seul manque de fournisseur qui
  demeure, et il n'est pas de code : *« aucune source qui fait foi ne le déclare »*.
- **`relance` au bloc machine de la Synthèse** — dette de source ci-dessus.
- **`termes_reference`** — le garde-fou acté inerte, inchangé.
