---
name: banque
description: Peupler la banque d'exercices de Palimpseste — préparer une vague, rédiger les lots sur papier, fusionner, contrôler, verser. À invoquer par `/banque` quand Louis veut ajouter des exercices sans rouvrir la conversation où le protocole a été mis au point.
---

# Peupler la banque

⚠️⚠️ **CE SKILL VIT DANS LE DÉPÔT `palimpseste` (code), MAIS TOUT SON TRAVAIL SE FAIT
DANS `palimpseste-conception`.** Il y était auparavant, et devenait **invisible** depuis
les séances ouvertes sur le dépôt code — là où Louis travaille. *Constaté le 30/08 :
`/banque` « n'existe pas ».* **Les chemins des commandes sont donc ABSOLUS** ; ne les
raccourcis pas en relatif, tu casserais le skill pour la même raison.
⛔ **Le dépôt `palimpseste-conception` n'a pas de remote** — ce qu'on y commite reste local.


**Ce que tu produis.** Des entrées dans `generateur/banque/banque.json` — la banque
que Louis exporte vers Palimpseste. **Tu ne décides d'aucune règle** : la doctrine
est lue dans les sources par `generateur/noyau/doctrine.py`, sous le crible
« cite ou refuse ». Tu rédiges ce que la commande demande, et rien d'autre.

⛔ **Toutes les commandes se lancent depuis `generateur/`.** Les chemins des plans
sont relatifs à ce dossier ; lancés depuis la racine, ils écrivent **à côté du
dépôt** et le lot lit une banque vide. *Éprouvé le 27/08 : deux dossiers parasites
créés dans `~/Documents/GitTest/`.*

## 1 · Ce qui manque

```bash
cd /Users/louissagnieres/Documents/GitTest/palimpseste-conception/generateur && python3 prepare-vague.py --reste --banque banque/banque.json --racine ..
```

⚠️ **Ce compte ignore les crans de production (2, 6, 8).** Ils ne portent aucun
observable, ne se fabriquent qu'**une fois par objet — et par genre** pour les
objets terminaux, et se demandent **à part** *(voir §4)*.

## 2 · Préparer une vague

Un lot par dossier, chacun avec sa **copie** de la banque : les lots ne peuvent pas
partager le fichier, `os.replace` les écraserait en silence.

```bash
cd /Users/louissagnieres/Documents/GitTest/palimpseste-conception/generateur && python3 prepare-vague.py v3 --objets partie --combien 4 --banque banque/banque.json --racine ..
```

- `--crans` force les crans ; par défaut, **ceux qui manquent** à chaque famille.
- `--forme essai_hlp` ne tire que des sujets HLP. ⚠️ **Rien d'autre ne tient la
  frontière de parcours** *(item 75)* : un sujet de tronc commun sur un objet HLP
  ne se rattrape nulle part en aval.
- `--combien` plafonne. **Il coupe famille par famille, pas objet par objet** :
  `--objets a b --combien 2` peut ne servir que `a`. ⛔ **Le contournement — une vague
  par objet, puis on rassemble les dossiers — a son propre piège** *(voir juste dessous)*.

### ⛔ Les trois pièges de `prepare-vague.py`, éprouvés le 28/08

**(1) Onze appels donnent onze fois LE MÊME SUJET.** La rotation des sujets se fait
*à l'intérieur* d'une vague ; relancé avec `--combien 1` pour chaque objet, le script
repart du premier sujet à chaque fois. **Corrige les `plan.json` après coup** — un sujet
différent par lot, sans quoi l'élève retrouve le même énoncé partout.

**(2) Il ne pose AUCUN `genre`, et trois objets en exigent un.** `introduction`,
`conclusion` et `partie` sont **terminaux** : sans `genre`, le lot est **indéclarable**
et `papier.py` refuse avant de déposer la moindre commande. Ajoute `"genre"` au lot
dans son `plan.json`. *Ça vaut pour TOUS les crans, pas seulement ceux de production.*

**(3) Les chemins du `plan.json` sont relatifs à la vague d'origine.** Si tu déplaces
un dossier de lot d'une vague à l'autre, **`banque` et `boite` pointent encore
l'ancienne** : le lot lit une banque vide et se dit « sujet inconnu ». Recale-les.

*Le script à écrire une fois pour toutes : préparer, puis passer sur les `plan.json`
pour poser le sujet, le genre et les deux chemins.*

## 3 · Rédiger — quatre tours, jamais plus

```bash
cd /Users/louissagnieres/Documents/GitTest/palimpseste-conception/generateur && python3 papier.py --plan papier/vagues/v3/<lot>/plan.json
```

