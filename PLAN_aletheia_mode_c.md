# PLAN D'IMPLÉMENTATION — Aletheia « Mode C » (extraits de livre dans un parcours)

> Plan d'exécution du SPEC `SPEC_aletheia_mode_c.md` (12 findings repliés, 0 bloquant). Aucun code n'est encore écrit. Ce plan traduit le §10 du SPEC en lots livrables, testables, réversibles. Source de vérité des décisions = MC1..MC5 + les arbitrages A1..A8 + les Q PO résiduelles. Mémoire : `project_aletheia_seances` / futur `project_aletheia_mode_c`.

## 0. État & pré-requis

- **SPEC** `SPEC_aletheia_mode_c.md` à la racine (non suivi, comme les autres SPEC de travail). Rien n'est implémenté.
- **Aletheia tourne EN PROD.** `aletheia_travaux` = travail élève réel, indexé `semaine_index` = **ordinal d'origine** → toute la refonte est **additive et réversible**, 0 réécriture de ligne.
- **Le repli-vers-B est l'état prod actuel** : un livre posé partiellement (tranche [3-7] d'un livre de 12) est aujourd'hui exposé EN ENTIER. Mode C corrige ce trou — mais **GATÉ** : le simple merge de C1 doit être un **no-op fonctionnel prod byte-identique** (gate OFF).
- **Frontière dure C1/C2** : seul **C1** (exposition tranche-aware) est constructible maintenant. **C2** (IA ré-ancrée sur la carte-de-parcours) est **bloqué** par le chantier Scriptorium « carte-de-parcours » qui n'existe pas encore (cf. §7 de ce plan).
- **Fondation séances déjà en prod** : `utils/aletheia-seance.ts` (contrat `SeanceOrdinal`), résolveur `utils/aletheia-dates.ts` (déjà tranche-aware via `couvre`), harnais `npm test`. Mode C les **réutilise**, ne les duplique pas.
- **Next à breaking changes** : lire `node_modules/next/dist/docs/` avant tout code (routing, server actions, `after()`).

## 1. Invariants de sûreté (sur TOUS les lots — non négociables)

