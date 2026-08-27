# PROMPT — Session Code : C5-L1 — La conception, côté professeur : un texte se dépose, se décompose, se valide, et sert une instance

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5. Ce que le lot construit, son manifeste et son « fait quand » font foi au `07-Implementation.md` §2 — ils sont recopiés ci-dessous avec **leurs versions au moment de l'écriture**.
>
> ⭐ **C'est le premier lot de C5, et rien de C5 n'est construit.** Mais **la moitié de son geste central existe déjà** : le contrôle machine de la référence est porté en plateforme, l'écran de validation est écrit, la garde absolue vit à un seul endroit. **Ce qui manque est ce qui les précède : la DÉCOMPOSITION elle-même.** Aujourd'hui une référence n'arrive que par le fichier d'import, et l'écran de conception l'écrit en toutes lettres : *« Aucun appel de modèle ici. »* **Ton lot renverse cette phrase, et rien qu'elle.**

---

## Le manifeste — recopié du `07-Implementation.md` §2

> *Manifeste* : **ce document, §1** · `02-exercices.md` §6 — le **format** de la référence · `05-GENERATEUR_Reference_Decomposee.md` — **relu et validé**, il porte les trois passages du générateur et ce que le professeur refuse, bloque ou signale.

« Ce document » est le `07-Implementation.md`. **Trois pièces, et rien de plus.**

| Pièce | Où | Statut requis | Au moment de l'écriture |
|---|---|---|---|
| `07-Implementation.md`, **§1** | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | **aucun** — *« un lot n'exige pas un statut de la source qui le déclare »* *(`07-` §2)* | **VERSION 2.52** · RELU ET VALIDÉ · ⚠️ **régimes mêlés** : au §1, *« les **gardes** sont gelées — ce qu'un élève ne doit jamais lire, ce qui ne doit jamais devenir une colonne — et **la forme appartient à la session Code** »* ; l'**inventaire des lots du §2 est OUVERT à l'implémentation** |
| `02-exercices.md` — **§6** | même dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | **VERSION 5.5** · VALIDÉ ET GELÉ · ✅ **au-dessus du requis** |
| `05-GENERATEUR_Reference_Decomposee.md` — **entier** | même dépôt | **relu et validé** | **VERSION 2.0** · VALIDÉ ET GELÉ · ✅ **conforme** |

⚠️ **Le manifeste borne les sections ; le barème, lui, ne se borne pas.** *« Le statut porte sur le FICHIER, jamais sur la section. […] la section dit seulement **où lire** »* *(`07-` §2)*. **Tu liras donc aussi**, dans les mêmes fichiers : le `07-` **§2** *(ta mission, ton « fait quand », la règle de manifeste, la règle de dette)*, le `07-` **§3** *(ce que les écrans doivent garantir à la mesure)* et le `07-` **§5** *(les interrupteurs — tu n'en crées aucun)* ; le `02-` **§1**, **§2.3.3** et **§3** *(les treize objets, le système de coordonnées de la `localisation` et de l'`englobant`, les modes)*. *Un prompt plus strict que sa source perd des données en silence.*

**Ce que chaque pièce fait ici.**

- Le **`07-` §1** porte **les tables** : `exercices_references` et ses **deux gardes**, `exercices_textes` et son **plan de lecture**, `exercices` et sa `borne_amont`, `exercices_types` et sa `consigne_gabarit`. ⭐ **Et il dit trois fois que la forme physique t'appartient** — colonne, table fille ou JSONB : *« ce document exige que la donnée existe, qu'elle soit nommée et qu'elle soit gardée ; il ne choisit pas son type ».*
- Le **`02-` §6 A** est **LE format de la référence décomposée**, et il fait foi contre tout le reste : les trois unités, leurs champs, leurs listes de valeurs, l'armature, le renvoi et le rejet. Le **§6 B.1** est **le pipeline de conception en modes réceptifs**, dans son ordre. Le **§6 « Les principes de la banque »** porte la **règle de non-emboîtement**.
- Le **`05-`** est **le générateur** : le partage code / modèle *(§1)*, pourquoi trois passages et lequel voit quoi *(§2)*, **les trois prompts entre leurs marqueurs** *(§3)*, et **ce que le professeur refuse, bloque ou signale, plus son écran** *(§4)*. ⛔ **Il ne porte pas le format** : *« En cas de divergence entre les deux, le `02-` a raison et ce document est en dette. »*

**Rien de plus : la règle de manifeste veut que ce qui n'y figure pas ne se lise pas** *(`07-` §2)*. **Six précisions, et deux d'entre elles décident de la forme de ton lot :**

- ⛔ **Le `01-routeur.md` N'EST PAS à ton manifeste** — donc **la règle du non-spoiler ne se lit pas à sa source**. ⭐ **Ce n'est pas une privation, parce qu'elle est déjà écrite en code** : `filtreDuNonSpoiler` *(`utils/moteur/vivier.ts`, C4-L12)*, avec ses quatre régimes et sa `borne_amont` journalisée. **Tu réemploies ; tu ne réécris pas la règle** *(piège 24)*.
- ⛔ **Le `04-Instances_Exercices.md` N'EST PAS à ton manifeste non plus** — donc **la banque de consignes ne se lit pas à sa source**. ⭐ Elle est **dérivée en base** depuis C4-L8 : `exercices_routes`, **3264 lignes**, par `scripts/derive-doctrine.py`. **Tu lis les tables dérivées, jamais le `04-`** *(pièges 31 et 33)*.
- ⛔ **`SPEC_C3_exercices_competences.md` est ARCHIVÉE : elle ne fait foi sur rien, et elle ne se cite jamais.** Elle traîne à la racine du dépôt `palimpseste` — **ne l'ouvre pas**. Il en va de même de `FUSION_revues_C3.md`, `revue_adversariale_SPEC_C3.md` et `AMENDEMENTS_C3_en_attente_2026-07-31.md`.
- ⛔ **Aucun relevé de lot ne se lit** — ni celui de C4-L8, ni ceux de C4-L12 ou C4-L16. **Ce que ces lots avaient à te dire est dans les pièges ci-dessous** : c'est le sens même de la boîte aux lettres du `PLAN_DE_CHANTIER.md` §5, et **la tienne est vidée dans ce prompt** *(piège 5)*.
- ⛔ **`MAQUETTE_Ecran_Validation_Reference.html` est une maquette, PAS une spécification** — le `05-` §5 le dit lui-même. L'écran fait foi au **§4.4**.
- **Le code du dépôt n'est pas une source, c'est ton terrain.** Les fichiers, les comptes et les lignes nommés ci-dessous ont été **vérifiés à la fabrication** ; ce sont des repères, pas des autorités. **En cas de doute entre ce prompt et une source du manifeste, la source a raison.**

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

**Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-` §2 : *déposé* → *relu et validé* → *versé et bancé*, **cumulatifs** ; « VALIDÉ ET GELÉ » vaut *relu et validé*. *Vérifié à la fabrication : `07-` **2.52 / RELU ET VALIDÉ**, `02-` **5.5 / VALIDÉ ET GELÉ**, `05-` **2.0 / VALIDÉ ET GELÉ** — **rien ne bloque**.*

**La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ci-dessus, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux.

**Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot. ⚠️ *Sans objet ici : aucune fiche de compétence n'est à ton manifeste.* **Ce qui, chez toi, est granulaire, c'est autre chose : tes trois gestes ne dépendent pas les uns des autres.** Le générateur *(A)* se joue seul ; la sélection non-spoiler *(B)* se joue seule ; et **le troisième** *(C)* **est un constat avant d'être un chantier** *(piège 30)*.

**Tes deux dépendances sont jouées.** `C4-L1` *(trois migrations du 18/08)* et `C4-L8` *(quatre migrations du 20/08)* figurent au `SUIVI_SQL.md` comme **exécutées en sandbox** — *« il travaille sur un corpus déposé et validé »* *(`PLAN_DE_CHANTIER.md` §3)*.

### Cinq contrôles machine à jouer AVANT d'écrire une ligne

```bash
npm test
```

```bash
python3 scripts/derive-doctrine.py --verifie
```

```bash
python3 copies-tests/_commun/verifie-reference.py --autotest
```

```bash
python3 copies-tests/_commun/derive-prompts.py --competence generateur --fiche 05-GENERATEUR_Reference_Decomposee.md --verifie
```

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/register-ts-resolver.mjs --test utils/fabrique/verifie-reference.test.ts
```

*(le 1er, le 2e et le 5e dans `palimpseste` ; le 3e et le 4e dans `palimpseste-conception`)*

**1. `npm test` doit rendre `fail 0`.** *Mesuré à la fabrication : **tests 1483, pass 1483, fail 0, skipped 0**, en ~4,1 s.* ⚠️ **Note le compte avant de commencer** : un test qui disparaît est aussi silencieux qu'un test qui tombe, et **un vert n'est une preuve que si l'on sait combien de vert il y avait**.

**2. `derive-doctrine.py --verifie` — vert à la fabrication.** La partie qui tourne sans base rend **`FIXTURE : IDENTIQUE`**, avec son résumé *(13 objets · 9 crans · 46 couples objet × mode · **544 déclarations de routage → 3264 lignes de route** · 15 patrons · 24 guides)*. **Les douze tables demandent que tu joues le SQL contre la sandbox.** ⛔ **S'il dit `DIVERGE`, rejoue `--sql` en un geste séparé et journalisé, jamais au milieu de ton lot — et ne corrige JAMAIS la base à la main.**

**3. `verifie-reference.py --autotest` doit rendre `AUTOTEST : tout passe`.** *Mesuré : **58 vérifications**.* ⭐ **C'est le contrôle qui FAIT FOI sur la référence** — treize refus, deux blocages, sept signalements, *« et il ne les confond pas »*.

**4. `derive-prompts.py` — les trois prompts du générateur, octet pour octet.** *Mesuré : `✓ G1`, `✓ G2`, `✓ G3`.* ⚠️ **L'option `--fiche` est OBLIGATOIRE ici** : sans elle le script cherche `competences/generateur.md`, qui n'existe pas, et **sort en erreur**. Ce n'est pas une source fausse, c'est une invocation.

**5. Le port de la référence en plateforme.** *Mesuré : **41 tests, 41 pass, fail 0**.* ⭐ **C'est ton étalon de non-régression le plus important** : quoi que tu ajoutes autour du format, **ces 41 vecteurs doivent rester verts**.

> ⚠️⚠️ **DEUX FAITS D'ÉTAT, vérifiés à la fabrication, qui ne sont pas des contrôles mais qui décident de ton dernier geste.**
> **(a) La PROD EXISTE depuis le 25/08** *(projet `ucmngachkxvvlegntuwh` ; la sandbox reste `aoakpxxlyvthzueaywna`)*. **Un push est désormais un déploiement en vraie prod**, et le `SUIVI_SQL.md` porte deux cases, Sandbox **et** Prod.
> **(b) L'arbre de travail n'était pas propre** — du code de `C8-L4` et de `C4-L16` y vivait, non commité, et une migration de C8-L4 restait **à jouer en prod avant tout push**. **Regarde `git status` avant de committer quoi que ce soit**, et ne pousse jamais le travail d'un autre lot avec le tien.

---

## La mission — reprise du `07-Implementation.md` §2

