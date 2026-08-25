# PROMPT — Session Code : C4-L16 — Le cours déclare ce qu'il traite, et les sujets s'y rattachent seuls

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5. Ce que le lot construit, son manifeste et son « fait quand » font foi au `07-Implementation.md` §2 — ils sont recopiés ci-dessous avec **leurs versions au moment de l'écriture**, qui ne sont pas toutes celles que le manifeste nomme *(voir le contrôle d'entrée)*.
>
> ⭐ **Le lot tient en trois gestes, et le premier n'existe nulle part.** Un cours déclare ses notions ; le port de l'import passe au format 1.3 ; l'écran dit ce qui ne se rattache à rien. ⚠️ **Le motif est un compte** : quinze sujets à apparier un par un aujourd'hui, deux cents dans quelques semaines — quand ce que les sujets en banque déclarent tient en **cinq mots**. ⛔ **Et le lot ne porte PAS le filtre** *(piège 22 — il y a du neuf sur ce point depuis que le `07-` l'a écrit)*.

---

## Le manifeste — recopié du `07-Implementation.md` §2

> *Manifeste* : **ce document, §2** · `08-FORMAT_IMPORT.md` **v1.5, format 1.3**, §2 et §3 — VALIDÉ ET GELÉ · `01-routeur.md` **v5.6**, §4 couche 4 — VALIDÉ ET GELÉ · `generateur/verifie-import.py` *(les 60 vecteurs)* · `c4_l8_fabrique.sql` *(`exercices_sujets.cours_etat`, `exercices_sujets_cours`)* · `parcours_phase_a.sql` *(`scriptorium_contenus`)*.

« Ce document » est le `07-Implementation.md`. Les six pièces :

| Pièce | Où | Statut requis | Au moment de l'écriture |
|---|---|---|---|
| `07-Implementation.md`, **§2** | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | **aucun** — *« un lot n'exige pas un statut de la source qui le déclare »* *(`07-` §2)* | **VERSION 2.51** · RELU ET VALIDÉ · ⚠️ **régimes mêlés au §2** : la **règle de manifeste est GELÉE**, l'**inventaire des lots est OUVERT À L'IMPLÉMENTATION** *(en-tête du document)* |
| `08-FORMAT_IMPORT.md` — **§2 et §3 d'abord** | même dépôt | **relu et validé** *(explicite : « VALIDÉ ET GELÉ »)* | **VERSION 1.5, format 1.3** · ✅ **conforme au manifeste** |
| `01-routeur.md` — **§4, couche 4** | même dépôt | **relu et validé** *(explicite)* | **VERSION 5.6** · ✅ **conforme au manifeste** |
| `generateur/verifie-import.py` | même dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | ⚠️ **`--autotest` joue 64 vecteurs**, pas 60 — et **cinq sont à toi** *(pièges 1 et 2)* |
| `c4_l8_fabrique.sql` | **dépôt `palimpseste`, à la racine** | **déposé** | migration **JOUÉE en sandbox** — elle porte `exercices_sujets`, `exercices_textes` et leurs deux tables de rattachement |
| `parcours_phase_a.sql` | **dépôt `palimpseste`, à la racine** | **déposé** | migration **jouée** — elle porte `scriptorium_contenus`, la table du **cours** |

⚠️ **Le manifeste borne le `08-` à ses §2 et §3 ; le barème, lui, ne se borne pas.** *« Le statut porte sur le FICHIER, jamais sur la section. […] la section dit seulement où lire »* *(`07-` §2)*. **Tu liras donc aussi le §1** *(la forme du fichier, ce qu'une mineure a le droit de faire)* **et le §7** *(les refus, les signalements, le contrôle machine)* — et tu y trouveras trois phrases périmées que tu ne corrigeras pas *(pièges 3, 4 et 5)*. *Un prompt plus strict que sa source perd des données en silence.*

**Ce que chaque pièce fait ici.**

- Le **`07-` §2** porte **ta mission, ton « fait quand » et ton échéance** — recopiés en pièces 4 et 6 —, la **règle de manifeste**, la **règle de dette** *(« une session Code ne corrige jamais une source »)* et le **barème des statuts**. ⭐ **Son inventaire des lots est OUVERT** : tu l'amendes depuis ton relevé, sans accord préalable.
- Le **`08-` §3** est **la source du lot** : la table des champs d'un sujet, le paragraphe ⭐⭐ *« L'ÉTAT `"notions"` — POURQUOI IL EXISTE, ET CE QU'IL EXIGE EN FACE »*, les **deux gardes** *(forme normalisée, et l'écran qui propose)*, et la clause qui sépare les deux champs — *« l'un aide à trouver, l'autre autorise à servir »*.
- Le **`08-` §2** donne **le champ `cours` lui-même**, ses **quatre** états et le sens fort de l'absence, **et il pose `notions` sur `textes[]`** — *« même champ, même forme et même rôle qu'au §3 »*. Il dit aussi pourquoi l'import ne vérifie rien : *« l'appariement se fait à l'écran du dépôt »*.
- Le **`01-` §4, couche 4** dit **ce que le routeur fera de l'état** — *« servable dès qu'un cours vu déclare l'une de ses notions »* —, et il porte le motif : ⭐⭐ *« L'ÉTAT `notions` RETOURNE LE SENS DU TRI »*. ⛔ **Tu le lis pour savoir ce que tu fournis ; tu n'écris pas le filtre.**
- **`verifie-import.py`** est **le contrôle dont tu recopies les vecteurs**, et c'est lui qui fait foi : *« les mêmes verdicts sur les mêmes vecteurs »*. **C'est une pièce du manifeste : tu la lis, tu ne la modifies pas.**
- **`c4_l8_fabrique.sql`** et **`parcours_phase_a.sql`** sont **l'état de la base tel qu'il a été posé** — les colonnes, les `CHECK`, les commentaires. ⛔ **Ce sont des migrations JOUÉES : on ne les édite pas** *(les éditer les ferait mentir sur ce qui a tourné)*.

**Rien de plus : la règle de manifeste veut que ce qui n'y figure pas ne se lise pas** *(`07-` §2)*. Cinq précisions pour que la règle ne fasse pas trébucher :

- l'`AGENTS.md` du dépôt n'est pas une source : Claude Code le charge d'office, il porte les conventions du repo — **dont la règle SQL absolue** ;
- ⛔ **`SPEC_C3_exercices_competences.md` est ARCHIVÉE : elle ne fait foi sur rien, et elle ne se cite jamais.** Elle traîne à la racine du dépôt `palimpseste` — **ne l'ouvre pas**. Il en va de même de `FUSION_revues_C3.md`, de `revue_adversariale_SPEC_C3.md` et de `AMENDEMENTS_C3_en_attente_2026-07-31.md` ;
- ⛔ **aucun relevé de lot ne se lit** — ni `RELEVE_C4_L12_2026-08-24.md`, ni celui de C4-L8, ni celui de C4-L15. La règle de manifeste l'interdit, et ce n'est pas une privation : **ce que ces lots avaient à te dire est dans les pièges ci-dessous** ;
- ⛔ **le `INVENTAIRE_Non_Tranches.md` n'est pas à ton manifeste non plus** — sauf pour **y écrire** une dette, ce que la convention te demande. *Sa section DETTES va de D1 à D6 ; la tienne serait D7.*
- **le code du dépôt n'est pas une source, c'est ton terrain.** Les fichiers et les numéros de ligne nommés dans les pièges ont été **vérifiés à la fabrication**, ce sont des repères et non des autorités : **en cas de doute entre ce prompt et une source du manifeste, la source a raison.**

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

**Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, **cumulatifs** ; « VALIDÉ ET GELÉ » vaut *relu et validé*. *Vérifié à la fabrication : le `08-` est en **1.5 / format 1.3, VALIDÉ ET GELÉ**, le `01-` en **5.6, VALIDÉ ET GELÉ**, le `07-` en **2.51, RELU ET VALIDÉ** — **rien ne bloque**.*

**La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ci-dessus, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux. ⭐ **Les deux documents sont à leur version de manifeste : c'est le cas rare, et il tient parce que le lot est né hier.** ⚠️ **Ce qui a bougé est ailleurs — dans le script** *(pièges 1 et 2)*.

**Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot. ⚠️ *Ici la clause est sans objet : aucune fiche de compétence n'est à ton manifeste.* Elle est recopiée parce que la recette se recopie entière. **Ce qui, chez toi, est granulaire, c'est autre chose : tes trois gestes s'enchaînent.** Le geste 2 *(le port)* se joue seul ; les gestes 1 et 3 partagent la même colonne, et le 3 n'a rien à montrer sans le 1.

### Quatre contrôles machine à jouer AVANT d'écrire une ligne, et ils ne disent pas la même chose

```bash
python3 generateur/verifie-import.py --autotest
```

```bash
python3 generateur/verifie-import.py --banque generateur/banque/banque.json
```

```bash
npm test
```

```bash
python3 scripts/derive-doctrine.py --verifie
```

*(les deux premiers dans `palimpseste-conception`, les deux autres dans `palimpseste`)*

**1. `--autotest` doit rendre `✓ tout passe`.** C'est le contrôle **dont tu vas recopier les vecteurs**. ⚠️ **Mesuré au moment de l'écriture : `autotest : 64 vérification(s) jouée(s)` · `✓ tout passe`** — pas 60. **Le compte bouge sous toi, et tous les neufs ne sont pas à toi** *(pièges 1 et 2)*.

**2. `--banque` sur la banque réelle est ton étalon de non-régression.** *Mesuré à la fabrication : **`0 texte · 15 sujet · 152 matériau · 148 exercice` → `IMPORTABLE — 0 refus, 0 blocage(s), 0 signalement(s)`***. ⭐ **Zéro signalement, alors que les quinze sujets sont TOUS en `"cours": "notions"`** : ils déclarent tous au moins une notion, et toutes sont au programme. **Si ton port la refuse ou la signale, il est faux.**

**3. `npm test` doit rendre `fail 0`.** *Mesuré au moment de l'écriture : **tests 1451, pass 1451, fail 0, skipped 0**, en ~5,6 s.* ⚠️ **Note le compte avant de commencer** : un test qui disparaît est aussi silencieux qu'un test qui tombe, et **un vert n'est une preuve que si l'on sait combien de vert il y avait**. *La suite du port d'import seule — `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/register-ts-resolver.mjs --test utils/fabrique/verifie-import.test.ts` — en porte **66**, toutes vertes.*

**4. `derive-doctrine.py --verifie` — vert à la fabrication, et sans dette en attente.** La partie qui tourne sans base rend **`FIXTURE : IDENTIQUE`**, avec le résumé attendu *(13 objets · 9 crans · 15 patrons · 24 guides)*. **Les douze tables demandent que tu joues le SQL contre la sandbox** *(`> /tmp/verifie.sql`, puis `psql`)*. ⭐ **Le `SUIVI_SQL.md` ne porte AUCUNE re-dérivation créée et non jouée** : les trois passes du 24/08 sont toutes cochées Sandbox. *Si `--verifie` dit `DIVERGE`, c'est neuf, et ce n'est pas de ton fait — dis-le, joue `--sql` en un geste séparé et journalisé, **jamais au milieu de ton lot**.* ⛔ **Et ne corrige jamais la base à la main.**

> ⚠️ **Ton lot ne touche à AUCUNE table de doctrine.** Ce contrôle est là parce que la convention l'exige avant toute lecture de ces tables — et ton port d'import en lit *(la fixture)*. **Il n'est pas une invitation à re-dériver.**

---

## La mission — reprise du `07-Implementation.md` §2

*Reprise du `07-Implementation.md` §2, entrée C4-L16.*

**Rattacher chaque sujet à des cours, c'est refaire le travail à chaque sujet** : quinze aujourd'hui, deux cents dans quelques semaines. Le `08-` passe donc au **format 1.3** et ouvre un **quatrième état** du rattachement — **`"notions"`** —, et le `01-` §4 couche 4 une **troisième voie** : *servable dès qu'un cours vu déclare l'une de ses notions*.

⭐ **CE QUE LE QUATRIÈME ÉTAT RETOURNE.** Aux trois premiers, c'est le **matériau** qui désigne ses cours ; au quatrième, c'est le **cours** qui déclare ce qu'il traite, et le matériau s'y rattache tout seul. ⭐⭐ **Et il ne casse rien** : faire lire `notions` au routeur **sans le dire** changerait ce qu'un fichier ancien veut dire, et le `08-` §1 impose cela au **majeur** ; un état de plus, dont l'absence garde son sens, est une **mineure**.

### A. Le cours déclare ses notions — le geste pour lequel le lot existe, et il n'existe nulle part

Un champ neuf **côté plateforme, jamais côté fichier** : il ne s'importe pas, il se **saisit à l'écran du cours**. *Pour le tronc commun, les **notions** du programme ; pour HLP, les **thèmes** ou **chapitres** du semestre — **un seul champ**, une liste de mots libres, parce que deux champs feraient deux domiciles pour la même relation.*

⛔ **ET C'EST ICI QUE LE LOT SE JOUE, PAS DANS LE FILTRE.** Deux chaînes libres de part et d'autre — « la vérité », « Vérité », « La Vérité » — **ne se rencontrent jamais**, le sujet reste muet, et **rien à l'écran ne dit pourquoi**. **Deux gardes, et il les faut toutes les deux** : l'appariement se fait sur une **forme normalisée** *(minuscules, sans accents, article initial retiré)*, et **l'écran propose les notions DÉJÀ DÉCLARÉES par la banque** — *on ne rattache pas en tapant, on rattache en choisissant.*

### B. Le port de l'import passe au format 1.3

`cours` accepte la chaîne réservée **`"notions"`** ; `notions` entre aussi sur `textes[]`, **par symétrie** *(le `08-` §2 : « le même champ sur `textes[]` et sur `sujets[]` »)* ; et `cours_etat` gagne la valeur `'notions'` à son `CHECK` — **une migration additive**.

⚠️ **Les vecteurs se recopient SANS ADAPTATION.** Trois d'entre eux disent l'essentiel : l'état bien formé, l'état inconnu qui refuse, et **l'état « notions » AVEC UNE LISTE VIDE**, qui passe tous les contrôles, entre en banque et **ne sera jamais servi**. *C'est le défaut que le rattachement était fait pour éviter, retourné d'un cran : il se **signale**, il ne se refuse pas.*

### C. Ce que l'écran doit dire quand rien ne se rattache

Un sujet en `"notions"` qu'aucun cours ne réclame est **exactement aussi muet** qu'un sujet sans rattachement — et **bien plus trompeur, parce qu'il paraît rattaché**. L'écran de la banque doit **compter ces sujets-là à part**, et **nommer les notions orphelines** : *« quatre sujets attendent une notion qu'aucun cours ne déclare : la connaissance, le langage »*.

### Ce que ce lot NE porte PAS

- ⛔ **LE FILTRE DE LA COUCHE 4.** Le `07-` §2 est catégorique : *« Écrire le filtre ici en ferait un second domicile, et deux filtres de service divergeraient au premier amendement. »* ⚠️⚠️ **Mais l'état du monde a changé depuis que cette phrase a été écrite — lis le piège 22 avant de conclure quoi que ce soit.**
- ⛔ **le rattachement des textes d'auteur**, qui a déjà sa voie par le `plan_de_lecture` *(`08-` §2)* — le champ `notions` leur est ouvert, **rien de plus** ;
- ⛔ **la liste fermée des notions du programme**, qui serait une donnée de référentiel et **n'existe nulle part** *(voir le piège 8 : le script en porte une, et il dit lui-même que ce n'en est pas une)* ;
- ⛔ **la parade à l'imitation de surface** de C4-L3, qui compare des notions elle aussi et **ne se touche pas** *(pièges 7 et 23)* ;
- ⛔ **aucune règle neuve de conception.** Tout ce que ce lot sert est écrit, et gelé, depuis le 24/08.

