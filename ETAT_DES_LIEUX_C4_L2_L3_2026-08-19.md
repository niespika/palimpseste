# ÉTAT DES LIEUX — les deux relevés de questions ouvertes de C4-L2 et C4-L3

**Séance du 19/08/2026.** Aucune source modifiée, aucun code écrit, aucune migration.
Ce document fait trois choses : il répond à **tes trois questions d'ordre** (pourquoi L2 avant L8,
pourquoi L3 organisé ainsi, est-ce que L8 reposera les mêmes questions) ; il passe **tes seize
réponses** au crible des sources ; et il propose **un ordre de travail** pour demain.

*Rappel de vocabulaire, une fois pour toutes.* **C4-L1** = le schéma et les interrupteurs (joué le
18/08) · **C4-L2** = le pilotage et le cœur du routeur · **C4-L3** = l'élève, le formatif à la
maison · **C4-L4** = la passation en classe · **C4-L5** = la chaîne de mesure (les squelettes, les
mesures, les retours) · **C4-L8** = la fabrique du professeur (déposer les fiches, déclarer les
statuts, déposer le corpus, concevoir) — lot neuf, né le 18/08. **La vf** = la version finale d'un
exercice, après le retour. **N1, N2, N3** = les trois crans de l'escalade du routeur.

---

## Résumé en dix lignes

- **Le plan de chantier n'a pas d'erreur.** Il écrit depuis le 18/08 que C4-L2 dépend de C4-L8. Ce
  qui n'a pas suivi le plan, c'est **l'ordre dans lequel on a fabriqué les prompts** — on a suivi les
  numéros, pas le graphe. Rien à réparer dans les sources ; il faut fabriquer **C4-L8 ensuite**.
- **Non, C4-L8 ne reposera pas les huit questions de C4-L2.** Une seule y revient de plein droit
  (Q6), une deuxième à moitié (Q7). Les six autres sont des règles du routeur ou un écran de L2.
- **Sur tes seize réponses : dix tiennent**, dont trois qui étaient déjà dans les sources sans que le
  relevé l'ait vu. **Trois tiennent mais coûtent une écriture de source** que tu n'avais pas prévue.
  **Deux ne répondent pas à la question posée** (L2-Q7, et à moitié L3-Q1). **Une contredit la source
  telle qu'elle est écrite** (L3-Q6) — elle reste prenable, mais il faut changer une phrase.
- **Un blocage préalable est apparu** : `08-FORMAT_IMPORT.md` porte `[à valider]` et dit lui-même que
  rien ne s'appuie dessus tant que tu ne l'as pas arrêté. Il commande L3-Q3, L3-Q8 et tout C4-L8.

---

# Partie 1 — Tes trois questions d'ordre

## 1.1 « Si L2 s'arrête parce qu'il fallait L8 d'abord, pourquoi avoir conçu L2 avant ? »

**Le plan ne s'est pas trompé — la fabrication des prompts, si.**

Le `PLAN_DE_CHANTIER.md` §3 écrit noir sur blanc, depuis le 18/08 :

| lot | dépend de | pourquoi |
|---|---|---|
| **C4-L2** — le pilotage et le cœur du routeur | C4-L1 · **C4-L8** | il ne cible que des compétences `evaluee`, et c'est L8 qui les déclare |

Donc l'ordre des **lots** était juste. Ce qui a dérapé, c'est l'ordre de **fabrication des prompts**,
et il y a deux causes, toutes deux écrites :

1. **Deux prompts existaient déjà et étaient dangereux.** Le §2 du plan les nomme :
   `PROMPT_Code_C4_L1.md` et `PROMPT_Code_C4_L2.md`, écrits contre la **SPEC C3 v4.2**, qui est
   archivée. Ils étaient *« à réécrire, pas à corriger »*. On les a donc réécrits en premier parce
   qu'ils étaient **périmés sur le disque**, pas parce que leurs lots venaient en premier.
2. **Ensuite on a suivi le numéro** — L1, L2, L3 — et pas le graphe. C4-L8 est un lot **neuf**, né le
   même jour ; il n'avait pas d'ancien prompt à écraser, donc rien ne le poussait en avant.

**Ce qu'il faut en tirer, et c'est la seule correction à faire :** le prochain prompt à fabriquer
n'est pas C4-L4, c'est **C4-L8**. Puis **C4-L5**. Ces deux-là débloquent tout le reste — L8 débloque
L2, L5 débloque L3 et L4.

## 1.2 « Sur les 8 questions de C4-L2, j'imagine que L8 va poser les mêmes. Non ? »

**Non.** Une seule revient telle quelle, une deuxième à moitié.