> **C5-L1 — La conception, côté professeur.** Le choix de l'**extrait ou de la tranche** — **non-spoiler : seul l'amont exposé est servi** —, les questions engendrées depuis la consigne-gabarit du type, et le **geste central : la référence décomposée, engendrée puis validée**.

### A. La référence décomposée, ENGENDRÉE — le geste pour lequel le lot existe

**Trois passages, dans l'ordre, et l'ordre est le remède** *(`05-` §2)* : **G1** qualifie *(les phrases, PUIS les moments, PUIS les concepts)*, **G2** établit les lectures défendables *(sur les seules phrases en `defend_these`)*, **G3** écrit l'armature *(en dernier, et il reçoit tout)*.

**Et autour d'eux, le code, qui fait tout ce qui se calcule** *(`05-` §1)* : il **segmente le texte en phrases et les numérote** — *« les numéros de phrase sont la seule façon dont le modèle désigne un endroit »* —, il **retrouve les occurrences des concepts** à partir des formes citées, il **rend l'union** des statuts d'une phrase et de son moment, et il **contrôle la conformité au format avant que la référence soit soumise au professeur**.

⛔ **Rien de tout cela n'existe en plateforme aujourd'hui.** `exercices_references` n'a qu'un écrivain — `utils/fabrique/import-ecriture.ts` — et l'écran de la conception le dit en toutes lettres : *« Aucun appel de modèle ici : ce qui s'engendre — matériaux, appuis, références — s'engendre au générateur, hors plateforme, et arrive par l'import. »* **C'est cette phrase que ton lot rend fausse, et il faudra la corriger là où elle est écrite.**

### B. Le choix de l'extrait ou de la tranche, sous non-spoiler

Le `02-` §6 B.1 donne les sept temps, dans l'ordre : le texte, **la sélection** *(mot · phrase · extrait · texte complet → le `support` et la `localisation`)*, **l'englobant**, l'objet, le mode puis le cran, **le cran qui décide si la sélection est cible ou source**, la consigne.

⚠️ **Six de ces sept temps sont construits** *(`app/prof/conception/nouvelle/Pipeline.tsx`, C4-L8)*. **Le deuxième ne l'est pas** : la sélection s'y saisit en **quatre nombres tapés à la main** — début, fin, début d'englobant, fin d'englobant. **« Le choix de l'extrait », c'est là.**

### C. Les questions engendrées depuis la consigne-gabarit du type

⚠️⚠️ **Commence par le constat, il est court : `exercices_types.consigne_gabarit` est NULL sur les treize objets** — au seed de C4-L1 *(« NULL — le gabarit par objet fait foi au `02-` »)* comme au fichier d'amorçage de la prod du 25/08 —, **et le `02-` §1 déclare six colonnes dont aucune n'est un gabarit**. **La colonne n'a aucune source qui la remplisse.** *Vérifie-le d'un `select` avant d'aller plus loin ; puis lis le piège 30.*

### Ce que ce lot NE porte PAS

- ⛔ **la règle du non-spoiler**, qui est au `01-` §4 — **hors manifeste** — et **déjà écrite en code** *(piège 24)* ;
- ⛔ **la banque de consignes**, qui est au `04-` — **hors manifeste** — et **déjà dérivée en base** *(piège 31)* ;
- ⛔ **la passation côté élève**, qui est `C5-L2`, et **les mesures en réception**, qui sont `C5-L3` — *« aucune session ne construit un instrument manquant »* ;
- ⛔ **les onglets de la lecture et le déménagement de `app/prof/conception/`**, qui sont `C5-L4` — *« on ne réorganise pas la navigation »* ;
- ⛔ **le repli documenté du `05-` §2** *(couper G1 en deux, G1a les phrases / G1b les moments)* : il attend le banc, il ne se construit pas d'avance ;
- ⛔ **aucune règle neuve de conception.** Tout ce que ce lot sert est écrit, et gelé.

---

## Les pièges — les décisions dont l'oubli coûte une migration

*Tirés des sources du manifeste et **vérifiés sur pièces à la fabrication**. Chacun porte son renvoi. **En cas de doute entre ce prompt et la source, la source a raison.***

### Le format : le trou entre deux sources, et il est au cœur de ton lot

**1. ⭐⭐ LE FORMAT N'A AUCUNE PLACE POUR LES INTERVALLES QUE LE `05-` §1 DEMANDE AU CODE DE PRODUIRE — et les y mettre REFUSE la référence.** Le `02-` §6 A écrit *« trois unités, toutes localisées en **intervalles** dans le texte »* ; le `05-` §1 écrit *« il convertit les numéros de phrase en intervalles […] c'est lui, et lui seul, qui produit les bornes que la référence porte »*. **Mais le format déclaré ne connaît que des NUMÉROS DE PHRASE** — vérifié sur les trois pièces : la fixture réelle *(`copies-tests/generateur/exemple-descartes.json` : un moment est `{m, de, a, fonction, cible, statuts, etiquette}`, `de` et `a` valent `1` et `6`)*, le contrôle qui fait foi *(`verifie-reference.py`, `CLES["moment"]`)*, et son port en plateforme *(`utils/fabrique/verifie-reference.ts`, mêmes clés)*. ⛔ **Ajouter une clé `intervalle` déclenche le refus n° 11 — *« un champ que le format ne déclare pas »* — et la référence n'est même pas soumise au professeur.** ⭐ **La sortie qui ne casse rien : l'intervalle se DÉRIVE à la lecture**, du numéro de phrase et de la segmentation qui fait foi, et ne se stocke jamais — *un second domicile de ce que `de`/`a` disent déjà finirait par diverger*. **Quoi que tu choisisses, les 41 vecteurs du port doivent rester verts, et tu le dis à ton relevé.**