Le lot dépose `boite/A-REPONDRE.md` et s'arrête. **Tu écris les réponses en face,
puis tu relances la même commande.** Chaque tour récolte ce qui est atteignable ;
ce qui l'est dans un tour est indépendant du reste.

| tour | ce qui est demandé |
|---|---|
| 1 | les **matériaux** — un par observable × famille |
| 2 | les **appuis**, rang 1 — un par famille × cran |
| 3 | les **appuis**, rang 2 — les crans qui vont **par paires** |
| 4 | plus rien : le lot est entier, et il se **verse** tout seul |

⛔ **Rien n'entre en banque avant que le lot soit entier.** Une réponse mal écrite
revient au tour suivant en disant ce qui manquait ; une réponse illisible est
redéposée avec l'erreur de lecture en tête.

⚠️⚠️ **SI TU CORRIGES UN MATÉRIAU APRÈS COUP, SES COMMANDES CHANGENT D'EMPREINTE.**
La clé d'une commande porte l'empreinte du prompt, et le matériau est dedans : retoucher
un `contenu` fait **redemander** tous les appuis qui le servaient — et les anciens
fichiers de commande **restent sur le disque**, périmés, à côté des neufs.
⭐ **Ce que ça coûte se calcule avant de corriger** : une retouche du **cas 2** est
gratuite tant que le tour 3 n'a pas tourné *(le tour 2 ne sert que le cas 1)* ; une
retouche du **cas 1** coûte les trois appuis de ce cas. Et une retouche d'un
**distracteur** ne coûte rien du tout — elle ne touche pas le matériau.
⛔ Repère les commandes périmées par `A-REPONDRE.md` : il ne liste que les vivantes.

⚠️ **Si tu fais écrire les appuis par des agents en parallèle, dis-leur de préfixer
leurs fichiers de travail par le nom de leur lot.** Le dossier de brouillon est partagé,
et deux agents qui écrivent `build.py` s'effacent l'un l'autre. *Arrivé le 28/08.*

### Ce que la commande ne te dit pas, et que tu dois savoir

- **Le second cas d'une paire se traite SEUL** — *« un premier cas traité SUR
  INDICATION, puis un cas neuf de la même famille, traité SEUL »* (`02-` §2.3.1 a).
  Sa consigne n'est **pas** celle du premier.
- **Les distracteurs encadrent la réponse.** La banque en porte **10 à 15**
  (`02-` §6) et l'écran en sert quatre ; il en faut **des deux côtés de la longueur
  de la réponse**, sans quoi l'exercice se répond sans lecture (`02-` §5). Vise
  moitié plus courts, moitié plus longs.
- **Le vocabulaire de grille ne se sert pas à l'élève.** `verifie-vocabulaire.py`
  le contrôle ; joue-le avant de verser.

## 4 · Les crans de production — à part

Ils n'ont ni matériau ni distracteur : **un seul guide** par lot, celui du cran 2.
Le cran 6 dérive le sien, le cran 8 n'en a pas.

```bash
cd /Users/louissagnieres/Documents/GitTest/palimpseste-conception/generateur && python3 prepare-vague.py v-prod --objets exemple --crans 2 6 8 --combien 1 --banque banque/banque.json --racine ..
```

⚠️ **Les objets terminaux exigent un `genre`** — `conclusion` et `introduction`
en ont quatre, `partie` trois. Le plan ne le reçoit pas de `prepare-vague.py` :
ajoute `"genre": "dissertation_tc"` au lot dans `plan.json`, **un lot par genre**.
Et le genre `explication_texte_tc` **exige un texte d'auteur en source**, pas un
sujet.

## 5 · Fusionner, contrôler, verser

```bash
cd /Users/louissagnieres/Documents/GitTest/palimpseste-conception/generateur && python3 fusionne-vague.py papier/vagues/v3 --ecris
cd /Users/louissagnieres/Documents/GitTest/palimpseste-conception/generateur && python3 verifie-import.py --banque banque/banque.json --racine ..
cd /Users/louissagnieres/Documents/GitTest/palimpseste-conception && python3 verifie-vocabulaire.py --banque generateur/banque/banque.json .
```

*⚠️ `verifie-vocabulaire.py` est le seul des trois à vivre à la **racine**, et il
se lance de là.*

`fusionne-vague.py` **refuse** en cas de collision d'identifiant plutôt que
d'écraser. Le contrôle d'import doit rendre **0 refus, 0 blocage** ; les
signalements se lisent un par un — ils ne bloquent pas, mais chacun dit quelque
chose de vrai.

## 6 · Voir ce que l'élève verra

