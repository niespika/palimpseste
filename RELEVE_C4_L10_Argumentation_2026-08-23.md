# RELEVÉ — C4-L10 · Argumentation, la deuxième compétence dans la chaîne (23/08/2026)

> **Le lot se rejoue tel quel, et il s'est rejoué en un jour.** Le socle posé par
> `C4-L10 · Expression` le 22/08 n'a manqué sur aucun point ; aucun canal n'a eu à être ajouté à
> l'interface du branchement. Ce lot ne porte que **les trois gestes de l'ouverture** sur une seule
> compétence — et il a trouvé, en les portant, **une source fausse** et **deux défauts réels**.

---

## 1. Le contrôle d'entrée

Les **six pièces** du manifeste existent. Cinq aux versions attendues, une qui a bougé :

| Pièce | Attendu au prompt | Constaté | Verdict |
|---|---|---|---|
| `07-Implementation.md` §1 et §2 | **2.34**, RELU ET VALIDÉ | **2.36**, RELU ET VALIDÉ | ⚠️ **la version a bougé → en-tête relu**, comme la règle le demande. Les amendements de la 2.35 et de la 2.36 viennent de **C4-L11**, et ils portent sur les sections **ouvertes** : la forme de la `cible_primaire` et du `cran` au §1.1, le retrait de `prompt_version` au §1.2, la cadence du déclencheur au §5. **Le §2 — la règle de manifeste — n'a pas bougé.** Rien de ce qui a changé ne contredit ce lot ; deux de ces amendements le SERVENT *(voir §2)*. |
| `03-competences.md` §1, §2, §9 | **2.1**, VALIDÉ ET GELÉ | **2.1**, VALIDÉ ET GELÉ | ✅ |
| `01-routeur.md` §3, §8.2, §11 | **5.5**, VALIDÉ ET GELÉ | **5.5**, VALIDÉ ET GELÉ | ✅ *(+ le §8.3 que le §8.2 cite, et le §12 que ce prompt ouvre explicitement)* |
| `competences/argumentation.md` | **4.2**, RELUE ET VALIDÉE | **4.2** à l'entrée, **4.3 à la clôture**, RELUE ET VALIDÉE | ✅ — et c'est bien *relu et validé* qui est exigé, jamais *versé et bancé*. ⭐ **Elle a bougé PENDANT le lot**, et dans le sens du portage : voir §14 |
| `copies-tests/_commun/CONTRAT-MODULES.md` | déposé | validé par Louis item par item, 1er-2 août | ✅ |
| `copies-tests/argumentation/code.py` | déposé | v0.3, `--autotest` **29 réussis, 0 échoués** | ✅ |

**Les trois constantes de vecteurs, comptées AVEC LEUR TYPE** *(le piège du `len()` sur une chaîne)* :
`TESTS_P2_PARFAIT` est une **liste vide**, `TESTS_CODE1_PARFAIT` une **liste de 2**,
`TESTS_COMPOSITION` une **liste de 27**. `VERSION_GOLDS_TESTEE = None`, `PARAMS = {}`,
`OBSERVABLES = ['niveau', 'palier_base', 'seuil_franchi']`. **L'Argumentation part au Run 1 : ni
gold, ni run stocké.** Le paquet de vecteurs porte ces types et ces tailles, et le test les assert.

---

## 2. ⭐ LA PORTE — C4-L11 devait être joué, et il l'est

C'était la condition la plus dure du prompt, et la seule qui pouvait arrêter le lot avant qu'il
commence : *« la `cible_primaire` n'était pas construite ; la chaîne prenait l'ordre alphabétique et
levait une alerte dès que ce repli servait sur plus d'une compétence. Tant qu'une seule était
branchée, il ne mordait pas — **il mord à la deuxième, donc à toi**. »*