**2. Les occurrences des concepts se retrouvent, elles ne se stockent pas non plus.** Le `05-` §1 : *« il retrouve les occurrences des concepts par recherche des formes que le modèle a citées. Le modèle ne localise ni ne compte rien. »* Or `CLES["concept"]` ne déclare que `{concept, formes}` — vérifié des deux côtés. **Même raisonnement, même refus n° 11.**

**3. La segmentation FAIT FOI, et elle est partagée.** *« La segmentation qui fait foi est celle du pré-relevé mécanique de la Synthèse — le même découpage, pour que la référence et les copies se comptent en phrases identiques »* *(`05-` §4.7)*. Elle est déjà portée : `phrasesDuTexte` *(`utils/fabrique/verifie-reference.ts`)*. ⚠️ **Et son piège est documenté au-dessus d'elle** : `\s` **n'est pas le même jeu de caractères** en Python et en JavaScript — le `\s` de Python prend NEL, celui de JavaScript prend le BOM. **Deux moteurs, deux comptes de phrases pour le même texte.** *Ne récris pas cette fonction ; réemploie-la.*

**4. Le contrôle machine EXISTE en plateforme, et le crible « cite ou refuse » n'y vit pas — délibérément.** `utils/fabrique/verifie-reference.ts` est le port fidèle de `verifie-reference.py`, tenu honnête par les vecteurs de l'autotest rejoués *(41 tests verts)*. **Son en-tête dit pourquoi le crible reste dans l'autre dépôt** : *« la plateforme n'a pas les sources sous la main ; son équivalent est le contrôle de dérivation »*. ⛔ **N'introduis pas un second contrôle**, et **ne recopie aucune liste du `02-` §6 A ailleurs** que là où elles le sont déjà.

**5. ⭐ L'ÉCRAN DE VALIDATION EXISTE — c'est l'item de ta boîte aux lettres, et il dit « à réemployer, pas à construire ».** `app/prof/conception/reference/[id]/page.tsx` et son `LectureAnnotee.tsx` suivent le `05-` §4.4 : **la lecture annotée par défaut** *(armature en tête, moments en filet de marge, seul ce qui n'est pas ordinaire marqué)*, **le formulaire à un bouton qui ne disparaît jamais**, et **le bandeau** qui porte le verdict, les blocages, les signalements et le nombre de valeurs déclarées. L'action `validerReference` porte **le geste unique**, `devaliderReference` la dévalidation explicite *(`app/prof/conception/actions.ts`)*. ⚠️ **Ce que l'écran ne sait pas faire aujourd'hui : partir d'un texte qui n'a pas encore de référence.** *C'est le seul bout qui te revient.*

**6. Refuser, bloquer et signaler ne sont pas la même chose, et le `05-` §4.7 exige qu'on ne les confonde pas.** **Treize refus** *(la référence n'est pas soumise : on régénère, on ne dérange pas le professeur — code de sortie `1`)*, **deux blocages** *(le professeur tranche — code `0`, elle lui EST soumise)*, **sept signalements** *(ils s'affichent, ils n'arrêtent rien)*. ⛔ **`hesitation` NE BLOQUE JAMAIS** : *« c'est un journal de bord, jamais un instrument […] on ne le bloque pas sur une machine qui hésite ; on le bloque sur un trou qu'elle ne peut pas combler »*.

**7. Une correction repasse le contrôle §4.1 AVANT que la validation redevienne possible** *(`05-` §4.5)* — *« déplacer une frontière de moment peut ouvrir un trou de couverture, et un trou ne passe jamais en silence »*. ⚠️ **Et une référence validée est IMMUABLE en base** : le trigger `garde_reference_immuable` *(C4-L1)* refuse toute modification du `contenu`, de l'`empreinte`, de la source et de la `localisation`. **Corriger après validation passe donc par une dévalidation explicite, jamais par un `update` silencieux.**

**8. La validation est un ÉTAT, jamais une trace.** *« Ni date, ni journal dans la référence, et une seule décomposition par texte, sans versions »* *(`05-` §4.5 ; `02-` §6 A)*. `validee_at` est l'état ; l'`empreinte` **unique** — sha256 du texte source normalisé — est ce qui tient *« un texte ne se décompose jamais deux fois »*.

**9. Le paratexte se corrige tout seul, et il ne faut surtout pas l'aider** *(`05-` §4.6)*. *« Le dépôt dépose le texte, pas son appareil. Ni le générateur ni le code n'ont à le deviner : une règle sur les crochets finirait par manger une phrase légitime, en silence. »* **La couverture sans trou fait apparaître l'appareil sous la forme d'un moment intitulé « avertissement d'édition » — et le professeur, qui lit, le voit aussitôt.** ⛔ **Aucune heuristique de nettoyage.**

### Le générateur : le partage code / modèle, et ce qui se dérive

**10. L'ordre à l'intérieur de G1 est imposé, et ce n'est pas cosmétique** *(`05-` §2)*. Les phrases se qualifient **avant** que le découpage soit décidé : *« un modèle qui a posé "M2 réfute M1" écrira `rapporte` sur une phrase qui affirme, parce que ça arrange son découpage »*. **Un seul appel qui rendrait tout d'un coup rouvrirait le halo que les trois passages ferment.**

**11. G3 est le seul passage autorisé à contredire le précédent — et il le dit dans `hesitation`.** *« Une phrase porteuse mal qualifiée **bloque la validation** au lieu de refuser la référence »* : le professeur reçoit donc le blocage **avec sa raison**. ⛔ **Ne laisse pas G1 écarter en silence une thèse que G3 a vue** — *« ce serait faire décider le passage le plus aveugle »*.

