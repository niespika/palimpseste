# PROMPT — Session Code : C5-L2 — La passation, côté élève : le même déroulé qu'à l'écrit, avec un retour ancré au texte

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5. Ce que le lot construit, son manifeste et son « fait quand » font foi au `07-Implementation.md` §2 — ils sont recopiés ci-dessous avec **leurs versions au moment de l'écriture**.
>
> ⭐ **Le déroulé à six temps EXISTE, il est générique, et il est rangé sous Codex.** Sept composants, un jeu d'actions partagé, un chargeur de 835 lignes et dix-huit modules à côté de lui : **rien de tout cela ne connaît le mot « Codex »** — la seule chose qui l'y range est **la route**, et son en-tête le dit en toutes lettres : *« la lecture — même déroulé, retour ancré au texte — est C5-L2 […] on ne route pas ce déroulé sous Aletheia, et on ne le rend pas générique "au cas où". **Le lot qui en aura besoin le fera sien.** »* **C'est toi.**
>
> ⚠️⚠️ **Mais « le faire sien » ne se résume pas à une route.** Trois choses manquent, et la fabrication les a vérifiées sur pièces : **un exercice de lecture assigné est aujourd'hui INVISIBLE** *(la liste des exercices maison l'écarte, et Aletheia n'a aucune porte côté élève)* ; **le déroulé n'affiche AUCUN texte d'auteur** *(il sert le matériau de la banque, jamais celui de l'instance)* ; et **la chaîne n'a jamais le texte sous la main** au moment d'écrire le retour — `exercices.reference_id` **n'a aucun écrivain de production**. *Ton « fait quand » bute sur les trois.*

---

## ⭐⭐⭐ LES TROIS CHOSES — à garder sous les yeux du début à la fin

> **Ceci n'est pas une septième pièce de la recette : c'est l'en-tête déplié.** Trois manques ont été **vérifiés sur pièces** à la fabrication, ils ne sont écrits nulle part ailleurs, et **ton « fait quand » bute sur les trois**. Les pièges les redisent en détail ; ce tableau est là pour que tu ne les perdes jamais de vue, et **ta clôture commence par eux** *(voir « Ce que tu dois rendre à Louis », en fin de prompt)*.

| | Le manque, en une phrase | Ce que l'élève vit AUJOURD'HUI | Ce que ça coûte à ton « fait quand » | Où c'est détaillé |
|---|---|---|---|---|
| **①** | **La porte n'existe pas** — un exercice de lecture assigné est introuvable | Il n'a **ni lien, ni liste, ni adresse** : la seule liste d'exercices maison est celle de Codex, **et elle écarte volontairement la lecture** | *« un exercice de lecture **traverse** le déroulé »* — **personne ne peut y entrer** | pièges **4 à 9** |
| **②** | **Le texte ne s'affiche pas** — l'écran sert le matériau de la banque, jamais celui de l'instance | Il lit *« explique cette phrase de Descartes »* et **ne voit aucune phrase de Descartes** | l'exercice est **infaisable**, et un retour « ancré au texte » n'a pas de texte | piège **10** |
| **③** | **La référence n'est pas branchée sur l'instance** — `exercices.reference_id` n'a aucun écrivain de production | Rien de visible : **c'est un silence**, et c'est ce qui le rend dangereux | le modèle **n'a pas le texte de l'auteur** quand il écrit le retour, et **la garde en base ne se déclenche jamais** | piège **11** |

**① LA PORTE.** Le professeur peut concevoir un exercice de lecture et l'assigner : la ligne existe en base, l'élève y est rattaché. **Mais aucun écran ne la lui montre.** `exercicesMaisonDeLEleve` — la seule liste d'exercices à faire à la maison — filtre sur `atelierDUnFormatif(...) === 'codex'`, c'est-à-dire **écarte tout ce qui n'est pas de l'écriture**, délibérément et depuis C4-L6 ; et la page élève d'Aletheia ne rend, du moteur, que les **passations de classe** déjà ouvertes par le professeur. Il n'existe donc **aucune route** vers le déroulé d'un exercice de lecture, et **aucun `href`** qui y mènerait. ⭐ *Ce qu'il faut : une route et une liste, derrière `exercices_actif`, chacune bornée par l'atelier — **dans les deux sens**, parce que la route de Codex sert déjà un dépôt de lecture à qui connaît son identifiant.* ⛔ *Ce qu'il ne faut pas : un onglet — c'est `C5-L4`.*

**② LE TEXTE.** Un exercice de lecture porte sur un **texte d'auteur**. L'écran du déroulé sait afficher un matériau — mais il va toujours le chercher au même endroit : `exercices_cas` → `exercices_materiaux`, **la banque de matériaux fabriqués**, ces paragraphes écrits exprès pour les exercices d'écriture. **Le texte d'auteur n'y est pas** : il est **désigné par l'instance** — `materiau_source_texte_id`, plus les bornes de l'**englobant** *(ce qui s'affiche autour)* et de la **localisation** *(la sélection que le professeur a faite dedans, à C5-L1)* — et **l'écran ne lit jamais ces colonnes pour afficher quoi que ce soit**. Sur une instance de lecture, `exercices_cas.materiau_id` est de surcroît **NULL**. ⭐ *Ce qu'il faut : servir l'englobant et marquer la sélection dedans, **sans retoucher un octet** — `marquerLeMateriau` sait déjà rendre des segments marqués et non marqués.* ⛔ *Ce qu'il ne faut pas : recopier le texte sur l'instance — `scriptorium_contenus` en est le domicile, et un second finirait par diverger.*