**Constaté joué et commité** : branche `feat/c4-l11-correctifs`, commit `fb3ee68` ; `cible_primaire`
déclarée à l'écran de conception *(`Pipeline.tsx`, `actions.ts`)*, descendue par `lireContexte`, lue
par `cibleDuRetour` **avant tout défaut** ; SQL `c4_l11_additifs.sql` et `c4_l11_cran_forme.sql`
joués en bac à sable le 23/08 *(journal du `SUIVI_SQL.md`)*.

⭐ **Et il ne s'est pas cru sur parole : la recette le vérifie EN BASE, sur trois instances réelles.**
Une qui vise `argumentation` → cible `argumentation`, **aucune alerte**. Une qui vise **`expression`**
→ cible **`expression`**, **alors que le repli alphabétique aurait dit `argumentation`** — c'est
elle qui discrimine, et c'est la seule preuve possible que la colonne est *lue* et non devinée. Une
**sans** `cible_primaire` → repli alphabétique **et l'alerte tombe**.

*Le deuxième amendement du `07-` qui sert ce lot : la forme du `cran` est désormais **le numéro**,
sous `check between 1 and 9`. Le décor de recette l'écrit en entier, jamais au code.*

---

## 3. Le socle, vérifié point par point

Les huit points annoncés étaient tous là, et aucun n'a demandé de reprise.

1. **Le verrou est aligné.** `derive-instruments.py --resume` : les six compétences **OUVERTES**,
   `argumentation v4.3 — 9 observables de télémétrie`. `--verifie` : **IDENTIQUE**, dix dérivés.