**12. ⭐⭐ LES TROIS PROMPTS SE DÉRIVENT, JAMAIS NE SE TAPENT — et le gel porte sur eux.** Le `05-` §3 les porte **entre leurs marqueurs** `<!-- DEBUT-PROMPT-G1 -->` … `<!-- FIN-PROMPT-G3 -->`, et son en-tête est explicite : *« les fichiers de `copies-tests/generateur/prompts/` en sont **dérivés** […] et ne s'éditent jamais à la main — **le gel porte donc sur les prompts eux-mêmes** »*. **La plateforme n'en a aucune copie**, et le patron est posé deux fois dans le dépôt : `scripts/derive-doctrine.py` *(la doctrine)* et `scripts/derive-instruments.py` *(les instruments, la transcription et le gabarit du retour, versés dans `utils/chaine/derive/`)*. ⛔ **Ce qu'il te faut est donc une dérivation, avec son `--verifie` qui sait dire DIVERGE — jamais un `const PROMPT_G1 = \`…\`` tapé dans un fichier.** ⚠️ *Où elle vit — un troisième script, ou une extension de `derive-instruments.py` — **t'appartient** ; qu'elle existe et qu'elle se contrôle, non.*

**13. Le modèle ne produit JAMAIS un nombre qu'on ne peut pas vérifier en lisant** *(`05-` §1)*. Les trois prompts l'écrivent chacun : *« aucun chiffre : ni pondération, ni pourcentage, ni degré de confiance. Aucun champ n'en demande. »* ⭐ **Et le refus n° 11 est la garde de cette décision** : *« la crédence cible chiffrée a été retirée du format, et un champ inventé est le seul chemin par lequel elle y rentrerait »*.

**14. Le coût se journalise PAR APPEL, dans `api_couts`, qui existe — un lot le réutilise, il n'en crée pas un second.** ⚠️ **Et ta `phase` vaut `NULL`** : la contrainte n'admet que `p1`, `p2`, `retour` ou NULL, et *« la `phase` dit l'étage […] NULL hors exercices »* *(`07-` §1.2)* — **le générateur n'est pas un étage de la chaîne froide**. *Trois appels par texte : le nombre d'appels se lit au nombre de lignes, jamais à un compteur.* ⚠️ **supabase-js ne lève pas** : il rend `{ error }` — une écriture dont on ignore le retour échoue **invisiblement**, même sous `try/catch`.

**15. Un texte d'auteur qui part au modèle est du MATÉRIAU, jamais une instruction.** Le patron existe : `utils/chaine/anti-injection.ts` *(bornes `<<<MATERIAU` / `MATERIAU>>>`, neutralisation de toute tentative de refermer la balise depuis l'intérieur)*. ⚠️ **Et aucun outil n'est jamais attaché à ces appels** — c'est vrai par construction dans `AppelIA`, qui n'a pas de champ `tools` : **ne lui en ajoute pas un.**

**16. Deux règles de circulation appartiennent au code, et elles se perdent facilement** *(`05-` §1)*. *(a)* **Le statut porté par un moment vaut pour ses phrases sans y être recopié** : quand un consommateur demande les statuts d'une phrase, le code rend **l'union** de ceux de la phrase et de ceux de son moment. *(b)* **On ne passe à un consommateur que ce que sa règle lit** — c'est ce qui rend vraie la clause *« une valeur nouvelle est inerte tant qu'aucune règle ne la lit »*. ⚠️ **Mais une valeur NON DÉCLARÉE au `02-`, elle, continue d'atteindre le consommateur et d'y lever une alerte : c'est un vrai défaut, et il doit se voir.**

**17. Le coût de la validation est chiffré, et c'est lui qui a décidé de l'écran** *(`05-` §4.4)* : **8 à 10 min** par texte de 400 mots en lecture annotée, **~22 min** au formulaire, **8 à 13 h** pour 70 textes. *« Le poste qui pèse est le même dans les deux vues : les lectures défendables. C'est le seul endroit où il y a vraiment à lire, et c'est voulu. »* ⚠️ **Tant que le générateur n'a pas de banc, la vue réduite est un pari** : le formulaire **ne disparaît jamais**.

**18. Deux erreurs coûtent, en sens inverse — et les prompts le disent à la place de la doctrine.** Une lecture défendable oubliée fait compter **en contresens** l'élève qui l'a suivie ; une lecture inventée fait passer **un vrai contresens pour juste**. Idem pour l'armature : *« si tu prends pour thèse une position que l'auteur COMBAT, l'élève qui a bien lu sera compté en contresens »*. ⛔ **Ne cherche pas à « améliorer » un prompt gelé pour réduire l'un des deux côtés.**

### Le texte : d'où il vient, et où il va

**19. ⚠️⚠️ AUJOURD'HUI, UN `exercices_textes` NE NAÎT QUE DE L'IMPORT — et le « fait quand » commence par « un texte se dépose ».** La table porte `id_import text not null unique` et `empreinte text not null unique` *(`c4_l8_fabrique.sql`)*, et son seul écrivain est `utils/fabrique/import-ecriture.ts`. ⭐ **Le texte lui-même, lui, a déjà un domicile** : `scriptorium_contenus`, de `type` `'texte'`, déposé à la bibliothèque du Scriptorium — et `exercices_textes.contenu_id` y pointe déjà, `not null`. **Ce qui manque est le pont : faire naître la ligne d'`exercices_textes` et sa référence sans passer par un fichier.** ⛔ **Jamais une seconde table de textes**, et **jamais un `id_import` inventé qui ressemblerait à un identifiant de fichier** — *si tu dois en fabriquer un, qu'il dise d'où il vient, ou rends la colonne nullable par migration additive et dis-le.* **La forme t'appartient ; le fait qu'il n'y ait qu'un domicile, non.**

