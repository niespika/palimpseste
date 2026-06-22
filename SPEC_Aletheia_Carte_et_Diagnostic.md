# SPEC — Aletheia : carte d'architecture & diagnostic prof (modifications)

> Spec **ciblée** : uniquement les modifications de cette passe. Le reste d'Aletheia (5 champs, retours V1/VF, vocab → Quazian, onglet Classe, gate de validation de lecture…) est **déjà implémenté** — ne pas y retoucher.
> Conventions transverses (flexibilité, réutilisation de l'existant, tests à chaque étape) : voir `PLAN_Aletheia.md`.

---

## 1. Carte d'architecture du livre — génération à la préparation + édition

**Changement de déclencheur.** La carte d'architecture du livre est désormais générée **par le prof à la préparation**, non plus par le premier élève qui termine. Le clic sur **« Ajouter un livre »** dans Scriptorium déclenche — **immédiatement ou en léger différé / asynchrone**, une fois les PDF déposés et le texte extrait — l'appel IA de génération.

**Deux artefacts canoniques en une extraction.** Ce même moment produit, à partir du **livre entier**, deux artefacts mis en cache au niveau du livre (`scriptorium_livre_id`) :
- **(a)** la **carte d'architecture** ;
- **(b)** la **référence par chapitre** (thèse canonique + arguments clés), socle stable du diagnostic (§2).

**Statut.** Prévoir un état *génération en cours / prête* (le prof n'est pas bloqué pendant le calcul).

**Affichage.** La carte s'affiche **à la fin du menu d'organisation du livre** dans Scriptorium (sous les semaines), côté prof. Elle reste montrée **à l'élève en fin de lecture** (inchangé) — c'est la **même** carte, partagée.

**Édition par le prof — NOUVEAU.** La carte peut être :
- **régénérée par l'IA** (bouton « régénérer ») ;
- **amendée manuellement** par le prof (édition directe du contenu).

Le prof vérifie donc la carte avant les élèves et la corrige au choix — en relançant l'IA, ou en la modifiant lui-même.
*Garde-fou data (cf. §3) : marquer une carte amendée à la main pour qu'une régénération IA ne l'écrase pas silencieusement (confirmation, ou conservation de la version amendée).*

**Caractère canonique (inchangé).** Le prompt `ALETHEIA_CAPSTONE` ne prend **pas** le parcours d'un élève : il génère depuis le **livre entier** + la **structure semaines/chapitres**. Carte **courte** (≤ ~300 mots), tous les liens aval révélés. À distinguer de la bulle « Architecture de ce que tu as lu » du retour VF (progressive, par élève).

---

## 2. Diagnostic de compréhension — côté prof

Objectif : un signal **diagnostique**, **prof seulement**, pour situer la compréhension de l'élève et **calibrer le retour afin de maximiser l'apprentissage**. **Ce n'est pas une note ; jamais montré à l'élève.**

**Deux axes**, sur la base de la **V1** : **Saisie de la thèse** et **Restitution des arguments** (les garder séparés est diagnostique : capter la thèse mais rater les arguments, ou l'inverse, ne dit pas la même chose). Échelle **E→A** calquée sur l'échelle compétences (E *Absent* → A *Acquis*), avec descripteurs d'ancrage.

**Calcul en deux temps (anti-halo), modèle froid :**
- **Phase 1 — inventaire**, sans juger, ancré sur le texte : la thèse donnée par l'élève ; lesquels des arguments **réels** de l'auteur il capte / rate / déforme. **Lire à travers la prose** — juger l'idée saisie, pas la qualité d'écriture (ne pas pénaliser une compréhension réelle mal exprimée, vu la faible maîtrise de langue).
- **Phase 2 — niveau E→A** à partir de **l'inventaire seul**, comparé à la **référence par chapitre** (§1b), **sans relire la prose** (l'éloquence ne contamine pas le score).

**V1 + delta V1→VF :**
- **Niveau sur la V1** = compréhension *avant* aide (après dépôt de la V1).
- **Delta V1→VF** = *réponse au feedback* (après la vf) : C→A avec un seul coup de pouce = compréhension latente ; D→D = écart plus profond.

**Asynchrone.** Côté prof, non temps-réel → appel froid **en batch**, sans impact sur l'expérience élève.

**Usage — calibration du retour.** Le niveau **pilote l'adaptativité** (« légère sans plafond ») : E/D → retour centré sur la compréhension de base, plus d'étayage, plus simple ; B/A → questions plus fines. Boucle : **diagnostiquer la prise → calibrer le retour → rediagnostiquer** au chapitre suivant.

**Affichage.** Dans l'onglet **Classe** (existant), par élève : la **trajectoire** des niveaux sur les chapitres (la **tendance prime** sur le point isolé) + le détail par chapitre (niveau V1, delta).

**Garde-fous.**
- Échantillon mince (1 chapitre × 1 axe = faible fiabilité) → **trajectoire** comme lecture première, niveaux par chapitre **provisoires**.
- Axe *thèse* **bruité** pour les chapitres non argumentatifs (Nietzsche) → signaler « thèse mal définie » plutôt qu'inventer un niveau ; l'axe *arguments* est plus robuste.
- Échelle E→A qui **ressemble à une note** → langage strictement **diagnostique**, **jamais sommatif**, **jamais exposé à l'élève**.

---

## 3. Notes modèle de données (deltas, à réconcilier avec `ARCHITECTURE.md`)

- **Niveau livre** (`scriptorium_livre_id`), générés à la création, avec statut *en cours / prêt* :
  - `aletheia_capstone` : carte d'architecture en **contenu éditable** + flag **`amende_par_prof`** (anti-écrasement, §1) + `created_at` / `updated_at`. **Une ligne par livre**, partagée.
  - **référence par chapitre** (thèse canonique + arguments clés) : table / sous-structure dédiée au niveau du livre.
- **Diagnostic** (§2) : par travail (`aletheia_travaux`), stocker l'**inventaire** (json) + les **niveaux par axe** pour V1 et VF (→ delta). **Prof-only.**

---

*Flexibilité & tests : voir `PLAN_Aletheia.md`. Ce document décrit l'intention ; cale l'implémentation sur l'existant et signale les écarts.*
