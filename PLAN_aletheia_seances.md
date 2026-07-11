# PLAN D'IMPLÉMENTATION — Aletheia « Séances »

> Plan d'exécution du SPEC `SPEC_aletheia_seances.md` (+ son addendum du 2026-07-09). Aucun code n'est encore écrit. Ce plan traduit le SPEC en lots livrables, testables, réversibles. Source de vérité des décisions = l'addendum du SPEC. Mémoire : `project_aletheia_seances`.

## 0. État & pré-requis

- **SPEC** committé sur `docs/spec-aletheia-seances` (`0821f2f`) + addendum (décisions PO). PAS mergé `main`, PAS poussé.
- **Rien n'est implémenté.** Aletheia tourne EN PROD ; `aletheia_travaux` contient du travail élève réel → toute la refonte doit être **additive et réversible**.
- **Modèle Parcours déjà en prod** (`scriptorium_parcours*`, frise `utils/frise-enseignement.ts`, snapshot `horaire_snapshot` via chantier ③) : le mode (b) le **réutilise**, ne le duplique pas.
- **Next à breaking changes** : lire `node_modules/next/dist/docs/` avant d'écrire du code (routing, server actions, etc.).

## 1. Invariants de sûreté (sur TOUS les lots — non négociables)

1. **Zéro migration de données, zéro `ALTER` destructif.** Aucune écriture sur `aletheia_travaux` / `scriptorium_documents`. Les colonnes héritées (`semaine_index`, `semaine`) gardent leur nom (LD1).
2. **`git diff utils/aletheia-retours.ts` VIDE (hors commentaire) à chaque lot.** Le renommage n'atteint JAMAIS l'IA : contenu de prompt « ## Semaine … », clé JSON `semaine` (contrat référence), placeholders `{texte_semaine}/{structure_semaines}/{total_semaines}/{semaine_courante_texte}`, overrides prof `aletheia_params.prompt_*` (LD7). C'est un critère de revue bloquant.
3. **`texte_extrait` jamais servi à l'élève** sur aucun nouveau chemin d'exposition (garde existante de `data.ts` répliquée).
4. **Prof-only d'abord, élève ensuite, exposition en dernier.** Chaque lot déployé en **preview** avant tout partage élève. Lots à effet élève (L2, L4) = **validation PO explicite**.
5. **Fichiers neufs committés explicitement** (`git status` avant push ; `git add -u` n'ajoute pas les neufs ; push = déploiement Vercel).
6. **`npm test` + `tsc` 0 + eslint + `next build`** verts à chaque lot.

## 2. Séquence verrouillée des lots

`L0 → L1 → L2 → L3 → L4 → L5`. L'ordre L2 **avant** L3 applique Q7 (« couper les dates héritées d'abord, brancher le parcours ensuite »).

---

### L0 — Contrat de terminologie (fondation invisible, risque nul)

**Objectif.** Poser le vocabulaire séance/semaine dans le code, SANS changer aucun comportement.

**Fichiers.**
- **NEW** `utils/aletheia-seance.ts` :
  - `export type SeanceOrdinal = number` — **alias simple, NON branded** (un brand nu ne compile pas sans cast partout et vide sa propre garantie — cf. §12).
  - `export function asSeance(n: number): SeanceOrdinal { return n }` — **seul point de conversion** bord DB→TS (évite le semis de `as`).
  - JSDoc : « ordinal de découpe, JAMAIS une date ; interdiction d'introduire un nouveau champ nommé `semaine` pour un ordinal ; `semaine` (nouveau code) = calendaire uniquement ».
- Typer en `SeanceOrdinal` les signatures **ordinales** existantes (sans renommer les colonnes) : `estSemaineDebloquee`, `peutAccederSemaine`, `semaineLivre`, `travauxParSemaine` (`app/eleve/modules/aletheia/data.ts`).
- **SQL optionnel (Q5)** — `aletheia_seance_comments.sql` : `COMMENT ON COLUMN` sur `aletheia_travaux.semaine_index`, `scriptorium_documents.semaine`, `aletheia_diagnostic.semaine_index`, `quazian_flashcards.semaine`, `scriptorium_parcours_creneaux.livre_semaine_debut/livre_semaine_fin`. Additif, rejouable, réversible.

**Tests / gate.** `tsc` 0, build OK, **zéro** changement runtime. **Rollback** : revert (les `COMMENT` sont inoffensifs).

---

### L1 — Renommage UI PROF-only

**Objectif.** Libellés « Séance N » côté prof ; retirer l'affichage de date héritée côté prof.

**Fichiers.**
| Site | Fichier | Changement |
|---|---|---|
| 5 | `app/prof/scriptorium/vue-livre/EnteteLivre.tsx:36` | Remplacer « · début le {date} » par **indicateur de mode** (Q6) : « — assigné en direct (sans date) ». *(le compte de parcours réel arrive en L4 ; en L1, afficher « sans date ».)* |
| — | `app/prof/scriptorium/vue-livre/*` | Libellés « Semaine N » → « Séance N » |
| 4 | `app/prof/aletheia/eleve/[eleveId]/page.tsx:140` | Neutraliser `dateIndicative` (mode a) ; libellé « Séance N » |

