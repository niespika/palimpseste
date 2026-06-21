# SPEC — Lot 11 : Quazian élève

> Lot du plan global (`PLAN_Palimpseste_modifications.md`).
> **Prérequis : Lot 1.** Spec standard. *(Les bugs cloze / compteur sont déjà traités au **Lot 0**.)*
> Cohérent avec le **contexte de classe** du Lot 9.

---

## Deux modes distincts

- **Mode « consultation »** : parcourir **toutes les cartes** avec leurs **réponses**, **sans impact** sur la révision.
  - L'élève voit **combien** de cartes ont été **ajoutées** (quand le prof en génère, Lot 7.1) et **lesquelles** (cartes marquées « nouvelles »).
- **Mode « travail / révision »** : la **session de répétition espacée** (élicitation bayésienne / Brier **existante**), avec les **correctifs du Lot 0** (cloze masqué, compteur correct).
- L'élève **bascule** entre les deux.

## Portée des cartes

- L'élève voit les cartes **dont le contenu source est assigné à sa / ses classe(s)** (dérivation du Lot 7.1).
- **À confirmer :** pour un élève **bi-classe**, révision **scopée au contexte de classe courant** (cohérent Lot 9) **ou** **unifiée** (toutes les cartes dues, toutes classes) ? *Reco : aligner sur le contexte de classe du Lot 9 ; à confirmer en même temps que le commutateur.*

---

## Fait quand

- L'élève **bascule** entre **consultation** (toutes les cartes + réponses, ajouts récents repérables) et **révision** (session Brier, correctifs Lot 0 appliqués).
- Les cartes affichées respectent la **portée par classe**.