```bash
cd /Users/louissagnieres/Documents/GitTest/palimpseste-conception/generateur && python3 fabrique.py --racine .. --banque banque/banque.json
```

Onglet **Élève**, filtres **objet** et **cran**. ⚠️ **N'ouvre pas la fabrique par
`preview_start({name})`** : le sous-processus du panneau n'a pas le droit de lire
dans `GitTest`. Lance-la en Bash, puis `preview_start({url})`.

## 6 bis · La revue du corpus en cours — `generateur/revue-2026-08-30/`

⚠️ **Un chantier de correction est OUVERT, et sa matière est là.** Lire son
`LISEZ-MOI.md` avant de toucher aux exercices existants — il dit ce que chaque fichier
porte, et surtout **les 181 cas déjà traités**, pour qu'aucune séance ne les refasse.

⛔⛔ **`22-refaits-JAMAIS-VERSES.json`** — 22 exercices réécrits le 29/08, contrôlés
*(0 refus)*, **jamais versés en banque**. C'est le seul travail irrécupérable du lot.
⚠️ Le patron a changé depuis : Louis a tranché que **le type 1 veut des candidats
NEUFS**, pas des fragments du matériau — les relire à cette lumière avant de verser.

⭐ **`RESTE-A-FAIRE.json`** porte les **27 constats de lecture non traités** et les
**47 exercices dont les deux jumeaux partagent leur consigne** *(le `02-` §2.3.1 a
l'interdit)*.

⚠️ **Mais la priorité n'est pas là** : au 31/08, **trois cellules de calibration sont
à ZÉRO** — `argumentation · micro`, `questionnement · micro`, `synthese · meso`. Un
élève ciblé sur une cellule vide **ne reçoit rien** ; un exercice imparfait, lui, se
sert. Voir le **§0 du skill `chantier`**.

## 7 · Les quatre épreuves de relecture

⭐⭐ **ELLES VIVENT DANS LA SOURCE, PAS ICI — `02-exercices.md` §5, « Les quatre
épreuves de relecture ».** Neuf de leurs déclarations sont **citées dans
`generateur/noyau/doctrine.py`** sous le crible « cite ou refuse » : si l'une d'elles
quitte le `02-`, **le générateur s'arrête** et le dit. *Elles ont vécu trois jours
dans ce seul skill, et une réécriture les en a effacées sans que rien ne proteste —
d'où la citation.*

Ce qui suit n'est donc pas la règle : c'est **son mode d'emploi**, avec les seuils
mesurés et les pièges rencontrés. **En cas de désaccord, le `02-` fait foi.**

**(1) Est-ce que le gras est correctement appliqué ?**
L'écran marque dans le matériau aux crans **1, 3 et 5**. Au cran 1 il marque les
**candidats servis** quand ils sont tous des fragments du texte, sinon **ce que la
consigne CITE entre « »** (≥ 2 mots, retrouvés littéralement). Aux crans 3 et 5, le
passage où la `version_corrigee` du **matériau** diffère de son `contenu`.

⛔⛔ **« RIEN EN GRAS » N'EST UN DÉFAUT QUE SI LA CONSIGNE L'A PROMIS.** La plainte
d'origine de Louis était précise : *« il y a des passages du texte **mentionnés dans
la consigne** qui devraient être surlignés et qui ne le sont pas »*. C'est la
**promesse non tenue** qui est le défaut, pas l'absence de gras.
⚠️ Un **type 1** — matériau nommé, candidats NEUFS pris ailleurs — ne surligne rien,
et c'est sa forme normale. *Mesuré le 30/08 : la version large signalait **100** cas
au cran 1 ; sur ces 100, **92 n'ont aucune consigne qui désigne un passage** du
matériau, et les 8 autres décrivent un passage **des candidats**. Le « rien en gras »
mesurait l'épreuve 3 par ricochet. Resserrée sur la promesse : **1 signalement**.*

⛔⛔ **NE CONFONDS JAMAIS « L'ÉCRAN SURLIGNE » ET « L'ÉLÈVE SURLIGNE ».** *Louis l'a
relevé le 30/08, et la confusion avait fait accuser cinq exercices conformes.*

> *« Aux crans **4, 7 et 9**, l'élève ne recopie plus le passage : il le
> **SÉLECTIONNE** dans le matériau, puis dit ce qui cloche. »* (`02-` §5)

⭐⭐ **Ce sont EXACTEMENT les trois crans que la table du marquage met à « rien », et
la doctrine dit que ce n'est pas une coïncidence** : là où l'écran ne montre rien
parce que *« l'y trouver EST le travail »*, la désignation **est** le travail. Une
consigne « Surligne l'endroit » y est donc **juste**.

⭐ **Et elle a un rendement, qui est l'argument de Louis** : la zone se compare à la
cible **avant** d'ouvrir le texte libre, et le **cas 1** — *« la zone ne touche pas la
cible »* — se tranche **sans aucun appel à l'IA**. Retirer ces consignes coûterait un
appel par copie fausse.

⛔⛔ **ET LE VERBE DOIT SUIVRE L'AFFORDANCE : « surligne » ou « sélectionne », JAMAIS
« recopie ».** L'écran y offre une sélection, pas une zone de saisie : une consigne
qui dit « Recopie-la » envoie l'élève chercher un champ qui n'existe pas, *« et ce
qu'il produit n'est plus le même objet que ce qui est mesuré »*.
*Relevé le 30/08 sur `conclusion-04-attache-presente`.*

⛔ **Une consigne ne peut pas ORDONNER de surligner et attendre « il n'y a rien à
surligner ».** Là où la `version_corrigee` **ajoute** au lieu de remplacer, le défaut
est une absence : la consigne doit alors **demander** s'il y a quelque chose à
désigner, jamais l'ordonner. ⚠️ Et **au cran 4, ne donne pas le LIEU** — le défaut y
est nommé, sa place non : dire « le "Donc" de la deuxième phrase » répond à la place
de l'élève.

**(2) Est-ce que la consigne fait référence au matériau fourni ?**
> *« Si elle ne le fait pas, c'est que le matériau n'est pas nécessaire. »*

⭐⭐ **ELLE SE JOUE SUR LA PHRASE QUI DIT QUOI FAIRE**, pas sur la consigne entière.
Louis : *« une partie de la consigne cite le matériau, mais la partie qui dit à
l'élève quoi faire ne l'utilise plus du tout ; dans ce cas c'est la 2ᵉ partie qui
prime. »* Une belle mise en place ne rachète pas une tâche qui s'en passe.

⭐⭐ **POINTER ≠ TRANSCRIRE.** La mise en place peut faire deux choses opposées :
| | | |
|---|---|---|
| **POINTER** ✅ | *« Ce paragraphe enchaîne ses exemples sans jamais dire son idée »* | elle dit **où** regarder — la tâche doit encore aller lire |
| **TRANSCRIRE** ⛔ | *« Ici, la conclusion est qu'on peut rester humain…, et l'exemple est le passage où Lorenzo "…" »* | elle livre la **substance** — la tâche trie la transcription, pas le texte |

⚠️ **Une CITATION est un POINTEUR** — elle dit où, pas quoi. Ce qui transcrit, c'est
la **reformulation** : les mots de la mise en place, hors citations, qui viennent du
matériau.

⛔ **Un démonstratif ne désigne le support que s'il en NOMME LA NATURE.**
« cette conclusion », « ce mot », « cet exemple » désignent le plus souvent quelque
chose que la **consigne** vient d'introduire, ou un mot des **candidats**.
*Deux fois cette erreur, deux fois relevée par Louis.*

⭐ **Le symptôme le plus sûr : le matériau est un CINQUIÈME CANDIDAT.** Quand un
candidat est une **version** du matériau — même matière, longueur comparable —, le
lire une fois de plus n'apprend rien. *« Ce n'est rien de plus qu'un distracteur »
(Louis, sur `paragraphe·apports`).*

*Mécanisée dans `verifie-import.py` : **33/39 = 85 %** d'accord avec les verdicts de
Louis, contre 72 % pour la consigne prise en bloc. 350 signalements — 263 « jamais
désigné », 72 « cinquième candidat », 15 « transcrit au lieu de pointer ».*

⛔⛔ **TROIS GARDES, SANS QUOI L'ÉPREUVE ACCUSE LA DOCTRINE ELLE-MÊME** *(posées le
30/08 en balayant les 802 cas)* :
1. **Le cinquième candidat ne vaut qu'aux crans de DIAGNOSTIC (1 · 4 · 9).** Aux
   crans 3, 5 et 7 la réponse attendue **est** le matériau corrigé — c'est la
   définition d'une transformation. *Sans la garde : 47 cas légitimes accusés, dont
   41 au seul cran 5.*
