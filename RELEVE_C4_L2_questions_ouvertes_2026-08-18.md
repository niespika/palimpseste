# RELEVÉ — C4·L2 : ce qui bloque, et ce qui reste à trancher

**Séance du 18/08/2026.** Prompt de session : `PROMPT_Code_C4_L2.md`. **Aucun code écrit, aucune
migration, aucune ligne au `SUIVI_SQL.md`, aucune écriture en base** — la séance s'est arrêtée au
constat, comme le prompt le demande (« Si une pièce manque ou bloque, arrête-toi et signale-le, ne
devine pas »).

Ce document porte trois choses : ce que le **contrôle d'entrée** a donné, **deux dépendances non
tenues** qui rendent le « fait quand » du lot inatteignable en l'état, et **huit questions** que les
sources du manifeste ne tranchent pas.

**Méthode.** Les sources du manifeste ont été lues en entier (`07-` §1, §2, §5 · `01-` §1 à §11 ·
`06-` §5), plus les citations que le prompt autorise (`02-` §1, §2.2, §2.3.2, §3, §4 ·
`competences/*.md` pour les observables requis). `Annexe A` du `01-` n'a pas été ouverte : le
manifeste ne la nomme pas et aucune section citée n'y renvoie. `SPEC_C3_exercices_competences.md`
n'a pas été ouverte. Le balayage des trous a produit **84 candidats**, chacun soumis à une
contre-épreuve chargée de le **réfuter** sur pièce : **74 réfutés**, 10 survivants, dont deux paires
de doublons — **huit questions distinctes**.

---

## 1. Le contrôle d'entrée — passé

| Pièce | Attendu au prompt | Constaté | Verdict |
|---|---|---|---|
| `07-Implementation.md` §1, §5 | VERSION 2.2 | **VERSION 2.2**, VALIDÉ ET GELÉ | ✅ |
| `01-routeur.md` §4, §5, §6, §8, §9 | VERSION 5.0, ≥ *relu et validé* | **VERSION 5.0**, VALIDÉ ET GELÉ | ✅ |
| `06-Palimpseste.md` §5 | VERSION 2.4 | **VERSION 2.4**, VALIDÉ ET GELÉ | ✅ |
| Les tables du `07-` §1 en base | toutes | **20/20 présentes**, aucune manquante | ✅ |
| Les trois interrupteurs | à OFF | `exercices_actif` = f · `routeur_actif` = f · `competences_affichage_actif` = f | ✅ |

La clause granulaire (une fiche de compétence absente bloque *cette* compétence) n'a pas d'objet :
le manifeste ne compte aucune fiche.

---

## 2. Deux dépendances non tenues — c'est ce qui arrête la séance

Le prompt rappelle lui-même la dépendance : *« `PLAN_DE_CHANTIER.md` §3 : C4-L2 dépend de C4-L1
**et de C4-L8** »*. **C4-L1 est clos** (18/08). **C4-L8 ne l'est pas** — et le contrôle d'entrée du
prompt ne vérifie que les tables, pas leur contenu.

### 2.1 La couche 3 et la couche 4 n'ont rien à sélectionner

Comptages en sandbox, ce jour :

| Table | Lignes | Ce que le routeur y cherche |
|---|---|---|
| `exercices_types` | **15** | les treize objets + les deux diagnostiques — ✅ posés par C4-L1 |
| `exercices_types.crans_admis` | **vide sur les 15** | les crans que l'objet admet — **couche 3** |
| `exercices_types_crans` | **0** | `couverture_observables`, provenances, **`duree_exercice_min`** |
| `exercices_types_modes` | **0** | les `modes[]` **par compétence** — R2, §7, l'étage 2 |
| `exercices` | **0** | les instances — **couche 4 : « le routeur n'habille rien, il sélectionne »** |
| `competences_niveaux` | **0** | la lettre, **le `statut_recette` que lit R0** |
| `competences_actives_par_classe` | **0** | quelle compétence est active dans quel cours |
| `competences_mesures` | **0** | tout le signal : ciblage, stagnation, montée, sondes |

**Conséquences dures, dans l'ordre où elles mordent.**

