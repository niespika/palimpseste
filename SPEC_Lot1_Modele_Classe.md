# SPEC — Lot 1 : Modèle de données « classe » (fondation)

> Lot **fondateur** du plan global (`PLAN_Palimpseste_modifications.md`). Il conditionne presque tout le côté prof structurel (modules, fragments, Scriptorium, Quazian, Codex) et le cycle de vie du Lot 2.
>
> **⚠️ Ce lot se déroule en DEUX phases avec un ARRÊT obligatoire entre les deux.**
> - **Phase A — Audit.** Lire le modèle existant, rapporter l'état des lieux + un plan de migration. **Ne modifier aucun fichier.** Puis **s'arrêter** et attendre la validation.
> - **Phase B — Implémentation.** Seulement après feu vert explicite.
>
> Ne jamais écrire de changement de schéma avant que la Phase A soit validée.

---

## Cible — le modèle qu'on vise

(C'est le nord. La Phase A doit mesurer **l'écart** entre l'existant et cette cible, pas l'appliquer aveuglément.)

- **Classe** — entité avec un **identifiant stable** (jamais le nom comme clé). Attributs : nom, niveau (1ère / Terminale), filière (HLP, Philo tronc commun, …), année / cohorte, statut (active / fermée). Créée en début d'année (fin août). **Deux classes de même nom mais d'années différentes = deux entités distinctes.**
- **Élève** — **une identité unique** (un compte). Un élève = un seul enregistrement, même s'il suit plusieurs classes.
- **Inscription (Élève ↔ Classe)** — relation **plusieurs-à-plusieurs** via une table d'inscription. Un élève peut avoir N inscriptions (ex. HLP **et** Philo tronc commun). L'inscription porte un statut (active / retirée) → support du retrait d'élève (Lot 2).
- **Travail scopé par inscription (élève × classe)** — fragments, essais et stats sont rattachés à l'**inscription**, pas à l'élève seul. Un élève en 2 classes → **2 jeux de fragments distincts**. Idem pour les autres productions élève (résultats de quizz, révisions de flashcards, séances Codex).
- **Accès aux modules = au niveau de la classe** — relation Classe ↔ Module. L'accès **effectif** d'un élève est **dérivé** : élève → ses classes (inscriptions) → modules de ces classes (**union**). On ne stocke **pas** l'accès par élève.
- **Référence « classe » partout par identifiant** — Scriptorium (docs / unités / semaines), fragments, quizz, flashcards (via unités / semaines), séances Codex référencent la classe par son **ID**, jamais par une chaîne de nom dupliquée. C'est ce qui rendra l'effacement / nettoyage du Lot 2 **propre**.

---

## Phase A — Audit (rapporter, sans rien modifier)

Inventorier le code et les données existants, puis **rendre un rapport** couvrant :

1. **Représentation de la classe** — entité avec ID stable, ou simple chaîne de nom ? Où la valeur « classe » est-elle stockée et/ou dupliquée ?
2. **Lien élève ↔ classe** — un élève peut-il déjà appartenir à plusieurs classes ? Relation un-à-plusieurs ou plusieurs-à-plusieurs ? Existe-t-il déjà une table d'inscription ?
3. **Scoping du travail** — fragments / essais / stats sont-ils aujourd'hui clés par élève seul, par (élève × classe), ou par classe ? Même question pour résultats de quizz, révisions de flashcards, séances Codex.
4. **Accès aux modules** — stocké par élève ou par classe aujourd'hui ?
5. **Localisation de l'identifiant de classe** — où apparaît-il à travers le code (Scriptorium, Fragments, Quazian, Codex) ? Par ID ou par nom ?
6. **Données de test existantes** — qu'y a-t-il en base ? (Voir décision « migration vs table rase » ci-dessous.)
7. **Quizz invisible (Lot 0.3)** — *si* le diagnostic du Lot 0 a renvoyé ce bug ici : où se rompt le lien élève ↔ classe ↔ quizz ?

**Puis STOP.** Présenter :
- (a) l'état actuel,
- (b) l'écart avec la cible,
- (c) un **plan de migration** : changements de schéma, migration *ou* remise à zéro des données de test, points de code à toucher, ordre des opérations,
- (d) une réponse aux **décisions à trancher** ci-dessous.

Attendre le feu vert avant la Phase B.

---

## Décisions que l'audit doit faire remonter

- **Identité de classe à travers les années** — ID stable + année / cohorte ? C'est ce qui distingue une classe d'une autre portant le **même nom une autre année**, et ce qui permet à une classe de **durer plusieurs années** (HLP sur 1ère + Terminale) tout en restant une seule entité.
- **Migration vs table rase** — migrer les données de test existantes, ou repartir propre ? (Souvent plus simple pour du test, mais c'est ton appel.)
- **Retrait d'élève (anticipation Lot 2)** — supprimer un élève d'une classe doit-il aussi purger son travail scopé sur cette classe (parité vie privée avec l'effacement de classe), ou seulement le retirer du roster actif ? *Décision finale au Lot 2*, mais le modèle doit rendre **les deux possibles** → le travail doit être identifiable par inscription.
- **Élève bi-classe — navigation** — confirmer : **un compte, deux inscriptions**. La façon dont l'élève bascule entre ses contextes (HLP / Philo) côté élève sera traitée aux lots élève (9 / 10), mais le modèle doit la **permettre dès maintenant**.

---

## Phase B — Implémentation (après feu vert)

- Mettre en place / migrer vers le modèle cible (entité Classe à ID stable, table d'inscription plusieurs-à-plusieurs, statut d'inscription).
- Rattacher le travail (fragments, essais, stats, et les autres productions élève) à l'**inscription (élève × classe)**.
- Câbler l'**accès effectif dérivé** : élève → classes → modules (union), sans stockage d'accès par élève.
- Remplacer les références de classe **par nom** par des références **par ID** là où c'est nécessaire (prérequis du nettoyage Lot 2).
- *Si concerné :* corriger le lien élève ↔ classe ↔ quizz qui causait le quizz invisible (Lot 0.3).

---

## Fait quand

- Un élève-test inscrit dans 2 classes (ex. HLP + Philo tronc commun) montre **2 flux de fragments indépendants** ; un fragment créé dans l'un n'apparaît pas dans l'autre.
- Assigner un module à une classe le rend visible **exactement** aux élèves de cette classe ; l'élève bi-classe voit **l'union** des accès de ses deux classes.
- Une classe est identifiée par un **ID stable** : deux classes de même nom (années différentes) sont **distinctes** et effaçables **indépendamment**.
- *(Si concerné)* un élève membre d'une classe assignée à un quizz lancé **voit** ce quizz.