| Question de L2 | Revient-elle à L8 ? |
|---|---|
| **Q1** — que veut dire réussir un observable | **Non.** C'est la définition de l'instrument de mesure. Elle vit aux **fiches de compétence** et concerne C4-L5 autant que L2 |
| **Q2** — le plancher de la précondition basse | **Non.** Règle du routeur, §8.3 |
| **Q3** — les bornes de segment et la fin de période | **Non.** Règle du routeur, §4 — et déjà tranchée, voir plus bas |
| **Q4** — l'override de retrait | **Non.** C'est un écran de L2 (l'assignation en lecture seule) |
| **Q5** — le palier cible du rang 2 des sondes | **Non.** Règle du routeur, §8.9 |
| **Q6** — la date de bascule du statut de recette | ⭐ **OUI, de plein droit.** Le statut se pose **au seul écran de L8** — le plan dit *« c'est le seul endroit d'où un statut de recette se pose »*. Si une date doit exister, c'est L8 qui l'écrit |
| **Q7** — le non-spoiler | **À moitié.** Rattacher une instance à un cours est un **geste de déclaration**, donc de la fabrique, donc L8. La position de lecture de l'élève, non |
| **Q8** — la montée en charge de R3 | **Non.** Règle du routeur, §6 |

**En revanche, L8 arrivera avec ses propres questions — et la bonne nouvelle, c'est qu'elles sont
déjà écrites.** Le `08-FORMAT_IMPORT.md`, créé le 18/08, porte **18 refus, 3 blocages et
6 signalements** et se déclare `[à valider]` : *« Rien ne s'appuie dessus tant que Louis ne l'a pas
arrêté. »* C'est le gros bloc de décisions de L8, et il est déjà rédigé et rangé — ce que ni L2 ni L3
n'avaient.

## 1.3 « Pour L3, des choses se jouent dans L5 mais aussi ailleurs. Pourquoi avoir organisé ça comme ça ? »

Trois faits distincts, qu'il vaut mieux séparer.

1. **La dépendance à C4-L5 est déclarée et prévue.** Le plan dit *« C4-L3 dépend de C4-L1 · C4-L5 »*,
   et le prompt de L3 dit *« si elle n'est pas jouée, construis, mais dis-le : la recette ne pourra
   pas passer »*. La séance a fait exactement ce qu'on lui demandait. **Ce n'est donc pas un défaut
   d'organisation.**
2. **Mais trois des huit questions de L3 ne pointent ni sur L3 ni sur L5.** Elles pointent sur
   **C4-L8** (Q1, la banque « se juger » ; Q8, les démonstrations) et sur **C4-L2** (Q4, le rappel
   des observables faibles, qui demanderait un champ sur le journal du routeur). C'est **exactement
   le même fait que pour L2** : C4-L8 est en amont de presque tout, et il n'existe pas encore.
3. **Donc la réponse est la même que pour L2** : le graphe du plan est juste, c'est l'ordre de
   fabrication des prompts qui l'a mal lu.

**Et oui, les autres lots produiront des relevés du même genre.** Ce n'est pas un défaut : c'est la
recette qui fonctionne — un prompt de lot est fait pour **s'arrêter plutôt que deviner**. Mais on
peut rendre ces relevés beaucoup plus courts en fabriquant les prompts **dans l'ordre du graphe**.

---

# Partie 2 — Tes huit réponses sur C4-L2

## L2-Q1 — « Qu'est-ce que ça veut dire réussir cet observable ? »

> *Ta réponse : il faut une solution, elle se trouvera par observable, c'est une session dédiée.*

**Ton diagnostic tient : par observable, et en séance dédiée.** Deux choses à ajouter.

**(a) Ce n'est pas une question de C4-L2 — et ça change son domicile.** C'est la définition de
l'instrument : *à quelle condition une mesure compte comme réussie sur cet observable*. Le chantier a
déjà l'endroit **et le contrôle machine** pour ça : le **bloc machine** de chaque fiche
(`competences/<nom>.md`, §4, marqueurs `<!-- DEBUT-CONFIG -->` … `<!-- FIN-CONFIG -->`), volet
**`notation`**, qui porte déjà *« croisement, garde-fous et seuils en paramètres »* — et
`verifie-module.py` **refuse** un module dont les seuils diffèrent de ceux de la fiche.
→ **Un seuil par observable, écrit au volet `notation` des six fiches.**

**(b) Une piste pour raccourcir la séance : le chantier a déjà résolu ce problème deux fois.**
L'Argumentation avec son **crible à tests fermés**, et l'Expression avec le **crible de la réussite**
(17/08). Le principe commun : ne jamais demander *« est-ce réussi ? »*, mais poser un test fermé qui
demande de **nommer** une chose. Transposé ici :

- les observables qui sont des **proportions** (par exemple `garant_present`, *« une proportion
  d'unités »*) → le ~2/3 du §8.2 s'applique tel quel ;
- les observables qui sont des **densités** (`densite_friction`, `densite_generique` — des *faits pour
  100 mots*) → il leur faut un **seuil de densité**, et le volet `notation` sait déjà en porter ;
- les observables qui sont des **comptages nus** (`mot_impropre`, `savant_plaque`,
  `repetition_pauvre`) → même chose, un seuil, éventuellement rapporté à la longueur.

**Donc : séance dédiée, oui — mais pas une séance de conception à partir de rien. Une séance de
remplissage d'un volet qui existe, sur six fiches.** Et c'est le verrou le plus large de tout le
chantier : elle débloque C4-L2 (le socle de N1, N2, N3, de la désescalade et de la progression),
C4-L3 question 4, et une partie de C4-L5.

## L2-Q2 — « Comment définit-on le plancher ? »

⚠️ **Avant de le définir, il faut vérifier qu'il n'est pas mort. Et il y a un précédent exact.**

Le mot « plancher » a **au moins cinq sens vivants et distincts** dans le corpus :

| sens | où | ce que c'est |
|---|---|---|
| plancher de **budget** | `01-` §5 | un nombre de **minutes** par semaine |
| plancher **macro** du segment 5 | `01-` §4 | **25 %** de grain macro, pour tous les paliers |
| plancher de **mesure** | `01-` §9 | une **cadence** : une mesure tous les 3 cycles |
| plancher **p** par mode | `01-` §7 | **25 %** par mode |
| planchers **mécaniques** | `03-` §9 | les conditions de la porte de recette |

**Aucun n'est celui du §8.3.** Et le 15/08, on a vécu exactement ce cas : le *« plancher sur la
Fluidité »* du `00-` §4 était **un mot mort**, le vestige d'un mécanisme remplacé par une étiquette.
La leçon écrite alors : **les deux correctifs évidents étaient tous deux mauvais** — le retirer aurait
tué une règle vivante, et **le définir aurait ressuscité un mécanisme délibérément remplacé**.

**L'ordre que je propose :**

1. **Archéologie d'abord** — d'où vient la phrase du §8.3 ? (`Annexe-routeur.md`, `CONTEXTE.md`,
   `conversations/`). Coût : quelques minutes.
2. **Si le mot est mort**, on réaligne la phrase. Ça ne coûte rien et ça ferme la question.
3. **S'il est vivant**, la lecture la plus probable est **le seuil d'acquisition de ~2/3 du §8.2**, et
   alors Q2 n'est pas une question séparée : **c'est la même que Q1**. La phrase se lit très bien
   ainsi — *« un observable déjà mesuré au moins une fois au-dessus du seuil d'acquisition »* (donc à
   portée) *« ou qui plafonne dessous sur deux fenêtres »* (donc bloqué).

→ **Q1 et Q2 dans la même séance, et Q2 traitée en premier, parce qu'elle peut se dissoudre.**

## L2-Q3 — Les bornes de segment et la fin de période

> *Ta réponse : le segment 5 se ferme 1 semaine avant la date de fin d'année déclarée au calendrier.
> Il va peut-être falloir déclarer ça dans les sources.*

✅ **Ta réponse tient — et elle est déjà dans la source, mot pour mot.**

`01-routeur.md` §1, principe 2 : *« Le nombre de cycles est une dérivée du calendrier, pas une
constante du document : `nombre de cycles = semaines de cours − 2` — la première semaine est celle du
diagnostic, **la dernière est perdue**. La valeur se lit dans le module **Calendrier** de
l'application ; ce document ne la fige pas. »*

« La dernière est perdue » = le dernier cycle de l'année est bien la semaine **(fin − 1)**. C'est
exactement ce que tu dis, et c'est déjà déclaré.

**Ce qui reste à écrire est plus petit que tu ne le crois : une seule phrase au `01-` §4.** Elle doit
dire que les bornes du tableau des segments (1 / 2-4 / 5-14 / 15-23 / 24-32) sont **une illustration
d'une année à 34 semaines**, pas des constantes — ce que le principe 2 affirme déjà —, et que **seule
la borne haute du segment 5 est élastique** : elle vaut *« le dernier cycle du Calendrier »*. Les
segments 1 à 4 gardent leurs bornes ; le segment 5 absorbe l'écart, dans les deux sens.

**Effet :** le plancher macro de 25 % se referme toujours (année courte), et les semaines 33 et
suivantes ne sont plus sans ligne dans la table des proportions (année longue). Le relevé notait que
les segments 1 à 4 s'écrivaient sans cette réponse ; **avec ta réponse, le §4 s'écrit en entier.**

## L2-Q4 — L'override de retrait

> *Ta réponse : je ne sais pas trop. Une idée ?*

**Rappel de la question, en clair.** Quand le professeur **retire** un exercice qu'il avait assigné :
(a) jusqu'à quel stade a-t-il le droit de le faire ? (b) le dépôt retiré prend-il le statut
`abandonne` ? (c) sort-il du dénominateur de l'assiduité ?

**Ma proposition, en trois lignes, avec le fondement de chacune.**

**(a) Le retrait reste permis tant que le dépôt n'est pas `clos`.**
*Pourquoi* : un exercice mal assigné se voit souvent **après** que l'élève l'a ouvert. L'interdire à
partir de `v1_remis` obligerait le professeur à laisser courir une erreur qu'il a vue. Et rien ne se
perd : *« tout override du professeur — origine + entrée de journal »* est déjà journalisé
(`01-` §11).

**(b) Non, pas `abandonne` — un statut distinct, `retire`.**
*Pourquoi* : la raison de `abandonne` est écrite dans la source elle-même — *« exclu des règles de
stagnation : **un exercice jamais ouvert** n'est pas une preuve de sur-place »* (`07-` §1.1). Un
exercice **retiré par le professeur** peut avoir été ouvert, travaillé, remis. Mettre les deux au même
statut confondrait **le non-geste de l'élève** et **la décision du professeur** — or l'assiduité
mesure l'élève.

**(c) Il sort du dénominateur pour l'avenir, et le passé ne se réécrit pas.**
*Pourquoi* : une semaine dont le `semaine_faite` est déjà écrit reste telle quelle. `assiduite_hebdo`
est une ligne par (élève × semaine) qu'on a délibérément arrêtée ; la recalculer rétroactivement
rendrait instable un chiffre déjà montré au professeur.

→ **Coût total : une valeur d'énumération (`retire`) sur `exercices_depots.statut`, en migration
additive. Aucun écran neuf.**

## L2-Q5 — Le « palier cible » du rang 2 des sondes

> *Ta réponse : j'imagine qu'on peut dire B, mais je ne suis pas sûr.*

✅ **B tient, et c'est la seule réponse qui ne coûte rien.**

Fondement direct : `01-` §1, principe 3 — *« la majorité des élèves atteint **B** dans la majorité des
compétences en fin d'année — pas **A** pour tous »*. Les autres options coûtent : **A** n'a aucun
appui dans les sources ; « tous les observables requis acquis » dépend de Q1, donc ajouterait une
dépendance ; une valeur réglée par le professeur coûterait **un champ et un quatrième écran** ; et
déclarer le rang 2 inactif viderait de son deuxième cran l'ordre de priorité des sondes.

⚠️ **Mais il reste la moitié de la question, et elle n'est pas cosmétique.** Le palier se lit-il sur
**la lettre affichée** ou sur **la valeur non plafonnée** ? *(Rappel : certaines lettres sont
plafonnées ; le ciblage travaille en général sur la valeur non plafonnée, mais le seuil d'entrée du
Questionnement se lit, lui, sur la lettre affichée.)* Comme le plafond de sondes est de **4 par
cycle**, cet ordre décide effectivement **qui est mesuré chaque semaine**.

**Ma proposition : la lettre affichée.** *Pourquoi* : le rang 2 dit « vérifier une compétence
**réputée** acquise » — et ce qui est réputé, c'est ce qui est affiché. Une compétence dont la valeur
non plafonnée serait à B mais qui s'affiche C est justement une compétence qu'on ne tient **pas** pour
acquise.
*L'argument d'en face, pour que tu l'aies* : tout le reste du ciblage travaille sur la valeur non
plafonnée, et la sonde est un geste de ciblage. → **une ligne à valider demain.**

## L2-Q6 — La coupe « les mesures postérieures à la recette »

> *Ta réponse : on laisse tel quel.*

⚠️ **Il faut que je sois sûr de ce que « tel quel » veut dire, parce que les deux lectures ne coûtent
pas la même chose.**

**Rappel.** `01-` §3 écrit que le passage d'une compétence de `mesuree_silencieusement` à `evaluee`
*« recalcule la lettre depuis les seules mesures **postérieures à la recette** »*. Or **rien en base ne
porte la date de ce passage** : `07-` §1.3 énumère `competences_niveaux` champ par champ et conclut
« Rien d'autre ».

- **Lecture 1 — « on n'ajoute rien en base ».** Alors la règle du §3 reste **écrite mais non
  implémentée**, et une compétence promue **en cours d'année** recalculera sa lettre sur *toutes* ses
  mesures, y compris celles d'avant. Sur le chemin nominal — le professeur déclare avant le diagnostic
  de la semaine 1 — c'est sans effet.
- **Lecture 2 — « on ne touche pas au texte de la source ».** Alors il faut quand même un domicile
  pour la date.

⭐ **Et il y a une troisième voie, que le relevé ne pouvait pas voir, et qui ne coûte presque rien.**
C'est **C4-L8 qui pose le statut** — le plan dit que la fabrique est *« le seul endroit d'où un statut
de recette se pose »*. **Le lot qui écrit le statut peut écrire la date dans le même geste** : une
colonne sur `competences_niveaux`. Ce n'est plus une décision de conception, c'est un **placement**.

→ **Ma recommandation : garder la règle et donner la colonne à C4-L8.** C'est moins cher que de
laisser une règle écrite sans exécution — le chantier a déjà payé ce prix-là ailleurs.

## L2-Q7 — Le non-spoiler

> *Ta réponse : c'est le « vu » de Scriptorium. Il y a des sujets génériques et des sujets qui collent
> au programme. Il faut créer un champ. Les sujets liés au programme sont liés à un cours : si une
> partie du cours est vue, les sujets liés sont ouverts ; sinon non. Les génériques sont toujours
> ouverts.*

⚠️ **Ta réponse est juste, elle est déjà dans la source — mais ce n'est pas la règle de Q7.**

Le `01-` §4 porte **deux règles voisines, à deux lignes d'écart**, et il ne faut surtout pas les
confondre :

> **Ligne 207** — *« Le routeur ne sert que les instances rattachées à un **cours déjà vu**. La
> fonction existe déjà — c'est celle qui alimente le RAG. »*
>
> **Ligne 209** — *« **Le non-spoiler** : le routeur n'assigne jamais au-delà de la **position de
> lecture connue de l'élève**. **La borne de la classe n'est pas la sienne.** À défaut de position
> connue, il sert un texte court hors livre. »*

**Ta réponse est la ligne 207.** Elle est déjà écrite, sa fonction existe déjà (celle du RAG), et le
geste de déclaration est déjà attribué : il appartient à la fabrique, donc à **C4-L8**.

**Q7 est la ligne 209, et elle reste ouverte.** La source dit **explicitement** que la borne de la
classe **ne vaut pas** pour celle-ci. Le non-spoiler protège l'élève contre un exercice portant sur un
passage du **livre** qu'il n'a pas encore lu — c'est une information **par élève**, pas par cours.

**Deux conséquences.**

1. **Une seule chose est neuve dans ta réponse : la distinction générique / lié au programme.** Et
   elle a peut-être déjà son champ : la banque de sujets du `08-FORMAT_IMPORT.md` §3 porte un champ
   **`notions`** — *« les notions du programme qu'il met en jeu — une liste de mots ; **aucune règle ne
   la lit aujourd'hui**, elle sert au professeur qui cherche »*. C'est ce champ, ou son voisin
   immédiat. À arbitrer avec le reste du `08-`.
2. **Q7 reste à trancher.** L'option la moins chère est celle du relevé : **le dernier travail de
   livre que l'élève a lui-même rendu dans Aletheia** — `aletheia_travaux.semaine_index` est la seule
   progression par élève qui existe. Reste alors la seconde moitié, non résolue :
   `exercices_references.localisation` est **du texte libre**, donc il n'existe **aucune échelle
   ordonnée** pour comparer « où en est l'élève » à « où se situe cette référence ».

→ **La décision de demain, en une phrase :** garde-t-on les deux règles — le cours vu **et** la
position de l'élève —, ce qui demande une échelle ordonnée de localisation ? Ou décide-t-on que la
borne de la classe suffit — et alors **une phrase du `01-` §4 doit être effacée**, celle qui dit le
contraire.

## L2-Q8 — La montée en charge de R3 avant les périodes d'explication de texte

> *Ta réponse : on efface la phrase. Elle ne sert à rien dans la source. C'était un relicat pas vu.*

**Ton instinct est probablement bon — mais la phrase n'est pas un relicat, elle a une raison écrite,
et elle vit à DEUX endroits.**

**1. Il y a une seconde occurrence, et elle porte le motif.** `competences/synthese.md` écrit :
*« L'insertion est **suspendue** tant que l'élève est en canal Expression, et **montée en charge**
avant les périodes d'explication de texte : **condenser un texte qu'on s'apprête à expliquer est la
meilleure entrée dans l'explication.** »*
Effacer dans le `01-` seul laisserait **un renvoi vivant dans une fiche** — exactement le piège que
l'effacement du `PLAN_CHANTIERS_RENTREE.md` a coûté le 18/08.

**2. Ce qui appuie ta lecture, en revanche, c'est ta propre relecture.** `Annexe-routeur.md`
enregistre ce que ta relecture de R3 a arrêté : *« **la probabilité d'insertion seule**, la cadence en
paramètre »*. « Seule » veut dire ce qu'il dit — et la montée en charge est précisément ce qui reste à
côté.

→ **Donc oui, on efface — mais aux deux endroits**, et en décidant quoi faire du motif pédagogique :
le perdre, ou le porter ailleurs. Le domicile naturel existe : le `01-` §10 renvoie déjà *« quels
genres aux dates suivantes, et à quelles dates »* au **plan d'évaluation**, qui vit au Scriptorium.
**Coût : deux modifications de source, dont une dans une fiche gelée** → ton accord explicite et une
entrée au journal.

---

# Partie 3 — Tes huit réponses sur C4-L3

## L3-Q1 — La banque « se juger » n'a pas de domicile en base

> *Ta réponse : il faut une table compétence, qui sera le domicile de ce qui se trouve sur les fiches
> des compétences.*

✅ **Tient — et le contenu est même en meilleur état que tu ne le dis.** Les **six fiches** portent
déjà leur section de correspondance, **remplies** : argumentation 8 observables, connaissance 7,
expression 8, questionnement 9, structure 8, synthèse 11 — **51 blocs**, chacun avec sa *dimension
dite à l'élève*, sa *question « se juger »* et ses **réponses fermées** (*« une réponse libre ne se
compare à rien »*). **La forme de la table est donc entièrement déterminée** : une ligne par
(compétence × observable), portant la formulation en langue élève, la question, la liste fermée des
réponses, plus une version.