---

## Les pièges — les décisions dont l'oubli coûte une migration

*Tirés des sources du manifeste et **vérifiés sur pièces à la fabrication**. Chacun porte son renvoi. **En cas de doute entre ce prompt et la source, la source a raison.***

### Le compte des vecteurs, et à qui ils sont

**1. ⚠️⚠️ LE COMPTE DE VECTEURS EST UNE CIBLE MOUVANTE : 57 → 60 → 62 → 64.** Le `07-` §2 en annonce **60** ; **la fabrication en a mesuré 64**, `✓ tout passe`. ⛔ **N'écris jamais un nombre dans un « fait quand » ni dans un test.** La règle de la source ne parle pas de nombres : *« ce que tu construis doit rendre **LES MÊMES VERDICTS SUR LES MÊMES VECTEURS** »*. **Mesure à l'entrée, mesure à la sortie, et rapporte les deux.**

**2. ⭐⭐ CINQ VECTEURS SONT À TOI, ET DEUX NE LE SONT PAS — attribue-les un par un.** Vérifié à la fabrication par `git log -- generateur/verifie-import.py` :

> - `87072d6` *(« Les sujets se lient à des notions », 24/08 14:29)* — **trois vecteurs : ILS SONT À TOI.** *« l'état « notions » du format 1.3 est bien formé »* · *« « notions » sans notions ne sera JAMAIS servi, et on le dit »* *(un **signalement**)* · *« R5 une autre chaîne réservée n'existe pas »* *(`cours: "notion"`, au singulier — **un refus n° 5**)*. ⭐ **Le troisième est la moitié de la preuve** : sans lui, un port qui accepterait n'importe quelle chaîne passerait les deux premiers.
> - `fd557a7` *(« la connaissance n'est pas une notion du programme », 24/08 17:53)* — **deux vecteurs de plus : ILS SONT À TOI AUSSI.** *« une notion hors du programme ne se rattachera à aucun cours »* *(signalement)* et son **pendant négatif** *« et un sujet HLP n'est pas regardé — son programme est en thèmes, que rien ne déclare »*. ⚠️ **Ces deux-là sont plus récents que l'entrée du `07-`, qui ne les connaît pas.**
> - `3073c19` *(« La vague 1 rentre »)* — **deux vecteurs du signalement « le second cas répète la consigne du premier, à un cran où l'appui est NOMMÉ » : ILS NE SONT PAS À TOI.** Ils naissent d'une règle du `02-` §2.3.1 a **que ton manifeste ne te donne pas**, et C4-L15 les a laissés pour la même raison. ⛔ **Ne les porte pas ; rapporte l'écart qui reste, avec sa cause et son destinataire.**

### Le `08-` est GELÉ, et il porte trois phrases périmées

**3. ⛔⛔ LE REFUS N° 5 DU §7.1 REFUSERAIT TON ÉTAT — ET C'EST LE DOCUMENT QUI EST EN RETARD.** Il écrit : *« un `cours` mal formé **(ni `"generique"`, ni une liste de chaînes)** »*. Or le **§2 et le §3 du même document** déclarent **quatre** états, `"notions"` compris, et **le script accepte `"notions"`** *(vérifié : `if c is None or c == [] or c in ("generique", "notions"): return`)*. **Le §7.1 n'a pas suivi.** ⛔ **Le `08-` est GELÉ : tu ne l'amendes pas.** **Tu suis le §2/§3 et le script, tu marques `[faux]` au point de l'erreur, et tu portes la ligne à la section DETTES du `INVENTAIRE_Non_Tranches.md`.**

**4. ⚠️ LE §3 DIT ENCORE « MÊMES TROIS ÉTATS » DANS SA PROPRE TABLE.** La ligne `cours` du tableau des champs d'un sujet renvoie au §2 pour *« mêmes **trois** états »*, quand la prose du même §3, dix lignes plus bas, en explique **quatre**. **Même traitement qu'au piège 3 : la prose gagne, la table est en dette.** *Une seule ligne au registre peut porter les trois désordres du `08-` ; ne fais pas trois lignes de ce qui est un seul retard.*

**5. ⚠️ LE §1 EST PÉRIMÉ DEUX FOIS, ET LA 1.3 N'Y A PAS SON PARAGRAPHE.** Son exemple JSON déclare `"version": "1.2"` ; son avertissement dit *« La ligne VERSION est à 1.3 et le format à 1.2 »*, quand l'en-tête porte **1.5 / format 1.3** ; et là où les mineures **1.1** et **1.2** ont chacune leur paragraphe *« ce qu'elle change pour un fichier ancien »*, **la 1.3 n'en a aucun**. ⛔ **Ne les corrige pas.** ⭐ **Mais lis le raisonnement du §1, parce que c'est lui qui autorise ton lot** : *« une mineure n'ajoute que des champs facultatifs, dont l'absence a toujours un sens défini ; casser la compatibilité, c'est incrémenter le majeur »*.

**6. ⚠️⚠️⚠️ `notions` SUR `textes[]` : LA SOURCE LE DÉCLARE, ET LE SCRIPT LE REFUSE. C'est le seul vrai conflit du lot.** Le `08-` §2 porte la ligne *« `notions` — les notions du programme que ce texte met en jeu, **même champ, même forme et même rôle qu'au §3** »*, et le `07-` §2 te demande explicitement de le porter. **Or `CLES["texte"]` de `verifie-import.py` ne contient pas `notions`** — vérifié **en le jouant** : un texte qui le porte sort en **`✗ [R02] clé « notions » que le 08- ne déclare pas`**. ⭐⭐ **Et le même script LIT `texte.notions` vingt lignes plus loin**, dans son propre signalement *(`for nom, liste in (("sujet", sujets), ("texte", textes))`)* : **le champ était voulu, seule la déclaration manque.**

> **Ce que tu fais.** La position que la fabrication tient pour juste : **le `08-` §2 est GELÉ et il fait foi ; le port accepte `notions` sur un texte**, et **l'écart avec le script est rapporté, pas recopié**. ⛔ **Tu ne modifies pas `verifie-import.py`** — c'est une pièce de ton manifeste. ⭐ **Tu écris un test qui ÉPINGLE ton choix**, tu dis au relevé que ce vecteur-là est le seul où les deux ne rendent pas le même verdict, **et pourquoi**, et tu portes la ligne au registre avec les pièges 3 et 4. ⚠️ **Si tu tranches dans l'autre sens** *(refuser, pour rester octet pour octet aligné sur le script)*, alors **`notions` n'entre pas sur les textes, et le geste B est amputé de sa moitié** : dis-le, ne le laisse pas se découvrir.

### La forme normalisée — deux normalisations existent déjà, et elles se contredisent

**7. ⛔⛔ NE FAIS PAS UNE TROISIÈME NORMALISATION, ET SURTOUT NE LES UNIFIE PAS.** Le dépôt en porte deux, et **l'asymétrie de risque y est INVERSE** :

> - **`plie()`** — `utils/fabrique/verifie-reference.ts:107` — fait **exactement** *« minuscules, sans accents »* : `NFD` → retrait des marques `Mn` → `toLowerCase()` → puis ce que `casefold()` de Python fait en plus *(eszett, ligatures, sigma final, micro)*. **Elle est écrite contre Python, éprouvée par `divergences.test.ts`, et son commentaire porte les deux pièges** *(NFKD n'est pas NFD ; l'ORDRE — minusculiser AVANT de replier l'eszett)*. ⭐ **C'est la tienne**, à l'article initial près.
> - **`replie()`** — `utils/deroule/demonstration.ts:123` — fait `trim().toLowerCase()` **et rien d'autre, délibérément** : *« pas de repli d'accents […] un rapprochement approximatif ÉCARTE À TORT, et écarter à tort PRIVE L'ÉLÈVE DE SA DÉMONSTRATION EN SILENCE […] on préfère donc le faux négatif au faux positif »*.
>
> ⚠️⚠️ **Les deux comparent des `exercices_sujets.notions`, et elles doivent rester différentes.** Chez toi, **ne pas apparier rend le sujet muet pour toujours** — le faux négatif est le défaut à éviter. Chez la parade, **apparier à tort prive l'élève** — le faux positif est le défaut à éviter. ⛔ **Ne touche pas à `replie()`, ne la remplace pas par la tienne, et donne à la tienne un nom qui dit ce qu'elle sert.** *Deux règles opposées dans le même dépôt sur la même colonne : écris-le en commentaire, aux deux endroits, sans quoi le prochain les « harmonisera ».*

**8. ⚠️ « L'ARTICLE INITIAL RETIRÉ » N'EST ÉCRIT NULLE PART EN DÉTAIL — c'est trois mots, et c'est à toi.** Ni le `08-` §3 ni le `01-` §4 ne disent **lesquels** *(`le`, `la`, `les`, `l'`, `un`, `du` ?)*, ni ce qu'on fait d'une notion qui n'en a pas. ⭐ **Décide, écris la liste dans le code avec son motif, fixe-la par un test discriminant, éprouve-la sur les cinq notions réelles, et relève-la.** ⚠️ **Et vérifie ce que le retrait fait entrer en collision** avant de le poser : deux notions distinctes qui se replient sur le même mot rattacheraient un sujet à un cours qui ne parle pas de lui.

**9. ⛔⛔ LE SCRIPT COMPARE SANS NORMALISER, ET TU RECOPIES SON COMPORTEMENT TEL QUEL.** `NOTIONS_TC` de `verifie-import.py` porte **dix-sept chaînes avec leurs articles et leurs capitales** — `"l'art"`, `"l'État"`, `"la vérité"` — et le contrôle est un `in` **exact** : *« La Vérité »* y serait signalée **hors programme**. ⚠️ **Ce n'est pas un défaut à réparer dans ton port** : *« les mêmes verdicts sur les mêmes vecteurs »*. ⭐ **C'est un fait à porter au relevé** — le contrôle d'import et l'appariement de la plateforme **ne replient pas de la même façon**, et le second est celui que la source décrit.

**10. ⚠️ ET CETTE LISTE N'EST PAS UNE DONNÉE DE DOCTRINE — le script le dit lui-même.** *« ⛔ Ce n'est PAS une donnée de doctrine : aucune source du chantier ne les porte, et le `08-` §3 dit que `notions` est "une liste de mots". Elles sont ici parce qu'un mot hors de cette liste ne se rattachera à AUCUN cours. »* ⛔ **Ne la fais pas entrer en base, ne la dérive pas, et n'en fais pas une liste fermée à l'écran** — le `07-` §2 te retire explicitement *« la liste fermée des notions du programme »*. **Le champ reste libre ; c'est l'écran qui guide, pas une contrainte.**

### Le champ côté cours — où il vit, et ce qu'il ne doit pas être

**11. ⛔ `scriptorium_contenus.tags` EXISTE, IL EST VIDE, ET IL N'EST PAS TON CHAMP.** `parcours_phase_a.sql:45` : `tags text[] not null default '{}',  -- optionnel (recherche/filtre)`. **S'en servir ferait d'un champ libre et facultatif une condition de service.** ⭐ **Une colonne propre : `notions text[]`, symétrique de `exercices_sujets.notions`** — *« même nom, même forme, l'appariement est une intersection »* *(`07-` §2)*.

**12. LE COURS EST UN `scriptorium_contenus` DE `type = 'cours'`, ET IL A DEUX ÉCRIVAINS.** `app/prof/scriptorium/actions.ts:721` *(`creerContenuBiblio`)* et `:775` *(`modifierContenuBiblio`)* ; à l'écran, `BibliothequeContenus.tsx` → `FormulaireContenuBiblio.tsx` *(création)* et `LigneContenuBiblio.tsx` *(édition en ligne)*. ⚠️ **Il y a un TROISIÈME site d'insertion dans cette table — `utils/fabrique/import-ecriture.ts:213` — et ce n'est PAS un cours** : c'est le corps d'un texte d'auteur importé, qui entre au corpus du Scriptorium. **N'y ajoute rien.**

**13. ⭐ LA CLÉ DU COURS EST DÉJÀ LA MÊME DES DEUX CÔTÉS — n'en invente pas une seconde.** `exercices_sujets_cours.cours_id` et `exercices_textes_cours.cours_id` référencent `scriptorium_contenus(id)` *(`c4_l8_fabrique.sql`)*, et « vu » se lit sur **la même clé** : `lireLesCoursVus` *(`utils/moteur/vivier-serveur.ts`)* collecte des `contenuCle`, et `utils/scriptorium-corpus.ts:72` dit ce que c'est — *« le COURS porteur (`scriptorium_contenus.id`) »*. **Ton champ se pose sur cette ligne-là, et l'intersection se fera dessus.**

**14. ⚠️ `/prof/scriptorium` N'EST PAS DERRIÈRE `fabrique_actif` — c'est un écran VIVANT.** Le dépôt du corpus l'est *(`app/prof/corpus/page.tsx` affiche l'avertissement quand le drapeau est OFF)* ; la bibliothèque du Scriptorium, non : **des cours réels y sont créés et modifiés aujourd'hui**. ⛔ **Ajoute un champ, ne réordonne rien, ne renomme rien**, et **éprouve que la création et la modification d'un cours marchent encore** — y compris le chemin de confirmation qui efface la découpe quand le texte change *(`modifierContenuBiblio`, garde L2)*.

### La migration — « une ligne additive » est faux deux fois

**15. ⚠️⚠️ UN `CHECK` INLINE NE S'ÉTEND PAS : IL SE DROPPE ET SE RECRÉE.** `c4_l8_fabrique.sql:421` porte `cours_etat text not null default 'aucun' check (cours_etat in ('generique','liste','aucun'))` — **une contrainte inline, auto-nommée par Postgres**. ⭐ **Le patron existe déjà au dépôt, suis-le** : `plan_evaluation_modele.sql:143-147` fait `drop constraint if exists <table>_<colonne>_check;` puis `add constraint <même nom> check (…)`, **avec le commentaire qui dit pourquoi**. ⚠️ **Le geste élargit, il ne rétrécit pas : aucune ligne existante ne peut le violer.** *Mais il n'est pas « additif » au sens naïf — il passe par un `drop`, et le protocole des tables vivantes s'applique.*

**16. ⛔⛔ IL Y A DEUX TABLES, PAS UNE — ET LE MANIFESTE NE NOMME QUE LA PREMIÈRE.** `exercices_sujets.cours_etat` *(ligne 421)* **et** `exercices_textes.cours_etat` *(lignes 347-348)* portent **le même `CHECK` à trois valeurs**. Le `08-` §2 donne les **quatre** états au **même champ sur `textes[]`**, et le `07-` §2 n'écrit `exercices_sujets` que par raccourci. ⛔ **Élargir une seule des deux ferait échouer l'import d'un texte en `"notions"` — sur une contrainte, donc bruyamment, ce qui est la seule bonne nouvelle de l'affaire.**

**17. ⚠️ ET UNE COLONNE MANQUE, DU CÔTÉ DES TEXTES.** `exercices_sujets.notions text[] not null default '{}'` **existe** *(ligne 419)* ; **`exercices_textes` n'a AUCUNE colonne `notions`** — vérifié. Si tu portes le geste B en entier *(piège 6)*, **la migration en pose une, à l'identique**.

**18. ⚠️⚠️ `not null default '{}'` VEUT DIRE QU'IL N'Y A PAS DE « NON DÉCLARÉ » — et l'autre table fait l'inverse.** Chez les sujets, `{}` est la seule forme du vide. Chez les démonstrations, `exercices_demonstrations.notions` est **NULLABLE**, et C4-L3 en a fait une règle : *« `NULL` = ne déclare rien ; `{}` = déclare n'avoir aucune notion »* — la démonstration qui ne déclare rien **est servie, et le professeur en est averti** *(`c4_l3_deroule.sql` §3 ; `utils/deroule/demonstration.ts`)*. ⛔ **Deux régimes, deux tables, deux raisons : ne les aligne pas en passant.** ⭐ **Pour ton champ côté cours, `not null default '{}'` est la forme qui va** — un cours sans notions déclarées ne réclame rien, et c'est un fait, pas une absence de saisie.

**19. ⛔ N'ÉDITE PAS `c4_l8_fabrique.sql` — MAIS SON COMMENTAIRE DEVIENT FAUX.** Il dit de `notions` : *« une liste de mots **QU'AUCUNE RÈGLE NE LIT** — elle sert au professeur qui cherche »*. **Ton lot rend cette phrase fausse** — et le `08-` §3 la corrige déjà : *« elle sert au professeur qui cherche, **et le routeur la lit quand `cours` vaut `"notions"`** »*. ⚠️ **Éditer une migration jouée la ferait mentir sur ce qui a tourné.** ⭐ **Pose un `comment on column` neuf dans TA migration** : c'est le commentaire en base qui fait foi pour qui lit le schéma.

**20. ⚠️ LE ROLLBACK RÉTRÉCIT, ET UN RÉTRÉCISSEMENT PEUT ÉCHOUER.** Remettre le `CHECK` à trois valeurs **lèvera** s'il reste une ligne à `'notions'`. ⛔ **Dis dans le fichier ce qu'il fait de ces lignes** — les ramener à `'aucun'` *(le sens fort, donc sans risque de servir à tort)*, ou refuser de tourner. **Et journalise-le** : le rollback a sa propre ligne au `SUIVI_SQL.md`, comme les autres.

### Le port de l'import — la moitié invisible

**21. ⛔⛔ `import-ecriture.ts` FAIT TOMBER `"notions"` DANS `'aucun'`, EN SILENCE, ET À DEUX ENDROITS.** Vérifié, lignes **246** *(les textes)* et **297** *(les sujets)* : `const coursEtat = cours === 'generique' ? 'generique' : (Array.isArray(cours) && cours.length > 0) ? 'liste' : 'aucun'`. **Une chaîne `"notions"` n'est ni `'generique'` ni un tableau : elle sort en `'aucun'` — « JAMAIS SERVABLE ».** ⚠️⚠️ **C'est la moitié invisible de ton lot** : le contrôle d'import dirait `IMPORTABLE`, l'écran afficherait quinze sujets, **et les quinze seraient morts**. *Le `CHECK` élargi ne rattrape rien ici : le code n'écrit jamais la valeur.*

**22. ⚠️⚠️⚠️ `C4-L12` EST JOUÉ, ET SON FILTRE NE LIT QUE TROIS ÉTATS. C'est le fait le plus neuf de ce prompt.** Le `07-` §2 et le `PLAN_DE_CHANTIER.md` §3 parlent tous deux de C4-L12 **au futur** — *« C4-L12 lira donc QUATRE états au lieu de trois, et son "fait quand" doit le dire »*. **Ils ont été écrits à 14 h 29 ; le lot a été commité à 14 h 43** *(`b16e074`)*. Vérifié dans le code livré :

> - `utils/moteur/vivier.ts:51` — `coursEtat: 'generique' | 'liste' | 'aucun'`, *« le domaine est celui de la colonne »* ;
> - `filtreDuCoursVu` *(ligne 254)* écarte sur `'aucun'`, laisse passer `'generique'`, **et traite TOUT LE RESTE comme `'liste'`** : un `'notions'` y sortirait en **`cours_non_apparie`** — *« N cours déclaré(s), AUCUN apparié »* —, alors qu'il n'y a **aucun** cours déclaré à apparier. **Le motif serait FAUX**, et il enverrait chercher la réparation à l'écran du rattachement, où il n'y a rien à faire.

> **Ce que tu fais.** ⛔ **Le filtre de la couche 4 en `notions` n'est PAS à toi** : ne va pas chercher les notions des cours vus, ne calcule pas l'intersection dans le vivier, **n'ouvre pas la troisième voie**. ⭐ **Mais un motif faux n'est pas « pas de filtre » : c'est un filtre qui ment.** La position que la fabrication tient pour juste : **fais nommer l'état par ce qu'il est** — un motif d'écart explicite, qui dit *« rattachement par notions : la couche 4 ne le lit pas encore »* —, **et rien de plus**. *Le sujet reste écarté, exactement comme aujourd'hui ; c'est le motif qui cesse de mentir.* ⚠️ **Si tu ne le fais pas, dis-le, et dis à qui tu le laisses.** ⭐ **Et dans les deux cas, amende l'entrée `C4-L12` de l'inventaire du `07-` §2** — il est **OUVERT À L'IMPLÉMENTATION**, tu l'amendes depuis ton relevé **sans accord préalable** : *ce n'est pas une dette, c'est ton travail.*

**23. ⛔ NE TOUCHE PAS À `notionsDeLExercice` — c'est la parade d'un autre lot.** `utils/deroule/vue.ts:662` ne lit les notions **que des sujets** *(source et cible)*, et les passe à la parade de C4-L3. **Si tu poses `notions` sur `exercices_textes`, cette fonction devient asymétrique** — et l'élargir **écarterait des démonstrations qu'elle servait hier**, sans qu'aucun test ne tombe. ⛔ **Laisse-la telle quelle et relève-le** : c'est une conséquence de ton lot, pas une réparation à faire en passant.

**24. ⚠️ `VERSION_IMPORT = '1.2'` PASSE À `'1.3'`, ET CE N'EST PAS UNE PREUVE.** `utils/fabrique/doctrine.ts:44`. C4-L15 avait pour consigne de **ne pas y toucher** — *« le faire passer à 1.3 sans porter ce que la 1.3 ajoute serait mentir sur ce que le port sait faire »* : **c'est ton lot qui porte ce que la 1.3 ajoute, donc c'est toi qui la bouges.** ⛔ **Mais le contrôle ne lit que la MAJEURE** *(`majeure !== VERSION_IMPORT.split('.')[0]`)* : **changer la constante ne change aucun verdict**. *Ne la confonds pas avec la preuve du port ; la preuve, ce sont les cinq vecteurs.*

**25. LE SIGNALEMENT NEUF S'AJOUTE, IL NE REMPLACE PAS L'AGRÉGÉ.** `verifie-import.ts:418` compte `!x.cours` en **une seule ligne agrégée** — *« la ligne disparaît dès que le professeur a trié »* *(`08-` §7.3)*. ⚠️ **Un sujet en `"notions"` A un `cours` : il n'entre pas dans ce compte, et c'est juste.** Le tien est autre chose : **par entrée**, sur `cours === 'notions' && notions vide`, et il **signale, il ne refuse jamais** — *« `0` = importable (blocages et signalements possibles), `1` = au moins un refus »* *(`08-` §7.4)*. ⛔ **Et ne change pas la signature de `controleImport`** : *« c'est un contrat avec `divergences.test.ts` »*.

### L'écran de la banque, et ce que « orphelin » veut dire

**26. OÙ ÇA VIT, ET CE QUI Y EST DÉJÀ.** `app/prof/corpus/`, onglet **« Le rattachement au cours »** *(`Rattachement.tsx`)*. ⭐ **Le compte à part a déjà son voisin** : la ligne **145** compte `sujets.filter((s) => s.coursEtat === 'aucun').length`. Et `FormeCours` porte un `<select>` **à trois `<option>`**, dont les libellés disent le sens *(« rien de déclaré — jamais servable »)* : **il en faut une quatrième, et son libellé doit dire ce que l'état veut dire** — *« notions — servable dès qu'un cours déclare l'une d'elles »*.

**27. ⭐ LES DEUX BANQUES SE CROISENT DÉJÀ SUR CET ÉCRAN — n'ajoute pas un second chargement.** `app/prof/corpus/page.tsx:91` charge déjà **les cours du Scriptorium** *(`scriptorium_contenus`, `type = 'cours'`, `id, titre`)* pour peupler les `<select>` d'appariement. **Ajoute `notions` à ce `select`-là**, et l'écran a tout ce qu'il faut pour nommer les orphelines. ⚠️ *Et l'écran affiche les sujets par leur `enonce` : il ne montre pas encore leurs `notions`. Il devra.*

**28. ⛔ « ORPHELINE » SE DIT SUR TOUS LES COURS, PAS SUR LES COURS VUS.** *« Aucun cours ne déclare cette notion »* est un fait de **conception** — le professeur n'a pas encore rempli, ou il a écrit un autre mot. *« Le cours n'a pas encore été vu »* est un fait de **routage**, et c'est le filtre, qui n'est pas à toi. ⚠️ **Les confondre à l'écran ferait crier une alerte chaque début de semestre**, quand rien n'a encore été vu et que tout est pourtant bien déclaré.

**29. ⚠️ ET LA COUVERTURE EST CE QU'ELLE EST — ton écran va la rendre visible.** Mesuré à la fabrication sur `generateur/banque/banque.json` : **15 sujets, tous en `"cours": "notions"`, tous `dissertation_tc`**, et **cinq notions distinctes** — `la vérité` (9) · `la science` (6) · `la raison` (6) · `le langage` (6) · `la nature` (4). **Le programme du tronc commun en porte dix-sept.** ⛔ **Ce n'est pas ton lot de le réparer** — mais ton écran le dira, et il faut que ce soit au relevé plutôt que découvert un lundi.

**30. ⚠️ NE RÉÉCRIS NULLE PART « SIX NOTIONS ».** Le `07-` §2 et le `PLAN_DE_CHANTIER.md` écrivent *« les notions du programme sont six »*. **C'est faux deux fois** : le programme en compte **dix-sept**, et ce que les quinze sujets déclaraient était **six** jusqu'à ce que `la connaissance` en sorte le 24/08 *(commit `fd557a7`)* — **il en reste cinq**. *Le chiffre était une mesure de la banque prise pour une donnée du référentiel.* ⛔ **N'écris aucun de ces nombres dans le code, dans un test ou dans un « fait quand ».**

### Deux choses transverses, vérifiées à la fabrication

**31. LE DÉPÔT EST PROPRE, ET IL VIENT DE BOUGER.** `git status` était **vide** à la fabrication, dans les deux dépôts. ⚠️ **C4-L15 a été commité une heure plus tôt** *(`49fefc4`, 24/08 20:27)* et **il a touché ton terrain** : `utils/fabrique/verifie-import.ts`, `utils/fabrique/doctrine.ts`, `scripts/derive-doctrine.py`, plus deux migrations et la fixture. **Relis ces fichiers plutôt que de te fier à un souvenir**, et vérifie `git status` avant d'écrire.

**32. ⚠️ L'ORDRE DES GESTES N'EST PAS INDIFFÉRENT.** La migration d'abord *(elle ne sert rien à personne tant que rien ne l'écrit)*, puis l'écriture à l'import et la saisie au cours, puis l'écran. ⛔ **Ne joue pas le port avant d'avoir la colonne** : le port écrirait `'notions'` dans un `CHECK` qui le refuse, et tu passerais la séance à débusquer une erreur de contrainte qui n'était qu'un ordre.