- **`duree_exercice_min` est « la seule valeur que le budget décompte »** *(`07-` §1.1)*. À 0 ligne
  sur `exercices_types_crans`, **PB6 n'a rien à décompter** : la boucle de pose ne peut pas
  s'exécuter, ni s'arrêter au plafond, ni journaliser l'écart au plancher.
- **R0 écarte tout** : « aucune règle ne peut proposer une compétence dont le statut n'est pas
  `evaluee` » *(`01-` §6)*, et aucune ligne de `competences_niveaux` n'existe. La liste de priorité
  de PA2 sort vide, à tous les cycles, pour tous les élèves.
- **La couche 4 n'a aucune instance** : « le routeur n'habille rien : il **sélectionne** parmi les
  instances que le professeur a déjà écrites » *(`01-` §4)*.

**Et ce n'est pas à C4-L2 de le poser.** Les crans admis et les modes par objet « se déclarent objet
par objet dans `04-Instances_Exercices.md` » *(`02-` §2 en tête, et §3)* — fichier **hors du manifeste
de ce lot**, et qui est au manifeste de **C4-L5**. Le `SUIVI_SQL.md` (ligne `c4_l1_seed.sql`, 18/08)
l'a d'ailleurs écrit noir sur blanc à la clôture de C4-L1 : *« les deux axes de déclaration sortent à
0 ligne — structure posée, contenu injecté en **C4-L5** (couche type dérivée du `04-`) et **C4-L8**
(import du professeur) »*, et *« quatre attributs sortent vides (`crans_admis`, `mode_saisie`,
`consigne_gabarit`, `exclusions_parcours`) »*.

> **Ce que ça veut dire pour le « fait quand ».** *« Le routeur remplit une semaine entière dans les
> bornes de chaque élève »* n'est pas démontrable, et le prompt refuse explicitement le substitut :
> *« des mesures posées en base pour la recette en tiennent lieu, **des mocks du moteur non** »* —
> l'autorisation porte sur les **mesures**, pas sur la fabrique des instances ni sur les deux axes de
> déclaration, que le piège 1 attribue nommément à C4-L8.

### 2.2 L'escalade n'a pas d'où lire les observables requis

*« L'escalade exige au moins un observable requis non acquis. **Quels observables sont requis, c'est
la fiche de la compétence qui le déclare** (`competences/<nom>.md`) : le routeur lit, il ne
décide pas. »* *(`01-` §8.3)* — et le piège 32 ajoute : **« aucune liste en dur »**.

Or le **lieu où vivent les compétences** — « il y **dépose ses fiches**, il y **lit ce qu'elles
portent** » — est un livrable de **C4-L8** *(`07-` §2)*. Il n'existe pas : **aucune des 20 tables du
`07-` §1 ne porte une fiche ni une liste d'observables**, et le prompt interdit à ce lot d'en créer
une (« Ce lot ne crée aucune table » ; la clause de migration additive du piège 11 ne couvre que des
champs sur des tables existantes — plancher/plafond au profil, préférence, un seuil en configuration).

*La logique du corpus tient* — une compétence dont la fiche n'est pas déposée est `differee`, donc
jamais `evaluee`, donc jamais escaladée *(`01-` §1 principe 5 et §8.1)* : la précondition n'est jamais
« inévaluable ». **Mais elle n'est jamais évaluable non plus tant que C4-L8 n'a pas de domicile pour
les fiches** — et la condition de recette du lot exige qu'*« une escalade se déclenche, s'applique et
se désescalade sur des données réelles »*.

---

## 3. Les huit questions

Numérotées par ordre de gravité. Chacune est décidable en une phrase ; aucune n'a été tranchée.

### Q1 — Le verdict d'un observable **sur une mesure prise seule** ⛔ bloquant

**Où.** `01-` §8.2 (*« Acquis : un observable dont le **taux de réussite** dépasse ~2/3 sur la
fenêtre d'évidence »*) et §8.4 (*« le sous-défaut dominant — l'observable non acquis **au taux le plus
bas** »*). Code : le socle de N1, N2, N3, de la désescalade et de la progression de PA3.