**20. La garde absolue vit à UN SEUL endroit, et c'est la pire à laisser en double.** *« Une référence non validée n'entre jamais en Phase 2 »* : le prédicat est dans `utils/reference-validee.ts` *(C4-L11, qui l'a précisément dé-dupliqué)*, et **le trigger `garde_reference_validee`** le tient en base, sur `exercices_squelettes`. ⛔ **N'écris pas une troisième copie du prédicat.** ⚠️ **Et les deux motifs de refus ne se fondent pas en un seul** — *« aucune référence déposée »* et *« une référence déposée mais non validée »* n'appellent pas le même geste du professeur : **l'une se décompose, l'autre se relit.**

**21. La dévalidation ne défait pas les instances déjà assignées — c'est tranché, et assumé.** L'écran ferme **la conception à venir** et **ne retient rien de ce qui est déjà assigné** ; le retour dit le nombre d'instances concernées et invite à les retirer une à une. *« Un message honnête suffit »* *(`PLAN_DE_CHANTIER.md` §6)*. ⛔ **Rien de ton lot ne le change.**

**22. À l'import, une instance dont le renvoi vise une référence inexistante ou non validée est refusée en file de validation — rejet sec, et le motif NOMME la référence** *(`02-` §6 A)*. *C'est déjà porté ; ne le déplace pas.*

### L'extrait, la tranche, et le non-spoiler

**23. ⚠️⚠️ « LA TRANCHE » N'EST DÉFINIE NULLE PART, ET C'EST UNE DÉCISION, PAS UN OUBLI À COMBLER.** Le mot n'apparaît dans les neuf sources qu'à **deux endroits** : ta propre entrée du `07-` §2, et le `02-` §6 A — *« c'est par ces intervalles que la Phase 2 reçoit sa **tranche de référence** »*. **Deux lectures possibles** : la tranche est **un segment du livre** *(la semaine du plan de lecture, ce que « seul l'amont exposé est servi » suggère)*, ou **la part de la référence servie à la Phase 2** *(ce que le `02-` §6 A dit littéralement)*. ⛔ **Ne tranche pas seul, et n'invente aucune troisième lecture.** **Construis ce qui est certain** — la sélection dans le texte, bornée par ce qui est exposé — **et pose la question à Louis, nommément, dans ton relevé.**

**24. ⭐⭐ LE NON-SPOILER EXISTE, IL EST CELUI DU ROUTEUR, ET « LA BORNE DE LA CLASSE N'EST PAS LA SIENNE ».** `filtreDuNonSpoiler` *(`utils/moteur/vivier.ts`, C4-L12)* porte **quatre régimes** — `hors_livre`, `sous_la_position`, `position_inconnue`, `au_dela` — et journalise sa `borne_amont` sur la décision. ⚠️ **Il est per-ÉLÈVE, et ton écran ne connaît aucun élève** : à la conception, le professeur bâtit une instance pour une classe. ⛔ **Ne réécris pas la règle, et surtout ne fabrique pas une « position de la classe »** qui serait une seconde échelle : la source du `01-` §4 est justement hors de ton manifeste, et **le code qui l'applique fait autorité sur la forme, pas sur la règle**. *Ce qui te revient : borner ce que le professeur peut SÉLECTIONNER, et dire à l'écran quelle borne s'applique.*

**25. L'échelle du plan de lecture est UNE, et trois choses qui lui ressemblent n'en sont pas** *(`07-` §1.1)*. Les semaines du plan sont **l'ordinal de découpage du livre dans le Scriptorium** — `scriptorium_documents.semaine` — et **la position de l'élève est la dernière qu'il a lui-même terminée**, lue sur `aletheia_travaux.semaine_index` au statut `DONE` : *« c'est la même échelle, et le code les compare **par égalité** »*. ⛔ **Ce n'est ni la semaine du parcours de la classe** *(un calendrier, absent quand le livre se lit hors plan)*, **ni le numéro affiché à l'élève** *(renuméroté quand seules certaines séances sont exposées)*.

**26. Le couple {livre, semaine} ne se sépare jamais.** Le `CHECK` `textes_plan_couple_chk` garantit que la semaine et le livre déclaré vont **ensemble**, jamais l'un sans l'autre — **on lit donc le couple**. *Et un texte hors livre n'en porte aucun : le non-spoiler n'a alors rien à comparer, et c'est le repli, pas un défaut.*

**27. C'est l'ENGLOBANT, jamais la sélection, que la plage admise de `support_source` borne** *(`02-` §6 B.1, point 4)* — *« l'objet n'est pas le support : sur "quel est le plan de ce texte", l'objet est `plan` et l'englobant un `extrait` »*. ⚠️ **Et c'est l'englobant que la règle de non-emboîtement lit** — *« l'étendue réellement lue »* — **dans les deux sens** : interdit de servir un grain englobant une localisation déjà travaillée par cet élève sur ce texte, et l'inverse. **Il est obligatoire et non vide sur l'objet « la phrase », dont la règle d'instance exige le co-texte.**

**28. Le cran décide si la sélection est `materiau_cible` ou `materiau_source` — le professeur ne l'assigne pas** *(`02-` §6 B.1, point 6)*, et **la cible est `null` dès que l'élève produit du neuf**. *C'est déjà tenu par le Pipeline ; ne le défais pas en changeant la saisie de la sélection.*

**29. La règle de non-emboîtement ne lit que le matériau qui porte le `texte_auteur`** — *« le plus souvent le `materiau_source`, mais pas toujours »* : « réécris cette phrase de Descartes en langage clair » met le texte d'auteur **en cible**. *Un paragraphe `genere` n'a aucune localisation dans un texte, donc rien à emboîter.*

