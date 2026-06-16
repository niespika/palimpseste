# Spécifications — Module Scriptorium (couche de contenu partagée)

> *Palimpseste. Module de contenu, en amont de Quazian et des futurs modules.*
> **Avant l'implémentation, lire `ARCHITECTURE.md`.** Réutiliser l'auth, la pile, et le pipeline d'extraction de texte déjà présent dans les Fragments. Aligner les conventions de nommage et de tables.

---

## 1. Raison d'être

Le contenu de cours du professeur — ses **cours** déposés au fil des semaines et les **textes-sources** qu'il compte utiliser (extraits philosophiques, textes à expliquer), ainsi que **images et autres documents** — n'appartient à aucun module pédagogique en particulier. C'est un **substrat partagé** que plusieurs modules consomment :

- **Quazian** y puise pour extraire des flashcards et générer des quizz.
- Le futur module « textes à écrire / analyse de texte » y puisera ses textes-sources.
- Tout module ultérieur lit ce contenu sans dépendre d'un autre module pédagogique.

Un seul module **stocke et extrait**, les autres **lisent**. C'est la seule responsabilité du Scriptorium ; il ne fabrique ni cartes, ni quizz, ni analyses.

---

## 2. Organisation flexible par unités

Chaque prof a sa propre organisation, mais le plancher commun est temporel : « cette semaine, on fait ça ». Le modèle retenu :

- Le contenu est rangé dans des **unités** (conteneurs). Par défaut une unité = une semaine, mais le **label est renommable** (« Semaine 3 », « Séquence : la violence », « Chapitre II »…) et les unités sont **ordonnables**.
- Dans une unité, le prof dépose autant de documents qu'il veut, de **types variés** : `cours`, `texte_source`, `image`, `autre`.
- Le prof crée, renomme, réordonne ses unités librement. Souplesse maximale, sans imposer de structure rigide.

---

## 3. Responsabilités

Le Scriptorium, et lui seul :

1. Gère les **unités** (création, renommage, ordre).
2. Reçoit les dépôts du prof (PDF, .docx, .odt, texte, image) dans une unité.
3. Distingue les types : `cours`, `texte_source`, `image`, `autre`.
4. Extrait le texte des documents textuels (réutiliser le pipeline des Fragments).
5. **Expose** unités, documents, texte extrait et métadonnées aux modules consommateurs, en **lecture seule**.

Hors périmètre : aucune logique pédagogique. Espace prof par défaut ; ce sont les modules consommateurs qui décident ce qu'ils exposent aux élèves.

---

## 4. Modèle de données (proposition à réconcilier avec `ARCHITECTURE.md`)

Préfixe proposé : `scriptorium_`.

| Table | Rôle | Champs clés |
|---|---|---|
| `scriptorium_unites` | Conteneur (semaine par défaut, renommable) | `id`, `classe_id`, `ordre`, `label`, `created_at` |
| `scriptorium_documents` | Document déposé dans une unité | `id`, `unite_id`, `type` (`cours`/`texte_source`/`image`/`autre`), `titre`, `auteur` (nullable), `fichier_ref`, `texte_extrait` (nullable pour images/autres), `concept_tags` (nullable), `created_by`, `created_at` |

---

## 5. Contrat de lecture (ce que consomment les autres modules)

Exposer une lecture stable :

- lister les **unités** d'une classe, dans l'ordre ;
- lister les documents d'une unité (filtrables par `type`) ;
- récupérer le `texte_extrait` et les métadonnées d'un document ;
- récupérer le **périmètre conceptuel cumulé jusqu'à une unité donnée** (par `ordre`) — utile à Quazian pour borner la génération de quizz « sur les concepts vus jusqu'à présent ».

Point d'entrée unique : les modules consommateurs ne touchent jamais aux fichiers bruts directement.

---

## 6. Découpage en étapes

1. **Étape 1** — Unités (CRUD, ordre, renommage) + dépôt de documents typés + extraction de texte.
2. **Étape 2** — Contrat de lecture exposé aux modules + tag conceptuel (semi-automatique via IA, validé par le prof).

---

## 7. Critères d'acceptation

- [ ] Le prof crée, renomme et réordonne des unités ; le label par défaut est « Semaine N ».
- [ ] Une unité accueille plusieurs documents de types `cours`/`texte_source`/`image`/`autre`.
- [ ] Le texte est extrait et stocké de façon fiable (mêmes formats que les Fragments).
- [ ] Un contrat de lecture en lecture seule expose unités, documents, texte et périmètre conceptuel cumulé ; aucun module n'accède aux fichiers bruts directement.
- [ ] Le module ne contient **aucune** logique de cartes, quizz ou analyse.