**Le trou.** La fenêtre d'évidence est *« les quatre dernières mesures »* *(`01-` §3)*. Un « taux de
réussite sur la fenêtre » suppose donc que **chaque mesure soit réussie ou ratée sur cet
observable** — et rien ne dit à quelle condition. Le problème n'est pas théorique : les observables
requis ne sont pas des booléens. `garant_present` est *« une proportion d'unités »*
(`competences/argumentation.md` §5) ; et **cinq des observables requis de l'Expression n'ont même pas
de dénominateur** — `densite_friction` et `densite_generique` sont des *« faits / 100 mots »*,
`mot_impropre`, `savant_plaque` et `repetition_pauvre` sont des *comptages* nus
(`competences/expression.md` §5).

**À trancher.** Le même ~2/3 s'applique-t-il à la valeur de la mesure elle-même (proportion ≥ 2/3
→ mesure réussie), chaque observable porte-t-il son seuil à sa fiche — et **que vaut une densité ou
un comptage**, où aucune proportion n'existe ?

### Q2 — « Le plancher » de la précondition basse ⛔ bloquant

**Où.** `01-` §8.3 : *« N1 ne se déclenche que sur un observable déjà mesuré au moins une fois
**au-dessus du plancher**, ou qui **plafonne sous ce plancher** sur deux fenêtres. »* Code : la garde
de déclenchement de N1.

**Le trou.** **Le mot « plancher » apparaît une seule fois dans tout le §8 — dans cette phrase même,
sans antécédent.** Le §8.2 n'en définit aucun ; le « plancher de mesure » du §9 est une *cadence*
(une mesure tous les 3 cycles), pas un niveau ; les fiches ne chiffrent aucun seuil par observable.

**À trancher.** « Le plancher » désigne-t-il le seuil d'acquisition de ~2/3 du §8.2 — N1 n'étant alors
ouvert qu'à un observable ayant dépassé 2/3 au moins une fois, ou restant sous 2/3 sur deux fenêtres
(soit 8 mesures) — ou une autre valeur, et laquelle ? *Lié à Q1 : les deux se répondent ensemble.*

### Q3 — Les bornes de segment, et la fin de période ⛔ bloquant en fin d'année

**Où.** `01-` §4, couche 1 (segments 1 / 2-4 / 5-14 / 15-23 / **24-32**) contre `01-` §1 principe 2
(*« le nombre de cycles est une **dérivée du calendrier**, pas une constante du document […] ce
document ne la fige pas »*) ; et `01-` §7 (le `p` du contrôle de trajectoire).

**Le trou.** Le segment 5 se ferme-t-il à la **semaine de cours 32** (borne absolue), ou au **dernier
cycle que donne le Calendrier** (borne élastique) ?

**Ce que ça change.** Année plus longue : les semaines 33+ n'ont **aucune ligne** dans la table des
proportions — la couche 1 ne peut rendre aucun grain. Année plus courte : le segment 5 ne se referme
jamais, `p` reste sous 1, le « il doit » ne se déclenche pas, et **le plancher macro de 25 % — le seul
invariant du §4 qui existe pour être forcé avant l'examen — n'est jamais imposé.**

*Les segments 1 à 4 s'écrivent sans cette réponse* : la calibration, la bascule de `profil_provisoire`,
le démarrage de R1 et des compteurs d'escalade au segment 3 n'en dépendent pas.

### Q4 — L'override de retrait : jusqu'à quand, et ce qu'il fait à l'assiduité