**Tests / gate.** Preview prof (snapshot libellés, aucune date affichée). **Rollback** : revert.

---

### L2 — Renommage UI ÉLÈVE + mode (a) sans date  ⚠️ EFFET ÉLÈVE — validation PO

**Objectif.** L'élève voit « Séance N » sans date ; un livre non gouverné par un parcours ne produit **aucune** date ni échéance (LD2).

**Fichiers.**
| Site | Fichier | Changement |
|---|---|---|
| 1 | `app/eleve/modules/aletheia/data.ts:28-36, 71, 117` | `dateIndicative` renvoie vide pour un livre non gouverné (mode a) ; libellés « Séance N » + fallback titre |
| — | `app/eleve/modules/aletheia/page.tsx` | **Inventaire COMPLET** (§12) : chips « Séance courante », compteur « N séances », « séances terminées », héros capstone « les N séances sont terminées » |
| — | `app/eleve/modules/aletheia/etapes.ts` | Libellés d'étapes mentionnant « semaine » |
| 2 | `app/prof/scriptorium/vue-livre/utils.ts:139-162` | `semaineParDefaut` : mode a → **toujours première séance** (Q9 ; retirer la dépendance à `date_debut`) |
| 3 | `utils/calendrier-evenements.ts:148-171` | Un livre non gouverné = **ZÉRO** événement (cesser de dériver de `date_debut`) |
| — | `data.ts` / `page.tsx` | **Badge discret « livre sans échéances »** (Q10) pour un livre mode a |

**Tests / gate.** Preview élève : un livre à `date_debut` existant n'affiche **plus** de date ; calendrier sans échéance Aletheia pour ce livre ; **travaux/statuts intacts**. **VALIDATION PO** (perte visible de dates prod — R1) + communication. **Ne PAS fusionner L1/L2.** **Rollback** : revert (`date_debut` conservé en base → réversible instantané).

---

### L3 — Résolveur mode (b)  ★ le cœur

**Objectif.** Un livre gouverné par un parcours assigné tire ses dates du **snapshot** (repli frise) ; les surfaces de date (page séance, fiche prof, calendrier) sortent d'**UNE** seule fonction.

**Fichiers.**
- **NEW** `utils/aletheia-dates.ts` — `resoudreDateSeance(livreId, classeId, seance): { valeur: string|null, source: 'snapshot'|'frise'|null, ambigu: boolean }` implémentant §6.4 **avec les correctifs vérifiés** :
  1. **Candidats** : créneaux `ref_type='livre'` des parcours **ACTIFS** (`scriptorium_parcours_classes.statut='active'` + `scriptorium_parcours.supprime_at is null`) assignés à `classeId`, dont la tranche `[livre_semaine_debut..livre_semaine_fin]` (ou `(null,null)`=toutes) **couvre** `seance`.
  2. **Date par candidat** (`dateSemaineParcours`) : si snapshot présent ET `entry.statut === 'definie'` ET `dateReelle` → **`addDaysUTC(dateReelle, +6)`** (source `snapshot`, lundi→dimanche) ; sinon **recompute frise** → `dateFinDimanche` (source `frise`). ⚠️ tester `'definie'` sur le snapshot, `'resolue'` uniquement sur la frise brute.
  3. **Ordre total** : source `snapshot` d'abord → `snapshot_genere_le` DESC → tranche la plus spécifique → date la plus précoce → tie-break `parcours_id`/`creneau_id`. `ambigu = (nb de dates DISTINCTES) > 1`.
  4. **`null`** si aucune couverture → séance **visible sans date** (jamais de crash).
  - **Détection de mode** : ≥1 créneau actif couvrant le livre → mode (b) ; sinon mode (a).