---

## Le « fait quand » — recopié du `07-Implementation.md` §2

*Recopié du `07-Implementation.md` §2. C'est la condition de recette, et **elle ne se négocie pas en séance**.*

- un cours **déclare ses notions à l'écran**, **en les choisissant dans celles que la banque connaît** ;
- un sujet importé avec `"cours": "notions"` et `"notions": ["la vérité"]` **devient servable dès qu'un cours déclare « la vérité »**, **sans re-import et sans qu'on touche au sujet** ;
- « la Vérité » et « la vérité » **se rattachent au même cours** ;
- un sujet dont **aucune notion n'est réclamée** **est compté à part et sa notion nommée** ;
- et `verifie-import.ts` rend **les mêmes verdicts** que `verifie-import.py --autotest` sur ses **60** vecteurs.

⚠️ **La dernière clause porte un nombre qui a vieilli** *(pièges 1 et 2)*. **Ce qu'elle demande, et que tu dois tenir, c'est l'égalité des verdicts sur les vecteurs QUI SONT LES TIENS** — les cinq de `87072d6` et `fd557a7` —, plus la non-régression sur tout ce qui était déjà porté. **Les deux de `3073c19` ne sont pas à toi : dis-le, ne les porte pas.**

⚠️⚠️ **Et la deuxième clause contient un piège de recette.** *« Devient servable »* est un fait de **couche 4**, et **la couche 4 n'est pas à toi** *(piège 22)*. **Ce que tu peux prouver en séance, c'est que tout ce dont la couche 4 a besoin est là et juste** : l'état écrit en base, les notions déclarées des deux côtés, l'intersection normalisée qui rend le bon cours. **Ce que tu ne peux pas prouver se dit — et part au `SUIVI_tests_manuels.md`, décoché, avec sa condition de reprise nommée.**

