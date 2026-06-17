# SPEC — Lot 6 : Scriptorium (côté prof)

> Lot du plan global (`PLAN_Palimpseste_modifications.md`).
> **Prérequis : Lot 1 implémenté** (références classe par **ID** — c'est ce qui permet le **détachement** à l'effacement, déjà spécifié au **Lot 2**).
> Spec standard (pas d'audit-first). **Côté prof uniquement** — la tuile Scriptorium reste **masquée côté élève** (flag du Lot 0 ; ne pas le retirer).
>
> **Réutilise le primitif de tuile du Lot 3**, mais le **drill mène à une arborescence de contenu, pas à une liste d'élèves** (pas de `DétailClasse` ici).
> **Lien Quazian (Lot 7) :** Scriptorium est la **source** dont Quazian génère les flashcards **par semaine**. La notion de « semaine » ici est celle que Quazian consommera.

---

## Modèle de contenu

- **Hiérarchie** : **Unité → Semaines**. Une unité contient plusieurs semaines.
- **Item de contenu** : `{ nom, unité, semaine, classes[] }` — assignable à **plusieurs classes** (multi-assignation).
- **Corps du contenu — texte et/ou images.** Texte (collé, ou **extrait** d'un fichier téléversé). **Images** (tableaux, cartes mentales, schémas) **stockées comme fichiers**, avec une **légende / description** optionnelle. Un item peut mêler les deux. *Pour la génération de cartes (Quazian, Lot 7) : le **texte et les légendes** alimentent toujours la génération ; les **images** peuvent en plus être envoyées à un modèle **multimodal** (Claude lit l'image — utile surtout pour une carte mentale, dont il peut extraire la structure) — détail traité au Lot 7. Une image **sans** texte ni légende donne des cartes plus faibles.*
- **Références classe par ID** (principe Lot 1) → c'est ce qui rend le **détachement du Lot 2** propre : effacer une classe **vide la référence** sur les unités / semaines / contenus **sans détruire le contenu**.

---

## Landing page

- **Bouton « Ajouter du contenu »** : 3 champs — **unité / semaine**, **Nom**, **Classe** (multi-assignation) — **+ le corps du contenu**.
- En dessous, **deux perspectives** sur le même contenu : **« classes »** et **« unités »**, présentées en **tuiles** et en **onglets**. *(Tuiles et onglets recouvrent la même navigation — à confirmer si tu les veux tous deux ou un seul ; ce sont deux traversées des mêmes données, voir ci-dessous.)*

---

## Onglet « classes »

- Pour **chaque classe** → **arborescence Unité → Semaine (→ contenu)**, **filtrée** au contenu assigné à cette classe.
- Les classes réutilisent le **primitif de tuile** du Lot 3 (même langage visuel) ; le clic **déroule l'arborescence de contenu**, **pas** la liste d'élèves.

## Onglet « unités »

- Pour **chaque unité** → **arborescence des Classes** qu'elle atteint (→ semaines / contenu). C'est l'**inversion** de l'onglet « classes ».
- Introduit une **tuile « unité »** (nouveau type de tuile, sur le même primitif).

---

## Gestion du contenu (CRUD léger)

- **Ajouter** (explicite, ci-dessus) + **éditer** / **supprimer** un contenu + **modifier l'assignation de classes** (la multi-assignation peut changer).
- **Création à la volée** des unités / semaines au moment d'ajouter du contenu. *Reco : oui (la structure grandit au fil de l'ajout).*
- Rappel : le **détachement à l'effacement de classe** est géré au **Lot 2** — le contenu **survit**, seule la référence à la classe effacée disparaît.

---

## À confirmer

1. **Légendes des images** — imposer une légende / description par image (fiable pour Quazian et utile à l'affichage) ou la laisser optionnelle ? *Reco : optionnelle mais fortement encouragée — pour un **tableau**, la légende / les métadonnées portent l'essentiel des cartes factuelles ; une **carte mentale** se prête bien à la lecture visuelle directe.*
2. **Tuiles vs onglets** — les deux entrées « classes / unités » sont-elles redondantes (même nav) ou distinctes ? *Reco : une seule navigation, peu importe la forme.*
3. **Notion de « semaine » — TRANCHÉ : une seule notion across the board.** Scriptorium, Fragments et Quazian partagent le **même** calendrier de semaines (« semaine N »). À implémenter comme telle, **pas** deux systèmes parallèles.

---

## Fait quand

- On **ajoute un contenu en 3 champs (+ corps : texte et/ou images)** et on l'**assigne à plusieurs classes**.
- L'**arborescence** est consultable **côté classe** (Unité → Semaine, filtré à la classe) **comme côté unité** (les classes que l'unité atteint).
- Les **références classe sont par ID** → l'effacement de classe (Lot 2) **détache** le contenu **sans le détruire** ; une classe homonyme l'année suivante n'hérite de rien.
- Les tuiles **réutilisent le primitif du Lot 3** (drill vers l'arborescence de contenu, pas vers les élèves) ; **Scriptorium reste masqué côté élève**.
