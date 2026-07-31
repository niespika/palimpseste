# PROMPT — Session Code ⚙️ : C4 · Lot L2 — Pilotage prof (budgets, assignation visible, assiduité)

> **À coller dans une session Claude Code FRAÎCHE** (règle R4 du plan : une session = un lot).
> **C4-L1 doit être fait et joué en sandbox** — ce lot écrit dans ses tables.
>
> **Manifeste de fichiers faisant foi — à lire en démarrant, rien de plus** (règle de manifeste,
> SPEC C3 §9) :
>
> | Fichier | Ce qu'on y lit | Statut requis |
> |---|---|---|
> | `SPEC_C3_exercices_competences.md` | **le Tableau de bord du socle** (section B : ce qui n'est PAS décidé — **B1-1, B1-2, B1-3 et B1-6** te concernent directement ; B1-7 est fermée depuis A8), **§4 (sélection, budgets, gates)**, **§4ter (assiduité)**, §6 (schéma), §9 (le lot) | **v4.2 — socle de construction (gel du 29/07, amendements A1 à A8)** ✔ |
> | `SUIVI_SQL.md` | protocole R6 + journal | à jour ✔ |
> | `AGENTS.md` | conventions repo, dont R8 : un module = 2-3 onglets | ✔ |
> | `globals.css` | les jetons de couleur et de police par module — **jamais de hex en dur** | ✔ |
>
> **`01-routeur.md` (dossier de conception) n'est PAS au manifeste de ce lot** : le cœur R1-R6 fait
> l'objet d'un lot distinct. Ce lot construit les **écrans du prof** et les **compteurs**, pas
> l'algorithme de routage. Si tu penses avoir besoin d'une règle du routeur, **arrête-toi et
> signale-le**.
>
> **Contrôle de version, mécanique** : ce prompt est écrit contre la **v4.2**. Si la spec porte une
> version supérieure, **arrête-toi** et lis son **journal des amendements** — un amendement touchant
> §4, §4ter ou §6 invalide une partie de ce prompt.

---

## Mission

Donner au professeur les trois choses dont il a besoin pour piloter la rentrée :

1. **régler les budgets** de travail hebdomadaire de ses élèves ;
2. **voir** ce qui a été assigné cette semaine, et pouvoir l'écraser ;
3. **savoir qui travaille** — les compteurs d'assiduité.

**Il n'y a pas de file de validation.** L'arbitrage du 29/07 l'a supprimée (SPEC C3 §4) : les
références décomposées se valident **une fois, à la constitution du corpus**, jamais au fil de l'eau.
Ne la reconstruis pas sous un autre nom.

**Tout naît derrière `exercices_actif` OFF** (règle R2).

## Ce qui existe déjà (à réutiliser, pas à réécrire)

- Le **schéma du lot L1** : `exercices`, `exercices_depots`, `exercices_types`, `assiduite_hebdo`,
  `routeur_decisions`, les trois gates.
- Le **module Calendrier** : c'est lui qui sait quelles semaines sont des semaines de cours et
  lesquelles sont des vacances. **Le compteur d'assiduité le lit — il ne recompte pas les semaines
  tout seul.**
- Le patron d'écran prof et les **jetons `globals.css`** du module Codex.
- Le patron de **validation par lot** (leçon Fragments) — utile pour la sélection multiple, même
  s'il n'y a plus de file à valider.

---

## 1. Écran « Budgets » — le budget est une propriété de l'ÉLÈVE

Le prof règle, **en début d'année**, pour chaque élève : un **plancher**, un **plafond** et un
**quota optionnel**, exprimés en **minutes de cycle** (`duree_cycle_min`, jamais la durée de
rédaction). Valeurs par défaut à proposer, **toutes provisoires et modifiables** :

| Situation | Plancher | Plafond | Optionnel |
|---|---|---|---|
| HLP seul | 60 min | 90 min | + 30 min |
| TC seul | 45 min | 60 min | + 30 min |
| Bi-classe (TC + HLP) | 90 min | 120 min | + 30 min |

- **Le budget ne se règle pas par classe.** Un élève inscrit en TC **et** en HLP a **un seul**
  budget, partagé entre ses deux cours — c'est la conséquence directe du **profil unifié**
  (confirmé par l'amendement A1 : les deux parcours ont les **dix** compétences ; ce qui varie est
  la **famille** dans laquelle chacune est active). Un écran qui donnerait deux budgets à cet élève
  est un bug de conception, pas une commodité.
- Réglage **par lot** (sélection multiple d'élèves → appliquer un jeu de valeurs) **et** individuel.
- **Préférence de l'élève** (davantage d'écriture ou de lecture) : le champ existe, il est recueilli
  à intervalle régulier et **affiché au prof**. Il est pesé par le routeur plus tard — ici, on le
  stocke et on le montre.

## 2. Écran « La semaine » — en LECTURE SEULE, plus l'override

Un tableau : pour chaque élève, **ce qui lui a été assigné cette semaine** — type, compétence cible,
durée de cycle, échéance, statut du dépôt, et **l'origine** (`routeur` ou `prof`).

- **Aucun geste de validation.** Le prof regarde ; il ne valide rien. C'est le remplacement explicite
  de la file supprimée.
- **Override** : le prof peut retirer un exercice assigné, ou en imposer un autre. **Tout override
  est journalisé** — `origine` passe à `prof`, et une entrée part au journal
  (`routeur_decisions` porte déjà le tie-breaking et la `borne_amont` ; ajoute l'override au même
  endroit ou à côté, à ta convenance, mais **journalisé**).
- **Total par élève affiché** : la somme des `duree_cycle_min` de sa semaine, avec un repère visuel
  quand elle sort de ses bornes plancher/plafond. C'est le seul endroit où un budget-temps
  s'affiche — **l'élève, lui, ne voit jamais de budget** (§3 de la spec).

## 3. Exercices communs

Le prof crée un exercice **imposé à toute une classe** : choix du type, instanciation de la consigne,
fenêtre. Il atterrit comme n'importe quel exercice (`origine = prof`), avec une ligne
`exercices_depots` par élève de la classe, à l'état `assigne`.

C'est ce mécanisme qui porte la **voie mixte** décidée le 29/07 : tant que peu de compétences sont
`evaluee`, le routeur ne remplit qu'une partie du budget et **le reste va aux exercices communs**.

## 4. Compteurs d'assiduité (§4ter)

**C'est la partie à ne pas différer** : un semestre ne se recompte pas après coup. Si la collecte ne
démarre pas à la rentrée, le premier semestre est perdu. Les **écrans** peuvent être minimaux ; les
**compteurs**, non.

Deux agrégats, alimentés depuis `exercices_depots` et le Calendrier :

- **Taux d'inactivité hebdomadaire par classe** — la proportion d'élèves qui n'ont rien rendu de la
  semaine. *(Le professeur s'en sert comme déclencheur : un tiers de la classe inactive deux semaines
  de suite change sa conduite de classe.)*
- **Pourcentage d'assiduité par élève** :

  > **% assiduité = semaines faites ÷ (semaines du semestre − semaines de vacances)**
  >
  > Une **semaine est « faite »** quand l'élève a rendu au moins la **proportion configurée** de ses
  > exercices assignés de la semaine. **Le seuil est un paramètre de configuration** (valeurs
  > envisagées : 2/3 ou 3/4) — **jamais un nombre en dur dans le code**.
  >
  > Les **semaines de vacances sortent du dénominateur** — sans jamais empêcher un élève de
  > travailler pendant ces semaines. Le travail fait pendant les vacances peut ajouter **au plus une
  > semaine** au numérateur, sur tout le semestre.

- **Aucune note.** La plateforme affiche un **pourcentage**, rien d'autre. Il n'existe **aucun champ
  de note** dans Palimpseste : le professeur fait lui-même la conversion, hors application. Si tu te
  surprends à écrire un barème, tu es hors périmètre.
- Un exercice à l'état **`abandonne`** compte comme non fait pour l'assiduité, et **n'entre jamais
  dans les règles de stagnation**.

## 5. Périmètre d'affichage

- **Les lettres A-E sont visibles du professeur**, jamais de l'élève par défaut (§4ter). Ce lot est
  côté prof : les lettres y ont leur place **si et seulement si**
  `competences_affichage_actif` le permet, et de toute façon **rien ne s'affiche tant qu'aucune
  compétence n'est `evaluee`**.
- **Le Monitoring ne s'affiche pas comme une lettre** (amendement A8) : son état est une **amplitude
  d'écart plus une direction**, il vit dans `monitoring_niveaux`, et il n'est **jamais noté ni
  cible du routeur**. Si tu l'affiches ici, affiche-le comme tel — sinon ne l'affiche pas du tout,
  ce lot ne l'exige pas.
- **Dix compétences, pas onze**, et la **famille est une colonne** : il n'y a qu'un `questionnement`,
  actif en lecture pour tous et en écriture pour les seules classes TC (A1).
- Respecte R8 : **un module = 2-3 onglets**. Ces trois écrans ne créent pas trois onglets — ils
  vivent dans l'onglet de pilotage de Codex.

## Interdits (périmètre verrouillé)

- **Aucun algorithme de routage** — pas de R1-R6, pas de choix de cible, pas de sélection de type.
  Ce lot affiche et règle ; il ne décide pas.
- **Aucun appel IA.**
- **Aucune file de validation**, sous aucun nom.
- **Aucun champ de note**, aucune conversion en note, aucun barème.
- **Aucun budget attaché à une classe** plutôt qu'à un élève.
- **Aucune lettre pour le Monitoring**, et aucune ligne de Monitoring dans les tables de
  compétences.
- Pas de hex en dur : jetons `globals.css` uniquement.
- Toute migration éventuelle (paramètre de seuil, colonne de préférence) suit **R6** : fichier `.sql`
  + ligne dans `SUIVI_SQL.md` **avant** exécution, sandbox d'abord.
- Décision manquante → **note-la, ne la prends pas** (R7).

## Fait quand

- [ ] Le prof règle les budgets d'une classe entière **par lot**, et d'un élève **individuellement**.
- [ ] Un élève bi-classe a **un seul** budget — vérifié sur un cas réel de la sandbox.
- [ ] L'écran « la semaine » affiche l'assignation de chaque élève avec son **total de minutes de
      cycle** et un repère quand il sort des bornes. *(Le remplissage peut être fait à la main ou par
      des exercices communs tant que le routeur n'existe pas — l'écran, lui, doit être juste.)*
- [ ] Un **override** retire ou impose un exercice, et **laisse une trace journalisée**.
- [ ] Un exercice commun crée bien **une ligne `exercices_depots` par élève**, à l'état `assigne`.
- [ ] Le **taux d'inactivité par classe** et le **pourcentage d'assiduité par élève** se calculent, en
      lisant les semaines de vacances depuis le **Calendrier**, avec le **seuil en configuration**.
- [ ] `exercices_actif` est **toujours OFF** à la fin du lot.
- [ ] Aucun champ de note n'existe nulle part.

## Fin de session

Commit : `feat(codex): C4 L2 — pilotage prof (budgets par élève, semaine en lecture seule +
override, exercices communs, compteurs d'assiduité)`.

Termine par la note de journal habituelle et une **liste sèche pour le PO** : décisions laissées
ouvertes, endroits où l'absence du routeur t'a contraint, et tout ce que tu as dû simuler pour
tester.
