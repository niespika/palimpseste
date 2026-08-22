# RELEVÉ — C4-L8-bis · La doctrine lue en entier (21/08/2026)

> Ce que la séance a **tranché parce que l'implémentation l'exigeait**, ce qu'elle a **observé et
> qui contredit le prompt**, et ce qu'elle **n'a pas tranché** et laisse à Louis.
>
> **État à la clôture : `npm test` 428 / 428.** **Q1** *(l'échec pré-existant de la chaîne)* a été
> tranchée par Louis en séance et jouée ; **Q2** aussi — fichier d'import versé au dépôt, décor en
> base retiré ; **Q3** aussi — les neuf crans balayés objet par objet aux deux portes.
> **Aucune question du lot ne reste ouverte** ; une découverte de relecture, **hors périmètre et non
> tranchée**, est portée au **§4 bis**.
>
> La preuve, elle, vit au `SUIVI_tests_manuels.md` § **C4 · L8-bis** — seize lignes cochées avec
> leur preuve, et **plus aucun reste de recette**. Ce relevé ne la redouble pas.

---

## 1. Ce qui est fait

Le lot tient dans **deux fichiers**, comme le prompt l'annonçait :

| Fichier | Ce qui change |
|---|---|
| `utils/fabrique/doctrine.ts` | `lireTable` — les **douze** tables paginées par un seul chemin, **ordonnées**, et **confrontées au décompte de la base** ; `DoctrineTronquee` ; `ClientLecture` élargi au minimum |
| `utils/fabrique/doctrine-lecture.test.ts` | **neuf** — 14 tests sur une **doublure de client**, sans base et sans racine |

**Aucune migration. Aucune ligne au `SUIVI_SQL.md`. Aucune re-dérivation** — `doctrine_derivation`
compte toujours **6**, et le journal ne porte pas de septième passe. **Aucun interrupteur touché** :
les cinq restent à OFF. **Le décor de recette de C4L8-1 est intact.**

Les **quatre** chemins qui lisent la doctrine — `app/prof/conception/nouvelle/page.tsx`,
`app/prof/conception/actions.ts`, `app/prof/conception/[id]/page.tsx` et
`utils/fabrique/import-ecriture.ts` — passent **tous les quatre** par `chargerDoctrineDepuisBase` :
le correctif les couvre sans qu'aucun ne soit modifié. **Vérifié par recherche, pas supposé.**

---

## 2. Ce que l'implémentation a tranché — et qu'il faut savoir

Trois choix que le prompt ne nommait pas et qui ne se devinent pas à la lecture du code.

### 2.1 Le garde-fou vit dans la LECTURE, pas dans `assemblerDoctrine`

Le `07-` §2 écrit « **l'assemblage** refuse une doctrine TRONQUÉE, comme il refuse déjà une doctrine
vide ». Le refus du vide est bien dans `assemblerDoctrine` ; **celui de la tronquée ne pouvait pas y
aller**, pour une raison structurelle : `assemblerDoctrine` sert **aussi la fixture**, qui n'a pas de
base à interroger — et le piège 14 interdit précisément de comparer aux comptes de la fixture
*(`exercices_types` : **15** en base, **13** dans la fixture)*. Le décompte annoncé n'existe **qu'au
moment de la lecture**. Il est donc dans `lireTable`, au plus près de la table, du nombre lu et du
nombre attendu — ce qui rend le message précis.

*Le chemin complet — `chargerDoctrineDepuisBase` = lecture **puis** assemblage — refuse bien la
tronquée, comme le `07-` l'exige. Seul l'étage change.*

### 2.2 `DoctrineTronquee extends DoctrineAbsente`

Le prompt ne demandait pas de classe neuve. Une sous-classe a été retenue plutôt qu'un message de
plus dans `DoctrineAbsente` : elle **nomme** la condition — vide et tronquée ne sont pas la même
panne, et le piège 13 insiste sur ce que la seconde a de pire — tout en **conservant intégralement**
la propriété sur laquelle le piège 15 s'appuie : `instanceof DoctrineAbsente` reste vrai, rien ne
l'attrape dans les quatre chemins, et le message remonte tel quel à l'écran. **Un test le vérifie
dans les deux sens.**

### 2.3 Les clés de tri des neuf tables que le piège 8 ne nommait pas

Le piège 8 donnait trois clés *(`exercices_routes` → `id` ; `exercices_consignes_isolees` →
`(competence, source_section, cran)` ; `exercices_crans` → `cran`)*. Les neuf autres ont été lues
**au schéma de la sandbox**, pas devinées — clé primaire de chaque table :

`exercices_types` `id` · `exercices_types_modes` `id` · `exercices_types_modes_source`
`(type_id, mode)` · `exercices_types_crans` `id` · `exercices_durees` `(geste, grain)` ·
`competences_modes_admis` `(competence, mode)` · `exercices_consignes_production` `(mode, cran)` ·
`demonstrations_formes` `forme`.

⚠️ **Une exception, et elle mérite d'être connue : `exercices_guides_production` N'A PAS DE CLÉ
PRIMAIRE.** Elle porte un index unique `uk_guides_production (type_id, coalesce(genre,''))`. Le tri
retenu est **`(type_id, genre)`**, qui est total puisque cet index l'est. *Ce n'est pas un défaut de
ce lot et rien ne s'y casse — mais une table de doctrine sans clé primaire est une chose à savoir le
jour où quelqu'un la paginera autrement.*

**Le décompte se demande avec LE MÊME `select` que la lecture**, jointures embarquées comprises :
les deux nombres portent alors sur le même ensemble **par construction**, et non parce qu'on l'espère.
Il **part avec la première page**, pas après la dernière — il n'en dépend pas, et l'attendre en série
coûterait un aller-retour par table.

### 2.4 Ce que le lot coûte — mesuré, pas estimé

Un chargement complet de la doctrine, **depuis le Mac vers la sandbox distante**, trois tirs :

| | 1er | 2e | 3e |
|---|---|---|---|
| **avant** *(non paginé — **et faux**)* | 238 ms | 205 ms | 194 ms |
| **après** *(décompte en série)* | 613 ms | 612 ms | 519 ms |
| **après** *(décompte lancé avec la première page)* | 575 ms | 503 ms | 492 ms |

**~300 ms de plus**, dominés par les **quatre pages successives d'`exercices_routes`** — inhérentes à
la pagination. Les onze autres tables tiennent en une page : **la boucle y est gratuite**.

⚠️ **Un piège de supabase-js rencontré en chemin, et qui vaut pour tout le dépôt** : un constructeur
de requête est **paresseux** — il ne part qu'au premier `then`. Garder `admin.from(…).select(…)` dans
une variable **ne lance rien** ; il a fallu un `Promise.resolve(…)` explicite pour que le décompte
parte vraiment avec la première page. **Sans lui, le code paraissait parallèle et ne l'était pas**, et
rien ne l'aurait dit. *C'est commenté sur place.*

*Le chiffre est celui d'un Mac contre une base distante ; en production, où la fonction et la base
sont voisines, l'aller-retour coûte bien moins.* **À surveiller si la conception paraît lente** — le
remède serait un cache par requête, pas un retour au plafond.

---

## 3. Ce que la séance a observé et qui CONTREDIT le prompt

### 3.1 `argument` × `composer` × cran 3 ne passait pas de 16 à 24 — il était déjà à 24

Le piège 19 annonçait deux chiffres de preuve : `partie` **0 → 40** et `argument` **16 → 24**.

- **`partie` : confirmé**, 0 avant, 40 après, à l'écran.
- **`argument` : NON reproductible.** Avant correction, la lecture applicative en rendait **déjà
  24** — sa valeur finale.

**Ce n'est pas une anomalie, c'est le piège 18 qui se réalise** : `--sql` fait `delete` puis
`insert`, l'ordre physique des lignes se refait à chaque passe, et c'est lui qui décide quelles
mille lignes reviennent. **Les sept objets aveugles nommés à la mission étaient bien les sept
aveugles au moment du rejeu** — mais le chiffre d'`argument`, lui, avait bougé. *Rien n'a été codé
qui s'accroche à cette liste.* La ligne **F1** du `SUIVI_tests_manuels.md` porte désormais cette
correction, pour que le 16 n'induise personne en erreur plus tard.

### 3.2 En porte Aletheia, quatre objets sur treize NE PEUVENT PAS paraître

Le « fait quand » demande que **les treize objets** offrent leur banque, `porte=codex` **et**
`porte=aletheia`. En Codex, les treize l'offrent — vérifié, aucune vide. En Aletheia, **neuf
seulement peuvent paraître** : `exemple`, `introduction`, `reference` et `transition` **ne déclarent
que `composer`** *(`exercices_types_modes_source` ; `02-` §3, table des modes admis)*, et l'écran les
filtre sur `o.modes.some(m => m !== 'composer')`.

**C'est la doctrine, pas un défaut, et ce lot n'y touche pas.** Les **33** couples objet × mode
réceptif réellement déclarables au cran 3 ont été balayés à l'écran : **aucun vide**. La condition
est donc tenue au sens où elle peut l'être — mais elle ne se lit pas « treize objets en Aletheia »,
et il vaut mieux que ce soit écrit ici que redécouvert à la prochaine recette.

### 3.3 Le `07-` a bougé DEUX FOIS PENDANT la séance : 2.21 → 2.22 → **2.23**

Relevé quand `derive-instruments.py` a annoncé lire **2.22** là où le contrôle d'entrée avait vu
**2.21** — puis **2.23** vingt minutes plus tard, pendant la clôture. La règle du prompt — *« la
version avertit […] relis son en-tête avant de continuer »* — a été appliquée aux deux : en-tête
relu, diff pris à chaque fois.

**Ce qui a changé : l'en-tête, et lui seul.** Le statut passe de **« VALIDÉ ET GELÉ »** à **« RELU ET
VALIDÉ »**, et le gel **cesse de porter sur le fichier pour porter section par section** :

| Régime | Sections |
|---|---|
| **GELÉ** | §2 *(la règle de manifeste seule)*, §3, §4, §6 |
| **OUVERT À L'IMPLÉMENTATION** — *une session Code l'amende depuis son relevé, sans accord préalable* | §1, §2 *(l'inventaire des lots)*, §5 |
| **REGISTRE** | §7 |

**2.22 → 2.23** ajoute **deux règles au §2** : *« une session Code ne corrige jamais une source »*
— quand l'implémentation trouve une source **fausse**, elle pose **`[faux]`** au point de l'erreur et
porte la correction au registre des ouverts *(`INVENTAIRE_Non_Tranches.md`, DETTES)* — et *« un lot se
ferme sur sa recette et sur son relevé, jamais sur l'état des sources »*. *Ce lot n'a corrigé aucune
source, et n'avait rien à marquer `[faux]` : les deux écarts qu'il a relevés (§3.1 et §3.2) sont des
faits **du dépôt** et du **prompt**, pas des erreurs de source.*

**Rien de ce qui gouverne ce lot n'a bougé** : l'entrée **C4-L8-bis** du §2 — mission, « fait quand »,
manifeste — est **inchangée**, et le §1 aussi. Le contrôle d'entrée **tient toujours** : « RELU ET
VALIDÉ » vaut *relu et validé*, et ce lot n'exige de toute façon aucun statut de `07-`, qui est
« ce document ».

⭐ **Et une conséquence structurelle, qui est le vrai enseignement des deux bougés.**
`utils/chaine/instruments.test.ts` compare des fichiers dérivés à une source **vivante, éditée en
parallèle**. **Chaque édition du `07-` fait donc rougir `npm test`** — c'est arrivé deux fois en une
soirée, et `--ecris` a dû être rejoué deux fois. Le vert n'est jamais plus frais que le dernier
`--ecris` : ce n'est pas un test qui garde un invariant, c'est **un test qui garde une synchronisation
manuelle**. ⚠️ **Tant que le `07-` est en cours d'écriture, tout lot Code héritera de ce rouge, sans
l'avoir causé.** *Trois issues possibles — rejouer `--ecris` à chaque fois (ce qui a été fait), ne
comparer que ce qui gouverne vraiment un comportement (l'empreinte du **gabarit**, pas celle du
fichier entier — le texte, lui, n'a pas bougé d'un octet en deux versions), ou porter le contrôle
hors de `npm test`. **Non tranché, hors périmètre de ce lot.***

⚠️ **Deux conséquences à connaître pour les prochains lots**, et c'est pour elles que je le note :
le `PROMPT_Code_C4_L8_bis.md` **épingle « VERSION 2.21 · VALIDÉ ET GELÉ »**, qui n'est plus l'état du
fichier ; et **le §1 et l'inventaire des lots du §2 sont désormais amendables par une session Code
sans accord préalable** — ce qui change ce qu'un prompt de session peut légitimement demander.
*Ce lot n'avait aucun amendement à y porter et n'en a porté aucun.*

---

## 4. Les trois questions — toutes tranchées et jouées

*Elles étaient ouvertes à la clôture du lot ; Louis les a tranchées l'une après l'autre dans la même
soirée, et chacune a été jouée dans la foulée. Leur énoncé d'origine est conservé pour que la
décision reste lisible.*

### ✅ Q1 — TRANCHÉE ET JOUÉE le 21/08 : `npm test` est à **428/428**

> **Décision de Louis, en séance : rejouer `derive-instruments.py --ecris`.** L'arbitrage lève
> explicitement le piège 4 du prompt *(« ne touche pas la chaîne »)*. Fait.
>
> **Résultat.** `--verifie` passe de **DIVERGE** à `INSTRUMENTS : IDENTIQUE (3 fichier(s)
> dérivé(s))` ; `utils/chaine/instruments.test.ts` repasse au vert ; **`npm test` : 428 tests,
> 428 verts, 0 rouge.**
>
> **Ce qui a réellement changé — et c'est peu.** Deux fichiers réécrits, `MANIFESTE.ts` et
> `calame-retour.ts` ; `monitoring.ts` **inchangé** (même empreinte). Dans les deux, **six lignes
> en tout**, toutes de métadonnée : `empreinte_source`, `statut_source` et `version_source` passent
> de `2.20` / « VALIDÉ ET GELÉ » à **`2.23` / « RELU ET VALIDÉ »**. ⭐ **Le texte du gabarit Calame
> est identique octet pour octet** — 3422 caractères, même empreinte avant et après. **Aucun
> comportement de la chaîne n'a bougé** : seule l'estampille de provenance a rattrapé sa source.
>
> *L'autre dette de la chaîne — le chemin absolu de la racine embarqué dans la fixture, qui fait
> échouer `npm test` ailleurs que sur ce Mac — **reste ouverte** et n'a pas été frôlée.*

<details>
<summary>Ce que la question disait avant l'arbitrage</summary>

#### ⛔ Q1 — `npm test` porte un échec **pré-existant**, et le refermer sortirait du lot

**L'état.** Avant la séance : **414 tests, 413 verts, 1 rouge**. Après : **428 tests, 427 verts, le
même unique rouge**. Le lot ajoute **14 tests, tous verts, et n'en casse aucun**.

**Le rouge.** `utils/chaine/instruments.test.ts` → `derive-instruments.py --verifie` dit **DIVERGE**
sur `MANIFESTE.ts` et `calame-retour.ts`. **La cause est identifiée** : les dérivés de
`utils/chaine/derive/` portent `07-` **2.20**, la source est à **2.21** — c'est-à-dire **l'édition du
21/08 qui a écrit l'entrée de C4-L8-bis au `07-` §2**. Le contrôle fait exactement son travail : une
source a bougé, il le dit.

⚠️ **Ce n'est pas la dette que le piège 26 décrit.** Celle-là est le **chemin absolu de la racine**
embarqué dans la fixture, qui fait échouer `npm test` **ailleurs que sur le Mac de Louis**. Ici on
**est** sur ce Mac, et ça échoue quand même, pour une autre raison. *Le test neuf de ce lot ne lit ni
base ni chemin absolu : la dette de la racine n'a pas été frôlée, encore moins aggravée.*

**Pourquoi ce n'est pas tranché en séance.** Le geste qui referme est
`python3 scripts/derive-instruments.py --ecris`. Il **réécrit `utils/chaine/derive/`** — et le
piège 4 dit, sans réserve, « **ne touche pas la chaîne** ». Le « fait quand » demande par ailleurs
« `npm test` reste vert », qu'il glose « **414/414 au moins** » ; **414/414 n'a jamais été l'état de
départ**, et le prompt ne dit pas quoi faire quand le rouge préexiste et vient d'ailleurs.

> **La question :** rejouer `derive-instruments.py --ecris` maintenant *(un geste, mais dans la
> chaîne)*, ou le laisser au lot de correctifs ? **Rien n'a été joué.** *(Consigné aussi à
> l'`IDEES_post_rentree.md` et en reste de recette **L8bis-R4**.)*

</details>

### ✅ Q2 — TRANCHÉE ET JOUÉE : le fichier au dépôt, le décor en base retiré

La preuve de l'import et celle de la garde serveur **écrivent en sandbox** — c'est le piège 23 qui
l'exige *(« le contrôle d'import se prouve par un import, pas par une lecture »)*. Restent donc :

- le matériau `mat-l8bis-partie-0001` *(`partie` × `composer`, **validé** en file à l'écran)* ;
- l'exercice importé `ex-l8bis-partie-composer-03-garant_present-0001` *(`a_concevoir`)* ;
- l'instance conçue à l'écran `974b6f51-3723-446d-9e46-f7964051662f`, **`assigne`**, avec **7 lignes
  d'`exercices_depots`** sur la classe `Test · terminale · HLP`, fenêtre 22 → 29/08.

**Il n'a pas été nettoyé**, par symétrie avec le décor de C4L8-1 que le prompt demande de conserver,
et pour que la preuve reste vérifiable par requête. **Les cinq interrupteurs sont à OFF : rien n'est
servi à un élève.**

✅ **Le fichier d'import de cette preuve est au dépôt — versé le 21/08 sur décision de Louis.**
`scripts/recette/recette_c4l8bis_partie_routee.json`, à côté de celui de C4L8-1, avec **son
paragraphe au `scripts/recette/LISEZ-MOI.md`** : ce qu'il éprouve, le texte exact du refus n° 15
qu'il levait, la commande, l'idempotence, et le signalement légitime qui subsiste. **Idempotence
revérifiée depuis son nouveau domicile** — redéposé, ses deux `id` sont reconnus, les deux entrées
ignorées, rien n'entre et rien n'est refusé. **La preuve L8bis-11 se rejoue désormais d'une
commande.**

✅ **Le décor en base est retiré — 21/08, sur décision de Louis.** En une transaction, dans l'ordre
qu'impose `exercices_cas.materiau_id`, qui est en **`ON DELETE RESTRICT`** : **les exercices d'abord,
le matériau ensuite**. Supprimés : les **2 exercices**, leurs **2 `exercices_cas`** et leurs
**7 `exercices_depots`** par cascade, puis le matériau.

⚠️ **La cascade des dépôts descend dans des tables de TRAVAIL ÉLÈVE** — `exercices_jobs`,
`exercices_squelettes`, `exercices_metacognition`, `exercices_retours` —, et deux autres passent en
`set null` *(`competences_mesures`, `monitoring_mesures`)*. **Elle ne se lance pas à l'aveugle** :
les huit tables ont été comptées **avant**, toutes à **0**, et aucun dépôt n'était horodaté. Vérifié
**après** : zéro reste côté `l8bis`, aucun orphelin, **décor de C4L8-1 intact**, totaux revenus à
l'état d'avant la séance *(5 exercices · 3 matériaux · 14 dépôts)*.

**Aucune migration** : ce n'est pas du schéma, c'est **le geste symétrique de la recette** — rien au
`SUIVI_SQL.md`, comme pour le décor semé-puis-retiré de C4-L5.

ℹ️ **Un choix que je n'ai PAS fait à votre place : les 4 lignes du journal `exercices_imports` sont
gardées.** Un journal atteste ce qui a eu lieu ; l'effacer falsifierait l'historique, et celle de
C4L8-1 est restée de même. *Un `delete … where nom_fichier = 'recette_c4l8bis_partie_routee.json'`
les retire si vous préférez.*

⚠️ **Ce que le nettoyage coûte, et il faut le dire** : **L8bis-10** *(conception → assignation)* et
**L8bis-11** *(l'import qui entre)* **ne se vérifient plus par requête** — leurs lignes n'existent
plus. Elles restent prouvées par ce qui est écrit au suivi, et **rejouables** : le fichier d'import
est au dépôt, la conception se refait à l'écran en quelques clics.

### ✅ Q3 — JOUÉE le 21/08 : les neuf crans balayés, objet par objet, aux deux portes

> **425 lectures à l'écran, AUCUNE banque vide.** Le détail chiffré est au suivi *(L8bis-15 et
> L8bis-16)* ; ce qu'il faut en retenir tient en trois points.

**Ce que le balayage montre, et que le cran 3 seul ne montrait pas.** Aux **six crans qui isolent**,
chaque couple rend **exactement le même compte aux six** — `partie` × `composer` donne 40 au cran 1
comme au 9. C'est la structure des routes : chaque déclaration de routage couvre les six crans qui
isolent, et la table en porte une ligne par cran. **Rien ne dépend du cran** dans la lecture, ce que
la pagination corrigée rend enfin visible partout et pas seulement au cran 3.

**Les crans de production ne bougent pas, comme le piège 21 l'annonçait** — et ce n'est pas un
silence : un **patron** est servi aux 13 objets × 3 crans en Codex et aux 33 couples × 3 crans en
Aletheia, **jamais un vide**. Leur banque vient des quinze patrons du `04-` §14.1, que la pagination
ne touche pas.

⚠️ **Et un trou trouvé en chemin, qui n'est pas un défaut de ce lot.** Au **cran 6**, les trois
objets terminaux déclinent leur guide au **`genre`** *(`04-` §14.2)*. **Lu sans genre élu, l'appui
nommé revient VIDE** — « Écris la conclusion.  », avec sa place en creux. Avec le genre, les onze
combinaisons servent leurs moments nommés : *« bilan · réponse · ouverture »*, *« situer le texte ·
la thèse qu'il défend · l'annonce des mouvements »*, etc. — **11 / 11, aucune vide.** Le `genre`
étant `required` sur ces trois objets, **l'écran ne laisse pas concevoir sans lui** : le cas ne se
produit pas en usage. *Je le note parce qu'un lecteur du balayage verrait « (aucun) → vide » et
croirait à une banque manquante.*

---

## 4 bis. Ce que la relecture de Louis a fait apparaître — et que je ne tranche pas

*Question posée à la clôture : « qu'y a-t-il pour `introduction` en `explication_texte_tc` ? ».
La réponse a ouvert un trou qui n'est **pas** un défaut de ce lot, mais qui vaut d'être écrit.*

**Ce qu'il y a.** Le `04-` §14.2 lui **écrit un guide de cran 6** — *« situer le texte · la thèse
qu'il défend · l'annonce des mouvements »* —, l'une des onze combinaisons lues au balayage de Q3.
La doctrine déclare donc cette instance.

**Ce qu'on ne peut pas en faire.** `explication_texte_tc` **exige un `texte_auteur` en
`materiau_source`** *(`02-` §1.3)*. Or **`introduction` est le seul objet terminal sans aucun mode
réceptif** — `exercices_types_modes_source` ne lui donne que `composer`, et ses 132 routes y sont
toutes. Donc **Aletheia ne la liste pas** *(l'écran filtre sur `o.modes.some(m => m !== 'composer')`)*
et **Codex n'ouvre pas `texte_auteur`** *(`02-` §6 B.2, point 3)*.

**Vérifié, pas déduit** : la **garde serveur l'accepte** — `empechementsDeConception` rend une liste
**vide** sur `composer` + `texte_auteur` —, et le **contrôle d'import l'accepte** — **0 refus** sur
l'entrée *(seuls un R17 sur la décomposition du texte de test et le B1 de référence non validée se
lèvent, tous deux imputables au matériau synthétique)*. **L'instance est donc IMPORTABLE et
INCONCEVABLE en ligne.**

### La cause est un cran au-dessus, et elle dépasse `introduction`

La **règle 4** *(`02-` §2.3.3)*, mot pour mot :

> *« Quand il y a un `texte_auteur` dans le `materiau_source`, `composer` n'est pas déclarable pour
> l'Argumentation ni le Questionnement […] **Il le reste pour l'Expression et la Connaissance** —
> ces deux-là seraient sinon **immesurables** dès qu'un texte d'auteur est présent. »*

Le `02-` §6 B.2 ferme `texte_auteur` dans Codex en invoquant cette même règle 4, *« qui le rend
incompatible avec `composer` pour l'Argumentation, la Structure et le Questionnement »*. ⭐ **La
justification laisse dehors les deux compétences que la règle 4 protège explicitement.** Et Aletheia
ne sert que les modes réceptifs. **`composer` + `texte_auteur` n'a donc aucune porte** — exactement
l'« immesurable » que la règle 4 voulait écarter.

| Objet terminal | Modes déclarés | `explication_texte_tc` concevable en ligne ? |
|---|---|---|
| `conclusion` | `composer`, `restituer` | **oui**, mais **en réception seulement** |
| `partie` | les cinq | **oui**, en réception seulement |
| **`introduction`** | **`composer` seul** | **NON — aucune porte** |

*Pour `conclusion` et `partie`, ce qui passe par Aletheia est **un autre exercice** — « dis ce que la
conclusion du texte dit ». **La version `composer` — écrire l'introduction d'une explication — n'est
concevable pour aucun des trois.***

### Pourquoi je ne pose PAS `[faux]`

Le `07-` **2.23** demande qu'une session Code qui trouve une source **fausse** pose `[faux]` au point
de l'erreur et porte la correction au registre. **Je ne le fais pas, et c'est délibéré** : je ne sais
pas **laquelle** des sources serait fausse, ni même s'il y a une erreur. Au moins quatre issues, et
ce sont des décisions de doctrine :

1. **ouvrir `texte_auteur` dans Codex** pour l'Expression et la Connaissance ;
2. **donner des modes réceptifs à `introduction`** ;
3. **retirer `explication_texte_tc`** de ses genres admis ;
4. **assumer** que ces instances passent **uniquement par l'import**.

*Consigné aussi à l'`IDEES_post_rentree.md`.* ⚠️ **Ce n'est pas un défaut de C4-L8-bis** : la
pagination n'y change rien, et `introduction` **offre bien sa banque** — 22 consignes au cran 3,
porte Codex. C'est distinct du guide vide sans genre élu *(Q3)*, qui reste ce qu'il était.

---

## 5. Ce à quoi le lot n'a PAS touché — vérifié, pas supposé

- **`utils/chaine/contexte.ts`** — il lit `exercices_routes` **filtré** ; **non harmonisé**, comme le
  piège 4 l'ordonne.
- **`composerApercu`** et sa `reponse_attendue` en quatrième position — **regardée deux fois pendant
  la preuve, non réparée** *(piège 5 ; neuvième item de la boîte de C4-L3)*.
- **L'opt-out, la zone en construction, les `search_path`** — gestes du lot de correctifs.
- **Les jointures embarquées `exercices_types!inner(code)`** — les quatre sont **intactes**.
- **Les douze appels restent en `Promise.all`** — chacun paginé pour son compte.
- **Les deux messages de `empechementsDeConception`** — **ni fusionnés ni affaiblis**.