- **Brancher** sur les 3 surfaces via la **source unique** : `data.ts` (page séance + liste), `app/prof/aletheia/eleve/[eleveId]/page.tsx`, `utils/calendrier-evenements.ts`. **Élargir** la source des livres du calendrier (un livre mode b a `date_debut` null → aujourd'hui exclu par `.not('date_debut','is',null)` `calendrier-evenements.ts:118-122`) : re-sourcer depuis les créneaux-livre de parcours actifs assignés ; n'appeler `new Date(...)` que sur une date non nulle.
- **Perf** (R8) : mémoïser la frise par année scolaire + le résolveur par `(livre, classe)`.

**Tests de garde IMPÉRATIFS** (`npm test`) :
- **snapshot réel publié → branche snapshot renvoie une date** (anti-régression `statut === 'definie'` : sinon repli frise systématique → LD6 mort-né).
- **snapshot (lundi) + 6 == frise (dimanche)** pour la même séance (convention unique).
- Cas : séance non couverte · snapshot absent · `date_debut` null · parcours archivé · **multi-parcours** (ambigu) · créneau hors `nb_semaines` · borne pointant une séance disparue après re-découpe.

**Gate.** Preview + tests verts. **Rollback** : revert (module pur, aucune écriture DB).

---

### L4 — Exposition UNION (supersède décision 9 Parcours)  ⚠️ EFFET ÉLÈVE + AUDIT PROD

**Objectif.** Un livre référencé dans un parcours assigné actif est exposé **(livre entier — addendum A)** à la classe, même sans lien `scriptorium_unite_classes` direct.

**Fichiers.**
- `app/eleve/modules/aletheia/data.ts` (`livresPourClasse`, `livreAccessible`) + `utils/calendrier-evenements.ts` : exposition = **union** (direct ⋃ parcours), dédupliquée, **mêmes gardes** (client admin, `texte_extrait` jamais servi, `supprime_at is null`, parcours `statut='active'`).
- **Mode B = whole-book** : l'union expose **toutes** les séances du livre, pas seulement les tranches placées (addendum A). *(Mode C, extraits-only, = différé → ne pas masquer les séances hors-tranche.)*

**Audit prod OBLIGATOIRE avant activation** (R-EXPO, Q11) : lister les créneaux `ref_type='livre'` de parcours actifs assignés à ≥1 classe (posés sous la décision 9 « référencer ≠ accès ») → **confirmation explicite du prof** (ou flag par parcours) avant d'ouvrir l'accès rétroactif. **À consigner au RUNBOOK.**

**Tests / gate.** Un élève d'une classe assignée à un parcours contenant un livre y accède sans assignation directe ; `texte_extrait` non servi ; parcours archivé exclu. Audit prod + **validation PO**. **Rollback** : revert (accès **additif** — on n'enlève jamais un accès existant).

---

### L5 — Garde-fou whole-book (authoring prof)

**Objectif.** Éviter le double livre-entier confus (direct + parcours entier, même classe) — LD5.

**Fichiers.** Détection `conflitWholeBook` (livre assigné EN TOTALITÉ à la fois en direct et via un parcours, même classe) + écran d'avertissement + **choix guidé** (garder le direct si rien à ajouter ; passer par le parcours s'il ajoute des ressources). Tranche partielle → **pas** d'avertissement (coexistence légitime, LD5 ; en A/B la tranche ne limite pas l'exposition — addendum A).

**Tests / gate.** Direct + parcours entier même classe → avertissement ; tranche partielle → pas d'avertissement. Preview prof. **Rollback** : revert.

---

## 3. SQL (récapitulatif — aucun destructif)

- **L0 (optionnel)** : `aletheia_seance_comments.sql` (`COMMENT ON COLUMN`). Additif, rejouable, réversible.
- **Aucun autre SQL.** Zéro migration de données (LD1), zéro `ALTER` de type/colonne, zéro nouvelle table.

## 4. Déploiement & rollback

- Chaque lot : branche feature → **preview** → (validation PO si effet élève) → merge `main` → push (déploiement Vercel).
- Points de bascule à surveiller : **L2** (perte de dates héritées → PO) ; **L4** (ouverture d'accès rétroactive → audit prod).
- Rollback = revert de commit ; **données intactes** (rien d'écrit sur le travail élève).

## 5. Checklist de sortie (definition of done)

- [ ] `tsc` 0 / eslint / `next build` OK à chaque lot.
- [ ] `git diff utils/aletheia-retours.ts` vide (hors commentaire) — vérifié à chaque lot.
- [ ] Aucun « Semaine N » résiduel côté élève (inventaire §12).
- [ ] Tests de garde résolveur verts (`statut==='definie'`, convention dimanche, tous les cas de bord).
- [ ] `texte_extrait` jamais servi à l'élève sur le nouveau chemin d'exposition.
- [ ] Audit prod Lot 4 consigné au RUNBOOK + confirmation prof.
- [ ] Testé live prof (L1/L5) et en preview élève (L2/L3/L4) avant prod.

## 6. Risques reportés du SPEC (à garder à l'œil)

- **R1** perte de dates visible (assumé, communiqué au PO).
- **R-STATUT / R5** neutralisés dans le résolveur (tests de garde L3).
- **R-EXPO** audit prod avant L4.
- **R7** créneaux orphelins (hors `nb_semaines` / borne disparue) → remonter au diagnostic prof (mini-lot L4b possible).
- **R8** perf résolveur → mémoïsation.

## 7. Hors périmètre — Mode C (noté pour plus tard)

Chantier ultérieur : parcours **extraits-only** + logique d'exercices/retours IA dédiée. Le schéma (bornes de tranche) l'accueille déjà ; **ne rien coder ici**. Déclencheur : besoin produit explicite du PO.