*Échéance* : **avant la première semaine servie.** ⚠️ *Sans lui, la banque entière est muette : les 15 sujets portent `"cours": "notions"` depuis le 24/08, et rien en face ne les réclame.* **Le repli, s'il fallait servir avant, est `"generique"` sur les 15 sujets — une ligne, et le lot redevient un confort.**

---

## Les conventions — `PLAN_DE_CHANTIER.md` §5

### Du dépôt

**Une ligne au `SUIVI_SQL.md` AVANT exécution, jamais après** — date, fichier, zone, cases Sandbox/Prod. **Ta migration en aura une, son rollback aussi.** **Toute migration est additive et gatée** : les **six** interrupteurs restent à OFF jusqu'à la recette — `fabrique_actif`, `exercices_actif`, `routeur_actif`, `competences_affichage_actif`, `passation_classe_actif`, `chaine_actif`. ⚠️ **Le reste du protocole n'est pas ici : il est en tête du `SUIVI_SQL.md`, règle R6** — sandbox d'abord, ne jamais rejouer un fichier de l'Archive, **protocole renforcé sur les tables vivantes**, **répétition à blanc sur le CORPS du fichier**. **Lis-le avant d'écrire ta migration** *(c'est aussi la règle absolue de l'`AGENTS.md`)*. ⚠️ **`scriptorium_contenus` est une table VIVANTE** — des cours réels y vivent : le protocole renforcé s'y applique.