2. **`utils/chaine/slots.ts`** — tête invariante *(4056 caractères sur le P1 de l'Argumentation)*,
   substitution sous balise de matériau, refus des deux sens au chargement.
3. **`code2(artefactP2, sortieCode1, ctx)`** — la signature est celle du contrat.
4. **`conformite`** déclaré au branchement et appelé à chaque passage.
5. **Les crochets pré-phase ont leur canal** — l'Argumentation n'en utilise **aucun**.
6. **Le canal privé `_audit`**, et `refusFormeCode2` sur les trois clés publiques. `injection_p2`
   **toujours pas construit**, et c'est bien : l'Argumentation ne l'utilise pas non plus.
7. **`utils/chaine/arrondi.ts`** existe — *et ne sert pas ici, voir §7*.
8. **`valeursDesParametres()`** — l'Argumentation ne déclare **aucun** paramètre.

**La boîte aux lettres de C4-L10 était pleine**, et ses huit items étaient déjà entrés en piège au
prompt de cette séance. **Tous se sont vérifiés à l'usage.** *Le dépôt le plus utile du lot, dit le
plan : c'est exact.*

---

## 4. Ce qui a été construit

**Trois fichiers neufs, une modification, un dérivé re-versé.**

- **`utils/chaine/branchements/argumentation.ts`** — le portage, fonction pour fonction, de
  `copies-tests/argumentation/code.py` v0.3 : `code1` *(lecture du squelette, listes fermées,
  comptes bruts)*, `code2` *(crible → borne basse → majorité par palier → seuil → niveau)*,
  `conformite` *(P2 qui déborde de sa sortie déclarée)*, plus **la télémétrie du §5**, que le module
  ne calcule pas. `delta` **non déclaré**, motivé.
- **`utils/chaine/python.ts`** — ⭐ **écrit une fois pour les six** : les formes de Python qu'un
  portage doit reproduire — `repr()`, `str()` d'un conteneur, `casefold()`, et le `\b` **Unicode**
  de `re`. *Voir §7, c'est la trouvaille technique du lot.*
- **`scripts/vecteurs-argumentation.py`** — le harnais : il importe le module, joue ses vecteurs et
  **six familles de balayage**, et émet **entrées et sorties** en JSON. Il ne touche à rien.
- **`utils/chaine/branchements/argumentation.test.ts`** — 25 tests, dont la comparaison des **trois
  clés** sur 769 cas et les assertions « FICHE » de l'épreuve négative.
- **`scripts/recette/argumentation-c4l10.mjs`** — la recette sur base réelle, 52 contrôles.
- **`utils/chaine/instruments.ts`** — l'import du slot et le branchement. **Trois lignes utiles.**
- **`utils/chaine/derive/competences/argumentation.ts`** — re-versé par `--ecris` : **seule
  l'empreinte de la source a changé**, le `[faux]` posé à la fiche étant hors des marqueurs.

**Le diff hors `instruments.ts` et hors fichiers neufs est de trois entrées** au
`utils/chaine/instruments.test.ts` *(deux compétences ouvertes, quatre en attente, un test propre à
l'Argumentation)*. **La chaîne n'a pas été touchée.**

---

## 5. Le portage — ce qui a été extrait, et ce qui a été durci

**C'est une extraction, jamais une régénération.** La table, suivie à la lettre :

| Vers | Depuis `code.py` |
|---|---|
| `code1` | `code1` |
| `code2` | `_applique_crible` + `_resout_limites` + `code2` |
| `conformite` | `conformite` |

**Les cinq arbitrages de mécanisation sont portés tels quels** : l'appariement d'une requalification
et ses deux replis · le traitement hors liste qui ne gonfle rien · le statut hors liste qui écarte
l'unité · le test illisible que `vers` détermine · **l'ordre des quatre passes**, qui rend possible
`explicite → implicite → cosmetique` sur la même unité.

⚠️ **CE QUE LE MODULE RÉPARAIT EN SILENCE — le contrôle gratuit du contrat §7, fait.** Comme pour
l'Expression, **tout est déjà alerte, jamais trou** : statut hors liste, traitement hors liste, test
illisible, `vers` qui contredit son test, rang faux, thèse non recopiée, « limite » illisible, garant
cité sur une `implicite`, garant absent sur une `explicite`, champ de P2 hors sortie déclarée,
confiance hors énumération, `crible.requalifications` absent. **Le portage n'a eu à en créer
aucune** — c'est le bénéfice de l'extraction.

⚠️ **CE QUE LE PORTAGE DURCIT, ET POURQUOI.** Quatre formes que P1 ou P2 peuvent prendre font
**lever** le module : `unites` qui n'est pas une liste, `objections` idem, `crible.requalifications`
idem, une requalification qui n'est pas un objet *(`dict("x")` lève)*. Le contrat §3 l'interdit — *« le
module ne lève jamais d'exception : elle traverserait le banc et emporterait la trace avec elle »* —
et prescrit l'inverse : *« une valeur illisible rend une alerte, pas une valeur par défaut »*.
**Chaque durcissement est marqué ⚠️ PORTAGE en commentaire, ne se déclenche sur AUCUN vecteur, et
rend une alerte nommée.** Un test les éprouve. *Le portage reste fidèle : il fait ce que le contrat
dit là où le module se tait.*

---

## 6. La seconde moitié — les neuf observables du §5

**Le module en rend trois** *(`niveau`, `palier_base`, `seuil_franchi`)* ; **la fiche en déclare
neuf**, et **aucun des neuf n'est dans les trois**. Comme pour l'Expression : *les deux listes ne se
croisent pas.*

| Observable | Famille | Ce que le relevé porte |
|---|---|---|
| `garant_present` | proportion | unités du décompte dont `garant_cite` ≠ `[absent]`, **divisé** |
| `lien_explicite` | proportion | unités `explicite` **après crible**, **divisé** |
| `preuve_circulaire` | comptage rapporté | le **compte** des `circulaire` au décompte |
| `garant_circulaire` | comptage rapporté | le **compte** des unités **rétrogradées au test de la distinction** |
| `source_cosmetique` | comptage rapporté | le **compte** des unités **requalifiées au test de la source** |
| `garant_ambigu` | comptage rapporté | le **compte** des unités **marquées au test du sens** |
| `garant_vague` | comptage rapporté | le **compte** des unités **marquées au test du contour** |
| `objection_traitee` | binaire | `oui` / `non` — au moins une objection `réfutée` ou `portée nuancée` |
| `nb_limites` | comptage rapporté | le **compte** des unités `limite`, écartées comprises |
| — | *dénominateurs* | `les unités du décompte` **et** `les unités du décompte, écartées comprises` |

⭐ **Trois choses qu'il a fallu comprendre, et qui ne se lisaient nulle part telles quelles :**

1. **`objection_traitee` N'EST PAS `seuil_franchi`.** Le seuil se ferme aussi sur une unité marquée
   `ambigu` ou `vague` ; l'observable du §5, lui, ne regarde que le traitement de l'objection. Deux
   nombres, deux usages — et un test le fixe.
2. **`garant_cite` n'est plus dans `mesures`** : `code1` le jette une fois les bruts comptés. La
   télémétrie le **relit sur `document_p2`**, qui est le relevé entier — plutôt que d'ajouter un
   canal privé dans `mesures`, ce qui aurait rendu `mesures` incomparable au module.
3. ⚠️ **LA POPULATION DES DEUX `proportion` N'ÉTAIT PAS NOMMÉE PAR LA FICHE — elle l'est depuis
   4.3.** Les cinq `comptage rapporté` déclarent leur `rapporte_a` ; `garant_present` et
   `lien_explicite` écrivaient seulement « proportion d'unités ». **Lecture retenue : les unités du
   décompte**, pour un motif tiré de la fiche — leur `sens` les adosse à la **règle d'agrégation du
   §4**, qui ne compte que le décompte. *L'autre lecture donnait 5/7 au lieu de 4/5 sur la copie de
   recette.* ✅ **LA FICHE A TRANCHÉ DANS CE SENS LE JOUR MÊME** *(voir §14)* — item 48 **clos**.

---

## 7. ⭐⭐ LA TROUVAILLE — l'arrondi n'était qu'un des quatre écarts de langage

Le socle avait posé `arrondi.ts` parce que `round()` de Python tranche au pair et `Math.round` vers
le haut. **Il y en a trois autres**, et ils ont exactement la même signature : *aucun vecteur ne les
voit, une copie réelle les rencontre.* `utils/chaine/python.ts` les porte, écrit une fois pour les
six.

| L'écart | Ce qu'il casse | Comment il a été trouvé |
|---|---|---|
| **`{x!r}`** — le `repr()` de Python | Les traces et les alertes divergent **mot pour mot** : `rang 9` contre `rang '9'`, `« None »` contre `« undefined »`. Le verdict tombe juste, la trace ment | Les vecteurs, dès le premier passage — la trace se compare mot pour mot |
| **`str()` d'un conteneur** | `['circulaire', 'implicite']` et `{'explicite': 3}` reprennent le `repr()` de chaque élément | Idem |
| **`str.casefold()`** ≠ `toLowerCase()` | `ß`→`ss`, **`ﬁ`→`fi`** *(une OCR en produit)*, `ς`→`σ`. Un appariement de thèse **manqué** perd une requalification et **laisse un palier de trop** | ⚠️ **Aucun vecteur** : leurs thèses sont `t1`, `t2`. Il a fallu **ajouter un balayage** de 8 paires de thèses |
| **le `\b` de `re`, qui est UNICODE** | « écirculaire » ne contient **pas** « circulaire » pour Python ; le `\b` de JavaScript hors drapeau `u` en voit un. Une note de « limite » gagnerait un **second statut**, et une unité que le garde-fou écarte **rentrerait au décompte avec un statut fabriqué** | ⚠️ **Aucun vecteur** : leurs notes sont sans accent. Il a fallu **ajouter un balayage** de 11 notes |

⛔ **`arrondi.ts` NE SERT PAS SUR L'ARGUMENTATION, et c'est vérifié, pas supposé** : `grep round(` sur
le module ne rend **rien**, il ne calcule **aucune densité** *(« il n'y a pas de densités ici »,
fiche §4)*, et les deux `proportion` du §5 se rendent **non arrondies** — exactement comme
`observables.ts` rend un `comptage rapporté`. **Rien à arrondir, donc rien à porter.**

---

## 8. Les preuves

**Le « fait quand », point par point.**

| Ce qui est exigé | Constaté |
|---|---|
| `--resume` déclare la compétence **ouverte** | ✅ `argumentation v4.3 — 9 observables de télémétrie` |
| `--verifie` dit **IDENTIQUE** | ✅ dix dérivés |
| `verifierCoherence()` ne rend **aucun écart** | ✅ |
| Le branchement reproduit `code.py --autotest`, **sans appel de modèle** | ✅ **29 vecteurs** *(2 `code1`, 27 de composition)*, **les trois clés** comparées, `trace` mot pour mot |
| Chaque observable du §5 a sa valeur **ou son alerte nommée** | ✅ éprouvé sur **769 cas**, et la contradiction *(valeur ET alerte)* est refusée aussi |
| Un dépôt réel écrit **un squelette, une mesure, une lettre** | ✅ **deux** de chaque — le dépôt mesure deux compétences. Lettre de l'Argumentation : **« D »** |
| `npm test` reste vert | ✅ **1083 / 1083** *(entrée : 1047)* |

**Le balayage — 742 entrées de plus, et il n'invente aucune règle** *(la même fonction du même
module, sur plus d'entrées)* : **680** distributions de 1 à 4 unités × avec/sans objection · **16**
croisements test × statut · **12** paires de « limite » **dans les deux ordres d'écriture** · **15**
traitements × marques · **8** appariements de thèse · **11** notes de « limite ».

⭐⭐ **L'ÉPREUVE NÉGATIVE — 14 mutations, 0 survivante.** Le portage a été **cassé exprès**, règle
par règle, et le contrôle est tombé à chaque fois. ⚠️ **DEUX SURVIVAIENT au premier passage** —
`garant_present` rapporté à toutes les unités, et `garant_circulaire` comptant le test de la source —
et **toutes deux étaient dans la télémétrie**, la moitié qui ne se voit pas. **Le motif était le
même : le vecteur de test était SYMÉTRIQUE** *(un compte par test, aucune unité écartée)*. Rendus
discriminants, les quatorze sont tombées. *C'est la leçon la plus transférable du lot : fais
l'épreuve négative sur la télémétrie AVANT de la faire sur le calcul.*

**La recette sur base réelle — 52 contrôles verts, cinq vrais appels, deux compétences.**
Bilan : `p1, p1, p2, p2, retour`, **52 s** *(trois tours : 47 s, 49 s, 52 s)*, deux squelettes portant
chacun leurs deux artefacts, deux mesures, `instrument_version` **égale à la ligne VERSION de la
fiche**, `delta_v1_vf` **NULL**,
idempotence tenue, **aucune ligne `code1` ni `code2` au journal**, décor **retiré** *(aucun reste,
vérifié par requête)*, `chaine_actif` **revenu à OFF**, **aucun statut `evaluee` posé**.

**Les neuf observables, sur la copie réelle** :
`garant_present=0.4 · lien_explicite=0.2 · preuve_circulaire=0.4 · garant_circulaire=0 ·
source_cosmetique=0 · garant_ambigu=0 · garant_vague=0 · objection_traitee="oui" · nb_limites=0.2`.
**Aucun en `n/a`.**

---

## 9. ⭐ LE PREMIER RETOUR DU CHANTIER QUI AIT ÉTÉ ENGENDRÉ — et lu

Le tour de l'Expression n'avait **jamais pu le lire** : sa copie plancher ne portait aucune réussite
citable, et la règle 2 du gabarit refusait le retour. **La copie de l'Argumentation en porte une.**
Trois points segmentés, chacun avec son identifiant stable et son ancrage verbatim, registre
**`descriptif`**, `published_at` **NULL** *(écrit, pas publié)*, **aucune fuite RR4** :

> **[…:v1:01]** ⟨copie · « ce que la loi retire en pouvoir immédiat, elle le rend en sécurité
> durable »⟩
> *Tu as écrit une vraie raison ici : « ce que la loi retire en pouvoir immédiat, elle le rend en
> sécurité durable ». Tu ne te contentes pas de dire que la loi est bonne — tu expliques l'échange :
> une restriction contre une garantie. C'est exactement ce qu'on appelle un lien écrit noir sur
> blanc, et ça fonctionne. **La fois précédente, ces liens étaient presque absents ; cette fois, tu
> en poses un qui tient vraiment.***
>
> **[…:v1:02]** ⟨copie · « comme le montre Le Contrat social, la liberté véritable est celle qui
> s'accorde à la loi »⟩
> *Tu cites Rousseau — c'est nouveau, et c'est bien de l'avoir tenté. Mais ce que tu en tires, « la
> liberté véritable est celle qui s'accorde à la loi », c'est exactement ce que tu voulais prouver.
> La source ne fait que redire ta thèse avec un nom en plus. Il faut écrire ce que Rousseau distingue
> réellement : par exemple, qu'il sépare la liberté naturelle (faire ce qu'on veut sans droit) de la
> liberté civile (ce que la volonté générale garantit à chacun). C'est ce mécanisme qui prouve
> quelque chose — pas le nom seul.*
>
> **[…:v1:03]** ⟨copie · « ce qu'il veut faire »⟩
> *Tu écris « ce qu'il veut faire » et « pour vivre » : ces formules restent vagues. Le lecteur ne
> sait pas exactement de quoi tu parles — ses désirs ? ses projets ? ses besoins vitaux ? Choisis un
> mot précis à la place de chacun. Un seul mot qui dit vraiment ce que tu veux dire, c'est plus fort
> qu'une tournure floue.*

⚠️⚠️ **ET SA PREMIÈRE LECTURE A TROUVÉ UN DÉFAUT : le retour INVENTE UN PASSÉ.** *« La fois
précédente, ces liens étaient presque absents »* — **il n'y avait aucune fois précédente**.
`competences_mesures` était **vide** avant la recette, **aucun `ÉTAT ANTÉRIEUR` n'a été poussé dans
le prompt** *(la chaîne ne l'écrit que « quand il existe », et « il n'existe pas à la semaine 1 : le
retour s'en passe alors, **sans le signaler à l'élève** »)*. **Le modèle a fabriqué un progrès à
partir de rien.** La règle 2 du gabarit l'y invite — *« quand l'état antérieur le permet, dis le
progrès »* — et **sa clause de garde n'est vérifiable par personne** : le modèle ne sait pas qu'il
n'a rien reçu, et le détecteur RR4 cherche des observables, des paliers et des notes, **pas une
histoire inventée**. ⛔ **Aucun `[faux]` posé** : le `07-` §4 est **GELÉ**, et il ne dit rien de faux
— il dit une chose que rien ne garde. **Registre des ouverts, item 49.**

---

## 10. ⚠️ LA SOURCE FAUSSE — le bloc `# SORTIE` de P2 perd deux des quatre tests

**Trouvé en portant le crible, la fiche sous les yeux.** Le §4 pose **quatre** tests —
`distinction`, `source`, **`sens`**, **`contour`** —, le volet `squelette` du bloc machine les
déclare tous les quatre avec leurs deux marques, et le module **lit les quatre dans la même liste
`crible.requalifications`**. **Le bloc `# SORTIE` du prompt de jugement, lui, n'en déclare que
deux** : `"test": "distinction | source"`, `"vers": "implicite | cosmetique"`, puis *« Aucun autre
champ »*.

⚠️⚠️ **CE QUE ÇA COÛTE, ET ÇA NE SE VOIT PAS.** Un juge fidèle à son schéma **n'émet jamais** de
requalification `sens` ni `contour` → **`garant_ambigu` et `garant_vague` valent structurellement
0** → ils sont **toujours réussis** au seuil `au_plus 0` du bloc machine, l'escalade N1/N2 est
aveugle sur eux, **et le seuil d'Acquis ne se ferme jamais sur une marque** alors que le libellé
Acquis du §2 l'exige. **Rien n'échoue, rien n'alerte : la chaîne tourne et deux observables sur neuf
sont morts.**

⛔ **Le prompt ne se retouche pas depuis une session Code.** `[faux]` posé à la fiche —
**volontairement HORS des marqueurs**, dans la prose qui introduit le prompt : *y écrire `[faux]`
l'enverrait au modèle*, le prompt étant dérivé. Correction écrite au registre des ouverts,
**dette D2**. ⚠️ **À traiter AVANT le Run 1** : après le premier run, réviser un prompt devient un
acte de calibration réglé par le protocole *(fiche §7)*.

*Le dérivé a été re-versé par `--ecris` : seule l'empreinte de la source a changé, le texte du prompt
est intact à l'octet.*

---

## 11. ⚠️ LE DÉSACCORD P1 ↔ P2 SUR LA MÊME UNITÉ — vu sur les trois tours réels

Chaque tour a rendu la même alerte :

> *requalification (rang 4, source) sans correspondance avec une unité « explicite » ou
> « implicite » — consignée, jamais appliquée*

**P1 a déclaré l'unité Rousseau `circulaire`** ; **P2 a voulu la requalifier en `cosmetique` au test
de la source**, qui ne mord que sur `explicite` et `implicite`. Le garde-fou
`requalification_inappariable` a fait exactement ce que la fiche demande — **consigner sans
appliquer** — et le résultat est que **`source_cosmetique` vaut 0 alors que la source cosmétique est
le défaut le plus visible de la copie**, et que le retour en parle très bien *(point 02, §9)*.

⛔ **Ce n'est pas un défaut du portage, et ce n'est pas un défaut à réparer** : les deux juges lisent
la même unité différemment, et le code refuse de trancher — c'est la doctrine. **Mais c'est un signal
de calibration de premier ordre**, et il est là dès le premier dépôt : soit le P1 sur-déclare
`circulaire` là où la fiche veut `implicite`, soit le P2 déborde de ses statuts d'entrée. **Le Run 1
dira lequel.** *Relevé au `SUIVI_tests_manuels.md`, C4L10A-15.*

---

## 12. Ce qui a été déposé, et où

- **`PLAN_DE_CHANTIER.md` §5, boîte aux lettres de `C4-L10`** — **sept items neufs (9 à 15)** pour
  les quatre reprises, plus la confirmation des huit du 22/08 : les trois écarts de langage et leur
  module partagé, l'épreuve négative qui doit commencer par la télémétrie, la population des
  `proportion`, les dénominateurs multiples, `document_p2` comme domicile de ce que `mesures` jette,
  et les durcissements du contrat.
- **`SUIVI_tests_manuels.md`** — une **section C4-L10 · Argumentation** *(12 entrées cochées avec
  leur preuve, 6 décochées avec leur condition de reprise nommée)*, et **cinq entrées cochées
  ailleurs** : `C4L5-2`, `C4L10-16`, `C4L11-A` *(la deuxième compétence branchée)* ; `C4L5-1bis` et
  `C4L10-14` voient **leur condition levée**, il ne leur reste que la relecture RR1-RR4 ;
  `C4L10-15` compte **quatre** compétences en attente, non cinq.
- **`INVENTAIRE_Non_Tranches.md`** *(dépôt de conception)* — **dette D2** *(le bloc `# SORTIE` de
  P2)*, **items 48** *(la population des `proportion`)* et **49** *(le retour qui invente un passé)*,
  et **l'item 47 amendé** : deux fiches sur deux ne définissent pas leur `delta`.
- **`competences/argumentation.md`** *(dépôt de conception)* — un **`[faux]`**, hors des marqueurs.

**Aucune migration, aucune ligne au `SUIVI_SQL.md`** : ce lot n'écrit rien en base et n'en attendait
aucune. **Aucun statut de recette posé, et aucun proposé.**

---

## 13. Les questions ouvertes que ce lot NE tranche pas

1. ~~**La population des deux `proportion`**~~ — ✅ **TRANCHÉE PAR LA FICHE 4.3, le jour même, dans
   le sens du portage** *(item 48 clos ; voir §14)*.
2. **Le `delta_v1_vf`** — la fiche se tait, comme celle de l'Expression *(item 47)*.
3. **`seuil_franchi` recouvre deux choses** — « n'a pas franchi » et « n'a pas pu » — et le contexte
   promis au branchement ne porte **ni l'objet, ni la section d'instance** *(`CONTRAT-MODULES.md`
   §8, `[à valider]`)*. **Le comportement du module est porté tel quel** : `oui`/`non`, jamais `n/a`.
4. **Le contrôle d'existence des citations** — obligatoire au contrat §3, **absent de ce module**
   comme de trois autres. **Non inventé ici** *(`[à valider]`, §8)*. *Le tour de recette a d'ailleurs
   vu le contrôle de l'**Expression** lever **2 citations infidèles** sur la même copie.*
5. **La latence à six compétences** — mesurée à deux *(47-52 s)*, extrapolation non faite.

---

## 14. ⭐ LA FICHE A BOUGÉ PENDANT LE LOT — 4.2 → 4.3, et dans le sens du portage

**Constaté à la clôture, sur pièce** : `competences/argumentation.md` porte **VERSION 4.3** *(mtime
08:53)*, et `copies-tests/_commun/config/argumentation.yaml` a été re-dérivée dans la foulée. Une
séance de conception a tourné en parallèle de celle-ci.

**Ce qu'elle change, et c'est exactement la question 3 du §6 :**

| Avant (4.2) | Après (4.3) |
|---|---|
| `sens` : « la majorité stricte **des unités** portent un garant cité » | « la majorité stricte **des unités DU DÉCOMPTE** portent un garant cité » |
| `sens` : « la majorité stricte **des unités** sont explicites après crible » | « la majorité stricte **des unités DU DÉCOMPTE** sont explicites après crible » |
| §5 : « **proportion d'unités** dont `garant_cite` ≠ `[absent]` » | « proportion **DES UNITÉS DU DÉCOMPTE** dont `garant_cite` ≠ `[absent]` » |
| §5 : « **proportion d'unités** `explicite` après crible » | « proportion **DES UNITÉS DU DÉCOMPTE** `explicite` après crible » |
| §5 : `nb_limites`, « **nombre** d'unités `limite`, écartées comprises » | « **part** d'unités `limite`, écartées comprises » |

⭐ **C'est mot pour mot la lecture que le branchement avait prise**, et pour le motif que la fiche
vient d'écrire. Le cinquième changement confirme en outre la division du `comptage rapporté` : c'est
bien une **part**, pas un nombre brut, que l'observable porte une fois la chaîne passée.

**Ce que ça a demandé** : **rien dans le code du portage.** L'instrument a été re-dérivé — il porte
**4.3**, `--verifie` dit **IDENTIQUE** —, et **le `[faux]` posé au §7 a survécu à l'amendement** *(il
est hors des marqueurs, et la séance de conception ne l'a pas retiré : la dette D2 reste ouverte)*.

⚠️ **UNE SEULE CHOSE ÉTAIT CASSÉE, ET C'EST UNE LEÇON** : la recette épinglait `'4.2'` **en dur**,
à deux endroits. Une version recopiée dans un contrôle rougit pour une raison qui n'en est pas une.
**Elle lit désormais `MANIFESTE_LU.competences.argumentation.version`** — ce qui doit être vrai,
c'est que l'instrument importé porte la version que le manifeste dérivé déclare ; savoir si le
dérivé a divergé de sa source, c'est le travail de `--verifie`, et de lui seul.

⚠️ **La leçon reste pour les quatre reprises** : les familles `proportion` **ne déclarent pas** de
`rapporte_a`, et leur population se lit dans le champ `sens`. *Déposée à la boîte aux lettres, item
12.*
