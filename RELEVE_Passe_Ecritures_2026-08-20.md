# RELEVÉ — la passe d'écritures du 20/08, et ce qu'elle laisse ouvert

**Huit modifications posées dans cinq sources gelées, plus le plan de chantier et le journal.**
Toutes les gardes sont vertes : chaque ancre vérifiée unique **avant** toute écriture, chaque
« avant » contrôlé avec son propre drapeau *(disparaît / est contenu dans l'après)*, et les contrôles
machine rejoués après.

| source | version | avant → après |
|---|---|---|
| `01-routeur.md` | 5.0 → **5.1** | 4 écritures |
| `02-exercices.md` | 5.1 → **5.2** | 1 écriture |
| `06-Palimpseste.md` | 2.4 → **2.5** | 2 écritures |
| `07-Implementation.md` | 2.2 → **2.3** | 8 écritures |
| `competences/synthese.md` | 3.0 → **3.1** | 1 effacement |
| `PLAN_DE_CHANTIER.md` | — | 2 écritures |
| `CONTEXTE.md` | — | 1 entrée au journal |

**Contrôles** : `verifie-forme.py` **0 erreur** sur les cinq · `derive-04.py --verifie` **IDENTIQUE** ·
`verifie-instances.py` **544 routes, 0 erreur** · **zéro renvoi vivant** vers les passages effacés.

---

## 1. `01-routeur.md` §4 — les bornes des cinq segments se dérivent

La colonne « Bornes » des segments 3, 4 et 5 devient une dérivation, et trois paragraphes suivent la
table. Le contenu des cinq lignes n'a pas bougé d'un mot.

> **Le calcul.** Soit **C** la valeur du §1, principe 2 — `semaines de cours − 2`, lue au module **Calendrier**. Les segments 1 et 2 en prennent **quatre** ; le reste vaut **`R = C − 4`**, et il se partage en trois : **`⌈R / 3⌉`** au segment 3, **`⌊R / 3⌋`** au segment 4, **le solde** au segment 5. *Pour C = 32 : R = 28, et les trois derniers segments valent 10, 9 et 9 semaines — les semaines 5 à 14, 15 à 23 et 24 à 32.*
>
> **Les cinq segments se calculent à la conception d'un plan d'évaluation, et ils s'y affichent** : c'est là que le professeur voit ce que son calendrier produit.
>
> **Un calendrier qui ne les rend pas tous ne bloque rien : il se signale.** En dessous de **C = 5**, le reste est nul et les segments 3, 4 et 5 n'ont aucune semaine. Le routeur **n'invente aucune borne** : il émet un **signal non bloquant vers le professeur**, comme pour la cadence d'ancre manquée *(§10)*.

## 2. `01-routeur.md` §4, couche 4 — le non-spoiler a son échelle

> **Le non-spoiler : le routeur n'assigne jamais au-delà de la position de lecture connue de l'élève.** La borne de la classe n'est pas la sienne. **L'échelle de comparaison est le plan de lecture du livre** — ses semaines numérotées, déclarées par le professeur pour la classe —, et **la position de l'élève est la dernière de ces semaines qu'il a lui-même terminée**. Une référence tirée d'un livre **déclare la semaine du plan de lecture dont elle relève** : la comparaison est alors un ordre, jamais une lecture de texte libre.

*La phrase « la borne de la classe n'est pas la sienne » survit intacte, et elle est maintenant
exacte au sens fort : **l'échelle** est celle de la classe, **la position** est celle de l'élève.*

## 3. `01-routeur.md` §4, couche 4 — le rattachement au cours

> **Le rattachement se déclare sur le matériau** : un **sujet** ou un **texte** porte l'un de trois états — **`generique`**, servable en tout temps ; **rien de déclaré**, jamais servable ; ou **un ou plusieurs cours**, et il devient servable dès qu'**au moins un** d'entre eux a été **en partie vu**. *Le rattachement est facultatif, et son absence vaut « jamais servable » : rien ne part avant que le professeur l'ait trié.*

Le **geste** correspondant est écrit au `02-exercices.md` §6, à la fin du pipeline de création, là où
vit déjà l'appui — parce qu'il vaut pour les deux modules :

> **Et le rattachement au cours — sur le MATÉRIAU, jamais sur l'instance.** […] **Il se déclare à la conception ou après**, et le déclarer ne demande de toucher à aucun des exercices déjà bâtis dessus.

## 4. `01-routeur.md` §6 — la montée en charge de R3 est effacée

La phrase *« Montée en charge forcée avant les périodes d'explication de texte »* est retirée, et la
réserve de fin de règle passe de *« Cadences et forme de la montée provisoires »* à **« Cadences
provisoires »**.

**Le second domicile est effacé aussi** — `competences/synthese.md` portait la clause **avec son
motif**. La phrase y devient : *« L'insertion est **suspendue** tant que l'élève est en canal
Expression. »* **Le motif est perdu**, comme tu l'as tranché.

*Vérifié après coup : plus aucune occurrence de « montée en charge » dans le corpus vivant.*

## 5. `01-routeur.md` §8.9 — le palier cible

> 2. une compétence **au palier cible atteint** — le palier cible vaut **B** *(§1, principe 3)*, **lu sur la lettre affichée** —, non vérifiée depuis plus de **5 semaines**

## 6. `06-Palimpseste.md` §2 — la chasse aux fautes

> **Et une micro-tâche d'hygiène : la chasse aux fautes.** Il est signalé à l'élève qu'il reste *N* fautes probables ; il en corrige ce qu'il trouve. ***N* est compté en code, à partir du relevé de langue que la chaîne produit déjà** — l'écran ne détecte rien de lui-même et n'appelle aucun modèle. **Hors lettre, hors calibration** : c'est de l'hygiène, pas de la mesure.

## 7. `06-Palimpseste.md` §5 — le retrait et l'assiduité

Une ligne entre dans l'encadré des deux agrégats, juste avant les semaines de vacances :

> **Un exercice retiré par le professeur sort du dénominateur, mais pour l'avenir seulement** : une semaine dont le compte est déjà arrêté ne se recalcule pas. *Un chiffre déjà montré au professeur ne bouge plus.* Le retrait reste permis tant que le dépôt n'est pas clos, il est journalisé, et **il ne se confond pas avec l'abandon de l'élève**.

## 8. `07-Implementation.md` — huit écritures

**§1.1, la banque « se juger »** — une table neuve, nommée dans la même voix que les démonstrations du
18/08 :

> **La correspondance observable → formulation — par compétence × observable.** […] **Déposée à la fabrique** *(§2, C4-L8)*, par l'upload des fiches : **rien ici ne s'écrit à la main, et aucun lot n'invente une question.** **La forme physique t'appartient.**
>
> **Trois écrans la lisent, et c'est ce qui en fait un verrou** : la phase « se juger », le **rappel du temps 1 en langue élève**, et le **retour du temps 4, qui nomme la dimension**.

**§1.1, l'appui** — un cinquième point à « ce que la conception élit » :

> - l'**appui** — le `defaut`, les `distracteurs`, la `reponse_attendue`, le `guide` —, **par cas**. Le cran dit **lesquels existent** ; **ce qu'ils contiennent est saisi à la conception et vit en clair sur l'instance**, jamais noyé dans la consigne. **Les 10 à 15 distracteurs d'un cran guidé sont la saisie même de la crédence** : sans eux, la porte 2 n'a pas d'écran.

**§1.1, le statut `retire`** — ajouté à l'énuméré de `exercices_depots.statut` :

> **Les deux ne se confondent pas** : `abandonne` est un non-geste de l'élève, `retire` une décision du professeur, et l'assiduité mesure l'élève. Le retrait reste permis **tant que le dépôt n'est pas `clos`**, il passe par l'override et se journalise.

**§1.2, le retour segmenté** :

> **Le `texte` se rend SEGMENTÉ, et c'est un contrat sur celui qui l'engendre** *(§2, C4-L5)* : une **liste de points**, chacun avec son **identifiant stable**, son **ancrage** et son **texte** — jamais un bloc que l'écran devrait découper. *Les identifiants ci-dessus en sont alors l'index, et rien de plus.*

**§1.3, la date de bascule** — le champ entre dans l'énuméré *avant* le « Rien d'autre », et un
paragraphe le justifie :

> **La date de bascule s'écrit dans le même geste que le statut**, à l'écran de la fabrique — le seul endroit d'où un statut se pose. Elle a un lecteur, et un seul : le passage de `mesuree_silencieusement` à `evaluee` **recalcule la lettre depuis les seules mesures postérieures à la recette**, et sans elle ce filtre n'a pas de borne. *`updated_at` ne peut pas en tenir lieu : n'importe quelle écriture le touche.*

**§2** — **C4-L2** gagne le panneau des cinq segments *(dans le bullet des écrans de pilotage, pour ne
pas casser le compte « trois choses »)* et une clause au « fait quand » ; **C4-L3** gagne
`01-routeur.md` §3 à son manifeste ; **C4-L8** gagne quatre choses — la correspondance versée par
l'upload des fiches, la date de bascule, le rattachement au cours, et **l'avertissement « démonstration
manquante », posé à l'écran du dépôt, sans aucun canal neuf**.

## 9. `PLAN_DE_CHANTIER.md` — la règle d'ordre est maintenant écrite

Le §2 cesse de dire que deux prompts sont périmés *(ils ont été réécrits le 18/08)*, et une section
neuve entre au §3 :

> ### Les prompts se fabriquent dans l'ordre du GRAPHE
>
> **Jamais dans l'ordre des numéros.** Un prompt fabriqué avant sa dépendance ne se trompe pas — il **s'arrête au constat**, ce qu'on lui demande —, mais le relevé qu'il rend est en bonne part un relevé de questions **que la dépendance aurait fermées**. *C'est arrivé à C4-L2 et à C4-L3 : sur seize questions ouvertes, **six n'existaient que parce que C4-L8 n'était pas joué**.*
>
> **Et un prompt ne se relance pas tel quel après une passe d'écritures.** […] **Repasser le prompt par la recette du §5** coûte moins cher que de laisser la session redécouvrir des décisions déjà prises.

---

# Ce qui reste — et rien n'est bloqué

## Deux écritures différées, faute de l'arbitrage du `08-`

- **La forme du `contenu` d'une démonstration** — l'enveloppe à discriminant `forme`. Elle appartient
  au format d'import, et c'est là qu'elle s'écrira, en même temps que la **cinquième banque
  `demonstrations[]`**.
- **Le détail de la forme physique de l'appui.** Le `07-` le **nomme** désormais et renvoie au `08-`
  §5.2 pour les champs ; le reste appartient à l'arbitrage.

## Un point cosmétique, signalé et non touché

La table des proportions du `01-` §4 porte encore des repères de saison — *« (fin sept. → déc.) »*,
*« (déc. → début mars) »*, *« (mars → début mai) »*. Ce sont des **illustrations en italique**, pas
des règles, et elles restent vraies pour une année ordinaire. Avec des bornes désormais élastiques
elles deviennent approximatives. **Je ne les ai pas touchées** — les retirer est une décision de
lisibilité, pas de doctrine.

## L'ordre pour la suite

1. **La séance « seuil de réussite d'un observable »** — `PROMPT_Session_Seuil_Observable.md`.
2. **L'arbitrage du `08-FORMAT_IMPORT.md`** — ses 18 refus / 3 blocages / 6 signalements, plus les
   **trois ajouts** : le rattachement au cours sur `sujets[]` et `textes[]` *(facultatif, absence =
   jamais servable ; `notions` est **gardé**)*, la **semaine de plan de lecture** sur un texte tiré du
   livre, et la banque `demonstrations[]`.
3. **Fabriquer les prompts C4-L8 puis C4-L5**, et les jouer.
4. **Reconstruire les prompts C4-L2 et C4-L3** par la recette du `PLAN_DE_CHANTIER.md` §5.