**La doctrine en base est dérivée, jamais tapée, et il n'y a qu'un dériveur.** Avant de lire ces tables, `python3 scripts/derive-doctrine.py --verifie` doit dire **IDENTIQUE** sur les **douze** tables, les empreintes de source et la fixture. **S'il dit DIVERGE, rejouer `--sql` ; jamais corriger la base à la main.** ⭐ *Ton lot ne pose aucune donnée de doctrine : `notions` est une **saisie**, jamais une dérivation.*

### De clôture

**Ta section au `SUIVI_tests_manuels.md`**, au moment où le lot se clôt : ce qui a été **prouvé en séance, coché avec sa preuve**, et ce qui **reste à jouer en recette, décoché, avec sa condition de reprise nommée**. *Un reste de recette qui ne vit que dans un relevé ne se rappelle à personne.* ⭐ **Deux de tes cinq clauses ne se prouvent qu'à l'écran** *(la saisie par choix, et le compte des orphelines)*, **et une ne se prouve pas du tout tant que la couche 4 ne lit pas l'état** : ce sont exactement celles-là qui doivent y figurer.

### De dette

**Une source trouvée fausse se MARQUE, elle ne se corrige pas** *(`07-` §2)*. Deux gestes : **`[faux]`** au point de l'erreur, et **une ligne à la section DETTES** du `INVENTAIRE_Non_Tranches.md`, qui porte l'**avant / après**. *La section va de D1 à D6 ; la tienne serait D7.* ⭐ **Tu as au moins un candidat, et il en porte trois** : le `08-` §7.1 refus n° 5, le §3 dans sa table, et le §1 dans son exemple *(pièges 3, 4 et 5)* — **plus, peut-être, le désaccord du script sur `notions` dans un texte** *(piège 6)*. ⚠️ *Ne confonds pas avec l'**inventaire des lots du `07-` §2**, qui est **OUVERT À L'IMPLÉMENTATION** : celui-là, tu l'amendes depuis ton relevé, sans accord préalable — ce n'est pas une dette, c'est ton travail.*