⚠️ **Ce que ta réponse ne tranche pas : quel lot la crée.** Et il y a un fait embêtant :
**`07-Implementation.md` §1, qui est la source du schéma, ne nomme pas cette table.** Ce n'est donc pas
un simple choix d'ordonnancement, c'est **un trou dans le `07-` §1** — la même espèce de trou que le
format d'import, comblé le 18/08.

→ **Proposition, en deux gestes :** (1) **écrire la table au `07-` §1**, c'est là qu'elle doit vivre ;
(2) **en donner la création à C4-L8**, qui la remplit de toute façon par l'upload des fiches. C4-L3
la **lit**, et se dégrade proprement si elle est vide.

⚠️ **Et il faut mesurer ce que ça débloque** : la même table sert **trois choses** — les questions de
la phase 3 (« se juger »), la **traduction en langue élève** du rappel du temps 1, et le retour du
temps 4 qui nomme la dimension. **C'est le verrou principal de C4-L3.**

## L3-Q2 — La forme du squelette

> *Ta question : est-ce que ce trou est comblé par L5 ?*

**Oui pour l'écriture, non pour la forme — et la bonne nouvelle, c'est que la forme existe déjà
ailleurs.**

*Rappel* : il s'agit de `exercices_squelettes.artefact_extraction` et `artefact_jugement`, deux
colonnes JSONB dont le `07-` §1.2 dit ce qu'elles portent (*« ce que l'étage a produit »*) mais jamais
**comment**.

