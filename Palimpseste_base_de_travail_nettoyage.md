# Palimpseste — Base de travail pour la session de nettoyage

## Orientation

Ce document n'est pas un cahier des specs : c'est une mise au propre de ta liste, organisée pour que tu puisses attaquer le ménage avec Code **lot par lot**, sans tout lui envoyer d'un coup. Trois idées le structurent :

1. **Les fondations** — quelques pièces dont presque tout le reste dépend. À traiter en premier, sinon tu refais deux fois le même travail.
2. **Les règles transversales** — des principes qui ne « vivent » dans aucun module en particulier mais s'appliquent partout. À embarquer dans chaque lot concerné, au fil des refontes.
3. **Les refontes par zone** — le détail, tableau de bord et module par module, qui te sert de référence quand tu rédiges un lot.

La feuille de route ci-dessous ordonne tout ça selon les dépendances.

---

## Feuille de route (ordre suggéré)

**Phase 0 — Nettoyage rapide** *(indépendant, peu risqué, réduit le bruit de fond)*
- Renommages globaux : *Épreuve → Essai* (partout, prof + élève), *séance → synthèse* (Codex).
- Corrections ponctuelles : flèche de retour Codex, bug du « dernier retour » qui colle à l'écran (Fragments élève), rémanences d'évaluation chiffrée (Fragments), suppression des flashcards issues des Fragments.
> Certaines de ces corrections touchent des modules qui seront refondus plus tard : tu peux les faire maintenant pour respirer, ou les fondre dans le lot du module. À ta main.

**Phase 1 — Fondations** *(3 piliers, parallélisables)*
- **Calendrier** : définir le semestre, qui devient la colonne vertébrale temporelle.
- **Scriptorium — distinction cours / texte** : le changement de modèle de contenu qui débloque Quazian.
- **Coquille de navigation** : 3 onglets + état actif + menus déroulants (prérequis du tableau de bord élève).

**Phase 2 — Tableaux de bord & sections structurelles**
- Section Organisation : Élèves (tuiles par classe → liste), Classes (tuiles cliquables), page élève dédiée.
- Tableau de bord prof : Santé cliquable, page « à risque » dédiée, clarté de la moyenne, tuiles *aujourd'hui* / *semaine*.
- Tableau de bord élève (nouveau, miroir du prof).
> C'est ici qu'on construit la *destination* « à faire » côté élève. Les modules viendront la *remplir* en phase 3.

**Phase 3 — Refonte des modules**
Dans l'ordre que tu veux, avec une contrainte : **Quazian (génération depuis les textes) après Scriptorium**.
- Fragments, Quazian, Codex, Aletheia.
- C'est dans ces lots qu'on embarque les règles transversales (intégrité, validation « lu », coût API, tuilage).

---

## Fondations — détail

### F1. Le Calendrier, colonne vertébrale
Le semestre est défini une seule fois, dans Calendrier, et tout le reste s'y ancre :
- Fragments : les tuiles de semaine sont générées automatiquement (plus de bouton « ajouter une semaine »).
- Essais (Fragments), unités (Scriptorium), lectures (Aletheia) : tous ancrés sur le calendrier.
- Tableau de bord (prof + élève) : tuiles *aujourd'hui* et *semaine courante*.
- Le « à faire » élève se nourrit en partie du calendrier (ex. lecture semaine 1 d'Aletheia à l'ouverture).

