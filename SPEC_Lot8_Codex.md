# SPEC — Lot 8 : Codex (ex-Synthèse)

> Lot du plan global (`PLAN_Palimpseste_modifications.md`).
> **Prérequis : Lot 1.** **Soft :** Lot 6 (les retours IA de Codex sont **ancrés dans Scriptorium**). Spec standard.
>
> **Réutilise le primitif de tuile + `DétailClasse` du Lot 3**, avec un **niveau intermédiaire « séances »**.
> Terminologie : module = **Codex** ; unité de travail = **séance de synthèse** (V1 → V-Finale, validée par le prof).

---

## Navigation (réorganisation principale)

- **Tuile classe** *(primitif Lot 3)*, résumé = **nombre de séances de synthèse**.
- Clic → **page classe** : **liste des séances de synthèse**.
- Clic sur une séance → **liste des élèves** de la classe *(façon `DétailClasse`)* avec, par élève : **nom, V1, V-Finale, validation** (existant) — **V1 et V-Finale cliquables** pour voir les **retours IA** correspondants.

## Accès aux retours V1

- Le prof doit pouvoir **ouvrir les retours IA de la V1** (pas seulement la VF) → **V1 cliquable**.

## Onglet « paramètres » (nouveau)

- **Prompt du retour IA en V1** et **prompt du retour IA en V-Finale**. **Visibles** (éditables si tu veux).
- *Forward-compat (low-regret) : si Codex doit plus tard **alimenter le profil de compétences** (agrégation, cf. note du Lot 5), ses prompts devraient **importer la rubrique partagée** (axes + échelle E-A) pour produire un signal commensurable. À garder en tête, **non bloquant**.*

## Onglet « validation »

- **Penche vers suppression** : redondant avec la **VF cliquable** des lignes par élève. La validation se fait **en contexte** (dans la séance) ; les validations **en attente** remontent dans le **« À faire » du tableau de bord prof** (Lot 3, source extensible). **À confirmer après tes tests Codex.**

---

## À confirmer

1. **Suppression de l'onglet validation** — oui une fois la nav par séance en place ? *Reco : oui (après tes tests).*
2. **Prompts** — visibles seulement ou éditables ? *Reco : éditables.*
3. **Rubrique partagée pour Codex** — brancher Codex sur les axes maintenant ou au lot d'agrégation ? *Reco : au lot d'agrégation, mais structurer les prompts pour pouvoir l'importer.*

## Fait quand

- Navigation **classe → séances → élèves** ; par élève **V1 / VF / validation**, **V1 et VF cliquables → retours IA**.
- Le prof **accède aux retours V1**.
- Paramètres exposent **prompt V1 + prompt VF**.
- Onglet validation **supprimé** (après confirmation) ; validations en attente visibles dans le « À faire » du dashboard prof.
