# SPEC — Lot 4 : Modules (gestion des accès)

> Lot du plan global (`PLAN_Palimpseste_modifications.md`).
> **Prérequis : Lot 1 implémenté** (modèle d'accès classe → module + accès effectif **dérivé** pour les élèves). Ce lot est essentiellement l'**UI de gestion** par-dessus ce modèle.
> Spec standard (pas d'audit-first).
>
> **Premier consommateur du composant du Lot 3.** Réutiliser le **primitif de tuile**, pas le réécrire.

---

## Réutilisation du Lot 3 (précise)

- **Réutilisé :** le **primitif de tuile** (carte cliquable : nom + badge de statut + résumé injecté) et le **motif d'interaction** tuile → liste au clic. La tuile-module doit partager ce primitif et le **même langage visuel** que les tuiles de classe. Si le Lot 3 a construit la tuile assez génériquement, l'instancier ; sinon, **extraire le shell générique** maintenant.
- **PAS réutilisé :** `DétailClasse` (la liste d'élèves). Ici le second niveau est une **liste de classes**, pas d'élèves — ne pas forcer ce composant.

---

## Modèle d'accès (posé au Lot 1 — ce lot le pilote)

**Deux gâchettes orthogonales :**
- **Module actif / fermé** — interrupteur au niveau du **module**.
- **Accès de classe** — quelles **classes** sont autorisées sur ce module.

**Accès effectif d'un élève** = le module est **actif** **ET** l'élève appartient à **au moins une classe autorisée**. La règle d'**union** pour les élèves bi-classes est **dérivée** (Lot 1) : on ne gère **jamais** l'accès par élève.

---

## Ce que le lot doit livrer

### 1. Tuiles de module (niveau supérieur)

- Une tuile par module. Contenu : **nom du module** + badge **actif / fermé** + **résumé** (proposé : **nombre de classes ayant accès**). **Ne pas** lister les élèves.
- Basculer **actif / fermé** depuis la tuile (ou le détail).
- Tuile **cliquable** → détail du module.

### 2. Détail module — classes avec accès

- Au clic : **liste** (ou tuiles compactes) des **classes** ayant accès à ce module.
- **Accorder l'accès** : ajouter une classe via **menu déroulant** des classes existantes (principe transversal Lot 1 — **jamais** en tapant un nom).
- **Retirer l'accès** : retirer une classe de la liste.
- Granularité **classe uniquement** : pas de drill vers les élèves, **aucune** gestion par élève (exclu explicitement).

### 3. Accès bi-classe — dérivé, non éditable ici *(garde-fou)*

- Un élève en 2 classes obtient l'**union** des accès. C'est la logique dérivée du Lot 1 : ce lot **s'appuie dessus**, ne la ré-implémente pas, et **n'expose aucun réglage d'accès par élève**.

---

## À confirmer

- **Actif / fermé : global au module, ou par classe ?** Défaut retenu = **global au module** (conforme à ta liste). Fermer un module pour **une seule** classe serait une variante à ajouter — dis-le si tu la veux.
- **Articulation avec le masquage Scriptorium du Lot 0.** Le Lot 0 a masqué la tuile Scriptorium côté élève via un **simple flag**, indépendamment de l'accès. Les deux gâchettes **coexistent** : un élève voit un module s'il est **actif** **ET** une de ses classes y a accès **ET** (pour Scriptorium) le flag du Lot 0 est levé. **Ne pas retirer le flag du Lot 0** en pensant que ce lot le remplace.

---

## Fait quand

- Les modules s'affichent en **tuiles** (nom + actif/fermé + nb de classes avec accès), **sans** liste d'élèves, dans le **même langage visuel** que les tuiles de classe.
- On bascule un module **actif / fermé**.
- Cliquer une tuile montre les **classes ayant accès** ; on **accorde** (déroulant) et **retire** l'accès **par classe**.
- **Aucune** gestion d'accès par élève n'est exposée ; l'accès bi-classe (union) découle automatiquement du Lot 1.