### D'ouverture de compétence

⚠️ **Sans objet ici** — ce lot n'ouvre aucune compétence dans la chaîne. La convention est recopiée parce que la recette se recopie entière ; **ne joue pas `derive-instruments.py`**.

---

### Et ce que ton relevé doit porter

Le nom du fichier : `RELEVE_C4_L16_2026-08-XX.md`, à la racine du dépôt `palimpseste`. **Sept choses au minimum**, en plus du récit :

1. **ce que tu as tranché sur `notions` dans un `texte`** *(piège 6)* — porté ou non, et **le verdict exact** que le script rend sur ce vecteur, en face du tien ;
2. **l'attribution des vecteurs, un par un** *(piège 2)* : ceux que tu as portés, ceux que tu as laissés, et à qui — avec les comptes mesurés à l'entrée et à la sortie, **des deux côtés** ;
3. **la forme normalisée que tu as posée** *(pièges 7 et 8)* — la liste d'articles retirée, son motif, ce qu'elle fait entrer en collision, et **pourquoi elle ne remplace pas `replie()`** ;
4. **ce que tu as fait du motif d'écart du vivier** *(piège 22)*, et **ce que tu as amendé à l'entrée `C4-L12` de l'inventaire du `07-` §2** ;
5. **la migration** : les deux tables élargies, la ou les colonnes posées, ce que le rollback fait des lignes en `'notions'`, et **les lignes correspondantes au `SUIVI_SQL.md`** ;
6. **l'état de la couverture** *(piège 29)* — combien de notions déclarées par la banque, combien par les cours, combien d'orphelines le jour de la séance ;
7. **ce qui reste à jouer en recette**, avec sa condition de reprise — parce que c'est cela qui part au `SUIVI_tests_manuels.md`, et de là à la recette du flux.