**③ LA RÉFÉRENCE.** Quand un texte est décomposé et validé *(c'est tout le lot `C5-L1`)*, **la référence est rattachée AU TEXTE** : `exercices_textes.reference_id`. L'instance, elle, a **sa propre colonne** — `exercices.reference_id`, que le `07-` §1.1 déclare — **et personne ne l'écrit** : l'import y met explicitement `null`, l'écran de conception ne la remplit pas ; seuls l'examen diagnostique de C4-L9 et les décors de recette la posent. **Or c'est cette colonne-là, et elle seule, que lisent les deux mécanismes qui comptent :**
> **(a) la chaîne**, pour descendre jusqu'au retour la référence **et le texte source** — sans elle, `ctx.reference` et `ctx.materiau` restent nuls, et **le modèle à qui l'on demande de citer l'auteur n'a jamais l'auteur sous la main**. Il ne peut alors citer que ce qu'il trouve : la copie de l'élève. ⚠️ **C'est exactement la faute que RR3 décrit, et elle est en place aujourd'hui.**
> **(b) le trigger en base** `garde_reference_validee`, qui interdit de juger sur une référence non validée : il fait `select e.reference_id … if v_ref is null then return new` — **il sort avant de contrôler quoi que ce soit.** L'écran de conception, lui, refuse bien : il lit **l'autre** colonne, celle du texte. ⚠️ **Deux lecteurs, deux colonnes : l'un mord, l'autre est aveugle.**
>
> ⭐ *Ce qu'il faut : trancher, et le dire. `referenceDuTexte(admin, texteId)` existe déjà et tient en une ligne.* ⛔ *Ce qu'il ne faut pas : fabriquer un second domicile qui divergera — la référence appartient au texte ; `exercices.reference_id` en est la copie **que la garde en base exige**.*

---

## Le manifeste — recopié du `07-Implementation.md` §2

> *Manifeste* : **ce document, §1 et §4** · `06-Palimpseste.md` §2 · `01-routeur.md` §12.

« Ce document » est le `07-Implementation.md`. **Trois pièces, et rien de plus.**

| Pièce | Où | Statut requis | Au moment de l'écriture |
|---|---|---|---|
| `07-Implementation.md`, **§1 et §4** | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | **aucun** — *« un lot n'exige pas un statut de la source qui le déclare »* *(`07-` §2)* | **VERSION 2.53** · RELU ET VALIDÉ · ⚠️⚠️ **régimes OPPOSÉS sur tes deux sections** : le **§1 est OUVERT À L'IMPLÉMENTATION** *(tu l'amendes depuis ton relevé, sans accord préalable)* ; le **§4 est GELÉ** *(toute modification demande l'accord explicite de Louis et remonte à `CONTEXTE.md`)* |
| `06-Palimpseste.md` — **§2** | même dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | **VERSION 2.6** · VALIDÉ ET GELÉ · ✅ **au-dessus du requis** |
| `01-routeur.md` — **§12** | même dépôt | **déposé** *(entrée sans statut explicite)* | **VERSION 5.6** · VALIDÉ ET GELÉ · ✅ **au-dessus du requis** |

⚠️ **Le manifeste borne les sections ; le barème, lui, ne se borne pas.** *« Le statut porte sur le FICHIER, jamais sur la section. […] la section dit seulement **où lire** »* *(`07-` §2)*. **Tu liras donc aussi**, dans les mêmes fichiers :

- le `07-` **§2** *(ta mission, ton « fait quand », la règle de manifeste, la règle de dette)*, le `07-` **§3** — ⭐ *« ce que les écrans doivent garantir à la mesure » : cinq exigences qui sont exactement ton terrain* — et le `07-` **§5** *(les interrupteurs — tu n'en crées aucun)* ;
- le `06-` **§1** *(« Lecture formative, à la maison — Aletheia — **écran**, y compris les analyses longues » ; le refus du collage ; la lisibilité qui ne se joue qu'en classe)*, le `06-` **§3** *(les trois gestes de la remise)*, le `06-` **§5** *(l'assiduité, l'affichage des niveaux, la fiche de compétence dite à l'élève)* et le `06-` **§7** *(la loi 25, et l'exigence d'examen humain)* ;
- le `01-` **§2** — ⭐ *le périmètre modulaire, et **la phrase qui décide de ta porte** : « Codex s'il porte `composer`, **Aletheia sinon** »* —, le `01-` **§4** *(le non-spoiler)*, le `01-` **§8.2** et **§8.7** *(la fenêtre d'évidence, l'élection du registre)*, le `01-` **§11** *(ce qui se journalise)*.

*Un prompt plus strict que sa source perd des données en silence.*

**Ce que chaque pièce fait ici.**

- Le **`07-` §1** porte **les tables et leurs gardes** : `exercices` et ses `materiau_source_*` *(le texte, sa localisation, son englobant)*, `exercices_references` et **ses deux gardes**, `exercices_depots` et **tout le déroulé** *(les statuts, les horodatages, les trois gestes, la télémétrie du faisceau, `aide_consommee`)*, `exercices_squelettes` et `exercices_metacognition` — **les deux tables que l'élève ne lit jamais avant la publication de son retour** —, et `exercices_retours`, **dont le `texte` est SEGMENTÉ**. ⭐ **Et il dit partout que la forme physique t'appartient** : *« ce document exige que la donnée existe, qu'elle soit nommée et qu'elle soit gardée ; il ne choisit pas son type »*.
- Le **`07-` §4** est **Calame et le gabarit du retour** — la couche contrat, ses huit règles, celles qui sont verrouillées, la seule qui est ouverte, et **les trois variables**. ⛔ **Il est GELÉ, et son texte est DÉRIVÉ dans le code** *(piège 18)*.
- Le **`06-` §2** est **LE déroulé** — les six temps, dans l'ordre, avec leurs conditions de service et leurs garde-fous. **C'est ta mission mot pour mot** : *« le même déroulé qu'à l'écrit »*.
- Le **`01-` §12** est **l'architecture des retours** : deux étages, trois couches, **RR1 à RR4**, le contrat de latence et **les quatre défenses contre l'injection de consigne**. ⭐ **RR3 est la moitié de ton « fait quand »**.

**Rien de plus : la règle de manifeste veut que ce qui n'y figure pas ne se lise pas** *(`07-` §2)*. **Six précisions, et deux d'entre elles décident de la forme de ton lot :**

- ⛔ **Le `02-exercices.md` N'EST PAS à ton manifeste**, et c'est le retrait le plus lourd. **Ne s'y lisent donc pas** : les neuf crans et leur `regime_v1vf` *(§2.2)*, l'appui par cas *(§2.3.4)*, les modes admis *(§3)*, la phase « se juger » et la crédence *(§5)*, le **format de la référence décomposée** *(§6 A)*, le pipeline de conception *(§6 B)* et le flux de la passation en classe *(§6.D)*. ⭐ **Ce n'est pas une privation : tout cela est déjà écrit en code** — C4-L3 pour le déroulé, C4-L8 pour la fabrique, C4-L14 et C4-L15 pour l'appui et le marquage, C5-L1 pour la référence. **Tu réemploies ; tu ne réécris aucune de ces règles.**
- ⛔ **Le `03-competences.md` et les fiches de `competences/` NON PLUS** — donc **aucun instrument ne se dérive, ne s'ouvre ni ne se corrige ici**. Les six compétences sont ouvertes depuis C4-L10 ; **les mesures en réception sont `C5-L3`**, et *« aucune session ne construit un instrument manquant »*.
- ⛔ **Le `04-Instances_Exercices.md` et le `05-GENERATEUR_Reference_Decomposee.md` non plus.** La banque de consignes est **dérivée en base** *(`exercices_routes`, 3264 lignes)* ; le générateur de la référence est **C5-L1, joué le 26/08**. **Tu lis ce qui est en base et en code, jamais ces deux sources.**
- ⚠️ **Le `01-` §4 t'est en revanche OUVERT, et c'est nouveau** — le `01-routeur.md` est à ton manifeste, et le barème porte sur le fichier. **Lis-le pour comprendre le non-spoiler ; ne l'écris pas une seconde fois** : la règle est déjà en code, **per-élève**, à `filtreDuNonSpoiler` *(piège 38)*.
- ⛔ **`SPEC_C3_exercices_competences.md` est ARCHIVÉE : elle ne fait foi sur rien, et elle ne se cite jamais.** Elle traîne à la racine du dépôt `palimpseste` — **ne l'ouvre pas**. Il en va de même de `FUSION_revues_C3.md`, `revue_adversariale_SPEC_C3.md` et `AMENDEMENTS_C3_en_attente_2026-07-31.md`.
- ⛔ **Aucun relevé de lot ne se lit** — ni celui de C4-L3, ni celui de C5-L1. **Ce que ces lots avaient à te dire est dans les pièges ci-dessous** ; c'est le sens même de la boîte aux lettres du `PLAN_DE_CHANTIER.md` §5. ⚠️⚠️ **Et la tienne était VIDE : aucun lot joué ne t'avait rien adressé.** Ce que tu trouveras plus bas vient d'une **relecture du dépôt** faite à la fabrication — parce que *« "je ne fais pas X, c'est ton lot" n'est pas un dépôt : le lot destinataire ne saura pas **ce qui** n'a pas été fait »* *(la leçon de C4-L6, §5)*. **Cinq endroits du dépôt te nomment — un prompt de lot, un relevé, l'en-tête de l'écran du déroulé, le prompt de C5-L1 et un commentaire de migration — et aucun ne dit CE QUI manquait.** Les pièges 4 à 11 le disent.
- **Le code du dépôt n'est pas une source, c'est ton terrain.** Les fichiers, les comptes et les lignes nommés ci-dessous ont été **vérifiés à la fabrication** ; ce sont des repères, pas des autorités. **En cas de doute entre ce prompt et une source du manifeste, la source a raison.**

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

**Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-` §2 : *déposé* → *relu et validé* → *versé et bancé*, **cumulatifs** ; « VALIDÉ ET GELÉ » vaut *relu et validé*. *Vérifié à la fabrication : `07-` **2.53 / RELU ET VALIDÉ**, `06-` **2.6 / VALIDÉ ET GELÉ**, `01-` **5.6 / VALIDÉ ET GELÉ** — **rien ne bloque**.*

**La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ci-dessus, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.

**Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot. ⚠️ *Sans objet ici : aucune fiche n'est à ton manifeste.* **Ce qui, chez toi, est granulaire, c'est autre chose : tes trois gestes se prouvent séparément.** La porte *(A)* se prouve sans la chaîne ; l'affichage du texte *(B)* se prouve sans un appel de modèle ; **et seul le troisième** *(C)* **demande un retour engendré pour de vrai**.

**Tes deux dépendances sont jouées.**

- **`C4-L3`** — le déroulé de l'élève à la maison : `c4_l3_deroule.sql`, **exécutée en sandbox le 22/08** *(au `SUIVI_SQL.md`)*, code mergé. ⚠️ **Quatre de ses lignes de recette restent DÉCOCHÉES** et trois d'entre elles se rejoueront à l'identique chez toi *(piège 27)*.
- **`C5-L1`** — la conception côté professeur : **jouée le 26/08**, **aucune migration**. ⚠️⚠️ **ET SON TRAVAIL N'EST PAS COMMITÉ** *(vérifié à la fabrication)* : `utils/generateur/`, `utils/fabrique/selection.ts`, `utils/fabrique/non-spoiler-conception.ts`, `app/prof/conception/textes/`, `scripts/derive-generateur.py` et six fichiers modifiés vivent **dans l'arbre de travail**. **Regarde `git status` avant de committer quoi que ce soit, et ne pousse jamais le travail d'un autre lot avec le tien.**

### Cinq contrôles machine à jouer AVANT d'écrire une ligne

```bash
npm test
```

```bash
python3 scripts/derive-doctrine.py --verifie
```

```bash
python3 scripts/derive-instruments.py --verifie
```

```bash
python3 scripts/derive-generateur.py --verifie
```

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/register-ts-resolver.mjs --test utils/chaine/retour.test.ts utils/codex-onglets/onglets.test.ts
```

*(les cinq dans `palimpseste`)*

**1. `npm test` doit rendre `fail 0`.** *Mesuré à la fabrication : **tests 1581, pass 1581, fail 0, skipped 0**, en ~3,4 s.* ⚠️ **Note le compte avant de commencer** : un test qui disparaît est aussi silencieux qu'un test qui tombe, et **un vert n'est une preuve que si l'on sait combien de vert il y avait**.

**2. `derive-doctrine.py --verifie` — vert à la fabrication.** La partie qui tourne sans base rend **`FIXTURE : IDENTIQUE`**, avec son résumé *(13 objets · 9 crans · 46 couples objet × mode · **544 déclarations de routage → 3264 lignes de route** · 15 patrons · 24 guides)*. **Les douze tables demandent que tu joues le SQL contre la sandbox.** ⛔ **S'il dit `DIVERGE`, rejoue `--sql` en un geste séparé et journalisé, jamais au milieu de ton lot — et ne corrige JAMAIS la base à la main.**

**3. `derive-instruments.py --verifie` doit rendre `INSTRUMENTS : IDENTIQUE`.** *Mesuré : **10 fichiers dérivés**, gabarit Calame `07-` **2.53**, 3347 caractères, variables `COMPETENCE`, `MOMENT`, `REGISTRE` ; les six compétences ouvertes.* ⭐ **C'est le contrôle qui tient ton gabarit de retour honnête** *(piège 17)*. ⚠️ *Deux dérivés viennent d'être re-dérivés en 2.53 et ne sont pas commités — c'est le travail de C5-L1, pas le tien.*

**4. `derive-generateur.py --verifie` doit rendre `GÉNÉRATEUR : IDENTIQUE`.** *Mesuré : `05-` **2.0**, G1 8300 · G2 3231 · G3 5148 caractères.* **Tu ne touches pas au générateur** ; ce contrôle est là pour que tu saches qu'il est intact quand tu partiras.

**5. Les deux étalons de non-régression qui te concernent directement.** *Mesuré : `retour.test.ts` **18 tests verts**, `onglets.test.ts` **12 tests verts**.* ⭐ **Le premier est le contrat du retour, le second celui des portes.** Quoi que tu ajoutes autour d'eux, **ces trente vecteurs doivent rester verts** — et il t'en faudra des neufs.

> ⚠️⚠️ **TROIS FAITS D'ÉTAT, vérifiés à la fabrication, qui ne sont pas des contrôles.**
> **(a) La PROD EXISTE depuis le 25/08** *(projet `ucmngachkxvvlegntuwh` ; la sandbox reste `aoakpxxlyvthzueaywna`)*. **Un push est désormais un déploiement en vraie prod**, et le `SUIVI_SQL.md` porte deux cases, Sandbox **et** Prod.
> **(b) L'arbre de travail n'est pas propre** — tout C5-L1 y vit, non commité *(ci-dessus)*, plus `IDEES_post_rentree.md`, `PLAN_DE_CHANTIER.md` et `SUIVI_tests_manuels.md`.
> **(c) `main` == `origin/main`** au moment de l'écriture, sur `a961196`.

---

## La mission — reprise du `07-Implementation.md` §2

> **C5-L2 — La passation, côté élève.** **Le même déroulé qu'à l'écrit** *(`06-Palimpseste.md` §2)*, avec un retour **ancré au texte** : les citations portent leur source — la copie de l'élève d'un côté, le texte support de l'autre *(`01-routeur.md` §12, RR3)*.

**Trois gestes, et le troisième est celui pour lequel le lot existe.**

### A. Le même déroulé — donc une PORTE, et une seule route de plus

**Le déroulé est bâti et il est générique.** Sept composants *(`components/deroule/`)*, un chargeur *(`utils/deroule/vue.ts`, 835 lignes)*, dix-huit modules à côté *(`utils/deroule/`)* et **un jeu d'actions explicitement partagé** — `app/deroule/actions.ts`, *« un dossier sans `page.tsx`, donc non routable […] il porte le jeu d'actions **PARTAGÉ par les écrans du déroulé, où qu'ils vivent** »*. **Rien de tout cela ne nomme Codex** *(vérifié par `grep` à la fabrication : une seule occurrence, dans un commentaire de `utils/deroule/acces.ts`)*.

**Ce qui manque est la porte, et elle manque deux fois** *(pièges 7 à 9)* : il n'y a **aucune route** de lecture, et **aucune liste** ne mènerait à celle que tu écriras.

### B. Le texte que l'élève doit lire — le déroulé ne le sert pas

*« Lecture formative, à la maison — Aletheia — **écran**, y compris les analyses longues »* *(`06-` §1)*. **Un exercice de lecture se travaille sur un texte d'auteur, et l'écran n'en montre aucun** : le matériau qu'il sert vient de la **banque de matériaux fabriqués**, jamais du texte que l'instance désigne *(piège 10)*. **C'est le plus gros manque de construction du lot**, et il précède le retour : *un retour ancré à un texte que l'élève n'a pas vu ne veut rien dire.*

### C. Le retour ancré au texte — RR3, et sa preuve

*« Les citations portent leur source : la copie de l'élève d'un côté, le texte support de l'autre. **Sans cela, le retour finit par attribuer à l'élève une phrase de l'auteur qu'il citait ; à l'échelle d'une année, l'erreur est certaine.** »* *(`01-` §12, RR3)*

⭐ **La moitié est déjà là** : le schéma de sortie **exige** `ancrage: { source, citation }`, l'assembleur le dit au modèle, et l'écran distingue *« Tu écris »* de *« Le texte dit »*. ⛔ **La moitié qui manque est celle qui PROUVE** : le modèle **n'a pas le texte**, et **rien ne vérifie l'étiquette** *(pièges 12 à 16)*.

### Ce que ce lot NE porte PAS

- ⛔ **les mesures en réception**, qui sont `C5-L3` — *« l'extraction et le jugement des compétences dont la grille réceptive existe »*. **Tu ne dérives, n'ouvres ni ne corriges aucun instrument** ; `derive-instruments.py --ecris` ne se joue pas ;
- ⛔ **les onglets de la lecture**, qui sont `C5-L4` — Aletheia n'a aujourd'hui **aucun sous-onglet élève**, et ce n'est pas à toi de lui en donner. **Tu poses une porte, pas un onglet, et tu ne touches pas `components/nav/configModules.ts`** *(piège 8)* ;
- ⛔ **le déménagement de `app/prof/conception/`** dans l'atelier de son mode, reporté à `C5-L4` ;
- ⛔ **la conception**, qui est `C5-L1` et `C4-L8` — sauf **la seule ligne** que le piège 11 nomme, et qui est la condition d'existence de ton retour ;
- ⛔ **le générateur de la référence décomposée**, qui est `C5-L1`, joué ;
- ⛔ **la règle du non-spoiler**, déjà écrite en code et **per-élève** *(piège 38)* ;
- ⛔ **la file professeur des contestations et le drapeau des contestations répétées**, qui sont `C6-L1` ;
- ⛔ **aucune règle neuve de retour.** Tout ce que ce lot sert est écrit, et gelé.

---

## Les pièges — les décisions dont l'oubli coûte une migration

*Tirés des sources du manifeste et **vérifiés sur pièces à la fabrication**. Chacun porte son renvoi. **En cas de doute entre ce prompt et la source, la source a raison.***

### Ce que le manifeste retire, et ce qui le remplace

**1. Le `02-`, le `03-`, le `04-` et le `05-` sont HORS de ton manifeste — et tout ce qu'ils portent est déjà en code.** Les crans et leur régime : `utils/deroule/regime.ts` + la table `exercices_crans`, **dérivée**. L'appui par cas : `exercices_cas`, écrit par la conception et l'import. Le marquage du matériau : `utils/deroule/marquage.ts` *(C4-L15)*. La banque de consignes : `exercices_routes`, **3264 lignes dérivées**. Le format de la référence : `utils/fabrique/verifie-reference.ts`, **41 vecteurs verts**. ⛔ **Tu ne recopies aucune liste fermée de ces sources, nulle part.**

**2. ⚠️ Toute lecture des tables dérivées PAGINE.** C'est le défaut qui a fait naître `C4-L8-bis` : PostgREST plafonne à **1000 lignes sur 3264** **sans rien signaler**, et sept objets sur treize s'étaient retrouvés sans consigne. *Paginer, ordonner sur une clé unique, confronter au `count: 'exact'` : le patron est `lireTable` de `utils/fabrique/doctrine.ts`.*

**3. ⛔ La doctrine en base est DÉRIVÉE, jamais tapée, et il n'y a qu'un dériveur.** *(Convention du `PLAN_DE_CHANTIER.md` §5.)* Si `--verifie` dit `DIVERGE`, rejoue `--sql` en geste séparé ; **jamais de correction à la main.**

### La porte — le premier geste, et le graphe ne le nommait pas

**4. ⭐⭐ L'ÉCRAN DU DÉROULÉ EXISTE ET IL EST GÉNÉRIQUE — c'est le premier renvoi de périmètre que ta boîte ne portait pas.** `app/eleve/modules/codex/exercice/[depotId]/page.tsx` fait **cinquante-deux lignes, dont dix-huit de commentaire d'en-tête** : une garde, un chargeur, un composant. Tout le reste vit dans `utils/deroule/` *(**19 modules**, dont **12 ont leur fichier de tests**)*, `components/deroule/` *(**7 composants**)* et `app/deroule/actions.ts`. **L'en-tête de la page le dit** : *« la lecture — même déroulé, retour ancré au texte — est C5-L2 : **on ne route pas ce déroulé sous Aletheia, et on ne le rend pas générique "au cas où". Le lot qui en aura besoin le fera sien.** »* ⭐ **À réemployer, pas à construire.**

**5. ⚠️ ET LA PAGE PORTE DEUX AVERTISSEMENTS QUI SONT POUR TOI.** *(a)* ⛔ **Pas de `<main>` imbriqué** — le layout élève en fournit déjà un, avec sa colonne *(`app/eleve/layout.tsx`, `max-w-[1040px]`)*, et **les pages de passation de C4-L4 en rouvrent un second, avec une autre largeur** : *« on ne reproduit pas cet écart »*. ⚠️ **`app/eleve/modules/aletheia/passation/[depotId]/page.tsx` est précisément l'une des deux** — ne le prends pas pour modèle. *(b)* **Les onglets sont C5-L4** : ton écran n'en déclare aucun.

**6. ⚠️ Le layout d'Aletheia est symétrique de celui de Codex** — `<div data-module="aletheia"><TuileAccentModule>` — et **rien n'y bloque une route imbriquée**. *Vérifié à la fabrication : les deux layouts font exactement la même chose, à la clé de module près.*

**7. ⭐⭐⭐ AUJOURD'HUI, UN EXERCICE DE LECTURE ASSIGNÉ EST INVISIBLE — ET LA RÈGLE QUI L'ÉCARTE EST DÉJÀ ÉCRITE.** `atelierDUnFormatif` *(`utils/codex-onglets/regles.ts`, C4-L6)* applique la phrase du `01-` §2 — *« tout exercice qui a demandé une production se consulte dans son atelier : **Codex s'il porte `composer`, Aletheia sinon** »* — et `exercicesMaisonDeLEleve` *(`utils/codex-onglets/liste.ts`)* **filtre dessus** : `atelierDUnFormatif(ex.modes_par_competence) === 'codex'`. **Tout ce qui n'est pas `composer` est écarté de la liste, et rien ne le reprend ailleurs.** ⭐ *La fonction est écrite, commentée et testée — **tu l'appelles, tu ne la réécris pas**, et son en-tête porte un avertissement qui compte : « inverser l'ordre casserait l'explication de texte », qui mesure l'Expression **en `composer`** et que le `06-` §1 range pourtant en lecture. **La règle ne se pose que sur la maison.***

**8. ⭐⭐ ET ALETHEIA N'A AUCUNE PORTE CÔTÉ ÉLÈVE.** `components/nav/configModules.ts` : l'entrée `aletheia` déclare `sousOngletsProf` *(Classe · Paramètres)* et **aucun `sousOngletsEleve`** — Codex en a deux *(Exercices · Examens)*. Et `app/eleve/modules/aletheia/page.tsx` ne rend, du moteur, **que les signaux de lancement de CLASSE** *(`signauxDeLancement(admin, user.id, 'aletheia')`)* : **rien de la maison.** ⛔ **« Un écran sans porte n'existe pas »** *(`07-` §2, C4-L6)* — **et les onglets sont C5-L4**. *Ce qui te revient : une liste, derrière `exercices_actif`, à un endroit qui existe déjà. Ce qui ne te revient pas : un onglet, ni une ligne de `configModules.ts`.*

**9. ⚠️⚠️ TA PORTE DOIT ÊTRE BORNÉE PAR L'ATELIER, DANS LES DEUX SENS — et elle ne l'est pas aujourd'hui.** `lireDepotMaison` *(`utils/deroule/depot.ts`)* ne contrôle que **trois** choses : le dépôt est à cet élève, son instance a `lieu = 'maison'`, il n'est pas `retire`. **Il ne regarde jamais l'atelier.** Conséquence vérifiée : `/eleve/modules/codex/exercice/<id>` **sert déjà** un dépôt de lecture à qui connaît son identifiant, et ta route servirait un dépôt d'écriture. ⭐ **Deux ateliers, deux portes, un seul prédicat** — `atelierDUnFormatif`, appliqué **des deux côtés**. *Sans quoi le module devient un attribut d'URL, quand le `01-` §2 en fait « une couleur et une voix ».*

### Le texte : ce que le déroulé sert, et ce qu'il ne sert pas

**10. ⭐⭐⭐ LE DÉROULÉ NE MONTRE AUCUN TEXTE D'AUTEUR, ET C'EST LE PLUS GROS MANQUE DU LOT.** `CasServi.materiau` *(`utils/deroule/vue.ts`)* vient d'une seule jointure : `exercices_cas` → **`exercices_materiaux`**, qui est *« la banque de matériaux **fabriqués** »* — provenance `genere`, **jamais un texte d'auteur** *(`c4_l8_fabrique.sql` §B.4)*. **Le texte d'une instance de lecture vit ailleurs** : `exercices.materiau_source_texte_id` → `exercices_textes.contenu_id` → `scriptorium_contenus.texte_extrait`, borné par **`materiau_source_englobant`** *(ce qui s'affiche autour)* et **`materiau_source_localisation`** *(la sélection)*, deux `int[]` de deux bornes, **en caractères, base 0, fin exclue**. ⛔ **`utils/deroule/vue.ts` ne lit ces colonnes QUE pour la parade à l'imitation de surface** *(le rattachement au cours des démonstrations)* — **jamais pour afficher quoi que ce soit**. ⚠️ **Et `exercices_cas.materiau_id` est NULL sur ces instances** : la conception ne l'écrit que pour un matériau `genere`. **Résultat : l'élève voit la consigne, et rien d'autre.**
> ⭐ **Ce que « le même déroulé » veut dire ici, et le patron qui existe.** C'est **l'englobant** qui s'affiche — *« il déclare la portion du texte affichée autour de la sélection […] c'est l'étendue réellement lue »* —, et la sélection se **marque dedans**. `marquerLeMateriau` *(`utils/deroule/marquage.ts`, C4-L15)* sait déjà rendre **des segments marqués et non marqués sans retoucher un octet** : *« le texte n'est pas retouché d'un octet — la concaténation des `texte`, dans l'ordre, EST le matériau »*. **Réemploie-le.** ⛔ **Et ne recopie jamais le texte sur l'instance** : `scriptorium_contenus` en est le domicile, et un second finirait par diverger.

**11. ⭐⭐⭐ `exercices.reference_id` N'A AUCUN ÉCRIVAIN DE PRODUCTION — trois conséquences, toutes silencieuses.** La colonne est déclarée au `07-` §1.1 *(« la référence quand il y en a une »)*. **Vérifié à la fabrication :** l'import écrit littéralement **`reference_id: null`** *(`utils/fabrique/import-ecriture.ts`)* ; l'écran de conception **ne l'écrit pas du tout** *(`app/prof/conception/actions.ts`, l'`insert` de l'instance)* ; **seuls l'examen diagnostique et les décors de recette la posent**.
> ⛔ **(a) La chaîne n'a jamais le texte sous la main.** `utils/chaine/contexte.ts` ne lit que `exercice.reference_id` : sans elle, `referent` reste `null`, **`reference` et `materiau` restent `null`** — et `materiau` est *« le texte source de la référence, `scriptorium_contenus.texte_extrait` »*. **C'est le canal par lequel le texte pourrait atteindre le retour, et il est débranché.**
> ⛔ **(b) La garde en base ne tire jamais.** `garde_reference_validee` *(`c4_l1_schema.sql`)* fait `select e.reference_id … if v_ref is null then return new` : **elle sort avant de contrôler quoi que ce soit.** L'écran, lui, refuse bien — `utils/reference-validee.ts` lit **`exercices_textes.reference_id`**. ⚠️ **Deux lecteurs, deux colonnes** : l'un mord, l'autre est aveugle.
> ⭐ **(c) Le geste existe déjà et tient en une ligne** : `referenceDuTexte(admin, texteId)` *(`utils/examens/conception.ts`)* lit `exercices_textes.reference_id`. **C4-L9 l'appelle ; la conception formative ne l'appelle pas.**
> ⚠️ **Ce que tu dois trancher, et dire** : la référence appartient au **TEXTE** — `exercices.reference_id` en est la copie **que la garde en base exige**. La dériver à la lecture laisserait le trigger aveugle ; **la poser à la conception ferme les deux**. *Quel que soit ton choix, il ne fabrique pas un second domicile qui diverge, et il se dit au relevé.*

### RR3 — le cœur du lot

**12. ⭐⭐ RR3 EST À MOITIÉ CONSTRUIT, ET LA MOITIÉ QUI MANQUE EST CELLE QUI PROUVE.** Trois pièces existent et sont vertes : le **schéma de sortie** exige `ancrage: { source: 'copie' | 'texte_support', citation }` — un `enum`, donc **une sortie sans source est rejetée et relancée** *(`FORME_RETOUR`, `utils/chaine/retour.ts`)* ; **l'assembleur le dit au modèle** — *« ANCRAGE : chaque citation porte sa source […] **Ne jamais attribuer à l'élève une phrase de l'auteur** »* ; **l'écran les distingue** — *« Tu écris »* contre *« Le texte dit »*, avec deux bordures différentes *(`components/deroule/RetourSegmente.tsx`)*. ⛔ **Ce qui manque : rien ne vérifie l'étiquette.**

**13. ⛔⛔ `ControleRetour.alertes` EST DÉCLARÉ ET N'EST JAMAIS REMPLI.** Son commentaire dit ce qu'il attend — *« ce qui se journalise sans arrêter — **le contrôle des citations**, par exemple »* — et **aucun `alertes.push` n'existe dans `utils/chaine/retour.ts`** *(vérifié)*. `controlerRetour` contrôle la règle 5, le plafond de la règle 2, l'ouverture par une réussite, les compétences admises, **RR4** et la règle 6. **Pas RR3.** *Le crochet t'attend ; c'est le seul endroit où il doit vivre.*

**14. ⛔⛔ ET LE MODÈLE N'A PAS LE TEXTE.** `EntreeRetour` *(`utils/chaine/retour.ts`)* porte le moment, le registre, la personnalité, les couches, **les squelettes** et l'état antérieur — **aucun champ de texte support**. `assemblerRetour` ne lui en donne aucun *(vérifié : `utils/chaine/chaine.ts`, l'appel de `phase: 'retour'`)*. ⚠️ **Un modèle à qui l'on demande de citer l'auteur sans lui donner l'auteur ne peut recopier que ce qu'il trouve dans le squelette — et le squelette est fait de LA COPIE.** *C'est le mécanisme exact de la faute que RR3 décrit, et il est en place aujourd'hui.*

**15. ⚠️⚠️ LE SENS DE LA FAUTE DÉCIDE DE CE QU'IL FAUT ÉPROUVER.** Ton « fait quand » dit *« aucune citation n'attribue à l'élève une phrase de l'auteur »* : **la faute est une phrase de l'auteur étiquetée `copie`**. Aujourd'hui elle n'est pas refusée — **elle devient une contestation** : `citationAbsente` *(`utils/deroule/contestation.ts`)* ne cherche que les points ancrés sur `copie`, une phrase d'auteur y sera **introuvable**, le drapeau `citation_absente` se lève et **le point part en file d'examen humain**, *« ce qui satisfait aussi l'exigence de la loi »* *(`06-` §2 et §7)*. ⛔ **Mais la file n'a pas d'écran** *(`C4L3-19`, adressée à `C6-L1`)*, **et l'élève aura lu « tu écris : … » sous une phrase qu'il n'a pas écrite.** ⭐ **Le contrôle doit donc mordre AVANT la publication, pas après.**

**16. ⭐ L'OUTIL EXISTE, IL EST ÉPROUVÉ, ET IL NE SE TAIT JAMAIS.** `citationsIntrouvables(production, citations)` *(`utils/chaine/anti-injection.ts`)* aplatit apostrophes, guillemets *(droits, français, avec leurs espaces d'usage)* et suites de blancs — *« sans quoi « oui » et "oui" ne seraient jamais la même citation, et le contrôle crierait faux à chaque fois »* — et, **production absente, il rend `contrôle des citations NON EXÉCUTÉ`** au lieu de se taire. **Le même outil, tourné vers le texte support, ferme RR3.** ⛔ **N'en écris pas un second**, et n'en fais pas un refus sans y avoir pensé : *l'effet — alerte seule ou retrait — est une décision, et le `01-` §12 défense 2 réserve le **rejet et la relance** à une sortie **non conforme au schéma**.*

**17. ⛔⛔ LE TEXTE D'AUTEUR QUI PART AU MODÈLE EST DU MATÉRIAU, JAMAIS UNE INSTRUCTION — et l'appel du retour est le SEUL qui ne le BALISE pas encore.** Le `01-` §12, défense 1 : *« entrées délimitées — la copie arrive dans un bloc balisé, jamais concaténée aux consignes, et la consigne déclare que ce bloc est du matériau, jamais une instruction »*. `messageAvecMateriau` et `baliser` *(`utils/chaine/anti-injection.ts`)* portent les bornes `<<<MATERIAU` / `MATERIAU>>>` **et neutralisent toute tentative de refermer la balise depuis l'intérieur**. ⚠️ **Vérifié : la chaîne les emploie pour P1 et pour le Monitoring, `utils/chaine/slots.ts` les emploie par slot, le générateur de C5-L1 les emploie pour ses trois passages — et `assemblerRetour` concatène ses morceaux à la main.** **Le texte que tu y ajoutes passe par le balisage.** ⚠️ Et **aucun outil n'est jamais attaché à ces appels** *(défense 3)* : `AppelIA` n'a pas de champ `tools` — **ne lui en ajoute pas un.**

### Le gabarit de Calame — ce qu'on n'y touche pas, et pourquoi

**18. ⛔⛔ LE GABARIT EST GELÉ À SA SOURCE ET DÉRIVÉ DANS LE CODE — DEUX RAISONS DE NE PAS Y AJOUTER RR3.** Le `07-` §4 est en régime **GELÉ** *(l'en-tête du `07-` : « §2 (la règle de manifeste seule), §3, §4, §6 »)* : *« toute modification demande l'accord explicite de Louis et remonte à `CONTEXTE.md` »*. Et le fichier que l'application exécute — `utils/chaine/derive/calame-retour.ts` — porte en tête *« FICHIER DÉRIVÉ — NE S'ÉDITE JAMAIS À LA MAIN »*. ⚠️⚠️ **RR3 n'est PAS dans le gabarit, et ce n'est pas un oubli à combler en passant** : le §4 porte **la couche contrat**, ses huit règles ; **RR3 vit au `01-` §12**, et le `01-` §12 lui-même range les quatre règles **à côté** des trois couches, pas dedans. ⭐ **Ce qui t'appartient est l'ASSEMBLAGE — qui est du code, et qui porte déjà l'ancrage hors du gabarit.** *C'est là que RR3 se renforce.*

**19. ⚠️ ET SI TU TOUCHES UNE SOURCE DÉRIVÉE POUR UNE AUTRE RAISON, RE-DÉRIVE.** *Leçon de C5-L1 :* **le `--verifie` d'une dérivation mord sur l'empreinte de sa source, pas sur son contenu utile** — poser un `[faux]` dans la prose d'un fichier a fait `DIVERGE` alors qu'aucun prompt n'avait bougé d'un octet. *C'est le comportement voulu ; il faut le savoir.*

**20. ⚠️ SEULE LA RÈGLE 7 EST OUVERTE, et elle a un domicile.** *« La `longueur` est propre au retour, et son domicile est un **paramètre de plateforme**, au même endroit que les interrupteurs (§5), **NULL valant la règle 7 du gabarit** »*. `assemblerGabarit` *(`utils/chaine/retour.ts`)* tient la garde : **une section verrouillée ne se remplace jamais**, et c'est dans la fonction, pas dans l'appelant.

**21. ⛔ `{{...}}` NE DÉSIGNE QUE TROIS CHOSES** — `{{COMPETENCE}}`, `{{MOMENT}}`, `{{REGISTRE}}`. *« Ce que le modèle lit dans une entrée qu'il reçoit déjà se nomme **par son champ** — le `levier` du verdict ; ce qu'il **écrit lui-même** ne porte aucune variable. »* ⚠️⚠️ **Et `{{REGISTRE}}` est le registre de RETOUR** — descriptif / interrogatif / démonstratif, élu par le `01-` §8.7 —, **jamais le registre de LANGUE** d'`utils/ia-commun.ts` : *« substituer l'un dans l'autre est **un mode de panne, pas une hypothèse** »*. `coucheContrat` lève déjà dessus ; **ne contourne pas cette garde.**

### Les autres règles du retour, et ce qui les contrôle déjà

**22. Le plafond de la règle 2 borne ce que le retour NOMME, jamais ce que l'exercice MESURE.** Micro 2 · méso 3 · macro 5, **toutes compétences comprises**, en v1 ; **en version finale il ne borne que les réussites**. `PLAFOND_NOMME` et `plafondApplicable` le portent, `controlerRetour` le refuse. *« Le second applique la phrase du premier : le grain borne le retour, pas la mesure. »*

**23. ⛔ RR4 — le retour ne révèle JAMAIS un observable, un seuil, ni ce qui fait basculer un palier.** Il **nomme les dimensions, en langue élève**. `fuitesRR4` contrôle les codes ; l'écran ne montre jamais `point.competence` — *« le nommer à l'élève, c'est lui montrer la grille »*. ⚠️⚠️ **En lecture, la tentation neuve porte un autre nom : la RÉFÉRENCE DÉCOMPOSÉE.** Ses **moments**, ses **lectures défendables** et son **armature** sont la grille de la réception — **et la réponse**. **Elles ne descendent jamais à l'écran de l'élève, ni dans le texte du retour.** *Le texte source, lui, est exactement ce qu'il doit lire : ne confonds pas les deux.*

**24. RR1 et RR2 sont déjà tenus, et l'un des deux a dû être ajouté après coup.** RR1 : *« la tentative est un fait observable dans le texte »* — le modèle **n'infère jamais une cause**. RR2 : en version finale, le « pourquoi » causal **devient un constat** ; l'assembleur le dit explicitement, *« il manquait à l'assemblage, alors que RR1, RR3 et RR4 y sont »*. ⭐ *Cet incident est ton meilleur argument : ce qui n'est pas écrit dans le message n'arrive pas au modèle.*

**25. ⚠️ En `interrogatif`, la question mène l'élève à l'erreur — MAIS SEULEMENT EN v1.** Au retour de la version finale, **dans les trois registres**, ce qu'il a réussi et ce qu'il a raté lui est **DIT**. *L'exigence d'un verdict franc n'est assouplie qu'à la première version, là où l'élève a encore une révision devant lui.*

**26. ⚠️ LE CONTRAT DE LATENCE EST DE MOINS DE TROIS MINUTES, et à défaut l'élève voit un état d'attente EXPLICITE, jamais un écran muet** *(`01-` §12 ; `07-` §3)*. `attenteDuDepot` *(`utils/deroule/mesure.ts`)* le porte. ⚠️ **Ton lot ajoute une lecture au chemin chaud** *(le texte support)* : **ne la mets pas sur le trajet de l'attente**, et souviens-toi que *« les appels d'extraction des différentes compétences se lancent en parallèle »* — le constructeur de requête de supabase-js est **paresseux**, et du code qui paraît parallèle peut être séquentiel.

### Les six temps, à l'identique — et ce qui s'y rejoue

**27. ⚠️ QUATRE LIGNES DE RECETTE DE C4-L3 SONT ENCORE DÉCOCHÉES, et trois se rejouent chez toi à l'identique.** `C4L3-16` — *la comparaison de « se juger » ne rend aucun accord* : `competences_correspondance` **ne dit nulle part quelle réponse vaut « réussi »**, la comparaison consigne les deux côtés et rend `accord: null`. ⛔ *« Ce n'est pas une recette à jouer, c'est une décision de source »* — **ne la tranche pas**. `C4L3-18` — *la parade à l'imitation de surface ne mord sur rien* : le format d'import ne connaît ni `cours_declares` ni `notions` sur les démonstrations, donc **elles sont servies et le professeur est averti** *(décision de Louis, 22/08 : « non déclaré n'est pas aucun »)*. `C4L3-19` — *la file professeur des contestations n'a pas d'écran*, **adressée à C6-L1** : le lot détecte, marque en base et laisse une trace serveur ; **il n'invente aucune file**. *La quatrième, `C4L3-21`, a vu sa condition levée par C4-L10.*

**28. LES SIX TEMPS SONT CEUX DU RÉGIME PLEIN, et le régime vient du CRAN plus l'ESCALADE.** *« Les temps 5 et 6 suivent le `regime_v1vf` du cran, et ne sont pas servis là où il n'y a pas de version finale. Aux crans de **diagnostic**, l'exercice est une **paire** — deux cas en deux temps, deux crédences ; aux crans de **transformation**, il se **clôt au retour**, sauf escalade active. »* `regimeDuDeroule` *(`utils/deroule/regime.ts`)* le calcule ; `tempsServis` en tire la liste. ⛔ **Ne grave aucun numéro de cran en dur** — la condition se **dérive** de la doctrine *(le patron est le repli du guide au cran 6 : « on lit une condition dérivée, jamais un numéro »)*.

**29. Le temps 1 : le rappel est DOSÉ PAR LE PALIER, et il n'existe pas à la semaine 1.** Servi aux paliers **Absent, Faible, Moyen** *(E, D, C)*, **absent aux paliers Bon et Acquis** — *« l'effet d'inversion de l'expertise : le rappel aide l'élève en difficulté et fait perdre son temps à l'avancé »*. Et **les observables se nomment en langue élève, jamais par leur code**. `rappelDuTemps1` le porte.

**30. Le temps 1, suite : la démonstration porte TOUJOURS sur un autre thème que l'exercice du jour.** *« Compétence jamais travaillée → la démonstration vient avant. Consolidation → la tentative d'abord »* ; et **la forme suit le grain** — l'exemple au micro, le **modelage du processus** au méso, la **checklist** au macro. `choisirLaDemonstration` *(`utils/deroule/demonstration.ts`)* écarte sur le cours **ou ne serait-ce qu'une notion**. ⛔ **Les démonstrations se déposent à la fabrique** *(C4-L8)* : **le déroulé les LIT sans jamais les fabriquer.**

**31. Le temps 3 « se juger » tient en DEUX OU TROIS GESTES, aucune saisie longue — l'écran est souvent un téléphone** *(`07-` §3)*. Trois garde-fous qui ne se défont pas : la calibration reste **`indetermine`** quand l'élève affirme un observable **absent du squelette** *(« un faux négatif de l'extraction ne doit jamais produire un "surconfiant" injuste : répété, cela enseigne la soumission à la machine »)* ; le message se formule **« nous n'avons pas vu la même chose »**, jamais comme un verdict ; **toute contestation portant sur une citation absente part directement en file professeur**. ⛔ **Le code compare, jamais le modèle.**

**32. Le temps 4 : sur CHAQUE point ancré, un bouton et un champ COURT — et la contestation N'ALTÈRE RIEN.** Elle est **journalisée**, elle **remonte au professeur en drapeau si elle se répète**, et **l'écran le dit en toutes lettres, à chaque fois**. ⚠️ **Elle est PAR POINT, et c'est une LISTE D'ACTES** *(`07-` §1.2)* : deux points contestés portent **deux textes courts**, qui ne tiennent pas dans une colonne scalaire. `contestation_texte` reste **NULL**, délibérément.

**33. L'encart LANGUE est SÉPARÉ, et il n'est jamais une mesure.** *« Les fautes relevées mécaniquement, ancrées ligne à ligne, **hors du retour de compétence** ; leur correction est attendue dans la version finale. »* *N* se compte **en code**, depuis le relevé de langue que la chaîne produit déjà : **l'écran ne détecte rien et n'appelle aucun modèle**. *« Hors lettre, hors calibration : c'est de l'hygiène, pas de la mesure. »*

**34. Le rythme des deux versions, et la garde qui le tient.** La version finale se rend **le même jour que la v1** quand c'est possible, **sinon dans les trois à quatre jours**, et **JAMAIS à cheval sur deux semaines de travail** — *« un delta v1 → vf qui traverse une semaine ne mesure plus la réception d'un retour, mais ce que l'élève a appris entre-temps »*. `echeanceDeLaVersionFinale` *(`utils/deroule/echeance.ts`)* le calcule, réglable par `scriptorium_params.vf_delai_jours`, **borné 1..4 par la base**.

**35. ⛔ RIEN DES SQUELETTES NI DE LA MÉTACOGNITION N'EST LISIBLE AVANT LA PUBLICATION DU RETOUR** *(`07-` §1)* — *« la garde la plus facile à casser et la plus coûteuse : **elle donne la grille et les réponses** »*. ⚠️ **Et il n'y a AUCUNE policy élève sur les tables du moteur** : *« lecture élève : ses propres lignes, strictement ; toutes les écritures passent par le serveur »* — le serveur lit **pour** l'élève, par le client admin, **filtré sur `eleve_id` dans le code**. ⛔ **N'ouvre aucune policy pour rendre une liste plus simple à écrire.**

### Les trois gestes de la remise, et le champ où l'élève écrit

**36. La confiance déclarée est UNE VALEUR PAR COMPÉTENCE `evaluee` MESURÉE, jamais un scalaire** *(`07-` §1.1)*. L'ordre des trois gestes est **mécanique, pas espéré** : la remise **refuse** sans eux *(`gestesRestants`, `utils/deroule/gestes.ts`)*. ⚠️ **Les deux drapeaux d'opt-in de classe sont SANS EFFET quand `lieu` vaut `maison`** — les deux gestes y sont **de droit**.

**37. ⛔⛔ LE CHAMP DE RÉDACTION PRÉSERVE LE DÉCOUPAGE EN PARAGRAPHES — et deux pièges se croisent exactement là.** *(a)* `07-` §3 : *« la Structure se mesure sur le découpage en blocs tel qu'il est écrit […] **une copie saisie sans retour à la ligne est lue comme dépourvue d'architecture** — défaillance forte »*. *(b)* ⚠️⚠️ **Un `<textarea>` soumet en CRLF, et le stocké est en LF** : **ça a mordu deux fois** *(C4-L4, puis la garde de découpe de C4-L16)*, et **`new FormData()` ne le montre PAS** — seule une sonde serveur pendant un vrai clic le voit. `C4L3-3` l'a prouvé sur l'écriture ; **il se rejoue à l'identique en lecture**, et les analyses longues du `06-` §1 en font le champ le plus sollicité de ton écran. ⚠️ **Et les champs REFUSENT LE COLLAGE** — raccourci, glisser-déposer, menu contextuel — **chaque tentative bloquée étant journalisée** comme signal du faisceau *(`06-` §1 et §6)*. `ChampDeRedaction` le porte déjà ; **ne l'affaiblis pas pour un texte long.**

### Quatre choses transverses, vérifiées à la fabrication

**38. ⛔ LE NON-SPOILER EST PER-ÉLÈVE, IL VIT AU ROUTEUR, ET « LA BORNE DE LA CLASSE N'EST PAS LA SIENNE ».** `filtreDuNonSpoiler` *(`utils/moteur/vivier.ts`, C4-L12)* porte **quatre régimes** — `hors_livre`, `sous_la_position`, `position_inconnue`, `au_dela` — et journalise sa `borne_amont`. Ses **deux seuls appelants** sont le vivier du routeur et l'écran de conception de C5-L1, **qui l'appelle avec une carte de positions VIDE** parce qu'aucun élève n'est en jeu à la conception. ⚠️ **Sur la voie du PROFESSEUR, il ne s'applique donc à personne** : le professeur assigne à une classe. ⛔ **Ne fabrique pas une « position de la classe »** — C5-L1 a refusé de le faire, nommément. **Si tu constates qu'un élève en retard peut recevoir un texte au-delà de sa position, RELÈVE-LE, ne le répare pas** : la règle est au `01-` §4, et *« un lot Code ne tranche aucune question de source »*. ⚠️ **Et l'échelle est UNE** : la séance du plan est `scriptorium_documents.semaine`, la position de l'élève est `aletheia_travaux.semaine_index` au statut `DONE`, **comparées par égalité** — **ni la semaine du parcours de la classe, ni le numéro affiché à l'élève** *(`07-` §1.1)*.

**39. Aucun septième interrupteur** *(`07-` §5)*. **Le tien est `exercices_actif`** — celui qui répond à *« les élèves peuvent-ils faire des exercices ? »* —, et `lireLaPorte` *(`utils/deroule/acces.ts`)* le lit déjà, **une porte illisible se fermant plutôt que s'ouvrant**. ⛔ **N'en détourne aucun autre** : `chaine_actif` est celui que **la coupure automatique de facture** bascule — *« un élève ne doit pas perdre l'accès à sa consigne et à son brouillon parce que la facture du mois a coupé »* — et `passation_classe_actif` appartient à C4-L4, dont le flux n'a pas ces six temps. Les six restent à **OFF** jusqu'à la recette.

**40. Trois pièges de `supabase-js`, transverses et éprouvés.** Il **ne lève pas** *(il rend `{ error }` — une lecture ratée n'est pas « rien à faire »)* ; il **plafonne toute réponse à 1000 lignes sans rien signaler** ; et son **constructeur de requête est paresseux** — il ne part qu'au premier `then`.

**41. ⛔ `export type` dans un fichier `'use server'` TUE TOUT LE MODULE à l'exécution** — `tsc`, `npm test` et les recettes passent, et **seule une action à l'écran échoue**. `app/deroule/actions.ts` est un `'use server'` **que tu vas toucher** : si tu y ajoutes un type, exporte-le d'ailleurs. ⭐ *Et `npx next build` est ce qui l'attrape — C5-L1 s'en est servi exactement pour cela.* ⚠️ **Ne le lance pas pendant qu'un `next dev` tourne** *(le cache `.next` se corrompt)*.

---

## Le « fait quand » — recopié du `07-Implementation.md` §2

*C'est la condition de recette, et **elle ne se négocie pas en séance**.*

> *Fait quand* : **un exercice de lecture traverse le déroulé et rend un retour dont aucune citation n'attribue à l'élève une phrase de l'auteur.**

**Deux clauses, et la seconde se prouve DEUX FOIS.**

1. **Un exercice de lecture traverse le déroulé** — il existe *(C5-L1 le conçoit : un texte déposé, décomposé, validé, servant une instance par la porte Aletheia)*, **il est atteignable** *(pièges 7 à 9)*, **son texte s'affiche** *(pièges 10 et 11)*, et les temps que son cran sert se déroulent jusqu'à la remise *(pièges 28 à 37)*.
2. **Il rend un retour dont aucune citation n'attribue à l'élève une phrase de l'auteur** — et **cela ne se prouve pas en lisant un retour qui se trouve juste**. Il faut les deux sens :
   - **par le succès** : sur un exercice bâti sur un texte réel, un retour engendré dont les points ancrés sur `texte_support` se retrouvent **dans le texte**, et ceux ancrés sur `copie` **dans la copie** ;
   - ⭐ **par l'échec** : une sortie de modèle **fabriquée**, où une phrase de l'auteur porte l'étiquette `copie`, **doit être attrapée par le contrôle** — et non pas glisser jusqu'à l'écran pour y devenir une contestation *(piège 15)*.

⚠️ **Ce que la première clause te coûtera en vrai : un appel de modèle par compétence mesurée, plus un pour le retour.** *Le contrat de latence est de trois minutes ; la chaîne journalise chaque appel dans `api_couts`, par phase — `p1`, `p2`, `retour`. **Le nombre d'appels se lit au nombre de lignes, jamais à un compteur.***

⚠️⚠️ **Et ce que tu ne pourras probablement PAS prouver en séance : ce qui se voit à l'écran.** *Le motif est net et il ne s'améliore pas en le répétant : **une session Code ne s'authentifie pas.*** **Ce qui ne se prouve pas se dit** — et part au `SUIVI_tests_manuels.md`, **décoché, avec sa condition de reprise nommée**. ⭐ *Le reste s'éprouve EN BASE et PAR APPEL : c'est ce que C4-L3 et C5-L1 ont fait, et c'est ce qui a trouvé leurs défauts.*

*Échéance* : **le `07-` §2 ne lui en donne aucune**, et le graphe la donne à sa place — **`C5-L4` en dépend**, avec `C5-L1` et `C5-L3`. *Le lot n'est pas sur le chemin critique de la rentrée ; il est sur celui de la lecture.*

---

## Les conventions — `PLAN_DE_CHANTIER.md` §5

### Du dépôt

**Une ligne au `SUIVI_SQL.md` AVANT exécution, jamais après** — date, fichier, zone, cases **Sandbox** et **Prod**. ⭐ *Ton lot peut n'en poser aucune : les pièges 10 et 11 se règlent en LECTURE, sur des colonnes qui existent. **Si l'un d'eux te fait conclure autrement, la migration en aura une, et son rollback aussi.*** **Toute migration est additive et gatée** : les **six** interrupteurs restent à OFF jusqu'à la recette — `exercices_actif`, `routeur_actif`, `competences_affichage_actif`, `fabrique_actif`, `chaine_actif`, `passation_classe_actif`.

⚠️ **Le reste du protocole n'est pas ici : il est en tête du `SUIVI_SQL.md`, règle R6** — **sandbox d'abord, prod ensuite, jamais l'inverse et jamais sans noter** ; **ne jamais rejouer un fichier de l'Archive** ; **protocole renforcé sur les tables vivantes** ; **répétition à blanc sur le CORPS du fichier**, jamais sur le fichier entier *(son `commit;` validerait ta transaction d'essai — c'est arrivé le 14/08)*. **Lis-le avant d'écrire ta migration** *(c'est aussi la règle absolue de l'`AGENTS.md`)*. ⚠️ **`scriptorium_contenus` est une table VIVANTE** — des textes et des cours réels y vivent, **et un élève réel utilise la base**.

**La doctrine en base est dérivée, jamais tapée, et il n'y a qu'un dériveur.** Avant de lire ces tables, `python3 scripts/derive-doctrine.py --verifie` doit dire **IDENTIQUE** sur les **douze** tables, les empreintes de source et la fixture. **S'il dit DIVERGE, rejoue `--sql` ; jamais corriger la base à la main.** ⭐ *Ton lot lit `exercices_crans` et, par le retour, `exercices_routes` : la convention s'applique.*

### De clôture

**Ta section au `SUIVI_tests_manuels.md`**, au moment où le lot se clôt : ce qui a été **prouvé en séance, coché avec sa preuve**, et ce qui **reste à jouer en recette, décoché, avec sa condition de reprise nommée**. *Un reste de recette qui ne vit que dans un relevé ne se rappelle à personne.* ⭐ **Ce qui y figurera sûrement** : le smoke élève à l'écran — **un vrai Chrome, jamais l'aperçu embarqué** —, le collage refusé sur ses trois vecteurs, le CRLF du champ de rédaction sur un texte long, et le rendu du texte support avec sa sélection marquée.

⚠️ **Et un renvoi de périmètre laisse sa trace, AVEC SA LISTE** *(la leçon de C4-L6, §5)*. Tu vas en produire : tout ce que tu constateras sans le réparer — le non-spoiler sur la voie du professeur *(piège 38)*, la file des contestations *(piège 27)*, ce que tu ne feras pas d'`exercices.reference_id` — **se nomme, avec les fichiers et les lignes**. *« Je ne fais pas X, c'est ton lot » n'est pas un dépôt.*

### De dette

**Une source trouvée fausse se MARQUE, elle ne se corrige pas** *(`07-` §2)*. Deux gestes : **`[faux]`** au point de l'erreur, et **une ligne à la section DETTES** du `INVENTAIRE_Non_Tranches.md`, qui porte l'**avant / après**. ⚠️ *Ne confonds pas avec l'**inventaire des lots du `07-` §2** et avec le **`07-` §1**, **tous deux OUVERTS À L'IMPLÉMENTATION** : ceux-là, tu les amendes depuis ton relevé, sans accord préalable — ce n'est pas une dette, c'est ton travail.* ⛔⛔ **Le `07-` §4, lui, est GELÉ : si tu conclus qu'il lui manque quelque chose, tu le DIS À LOUIS, tu ne l'écris pas.**

### D'ouverture de compétence

⚠️ **Sans objet ici** — ce lot n'ouvre aucune compétence dans la chaîne, et **les six sont déjà ouvertes**. La convention est recopiée parce que la recette se recopie entière ; **ne joue pas `derive-instruments.py --ecris`.** *Les mesures en réception sont `C5-L3`.*

---

## ⭐⭐⭐ Ce que tu dois rendre à Louis — la clôture commence par LES TROIS CHOSES

**Quoi qu'il arrive dans la séance — lot fini, lot partiel, lot arrêté au constat —, tu rends d'abord les trois, et tu les rends DEUX FOIS :**

**1. Dans le terminal, en tête de ta réponse finale, avant tout le reste.** Un tableau, trois lignes, et rien d'autre à cet endroit — *ce que Louis doit pouvoir lire sans ouvrir un fichier* :

| | Le manque | Ce que j'en ai fait | Ce que l'élève vit MAINTENANT | Ce qui reste |
|---|---|---|---|---|
| **①** | la porte | … | … | … |
| **②** | le texte | … | … | … |
| **③** | la référence | … | … | … |

⚠️ **Trois états seulement, et le mot se choisit sans détour** : **FERMÉ** *(construit et prouvé — dis par quoi)* · **PARTIEL** *(construit, non prouvé — dis ce qui manque à la preuve)* · **NON FAIT** *(dis pourquoi, et à qui ça revient)*. ⛔ **« En cours » n'est pas un état.** ⛔ *Et si l'un des trois s'est révélé faux à l'épreuve — le manque n'existait pas, ou pas comme décrit —, **dis-le en premier** : le prompt se trompait, et c'est l'information la plus utile de la séance.*

**2. Dans ton relevé, en PREMIÈRE section**, le même tableau, développé : pour chacun des trois, **le fichier et la ligne** où le geste vit, **la preuve** *(le test, la requête, la sortie de script)*, et **ce que tu as écarté et pourquoi**.

*Le motif : ces trois choses n'ont pas de domicile ailleurs. Elles ne sont ni au `07-` §2, ni au graphe, ni dans la boîte aux lettres de ce lot — **qui était vide**. **Si ton relevé ne les rend pas, personne ne saura qu'elles ont existé.***

---

### Et ce que ton relevé doit porter, après elles

Le nom du fichier : `RELEVE_C5_L2_2026-XX-XX.md`, à la racine du dépôt `palimpseste`. **Après la section des trois choses, huit choses au minimum**, en plus du récit :

1. **la porte que tu as posée** *(pièges 7 à 9)* — où elle vit, **derrière quel interrupteur**, et **comment les deux ateliers se bornent l'un l'autre dans les deux sens** ;
2. **comment le texte s'affiche** *(piège 10)* — l'englobant servi, la sélection marquée, et **la preuve que le texte n'est pas retouché d'un octet** ;
3. **ce que tu as fait d'`exercices.reference_id`** *(piège 11)* — posée à la conception, dérivée à la lecture, ou laissée telle quelle —, **avec ce que la garde en base fait dans chacun des trois cas** ;
4. **comment RR3 se contrôle** *(pièges 12 à 16)* — où le contrôle vit, ce qu'il compare, s'il alerte ou s'il refuse, **et pourquoi ce choix-là** ;
5. ⭐ **la preuve PAR L'ÉCHEC** — la sortie fabriquée où une phrase de l'auteur porte l'étiquette `copie`, et **ce que le contrôle en a fait** ;
6. **ce que le texte support a coûté au chemin chaud** — la lecture ajoutée, sa place dans le contrat de trois minutes, **et le balisage par lequel il passe** *(piège 17)* ;
7. **les renvois de périmètre, AVEC LEUR LISTE** — ce que tu as constaté sans le réparer, fichier et ligne ;
8. **ce qui reste à jouer en recette**, avec sa condition de reprise — parce que c'est cela qui part au `SUIVI_tests_manuels.md`, et de là à la recette du flux.

⭐ **Et deux amendements t'appartiennent sans accord préalable** : l'**inventaire des lots du `07-` §2** *(ton état de clôture)* et le **`07-` §1** *(ce que tu auras appris des tables — au minimum le sort d'`exercices.reference_id`, que le §1.1 déclare et que personne n'écrit)*.
