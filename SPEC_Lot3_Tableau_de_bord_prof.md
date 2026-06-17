# SPEC — Lot 3 : Tableau de bord prof

> Lot du plan global (`PLAN_Palimpseste_modifications.md`).
> **Prérequis : Lots 1 et 2 implémentés** (modèle classe par inscription + cycle de vie). Le dashboard lit des données déjà scopées proprement (Lot 1) et branche les opérations d'effacement / rappels (Lot 2).
> Spec standard (pas d'audit-first).
>
> **⭐ Enjeu particulier :** ce lot construit un **composant réutilisé par les Lots 4 à 8** (Modules, Fragments, Scriptorium, Quazian, Codex). Le définir proprement ici évite de le réécrire cinq fois.

---

## Le composant réutilisable : tuile-classe → détail classe → élève

C'est le squelette de navigation de tout le côté prof. Le construire **générique et paramétrable** :

- **`TuileClasse`** — une classe sous forme de tuile cliquable. Contenu : le **nom de la classe** (toujours) + un **résumé injecté par l'appelant** (badges / chiffres — au dashboard : santé de la classe ; ailleurs : ce que le module veut montrer). Code couleur optionnel.
- **`DétailClasse`** — au clic, ouvre la liste des **élèves** de la classe (via les **inscriptions actives**, Lot 1). Chaque ligne élève affiche un **statut injecté par l'appelant** (au dashboard : où en est l'élève ; ailleurs : la donnée du module). **Actions optionnelles attachables** (au dashboard : retirer l'élève — Lot 2).

**Contrat :** le shell (tuile → liste d'élèves → ligne élève) est **constant** ; le **résumé de tuile** et le **statut par élève** sont des données fournies par chaque lot. Les Lots 4 à 8 réutilisent ce shell **sans le réécrire** — ils ne fournissent que leur payload.

> Élève bi-classe : il apparaît dans le `DétailClasse` de **chacune** de ses classes, avec le statut **propre à ce contexte** (sa situation HLP dans la tuile HLP, sa situation Philo dans la tuile Philo). Conséquence directe du scoping par inscription.

---

## Contenu du tableau de bord (page d'accueil prof)

Objectif : le **coup d'œil**. Trois zones.

### Zone 1 — « À faire »

Surface d'**agrégation** des choses qui demandent ton attention.

- **Disponible dès maintenant :** (a) **fragments en attente de validation** (toutes classes confondues, avec accès au détail) ; (b) **rappels d'effacement** du Lot 2 (30/06 et 30/08, conditionnels et dismissibles).
- **Extensible :** construire la zone pour qu'on puisse y **brancher de nouvelles sources sans la refondre**. Les lots ultérieurs y ajouteront leurs signaux : flashcards « à générer » (Lot 7), validations Codex (Lot 8), manques de contenu Scriptorium (Lot 6).

### Zone 2 — Santé de la cohorte

- **Top-line :** proportion d'élèves **à jour** et nombre d'élèves **en difficulté**, avec accès direct aux élèves à risque.
- **Définitions (défauts proposés, à confirmer) :** *en difficulté* = au moins un **fragment manquant**, **OU** moyenne par section sous un **seuil en lettres**, **OU** **retard de révision** important. *À jour* = aucun de ces signaux.
- **Calcul par inscription** (par contexte de classe) : un élève à risque en HLP mais à jour en Philo n'est signalé **que** côté HLP.

### Zone 3 — Tuiles de classe

Une `TuileClasse` par classe, peuplée pour le dashboard :

- **Résumé de tuile :** nom + santé de la classe (ex. nb d'élèves en difficulté, taux de dépôt de la semaine, validations en attente). Code couleur (vert / neutre / rouge) selon la santé.
- **Détail classe :** liste des élèves avec « où en est chacun » — état des **fragments** (rendus / en retard / manquants), **révision flashcards** (à jour / backlog), **notes récentes en lettres**, **essai**, **Codex**.
- **Action « effacer la classe »** (flux 2-3 étapes du Lot 2) accessible depuis la tuile / vue classe.
- **Action « retirer un élève »** (Lot 2) accessible sur la **ligne élève**.

---

## Définitions à confirmer

- **Seuils « à jour » / « en difficulté »** : lettre-plancher, taille de backlog de révision, tolérance de retard de dépôt.
- **« Contenu à uploader » dans À faire** : proposer = semaines / unités actives **sans ressource Scriptorium attachée** (branchable quand le Lot 6 sera en place).
- **Comptage cohorte** : un compteur global compte-t-il les **élèves distincts** ou les **inscriptions** ? *Reco : par inscription, cohérent avec le calcul de santé par contexte de classe.*

> **Note transversale — notation en lettres :** le dashboard affiche les notes en **lettres**. Le passage du barème aux lettres est traité au Lot 5.6 ; pour ne pas créer de couplage, lire le **champ note canonique** plutôt que de coder un format en dur — le dashboard suivra automatiquement le passage aux lettres quand il atterrira.

---

## Fait quand

- Le tableau de bord est la **page d'accueil prof** et donne le coup d'œil : ce qui est **à faire**, la **santé globale**, et **une tuile par classe**.
- Les tuiles utilisent un **composant réutilisable** (tuile → liste d'élèves → statut par élève) que les Lots 4 à 8 pourront **repeupler sans le réécrire**.
- Cliquer une tuile ouvre la liste des **élèves de la classe** avec où en est chacun (fragments, flashcards, notes en lettres, essai, Codex).
- L'**effacement de classe** (2-3 étapes, Lot 2) et le **retrait d'un élève** (Lot 2) sont accessibles depuis cette vue.
- Les **rappels d'effacement** (30/06, 30/08) et les **validations en attente** apparaissent dans « À faire ».
- La zone « À faire » **accepte de nouvelles sources sans refonte**.
- Un élève bi-classe apparaît dans les deux détails de classe avec un statut **propre à chaque contexte**.