1. **0 migration de données.** Aucune écriture / renommage sur `aletheia_travaux`, `scriptorium_documents`. La renumérotation 1..K est **purement d'affichage**, jamais persistée (MC2). Le 1..K se lit, ne s'écrit **jamais**.
2. **Une seule DDL, additive** : `aletheia_params.mode_c_actif boolean NOT NULL DEFAULT false` — sur la table CONFIG 1-ligne (`id=1`), **jamais** sur `aletheia_travaux`. Réversible par `DROP COLUMN`.
3. **Gate OFF = statu quo prod à l'octet.** Sous `mode_c_actif = false`, `modeExposition` renvoie **mode B whole-book pour TOUS les livres gouvernés**, y compris couverture vide (MALCONFIG) et couverture partielle. Aucune exclusion, aucun masquage, aucune renumérotation ne s'active. Le gate **folde les DEUX verdicts non-A/B** (`C` **ET** `MALCONFIG`) — sinon un livre mal configuré aujourd'hui visible disparaîtrait au merge (régression silencieuse, §4.9/§9.4 du SPEC).
4. **`git diff utils/aletheia-retours.ts` VIDE en C1.** C1 ne touche **jamais** l'IA (prompts, clé JSON `semaine`, placeholders, overrides `aletheia_params.prompt_*`, sens « ordinal de séance » des colonnes). LD7 = critère de revue **bloquant**. Le ré-ancrage IA est **entièrement C2**.
5. **`texte_extrait` / `fichier_ref` jamais servis à l'élève** sur aucun nouveau chemin (garde existante de `data.ts` répliquée).
6. **Non-régression A/B prouvable par construction** : en A/B, `exposees == sort(DISTINCT scriptorium_documents.semaine)` → `numeroAffiche(o) == o`, `dansExtrait(o) == true` → chemin de code **identique** à aujourd'hui.
7. **Fichiers neufs committés explicitement** (`git status` avant push ; `git add -u` n'ajoute pas les neufs). **On ne merge qu'à la fin**, après revue adversariale. Le flip `mode_c_actif=true` n'a **PAS** lieu dans ce chantier (bloqué sur C2).
8. **`npm test` + `tsc --noEmit` + eslint + `next build`** verts à chaque lot.

## 2. Périmètre du plan

**DANS ce chantier (constructible et mergeable maintenant, dark-launch) :**

| Lot | Objet | Effet prod |
|---|---|---|
| **C1.0** | Détection : module pur renumérotation + classifieur PUR de mode + `modeExposition` I/O (2 niveaux de gate) + colonne kill-switch + batterie de tests | NÉANT (gate off) |
| **C1.1** | Exposition tranche-aware : `livresPourClasse` filtre à l'extrait + renumérotation + types + pages planning/séance | dormant |
| **C1.2** | Gating serveur (lecture **ET** écriture) + gate capstone | dormant |

**HORS ce chantier (bloqué / différé) :**

- **C2.0** — carte-de-parcours (tables, génération IA, UI prof) = **chantier Scriptorium** que le PO prépare. Bloque C2.1/C2.2.
- **C2.1 / C2.2** — ré-ancrage IA VF + capstone mode C. Dépendent de C2.0 **et** de la décision R3 (union vs mono-parcours).
- **C-ACT** — audit R-EXPO + flip `mode_c_actif`. **Seul lot à effet prod visible**, après C2 prêt.

Ce plan **s'arrête à la frontière C2**. À la fin de C1.2 : revue adversariale → merge (gate OFF, prod inchangée). Le mode C reste **invisible en prod** jusqu'à un futur chantier C2 + flip.

## 3. Décisions verrouillées pour C1 (recommandations SPEC — inertes sous gate OFF)

Toutes ces décisions **n'ont aucun effet tant que le gate est OFF** (donc revisables avant le flip, qui est loin). On code C1 selon les recommandations du SPEC ; à **re-confirmer PO avant C-ACT** :

| Réf | Décision codée en C1 | Recommandation SPEC suivie |
|---|---|---|
| **R3 / Q3** | Extrait couvert par **≥2 parcours distincts** → `MALCONFIG` (mode C exige **un** parcours gouvernant unique) | Mono-parcours (évite un axe « parcours » dans `aletheia_travaux` = migration + rupture MC2). `gouverneParcoursId` devient déterministe. |
| **Q4 / R7** | Garde `estFullRangeExplicite` incluse dans le classifieur : un créneau `[1-N]` couvrant tout le livre courant est traité comme `(null,null)` → **B** | Incluse (défensif, sans perte : full-range = B de toute façon par égalité ensembliste ; ferme le trou de re-découpe) |
| **Q9** | Séance hors extrait accédée par URL → `notFound()` | `notFound()` (ne révèle pas l'existence de la séance) |
| **Q1** | Repli gate-fermé = mode B whole-book (non-régression) | Verrouillé par MC5 (pas rediscuté) |

Les autres Q PO (Q2 route capstone, Q5/R9 framing prompt, Q6 signal MALCONFIG, Q7 V1 mode C, Q8 affordance prof, Q10 orphelins, Q11 capture classe) concernent **C2/C-ACT** → différées, hors de ce chantier.

## 4. Séquence des lots

`C1.0 → C1.1 → C1.2`. Chaque lot est mergeable seul (gate OFF), mais on ne merge qu'après C1.2 + revue.

---

### C1.0 — Détection (module pur + classifieur pur + `modeExposition` I/O) + tests

**Objectif.** Poser la **source de vérité unique** du mode, sans toucher l'exposition. Tout reste inerte (aucun appelant en C1.0).

**Fichiers.**

- **NEW `utils/aletheia-extrait.ts`** (pur, 0 I/O, miroir d'`aletheia-seance.ts`) :
  ```ts
  numeroAffiche(exposees: SeanceOrdinal[], origine: SeanceOrdinal): number   // 3→1, 5→2 ; 0 si absent
  origineDepuisNumero(exposees: SeanceOrdinal[], p: number): SeanceOrdinal | null
  dansExtrait(exposees: SeanceOrdinal[], origine: SeanceOrdinal): boolean
  ```
- **`utils/aletheia-dates.ts`** :
  - **EXTRAIRE** `creneauxGouvernants(admin, livreId, classeId): Promise<{ parcoursId: string; debut: number|null; fin: number|null }[]>` depuis le corps de `chargerCandidats` (lignes 155-200) : charge créneaux-livre + parcours vivants + assignations ACTIVES, renvoie les créneaux **BRUTS au niveau `gouverne`** (avant le filtrage date `l.216-218`, arbitrage **A1**). `chargerCandidats` est refactoré pour **réutiliser** cette sous-fonction (mutualise la logique vivant/actif — R5).
  - **PUR** `classifierMode(S: Set<number>, direct: boolean, creneaux: {parcoursId,debut,fin}[]): { mode:'A'|'B'|'C'|'MALCONFIG'; exposees:number[]; complet:boolean; gouverneParcoursId:string|null }` — l'algorithme §4.3 **sans I/O ni gate** : branches S-vide → A neutre ; non-gouverné → A ; précédence directe → B ; couverture (union `couvre`) == S → B ; ∅ → MALCONFIG ; `estFullRangeExplicite` → B ; ⊊ + 1 parcours → C ; ⊊ + ≥2 parcours → MALCONFIG. **Testable au `npm test`.**
  - **I/O** `modeExposition(admin, livreId, classeId): Promise<{mode,exposees,complet,gouverneParcoursId}>` : charge `S` (via `seancesDocs`), `direct` (lien `scriptorium_unite_classes`), `creneauxGouvernants` → appelle `classifierMode` → applique la **couche gate mince** :
    ```ts
    const r = classifierMode(S, direct, creneaux)
    if (!mode_c_actif && (r.mode === 'C' || r.mode === 'MALCONFIG'))
      return { mode:'B', exposees:sort(S), complet:true, gouverneParcoursId:null }  // repli-B whole-book
    return r
    ```
  - **FACTORISER** `seancesDocs(admin, livreId): Promise<Set<number>>` = `DISTINCT scriptorium_documents.semaine` (aujourd'hui dupliqué data.ts:162,186) — réutilisé par `modeExposition`, `peutAccederSemaine`, `toutesSemainesDone`.
- **`app/eleve/modules/aletheia/data.ts`** : `lireReglages` lit `mode_c_actif` (ajout au `.select` + au retour). Aucun autre changement en C1.0.
- **SQL `aletheia_mode_c.sql`** (à jouer dans Supabase avant le merge) : `ALTER TABLE aletheia_params ADD COLUMN IF NOT EXISTS mode_c_actif boolean NOT NULL DEFAULT false;` — additif, idempotent, réversible.
- **NEW `utils/aletheia-extrait.test.ts`** : bijection `p ↔ o_p` ; `numero == semaine` en A/B ; `dansExtrait`.
- **`utils/aletheia-dates.test.ts`** (étendu) : matrice `classifierMode` §9.5 — {direct × parcours × couverture} → mode + `exposees` attendus ; invariant **aucun full-range → C** ; B-distribué reste B ; ≥2 parcours → MALCONFIG ; S-vide → A (≠ MALCONFIG).

**Tests.** Matrice §9.5 : couverture (entier / distribué / sous-ensemble contigu / non contigu / bornes ouvertes / hors-plage / full-range explicite) ; non-reclassement ; créneaux bruts (créneau gouvernant sans date résoluble **compté** dans la couverture).

**Effet prod.** NÉANT — aucun appelant. Colonne défaut `false`. Testable en preview par flag forcé.

**Garde-fous.** `git diff aletheia-retours.ts` vide. `classifierMode` **pur** (aucun `admin`, aucune `Promise`). Le gate fold couvre **C ET MALCONFIG**.

---

### C1.1 — Exposition tranche-aware + renumérotation

**Objectif.** Rendre `livresPourClasse` (donc toutes les pages qui consomment `livre.semaines`) restreint à l'extrait en mode C. Toujours inerte sous gate OFF.

**Fichiers.**

- **`types.ts`** : `SemaineLivre` gagne `numero: number` ; `LivreAletheia` gagne `mode: 'A'|'B'|'C'`. En A/B : `numero := semaine`.
- **`data.ts` `livresPourClasse`** (l.35) : après chargement des docs, appeler `modeExposition(admin, livreId, classeId)` — **en mutualisant** le chargement créneaux/docs avec `resoudreDatesLivre` pour ne pas doubler les requêtes parcours (R5) ; filtrer `.semaines` à `exposees` ; poser `numero = numeroAffiche(exposees, s.semaine)` sur chaque `SemaineLivre` + `mode` sur le `LivreAletheia` ; **exclure** un livre `MALCONFIG` (gaté) + `console` de journalisation ; l'affichage « K séances » lit `total = exposees.length`, **jamais** `nb_semaines` (fuiterait l'étendue réelle).
  - Distinguer strictement **S-vide** (mode A, `semaines:[]`, **affiché** comme aujourd'hui) de **MALCONFIG** (`gouverne ∧ couvertes==∅`, exclu **seulement gate ON**) — F5.
- **`app/eleve/modules/aletheia/page.tsx`** (planning) : libellés « Séance {s.numero} » et « Séance {couranteNum} t'attend » → `numero` ; `href`/`key` gardent l'**ordinal d'origine** `s.semaine` (MC2) ; compteur « {nbSemaines} séance(s) » → K.
- **`[livreId]/[semaine]/page.tsx`** : après `livreAccessible`, garde `dansExtrait(exposees, semaine)` sinon `notFound()` ; titre « Séance {semaine} » → « Séance {numeroAffiche(exposees, semaine)} ». (Le calcul `exposees` via `modeExposition` avec la classe active du contexte.)

**Tests.** Renumérotation en conditions A/B (identité). Rendu planning/séance mode C via flag forcé en preview.

**Effet prod.** Dormant (gate OFF → `modeExposition` renvoie B partout → `.semaines = sort(S)`, `numero == semaine`, aucune exclusion → **identique à prod**).

**Garde-fous.** `livreAccessible` / `semaineLivre` **INCHANGÉS** (le livre reste accessible en mode C ; la restriction est séance-level, portée en C1.2). Aucune fuite de `nb_semaines` réel.

---

### C1.2 — Gating serveur (lecture ET écriture) + gate capstone

**Objectif.** Rendre une séance **hors extrait** inaccessible en **lecture ET écriture**, même par appel direct. Fermer le trou d'écriture F7 + le footgun F9.

**Fichiers.**

- **`data.ts` `peutAccederSemaine`** (l.158) → **+ `classeId`** : calcule `exposees` via `modeExposition` ; **refuse inconditionnellement si `semaine ∉ exposees`, AVANT le `return true` anticipé l.160** (footgun **F9** — sinon fuite totale par URL en config par défaut `deblocageSequentiel=false`) ; puis déblocage séquentiel `estSemaineDebloquee(exposees, …)` (extrait, pas S).
- **`data.ts` `toutesSemainesDone`** (l.184) → **+ `classeId`** : itère `exposees` (gate capstone = K/K de l'extrait, pas N/N).
- **`data.ts` `estSemaineDebloquee`** (l.149) : **INCHANGÉE** (déjà générique ; on lui passe `exposees`).
- **`actions.ts`** : ajouter le **verrou d'appartenance** (`dansExtrait(exposees, semaine)` ou `peutAccederSemaine` tranche-aware) à **`soumettreVf` (l.149), `validerLectureRetourVf` (l.218) ET `relancerRetour` (l.247)** — **pas seulement `soumettreV1`** (correction **F7** : sans lui, un travail orphelin en `FEEDBACK1_READY` peut passer `soumettreVf` et déclencher un `genererRetourVf` ancré livre entier = **spoiler**). Ces 4 actions ont `active.classe_id` sous la main → `classeId` transmissible. Vérifier qu'**aucun autre chemin d'écriture** ne contourne le garde.
- **Propagation `classeId`** aux appelants qui gagnent le paramètre :
  - `peutAccederSemaine` → `actions.ts:85` (soumettreV1) + `[livreId]/[semaine]/page.tsx:192`.
  - `toutesSemainesDone` → `app/eleve/page.tsx:154` (dashboard : classe active du commutateur Lot 9) + `[livreId]/capstone/page.tsx:23`.
- **Gate capstone (anti-spoiler)** :
  - `[livreId]/capstone/page.tsx` : `notFound()` si `mode === 'C'` (la garde de **mode** prime sur le gate `toutesSemainesDone` — le book capstone = livre entier = spoiler en C).
  - `page.tsx` (planning, tuile capstone via `chargerCapstoneLivre` l.56) : en mode C, **ne jamais lier** `.../capstone` ; afficher un placeholder (« la carte du parcours sera bientôt disponible »). Invisible en prod tant que gate OFF.
- **HORS scope** : `app/prof/aletheia/eleve/[eleveId]/page.tsx:278` (`chargerCapstoneLivre` prof) — le prof voit **toujours** le livre entier ; mode C n'affecte que l'exposition **élève**. Inchangé.

**Tests (`npm test` + preview flag ON).** Gate : (a) `mode_c_actif=false` ⇒ tout gouverné → B whole-book ; (b) `mode_c_actif=true` + `semaine ∉ exposees` ⇒ `peutAccederSemaine=false` **même si `deblocageSequentiel=false`** (F9). Écriture (F7) : `soumettreVf`/`validerLectureRetourVf`/`relancerRetour` sur `semaine ∉ exposees` ⇒ refus serveur. Capstone : mode C ⇒ page `notFound`, tuile non liée.

**Effet prod.** Dormant (gate OFF → `∉ exposees` jamais vrai, capstone jamais en mode C). ⚠️ **NE PAS activer en prod** même après C1.2 : l'IA VF/capstone est encore livre entier (spoilerait). L'activation = C-ACT, après C2.

**Garde-fous.** Ordre de garde en `peutAccederSemaine` (refus AVANT l.160). Machine à états **invariante** (mode C n'ajoute aucun état/ligne/transition). Travaux orphelins **sûrs SOUS CONDITION** du verrou d'écriture dans les 3 actions.

---

## 5. SQL

Un seul fichier, une seule DDL additive, à jouer dans Supabase **avant le merge** (dégrade en douceur : `lireReglages` tolère la colonne absente via `!!data?.mode_c_actif = false`) :

```sql
-- aletheia_mode_c.sql
ALTER TABLE aletheia_params ADD COLUMN IF NOT EXISTS mode_c_actif boolean NOT NULL DEFAULT false;
```

Aucune autre SQL en C1. Les tables de la carte-de-parcours = C2 (Scriptorium).

## 6. Clôture C1 : revue + merge

1. `npm test` + `tsc --noEmit` + eslint + `next build` verts.
2. **Revue adversariale en profondeur** (comme le chantier séances) — maillons prioritaires : le gate folde C **ET** MALCONFIG (non-régression prod byte-identique) ; le verrou d'écriture couvre bien les 3 actions (F7) ; l'ordre de garde F9 ; `git diff aletheia-retours.ts` vide (LD7) ; aucune fuite de `nb_semaines`.
3. **Test preview flag forcé ON** sur la classe « Test » : vérifier extrait exposé, séance hors-extrait `notFound`, capstone masqué — puis **flag remis OFF**.
4. **Merge `main`** (gate OFF → prod inchangée). **Pas de flip.** Pas de partage élève.
5. Mémoire : `project_aletheia_mode_c` (C1 mergé dark, gate OFF ; C2 bloqué Scriptorium).

## 7. Frontière C2 — bloquée (rappel, hors chantier)

Ne PAS implémenter tant que le chantier Scriptorium « carte-de-parcours » n'a pas livré l'artefact. Contrat consommé (défini §7.2 du SPEC) : `chargerCarteParcours(admin, parcoursId) → { carte:CarteParcours, morceaux:MorceauParcours[], syntheses:SyntheseMorceau[] }` avec `statut:'READY'`. Dépendances de conception à trancher **avant** C2 :

- **R3 / Q3** — union multi-parcours vs mono-parcours (décision de gate C1, déjà codée mono-parcours en C1.0 ; à re-confirmer).
- **R6 / Q11** — capture de la **classe active à la soumission** (`soumettreVf` → passée à l'`after()`), car le cookie `eleve_classe` est indisponible dans le job détaché. Touche assumée au chemin d'écriture. Cas élève multi-classes / extraits divergents = MALCONFIG.
- **R9 / Q5** — framing des 4 blocs numérotés du prompt VF (position 1..K vs ordinal d'origine, **homogène**).
- **Q2** — route capstone mode C (résolue par la contrainte mono-carte de R3).

Puis **C-ACT** : audit R-EXPO (full-range explicites BLOQUANT + orphelins + normalisation `(null,null)` de l'authoring) → flip `mode_c_actif` par classe/parcours → test élève réel.

## 8. Récapitulatif fichiers touchés (C1)

| Fichier | Lot | Nature |
|---|---|---|
| `utils/aletheia-extrait.ts` | C1.0 | **NEW** pur (renumérotation) |
| `utils/aletheia-extrait.test.ts` | C1.0 | **NEW** tests |
| `utils/aletheia-dates.ts` | C1.0 | `creneauxGouvernants` (extrait) + `classifierMode` (pur) + `modeExposition` (I/O+gate) + `seancesDocs` |
| `utils/aletheia-dates.test.ts` | C1.0 | tests `classifierMode` étendus |
| `aletheia_mode_c.sql` | C1.0 | **NEW** 1 ALTER additif |
| `app/eleve/modules/aletheia/data.ts` | C1.0/1.1/1.2 | `lireReglages` (mode_c_actif) ; `livresPourClasse` (filtre+numero+mode+exclusion) ; `peutAccederSemaine(+classeId)` ; `toutesSemainesDone(+classeId)` |
| `app/eleve/modules/aletheia/types.ts` | C1.1 | `SemaineLivre.numero`, `LivreAletheia.mode` |
| `app/eleve/modules/aletheia/page.tsx` | C1.1/1.2 | libellés `numero` ; tuile capstone mode C |
| `app/eleve/modules/aletheia/[livreId]/[semaine]/page.tsx` | C1.1/1.2 | garde `dansExtrait`→notFound ; titre position ; `classeId` |
| `app/eleve/modules/aletheia/[livreId]/capstone/page.tsx` | C1.2 | `notFound` si mode C ; `classeId` |
| `app/eleve/modules/aletheia/actions.ts` | C1.2 | verrou d'appartenance sur `soumettreVf`/`validerLectureRetourVf`/`relancerRetour` |
| `app/eleve/page.tsx` | C1.2 | `toutesSemainesDone(+classeId)` (dashboard) |

**Intouchés (garde LD7 / hors scope)** : `utils/aletheia-retours.ts`, `utils/aletheia-seance.ts`, tout le prof (sauf rien), la machine à états, le résolveur de dates (datation).