- **C4-L5 les écrit** — c'est lui qui fait tourner la chaîne. Donc oui, l'écriture est bien à L5.
- **Mais L5 n'invente pas la forme : elle est déjà déclarée, compétence par compétence.** Elle vit
  dans le **bloc machine** de chaque fiche (`03-competences.md` §4 : marqueurs
  `<!-- DEBUT-CONFIG -->` … `<!-- FIN-CONFIG -->`), volet **`squelette`** — *« les listes fermées de la
  grille »*. Et elle est matérialisée dans `copies-tests/_commun/config/<nom>.yaml`, que
  `derive-config.py` dérive et qu'on n'édite jamais à la main. **Le banc refuse même de tourner si les
  deux divergent.**

→ **Donc la vraie question n'est pas « qui écrit le contrat », mais « C4-L3 a-t-il le droit de lire
ces fiches ».** Aujourd'hui son manifeste ne porte **qu'une** fiche, `competences/monitoring.md`. Deux
sorties, au choix : **élargir le manifeste de L3** aux six fiches (au moins à leur volet `squelette`),
ou **jouer C4-L5 avant C4-L3**, ce que le graphe du plan dit déjà.

## L3-Q3 — L'appui : `defaut`, `distracteurs`, `reponse_attendue`, `guide`

> *Ta question : la réponse à ça se trouve-t-elle dans le JSON de 08 ?*