**Où.** `07-` §1.5 (*« tout override du professeur »*) ; piège 43 (*« l'override retire ou impose »*) ;
`exercices_depots.statut` et son `abandonne`, *« exclu des règles de stagnation »* *(`07-` §1.1)*.
Code : l'écran d'assignation en lecture seule.

**À trancher.** (a) Jusqu'à quel statut de dépôt le retrait reste-t-il permis — refusé dès que le
dépôt quitte `assigne`, refusé à partir de `v1_remis`, ou jamais refusé ? (b) Un dépôt retiré
passe-t-il à `abandonne` — qui deviendrait le domicile commun du non-geste de l'élève et du retrait
du professeur — ou exige-t-il un statut distinct ? (c) Sort-il du dénominateur
`assiduite_hebdo.exercices_assignes`, **y compris quand la semaine est passée et son `semaine_faite`
déjà écrit** ?

### Q5 — Le « palier cible » du rang 2 des sondes

**Où.** `01-` §8.9, ordre de priorité, rang 2 : *« une compétence **au palier cible atteint**, non
vérifiée depuis plus de 5 semaines »*. Code : phase C, PC1.

**Le trou.** Aucune source ne définit ni ne stocke un « palier cible ». Le seul voisin est le §1
principe 3 — *« la majorité des élèves atteint **B** »* —, qui est un objectif de dispositif, pas une
valeur par élève × compétence. `competences_niveaux` est fermée par « Rien d'autre » *(`07-` §1.3)*.

**À trancher.** (a) Constante du dispositif — **B** pour tous ? (b) Le sommet **A** ? (c) La stabilité
acquise du §8.3 — tous les observables requis acquis ? (d) Une valeur réglée par le professeur, qui
coûterait un champ neuf et un quatrième écran ? (e) Rang 2 tenu pour **inactif** tant que rien ne le
fixe, tout tombant au rang 3 ? Et, si c'est un palier : lu sur la **lettre affichée** (comme le seuil
d'entrée du Questionnement) ou sur la **valeur non plafonnée** (comme tout le reste du ciblage) ?

*Le plafond de 4 sondes par cycle fait de cet ordre le décideur effectif de qui est mesuré chaque
semaine — la réponse n'est pas cosmétique.*

### Q6 — La coupe « les mesures postérieures à la recette »

**Où.** `01-` §3, ligne `statut_recette` : *« Le passage de `mesuree_silencieusement` à `evaluee`
**recalcule la lettre depuis les seules mesures postérieures à la recette** ; les mesures antérieures
restent au journal, distinguées par `instrument_version`. »* Code : le prédicat commun à la lettre,
au signal de ciblage et à la valeur non plafonnée.

**Le trou.** **Rien ne porte la date de bascule.** `07-` §1.3 énumère `competences_niveaux` champ par
champ et conclut « Rien d'autre » ; le schéma joué le confirme ; `updated_at` est touché par n'importe
quelle écriture. Et `instrument_version` ne peut pas servir d'ancre : le corpus sépare les deux
événements — *« le statut se déclare par le professeur, **il ne se dérive pas d'un banc** »*
*(`07-` §2, C5-L3)*.

**À trancher.** Un horodatage de bascule sur `competences_niveaux`, en migration additive — ou autre
chose, et quoi ?

*Non bloquant au chemin nominal* : quand la recette précède toutes les mesures (le professeur déclare
avant le diagnostic de la semaine 1), le filtre est un no-op. Le cas ne mord que sur une compétence
promue **en cours d'année**.

### Q7 — Le non-spoiler : où se lit « la position de lecture connue de l'élève »

**Où.** `01-` §4, couche 4 : *« le routeur n'assigne jamais au-delà de la position de lecture connue
de l'élève. **La borne de la classe n'est pas la sienne.** À défaut de position connue, il sert un
texte court hors livre. »* Code : le filtre des instances sourcées sur le livre, et la `borne_amont`
journalisée.

**À trancher.** Sur quelle donnée cette position se lit-elle — le dernier travail de livre que l'élève
a lui-même rendu dans Aletheia (`aletheia_travaux.semaine_index` est la seule progression par élève qui
existe), une position qu'il déclare, ou une saisie du professeur ? Et sur quelle échelle ordonnée se
compare-t-elle à une référence, `exercices_references.localisation` étant du texte libre ?

### Q8 — R3 : la « montée en charge forcée avant les périodes d'explication de texte »

**Où.** `01-` §6, R3.

**Le trou.** La clause n'a **ni définition, ni chiffre, ni source**. Aucune section du manifeste ne dit
ce qu'est une « période d'explication de texte », et le `01-` §10 renvoie explicitement *« quels genres
aux dates suivantes, et à quelles dates »* au **plan d'évaluation**, qui vit au Scriptorium.

**À trancher.** Laisse-t-on la clause non implémentée en la signalant — la probabilité `(d / 2C)²` est
complète sans elle — ou l'implémente-t-on, et alors : où le routeur lit-il la période, combien de
cycles avant elle mord, et agit-elle comme facteur sur la probabilité ou comme insertion forcée qui
court-circuite le tirage ?

---

## 4. Ce que la contre-épreuve a réfuté — pour mémoire

74 candidats sont tombés sur pièce. Les plus instructifs, parce qu'ils auraient coûté une migration
ou un écran de trop :

- **L'avertissement « élève sans parcours » n'a pas besoin d'un domicile.** *« Le parcours d'un élève
  ne se stocke pas, il se dérive »* *(`07-` §1.3)* : l'avertissement est le prédicat « l'union dérivée
  est vide », donc une **lecture**, pas un état. Un drapeau stocké périmerait au premier
  `type_pedagogique` renseigné. — *Rappel : `THLP` et `Test` portent toutes deux `filiere = 'HLP'`
  mais `type_pedagogique` NULL. La condition de recette du lot est donc directement exerçable dès que
  le reste tourne.*
- **Le journal de l'escalade n'a pas de trou** : sa donnée est nommée *(`01-` §11 point 3)* et sa
  **forme physique appartient à la session** *(`07-` §1)*.
- **Le pool de la couche 4 ne peut pas se vider par excès de contrainte** : ni le mode, ni le cran, ni
  le grain ne filtrent — le §7 « n'élit jamais », et la table des crans est *« une DISTRIBUTION, pas
  une assignation »*.
- **« Une instance rattachée à un cours déjà vu »** : la source désigne une fonction existante — celle
  du RAG —, et le geste de déclaration appartient à la fabrique, donc à C4-L8.
- **`crans_admis` vide n'est pas une décision de C4-L2** : c'est un seed C4-L1 incomplet, déjà déclaré
  comme tel au `SUIVI_SQL.md`.

---

## 5. Ce qui part dès que c'est tranché

Rien n'attend que les huit réponses : **Q1, Q2 et Q3** ouvrent le chantier, les cinq autres se posent
en un seul point du code chacune.

1. **Le moteur pur**, en fonctions testables (`utils/`, patron `node:test` du dépôt) — couche 2
   (calibration, R0-R5, branche d'échec), phases A/B/C, contrôle de trajectoire des trois tables,
   escalade N1/N2/N3 et registres, règle de montée M-a…M-e, lettres et clôture de la calibration.
   Il ne dépend d'aucune donnée : ses entrées sont des structures.
2. **La migration additive et gatée** que le piège 11 autorise : plancher, plafond et budget optionnel
   **au profil**, la préférence recueillie *(le recueil se pose ; **son contenu manque aux sources** et
   se signale au professeur — piège 5)*, le seuil de « semaine faite » et la moitié de la frise **en
   configuration** *(`06-` §5 : « jamais une constante en dur »)*. Une ligne au `SUIVI_SQL.md` avant
   exécution ; protocole **renforcé** sur `profiles`.
3. **Les trois écrans professeur** — les budgets, l'assignation **en lecture seule** avec override
   journalisé, l'assiduité (les deux agrégats, la frise à trois couleurs, le tableau), au Scriptorium
   prof, sans agrégat stocké.
4. **La recette**, quand C4-L8 aura donné un stock : par requête **et** à l'écran.

---

## 6. La décision qui revient à Louis

Trois voies, et elles ne coûtent pas la même chose :

- **(a)** Répondre aux huit questions, puis jouer C4-L2 **jusqu'au moteur, aux écrans et à la
  migration** — en actant que la recette (« remplit une semaine entière ») attend C4-L8.
- **(b)** Jouer **C4-L8 d'abord** — c'est la dépendance que le plan de chantier déclare —, puis C4-L2
  d'un seul tenant, recette comprise.
- **(c)** Ouvrir une séance courte qui complète le **seed C4-L1** (`crans_admis`, les deux axes) depuis
  `04-Instances_Exercices.md` — mais ce fichier est au manifeste de **C4-L5**, pas d'ici.

**Recommandation : (b).** C'est la seule qui rende le « fait quand » atteignable sans négocier, et le
prompt dit que le « fait quand » ne se négocie pas en séance.