### La consigne-gabarit, et les questions

**30. ⚠️⚠️ `consigne_gabarit` EST UNE COLONNE SANS SOURCE — dis-le, ne la remplis pas.** Elle est déclarée au `07-` §1.1 *(« à plat sur la ligne : […] le `mode_saisie`, la `consigne_gabarit`, et `actif` »)*, elle est **NULL sur les treize objets**, et le seul renvoi qui existe — le commentaire du seed, *« le gabarit par objet fait foi au `02-` »* — **pointe dans le vide** : le `02-` §1 déclare **six colonnes** *(objet, nature, grain, `support_source`, `genre`, compétences)*, et aucune n'est un gabarit. ⛔ **Un lot Code ne tranche aucune question de source** : **tu constates, tu le portes à ton relevé et à ton amendement du `07-` §2, et tu ne fabriques pas un gabarit.** ⭐ **Ce qui reste faisable sans elle** : la banque de consignes du couple objet × mode × cran, **déjà dérivée et déjà servie**, avec sa réécriture de formulation — c'est le piège suivant.

**31. La banque de consignes est DÉRIVÉE en base, et le `04-` n'est pas à ton manifeste.** `exercices_routes` porte **3264 lignes** *(544 déclarations × leurs crans)*, remplies par `scripts/derive-doctrine.py`, et le Pipeline les sert déjà à l'étage 4. ⛔ **La doctrine est dérivée, jamais tapée, et il n'y a qu'un dériveur.**

**32. « La réécriture porte sur la FORMULATION, jamais sur l'observable »** *(`02-` §6 B.1, point 7)*. Le professeur choisit une consigne, **puis peut en réécrire la formulation avant de valider** — *« c'est le texte qu'il arrête que l'élève lit »*, et il vit sur l'instance sous le nom de `consigne_instanciee`. **L'observable, lui, est celui de la consigne choisie : il vient de la route, pas de la saisie.**

**33. ⚠️ Toute lecture des routes PAGINE.** C'est le défaut qui a fait naître `C4-L8-bis` : `chargerLignesDepuisBase` lisait `exercices_routes` **sans pagination**, PostgREST plafonnait à **1000 lignes sur 3264**, et **sept objets sur treize** n'avaient dès lors **aucune consigne** — sans un mot d'alerte. *Paginer, ordonner sur une clé unique, et confronter au `count: 'exact'` : le patron est dans `lireTable` de `utils/fabrique/doctrine.ts`.*

### Quatre choses transverses, vérifiées à la fabrication

**34. Aucun septième interrupteur** *(`07-` §5)*. **Le tien est `fabrique_actif`** — *« les écrans où le professeur fabrique sont-ils ouverts ? »* —, et les trois écrans de la fabrique le lisent déjà. ⛔ *« Un onglet, une liste, une porte ne sont pas des fonctionnalités à gater : un onglet dont l'interrupteur est à OFF s'affiche, et son contenu dit pourquoi il est vide. »* ⛔ **Et n'emprunte pas `chaine_actif`** : c'est le seul des six qu'une machine bascule *(la coupure automatique de coût)* — **une facture qui coupe le 12 du mois fermerait un écran que personne n'a décidé de fermer.**

**35. Trois pièges de `supabase-js`, transverses et éprouvés.** Il **ne lève pas** *(il rend `{ error }`)* ; il **plafonne toute réponse à 1000 lignes sans rien signaler** ; et son **constructeur de requête est paresseux** — il ne part qu'au premier `then`, donc du code qui paraît parallèle peut être séquentiel.

**36. ⛔ `export type` dans un fichier `'use server'` TUE TOUT LE MODULE à l'exécution** — `tsc`, `npm test` et les recettes passent, et **seule une action à l'écran échoue**. `app/prof/conception/actions.ts` est un `'use server'` : si tu y ajoutes un type, exporte-le d'ailleurs.

**37. ⛔ Un `<textarea>` soumet en CRLF, et le stocké est en LF** — ça a mordu **deux fois** *(C4-L4, puis la garde de découpe de C4-L16)*. ⚠️ **`new FormData()` ne le montre PAS** : seule une sonde serveur pendant un vrai clic le voit. *Ton écran de validation en porte, et toute correction de référence passera par là.*

---

## Le « fait quand » — recopié du `07-Implementation.md` §2

*C'est la condition de recette, et **elle ne se négocie pas en séance**.*

> *Fait quand* : **un texte se dépose, se décompose, se valide, et sert une instance. Une référence non validée n'entre jamais dans une phase de jugement.**

**Cinq clauses, et elles se prouvent séparément.**

1. **un texte se dépose** — hors fichier d'import *(piège 19)* ;
2. **il se décompose** — G1, G2, G3, dans l'ordre, sur un texte réel, et le contrôle machine rend son verdict *(pièges 1 à 4, 10 à 12)* ;
3. **il se valide** — à l'écran qui existe, d'un seul geste, blocages tranchés et signalements affichés *(pièges 5 à 8)* ;
4. **il sert une instance** — le pipeline Aletheia va jusqu'au bout sur ce texte-là *(pièges 27 et 28)* ;
5. **une référence non validée n'entre jamais dans une phase de jugement** — et cela se prouve **par l'échec** : la garde en base doit refuser, pas seulement l'écran *(piège 20)*.

⚠️ **Ce que la deuxième clause te coûtera en vrai : trois appels de modèle sur un texte d'auteur.** *Le `05-` §4.4 chiffre la fixture réelle à 220 mots, 17 phrases, 4 moments, 9 lectures, 3 concepts, **65 valeurs déclarées** — c'est l'étalon dont tu disposes déjà, et `exemple-descartes.txt` est le texte qui va avec.*