2. **« sujet » et « énoncé » nomment le support** : aux crans de production, le
   matériau EST le sujet.
3. **Le présentatif « Voici… » désigne**, quel que soit le nom qui suit — *« Voici
   l'argument à illustrer »* montre du doigt. ⚠️ Il le faut inconditionnel, car la
   métadonnée ment parfois : un matériau déclaré `objet=exemple` que la consigne
   appelle « l'argument ». ⛔ Sauf devant un nombre — *« Voici quatre phrases »*
   présente les candidats, pas le matériau. *Sans la garde : 21 cas accusés.*

⚠️ **Les désaccords connus.** ⭐⭐ **DEUX ONT ÉTÉ TRANCHÉS EN FAVEUR DE LA MACHINE.**
`objection·bloc_unite` et `problematisation·debat_situe` étaient notés « accusés à
tort » — Louis les avait jugés bons. Puis il s'est repris : *« je n'ai jamais pris le
temps de lire les distracteurs, donc ton lecteur a peut-être raison »*. Mesuré depuis :
**13 candidats sur 13 reprennent le matériau mot pour mot** dans les deux exercices,
un distracteur EST le matériau, et la `reponse_attendue` est la `version_corrigee` à
la lettre. Le test du **cinquième candidat** tirait juste ; c'est la calibration qui
était fausse. **L'accord passe alors de 85 % à 95 %.**
⭐ **La leçon : un verdict humain porté sans lire les candidats ne calibre pas un test
qui ne regarde que les candidats.**
Reste `phrase·notions_en_tension`, qui **passe à tort** : sa tâche énonce le critère
entier — *« celle qui met deux notions en rapport et qui dit ce qui les oppose »* —,
et c'est la moitié **2b**, celle qui ne se mécanise pas.