### F2. Scriptorium — distinction cours / texte
Au sein d'une **unité**, distinguer deux objets :
- le **cours** (ce qui existe déjà),
- le **texte** — partie intégrante de l'unité, à côté du cours, et distinct d'un « livre » (objet de lecture d'Aletheia).

Le texte nourrira une future extension d'Aletheia, et sert dès maintenant de source à Quazian. C'est pour ça que cette pièce est une fondation : **Quazian en dépend**.

### F3. Coquille de navigation
- **3 onglets principaux**, avec **état actif visible** (onglet grisé — aujourd'hui on ne sait jamais où on est) :
  - **Tableau de bord** (pas de menu déroulant).
  - **Organisation** *(à renommer — voir note)* → Élèves, Classes, Calendrier.
  - **Modules** → Fragments, Codex, Quazian, Aletheia, Scriptorium.
- Menus déroulants avec sous-menus ; on ne descend pas plus profond dans l'arborescence.
> *Note sur « Organisation »* : le mot regroupe le *qui* (Élèves, Classes) et le *quand* (Calendrier) — le cadre dans lequel opèrent les Modules. Pistes : **Cadre**, **Encadrement**, **Pilotage**. « Encadrement » a l'avantage d'une résonance pédagogique nette.

---

## Règles transversales — détail

### T1. Tuiles cliquables & navigation par paliers
Remplacer les listes par des tuiles cliquables, avec un drill-down régulier **classe → élève** (et parfois **→ unité**). Concerné : Classes, section « à risque », Fragments (vue d'ensemble, synthèse), Quazian (diagnostique, paramètres), Aletheia (paramètres), Codex/Aletheia (retours élève en tuiles).
> Prévoir aussi un composant **courbe d'évolution** réutilisable : plusieurs zones le demandent (moyenne de classe, moyenne d'élève, diagnostic Aletheia).

### T2. Intégrité des évaluations
- **Pas de refonte de la V1** par l'élève : il peut seulement reprendre une photo (mauvaise qualité / cadrage), avec un **dispositif anti-triche**.
- **Pendant un essai ou un quiz** : pas de sortie de page (consultation d'autres ressources bloquée), pas de retour en arrière.
- **Photos suspectes** : seuil de temps (jours/heures) **éditable par le prof** ; au-delà, la photo est *flag*. Côté prof, afficher le flag **+ le délai écoulé** entre la prise et le dépôt.

### T3. Détecteur de « petits malins »
Repérer les élèves qui n'ont pas joué le jeu, pour ne pas les évaluer pour rien : réponse hors-sujet, aveu de ne pas avoir fait le travail, ou aveu que la section ne s'applique pas. À brancher **en amont de l'évaluation**, dans tous les modules qui évaluent.

### T4. Validation « lu » des retours IA → « à faire »
Tout retour IA doit être **validé comme lu** par l'élève. Tant qu'il ne l'est pas : signalé « à faire » côté élève, et **signal diagnostique** côté prof. (Vaut au moins pour Codex et Aletheia ; principe général.)

### T5. Coût API généralisé
Le coût API apparaît dans **tous** les modules, plus une **synthèse des coûts totaux** dans le tableau de bord.

### T6. Bulles d'exemples éditables
Retravailler les suggestions/exemples affichés dans les bulles d'aide des modules (comment remplir une section) — idéalement, **les rendre éditables par le prof**.

---

## Refontes par zone — détail

*(Référence. Les règles transversales sont notées par leur code Txx.)*

### Tableau de bord

**Prof**
- Tuiles « Santé de la cohorte » : les rendre **cliquables** pour accéder au détail de ce qu'elles annoncent.
- Élève à risque : aujourd'hui un clic fait apparaître une tuile tout en bas (qu'on ne remarque pas). → **Rediriger vers une page dédiée** expliquant *pourquoi* l'élève est à risque. À grande échelle, le clic-tuile-en-bas ne tient pas : envisager une **liste / un tableau « à risque » filtrable** (par classe, par sévérité) où chaque entrée mène à sa page d'explication. (T1)
- Section « à risque » : clarifier **d'où vient la moyenne** et **ce qui manque**.
- Calendrier : garder la « vue détaillée », mais ajouter une tuile **aujourd'hui** + une tuile **semaine courante** (événements du jour / de la semaine). (F1)

**Élève** *(nouveau, miroir du prof)*
- Même organisation : onglets + menus déroulants (F3).
- Calendrier : aujourd'hui + semaine + vue détaillée (F1).
- Section **« à faire »** (destination des T4, lectures, validations…).
- Toggle de classe **plus visible**.

### Organisation — Élèves & Classes (prof)
- **Élèves** : s'il y a trop d'élèves, passer par des **tuiles par classe** → en cliquant, la liste des élèves (email, etc., comme aujourd'hui). (T1)
- **Nom d'élève cliquable** → page dédiée : diagnostics, rendus, évaluations…
- **Classes** : même fonction qu'aujourd'hui, mais en **tuiles cliquables** plutôt qu'en liste. (T1)

> **Modules** : l'onglet lui-même ne change pas (seuls les sous-menus de navigation évoluent, voir F3).

### Fragments

**Prof**
- **Semaine** : plus de bouton « ajouter une semaine » — les tuiles viennent du semestre défini dans Calendrier (F1). Garder l'ouverture / fermeture des fenêtres.
- **Vue d'ensemble** : clarifier ce que fait la section ; **mots en entier** (plus d'abréviations) ; clic sur une tuile de classe → **courbe d'évolution de la moyenne** de la classe ; idem par élève (la place existe). (T1)
- Purger les **rémanences d'évaluation chiffrée**.
- **Épreuve → Essai** partout ; l'Essai est **ancré dans le calendrier** (F1).
- **Synthèse** : tuiles de synthèse de semestre **cliquables** → classes → élèves. (T1)
- **Coût API** présent (T5).

**Élève**
- **Bug** : le dernier retour reste affiché même quand on clique sur une tuile (n'importe laquelle). À corriger.
- Ajouter une tuile **« synthèse »**.
- **Supprimer** les flashcards issues des Fragments (mauvaise idée).
- Trop d'informations à la suite : **tout tuiler** pour la lisibilité. (T1)

### Scriptorium

**Prof**
- Distinction **cours / texte** au sein de l'unité (F2).
- Unités **ancrées dans le calendrier** (F1).

### Quazian

**Prof**
- **Flashcards** : générables depuis les **unités de cours** *et* les **textes**, mais **distinguer la génération** ; **1 à 2 cartes par texte**, pas plus. *(dépend de F2)*
- **Quizz** : générables depuis unités de cours *et* textes — **pas depuis les livres**. *(dépend de F2)*
- **Diagnostique** : vue des fragilités **par classe** (tuile) → élève, *et* **par unité** (cours + texte, tuile). Au détail élève, **mieux expliquer les tuiles** (notamment **stabilité FSRS**). Rapport de fragilité éventuellement étendu aux flashcards (optionnel, à voir). (T1)
- **Paramètres** : une tuile **Notation** (paramètres de notation) + une tuile **Prompts**. (T1)
- **Coût API** présent (T5).

**Élève**
- **Chrono visible** pendant un quiz.
- **Skip** d'une question, avec retour possible en cliquant sur son numéro.
- **Onglets séparés** Flashcards / Quizz. Dans Quizz : **une tuile par quiz** (revoir le quiz + le retour donné). (T1)

### Codex

**Prof**
- Onglet **séance → synthèse**.
- **Flèche de retour** : après validation de la VF, la flèche du haut renvoie à « file de validation » ; elle doit renvoyer à **synthèse** (ex-séance).

**Élève**
- **Vérifier** que **tous les documents d'une unité** sont pris en compte dans l'évaluation de la synthèse (sinon le retour IA ignore un aspect que l'élève n'a pas traité — lié à F2).
- Retour en **tuiles** (comme Aletheia) : une tuile **« ce que tu n'as pas su dire »** + une tuile **« synthèse complète »**. (T1)
- Piste : **comparer** « ce que tu n'as pas su dire » avec l'**état de connaissance des flashcards** (diagnostic en batch, ou solution sans IA — à explorer).
- **Validation « lu »** de la synthèse → sinon signal diagnostique au prof, et apparition dans le « à faire » élève. (T4)

### Aletheia

**Élève**
- **Lecture au rythme de l'élève** : les dépôts de chapitre s'ouvrent dans **deux cas** — (1) changement de semaine (rythme prof), (2) dépôt fait par l'élève pour une semaine.
- **Voir ce qu'il y a à faire** dans le module. Livres à lire en **tuiles cliquables** ; l'architecture par semaine (ou par rythme) apparaît **après** le clic sur la tuile-livre. *(La progression graphique est à prévoir pour plus tard, avec les unités-textes.)*
- À l'ouverture, la **lecture semaine 1** arrive dans le « à faire » (se règlera avec le calendrier, F1).

**Prof**
- Parcours classe → détail élève → élève → semaine : le **diagnostic** ne doit pas être en bas de la tuile de semaine mais dans une **tuile en haut**, visible tout de suite ; avec **courbe d'évolution**. (T1)
- **Pas** de carte du livre dans la vue élève (elle est dans Scriptorium) — juste une **indication** que l'élève a vu la carte.
- **Paramètres** : navigation **par tuiles** (comme Fragments). (T1)