⚠️⚠️ **Et ce que tu NE pourras probablement pas prouver en séance : la troisième pièce de la mission** *(piège 30)*. **Ce qui ne se prouve pas se dit** — et part au `SUIVI_tests_manuels.md`, **décoché, avec sa condition de reprise nommée**.

*Échéance* : **le `07-` §2 ne lui en donne aucune**, et le graphe la donne à sa place — **C5-L2 en dépend**, et rien d'autre. *Le lot n'est pas sur le chemin critique de la rentrée ; il est sur celui de la lecture.*

---

## Les conventions — `PLAN_DE_CHANTIER.md` §5

### Du dépôt

**Une ligne au `SUIVI_SQL.md` AVANT exécution, jamais après** — date, fichier, zone, cases **Sandbox** et **Prod**. *Si ton lot pose une migration* — le piège 19 peut en demander une — **elle en aura une, son rollback aussi.** **Toute migration est additive et gatée** : les **six** interrupteurs restent à OFF jusqu'à la recette — `exercices_actif`, `routeur_actif`, `competences_affichage_actif`, `fabrique_actif`, `chaine_actif`, `passation_classe_actif`.

⚠️ **Le reste du protocole n'est pas ici : il est en tête du `SUIVI_SQL.md`, règle R6** — **sandbox d'abord, prod ensuite, jamais l'inverse et jamais sans noter** ; **ne jamais rejouer un fichier de l'Archive** ; **protocole renforcé sur les tables vivantes** ; **répétition à blanc sur le CORPS du fichier**, jamais sur le fichier entier *(son `commit;` validerait ta transaction d'essai — c'est arrivé le 14/08)*. **Lis-le avant d'écrire ta migration** *(c'est aussi la règle absolue de l'`AGENTS.md`)*. ⚠️ **`scriptorium_contenus` est une table VIVANTE** — des textes et des cours réels y vivent, et un élève réel utilise la base.

**La doctrine en base est dérivée, jamais tapée, et il n'y a qu'un dériveur.** Avant de lire ces tables, `python3 scripts/derive-doctrine.py --verifie` doit dire **IDENTIQUE** sur les **douze** tables, les empreintes de source et la fixture. **S'il dit DIVERGE, rejouer `--sql` ; jamais corriger la base à la main.** ⭐ *Ton lot lit `exercices_routes` (piège 31) : la convention s'applique.*

### De clôture

**Ta section au `SUIVI_tests_manuels.md`**, au moment où le lot se clôt : ce qui a été **prouvé en séance, coché avec sa preuve**, et ce qui **reste à jouer en recette, décoché, avec sa condition de reprise nommée**. *Un reste de recette qui ne vit que dans un relevé ne se rappelle à personne.* ⭐ **Deux de tes cinq clauses ne se prouvent qu'à l'écran** *(la décomposition d'un texte réel, la validation d'un seul geste)*, **et la troisième pièce de la mission ne se prouve pas du tout** : ce sont exactement celles-là qui doivent y figurer.

### De dette

**Une source trouvée fausse se MARQUE, elle ne se corrige pas** *(`07-` §2)*. Deux gestes : **`[faux]`** au point de l'erreur, et **une ligne à la section DETTES** du `INVENTAIRE_Non_Tranches.md`, qui porte l'**avant / après**. ⭐ **Tu as au moins deux candidats sérieux** : *les intervalles que le `02-` §6 A et le `05-` §1 exigent et que le format ne peut pas porter* **(piège 1)**, et *le renvoi du seed vers un gabarit qui n'existe pas au `02-` §1* **(piège 30)**. ⚠️ *Ne confonds pas avec l'**inventaire des lots du `07-` §2**, qui est **OUVERT À L'IMPLÉMENTATION** : celui-là, tu l'amendes depuis ton relevé, sans accord préalable — ce n'est pas une dette, c'est ton travail.*

### D'ouverture de compétence

⚠️ **Sans objet ici** — ce lot n'ouvre aucune compétence dans la chaîne, et **les six sont déjà ouvertes**. La convention est recopiée parce que la recette se recopie entière ; **ne joue pas `derive-instruments.py --ecris`.** *Les mesures en réception sont `C5-L3`.*

---

### Et ce que ton relevé doit porter

Le nom du fichier : `RELEVE_C5_L1_2026-XX-XX.md`, à la racine du dépôt `palimpseste`. **Sept choses au minimum**, en plus du récit :

1. **ce que tu as fait des intervalles** *(piège 1)* — dérivés à la lecture, stockés autrement, ou laissés au numéro de phrase —, **avec le verdict des 41 vecteurs du port en face** ;
2. **d'où vient le texte qui se dépose** *(piège 19)* — la forme retenue pour `id_import`, et pourquoi elle ne fabrique pas un second domicile ;
3. **la dérivation des trois prompts** *(piège 12)* — où elle vit, ce que son `--verifie` compare, et la preuve qu'elle dit DIVERGE quand on dévie le dérivé d'un caractère ;
4. **ce que la décomposition a coûté sur un texte réel** — trois appels, leurs lignes à `api_couts`, la `phase` NULL, et le verdict du contrôle machine ;
5. **la question de « la tranche »** *(piège 23)*, posée à Louis nommément, avec les deux lectures et ce que tu as construit en attendant ;
6. **le constat sur `consigne_gabarit`** *(piège 30)* — le `select` qui le prouve, et **ton amendement à l'inventaire des lots du `07-` §2** ;
7. **ce qui reste à jouer en recette**, avec sa condition de reprise — parce que c'est cela qui part au `SUIVI_tests_manuels.md`, et de là à la recette du flux.