✅✅ **Oui — et c'est la meilleure trouvaille de ta liste.**

`08-FORMAT_IMPORT.md` §5.2 porte l'appui **au complet, champ par champ, et par cas** :

| champ | où il vaut |
|---|---|
| `defaut` | aux **six crans qui isolent** — ce qui est injecté, dit en une phrase |
| `distracteurs` | aux **crans 1 et 3**, de **10 à 15** candidats faux ; `null` aux sept autres |
| `reponse_attendue` | aux **crans 1, 3, 4 et 5** ; `null` aux cinq autres |
| `guide` | aux **crans 2 et 6** |

Et le §7 (les contrôles à l'import) **refuse** déjà *« un appui qui ne suit pas le cran »* et *« un
nombre de distracteurs hors de 10 à 15 »*.

**Ce que ça règle** : la **forme** de l'appui n'est plus une question.
**Ce que ça ne règle pas** : son **domicile en base**. Mais la réponse suit de la forme — un format
d'import structuré, à cinq champs nommés par cas, **ne survit pas** à un aplatissement dans
`consigne_instanciee`, qui est du texte libre.
→ **Champs propres sur `exercices`** (ou un `cas[]` structuré), en migration additive, **en miroir du
`08-` §5.2**, plus **une phrase au `07-` §1.1** pour nommer la donnée — exactement le geste fait le
18/08 pour les démonstrations.

⚠️ **Une réserve, et elle commande le calendrier** : le `08-` est au statut **DÉPOSÉ** et son contenu
porte `[à valider]`. Il dit lui-même : *« Rien ne s'appuie dessus tant que Louis ne l'a pas arrêté. »*
**L'arbitrage du `08-` est donc un préalable** — à L3-Q3, à L3-Q8, et à tout C4-L8.

## L3-Q4 — Le rappel des observables faibles au temps 1

> *Ta réponse : le site stocke pour chaque élève × compétence une donnée sur chaque observable (un
> taux de réussite, qu'il faudra calculer, cf. Q1), ainsi que l'évolution de cet observable sur
> l'année.*

**Ta réponse tranche bien la question posée, et elle renvoie à L2-Q1, ce qui est juste.**

*Rappel de la question* : qui élit les 2-3 observables les plus faibles à rappeler à l'élève au temps
1 — **le routeur** (et l'écran les lit) ou **l'écran** (et il les calcule) ? Ta réponse dit : la
donnée par (élève × compétence × observable) existe, donc **l'écran peut la lire et calculer**. C'est
l'option (b), et elle a un mérite : elle évite d'ajouter un champ au journal du routeur, donc elle
évite d'ouvrir du périmètre C4-L2 à l'intérieur de C4-L3.

**Deux précisions à porter demain.**

1. ⚠️ **« Stocke » ou « dérive » — ce n'est pas la même chose ici.** Le chantier a une règle forte :
   *« le parcours d'un élève ne se stocke pas, il se dérive »* (`07-` §1.3), et les trois écrans de
   C4-L2 se font *« sans agrégat stocké »*. Or le taux par observable **et** son évolution sur
   l'année sont **entièrement dérivables** de `competences_mesures`, qui journalise tout.
   → Je propose **une lecture dérivée** (une vue ou une fonction), **pas une table d'agrégats**. Même
   résultat, aucune donnée à tenir à jour, aucune divergence possible.
2. **Conséquence de périmètre.** Si c'est l'écran qui calcule, il lui faut la **fenêtre d'évidence**
   (*« les quatre dernières mesures »*), définie au `01-` §3 — **section que le prompt de C4-L3
   n'autorise pas à lire** aujourd'hui. → **Ajouter `01-` §3 au manifeste de L3.** Une ligne.

Et cela confirme que **L2-Q1 est le verrou** : sans « à quelle condition une mesure est réussie sur
un observable », ni le taux ni son évolution ne se calculent.

## L3-Q5 — `couverture_observables` et la version finale d'escalade

> *Ta réponse : pas sûr de comprendre la question. Mais `exerce` vaut pour tous les observables, et
> j'ai l'impression que le repli suggéré est précisément ce que le repli vers `exerce` propose.*

✅ **Tu as compris la question mieux que je ne l'avais posée, et tu as raison sur les deux points.**

*Explication, simplement.* `couverture_observables` dit, **pour un cran donné**, ce que l'exercice
fait de chaque observable. Le `02-` §2.3.2 lui donne **trois valeurs, et trois seulement** :

| valeur | ce qu'elle veut dire |
|---|---|
| `isole` | l'observable est **nommé** et seul en jeu |
| `exerce` | *« l'observable est en jeu, **mêlé aux autres**. Réussir l'exercice n'implique pas de réussir là-dessus. »* — c'est la valeur des trois crans de production (2, 6 et 8) |
| `observable_seul` | mesurable **mais pas entraîné** — *« matériau de mesure, pas d'entraînement — sonde silencieuse, jamais cible »* |

Elle est **déclarée par cran** et **se dérive** ; elle ne se saisit jamais à la main (`04-` §0).
**Donc le relevé se trompait à moitié** : la colonne est vide en base, mais **sa forme est
parfaitement déclarée**. Ce n'est pas un JSONB libre.

**Et ton second point est exact : le repli existe déjà, il est écrit, et c'est la branche d'échec du
`01-` §6** — *« Si aucun cran ne porte l'observable visé, on sert quand même : l'exercice retenu vaut
**`exerce`** sur l'observable, et non `isole` […] N1 reste sur le cran courant, dégrade en retour
mono-focal, et journalise la décision comme `degrade`. »* Le repli n'est donc **pas à inventer**, et il
n'appartient **pas** à C4-L3 : il est au routeur, donc à **C4-L2**.

**Ce qui reste, et c'est un mot.** Quand l'escalade rend la version finale requise *« sur les
exercices portant l'observable ciblé »*, « porter » veut-il dire `isole` **seul**, ou `isole` **et**
`exerce` ?
**Ma proposition : les deux.** *Pourquoi* : la branche d'échec sert précisément du `exerce` **pendant
l'escalade**. Si `exerce` ne comptait pas, l'escalade dégradée perdrait sa version finale — c'est-à-dire
exactement le cas où elle en a le plus besoin. (`observable_seul` est hors jeu dans les deux lectures :
il n'est jamais une cible.)

## L3-Q6 — La chasse aux fautes : quel relevé mécanique ?

> *Ta réponse : j'ai l'impression que le relevé mécanique est calculé à partir des fautes relevées par
> l'IA.*

⚠️ **C'est faisable, et c'est probablement la seule voie réaliste — mais ça contredit la source telle
qu'elle est écrite aujourd'hui.**

`06-Palimpseste.md` §2 dit, mot pour mot : *« Et une micro-tâche d'hygiène : la chasse aux fautes. Un
relevé mécanique — **calculé en code** — signale qu'il reste *N* fautes probables ; l'élève en corrige
ce qu'il trouve. **Hors lettre, hors calibration** : c'est de l'hygiène, pas de la mesure. »*

Et le chantier a un précédent qui va dans **l'autre sens** : le **pré-relevé mécanique** de la chaîne
Expression — phrases numérotées, longueurs, ouvertures, répétitions — est calculé **en code** puis
**fourni au modèle**, *« gratuit et parfaitement stable »*. C'est l'inverse de ce que tu proposes.

**Le fait matériel qui te donne raison**, en revanche : le dépôt n'a **aucun correcteur** ni **aucune
dépendance de dictionnaire français**, et le seul relevé de langue qui existe est un champ `ortho`
**écrit par l'IA**.

→ **Ta réponse est prenable, mais elle demande une phrase au `06-` §2** : dire que *N* est **compté en
code à partir du relevé de la chaîne**, et non **détecté** en code. La doctrine *« hors lettre, hors
calibration »* survit intacte.
⚠️ **Et elle crée une dépendance nouvelle de C4-L3 sur C4-L5**, sur le seul point où L3 pouvait s'en
passer : sans chaîne, plus d'encart langue du tout.
*Alternative, si tu veux garder l'encart indépendant* : le **différer**. Le temps 4 se construit sans
lui.

## L3-Q7 — Le retour et ses points ancrés

> *Ta réponse : c'est un texte segmenté. (Sauf avis contraire)*

✅ **Tient, et c'est la réponse la moins chère.** `exercices_retours.points_ids` devient un simple
index, et chaque point porte son **identifiant stable**, son **ancrage** et son **texte**. Le bouton
« je ne suis pas d'accord » a alors un objet, et le drapeau des contestations répétées a quelque chose
à compter.

**Une conséquence à porter** : ça crée **une obligation sur C4-L5**, qui engendre le retour. Le
gabarit Calame du `07-` §4 impose aujourd'hui une **longueur** et un **nombre de choses nommées**,
jamais une **structure**. → Il faut écrire au `07-` (§1.2 ou §4) que **le retour se rend segmenté**,
sinon L5 rendra un bloc et C4-L3 devra le découper — c'est-à-dire exactement le cas que ta réponse
écarte.

## L3-Q8 — La forme des démonstrations, et l'avertissement quand elle manque

> *Ta réponse : pas sûr de bien comprendre.*

**La question a deux moitiés. Je les redis simplement.**

### (a) La forme du contenu d'une démonstration

*Rappel* : le 18/08, on a tranché que les démonstrations du temps 1 sont **fabriquées par le
professeur hors plateforme** et **déposées par (compétence × grain)**, comme son corpus. La table
`exercices_demonstrations` existe, et sa colonne `contenu` est un **JSONB sans forme**.

Or le `06-` §2 dit que la démonstration n'a pas la **même nature** selon le grain : un **exemple**, un
**modelage** (*« un brouillon commenté qui montre la genèse, ou deux plans annotés à comparer »*), une
**checklist**. Ces trois-là **ne s'affichent pas de la même façon**.

**La question :** une forme **par nature**, ou **une forme unique** que les trois partagent ?

**Ma proposition :** une **enveloppe unique avec un discriminant `forme`**, et un corps par forme. Et
son domicile est trouvé : puisque le professeur les **dépose**, la forme appartient au **format
d'import** — c'est une **cinquième banque du `08-FORMAT_IMPORT.md`**, à côté de `textes[]`,
`sujets[]`, `materiaux[]` et `exercices[]`. *(Vérifié : le `08-` ne contient aujourd'hui aucune
mention des démonstrations.)* Ça se fait **dans la même séance que l'arbitrage du `08-`**.

### (b) L'avertissement au professeur quand une démonstration manque

*Rappel* : on a acté que *« absente, le temps 1 s'en passe et **le professeur en est averti** — rien
ne s'engendre à sa place »*. Or **aucun canal d'avertissement pédagogique n'existe** : le seul canal
du dépôt est `integrite_signalements`, réservé au drapeau d'intégrité (*« un lot le réutilise, il n'en
crée pas un second »*).

**La question :** un canal neuf, la page du professeur (**C6-L1**, non jouée), ou une simple trace
serveur ?

**Ma proposition : pas de canal neuf.** L'avertissement se pose **là où le professeur dépose** —
c'est-à-dire **à l'écran de la fabrique, C4-L8** : *« il manque une démonstration pour (compétence ×
grain) »*. En attendant que L8 soit joué, **une trace serveur**. Zéro table, zéro canal.

---

# Partie 4 — L'ordre que je propose pour demain

**Cinq étapes, de la plus débloquante à la plus locale.**

**1. Arbitrer le `08-FORMAT_IMPORT.md`.** Il porte `[à valider]` et dit lui-même que rien ne s'appuie
dessus tant que tu ne l'as pas arrêté. Il contient déjà **18 refus, 3 blocages et 6 signalements**
rédigés. Il débloque **L3-Q3**, **L3-Q8**, une partie de **L2-Q7** (le champ `notions`), et **tout
C4-L8**.

**2. La séance « qu'est-ce que réussir un observable » — L2-Q1 et L2-Q2 ensemble**, Q2 d'abord parce
qu'elle peut se dissoudre. Domicile : le volet `notation` du **bloc machine** des six fiches. Elle
débloque **C4-L2** (le socle de N1, N2, N3, de la désescalade et de la progression), **L3-Q4**, et une
partie de **C4-L5**.

**3. Fabriquer le prompt de C4-L8.** C'est la dépendance déclarée de C4-L2 et le lot qui débloque le
plus de choses ailleurs : la banque « se juger » (L3-Q1), les statuts de recette, la date de bascule
(L2-Q6), le cours vu (L2-Q7), les démonstrations (L3-Q8). **Puis C4-L5**, qui débloque C4-L3 et C4-L4.

**4. Les petites écritures de source**, qui ne demandent aucune séance dédiée — une phrase chacune :

| écriture | où | question réglée |
|---|---|---|
| la borne haute du segment 5 est élastique | `01-` §4 | L2-Q3 |
| effacer la montée en charge, **aux deux endroits** | `01-` §6 **et** `competences/synthese.md` | L2-Q8 |
| le statut `retire` | `07-` §1.1 | L2-Q4 |
| le palier cible vaut **B**, lu sur la lettre affichée | `01-` §8.9 | L2-Q5 |
| le retour se rend **segmenté** | `07-` §1.2 ou §4 | L3-Q7 |
| *N* est **compté** en code à partir du relevé de la chaîne | `06-` §2 | L3-Q6 |
| la table de correspondance (compétence × observable) | `07-` §1 | L3-Q1 |
| `01-` §3 entre au manifeste de C4-L3 | `07-` §2 | L3-Q4 |

**5. Puis rejouer C4-L2 et C4-L3.**

---

## Une note pour la suite

**Oui, les autres lots produiront des relevés du même genre**, et ce n'est pas un défaut : un prompt
de lot est fait pour **s'arrêter plutôt que deviner**, et c'est exactement ce que les deux séances ont
fait. Mais ces relevés seront **beaucoup plus courts** si on fabrique les prompts **dans l'ordre du
graphe** plutôt que dans l'ordre des numéros. Sur les seize questions de ces deux relevés, **six**
n'existaient que parce que C4-L8 n'a pas été joué avant.