**(3) Est-ce que le geste correspond au cran ?**
> **Diagnostic** *(crans 1 · 4 · 9)* — *« Est-ce que mon choix est simplement de
> **reconnaître** un défaut ou une qualité ? »*
> **Transformation** *(crans 3 · 5 · 7)* — *« Est-ce que mon choix est de **faire
> mieux** que ce que je vois ? »*
> **Production** *(crans 2 · 6 · 8)* — *« Est-ce que je dois **faire tout seul** ? »*

⛔⛔ **NE LUI ATTRIBUE PAS CE QUI RELÈVE DE LA 2 — je m'y suis trompé DEUX FOIS
de suite, et Louis a corrigé les deux.**
*(1)* j'opposais `objection·bloc_unite` (bon) à `paragraphe·apports` (cassé) —
*« le problème ici ce n'est pas l'épreuve 3, c'est la 2 »*. *(2)* je le refaisais
avec `phrase·charniere_formule` — *« charnière formule est cassé à cause de
l'épreuve 2, pas de la 3 »*.
⭐⭐ **LA LEÇON DE MÉTHODE, ET ELLE VAUT PARTOUT : un cas cassé par une AUTRE
épreuve ne dit rien de celle qu'on teste.** Filtre d'abord sur les cas qui passent
les autres — sinon on mesure l'épreuve du voisin.

⚠️ **Aucune mesure ne l'a reproduite, et le corpus manque pour trancher** : sur les
verdicts connus de Louis, **presque tout ce qui est cassé l'est par l'épreuve 2**.
Le seul cas qui semble lui appartenir en propre est `phrase·densite_friction` —
consigne irréprochable (elle nomme le défaut sans dire où, comme `bloc_unite`), mais
**la réponse est une réécriture du matériau** là où celle de `bloc_unite` est un
paragraphe neuf. C'est l'exemple que Louis avait donné lui-même : *« "la dernière
phrase de ce texte commence dans un sens et finit dans l'autre, laquelle de 4
suivante ne le fait pas", c'est le premier exercice du cran 1, va devenir un
exercice de transformation »*.

⭐ **Donc : lis l'exercice comme un élève et demande-toi ton geste.** Le piège à
guetter : **un cran 1 dont les candidats sont quatre versions du même texte** —
choisir la bonne version, c'est *faire mieux*, donc une transformation logée au
cran du diagnostic.

**(4) Est-ce que la consigne est compréhensible par un enfant de 16 ans qui ne fait
aucun effort et n'a pas l'habitude de lire ?**
*Mécanisée grossièrement — phrase de plus de 32 mots, ou trois mots de douze lettres
et plus, noms propres exclus. 11 cas signalés. La mesure ne juge pas la langue ;
elle dit seulement où regarder.*

## Ce qui n'est jamais à toi

- ⛔ **Les actes en base et les commits de Palimpseste** — Louis les joue.
- ⛔ **Amender une source VALIDÉ ET GELÉ** sans son accord explicite. Et un
  amendement du `07-` **rougit les dérivés** : `npm test` casse, et seul Louis
  répare.
- ⛔ **La clé d'API** ne s'écrit jamais dans un fichier suivi. `papier.py` n'en a
  pas besoin.
