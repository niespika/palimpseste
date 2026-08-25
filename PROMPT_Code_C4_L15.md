# PROMPT — Session Code : C4-L15 — Ce que l'écran montre du matériau, et ce qu'il cesse de montrer deux fois

> **À coller dans une session Claude Code fraîche.** Une session, un lot.
>
> Ce prompt est fabriqué selon la recette du `PLAN_DE_CHANTIER.md` §5. Ce que le lot construit, son manifeste et son « fait quand » font foi au `07-Implementation.md` §2 — ils sont recopiés ci-dessous avec **leurs versions au moment de l'écriture**, qui ne sont **pas** celles que le manifeste nomme *(voir le contrôle d'entrée)*.
>
> ⭐ **Le lot tient en trois gestes, et le premier est celui pour lequel il existe.** Le marquage dans le matériau, le guide qui cesse de s'afficher au cran 6, et trois vecteurs de retard au port de l'import. *Les trois règles sont écrites, gelées, et nées le 24/08 : **ce lot n'invente rien, il rattrape**.*

---

## Le manifeste — recopié du `07-Implementation.md` §2

> *Manifeste* : **ce document, §2** · `02-exercices.md` **v5.5**, §2.3.3 *(la longueur)* et §5 *(le marquage)* — VALIDÉ ET GELÉ · `04-Instances_Exercices.md` **v3.3**, §14.1 et §14.2 — VALIDÉ ET GELÉ · `08-FORMAT_IMPORT.md` **v1.4, format 1.2** — VALIDÉ ET GELÉ · `generateur/verifie-import.py` *(les 57 vecteurs)* et `generateur/web/index.html` *(l'aperçu qui joue le marquage)*.

« Ce document » est le `07-Implementation.md`. Les six pièces :

| Pièce | Où | Statut requis | Au moment de l'écriture |
|---|---|---|---|
| `07-Implementation.md`, **§2** | `/Users/louissagnieres/Documents/GitTest/palimpseste-conception/` | **aucun** — *« un lot n'exige pas un statut de la source qui le déclare »* *(`07-` §2)* | **VERSION 2.49** · RELU ET VALIDÉ · ⚠️ **régimes mêlés au §2** : la **règle de manifeste est GELÉE**, l'**inventaire des lots est OUVERT À L'IMPLÉMENTATION** *(en-tête du document)* |
| `02-exercices.md`, **§2.3.3 et §5** | même dépôt | **relu et validé** *(explicite : « VALIDÉ ET GELÉ »)* | **VERSION 5.5** · VALIDÉ ET GELÉ · ✅ **conforme au manifeste** |
| `04-Instances_Exercices.md`, **§14.1 et §14.2** | même dépôt | **relu et validé** *(explicite)* | ⚠️ **VERSION 3.5** — le manifeste dit **3.3**. VALIDÉ ET GELÉ. **La version a bougé, et elle a bougé DANS tes sections** *(piège 1)* |
| `08-FORMAT_IMPORT.md` — **le document entier** | même dépôt | **relu et validé** *(explicite)* | ⚠️ **VERSION 1.5, format 1.3** — le manifeste dit **1.4, format 1.2**. VALIDÉ ET GELÉ. **La version a bougé, hors de tes sections** *(piège 2)* |
| `generateur/verifie-import.py` | même dépôt | **déposé** *(entrée sans statut explicite — `07-` §2)* | ⚠️ **`--autotest` joue 62 vecteurs**, pas 57 *(pièges 23 et 24)* |
| `generateur/web/index.html` | même dépôt | **déposé** *(entrée sans statut explicite)* | l'aperçu élève joue le marquage — **spécification exécutable, pas implémentation** *(`07-` §2)* |

⚠️ **Le manifeste ne borne PAS le `08-` à quelques sections, et ce prompt ne le bornera pas non plus.** Il te donne le document entier. *Un prompt plus strict que sa source perd des données en silence.* Ce qui suit dit seulement **où lire d'abord**, jamais où s'arrêter.

**Ce que chaque pièce fait ici.**

- Le **`07-` §2** porte **ta mission, ton « fait quand » et ton échéance** — recopiés en pièces 4 et 6 ci-dessous —, la **règle de manifeste** elle-même, et la **règle de dette** *(« une session Code ne corrige jamais une source »)*. ⭐ **Son inventaire des lots est OUVERT** : tu l'amendes depuis ton relevé, sans accord préalable.
- Le **`02-` §5** est **la source du geste 1** : la table « Ce que l'écran met en évidence dans le matériau », le motif *(« mesure la **recherche** et non le **sens** »)*, la garde négative du cran 3, et ce que l'écran sert par ailleurs — **quatre candidats**, la répartition de jetons sur 100, le plancher de trois distracteurs.
- Le **`02-` §2.3.3** est **la source du geste 3** : la table des longueurs par cran, et la clause qui gouverne tout — *« CE SONT DES FRACTIONS DE L'ÉTENDUE DU SUPPORT, JAMAIS DES COMPTES ABSOLUS »*. Lis-y aussi les deux matériaux et ce qu'est une provenance `genere` : **la règle ne porte que sur elle.**
- Le **`04-` §14.1** est **la source du geste 2** : les quinze patrons de production, et l'avertissement qui EST la règle — *« AU CRAN 6, LE GUIDE EST DANS LA CONSIGNE — ET NE S'AFFICHE DONC PAS DEUX FOIS »*, avec son ⛔ sur le cran 2. Le **§14.2** donne les vingt-quatre guides, et c'est **lui qui remplit la case** du patron.
- Le **`08-`** dit **ce que le format porte et ce qu'il ne portera pas**. Lis d'abord le **§5** *(la table des champs de l'exercice — la ligne `guide` porte déjà ta règle —, et surtout le paragraphe « CE QUE L'ÉCRAN MARQUE DANS LE MATÉRIAU NE SE DÉCLARE PAS ICI »)*, le **§5.1 et §5.2** *(les deux matériaux, les champs du cas et leurs conditions de cran)*, le **§4** *(la banque `materiaux[]` — c'est là que vivent `contenu` et `version_corrigee`)* et le **§7** *(les refus, les blocages, les signalements, le contrôle machine et ses codes de sortie)*.
- **`verifie-import.py`** est **le contrôle dont tu recopies les vecteurs**, et **`web/index.html`** est **l'algorithme du marquage, déjà écrit et déjà joué**. *Ce sont des pièces du manifeste : tu les lis, tu ne les modifies pas.*

**Rien de plus : la règle de manifeste veut que ce qui n'y figure pas ne se lise pas** *(`07-` §2)*. Cinq précisions pour que la règle ne fasse pas trébucher :

- l'`AGENTS.md` du dépôt n'est pas une source : Claude Code le charge d'office, il porte les conventions du repo — **dont la règle SQL absolue** ;
- ⛔ **`SPEC_C3_exercices_competences.md` est ARCHIVÉE : elle ne fait foi sur rien, et elle ne se cite jamais.** Elle traîne à la racine du dépôt `palimpseste` et son nom ressemble à ton sujet — **ne l'ouvre pas**. Il en va de même de `FUSION_revues_C3.md`, de `revue_adversariale_SPEC_C3.md` et de `AMENDEMENTS_C3_en_attente_2026-07-31.md` ;
- ⛔ **aucun relevé de lot ne se lit** — ni `RELEVE_C4_L14_2026-08-24.md`, ni ceux de C4-L3, C4-L8 ou C4-L11. La règle de manifeste l'interdit, et ce n'est pas une privation : **ce que ces lots avaient à te dire est dans les pièges ci-dessous** ;
- ⛔ **le `INVENTAIRE_Non_Tranches.md` n'est pas à ton manifeste non plus** — sauf pour **y écrire** une dette, ce que la convention te demande. Ses items 67 et 68 te sont **explicitement retirés** *(voir « Ce que ce lot NE porte PAS »)* ;
- **le code du dépôt n'est pas une source, c'est ton terrain.** Les fichiers nommés dans les pièges sont des repères vérifiés à la fabrication, pas des autorités : **en cas de doute entre ce prompt et une source du manifeste, la source a raison.**

---

## Le contrôle d'entrée — en deux temps, et les deux ne font pas la même chose

**Le statut bloque.** Un fichier du manifeste dont l'en-tête porte un statut inférieur à celui exigé **arrête le lot**, explicitement. Le barème est au `07-Implementation.md` §2 : *déposé* → *relu et validé* → *versé et bancé*, **cumulatifs** ; « VALIDÉ ET GELÉ » vaut *relu et validé*. *Vérifié à la fabrication : les quatre documents portent leur statut, **rien ne bloque**.*

**La version avertit.** Si la ligne VERSION d'un fichier du manifeste diffère de celle inscrite ci-dessus, **relis son en-tête avant de continuer** — une version qui bouge dit qu'un texte a changé, pas qu'il est devenu faux. ⚠️⚠️ **Deux ont bougé, et la fabrication a lu ce qui a changé pour toi** : c'est le contenu des pièges 1 et 2. **Relis-les quand même** : elles peuvent avoir rebougé depuis.

**Le blocage est granulaire quand il peut l'être.** Une fiche de compétence absente ou non bancée bloque **cette compétence**, pas le lot. ⚠️ *Ici la clause est sans objet : aucune fiche de compétence n'est à ton manifeste.* Elle est recopiée parce que la recette se recopie entière. **Ce qui, chez toi, est granulaire, c'est autre chose : tes trois gestes sont indépendants.** Si l'un se révèle impossible, les deux autres se jouent — et le troisième se dit au relevé.

### Trois contrôles machine à jouer AVANT d'écrire une ligne, et ils ne disent pas la même chose

```bash
python3 generateur/verifie-import.py --autotest
```

```bash
npm test
```

```bash
python3 scripts/derive-doctrine.py --verifie
```

*(le premier dans `palimpseste-conception`, les deux autres dans `palimpseste`)*

**1. `--autotest` doit rendre `✓ tout passe`.** C'est le contrôle **dont tu vas recopier les vecteurs**. ⚠️ **Mesuré au moment de l'écriture : `autotest : 62 vérification(s) jouée(s)` · `✓ tout passe`** — pas 57, et pas 53. **Le compte bouge sous toi, et tous les neufs ne sont pas à toi** *(pièges 23 et 24)*.

**2. `npm test` doit rendre `fail 0`.** *Mesuré au moment de l'écriture : **tests 1401, pass 1401, fail 0, skipped 0**, en ~6,1 s.* ⚠️ **Note le compte avant de commencer** : un test qui disparaît est aussi silencieux qu'un test qui tombe, et **un vert n'est une preuve que si l'on sait combien de vert il y avait**. *La suite du port d'import seule — `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/register-ts-resolver.mjs --test utils/fabrique/verifie-import.test.ts` — en porte **60**, toutes vertes.*

**3. `derive-doctrine.py --verifie` dit `FIXTURE : IDENTIQUE` aujourd'hui — mais il ne dit ÇA que d'une des trois choses qu'il contrôle.** Le contrôle porte sur **les douze tables de doctrine**, **les empreintes de source** et **la fixture** *(`PLAN_DE_CHANTIER.md` §5)*. La partie qui tourne sans base — les sources et la fixture — est **verte** : `FIXTURE : IDENTIQUE`, et le résumé lit bien *13 objets · 9 crans · 15 patrons de production · 24 guides*. **Les douze tables demandent que tu joues le SQL contre la sandbox** *(`> /tmp/verifie.sql`, puis `psql`)*.

> ⚠️⚠️ **ET LÀ, LA BASE EST EN RETARD — DE 21 LIGNES, DONT 5 SONT DANS TA TABLE.** Le `SUIVI_SQL.md` porte, à la date du 24/08, une ligne *« Doctrine — RE-DÉRIVATION : le vocabulaire de GRILLE servi à l'élève, 21 lignes »* **créée et NON JOUÉE** *(case Sandbox ☐)* : **16 lignes de `exercices_consignes_isolees` et 5 de `exercices_guides_production`**. Or `exercices_guides_production` est exactement la table où vit le guide du cran 6 que ton geste 2 replie.
>
> **Ce que tu fais** : **joue le contrôle, lis le verdict, et dis-le au relevé.** Si les douze tables divergent sur ces deux tables-là, **ce n'est pas toi** — et la réparation est celle que le journal annonce déjà : `--sql`, en un geste séparé, journalisé avant exécution. ⛔ **Ne corrige jamais la base à la main**, et ⛔ **ne rejoue pas `--sql` en passant, au milieu de ton lot** : une doctrine qui bouge sous un port rend le port inévaluable — on ne saurait plus si un test a changé d'avis à cause de toi ou à cause d'elle.

---

## La mission — reprise du `07-Implementation.md` §2

*Reprise du `07-Implementation.md` §2, entrée C4-L15.*

Trois règles ont été écrites dans les sources le **24/08**, sur décision de Louis, en relisant à l'écran les neuf crans de `problematisation`. **Aucune n'est portée par l'application**, et deux d'entre elles rendent un exercice illisible tant qu'elles ne le sont pas. **Ce lot n'invente rien** : les trois règles sont écrites, gelées, et **entièrement dérivables de ce que le fichier d'import porte déjà**.

### A. Le marquage dans le matériau — le geste pour lequel le lot existe

`02-exercices.md` §5, table « Ce que l'écran met en évidence dans le matériau ». Au **cran 1**, l'écran met en évidence **les candidats servis, chacun là où il apparaît dans le matériau — et eux seuls, la `reponse_attendue` comprise**, sans quoi le marquage la désignerait. Aux **crans 3 et 5**, **le passage fautif** : celui, et celui-là seul, où la `version_corrigee` du matériau diffère de son `contenu`. Aux crans **4, 7 et 9**, **rien** — *« l'y trouver EST le travail »*.

⭐⭐ **AUCUN CHAMP N'EST À AJOUTER, ET C'EST LE POINT** *(`08-` §5)* : les candidats sont les `distracteurs` et la `reponse_attendue` du cas, le passage fautif est un diff entre deux champs du matériau. **Le lecteur dérive, il ne lit pas** — *« un champ de plus serait une seconde source de vérité pour une chose que le fichier dit déjà »*.

⚠️ **Sans lui, la mesure change de nature** : servir quatre mots et cinq phrases fait chercher les candidats avant de pouvoir juger, et l'exercice mesure alors la **recherche**, pas le **sens**.

### B. Le guide ne s'affiche plus au cran 6

`04-Instances_Exercices.md` §14.1, et `08-` §5. Les cinq patrons du cran 6 finissent tous par **`<les appuis nommés>`** : **le guide EST la seconde moitié de la consigne**, et le champ `guide` le répète. **L'élève lit la même phrase deux fois, à dix lignes d'écart.** Le champ reste **déclaré** *(le `02-` §2.2 l'exige « léger » à ce cran, et c'est lui qui remplit la case du patron)* ; **il cesse d'être servi séparément**.

⛔ **Le cran 2 ne suit PAS cette règle** : sa case est `<ce qui est servi>`, qui **nomme** le guide sans le contenir — *la consigne annonce, le bloc montre*. **Le cran 8 n'a pas de guide.**

### C. Le port de l'import rattrape ses vecteurs de retard

`generateur/verifie-import.py --autotest` en joue **plus** que le « fait quand » de `C4-L14` n'en nommait. Le neuf qui est à toi est le contrôle de **longueur du matériau** *(`02-` §2.3.3)* : **un signalement, jamais un refus**, quand un cran qui demande *« le quart »* ou *« la moitié »* se voit servir le matériau **le plus long de sa famille**.

⚠️ **Le contrôle est RELATIF et doit l'être** : la source dit une **fraction**, pas un compte de phrases — *« un `paragraphe` ne tient pas en deux phrases »* —, et une mesure absolue condamnerait les objets `macro` à tort.

⚠️ **Les vecteurs se recopient SANS ADAPTATION**, comme pour `C4-L14` : *« ce que tu construis doit rendre LES MÊMES VERDICTS SUR LES MÊMES VECTEURS »*.

### Ce que ce lot NE porte PAS

Les cinq se ressemblent assez pour qu'on les fasse par mégarde.

- ⛔ **le sort des cinq consignes qui désignent un endroit à un cran non marqué** *(registre, item 68)* et **ce que « les deux questions candidates d'origine » veut dire au cran 2** *(item 67)*. **Ce sont des questions de source, et un lot Code n'en tranche aucune** *(`07-` §2)*. **Le lot affiche ce que la banque porte.**
- ⛔ **la fabrication des trois tailles de matériau** — elle est faite, dans `generateur/`, et ne concerne pas l'application ;
- ⛔ **le format 1.3 et l'état `"notions"`** — c'est **C4-L16**, créé le 24/08. Tu vas croiser ses vecteurs dans l'autotest : **laisse-les** *(piège 23)* ;
- ⛔ **la normalisation des deux formes physiques de `exercices_cas.distracteurs`** — objets à l'import, chaînes à l'écran de conception. Elle est à **C4-L11** ;
- ⛔ **aucune règle neuve de conception.** Tout ce que ce lot sert est déjà écrit, et gelé, depuis le 24/08.

---

## Les pièges — les décisions dont l'oubli coûte une migration

*Tirés des sources du manifeste et **vérifiés sur pièces à la fabrication**. Chacun porte son renvoi. **En cas de doute entre ce prompt et la source, la source a raison.***

### Le manifeste et ses versions

**1. ⚠️⚠️ LE `04-` EST EN 3.5, PAS EN 3.3 — ET IL A BOUGÉ DANS TA SECTION.** Le manifeste a été écrit contre la 3.3 ; le fichier vivant porte **VERSION 3.5** *(le 3.4 est sauté)*. Le commit est `6d277fb`, « Item 72 — seize mots que je ne tranche pas », et il **réécrit six lignes de la table du §14.2, dans les deux colonnes** — `argument`, `objection`, `exemple`, `plan`, `phrase` et `paragraphe` — pour en sortir le **vocabulaire de grille** servi à l'élève : *« le garant »* est devenu *« quelle raison fait que cette preuve-là justifie cette conclusion-là ? »*, *« le maillon visé »* est devenu *« l'idée visée »*, *« le gabarit des fonctions »* est devenu *« ce que chaque moment peut faire »*. **Ce sont exactement les chaînes que ton geste 2 fait porter par la consigne.** *Les mêmes 21 lignes attendent en base — voir le contrôle d'entrée n° 3.*

**2. LE `08-` EST EN 1.5 / FORMAT 1.3, PAS EN 1.4 / FORMAT 1.2 — mais hors de tes sections.** Le commit est `87072d6`, « Les sujets se lient à des notions » *(la naissance de `C4-L16`)*, et **vérifié à la fabrication : il ne touche que les §2 et §3** *(textes et sujets)*. **Le §5 — la table des champs, la ligne `guide`, le paragraphe du marquage — n'a pas bougé d'une ligne.** *Tu peux donc lire le `08-` d'aujourd'hui comme si c'était celui du manifeste, pour ce qui te concerne.* ⚠️ **Et ne « répare » rien de ce que la 1.3 a laissé en désordre** — le refus n° 5 qui refuserait `cours: "notions"`, le §3 qui parle encore de « trois états », le §1 dont l'exemple JSON se déclare `"version": "1.2"` : **c'est le périmètre de C4-L16**, et un lot qui borde le sien s'y perd.

### Le geste A — le marquage : ce qui descend, et ce qui ne descend jamais

**3. ⛔⛔ NE DESCENDS JAMAIS `version_corrigee` À L'ÉCRAN — C'EST LA RÉPONSE.** Aux crans 3 et 5, *« la `reponse_attendue` […] est la version corrigée à la transformation »* *(`02-` §2.3.4)* : le champ dont tu tires le diff **EST ce que l'élève doit produire**. **Le diff se calcule côté serveur, et seules les positions descendent.** *L'état d'aujourd'hui te protège et tu ne dois pas le défaire : `utils/deroule/vue.ts` ne sélectionne que `exercices_materiaux(contenu)` — la version corrigée n'est **pas** dans la charge utile de l'écran, et elle ne doit pas y entrer.* ⚠️ **Le même raisonnement vaut pour la crédence** : *« la correction ne se sert qu'une fois la première crédence donnée — sans quoi l'élève déclarerait sa sûreté en connaissant la réponse, et la porte 2 ne mesurerait plus rien »* *(`utils/deroule/regime.ts`)*.

**4. ⛔⛔ AUCUN `dangerouslySetInnerHTML`, ET CE N'EST PAS UNE PRÉFÉRENCE.** Le dépôt n'en porte **aucune occurrence hors commentaire** — *vérifié à la fabrication : les cinq que rend le grep sont les avertissements eux-mêmes* —, et `utils/deroule/balisage.ts` explique pourquoi en toutes lettres : *« Le module ne produit AUCUN HTML et AUCUNE CHAÎNE BALISÉE : il rend des JETONS, et c'est le composant React qui les met en `<strong>` / `<em>` […] sans lui il n'y a aucune surface d'injection »* — et le matériau, comme la consigne, **vient d'un import de fichier**. ⭐ **Ton marquage suit exactement ce patron** : un module PUR qui rend des **segments** *(marqué / non marqué)*, et un composant qui les rend. ⛔ **L'aperçu de la fabrique, lui, fabrique du HTML** — `h.replace(…, '$1<b>$2</b>')` dans `generateur/web/index.html`. **Recopie son ALGORITHME, jamais son rendu.** *C'est la seule adaptation autorisée, et elle est structurelle.*

**5. ⚠️ MARQUER N'EST PAS BALISER, ET LE MATÉRIAU RESTE « TEL QU'IL EST STOCKÉ ».** `components/deroule/TexteBalise.tsx` porte l'avertissement inverse du tien : *« CE RENDU S'APPLIQUE À LA CONSIGNE SEULE. Le matériau, le guide et le texte d'auteur "s'affichent TELS QU'ILS SONT STOCKÉS" (piège 33 de C4-L8) : ils restent en `whitespace-pre-wrap` brut, et `TexteBrut` ci-dessous est là pour qu'on n'ait jamais la tentation de les baliser. »* **Les deux règles cohabitent, et il faut le dire dans le code** : le marquage **n'interprète aucun caractère du matériau** — il ne lit pas de `**`, il ne retire rien, il n'ajoute rien au texte. Il **calcule des bornes** à partir d'ailleurs *(les candidats, le diff)* et **le texte reste octet pour octet ce que la base porte**. *Si tu retouches ce commentaire, retouche-le pour dire cela — ne le supprime pas.*

**6. LE RENDU ATTENDU EST LE GRAS, ET LA CONSIGNE L'A DÉJÀ PROMIS.** Le `02-` §5 le note : *« Deux consignes du `04-` s'y appuient déjà — `mot_impropre` aux crans 1 et 3 dit "les mots en gras dans le texte" et "le mot en gras" »*. ⚠️ **Note le nombre** : **pluriel** au cran 1 *(les quatre candidats)*, **singulier** au cran 3 *(un seul passage fautif)*. **Une consigne servie à l'élève promet quelque chose que ton écran doit tenir** — si tu marques autrement, ou si tu marques plusieurs passages au cran 3, **la consigne ment**.

**7. ⚠️ LA TABLE NE PORTE QUE SIX CRANS, ET LES TROIS ABSENTS NE SONT PAS UN OUBLI.** Elle nomme 1, puis 3 et 5, puis 4, 7 et 9. **Les crans 2, 6 et 8 n'y sont ni en « marque » ni en « rien »** : leur `materiau_cible` vaut **`null`** *(`02-` §2.2)* — **il n'y a pas de matériau**. ⛔ **La différence compte** : « rien à marquer » est une décision, « pas de matériau » est une absence. *Un code qui itère « les neuf crans » sur cette table trouvera trois trous.*

**8. ⛔⛔ LE MARQUAGE DES CRANS 3 ET 5 NE SE DÉRIVE PAS DES CANDIDATS — LE CRAN 5 N'EN A AUCUN.** La table du `02-` §2.2 donne `distracteurs` = **`null`** au cran 5, et `reponse_attendue` = **présent**. **Un code qui conditionnerait le diff sur la présence de distracteurs ne marquerait jamais rien au cran 5.** *Le déclencheur est le CRAN, jamais la présence d'un champ.*

**9. ⛔ ET LE CRAN 4 A UNE `reponse_attendue`, ET NE SE MARQUE PAS.** La `reponse_attendue` est déclarée aux **quatre** crans 1, 3, 4 et 5 ; le marquage ne touche que 1, 3 et 5. *Au cran 4, l'élève cherche **l'endroit** — « le défaut est nommé, sa place non » (`02-` §2.3.3). Le marquage y répondrait à la question posée.* **Même conclusion qu'au piège 8, dans l'autre sens : c'est le cran qui commande.**

**10. ⚠️⚠️ AU CRAN 1, MARQUE LES QUATRE — LA BONNE RÉPONSE COMPRISE.** La source le dit et donne son motif : *« et **eux seuls**, la `reponse_attendue` comprise, **sans quoi le marquage la désignerait** »*. **Marquer les trois distracteurs seulement fait de la réponse le seul candidat non marqué** : le marquage devient la réponse. ⭐ **Et ce sont les quatre SERVIS, jamais la banque** : `offreDeCredence` *(`utils/deroule/credence.ts`)* rend `candidats: string[]` — *« ce qui a été réellement affiché, dans l'ordre réellement mêlé »* —, mêlés par `melerAvecGraine` sur une semence stable. **La banque en porte 10 à 15, l'écran en sert 4** *(`02-` §5)*. ⚠️ **Conséquence** : là où l'offre de crédence ne se compose pas *(`empechement` non nul, cran sans crédence)*, **il n'y a pas de « candidats servis » et il n'y a rien à marquer.** Comporte-toi proprement, ne devine pas.

**11. ⛔ UN CANDIDAT QUI N'EST PAS UN FRAGMENT DU MATÉRIAU NE SE MARQUE PAS.** La source le pose et se protège avec : *« au cran 3 les candidats sont des **remplacements**, ils n'y figurent pas […] la règle est muette là où elle ne s'applique pas, elle ne peut donc pas mal se comporter »*. ⭐ **L'aperçu l'opérationnalise, et c'est le détail que la source ne donne pas** : `motsAMarquer` ne retient un candidat que s'il fait **un ou deux mots** *(`j.length && j.length <= 2`)*. **Recopie ce seuil, ne l'invente pas** — et si tu le changes, dis-le au relevé avec sa raison.

**12. ⚠️⚠️ LE DIFF PEUT ÊTRE VIDE, ET C'EST LÉGITIME — DEUX FOIS.** *(a)* `version_corrigee` est **facultatif** au `08-` §4 *(« Obligatoire : non »)*, et le **refus n° 12**, qui liste pourtant tous les appuis qui doivent suivre le cran, **ne le nomme pas** : un matériau de cran 3 ou 5 sans version corrigée **passe tous les contrôles**. *(b)* Le `02-` §2.3.1 a pose que l'injecté *« ne porte pas que des défauts — il porte aussi ce qui est **réussi** »* : **un matériau calibré sur une réussite n'a pas de passage fautif.** ⛔ **Rien à marquer n'est pas une panne** : ne lève pas, ne marque pas tout, ne marque pas le premier mot. *Et ne « répare » pas la source en rendant `version_corrigee` obligatoire : ce serait une règle neuve, et tu n'en portes aucune.*

**13. L'ALGORITHME DU DIFF EST ÉCRIT ET JOUÉ — RECOPIE-LE.** `motsAMarquer` dans `generateur/web/index.html` : découpe **au mot** *(`trim().split(/\s+/)`)*, avance sur le **préfixe commun**, recule sur le **suffixe commun**, et le milieu est le passage — **un seul, jamais deux**, ce qui est exactement ce que la source exige *(« celui, et celui-là seul »)*. Et `marque()` rebâtit l'espace entre les mots *(`\\s+`)* — *« sans quoi un retour à la ligne dans le matériau ferait échouer la reconnaissance »* —, avec des bornes de lettres unicode *(`(^|[^\p{L}])` … `(?![\p{L}])`)* pour ne pas marquer un mot à l'intérieur d'un autre. ⚠️ **La reconnaissance est GLOBALE** : un candidat qui apparaît deux fois se marque deux fois — *« chacun là où il apparaît »* le demande.

**14. ⛔ NE RÉÉCRIS PAS L'APERÇU DU PROFESSEUR, ET SURTOUT PAS SON TIRAGE.** `composerApercu` *(`utils/fabrique/conception.ts`)* est déjà la spécification exécutable du placement — *« une consigne juste au mauvais endroit de l'écran est une consigne fausse, et c'est le seul moment où cela se voit »*. Son tirage de candidats est **déterministe pour qu'un rechargement ne change pas ce qu'il relit**. **Si tu portes le marquage dans l'aperçu — et c'est souhaitable, le professeur doit voir ce que l'élève verra —, porte-le sans toucher au tirage.**

### Ce que « aucune migration » veut dire, et ce qu'il ne veut pas dire

**15. ⚠️⚠️ « AUCUNE MIGRATION » EST VRAI POUR DEUX GESTES SUR TROIS, ET LA FABRICATION L'A MESURÉ.** Le `07-` §2 écrit *« Aucune migration — rien n'est à ajouter en base, tout se dérive »*. **La première moitié de la phrase parle de l'IMPORT — et là elle est exacte** : aucun champ neuf, aucune donnée à saisir, tout se dérive de ce que le fichier porte. ⛔ **Mais « se dériver » a une cible, et la cible est la base.** Vérifié :

> - **côté conception**, `generateur/noyau/doctrine.py` dérive **deux tables de plus** du `02-` : `marquage` *(cran → ce que l'écran met en évidence, §5, six crans attendus)* et `longueurs` *(cran → la fraction, §2.3.3, six crans attendus)* — et **il refuse de se charger si la source a bougé** *(`SourceMouvante`)* ;
> - **côté Palimpseste**, `scripts/derive-doctrine.py` **ne connaît ni l'une ni l'autre** : `grep marquage` et `grep longueur` y rendent **zéro**. La table `exercices_crans` porte quatorze colonnes — `cran, code, geste, appui, fait, palier_vise, materiau_cible, defaut, distracteurs, reponse_attendue, guide, jugement, couverture_observables, regime_v1vf` — **et aucune n'est celle-là**. `CranDoctrine` *(`utils/fabrique/doctrine.ts`)* ne les porte pas davantage.

**Tu as donc à trancher, et à le dire.** La position que la fabrication tient pour juste : **une migration ADDITIVE d'une ou deux colonnes dérivées sur `exercices_crans`**, remplies par `derive-doctrine.py` depuis le `02-`, exactement comme la doctrine du générateur — parce que la convention est *« la doctrine est dérivée, JAMAIS TAPÉE, et il n'y a qu'un dériveur »*, et que le `07-` §2 loue précisément l'aperçu de *« lire la table depuis la doctrine et ne pas la redire »*. **Écrire ces deux tables en dur dans un `switch` TypeScript, c'est les redire.** ⚠️ **Si tu choisis l'autre voie, elle doit être argumentée au relevé, pas subie.** ⭐ **Et dans les deux cas, amende l'entrée C4-L15 de l'inventaire du §2** : il est **OUVERT À L'IMPLÉMENTATION**, tu l'amendes depuis ton relevé **sans accord préalable** — *ce n'est pas une dette, c'est ton travail*.

### Le geste B — le guide : « déclaré » n'est pas « servi »

**16. ⛔ LE CHAMP RESTE OBLIGATOIRE AU CRAN 6. NE LE RENDS PAS FACULTATIF.** Le `08-` §5 le dit dans la même ligne que ta règle : *« aux crans 2 et 6 | le texte du guide servi **avant** la v1 ; `null` aux sept autres crans. ⚠️ Au cran 6, il est DÉCLARÉ mais ne s'affiche pas séparément »*. Et les deux voies le tiennent déjà : `utils/fabrique/verifie-import.ts` porte le **refus n° 12** *(« le cran 6 exige un guide léger »)*, et `utils/fabrique/conception.ts` en porte le jumeau pour l'écran. ⛔ **Ne touche à aucun des deux** : c'est **le même champ** qui remplit la case du patron. *Le rendre facultatif casserait la consigne elle-même.*

**17. ⭐ LA CONDITION EXISTE DÉJÀ EN DOCTRINE, ELLE EST DÉJÀ LUE, ET PERSONNE NE S'EN SERT.** `utils/deroule/vue.ts` fait, depuis C4-L11 : `.from('exercices_crans').select('geste, regime_v1vf, guide').eq('cran', ctx.cran)` — **`cran.guide` est chargé et n'est utilisé nulle part**. Or la doctrine y met **`complet` au cran 2, `léger` au cran 6, `null` partout ailleurs** *(`02-` §2.2)* : **« léger » désigne le cran 6 et lui seul.** ⭐ **Tu as donc une condition dérivée, pas un numéro en dur** — et c'est exactement l'esprit de la règle. *Le `guide` servi à l'écran, lui, vient d'ailleurs : `vue.ts` rend `guide: depot.exercice.guide`, et `EcranDeroule.tsx` l'affiche sans aucune condition de cran, dans un `Depliable` « De quoi t'aider ».*

**18. ⚠️⚠️ LA RÈGLE N'EST LITTÉRALEMENT VRAIE QUE POUR HUIT OBJETS SUR TREIZE — VÉRIFIE AVANT DE CACHER.** Le §14.2 du `04-` porte, dans la colonne du cran 6 : **huit** cellules qui sont des **questions citées, prêtes à servir** ; **deux** qui sont des **listes non citées** — `plan` *(« ce que chaque moment peut faire : poser · nuancer · réfuter… »)* et `paragraphe` *(« les trois temps — l'idée du paragraphe, ce qui l'appuie, le retour à la question »)* ; et **trois** — `introduction`, `conclusion`, `partie` — qui **renvoient à une table par `genre`** de onze énumérations, dont le sous-titre dit *« sans rien en rédiger »*. **Le patron colle la case après un point, sans conjonction ni deux-points.** ⛔ *« Le guide est déjà la seconde moitié de la consigne »* est donc **vrai de huit objets sur treize** : sur les cinq autres, cacher le bloc **peut** retirer de l'information. **Mesure sur la banque avant de décider, et dis ce que tu as mesuré.**

**19. ⭐⭐ ET LES DEUX VOIES NE SE COMPORTENT PAS PAREIL — C'EST LE CŒUR DU GESTE B.** *(a)* **Voie conception en ligne** : `banqueDeConsignes` *(`utils/fabrique/doctrine.ts`)* **compose déjà** la consigne du cran 6 — `patron.replace('<les appuis nommés>', guidesProduction[objet].cran6)`, avec la déclinaison par `genre`. **Là, le guide EST dans la consigne, prouvablement.** *(b)* **Voie import** : `vue.ts` sert `depot.exercice.consigne_instanciee`, **telle que le fichier l'a écrite** — le `08-` §5.2 dit seulement *« `consigne` : le texte que l'élève lit »*, et **rien ne contrôle qu'une consigne de cran 6 porte son guide.** ⛔ **Cacher le bloc inconditionnellement fait donc reposer la lisibilité de l'exercice sur une propriété que rien ne garantit sur l'une des deux voies.** *La règle est tranchée et tu l'appliques ; mais si tu poses une garde — ne cacher que là où la consigne porte effectivement le guide —, elle est dérivable des mêmes deux tables, et elle se relève.*

**20. ⛔ NE RETOUCHE PAS LA CONSIGNE POUR « ALLÉGER ».** Le `04-` §14.1 : *« LES DEUX TABLES SONT COUPLÉES, ET RIEN NE LE SURVEILLE. Les quatre patrons réceptifs écrivent "`<objet>` **du texte**" ; celui de `composer` ne l'écrit pas. C'est cette différence, et elle seule, qui dit à qui appartient ce que le §14.2 fait servir […] Retirer "du texte" en croyant alléger ferait mentir l'autre table, en silence. »* **Ton geste retire un BLOC de l'écran. Il ne touche pas un mot de la consigne.**

**21. ⚠️ UN CRAN 6 MAL FAIT DEVIENT UN CRAN 8, ET RIEN NE LE DIRA.** Le patron du cran 8 est **celui du cran 6 amputé de sa case**, mot pour mot. Si la case est vide et que le bloc est caché, **l'étayage disparaît et la consigne reste grammaticalement parfaite** : aucun test ne tombe, aucun contrôle ne crie. ⚠️ **Et le §14 prévient qu'il est le seul endroit non contrôlé de son document** : *« Cette section est écrite à la main et ne se dérive de rien. `derive-04.py` ne la touche pas ; aucun contrôle machine ne la vérifie. C'est le seul endroit du document où une erreur ne sera rattrapée par personne. »* **Un smoke à l'écran, sur un cran 6 réel, est ta seule preuve.**

**22. ⚠️ CACHER LE BLOC REND UN COMPTEUR MUET — DIS-LE.** `AIDES_COMPTEES = ['demonstration', 'guide', 'relecture_retour']` *(`utils/deroule/depot.ts`)*, et le `Depliable` du guide porte `aide="guide"` : **chaque dépliage incrémente `exercices_depots.aide_consommee`**, que le `01-` §11 lit. **Au cran 6, ce compteur tombera structurellement à zéro pour le guide.** ⛔ *Un compteur qui tombe à zéro ressemble à un élève autonome.* **Ce n'est pas un bug — c'est une conséquence, et elle doit être écrite dans le code et au relevé, pas découverte plus tard par quelqu'un qui lit la télémétrie.**

### Le geste C — le port, et un compte qui bouge sous toi

**23. ⚠️⚠️ LE COMPTE DE VECTEURS EST UNE CIBLE MOUVANTE : 53 → 57 → 62.** Le « fait quand » de `C4-L14` en nommait **53** ; le `07-` §2 en annonce **57** ; **la fabrication en a mesuré 62**, `✓ tout passe`, et le dépôt `palimpseste-conception` a reçu **trois commits dans l'heure** qui précédait. ⛔ **N'écris jamais un nombre dans un « fait quand » ni dans un test.** La règle est celle de la source, et elle ne parle pas de nombres : *« ce que tu construis doit rendre **LES MÊMES VERDICTS SUR LES MÊMES VECTEURS** »*. **Mesure à l'entrée, mesure à la sortie, et rapporte les deux.**

**24. ⛔⛔ ET TOUS LES VECTEURS NEUFS NE SONT PAS À TOI — ATTRIBUE-LES UN PAR UN.** Vérifié à la fabrication, par `git log -- generateur/verifie-import.py` :

> - `d6a31f8` *(« La longueur d'un matériau, ce que l'écran y marque… », 24/08)* — **le contrôle de longueur, quatre vecteurs : ILS SONT À TOI.** Leurs libellés se retrouvent au grep : *« le matériau ENTIER servi au cran 4, qui n'en demande qu'un quart »*, *« le même matériau au cran 9 ne signale RIEN »*, *« et une VERSION COURTE servie au cran 4 ne signale rien non plus »*, *« et le signalement ne REFUSE jamais »*. ⭐ **Les deux pendants NÉGATIFS sont la moitié de la preuve** : sans eux, un contrôle qui signalerait toujours passerait le premier.
> - `87072d6` *(« Les sujets se lient à des notions »)* — **deux vecteurs de l'état `"notions"` : ILS SONT À `C4-L16`.** *« l'état "notions" du format 1.3 est bien formé »* et *« "notions" sans notions ne sera JAMAIS servi »*. ⛔ **Ne les porte pas.**
> - `3073c19` *(« La vague 1 rentre »)* — **deux vecteurs du signalement « le second cas répète la consigne du premier, à un cran où l'appui est nommé » : ILS NE SONT PAS À TOI NON PLUS.** Ils naissent d'une règle du `02-` §2.3.1 a que ton manifeste ne te donne pas.
>
> ⚠️ **Rapporte au relevé l'écart qui reste**, avec sa cause et son destinataire. *C'est la dette de PORT que le `PLAN_DE_CHANTIER.md` §5 a déposée dans ta boîte : elle ne naît d'aucun défaut de `C4-L14`, elle naît de règles écrites après lui.*

**25. ⛔ NE TOUCHE PAS À `VERSION_IMPORT`.** `utils/fabrique/doctrine.ts` porte `VERSION_IMPORT = '1.2'` ; `generateur/noyau/banque.py` porte `VERSION = "1.3"`. **Ce n'est pas cassé** : le contrôle ne porte que sur la **majeure** *(« version majeure inconnue »)*, et un fichier 1.3 entre. **Le faire passer à 1.3 sans porter ce que la 1.3 ajoute serait mentir sur ce que le port sait faire.** *C'est le premier geste de `C4-L16`, pas le tien.*

**26. L'ALGORITHME DU CONTRÔLE DE LONGUEUR, TEL QU'IL EST ÉCRIT — recopie-le, ne le réinvente pas.** `generateur/verifie-import.py` :

> - `FRACTIONS = ("quart", "moitié")` et `ENTIER = 0.90` — *« au-delà, le matériau servi EST le matériau entier »* ;
> - `_fraction_du_cran(doctrine, cran)` lit `doctrine.longueurs[cran]` et rend **le premier des deux mots qui y apparaît**, sinon `None`. *Il ne cherche PAS à vérifier la fraction : « le plancher de l'objet l'emporte sur elle, et une mesure au caractère près condamnerait les objets `macro` à tort. Ce qu'on attrape est le vrai défaut, celui qui a duré : **le matériau ENTIER servi à un cran qui demandait une part**. »* ;
> - le contrôle groupe les matériaux par **`(objet, famille)`**, garde **la plus grande longueur** de chaque groupe, puis pour chaque cas d'un exercice dont le cran demande une fraction : `len(contenu) / plein >= 0.90` → **un signalement**, qui nomme l'exercice, le cas, le cran, la fraction attendue et l'`id` du matériau.
>
> ⚠️ **La comparaison est RELATIVE et le commentaire dit pourquoi** : *« On compare donc le matériau servi au PLUS LONG de sa propre famille, ce qui vaut aux treize objets sans qu'aucun nombre soit écrit ici. »* ⛔ **Ne compte jamais des phrases** : le `02-` §2.3.3 ne dit ni l'unité, ni l'arrondi, ni la tolérance — *son seul exemple chiffré, « le quart fait deux phrases et la moitié quatre » sur cinq phrases, n'est ni 5/4 ni 5/2*. **Le mesurable est le rapport, pas la fraction.**

**27. ⚠️ LE CONTRÔLE NE PORTE QUE SUR UN `materiau_cible` DE PROVENANCE `genere`.** Le `02-` §2.3.3 ouvre dessus : *« Un `materiau_cible` de provenance `genere` est fabriqué POUR UN CRAN, et sa taille en fait partie. »* ⛔ **Appliqué à un `materiau_source`, ou à un `texte_auteur`, il crierait sur des textes que personne n'a fabriqués.** *Et il ne concerne que les six crans qui isolent : les trois crans de production n'ont pas de matériau cible.*

**28. ⛔ UN SIGNALEMENT NE REFUSE JAMAIS, ET NE CHANGE PAS LE CODE DE SORTIE.** *« `0` = importable (blocages et signalements possibles), `1` = au moins un refus »* *(`08-` §7.4)*. ⚠️ **Et le port TS porte déjà des signalements** — *« la signature de `controleImport` est un contrat avec `divergences.test.ts` : ne la change pas pour te simplifier la vie »*. **Le tien s'ajoute, il ne remplace rien.** *Éprouve-le sur la banque réelle. Mesuré à la fabrication, par `python3 generateur/verifie-import.py --banque generateur/banque/banque.json` : **`0 texte · 15 sujet · 126 matériau · 135 exercice` → `IMPORTABLE — 0 refus, 0 blocage(s), 0 signalement(s)`**. **Si ton port la refuse, il est faux** — et **s'il la signale, c'est que ton contrôle de longueur ne mesure pas ce que le sien mesure.***

**29. ⚠️⚠️ LE `08-` NE DÉCLARE PAS CE CONTRÔLE — ET C'EST UNE DETTE DE SOURCE, PAS UN TROU À BOUCHER.** Vérifié : `grep -i "longueur\|fraction\|trop long"` sur le `08-` rend **zéro occurrence** — ni au §4, ni dans les dix-huit refus, ni dans les signalements du §7.3. Or le §7.4 prétend décrire ce que le script applique, et le script applique **un signalement de plus que le document n'en déclare** *(et même deux : celui de `"notions"` vide n'y est pas non plus ; et le §7.3 en énumère **onze** quand le §7.4 en annonce **neuf**)*. ⛔ **Le `08-` est GELÉ : tu ne l'amendes pas.** **Tu marques et tu portes au registre** — c'est exactement la convention de dette, et c'est le même motif que le §5.2 a déjà payé une fois *(« cette forme était appliquée par le contrôle machine sans qu'aucun document la déclare ; ce paragraphe paie la dette »)*. ⭐ **Ta source à toi est le `02-` §2.3.3**, et le `08-` le dit lui-même : *« En cas de divergence entre ce document et l'un d'eux, l'autre a raison et celui-ci est en dette. »*

### Deux choses transverses, vérifiées à la fabrication

**30. ⚠️ LE CRAN EST UN NUMÉRO EN BASE ET UN CODE DANS LES RÈGLES — le pont existe, ne l'écris pas deux fois.** `exercices.cran` est `integer` depuis C4-L11, et `utils/cran.ts` porte la forme unique. `vue.ts` lit `exercices_crans` **par le numéro** *(`ctx.cran`)* et garde `ctx.cranCode` pour ce qui parle en codes *(`offreDeCredence`, `CRANS_GUIDES`)*. ⚠️ **`ctx.cran` est `null` sur un examen diagnostique, qui n'a pas de cran** : la lecture ne part pas, et `geste` reste `null`. **C'est le comportement voulu, pas un trou** — ton marquage doit s'y taire.

**31. ⚠️ DEUX AUTRES SESSIONS TRAVAILLENT, UNE DANS CHAQUE DÉPÔT.** Dans `palimpseste`, l'arbre de travail portait à la fabrication **neuf fichiers modifiés et trois non suivis**, dont `utils/moteur/` et `RELEVE_C4_L12_2026-08-24.md` — **le lot C4-L12 n'est pas commité**. Dans `palimpseste-conception`, **trois commits en une heure**. **Vérifie `git status` avant d'écrire, écris par ancres plutôt qu'en pleine page, et ne rends jamais compte de ce que tu n'as pas fait.** *Le `PLAN_DE_CHANTIER.md`, le `SUIVI_tests_manuels.md` et les LISEZ-MOI portent régulièrement des modifications qui ne sont pas d'un lot.*

---

## Le « fait quand » — recopié du `07-Implementation.md` §2

*Recopié du `07-Implementation.md` §2. C'est la condition de recette, et **elle ne se négocie pas en séance**.*

- à un **cran 1**, l'élève voit dans le matériau les **quatre candidats servis** mis en évidence, et **rien d'autre** ;
- à un **cran 3 ou 5**, il voit **le passage fautif** et lui seul ;
- aux crans **4, 7 et 9**, **aucune marque** ;
- un exercice de **cran 6** n'affiche **plus le guide en bloc**, sa consigne le portant déjà ;
- et `verifie-import.ts` rend **les mêmes verdicts** que `verifie-import.py --autotest` sur ses **57** vecteurs.

⚠️ **La dernière clause porte un nombre qui a vieilli** *(pièges 23 et 24)*. **Ce qu'elle demande, et que tu dois tenir, c'est l'égalité des verdicts sur les vecteurs QUI SONT LES TIENS** — les quatre du contrôle de longueur —, plus la non-régression sur les cinquante-trois hérités. **Les quatre autres appartiennent à `C4-L16` et à une règle que ton manifeste ne te donne pas : dis-le, ne les porte pas.**

*Échéance* : **avant le premier import d'une banque de crans à candidats au grain du mot** — c'est-à-dire dès que la banque sert autre chose que le cran 1 d'un objet `meso`. *Rien d'extérieur n'est en attente : les trois règles sont écrites et gelées, la donnée est en base.* ⚠️ **La banque, elle, se peuple déjà, et vite** : `generateur/banque/banque.json` portait **126 matériaux et 135 exercices** à la fabrication — **61 et 70 une heure plus tôt**, avant que la « vague 1 » ne rentre. *L'échéance est plus proche qu'elle n'en a l'air.*

---

## Les conventions — `PLAN_DE_CHANTIER.md` §5

### Du dépôt

**Une ligne au `SUIVI_SQL.md` AVANT exécution, jamais après** — date, fichier, zone, cases Sandbox/Prod. **Toute migration est additive et gatée** : les **six** interrupteurs restent à OFF jusqu'à la recette. ⚠️ *Le `07-` annonce « aucune migration » ; le piège 15 dit pourquoi ce n'est peut-être pas vrai. **Si tu en écris une, cette convention s'applique intégralement.*** ⚠️ **Le reste du protocole n'est pas ici : il est en tête du `SUIVI_SQL.md`, règle R6** — sandbox d'abord, ne jamais rejouer un fichier de l'Archive, protocole renforcé sur les tables vivantes, répétition à blanc sur le CORPS du fichier. **Lis-le avant d'écrire ta migration** *(c'est aussi la règle absolue de l'`AGENTS.md`)*.

**La doctrine en base est dérivée, jamais tapée, et il n'y a qu'un dériveur.** Avant de lire ces tables, `python3 scripts/derive-doctrine.py --verifie` doit dire **IDENTIQUE** sur les **douze** tables, les empreintes de source et la fixture. **S'il dit DIVERGE, rejouer `--sql` ; jamais corriger la base à la main** — et pour l'état d'aujourd'hui, voir le contrôle d'entrée n° 3.

### De clôture

**Ta section au `SUIVI_tests_manuels.md`**, au moment où le lot se clôt : ce qui a été **prouvé en séance, coché avec sa preuve**, et ce qui **reste à jouer en recette, décoché, avec sa condition de reprise nommée**. *Un reste de recette qui ne vit que dans un relevé ne se rappelle à personne.* ⭐ **Trois de tes cinq clauses de recette ne se prouvent qu'à l'écran, sur un exercice réel** : ce sont exactement celles-là qui doivent y figurer, cochées ou non.

### De dette

**Une source trouvée fausse se MARQUE, elle ne se corrige pas** *(`07-` §2)*. Deux gestes : **`[faux]`** au point de l'erreur, et **une ligne à la section DETTES** du `INVENTAIRE_Non_Tranches.md`, qui porte l'**avant / après**. ⚠️ *Ne confonds pas avec l'**inventaire des lots du `07-` §2**, qui est **OUVERT À L'IMPLÉMENTATION** : celui-là, tu l'amendes depuis ton relevé, sans accord préalable — ce n'est pas une dette, c'est ton travail.* ⭐ **Tu as au moins un candidat, et le piège 29 le nomme.**

### D'ouverture de compétence

⚠️ **Sans objet ici** — ce lot n'ouvre aucune compétence dans la chaîne. La convention est recopiée parce que la recette se recopie entière ; **ne joue pas `derive-instruments.py`**.

---

### Et ce que ton relevé doit porter

Le nom du fichier : `RELEVE_C4_L15_2026-08-XX.md`, à la racine du dépôt `palimpseste`. **Six choses au minimum**, en plus du récit :

1. **ce que tu as tranché sur la doctrine** *(piège 15)* — colonnes dérivées ou non, avec le motif, et **ce que tu as amendé à l'inventaire du `07-` §2** ;
2. **l'attribution des vecteurs, un par un** *(piège 24)* : ceux que tu as portés, ceux que tu as laissés, et à qui ;
3. **ce que tu as mesuré sur la banque avant de cacher le guide** *(piège 18)* — combien de crans 6, combien portent leur guide dans leur consigne, et par quelle voie ils sont entrés ;
4. **le compteur d'aide rendu muet au cran 6** *(piège 22)*, dit explicitement ;
5. **l'état du contrôle de dérivation** à l'entrée et à la sortie, et ce que tu as fait des 21 lignes en attente au `SUIVI_SQL.md` ;
6. **ce qui reste à jouer en recette**, avec sa condition de reprise — parce que c'est cela qui part au `SUIVI_tests_manuels.md`, et de là à la recette du flux.
