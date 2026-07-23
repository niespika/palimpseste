# SPEC - Aletheia Mode C : extraits de livre dans un parcours

> Document de conception, aucun code applicatif. DDL/algorithmes/contrats specifies pour validation PO. L implementation lira node_modules/next/dist/docs/ (Next a breaking changes) avant tout code.

## Changelog - durcissement adversarial

SPEC produit par workflow : 4 concepteurs -> synthese -> 3 contre-epreuves -> durcissement par groupes. Contre-epreuves : 12 findings (0 bloquants, 8 majeurs, 4 mineurs), replies dans ce SPEC.

Decisions PO verrouillees : MC1 detection par couverture ; MC2 renumerotation 1..K (ordinal DB inchange) ; MC3 ancrage IA = carte-de-parcours (futur Scriptorium) ; MC4 C1 detaillee + C2 en contrat/dependance ; MC5 mode C gate tant que C2 absent.

---

## 1. Contexte & objectif

### 1.1 Aletheia et la taxonomie des 3 modes (fondation livrée en prod)

Aletheia = lecture guidée d'un livre découpé en SÉANCES. La découpe = lignes `scriptorium_documents` indexées par la colonne `semaine` (int, ordinal de séance 1..N décorrélé du calendrier ; renommée « séance » à l'UI mais colonne DB conservée — `utils/aletheia-seance.ts`, invariant **LD7**). Le travail élève PROD vit dans `aletheia_travaux(eleve_id, scriptorium_livre_id, semaine_index, statut)`, contrainte UNIQUE sur `(eleve_id, scriptorium_livre_id, semaine_index)`. Machine à états PAR SÉANCE : `DRAFT → V1_SUBMITTED → FEEDBACK1_READY → VF_SUBMITTED → FEEDBACK2_READY → DONE`. Capstone (`aletheia_capstone`, carte du livre) débloqué quand TOUTES les séances DONE.

Le chantier « semaines → séances », mergé + poussé en prod, a établi le modèle à 3 modes, calculé PAR COUPLE (livre × classe) :

| Mode | Définition | Exposition élève | IA |
|---|---|---|---|
| **A** | Livre seul, hors parcours (assigné en direct `scriptorium_unite_classes`) | Livre ENTIER, sans échéances (`gouverne=false`) | Existante |
| **B** | Livre ENTIER dans un parcours (dates pilotées par frise/snapshot) — inclut le **B-distribué** (plusieurs créneaux dont l'union couvre tout) | Livre ENTIER, daté | Existante |
| **C** | EXTRAITS (sous-ensemble de séances) d'un livre dans un parcours | SEULEMENT les séances de l'extrait | **DIFFÉRENTE** — objet de ce SPEC |

### 1.2 Le repli-vers-B actuel (le trou fonctionnel que C corrige)

Mode C n'existe pas aujourd'hui. L'exposition (`livresPourClasse`, `app/eleve/modules/aletheia/data.ts:6`) et la gouvernance (`livresGouvernesPourClasses`, `utils/aletheia-dates.ts:287`) renvoient un livre dès qu'il possède UN créneau-livre dans un parcours vivant (`scriptorium_parcours.supprime_at IS NULL`) assigné actif (`scriptorium_parcours_classes.statut='active'`), **sans jamais regarder l'étendue de la tranche** (`livre_semaine_debut/livre_semaine_fin`). `livresPourClasse` charge alors TOUTES les séances des `scriptorium_documents` (aucun filtre sur `semaine`) et les met dans `.semaines`.

Conséquence prouvée : un livre posé PARTIELLEMENT (tranche [3-7] d'un livre de 12) **RETOMBE en mode B** — livre entier exposé, retours IA (VF amont/aval, capstone) ancrés sur le livre entier. Ce comportement est cohérent et **non-régressif tant que mode C n'est pas activé** : c'est le **repli sûr par défaut** (§8, §9). Ce repli est aussi la cible de non-régression byte-identique : gate fermé ⇒ statu quo prod (arbitrage **A3**).

### 1.3 Objectif

Rendre l'exposition et l'IA TRANCHE-AWARE pour un couple (livre, classe) posé exclusivement en extraits : n'exposer QUE les séances de l'extrait, renumérotées 1..K à l'affichage (mini-livre), avec une IA ré-ancrée sur une carte-de-parcours (artefact Scriptorium futur) au lieu de l'amont/aval du livre entier. Le tout **additif, 0 migration de données**, sans reclasser un livre entier (A/B) en C **hors du cas de re-découpe documenté en §1.6**, et **GATÉ** tant que l'IA de parcours (C2) n'est pas livrée.

Document de conception : AUCUN code (DDL / algorithmes / contrats seulement). L'implémentation future lira `node_modules/next/dist/docs/` (Next à breaking changes) avant tout code.

### 1.4 Split C1 / C2 (structurant — MC4)

- **C1 — Exposition** : détection du mode par couverture, filtrage des séances exposées, renumérotation 1..K, gating séance-level (lecture ET écriture), machine à états, gate capstone (sous-ensemble extrait). **Spécifié à fond ici. Constructible maintenant** à partir des tables existantes, sans DDL applicative hors kill-switch (§8), mais **GATÉ** (invisible élève tant que C2 absent — MC5).
- **C2 — Contrat IA** : ré-ancrage des retours d'un extrait sur la **carte-de-parcours + synthèses par morceaux** (artefact FUTUR du chantier Scriptorium). Ce SPEC DÉFINIT PRÉCISÉMENT le contrat consommé et le point de bascule d'ancrage, **sans concevoir la carte-de-parcours** (pour ne pas préempter ce chantier).

Le gate (MC5, §8) doit couvrir **deux** reclassements, pas un seul : (a) `mode=='C' → 'B'` et (b) le traitement dégénéré **MALCONFIG** (couverture vide). Sous gate OFF, l'un comme l'autre retombent sur le repli-B whole-book actuel — sinon un simple merge de C1 masquerait en prod des livres mal configurés aujourd'hui visibles (régression silencieuse ; cf. §1.6, corrigé §8/§9).

### 1.5 Faits vérifiés dans le code (ancrage, non supposé)

- `couvre(c, seance)` (`aletheia-dates.ts:59`) : test pur d'appartenance séance→tranche, bornes null = illimitée. `CandidatCreneau` (l.46) porte `debut/fin`.
- `chargerCandidats` (l.152, privé) calcule `gouverne` (l.199) sur les créneaux **BRUTS AVANT tout filtrage date**, PUIS construit `candidats` en écartant les créneaux sans date résoluble (`if (!ap) continue`, l.216-217). `resoudreDatesLivre`/`resoudreDateSeance` réutilisent `chargerCandidats`. **La détection de couverture doit donc lire les créneaux BRUTS (niveau `gouverne`), PAS `candidats`** (arbitrage **A1**, cf. §4) : un créneau qui gouverne l'exposition mais n'a pas encore de date sous-compterait la couverture et ferait basculer un livre entier en mode C à tort.
- `classesConflitWholeBook` (l.258) confirme qu'une tranche PARTIELLE coexistant avec un lien direct est « une coexistence légitime → pas de conflit » (fonde la précédence directe, MC1 / **A5**).
- Exposition (`data.ts`) : `livresPourClasse` (l.6, UNION direct ∪ gouvernés), `livreAccessible` (l.65), `semaineLivre` (l.84), `estSemaineDebloquee(semaines, doneSet, semaine, sequentiel)` (l.120, PUR), `peutAccederSemaine(admin, eleveId, livreId, semaine)` (l.129), `toutesSemainesDone` (l.155), `chargerCapstoneLivre` (l.144). AUCUNE ne restreint aux séances d'un extrait aujourd'hui.
- IA (`utils/aletheia-retours.ts`) : `assemblerAncrageSemaine` (texte de LA séance), `assemblerAmontVf` (`.lt('semaine', N)` sur le LIVRE ENTIER, avec fallback fiches `aletheia_livre_reference`), `assemblerTitresAval` (`.gt('semaine', N)` sur le livre entier), `assemblerAncrageVf` → `{ amont, semaineCourante, avalTitres }`, `assemblerAncrageLivre` (livre entier, capstone). La clé / le mot `semaine` y sont un CONTRAT IA (**LD7**).

### 1.6 Limite connue de l'invariant « A/B jamais → C » (re-découpe full-range explicite)

L'invariant « un livre entier ne peut jamais devenir C » est **conditionnel**, pas absolu. La détection compare `couvertes` à `S = DISTINCT(scriptorium_documents.semaine)`. Un créneau à bornes EXPLICITES pleine plage `[1-N]` (et non `(null,null)`) qui valait « livre entier » sur un livre de N séances devient un **sous-ensemble strict** dès qu'une re-découpe **augmente N** (le prof re-découpe le livre de 5 à 10 séances) → `couvertes = {1..5} ⊊ S` → bascule silencieuse en mode C. `couvre` (bornes explicites) ne peut pas distinguer « [1-5] = livre entier figé » de « [1-5] = extrait ».

Conséquence structurante : **l'invariant n'est garanti que si le livre entier est posé en bornes `(null,null)`**. La normalisation « full-range explicite → `(null,null)` » vit dans l'authoring Scriptorium (HORS périmètre C1). Ce SPEC en fait une **dépendance bloquante d'activation** : l'audit R-EXPO (§9) doit lister tout créneau full-range explicite AVANT le flip du gate, et le traiter comme mode B. Cette limite est reprise en garantie conditionnelle en §9 et en question PO ouverte en §11.

## 2. Décisions verrouillées (MC1..MC5)

Ces cinq décisions PO sont ACTÉES ; tout le SPEC en dérive. Elles ne sont pas rediscutées (les arbitrages ouverts sont en §11 et dans les arbitrages de synthèse A1..A8).

**MC1 — Détection PAR COUVERTURE, zéro schéma, par couple (livre × classe).**
Union des tranches de tous les créneaux-livre de ce livre, dans les parcours vivants (`scriptorium_parcours.supprime_at IS NULL`) assignés ACTIFS (`scriptorium_parcours_classes.statut='active'`) à la classe.
- Union couvre TOUTES les séances-docs → **mode B** (entier).
- Union couvre un SOUS-ENSEMBLE strict → **mode C** (extraits), extrait = les séances couvertes.
- *Corollaire verrouillé* : « livre entier mais ne dater que certaines séances » N'EXISTE PAS — toute pose partielle = extraits.
- *Piège B-distribué* : plusieurs créneaux dont l'UNION couvre tout (ex. [1-5]+[6-10]) → reste **B**. Ne PAS confondre avec C.
- *Précédence assignation directe* : un livre lié en DIRECT (`scriptorium_unite_classes`) est TOUJOURS exposé entier → jamais C (arbitrage **A5**, §4.5).
- *Source unique* : une lecture I/O `modeExposition(admin, livreId, classeId)` (§3, §4) est la SEULE source de vérité, consommée par l'exposition ET par le choix d'ancrage IA. Elle lit les créneaux **BRUTS** (niveau `gouverne`), pas `candidats` (arbitrage **A1**).
- *Réserve invariant* : la bascule A/B → C est impossible **sous réserve** que le livre entier soit posé en `(null,null)` ; le cas full-range explicite + re-découpe est traité en §1.6 / §9 / §11.
- *Réserve multi-parcours* : l'UNION à travers plusieurs parcours (arbitrage **A6**) est retenue pour la DÉTECTION et le gate d'exposition (0-migration, compatible MC2). Mais elle entre en tension avec l'ancrage IA per-parcours de MC3 : un extrait à cheval sur 2 parcours n'a pas de carte-de-parcours unique. Le point de coupure (restreindre mode C à un seul parcours gouvernant vs. per-parcours explicite) est une **décision de sémantique de gate à trancher DANS C1** (§4.6, §7), pas un angle mort déférable au chantier Scriptorium.

**MC2 — Renumérotation 1..K à l'AFFICHAGE (mini-livre).**
L'élève voit « Séance 1, 2, 3 » et ignore que c'est un extrait. MAIS l'ordinal DB (`scriptorium_documents.semaine`, `aletheia_travaux.semaine_index`) ET le param d'URL `[semaine]` RESTENT l'ordinal d'ORIGINE (3, 5, 7). Le 1..K est un pur mapping d'affichage. **Le travail élève reste indexé par l'ordinal d'origine → 0 migration.** La couche de mapping vit dans un module pur dédié (`utils/aletheia-extrait.ts`) + un champ `numero` sur `SemaineLivre` (arbitrage **A8**, §6).

**MC3 — Ancrage IA = CARTE-DE-PARCOURS + synthèses par morceaux (artefact Scriptorium FUTUR), PAS un mini-livre.**
À terme un PARCOURS a sa propre carte (fil conducteur + nœuds + liens au niveau parcours) et des synthèses par morceau ; les retours IA d'un extrait s'y ancrent (au lieu de l'amont/aval du livre). Le **CAPSTONE du mode C est ABSORBÉ par la carte-de-parcours** — pas de capstone per-extrait au sens livre ; le `aletheia_capstone` livre-entier est INTERDIT en C (il révélerait des séances hors-extrait). Cet artefact = chantier Scriptorium que le PO prépare, hors de ce SPEC. La surface IA effectivement ré-ancrée est **minimale** (arbitrage **A4**) : V1 et diagnostic sont déjà extract-safe ; seuls l'amont/aval VF (`assemblerAmontVf` / `assemblerTitresAval`) et le book-capstone (`assemblerAncrageLivre`) consomment C2 — sous réserve du cadrage des blocs numérotés du prompt (§7).

**MC4 — Périmètre : C1 détaillé + C2 en contrat/dépendance.**
C1 spécifié à fond. C2 = contrat consommé contre la future carte-de-parcours (ce que mode C attend), marqué DÉPENDANCE Scriptorium, SANS concevoir la carte elle-même.

**MC5 — Activation GATÉE.**
Mode C ne devient VISIBLE À L'ÉLÈVE qu'une fois C2 livré. C1 est codé, testé, mergeable mais **GATE OFF** : jamais d'extraits en prod sans retours IA cohérents. Le gate (§8) combine un kill-switch global (colonne `aletheia_params.mode_c_actif`, arbitrage **A2** — 1 ALTER additif sur une table CONFIG 1-ligne, jamais sur `aletheia_travaux`) ET la présence d'une carte-de-parcours READY. **Le gate englobe le mode C ET le cas MALCONFIG** : gate OFF ⇒ `modeExposition` renvoie mode B (livre entier) pour TOUS les livres gouvernés, y compris couverture vide, reproduisant à l'octet près le repli-B actuel.

**Invariant LD7 (repris du chantier séances, non négociable).**
Ne JAMAIS casser le contrat IA des modes A/B : prompts (`PROMPT_FEEDBACK_V1/VF_DEFAUT`, `PROMPT_CAPSTONE_DEFAUT`…), overrides `aletheia_params.prompt_*`, clé JSON `semaine` de `aletheia_livre_reference`, placeholders (`{amont_structure}`, `{semaine_courante_texte}`, `{aval_titres}`…), et le sens « ordinal de séance » des colonnes `semaine` / `semaine_index`.

## 3. Périmètre (DANS / HORS)

### DANS le périmètre

- **Détection du mode** par couverture (§4) : une lecture I/O
  ```ts
  modeExposition(admin, livreId, classeId): {
    mode: 'A' | 'B' | 'C',
    exposees: number[],          // ordinaux d'ORIGINE des séances exposées, triés
    complet: boolean,            // union couvre S (= mode B)
    gouverneParcoursId: string | null,
    malconfig?: boolean          // couvertes == ∅ ∧ gouverne (§4.7) — pertinent gate ON
  }
  ```
  bâtie sur les briques existantes (`couvre`, la logique vivant/actif de `chargerCandidats` lue au niveau `gouverne`, arbitrage **A1**), **SANS nouvelle table ni colonne hors kill-switch** (§8). Source de vérité UNIQUE, consommée par toute l'exposition ET par le choix d'ancrage IA.
- **C1 — Exposition tranche-aware** (§5) : rendre `livresPourClasse`, l'accès page séance, `peutAccederSemaine`, `toutesSemainesDone`, la page planning et la page séance restreints à l'extrait en mode C, SANS casser A/B. `peutAccederSemaine` / `toutesSemainesDone` gagnent un paramètre `classeId` (l'extrait dépend de la classe ; tous les appelants ont `active.classe_id` sous la main — arbitrage **A8**).
- **C1 — Renumérotation 1..K** (§6) : couche de mapping d'affichage PURE (`utils/aletheia-extrait.ts`), machine à états inchangée, déblocage séquentiel parmi les séances de l'extrait, gate capstone = sous-ensemble extrait, non-réécriture du travail élève.
- **C2 — Contrat IA consommé** (§7) : shape exacte que la carte-de-parcours + synthèses par morceaux doivent fournir ; point de bascule de l'ancrage VF (livre → carte-parcours) ; capstone = carte-parcours ; respect strict de LD7. SANS concevoir la carte-de-parcours.
- **Gate d'activation** (§8) — couvrant reclassement C **et** MALCONFIG — et **sûreté prod** (§9).

### HORS périmètre (explicite)

- **La carte-de-parcours elle-même** : modèle de données, tables, génération IA, prompts, UI prof de préparation, synthèses par morceaux = **chantier Scriptorium que le PO prépare** (cf. [[project_parcours_scriptorium]]). Ce SPEC n'en spécifie QUE le contrat consommé.
- **Toute migration de données** ou renommage de colonnes (`semaine` / `semaine_index` restent, LD7). **Toute renumérotation en base** : le 1..K est purement d'affichage.
- **Les modes A et B** : inchangés (non-régression stricte, §9). Aucune fonction A/B renommée ou modifiée dans son comportement. Le repli-B whole-book (livre partiellement posé, gate OFF) et le repli-B des livres à couverture dégénérée (MALCONFIG, gate OFF) restent byte-identiques à la prod actuelle.
- **Le résolveur de dates** (`aletheia-dates.ts`) : déjà tranche-aware (`couvre` filtre par séance) et livré → RÉUTILISÉ tel quel, aucune refonte (§6). Détection (QUELLES séances, sur créneaux bruts) et datation (QUAND, sur `candidats`) restent indépendantes ; leur divergence est attendue (un extrait mode C sans date reste exposé sans échéance, cf. §4/§5).
- **La normalisation authoring « full-range explicite `[1-N]` → `(null,null)` »** (§1.6) : elle vit dans l'authoring Scriptorium. Ce SPEC ne l'implémente pas, mais **en fait une dépendance bloquante d'activation** (audit R-EXPO avant flip, §9) — sans elle, l'invariant A/B→C est seulement conditionnel.
- **Toute UI prof** de configuration du mode C (le mode se déduit de la pose des créneaux ; MC1 = zéro schéma). Un affordance prof « ce livre est en mode C (extrait de K/N) » est un point ouvert (§11 Q8), pas un livrable imposé.
- **L'authoring des créneaux/tranches** (déjà en prod : `scriptorium_parcours_creneaux`, `parcours_phase_a.sql`).

## 4. Détection du mode par couverture

Cette section spécifie l'unique fonction de classification qui décide, pour un couple `(livre, classe)`, si l'élève voit le livre entier (A/B) ou un sous-ensemble de séances (C). Elle acte **MC1** (détection par couverture, zéro schéma) et pose les garde-fous qui interdisent qu'un livre entier soit jamais reclassé en C.

### 4.1 Source de vérité UNIQUE

Une seule fonction I/O décide le mode, consommée par TOUS les points d'aval (exposition C1 §5 ET génération IA C2 §7) pour éviter toute divergence de verdict entre ce que l'élève voit et ce sur quoi l'IA s'ancre. Proposée dans `utils/aletheia-dates.ts` (où vit déjà le chargement des créneaux gouvernants), elle ne crée AUCUNE table (MC1) :

```ts
modeExposition(admin, livreId, classeId): {
  mode: 'A' | 'B' | 'C' | 'MALCONFIG',
  exposees: number[],             // ordinaux d'ORIGINE exposés, triés ascendant
  complet: boolean,               // true ⇔ exposees == toutes les séances-docs (S)
  gouverneParcoursId: string|null // parcours UNIQUE gouvernant l'extrait (ancrage C2, §4.6) ; null hors C
}
```

Elle réutilise les briques existantes (`couvre`, l'extraction de créneaux gouvernants, la requête `scriptorium_documents`) et n'est PAS dupliquée ailleurs. **Elle est PURE au sens verdict** : elle ne connaît PAS le gate `mode_c_actif` ; le repli gaté vers B est appliqué par une couche mince en §8 (renvoi §4.9). Ce découplage est délibéré : la détection reste testable indépendamment du flag.

### 4.2 Données d'entrée — POINT DUR : créneaux BRUTS, pas `candidats`

1. **S = séances-docs du livre** : `SELECT DISTINCT semaine FROM scriptorium_documents WHERE unite_id=livreId AND semaine IS NOT NULL`. C'est exactement la requête déjà faite par `peutAccederSemaine` / `toutesSemainesDone` (`data.ts:133,157`) — **à factoriser** en `seancesDocs(livreId): Set<number>` réutilisé par la détection et par le gate capstone (§6).
2. **direct** : `EXISTS scriptorium_unite_classes(unite_id=livreId, classe_id=classeId)` — même prédicat que `livreAccessible`.
3. **Créneaux gouvernants BRUTS** : les créneaux-livre de ce livre dans un parcours vivant assigné ACTIF à la classe, avec leurs bornes `debut/fin` — **au niveau du drapeau `gouverne`**, PAS au niveau des dates résolues.

**⚠️ Arbitrage verrouillé (VÉRIFIÉ dans le code) — A1.** Il faut les créneaux BRUTS, PAS la liste `candidats` de `chargerCandidats`. À `aletheia-dates.ts:216-217`, `chargerCandidats` fait `if (!ap) continue` : il ÉCARTE tout créneau gouvernant dont la date n'est pas résoluble (parcours assigné sans `horaire_snapshot` ni `date_debut`). Un tel créneau COUVRE pourtant des séances (il gouverne l'exposition). Se fonder sur `candidats` **sous-compterait** la couverture → un livre entier gouverné sans dates basculerait à tort en C. La couverture DOIT s'appuyer sur les créneaux au niveau du drapeau `gouverne` (`aletheia-dates.ts:197-200`, calculé AVANT la boucle de filtrage date `l.216`).

**Recommandation d'implémentation** : extraire de `chargerCandidats` une sous-fonction partagée

```ts
creneauxGouvernants(admin, livreId, classeId): { parcoursId: string, debut: number|null, fin: number|null }[]
```

= les créneaux tels que `assignParParcours.has(c.parcours_id)`, mutualisée entre la détection ET le résolveur, pour ne dupliquer ni la logique vivant/actif ni le chargement (cf. §11 R5). On expose `parcoursId` sur chaque créneau : il est nécessaire au comptage multi-parcours de §4.6.

**Divergence attendue exposees ↔ dates (finding mineur — à énoncer explicitement).** `exposees` dérive des créneaux BRUTS ; les dates dérivent de `candidats` (qui écarte les créneaux sans date). Leur divergence est LÉGITIME : un extrait mode C dont le parcours gouvernant n'a ni snapshot ni `date_debut` est **classé C et EXPOSÉ, mais SANS échéance** — miroir exact du mode A « dateless » d'aujourd'hui. Un tel extrait n'est **ni MALCONFIG ni masqué**. Il est INTERDIT d'ajouter une garde « pas de date résolue ⇒ masquer/MALCONFIG » : elle masquerait à tort un extrait valide et divergerait du traitement mode A/B dateless actuel.

### 4.3 Algorithme (déterministe et total)

```ts
S = seancesDocs(livreId)                                   // Set<number>
if (S.isEmpty) return { mode:'A', exposees:[], complet:false, gouverneParcoursId:null }
    // livre NON DÉCOUPÉ (zéro ligne scriptorium_documents) → neutre, PAS MALCONFIG (§4.7)

direct   = lienDirect(livreId, classeId)                   // bool
creneaux = creneauxGouvernants(livreId, classeId)          // [{parcoursId,debut,fin}] BRUTS (§4.2)
gouverne = creneaux.nonEmpty

// (a) Non gouverné : A si direct, sinon non exposé
if (!gouverne)
    return direct ? { mode:'A', exposees:sort(S), complet:true,  gouverneParcoursId:null }
                  : { mode:'A', exposees:[],       complet:false, gouverneParcoursId:null }

// (b) PRÉCÉDENCE DIRECTE (MC1 corollaire, §4.5) : direct = octroi livre-entier → JAMAIS C
if (direct)
    return { mode:'B', exposees:sort(S), complet:true, gouverneParcoursId:null }

// (c) Gouverné par parcours SEUL : couverture par UNION des tranches
couvertes = { s ∈ S : creneaux.some(c => couvre(c, s)) }   // réutilise couvre() aletheia-dates.ts:59
if (couvertes.equals(S))
    return { mode:'B', exposees:sort(S), complet:true, gouverneParcoursId:null }  // B (y compris B-DISTRIBUÉ)
if (couvertes.isEmpty)
    return { mode:'MALCONFIG', exposees:[], complet:false, gouverneParcoursId:null }  // §4.7

// couvertes ⊊ S, non vide → extrait (mode C candidat) ; vérifier l'unicité du parcours (§4.6)
parcoursCouvrants = distinct( creneaux.filter(c => couvertes.some(s => couvre(c,s))).map(c => c.parcoursId) )
if (parcoursCouvrants.length >= 2)
    return { mode:'MALCONFIG', exposees:sort(couvertes), complet:false, gouverneParcoursId:null }  // §4.6
return { mode:'C', exposees:sort(couvertes), complet:false, gouverneParcoursId: parcoursCouvrants[0] }
```

La fonction est **totale** : tout couple retombe sur exactement un verdict. Le cas `S` vide sort en `A` neutre AVANT toute évaluation de couverture — il ne doit JAMAIS être confondu avec MALCONFIG (finding mineur : « exposees vide » n'est PAS un critère d'exclusion ; le seul critère MALCONFIG est `gouverne ∧ couvertes ⊊ S` avec l'extrait invalide, cf. §4.7).

### 4.4 B-distribué vs C — résolu par l'ÉGALITÉ ENSEMBLISTE

La couverture est une UNION sur TOUS les créneaux gouvernants, puis comparée à `S` :

| Configuration (S = {1..10}) | `couvertes` | Verdict |
|---|---|---|
| `[1-5]@sem1 + [6-10]@sem2` (B-distribué) | {1..10} = S | **B** |
| `(null,null)` (livre entier canonique) | {1..10} = S | **B** |
| `[3-3] + [5-5] + [7-7]` | {3,5,7} ⊊ S | **C**, exposees=[3,5,7] |
| `[20-25]` (hors plage) | ∅ | **MALCONFIG** |

Distinguer B-distribué de C n'est PAS un cas particulier : c'est la conséquence directe de comparer `union(couvre)` à `S`. Chaque séance garde sa date propre via le résolveur existant (`resoudreDepuisCandidats`, tie-break spécificité→date→stable `aletheia-dates.ts:93-99`) — orthogonal à la détection de mode.

### 4.5 Précédence de l'assignation directe (MC1 corollaire)

`scriptorium_unite_classes` ne porte AUCUNE tranche → expose toujours le livre entier. `livresPourClasse` (`data.ts:76-88`) est l'UNION `direct ∪ gouvernés`. Un lien direct FORCE donc le livre entier → mode A/B, **JAMAIS C** (branche (b) de §4.3, évaluée AVANT la couverture). Cohérent avec `classesConflitWholeBook` (`aletheia-dates.ts:258`) qui ne signale un conflit QUE pour whole-book × direct, jugeant la coexistence `direct + tranche-partielle` « légitime ».

**Conséquence de sûreté assumée (A5, à confirmer PO — Q5) :** pour forcer le livre entier, le prof garde/pose le lien direct — levier manuel simple, auditable (R-EXPO). C n'est possible que pour un livre exposé EXCLUSIVEMENT via créneaux partiels, sans lien direct.

### 4.6 Multi-parcours — DURCISSEMENT vs la première synthèse

La première synthèse retenait l'UNION permissive à travers tous les parcours (A6) et déférait la question « quelle carte-de-parcours ancre la séance ? » à R3/Q3. **Deux findings majeurs de contre-épreuve montrent que cette déférence est intenable** : l'ancrage C2 (§7.3) et le gate capstone (§6) supposent une carte-de-parcours UNIQUE, tandis que `modeExposition` ne renvoie qu'un seul `gouverneParcoursId` ; pour un extrait couvert par P1=[1-3] et P2=[8-10], la séance 9 (P2) n'a aucun morceau dans la carte de P1 → ancrage indéfini, capstone indéfini, `parcoursRetenu` non-total (sa précédence `resoudreDepuisCandidats` est PAR SÉANCE, pas au niveau livre). C'est une décision de **sémantique de gate C1**, pas un angle mort déférable à C2.

**Décision durcie (à valider PO — Q3) :**

- L'UNION reste utilisée pour **détecter B** : si `union(couvre) == S`, c'est B quel que soit le nombre de parcours (B-distribué et multi-parcours-complet inclus). Cette partie de A6 tient.
- Pour **mode C**, on exige **exactement UN parcours gouvernant l'extrait**. Si `couvertes ⊊ S` et que 2+ parcours distincts contribuent une tranche couvrante → **MALCONFIG** (§4.3 dernière branche). Justification : (i) l'axe ordinal d'origine est UNIQUE dans `aletheia_travaux` (MC2, 0 migration) ; traiter chaque parcours comme un mini-livre séparé exigerait un axe « parcours » → migration + rupture MC2 ; (ii) C2 consomme UNE carte-de-parcours par extrait — un extrait bi-parcours n'a pas de carte évidente.
- `gouverneParcoursId` devient alors **déterministe et bien défini** : c'est l'unique parcours couvrant. La fonction `parcoursRetenu(...)` de la première synthèse — non-totale car fondée sur une précédence par séance — est **SUPPRIMÉE** (finding mineur §4.6 réglé à la racine).

Ce durcissement referme la contradiction C1/C2 sans préempter le chantier Scriptorium : C2 reçoit toujours un parcours unique. Le point ouvert résiduel devient un simple choix d'authoring (le prof ne doit pas exposer le même livre en extraits via 2 parcours pour une même classe) — signalé au prof, jamais silencieusement mal ancré.

### 4.7 Cas dégénérés et garde-fous

- **`couvertes` vide alors que `gouverne`** (bornes hors plage, ex. `[20-25]` sur 10 séances ; ou re-découpe réduisant N) → **MALCONFIG**. On NE PAS exposer un livre à 0 séance, on NE PAS replier sur le livre entier **quand le gate est ON** (ce serait la fuite qu'on corrige). Sous gate ON, le livre est **retiré de `livresPourClasse` + journalisé** pour signal prof (A7, §9). ⚠️ **Sous gate OFF, MALCONFIG retombe sur le repli-B actuel** (livre entier, dates nulles) — voir §4.9, sinon régression prod.
- **Extraction multi-parcours partielle** (§4.6) → **MALCONFIG** également.
- **Borne partielle ouverte** (`debut=null, fin=5`) : `couvre` la traite comme `≤5`. Cohérent.
- **Créneau `(null,null)` = livre entier** : `couvre` (bornes null) couvre tout → `couvertes ⊇ S` → **B**.
- **`S` vide (livre non découpé)** : mode A neutre (§4.3), affiché comme aujourd'hui avec `semaines:[]` — **PAS** MALCONFIG, **PAS** exclu (finding mineur).
- **Parcours archivé** (`statut='archivee'`) : exclu par le filtre `active` → ne déclenche jamais C.

**Invariant de sûreté §4.8 — REQUALIFIÉ EN CONDITIONNEL (finding majeur R7).** L'affirmation « un livre entier (A/B) ne peut JAMAIS devenir C » est FAUSSE pour un créneau à **bornes EXPLICITES pleine plage** `[1-N]` suivi d'une re-découpe qui AUGMENTE N : un `[1-5]` qui valait « livre entier » sur un livre de 5 séances devient `{1..5} ⊊ S` dès que le prof re-découpe à 10 → bascule silencieuse en C. La détection ne PEUT PAS distinguer « `[1-5]` = livre entier » de « `[1-5]` = extrait ». L'invariant tient donc **sous réserve que le livre entier soit posé en bornes `(null,null)`**. Mitigations, à traiter comme **dépendance BLOQUANTE de l'activation** (§8), pas simple recommandation :
1. **Authoring Scriptorium** : normaliser tout « livre entier » en `(null,null)`, jamais `[1-N]` explicite.
2. **Audit R-EXPO avant flip** (§9) : lister tout créneau full-range explicite `fin == N_courant ∧ debut ≤ 1` et le signaler pour normalisation AVANT toute activation de `mode_c_actif`.
3. Garde de détection optionnelle (défensive) : si l'union des créneaux gouvernants satisfait `min(debut) ≤ 1 ∧ max(fin) ≥ N_courant`, traiter la pleine-plage explicite comme `(null,null)` → B. À arbitrer PO (Q4) : simple mais masque un extrait légitime `[1..N]` (qui serait de toute façon B par égalité ensembliste, donc sans perte réelle).

### 4.8 Verrous d'invariance (conditionnels §4.7)

C ne sort du détecteur QUE si **toutes** les conditions tiennent :

1. gouverné par parcours SEUL (aucun lien direct — précédence §4.5) ;
2. `couvertes ⊊ S`, non vide ;
3. un SEUL parcours gouverne l'extrait (§4.6) ;
4. le livre entier n'est pas posé en `[1-N]` explicite désaligné (§4.7, garanti par l'authoring/audit) ;
5. gate `mode_c_actif = true` (§4.9/§8).

Sous ces verrous, un livre entier (A/B) ne devient jamais C.

### 4.9 Interaction avec le gate — le repli gaté doit englober C **ET** MALCONFIG

**Finding majeur (contradiction dark-launch).** Le gate §8 promet qu'avec `mode_c_actif = false` le déploiement de C1 est un no-op strict (repli B, comportement prod byte-identique). Or MALCONFIG est un verdict **DISTINCT** de C : un gate naïf qui ne reclasse que `mode=='C' → 'B'` laisserait MALCONFIG actif dès le merge. Conséquence : un livre aujourd'hui gouverné avec un créneau hors-plage (`[20-25]` sur 10) EST actuellement exposé EN ENTIER (repli-B : `livresGouvernesPourClasses` `aletheia-dates.ts:287` ne regarde pas les bornes, `resoudreDatesLivre` renvoie juste des dates nulles). Au merge de C1, gate OFF, ce livre passerait MALCONFIG → **DISPARAÎTRAIT** → régression prod silencieuse.

**Exigence de conception (verrouillée) :** la couche gate de §8 doit folder vers B **TOUS** les verdicts non-A/B, c'est-à-dire `mode ∈ {'C','MALCONFIG'}`, quand `mode_c_actif = false` :

```ts
// couche mince §8, au-dessus de modeExposition (§4.1)
r = modeExposition(admin, livreId, classeId)
if (!mode_c_actif && (r.mode === 'C' || r.mode === 'MALCONFIG'))
    return { mode:'B', exposees:sort(S), complet:true, gouverneParcoursId:null }  // repli-B whole-book, statu quo prod
return r
```

Ainsi la détection/journalisation/exclusion MALCONFIG ne s'active QU'AVEC le gate ON. Gate OFF ⇒ repli-B whole-book reproduit à l'octet près le comportement actuel, y compris pour les livres mal configurés (A3). Les énoncés « effet prod NÉANT » de §8/§10 restent vrais **seulement** sous cette condition — à corriger dans ces sections en conséquence.

### 4.10 Table d'impact — détection

| Élément | Fichier / fonction | Action |
|---|---|---|
| Appartenance séance→tranche | `utils/aletheia-dates.ts:couvre` (l.59) | RÉUTILISER tel quel |
| Extraction créneaux gouvernants BRUTS (+ `parcoursId`) | `utils/aletheia-dates.ts:chargerCandidats` (l.197-200) | EXTRAIRE `creneauxGouvernants(...)` partagé (§4.2) |
| Ensemble S | requête `scriptorium_documents` (`data.ts:133,157`) | FACTORISER `seancesDocs(livreId)` |
| Précédence directe | `scriptorium_unite_classes` / `classesConflitWholeBook` (`aletheia-dates.ts:258`) | LIRE le lien direct, brancher AVANT couverture (§4.5) |
| Détection (verdict pur, sans gate) | (nouveau) `modeExposition(admin, livreId, classeId)` | CRÉER, source unique C1/C2 ; renvoie aussi `MALCONFIG` |
| Repli gaté C **et** MALCONFIG → B | couche mince §8 au-dessus de `modeExposition` | SPÉCIFIER le fold des DEUX verdicts (§4.9) |
| `parcoursRetenu` (1ʳᵉ synthèse) | — | SUPPRIMER (mode C = parcours unique, §4.6) |

### 4.11 Points ouverts de cette section (remontés PO)

- **Q3** — Restreindre mode C à UN parcours gouvernant (extrait bi-parcours = MALCONFIG) : acceptable côté authoring, ou l'usage exige-t-il des extraits multi-parcours (⇒ axe « parcours » dans `aletheia_travaux`, migration, rupture MC2) ?
- **Q4** — Garde full-range explicite `[1-N]` (§4.7 mitigation 3) : l'activer par défaut (défensif, sans perte réelle) ou s'en remettre à l'audit R-EXPO + normalisation authoring seuls ?
- **Q5** — Précédence directe comme levier « forcer le livre entier » (§4.5) : contre-intuitif pour le prof, ou levier assumé et documenté ?
- **Dépendance bloquante d'activation** — la normalisation `(null,null)` du livre entier (authoring Scriptorium) et l'audit R-EXPO doivent être livrés AVANT tout passage `mode_c_actif = true`, sous peine de bascules C silencieuses (§4.7).

Both facts confirmed: only `soumettreV1` (actions.ts:85) calls `peutAccederSemaine`; `soumettreVf`/`validerLectureRetourVf`/`relancerRetour` do not. And `peutAccederSemaine` (data.ts:158) early-returns `true` at line 160 before any membership check. Folding these into the sections below.

## 5. C1 — Exposition des extraits (tranche-aware)

**Principe directeur.** `modeExposition(admin, livreId, classeId)` (défini au §4, APRÈS application du gate §8) est la SEULE autorité sur « quelles séances sont exposées ». Il renvoie `{ mode: 'A'|'B'|'C', exposees: SeanceOrdinal[] }` où `exposees` est trié croissant. On restreint `.semaines` AU NIVEAU DATA (`livresPourClasse`, data.ts:35) à `exposees` ; toutes les pages qui consomment `livre.semaines` deviennent alors correctes par héritage. On ajoute des gardes serveur DÉFENSIVES sur les points d'accès direct par URL et sur TOUS les chemins d'écriture (§5.2). En modes A/B, `exposees == sort(DISTINCT scriptorium_documents.semaine)` → chemin de code identique à aujourd'hui : non-régression par construction, prouvable à l'octet.

**Invariant de gate (rappel §8, load-bearing ici).** Sous `mode_c_actif = false`, `modeExposition` renvoie TOUJOURS mode B pour tout livre gouverné — y compris les cas dégénérés (couverture vide, cf. §5.1) — c'est-à-dire `exposees = sort(S)` (livre entier, dates possiblement nulles). Aucune exclusion, aucun masquage, aucune renumérotation ne s'active tant que le flag est OFF. C'est ce qui garantit que le simple MERGE de C1 est un no-op fonctionnel prod (correction du finding « MALCONFIG non gaté »).

### 5.1 Table d'impact — exposition

| Fonction / page | Fichier:ligne | Changement mode C (gate ON) | Comportement gate OFF |
|---|---|---|---|
| `livresPourClasse` | data.ts:35 | après chargement des docs, appeler `modeExposition` (mutualiser le chargement des créneaux/documents avec `resoudreDatesLivre`) ; filtrer `.semaines` à `exposees` ; poser `numero` 1..K (§6.1) + `mode` sur chaque `SemaineLivre` / le `LivreAletheia` ; **exclure** un livre MALCONFIG (§5.1.2) + journaliser ; `nb_semaines` d'affichage = K (§5.3) | `modeExposition` renvoie B partout → `.semaines = sort(S)`, `numero == semaine`, aucune exclusion → **identique à prod** |
| `livreAccessible` | data.ts:94 | **INCHANGÉ** : en mode C le livre EST accessible ; la restriction est séance-level (§5.2). L'exclusion MALCONFIG passe uniquement par `livresPourClasse` | inchangé |
| `semaineLivre` | data.ts:113 | **INCHANGÉ** (lit un doc par ordinal d'origine ; la garde d'appartenance est portée par l'appelant, §5.2) | inchangé |
| `estSemaineDebloquee` | data.ts:149 | **INCHANGÉE** (déjà générique : elle trie l'array `semaines[]` reçu et exige le prédécesseur immédiat DONE ; lui passer `exposees` au lieu de `S` suffit, §6.5) | reçoit `sort(S)` → identique |
| `peutAccederSemaine` | data.ts:158 | **+`classeId`** ; calcule `exposees` via `modeExposition` ; **refuse INCONDITIONNELLEMENT si `semaine ∉ exposees`, AVANT le retour anticipé ligne 160** (§5.2, footgun) ; puis déblocage séquentiel sur `exposees` | `exposees = sort(S)` → `∉` jamais vrai → comportement ligne 160 intact |
| `toutesSemainesDone` | data.ts:184 | **+`classeId`** ; gate = toutes les séances de `exposees` DONE (§6.6) | itère `sort(S)` → identique |
| page planning | `app/eleve/modules/aletheia/page.tsx` | hérite du filtrage `.semaines` ; corrections d'AFFICHAGE seules (§6.3) ; tuile capstone gatée en C (§6.6) | inchangé |
| page séance | `[livreId]/[semaine]/page.tsx` | garde `semaine ∈ exposees` → `notFound()` (§5.2) ; titre « Séance {position} » (§6.3) | inchangé |
| page capstone | `[livreId]/capstone/page.tsx` | `notFound()` si `mode === 'C'` tant que C2 absent (§6.6) | inchangé |

**§5.1.1 — Divergence légitime `exposees` (créneaux bruts) vs dates (`candidats`).** `exposees` dérive des créneaux **BRUTS** (`creneauxGouvernants`, §4.2, calculé au niveau `gouverne` AVANT tout filtrage date), tandis que les échéances dérivent de `candidats` (`chargerCandidats`, aletheia-dates.ts:216-218 : `if (!ap) continue` écarte les créneaux sans date résoluble). Ces deux ensembles PEUVENT diverger, et c'est **attendu** : un extrait dont le parcours gouvernant n'a ni `horaire_snapshot` ni `date_debut` est classé mode C et **EXPOSÉ SANS ÉCHÉANCE** (miroir exact du mode A dateless). Un tel extrait n'est **NI MALCONFIG NI masqué**. Directive d'implémentation : **interdire toute garde « pas de date résolue ⇒ masquer/MALCONFIG »** — la datation et la détection d'étendue sont deux axes indépendants (arbitrage A1).

**§5.1.2 — Trois cas d'`exposees` vide, à ne surtout pas confondre :**

| Cas | Cause | `mode` renvoyé | Traitement gate ON | Traitement gate OFF |
|---|---|---|---|---|
| **S-vide** (livre non découpé, 0 ligne `scriptorium_documents`) | authoring en cours | `A`, `exposees=[]` | **AFFICHÉ comme aujourd'hui** (`.semaines=[]`, planning vide). JAMAIS exclu. | idem |
| **MALCONFIG** (`couvertes == ∅` ∧ `gouverne == true`) | créneau hors-plage `[20-25]` sur 10 séances, ou re-découpe réduisant N sous la borne basse | (voir ci-dessous) | **exclu de `livresPourClasse` + journalisé** | **repli B whole-book** (`exposees = sort(S)`, dates nulles) — reproduit prod, PAS d'exclusion |
| **Non gouverné** (aucun créneau, pas de lien direct) | livre hors parcours et non assigné | n/a — déjà absent de l'UNION | absent (inchangé) | absent |

Correction critique des findings : l'exclusion ne se conditionne JAMAIS à `S == ∅` (régresserait l'authoring), mais STRICTEMENT à `gouverne ∧ couvertes == ∅`. Et cette exclusion MALCONFIG est elle-même **derrière le gate** : sous `mode_c_actif = false`, un livre gouverné à couverture vide RETOMBE sur le repli B actuel (livre entier, dates nulles via `resoudreDatesLivre` renvoyant candidats vide) exactement comme en prod aujourd'hui — il ne disparaît pas. La détection/journalisation/exclusion MALCONFIG ne s'active qu'avec le gate ON.

### 5.2 Gate serveur d'appartenance (anti-URL-hack, anti-action-directe) — critique

En mode C, une séance HORS extrait (ex. séance 4 quand `exposees = {3,5,7}`) doit être inaccessible en **lecture ET en écriture**, même par appel direct (URL périmée, invocation directe d'une server action). Deux surfaces, partageant `modeExposition` :

**(a) Lecture — page séance.** Dans `[livreId]/[semaine]/page.tsx`, après `livreAccessible`, faire `notFound()` si `semaine ∉ exposees`. `notFound()` (recommandé) ne révèle pas l'existence de la séance hors extrait ; l'écran « pas encore débloquée » est l'alternative moins étanche (question ouverte, §11).

**(b) Écriture + relance — `peutAccederSemaine` comme garde CANONIQUE.** Correction factuelle du SPEC synthétisé (finding majeur, **vérifié dans le code**) : l'affirmation « `peutAccederSemaine` est déjà appelée par la page ET toutes les actions de soumission » est **FAUSSE**. Aujourd'hui **SEUL `soumettreV1` l'appelle** (actions.ts:85). `soumettreVf` (actions.ts:149), `validerLectureRetourVf` (actions.ts:218) et `relancerRetour` (actions.ts:247) ne gardent QUE `livreAccessible` + l'état machine `row.statut` — **aucun contrôle d'appartenance à l'extrait**.

Conséquence si non corrigé (mode C actif) : un **travail orphelin** (§6.8) — séance 4 travaillée pendant un repli B antérieur jusqu'à `FEEDBACK1_READY`, puis parcours reconfiguré en extrait `{3,5,7}` — a une ligne `aletheia_travaux` en `FEEDBACK1_READY`. Un appel direct `soumettreVf(livreId, 4, …)` **passe le garde d'état** (`statut === FEEDBACK1_READY` vrai) sans aucun contrôle d'extrait → écriture VF hors-extrait + `genererRetourVf` ancré **livre entier** (`assemblerAmontVf` `.lt('semaine',N)` / `assemblerTitresAval` `.gt('semaine',N)`, aletheia-retours.ts) → **SPOILER**. Idem `relancerRetour` relance l'IA sur un orphelin en `*_SUBMITTED`.

**Exigence C1 (bloquante).** Ajouter le garde d'appartenance (`peutAccederSemaine` tranche-aware, ou un rejet direct `dansExtrait(exposees, semaine)`) à **`soumettreVf`, `validerLectureRetourVf` ET `relancerRetour`**, pas seulement `soumettreV1`. Ces quatre points forment le périmètre d'écriture complet ; **vérifier qu'aucun autre chemin d'écriture ne contourne le garde**. Toutes ces actions ont la classe active sous la main (contexte élève) → `classeId` transmissible.

**§5.2.1 — Footgun d'ordonnancement (finding mineur, vérifié data.ts:159-160).** `peutAccederSemaine` commence par :
```ts
const { deblocageSequentiel } = await lireReglages(admin)   // data.ts:159
if (!deblocageSequentiel) return true                        // data.ts:160  ← retour anticipé
```
`deblocageSequentiel` vaut **false par défaut** (`aletheia_params` vide → `lireReglages` renvoie `!!undefined = false`, data.ts:136). Si le contrôle `∉ exposees` est ajouté **APRÈS** la ligne 160 (réflexe naturel : enrichir la logique séquentielle existante), alors dans la config par défaut `peutAccederSemaine` renvoie `true` pour N'IMPORTE quelle séance, y compris hors-extrait → **fuite totale par URL/action en mode C**. Directive : le calcul de `exposees` (via `modeExposition`) et le refus `semaine ∉ exposees` doivent s'exécuter **INCONDITIONNELLEMENT, AVANT la ligne 160**. Le déblocage séquentiel reste ensuite conditionné par le réglage. Note de vigilance à porter dans le code au point exact data.ts:160.

### 5.3 Page planning

`livre.semaines` étant déjà filtré à K par `livresPourClasse`, `total`, `doneSet`, `nbDone`, `couranteNum`, la barre d'avancement, le déblocage et le gate capstone se recalculent sur l'extrait AUTOMATIQUEMENT — corrections d'AFFICHAGE seulement (§6.3). Le compteur « K séances » doit afficher `total` (taille de l'extrait) et **JAMAIS `livre.nb_semaines`** (total livre, fuiterait l'étendue réelle du livre). En mode C, `nbSemaines := total`.

### 5.4 Page séance

`semaineLivre` (data.ts:113) renvoie le contenu par ordinal d'origine (inchangé) ; l'appartenance est gardée par `peutAccederSemaine`/`notFound` (§5.2). Le résolveur de date (`resoudreDateSeance`, déjà tranche-aware) reste appelé avec l'ordinal d'origine — correct (§6.7). Le titre « Séance {semaine} » passe en « Séance {position} » (§6.3). Stepper, formulaires V1/VF, validation VF : inchangés, indexés par ordinal d'origine.

### 5.5 Réutilisation & non-duplication

- On NE réécrit PAS le chargement parcours/assignation : `creneauxGouvernants(admin, livreId, classeId): {debut, fin}[]` (extrait du niveau `gouverne` de `chargerCandidats`, aletheia-dates.ts:197-200, cf. §4.2) est la **source unique** partagée entre détection et résolveur. Il opère sur les créneaux **bruts** (pas sur `candidats`) — arbitrage A1.
- On NE duplique PAS le résolveur de dates (`resoudreDatesLivre` / `resoudreDateSeance`) : réutilisé tel quel.
- Le mapping 1..K est PUR et centralisé (`utils/aletheia-extrait.ts`, §6.1), jamais recalculé ad hoc dans les pages.

## 6. C1 — Renumérotation 1..K, machine à états, déblocage, capstone

### 6.1 Couche de mapping (MC2) — module PUR, sans état persistant

Nouveau module additif `utils/aletheia-extrait.ts` (0 I/O), miroir du contrat `SeanceOrdinal` d'`aletheia-seance.ts`. Seul intrant : `exposees = [o₁ < o₂ < … < o_K]` (ordinaux d'ORIGINE triés) ; tout est dérivé à la volée, **JAMAIS persisté** :
```ts
// utils/aletheia-extrait.ts — pur, additif
numeroAffiche(exposees: SeanceOrdinal[], origine: SeanceOrdinal): number {
  const i = exposees.indexOf(origine)
  return i < 0 ? 0 : i + 1              // 3→1, 5→2, 7→3 ; 0 si absent
}
origineDepuisNumero(exposees: SeanceOrdinal[], p: number): SeanceOrdinal | null {
  return exposees[p - 1] ?? null
}
dansExtrait(exposees: SeanceOrdinal[], origine: SeanceOrdinal): boolean {
  return exposees.includes(origine)
}
```
En modes A/B, `exposees = [1..N]` → `numeroAffiche(o) == o` et `dansExtrait == true` pour tout `o` : affichage **byte-identique** (non-régression prouvable par identité).

**Frontière stricte (invariant central).** `numeroAffiche` ne sert QU'À L'AFFICHAGE (libellé « Séance N », barre d'avancement, stepper). Il ne touche JAMAIS les QUATRE ordinaux d'origine :
1. `aletheia_travaux.semaine_index` (clé du travail élève),
2. le param d'URL `[semaine]`,
3. l'ancrage IA (`aletheia-retours.ts` — cf. §7 et note §6.4.1),
4. le résolveur de dates (`aletheia-dates.ts`).

Le 1..K est une **nouvelle couche d'affichage**, jamais une nouvelle clé. Toute confusion entre position et ordinal est un bug de fuite ou de corruption de travail.

**Support de type.** Ajouter `numero: number` à `SemaineLivre` et `mode: 'A'|'B'|'C'` à `LivreAletheia` (types.ts). En A/B, `numero := semaine` (identité).

### 6.2 Le mapping en action

Livre de 12 séances, extrait `exposees = [3, 5, 7]` (K=3) :

| Position affichée | Origine (URL / DB / travail / IA / date) |
|---|---|
| Séance 1 | 3 |
| Séance 2 | 5 |
| Séance 3 | 7 |

- Planning : `href = ${livre.id}/${s.semaine}` reste `…/3`, `…/5`, `…/7` ; `key = s.semaine` ; libellé « Séance {s.numero} ».
- Page `…/5` : titre « Séance 2 » (`numeroAffiche([3,5,7], 5) = 2`) ; travail chargé par `travaux.get(5)`.

### 6.3 Où « Séance N » devient « Séance {position} »

- **Planning** : le grand numéro et « Séance {couranteNum} t'attend » → `s.numero`. Le `href`/`key` gardent l'origine `s.semaine` (MC2). « {nbSemaines} séance(s) » → K (§5.3).
- **Page séance** : titre « Séance {semaine} » → « Séance {numeroAffiche(exposees, semaine)} ».
- **Modes A/B** : `numero == semaine` → aucun changement visuel.

### 6.4 Machine à états — INVARIANTE

`DRAFT → V1_SUBMITTED → FEEDBACK1_READY → VF_SUBMITTED → FEEDBACK2_READY → DONE` reste portée par `aletheia_travaux.statut`, keyée `(eleve_id, scriptorium_livre_id, semaine_index = ORIGINE)`. Mode C **n'ajoute aucun état, aucune ligne, aucune transition**. Une séance d'extrait suit exactement la même machine que la même séance en A/B ; seul le NUMÉRO affiché change. Les états transitoires (poll), les échecs (`retour_*_erreur_at`), la validation de lecture, les orchestrateurs (`genererRetourV1`/`genererRetourVf`) opèrent par `semaine_index`/`travailId` d'origine → intacts en C1. En C2, seul le CONTENU du VF/capstone change (ancrage), **jamais la machine**.

**§6.4.1 — Réserve sur les blocs IA numérotés (renvoi §7).** Attention : la renumérotation d'affichage 1..K NE doit PAS être confondue avec ce que reçoit le modèle. Trois blocs restent aujourd'hui injectés dans les prompts V1/VF avec l'ordinal d'ORIGINE (`assemblerSynthesesPrecedentes`, `assemblerArchitecturesPrecedentes`, `assemblerTrajectoireDiagnostic` — tous formatent « Semaine {semaine_index} »). Leur cohérence avec un éventuel `semaine_courante_N` repositionné en 1..K est une décision de cadrage **C2** (traitée au §7, question Q5), PAS C1. En C1 (gate OFF puis mode C gaté), ces blocs restent inchangés et cohérents car tout reste en ordinal d'origine. Cette réserve est notée ici uniquement pour interdire à un implémenteur de « propager » `numeroAffiche` dans les assembleurs — ce serait franchir la frontière §6.1.

### 6.5 Déblocage séquentiel — restreint à l'extrait

`estSemaineDebloquee(semaines, doneSet, semaine, sequentiel)` (data.ts:149) est PUR : il trie l'array `semaines` reçu et exige que le PRÉDÉCESSEUR IMMÉDIAT (dans cet array) soit DONE. On lui passe `exposees` → le prédécesseur devient celui **de l'extrait**. Extrait `{3,5,7}` : origine 3 (première) toujours débloquée ; 5 attend 3 DONE (pas la « 4 » inexistante pour l'élève) ; 7 attend 5. Les séances non exposées (4, 6) n'existent pas pour l'élève et ne bloquent rien. **Aucune modification de la fonction — seulement l'ensemble passé.**

Côté serveur, `peutAccederSemaine` (data.ts:158) : charge `exposees` via `modeExposition`, applique le **refus inconditionnel `∉ exposees` AVANT la ligne 160** (§5.2.1), puis `estSemaineDebloquee(exposees, …)`. Le réglage global `deblocage_sequentiel` (`aletheia_params`, `lireReglages` data.ts:130-136) s'applique identiquement en A/B/C.

### 6.6 Gate capstone — « toutes les séances de l'EXTRAIT DONE » + contenu GATÉ (MC5)

Deux évolutions distinctes :

**1. Étendue du gate.** `toutesSemainesDone` (data.ts:184) → ensemble itéré = `exposees` (+`classeId`). Le capstone se débloque quand les **K séances de l'extrait** sont DONE (K/K), pas N/N.

**2. Contenu GATÉ (anti-spoiler).** En mode C, le capstone visé = **carte-de-parcours** (C2, MC3). Le book capstone actuel (`aletheia_capstone`, `chargerCapstoneLivre`, `assemblerAncrageLivre` = **livre entier**) RÉVÈLE l'aval non lu → **SPOILER TOTAL**. Il ne DOIT JAMAIS être affiché ni lié en mode C. En C1 (avant C2) :
- la tuile capstone du planning affiche un placeholder (« la carte du parcours sera bientôt disponible ») et **ne pointe JAMAIS vers `.../capstone`** ;
- la page `[livreId]/capstone/page.tsx` fait `notFound()` si `mode === 'C'` (garde d'accès direct par URL).

Comme le gate global (§8) rend mode C entièrement **inactif en prod tant que C2 absent**, ce placeholder n'est jamais visible en prod avant C2. Mais la **garde de mode doit primer** sur le gate `toutesSemainesDone` existant, afin que — quand C2 arrivera — la page serve la carte-de-parcours et JAMAIS le book capstone en mode C.

**§6.6.1 — Point ouvert union multi-parcours (renvoi §7/§11, finding majeur).** L'arbitrage A6 retient l'UNION des tranches à travers tous les parcours gouvernants (`exposees = {1,2,3} ∪ {8,9,10}` si P1 pose [1-3] et P2 [8-10]). Le gate capstone K/K ci-dessus se calcule alors sur cette union. **Contradiction connue avec C2** : la carte-de-parcours est per-parcours, donc un extrait à cheval sur 2 parcours n'a pas de carte unique évidente → le contenu capstone C2 est indéfini pour ce cas. Ceci N'EST PAS déférable à Scriptorium car il conditionne la sémantique du gate C1 : soit la détection §4 restreint mode C à **un seul parcours gouvernant** par couple (livre, classe) — un livre exposé en extraits par 2+ parcours = MALCONFIG ou repli B — soit `exposees`/capstone deviennent explicitement per-parcours. **À trancher DANS C1** (cf. §4 et Q2/Q3 du §11) avant de figer le gate capstone. En C1 pré-C2 le point est inerte (capstone gaté), mais la décision d'étendue du gate en dépend.

### 6.7 Dates — déjà correctes, rien à faire

`resoudreDatesLivre`/`resoudreDateSeance` (aletheia-dates.ts) filtrent les créneaux par `couvre` : une séance d'extrait prend la date de la semaine de SON créneau. En ne passant QUE `exposees` au niveau data (§5.1), on ne résout de date que pour les séances vues. Le mapping 1..K n'intervient PAS dans la datation (elle reste par ordinal d'origine). **Aucune modification d'`aletheia-dates.ts` requise pour les dates** — seule l'extraction `creneauxGouvernants` (§4.2) touche ce fichier, pour la détection, pas pour la datation.

### 6.8 Impact sur le travail élève — NUL (aucune réécriture)

- `aletheia_travaux` reste keyé `semaine_index = ORIGINE`. Mode C **n'insère jamais** un numéro renuméroté → la contrainte UNIQUE `(eleve_id, scriptorium_livre_id, semaine_index)` n'est jamais sollicitée différemment. **Zéro migration.**
- `travauxParSemaine` (data.ts) mappe par origine → inchangé ; les pages font `.get(origine)`.
- Les continuités IA centrées-élève (`assemblerSynthesesPrecedentes` `.lt('semaine_index', N)`, `assemblerArchitecturesPrecedentes`) lisent le travail PROPRE de l'élève : comme il n'accède qu'à `exposees`, il n'a de travaux QUE sur l'extrait → `.lt` ne ramène que des séances d'extrait antérieures → **naturellement restreint, aucune fuite** (durcissement C2 possible : intersecter à `exposees` pour couvrir un résidu repli-B, §11).

**§6.8.1 — Travaux orphelins : sûr SOUS CONDITION (correction du finding majeur).** Si un livre a d'abord été exposé en repli B et qu'un élève a travaillé des séances qui SORTENT de l'extrait à l'activation C, ces lignes `aletheia_travaux` **subsistent** (jamais supprimées) mais **ne sont plus affichées** et **ne comptent pour rien** dans `toutesSemainesDone` (qui n'itère que `exposees`) → capstone atteignable. Réversible, aucune perte de données. **MAIS la sûreté n'est PAS inconditionnelle** : un orphelin en `FEEDBACK1_READY`/`*_SUBMITTED` PEUT avancer (VF→DONE) et déclencher un retour IA spoiler **si** un chemin d'écriture accepte sa séance. La conclusion « comptent pour rien → sûr » du SPEC synthétisé est donc trop forte. **Les orphelins ne sont sûrs que SI `soumettreVf`, `validerLectureRetourVf` ET `relancerRetour` refusent `semaine ∉ exposees`** (garde imposé au §5.2). Sans ce refus dans les trois actions, la frontière d'extrait n'est pas étanche. Atténuation optionnelle complémentaire (§11) : verrouillage/marquage dur des lignes orphelines, à cadrer avec le PO.

## 7. C2 — Contrat IA sur la carte-de-parcours (dépendance)

**Objet** : définir précisément ce que la future carte-de-parcours + synthèses par morceaux (artefact Scriptorium, MC3/MC4) doivent fournir pour que `utils/aletheia-retours.ts` ré-ancre les retours d'un extrait, comment mode C bascule l'ancrage, et où le chemin d'écriture C1 doit être touché — SANS concevoir la carte (hors périmètre) et SANS casser l'invariant LD7 (contrat IA des modes A/B byte-identique).

### 7.1 Insight fondateur — deux surfaces distinctes, à ne pas confondre

Analyse fonction par fonction de `aletheia-retours.ts` pour un extrait `{3,5,7}` (renuméroté 1..K à l'affichage, MC2). Il faut séparer **deux surfaces indépendantes** qu'un brouillon naïf mélange :

**Surface A — dépendance de CONTENU C2** (l'IA doit lire un artefact qui n'existe pas en mode livre) :
| Retour | Assembleur | Portée actuelle | Statut mode C |
|---|---|---|---|
| VF — amont | `assemblerAmontVf` (`.lt('semaine',N)`, l.413) | fiches/textes des séances `< N` du **livre entier** (inclut la 4, non exposée) | **INCOHÉRENT** → ré-ancrer sur synthèses de morceaux |
| VF — aval | `assemblerTitresAval` (`.gt('semaine',N)`, l.443) | titres des séances `> N` du **livre entier** (séances hors extrait) | **SPOILER** → ré-ancrer sur titres de morceaux |
| Capstone | `assemblerAncrageLivre` | livre entier | **SPOILER total** → remplacer par `CarteParcours` |

**Surface B — cohérence de NUMÉROTATION** (correction du finding : ne consomme AUCUNE donnée C2, mais N'EST PAS « extract-safe sans changement » comme le prétendait la synthèse) :
| Bloc injecté | Fonction | Où | Fuite en mode C |
|---|---|---|---|
| Synthèses précédentes | `assemblerSynthesesPrecedentes` (l.150) | V1 (l.271) + VF (l.564) | formate « Semaine {semaine_index} » en **ordinal d'origine** → affiche « Semaine 3, Semaine 5 » (lacune 4) → révèle l'extrait |
| Architectures précédentes | `assemblerArchitecturesPrecedentes` (l.483) | VF (l.565) | idem ordinal d'origine |
| Trajectoire diagnostic | `assemblerTrajectoireDiagnostic` (l.1086) | V1 (l.272) + VF (l.566) | idem « Semaine {d.semaine_index} » |

**Correction explicite de la synthèse §7.1/§7.5** : le retour V1 n'est PAS « extract-safe sans changement » et la surface C2 « minimale » ne couvre que la Surface A. La Surface B est un problème **C1-interne** (remap 1..K), sans donnée C2, mais qui doit être traité pour ne pas exposer la lacune. Ce qui reste réellement auto-suffisant : `assemblerAncrageSemaine` (texte de la séance seule, réutilisé tel quel) et le **diagnostic PROF-ONLY** (`chargerReferenceChapitre` par séance + trajectoire centrée-élève ; séance-local, ne consomme rien de C2 — sa restriction fine à l'extrait est un raffinement optionnel, pas un spoiler élève).

### 7.2 Contrat consommé (formes de chaîne, PAS schéma figé — MC4)

En lecture serveur (RLS prof-only, lu via `admin` comme le reste de `aletheia-retours.ts`), la carte-de-parcours doit exposer **les mêmes formes de chaîne** que les assembleurs livre remplacés, pour préserver la cachabilité et les prompts (LD7) :

```ts
interface MorceauParcours {          // ordonnancement des morceaux dans la frise du parcours
  ordreParcours: number              // position croissante du morceau dans CE parcours
  livreId: string
  seances: number[]                  // ordinaux d'ORIGINE des séances du morceau
  titre: string                      // libellé teaser — JAMAIS le contenu (anti-spoiler aval)
}
interface SyntheseMorceau {          // ≈ ReferenceChapitre au niveau morceau → alimente l'AMONT VF
  ordreParcours: number
  these_canonique: string; arguments_cles: string[]; concepts_cles: string[]; synthese_modele: string
}
interface CarteParcours {            // ≈ Capstone au niveau parcours → alimente le CAPSTONE mode C
  fil_conducteur: string
  noeuds: { morceau: string; idee: string }[]
  liens: { de: string; vers: string; relation: string }[]
  statut: 'PENDING' | 'READY' | 'ERROR'   // sert AUSSI de gate per-parcours §8.3
}
chargerCarteParcours(admin, parcoursId):
  { carte: CarteParcours, morceaux: MorceauParcours[], syntheses: SyntheseMorceau[] } | null
```

Le contrat est **structurel** : `SyntheseMorceau` doit produire, une fois concaténée, une chaîne de même granularité que `assemblerAmontVf` ; `MorceauParcours.titre` de même granularité que `assemblerTitresAval`. Tant que Scriptorium remplit cette interface, C1 n'a rien à re-toucher (découplage MC4).

### 7.3 Point de bascule d'ancrage — résolution PAR SÉANCE (correction du finding multi-parcours)

**Problème tranché ici** (findings §4.6/§7.3 et §4.6/§6.6/§7.3/§7.4) : sous l'union multi-parcours (A6, ex. `P1 [1-3]` + `P2 [8-10]` → `exposees={1,2,3,8,9,10}`), un `gouverneParcoursId` **unique** de livre casse l'assembleur (pour la séance 9 quand le gagnant est `P1`, aucun morceau ne la contient → `ordreCourant` indéfini → VF vide/faux). La fonction `parcoursRetenu` au niveau livre est **non-totale/non-déterministe** (la précédence de `resoudreDepuisCandidats`, aletheia-dates.ts:93-99, est PAR SÉANCE, pas par livre). **Décision : l'ancrage se résout PAR SÉANCE, `parcoursRetenu` niveau-livre est supprimé.**

Assembleur mode-C parallèle, renvoyant **exactement** la forme `{amont, semaineCourante, avalTitres}` de `assemblerAncrageVf` :

```ts
assemblerAncrageVfParcours(admin, livreId, classeId, seanceOrigine):
  // 1. Résoudre le parcours DE CETTE séance (pas un gagnant de livre)
  parcoursId = parcoursDeLaSeance(admin, livreId, classeId, seanceOrigine)
  //   = parcours dont un créneau-livre le plus SPÉCIFIQUE (plus petite largeur)
  //     couvre seanceOrigine ; tie-break stable (parcoursId, creneauId) — déterministe
  data = chargerCarteParcours(admin, parcoursId)
  if data == null OR data.carte.statut != 'READY':  return null   // → gate §8, filet echec()

  ordreCourant = ordre du morceau de `data.morceaux` contenant seanceOrigine
  if ordreCourant == undefined:  return null                      // garde dur : jamais d'ancrage faux

  amont      = concat( data.syntheses.filter(s => s.ordreParcours < ordreCourant), trié )
  avalTitres = concat( data.morceaux .filter(m => m.ordreParcours > ordreCourant).titre )
  semaineCourante = assemblerAncrageSemaine(admin, livreId, seanceOrigine)   // RÉUTILISÉ tel quel
  return { amont, semaineCourante, avalTitres }
```

`genererRetourVf` choisit l'assembleur selon `modeExposition(...).mode` : `'C'` → `assemblerAncrageVfParcours` ; sinon → `assemblerAncrageVf` **inchangé**. L'amont devient « morceaux du parcours DÉJÀ lus » (sûr) et l'aval « titres des morceaux à venir » (titres seuls, `T=0` conservé) — la cohérence inter-morceaux voulue par MC3, avec le MÊME anti-spoiler structurel.

**Correction obligatoire du chemin d'écriture (R6, finding §7.3/§7.5/§6.4)** : `genererRetourVf` (retours.ts:509) s'exécute en `after()` détaché, ne dispose que de `eleve_id/scriptorium_livre_id/semaine_index` (SELECT l.523-528) et **n'a pas accès au cookie `eleve_classe`**. La piste « cookie dans le générateur » est **non viable**. Donc :

- `soumettreVf` (actions.ts:149-212) **capture la classe active à la soumission** (cookie disponible dans le contexte requête) et la **passe en argument** au `after()`-scheduled `genererRetourVf(..., classeId)`.
- Ceci est une **touche assumée au chemin d'écriture C1** (signature du générateur + de l'action), 0 migration de données (aucune colonne ajoutée sur `aletheia_travaux`). Elle **corrige les affirmations « écriture inchangée » de §6.4 et « seul point de contact = aiguillage » de §7.5**.
- **Élève multi-classes, même livre, extraits DIVERGENTS** : deux classes exposant des extraits différents rendent l'ancrage ambigu et fuyant. Traité comme **MALCONFIG** (masquer + journaliser côté prof), jamais un choix de classe arbitraire.

**Cadre numérique du prompt VF (Surface B, §7.1)** : mêmes placeholders, valeurs mini-livre. Recommandation — remap **homogène** des quatre blocs numérotés via `numeroAffiche` (module `utils/aletheia-extrait.ts`, A8) : `semaine_courante_N := position 1..K`, `total_semaines := K` (jamais `livre.nb_semaines`), ET `assemblerSynthesesPrecedentes` / `assemblerArchitecturesPrecedentes` / `assemblerTrajectoireDiagnostic` rendus **mode-C-aware** (restreints à `exposees ∩ .lt`, ordinaux remappés en 1..K). Alternative cohérente : conserver l'ordinal d'origine PARTOUT (abandon de l'illusion 1..K côté IA, zéro remap) — mais laisse voir la lacune. **Décision PO Q5 (§11) : remap homogène (recommandé, cache l'extrait) vs ordinal d'origine partout.** Dans les deux cas, les trois assembleurs de continuité DOIVENT être traités — ne pas les oublier annulerait l'anti-spoiler.

### 7.4 Capstone = carte-de-parcours (MC3) + contrainte de keying

En mode C, la page `[livreId]/capstone` et la tuile planning consomment `CarteParcours` (via `chargerCarteParcours`) au lieu de `chargerCapstoneLivre`. Le type `Capstone` (types.ts, forme `fil_conducteur/noeuds/liens`) est réutilisable ; la vue est généralisable (`noeuds[].chapitre` → `noeuds[].morceau`). Le book capstone (`aletheia_capstone`, `genererCapstone`) reste le mécanisme A/B **intouché** (LD7).

**Contrainte que C2 impose à C1 (finding §4.6/§6.6/§7.4 — ne PAS déférer)** : le VF se résout par séance (§7.3), mais **un capstone est PAR PARCOURS** et ne peut pas représenter une union couvrant 2+ parcours dont §6.6 a pourtant promis le déblocage `K/K`. La résolution ne peut pas être laissée à R3/Scriptorium car elle conditionne le gate capstone de C1 :

- **Décision requise en détection §4/§6** : le mode C **capstone-ready** exige un **parcours gouvernant UNIQUE** pour le couple `(livre, classe)`. Si l'union provient de ≥2 parcours (tranches disjointes non-full), le couple reste **en repli-B** (ou capstone gaté) jusqu'à ce que le chantier Scriptorium définisse un capstone inter-parcours.
- Concrètement : `carteParcoursReady` (§8.3) doit valider qu'il existe **un seul** parcours gouvernant en mode-C ; sinon le gate reste fermé (repli B sûr). Le VF per-séance fonctionne sous union, mais le **capstone** force la mono-carte. Point ouvert §11 (route `[livreId]/capstone` ambiguë si livre dans 2 parcours) — résolu par cette même contrainte mono-parcours.

### 7.5 Frontière nette + invariant LD7

C2 ne fournit RIEN pour V1 (contenu) ni le diagnostic (§7.1). La **dépendance de contenu** C2 = strictement (amont VF, aval VF, capstone). La **cohérence de numérotation** (§7.1 Surface B) est C1-interne, sans donnée C2.

Preuve de non-cassure A/B : mode C n'ajoute que de NOUVEAUX assembleurs branchés par aiguillage sur `modeExposition(...).mode`. Restent **byte-identiques** : `assemblerAncrageSemaine/Vf/Livre`, `genererRetourV1/Vf/Capstone` (chemin A/B), `PROMPT_FEEDBACK_VF_DEFAUT`, `PROMPT_CAPSTONE_DEFAUT`, les overrides `aletheia_params.prompt_*`, les placeholders et la **clé JSON `semaine`**. Garde-fou CI : `git diff` des prompts et du parse doit être vide.

**Découplage (MC4)** : `assemblerAncrageVfParcours` dépend du contrat d'interface §7.2, pas d'un schéma. Points de contact C1↔C2, tous prévus et minimaux :

| Point de contact | Nature | Fichier / fonction |
|---|---|---|
| Aiguillage `mode` | lecture `modeExposition(...).mode` | `data.ts` (nouveau `modeExposition`) → `retours.ts:genererRetourVf`, `genererCapstone` |
| Statut READY | filet `if statut != 'READY' return null` | `retours.ts:assemblerAncrageVfParcours` |
| Capture classe | argument passé à l'`after()` | `actions.ts:soumettreVf` → `retours.ts:genererRetourVf` |
| Remap 1..K | `numeroAffiche` | `utils/aletheia-extrait.ts` → 4 blocs de `retours.ts` |

---

## 8. Activation & gate (mode C inactif tant que C2 absent — MC5)

### 8.1 Objectif

Ne JAMAIS exposer d'extraits avec une IA incohérente (VF ancré livre entier = fuite ; book capstone servi sur un extrait). C1 est codé, mergeable, déployé mais **DORMANT** tant que la carte-de-parcours (C2) n'est pas `READY`. Contrainte dure : le simple **merge de C1 doit être un no-op fonctionnel visible en prod** — y compris pour les livres mal configurés (correction des findings ci-dessous).

### 8.2 Point d'application UNIQUE : le gate DANS `modeExposition` — capte C **ET** MALCONFIG

**Correction majeure (findings §8.4 vs §9.4 et §4.7 vs §8.4/§9.2)** : la synthèse gate uniquement `mode=='C' → 'B'`, mais laisse le retour **MALCONFIG** (`couvertes=∅ ∧ gouverne`) et l'exclusion « exposees vide » **hors gate**. Or aujourd'hui un livre gouverné à couverture vide (créneau `[20-25]` sur 10 séances, ou re-découpe réduisant N) est **exposé en entier** via le repli-B : `livresGouvernesPourClasses` (aletheia-dates.ts:287) ignore les bornes, `resoudreDatesLivre` renvoie des dates nulles, `livresPourClasse` (data.ts) affiche les 10 séances sans échéance. Si C1 masquait ce livre gate-OFF, **le merge ferait DISPARAÎTRE un livre actuellement visible** = régression silencieuse, exactement ce que le dark-launch promet d'éviter.

Donc **le gate englobe les DEUX cas dégénérés** ; sous gate fermé, tout livre gouverné retombe sur le repli-B whole-book actuel :

```ts
// modeExposition(admin, livreId, classeId) — frontière UNIQUE, appelée partout (§5, §7)
S = seancesDistinctes(admin, livreId)                    // DISTINCT scriptorium_documents.semaine
if S == ∅:            return { mode:'A', exposees:[], complet:true }   // livre non découpé — INCHANGÉ (≠ MALCONFIG)
creneaux = creneauxGouvernants(admin, livreId, classeId) // A1 : niveau `gouverne`, bruts, avant filtrage date
directLie = lienDirect(admin, livreId, classeId)         // scriptorium_unite_classes → force B/A (A5)
if creneaux == ∅ and !directLie:  return { mode:'A', exposees:sort(S), complet:true }  // hors parcours

couvertes = union(bornes(creneaux)) ∩ S

// ---------- GATE ----------
if not gateOuvert(admin, livreId, classeId, creneaux):
    // FERMÉ : repli-B STRICT = statu quo prod, pour TOUS les gouvernés, y compris couvertes==∅
    return { mode:'B', exposees:sort(S), complet:true }   // whole-book, IA existante, byte-identique

// ---------- OUVERT ----------
if directLie:                     return { mode:'B', exposees:sort(S), complet:true }   // précédence directe (A5)
if couvertes == ∅ and gouverne:   return MALCONFIG(masquer+journaliser)                 // A7 — UNIQUEMENT gate ouvert
if couvertes == S:                return { mode:'B', exposees:sort(S), complet:true }   // couverture totale / B-distribué
return { mode:'C', exposees:sort(couvertes), complet:false, parcoursUnique: … }        // extrait
```

Conséquences (corrige §4.7/§5.1/§9.4) : MALCONFIG et l'exclusion sont **derrière le gate** ; l'énoncé « effet prod NÉANT » de §8.4/§10 devient exact. Distinguer strictement **S-vide** (livre non découpé, inchangé, affiché avec `semaines:[]`) de **MALCONFIG** (`couvertes=∅ ∧ gouverne`, gaté). Toutes les surfaces (§5, §7) appellent `modeExposition`, jamais la détection brute → gate incontournable.

### 8.3 Mécanisme à DEUX niveaux

```ts
// C1-only :  gateOuvert = mode_c_actif
// C2      :  gateOuvert = mode_c_actif AND carteParcoursReady(...)
gateOuvert(admin, livreId, classeId, creneaux):
  if not lireReglages(admin).mode_c_actif:  return false        // niveau 1 — kill-switch global
  // niveau 2 (dès C2) :
  parcours = parcoursGouvernants(creneaux)
  if parcours.length == 0:  return false
  // capstone mono-carte (contrainte §7.4) : ≥2 parcours → repli B tant que Scriptorium n'a pas d'inter-parcours
  if parcours.length >= 1  and toutes(p => chargerCarteParcours(admin,p)?.carte.statut == 'READY'):
      return true
  return false
```

1. **Kill-switch global** — colonne `aletheia_params.mode_c_actif boolean default false` (A2 ; **seule DDL de C1** : additive, table CONFIG 1-ligne, **jamais** sur `aletheia_travaux` → 0 migration de données ; lue via `lireReglages`, data.ts:129). Tant que `false`, mode C JAMAIS actif → C1 déployable, comportement rigoureusement inchangé. Interrupteur de roulement + arrêt d'urgence (reflip instantané). *Alternative 0-DDL* : env `ALETHEIA_MODE_C_ACTIF` (§11 Q4) — perd la pilotabilité UI prof.
2. **Carte-de-parcours READY (per-parcours, canonique en C2)** — même flag ON, mode C n'est actif pour un couple `(livre, classe)` que si le/les parcours gouvernant(s) ont `CarteParcours.statut == 'READY'` (contrat §7.2) **et** respectent la contrainte mono-carte capstone (§7.4). Sinon → repli B (livre entier + IA existante, cohérent). Granularité fine : mode C s'active parcours par parcours au fil de la production des cartes. **Recommandation** : gate per-parcours canonique dès C2, kill-switch global au-dessus.

### 8.4 État par défaut = prod actuel (dark-launch)

`mode_c_actif=false` ⇒ `modeExposition` renvoie **B pour tout livre gouverné, C ni MALCONFIG jamais produits** ⇒ `livresPourClasse` / `livreAccessible` / `peutAccederSemaine` / `toutesSemainesDone` / `genererRetourVf` se comportent **comme aujourd'hui** (repli-B whole-book, `livresGouvernesPourClasses` inchangé, y compris pour les livres à couverture vide qui restaient exposés entiers). Aucun code A/B modifié dans son **résultat**. Le déploiement de C1 est un **no-op fonctionnel** — condition idéale pour livrer et tester à froid avant C2.

| Surface | Gate OFF (post-merge C1) | Gate ON + carte READY |
|---|---|---|
| Livre entier direct/hors-parcours | inchangé (A/B) | inchangé (A/B) |
| Livre gouverné couverture totale | B (entier) | B (entier) |
| Livre gouverné **partiel** | **B (entier) — statu quo, fuite pré-existante conservée** | **C (extrait)** |
| Livre gouverné **couverture vide** | **B (entier) — comme aujourd'hui, PAS masqué** | MALCONFIG (masqué + journalisé) |
| VF / capstone | assembleurs livre inchangés | `assemblerAncrageVfParcours` / `CarteParcours` |

Contrepartie assumée (A3) : la fuite repli-B (partiel exposé entier) **persiste tant que le gate est off** — mais c'est déjà l'état prod, pas une régression.

### 8.5 Séquence d'activation (réversible)

1. **Merge C1 (flag off)** → prod inchangée (tableau §8.4, colonne gauche).
2. **Audit RUNBOOK R-EXPO** des créneaux-livre partiels préexistants **AVANT tout flip** (§9.6). **Dépendance bloquante, pas recommandation** (finding §9.3/R7) : lister tout créneau **pleine-plage EXPLICITE** `[1-N]` — l'invariant « A/B ne devient jamais C » n'est garanti que pour les bornes `null/null` ; un `[1-5]` sur 5 séances devient un sous-ensemble strict après re-découpe à 10 → bascule silencieuse en C. L'authoring Scriptorium doit **normaliser tout livre-entier en `null/null`** (mitigation hors C1) ; le flip est interdit tant que l'audit n'a pas normalisé ces cas.
3. **Chantier Scriptorium** livre la carte-de-parcours + synthèses (C2) pour un parcours pilote → `CarteParcours READY` (§7.2).
4. **Branchement C2** : `assemblerAncrageVfParcours` (§7.3) + capture classe à la soumission (§7.3) + capstone mode C = `CarteParcours` (§7.4). Vérifier la contrainte mono-carte (§7.4/§8.3).
5. **Flip `mode_c_actif=true`** après audit + **test élève réel**. Les couples `(livre, classe)` dont le parcours a une carte READY passent en mode C exposé ; les autres restent en repli B (jamais de fuite d'extrait sans carte). **Rollback = reflip à `false`** (retour immédiat au livre entier, 0 donnée touchée, `aletheia_travaux` jamais réécrit).

## 9. Migration & sûreté prod

### 9.1 Invariant de sûreté — données élève intangibles
- **0 migration de données.** Aucune colonne renommée, aucune ligne réécrite. `aletheia_travaux` (données réelles PROD, index `semaine_index` = ordinal d'origine, contrainte UNIQUE) n'est JAMAIS touché — ni `semaine_index`, ni `statut`, ni contenu (renumérotation purement d'affichage, §6.1). Mode C n'insère / ne met à jour / ne supprime AUCUNE ligne de travail. La renumérotation 1..K se lit, ne s'écrit pas.
- **Seul DDL** : `aletheia_params.mode_c_actif boolean default false` (additive, idempotente, réversible par `DROP COLUMN`, sur une table CONFIG 1-ligne déjà lue par `lireReglages`, data.ts:129). Les tables de la carte-de-parcours = chantier C2 (Scriptorium), hors ce SPEC.
- Le reste = extensions de TYPES TS (`LivreAletheia.mode`, `SemaineLivre.numero`) + module pur `utils/aletheia-extrait.ts` + fonctions `modeExposition` / `creneauxGouvernants` — additifs, aucun effet tant que le gate est fermé (§9.2).

### 9.2 Non-régression stricte des modes A/B — preuves
1. **Détection** : A/B ont `exposees == sort(S)` (§4.3 branches a/b et union = S) → toutes les fonctions d'exposition se comportent comme avant.
2. **Gate fermé par défaut** (§8.4) : sous `mode_c_actif = false`, `modeExposition` renvoie **mode B (livre entier, `exposees = sort(S)`)** pour **TOUS** les livres gouvernés, **y compris le cas dégénéré `couvertes = ∅`** (créneau hors-plage, re-découpe réduisant N). Voir §9.4 : le traitement MALCONFIG est **lui aussi gaté**. Conséquence : le simple merge de C1 est un NO-OP fonctionnel à l'octet près — aucun livre aujourd'hui visible (même mal configuré) ne disparaît ni ne rétrécit. Le passage à C est un opt-in explicite (flag ON + carte READY).
3. **Renumérotation** : `numeroAffiche(o) == o`, `dansExtrait(o) == true`, `seancesExposees == sort(S)` quand `exposees = [1..N]` → affichage A/B byte-identique.
4. **IA** : mode C n'ajoute que des assembleurs parallèles branchés par aiguillage ; prompts / placeholders / clé JSON `semaine` / fonctions A/B inchangés (LD7, §7.5). ⚠️ La surface IA réelle est plus large que « amont/aval VF » : les blocs numérotés `syntheses_precedentes` / `architectures_precedentes` / `trajectoire_diagnostic` restent en ordinal d'origine (voir §11 R9 et §10 C2.1) — mais tant que le gate est OFF, ces blocs n'entrent JAMAIS en jeu (aucun livre en mode C).
5. **Résolveur de dates, `livreAccessible`, `semaineLivre`, machine à états, chemins d'écriture (`soumettreV1/soumettreVf/relancer`)** : INCHANGÉS sous gate OFF.

### 9.3 La détection ne reclasse un livre entier en C que sous conditions — invariant CONDITIONNEL
La formulation « un livre entier (A/B) ne peut JAMAIS devenir C » est **fausse en toute généralité** (contre-épreuve F1) et doit être requalifiée. Trois verrous protègent le cas nominal :

| Verrou | Mécanisme | Couvre |
|---|---|---|
| (1) Précédence directe | `unite_classes` → B/A (§4.4, A5) | Livre lié directement à la classe |
| (2) Couverture totale | union ⊇ `S` → B (couvre B-distribué, §4.3) | Créneaux dont l'union égale toutes les séances |
| (3) Créneau `(null,null)` | bornes ouvertes → couvre tout → B | « Livre entier » posé sans bornes |

**Trou résiduel (F1, non couvert par les 3 verrous).** Un créneau à **bornes EXPLICITES pleine plage `[1-N]`** vaut « livre entier » à l'instant T, mais si le prof **re-découpe le livre en N' > N séances**, alors `couvertes = {1..N} ⊊ S = {1..N'}` → bascule **silencieuse** en mode C, n'exposant plus que `1..N`. Aucun des trois verrous ne s'applique (pas de lien direct ; couverture rompue par la re-découpe ; bornes non `(null,null)`). La détection §4 **ne peut pas** distinguer « `[1-N]` = livre entier » de « `[1-N]` = extrait ».

**Invariant requalifié (CONDITIONNEL).** `mode == 'C' ⇒ couvertes ⊊ S ∧ ¬direct ∧ mode_c_actif`, **sous réserve que tout livre entier gouverné soit posé en bornes `(null,null)`** (normalisation authoring). Deux garanties à poser :
- **Normalisation authoring = dépendance BLOQUANTE** (pas seulement recommandée) : l'authoring Scriptorium doit écrire « livre entier » en `(null,null)` et non `[1-N]`. Tant que ce n'est pas garanti, l'audit R-EXPO (§9.6) doit lister **tout créneau-livre full-range explicite `fin == N_courant`** avant flip.
- **Garde de détection optionnelle** (si l'on veut fermer le trou côté C1, sans dépendre de l'authoring) :

```ts
// Un créneau explicite qui couvre EXACTEMENT tout le livre courant
// est traité comme (null,null) → mode B, insensible à une re-découpe future.
function estFullRangeExplicite(c: {debut:number|null, fin:number|null}, N: number): boolean {
  return c.debut != null && c.fin != null && c.debut <= 1 && c.fin >= N;
}
// Dans modeExposition : si UN créneau gouvernant est full-range explicite (ou (null,null)) -> mode B.
```

Invariant testable renforcé (§9.5) : aucun livre dont un créneau gouvernant est full-range (explicite ou ouvert) ne peut avoir `mode == 'C'`.

### 9.4 Cas dégénéré MALCONFIG — GATÉ (correction F2/F8)
Un livre `couvertes = ∅ ∧ gouverne` (tranche hors plage, ex. `[20-25]` sur 10 séances, ou re-découpe réduisant N sous la borne basse) est **aujourd'hui exposé EN ENTIER** par le repli-B : `chargerCandidats` calcule `gouverne = true` **avant** tout filtrage de date (aletheia-dates.ts:~199), `resoudreDatesLivre` ne date rien mais `gouverne` reste vrai, et `livresPourClasse` (data.ts:76-88) affiche toutes les séances sans échéance.

Le masquer inconditionnellement (comme le proposait le brouillon) **casse la promesse de dark-launch** : au merge de C1, gate OFF, ce livre visible DISPARAÎTRAIT → régression prod silencieuse. **Décision corrigée** :

- **Gate OFF** : MALCONFIG **retombe sur le repli-B actuel** (livre entier, `exposees = sort(S)`, dates nulles) — comportement prod inchangé. Le retour MALCONFIG n'existe PAS tant que le flag est fermé.
- **Gate ON** : le livre `couvertes = ∅ ∧ gouverne` est **retiré de `livresPourClasse` + journalisé** (console serveur ; idéalement signal prof, §11 Q6). JAMAIS de repli vers livre-entier (ce serait la fuite qu'on interdit une fois le mode C actif), JAMAIS de tuile vide.

L'énoncé du gate (§8.2) doit donc capter **`mode == 'C'` ET MALCONFIG** : les deux retours dégénérés sont neutralisés sous gate OFF.

**Distinction impérative `S == ∅` vs MALCONFIG (F5).** Un livre **non encore découpé** (`S == ∅`, zéro ligne `scriptorium_documents`) renvoie `{mode:'A', exposees:[]}` et doit rester **affiché comme aujourd'hui** (`semaines:[]`, planning vide) — l'exclure serait une régression pendant l'authoring. L'exclusion ne s'applique QU'À `gouverne ∧ couvertes == ∅ ∧ S ≠ ∅`, jamais à `S == ∅`.

### 9.5 Tests de sûreté (harnais `npm test`, cf. `utils/aletheia-dates.test.ts`)
| Famille | Cas |
|---|---|
| `couvre` / couverture | entier / distribué / sous-ensemble contigu / non contigu / bornes ouvertes / hors-plage / full-range explicite |
| `modeExposition` | matrice {direct × parcours × flag} → mode + `exposees` attendus + invariant §9.3 (aucun full-range → C) |
| Renumérotation | bijection `p ↔ o_p` ; `numero == semaine` en A/B ; `dansExtrait` |
| **Gate (crucial)** | (a) `mode_c_actif=false` ⇒ **tout** livre gouverné, y compris `couvertes=∅`, renvoie mode B whole-book (no-op §9.2) ; (b) `mode_c_actif=true` + `semaine ∉ exposees` ⇒ `peutAccederSemaine=false` ; (c) mode C sans carte READY ⇒ livre non exposé (repli B, §8) ; (d) MALCONFIG sous gate ON ⇒ exclu, sous gate OFF ⇒ whole-book |
| **Écriture (F7)** | `soumettreVf` / `validerLectureRetourVf` / `relancerRetour` sur `semaine ∉ exposees` (orphelin) ⇒ **refus serveur** (pas seulement `soumettreV1`) |
| Ordre de garde (F9) | `peutAccederSemaine` : `semaine ∉ exposees` ⇒ `false` **même si `deblocageSequentiel=false`** (le refus précède le `return true` anticipé, data.ts:~160) |
| `S == ∅` (F5) | livre non découpé ⇒ affiché, jamais exclu comme MALCONFIG |
| Créneaux BRUTS (§4.2) | créneau gouvernant SANS date résoluble → compté dans la couverture (ne bascule pas un livre entier en C) ; extrait valide sans date → EXPOSÉ sans échéance (miroir mode-A dateless), ni masqué ni MALCONFIG |

### 9.6 Audit R-EXPO obligatoire avant flip (RUNBOOK)
Le garde-fou R-EXPO déjà noté (commentaire `livresPourClasse`, data.ts) exige d'auditer les créneaux-livre partiels préexistants avant activation. Pour mode C, le RUNBOOK doit recenser **par (livre, classe)** :

1. **Paires `couvertes ⊊ S`** (aujourd'hui exposées EN ENTIER par repli B). Après flip : deviennent C-caché (pas de carte) ou C-extrait (carte READY). Décision PO au cas par cas : poser un lien direct pour forcer B, livrer la carte, ou accepter le rétrécissement.
2. **Créneaux full-range explicites `[1-N]` (F1, BLOQUANT)** : à normaliser en `(null,null)` OU à couvrir par la garde §9.3 AVANT flip, sinon toute re-découpe future bascule le livre en C silencieusement.
3. **Cas MALCONFIG `couvertes = ∅ ∧ gouverne`** : misconfig à corriger (tranche hors plage) — deviendront masqués au flip.
4. **Travaux orphelins (F7 / §11 R2)** : élèves ayant travaillé en repli B des séances qui sortent de l'extrait au flip → vérifier que le verrou d'écriture (§9.5 famille Écriture) est en place dans les **trois** actions avant activation.

Règle d'activation : **n'activer que sur des classes n'ayant pas commencé**, ou avertir le prof. Passage checklist §9 en preview, puis prod, puis test élève réel + revue adversariale.

## 10. Découpage en lots

**C1 — constructible et mergeable MAINTENANT, gate OFF (dark-launch, effet prod NÉANT *à condition que MALCONFIG soit gaté*, §9.4) :**

| Lot | Contenu | Dépend de | Effet prod |
|---|---|---|---|
| **C1.0 — Détection (PUR + I/O) + tests** | module pur `utils/aletheia-extrait.ts` (`numeroAffiche` / `origineDepuisNumero` / `dansExtrait`) ; extraction de `creneauxGouvernants(admin, livreId, classeId)` depuis le niveau `gouverne` de `chargerCandidats` (créneaux **BRUTS**, avant filtrage date — arbitrage A1) + factorisation `seancesDocs` ; `modeExposition` **avec les deux niveaux de gate intégrés** : (a) `mode_c_actif=false` ⇒ mode B whole-book pour TOUS les gouvernés y compris `couvertes=∅` (§9.2/§9.4) ; (b) garde full-range explicite (§9.3, F1) ; colonne `aletheia_params.mode_c_actif` (défaut false) + lecture dans `lireReglages` ; **batterie de tests de non-reclassement** (§9.5). | — | NÉANT (gate off) ; testable en preview par flag forcé |
| **C1.1 — Exposition tranche-aware + renumérotation** | `livresPourClasse` filtre à `exposees` + `numero` + `mode` + `nb_semaines = K` + exclusion MALCONFIG **gatée** (§9.4) ; extension types (`LivreAletheia.mode`, `SemaineLivre.numero`) ; page planning (libellés « Séance {numero} », href garde l'ordinal d'ORIGINE) ; page séance (garde `dansExtrait` → `notFound`, titre par position). Distinction `S == ∅` ≠ MALCONFIG (F5). | C1.0 | dormant (gate off) |
| **C1.2 — Gating serveur (lecture ET écriture) + gate capstone** | `peutAccederSemaine(+classeId)` : refus `∉ exposees` **placé AVANT** le `return true` anticipé `if (!deblocageSequentiel)` (data.ts:~160, footgun F9), puis séquentiel sur l'extrait ; `toutesSemainesDone(+classeId)` sur les séances de l'extrait ; **verrou d'appartenance ajouté aux TROIS actions d'écriture/relance** `soumettreVf` / `validerLectureRetourVf` / `relancerRetour` — **pas seulement `soumettreV1`** (correction F7 : aujourd'hui seul `soumettreV1` appelle `peutAccederSemaine`, actions.ts:~85 ; sans ce verrou un orphelin peut avancer VF→DONE et déclencher un retour IA spoiler) ; propagation `classeId` dans `[semaine]/page.tsx` + `actions.ts` ; capstone mode C : planning ne lie pas `.../capstone`, page `[livreId]/capstone` → `notFound` si mode C. | C1.1 | dormant ; testable preview (flag ON) — **IA encore livre entier → NE PAS activer en prod** (VF/capstone spoileraient) |

**— Frontière de dépendance C2 (chantier Scriptorium) —**

| Lot | Contenu | Dépend de |
|---|---|---|
| **C2.0 — Carte-de-parcours (DÉPENDANCE EXTERNE, HORS ce SPEC)** | Scriptorium livre `MorceauParcours` / `SyntheseMorceau` / `CarteParcours` + génération + UI prof + statut READY, conforme au contrat §7.2. **Prérequis de sémantique de gate à trancher AVANT** : union multi-parcours vs restriction mono-parcours (F3/F11, §11 R3) — décision C1 qui conditionne l'implémentabilité de l'assembleur C2.1. | Chantier Scriptorium + décision R3 |
| **C2.1 — Ré-ancrage IA** | `assemblerAncrageVfParcours` (même forme que `assemblerAncrageVf`) + aiguillage `if mode == 'C'` dans `genererRetourVf` ; `chargerCarteParcours` ; **capture de la classe active à la SOUMISSION** (persistée sur `aletheia_travaux` ou passée à l'`after()`) car le cookie `eleve_classe` est indisponible dans le job détaché (F12, §11 R6) — reconnaître explicitement cette touche au chemin d'écriture ; **rendre mode-C-aware les blocs numérotés** `assemblerSynthesesPrecedentes` / `assemblerArchitecturesPrecedentes` / `assemblerTrajectoireDiagnostic` (ordinal d'origine vs `numeroAffiche`, homogène — F10, §11 R9) ; LD7 (diff prompts / clé JSON `semaine` / parse vide). V1 / diagnostic laissés tels quels (§7.1, arbitrage A4, à confirmer PO Q7). | C2.0 |
| **C2.2 — Capstone = carte-de-parcours** | route / lecture `CarteParcours` ; généralisation de `[livreId]/capstone` (résolution du parcours gouvernant, ambiguïté multi-parcours Q2) ; gate per-parcours (`carteParcoursReady`) branché dans `gateOuvert`. | C2.0 / C2.1 |
| **C-ACT — Activation** | audit R-EXPO (§9.6, incluant full-range explicites BLOQUANT + orphelins) + confirmation prof + flip `mode_c_actif` par classe/parcours ; passage checklist §9 en preview puis prod ; test élève réel + revue adversariale (maillon prioritaire : capture classe active / multi-classes, F12). | C2.1 (+C2.2) |

**Ordonnancement.** C1.0 → C1.1 → C1.2 livrables et déployables immédiatement (dark, gate off) pour dérisquer tôt — **à condition que le gate englobe MALCONFIG** (§9.4), faute de quoi le merge n'est PAS un no-op. C2.1 / C2.2 sont **bloqués** par C2.0 (Scriptorium) ET par la décision R3 (union vs mono-parcours). C-ACT est le SEUL lot à effet visible en prod, après C2.1 (+C2.2) prêts et audit. Le flip est l'unique action qui rend mode C visible.

## 11. Risques & points ouverts

### Risques
- **R1 — Rétrécissement / disparition au flip.** Des livres actuellement vus en entier (partiels → repli B) deviennent C-caché ou C-extrait. Gate off par défaut + audit RUNBOOK (§9.6) + ouverture per-parcours neutralisent ; décision PO cas par cas. Gravité moyenne, maîtrisée.
- **R2 — Travaux orphelins, sûrs SEULEMENT si les écritures sont verrouillées (renforcé, F7).** Un élève ayant travaillé en repli B des séances qui sortent de l'extrait à l'activation garde des `aletheia_travaux` invisibles. La conclusion « comptent pour rien → aucune perte » n'est vraie **que si toute action d'écriture/relance refuse `semaine ∉ exposees`**. Aujourd'hui **seul `soumettreV1` appelle `peutAccederSemaine`** (actions.ts:~85) ; `soumettreVf`, `validerLectureRetourVf` et `relancerRetour` ne gardent que `livreAccessible` + `row.statut`. Un orphelin en `FEEDBACK1_READY` peut donc, via une invocation directe de la server action, passer `soumettreVf` (le garde d'état est satisfait) SANS contrôle d'appartenance → écriture VF hors extrait + `genererRetourVf` ancré livre-entier (`.lt/.gt` sur tout le livre) qui **SPOILE**. **Atténuation obligatoire (C1.2)** : verrou d'appartenance dur dans les trois actions ; n'activer que sur classes non commencées, ou avertir le prof. Gravité relevée à majeur tant que le verrou n'est pas posé.
- **R3 — Extrait chevauchant plusieurs parcours : décision de gate C1, pas seulement angle mort C2 (relevé, F3/F11).** `exposees` unit proprement les tranches de 2+ parcours (ex. P1 `[1-3]` + P2 `[8-10]` → `{1,2,3,8,9,10}`) et §6.6 gate le capstone sur K/K de cette union. **Mais** `modeExposition` ne renvoie qu'UN `gouverneParcoursId` et l'assembleur §7.3 cherche le morceau contenant `(livreId, seance)` dans la carte de CE parcours : pour la séance 9 (parcours P2) avec `gouverneParcoursId = P1`, aucun morceau ne la contient → `ordreCourant` indéfini → amont/aval cassés → **VF incohérent**. De plus `parcoursRetenu` est **non-total au niveau livre** : la précédence de `resoudreDepuisCandidats` (aletheia-dates.ts:93-99) est PAR SÉANCE et dépend de la date résolue — deux séances de l'extrait peuvent élire des parcours différents (F6). C'est une **contrainte dont dépend le gate capstone de C1**, à trancher DANS C1 (pas à déférer en R3-Scriptorium) : soit **restreindre le mode C à un SEUL parcours gouvernant** par (livre, classe) — un livre exposé en extraits par 2 parcours = MALCONFIG ou repli B — soit rendre `exposees` / capstone / assembleur **per-séance** (résoudre le parcours de chaque séance : créneau couvrant le plus spécifique, tie-break stable `(parcoursId, creneauId)`). Aligner §6.6, §7.3, §7.4 sur ce choix ; supprimer ou redéfinir `parcoursRetenu` en conséquence. Gravité majeure.
- **R4 — Fuite si gate niveau 2 mal posé.** Un extrait exposé SANS carte READY ferait fuiter le VF (livre entier). Double garde : `assemblerAncrageVfParcours` renvoie `null` → filet `echec()` dans `genererRetourVf` ET exclusion à l'exposition (§8). Tests obligatoires (§9.5).
- **R5 — Double chargement.** `modeExposition` et `resoudreDatesLivre` appellent tous deux la logique créneaux → **mutualiser `creneauxGouvernants`** par (livre, classe) dans `livresPourClasse` sous peine de doubler les requêtes parcours par livre.
- **R6 — `genererRetourVf` ne peut pas résoudre la classe active en l'état ; cookie indisponible en `after()` (relevé, F12).** Le job s'exécute via `after()` détaché de la requête et ne dispose que de `eleve_id / scriptorium_livre_id / semaine_index` (SELECT retours.ts:~523) — **AUCUNE classe, et le cookie `eleve_classe` n'existe plus dans ce contexte** : la piste « cookie » est non viable. Fournir `classeId` impose de **capturer la classe active à la SOUMISSION** (`soumettreVf` → persistée ou passée à l'`after()`), donc de toucher le **chemin d'écriture C1** — ce qui nuance §6.4 (« écriture inchangée ») et §7.5 (« seul point de contact = aiguillage »). Cas aggravant : élève **multi-classes** exposant des extraits DIFFÉRENTS du même livre → un choix arbitraire ancre le VF sur le mauvais parcours et fait remonter en aval des séances par ailleurs exposées → **spoiler**. La classe résolue DOIT être celle par laquelle l'élève a ouvert la séance. **Dépendance bloquante du contrat C2** (pas « à revoir ») ; maillon prioritaire en revue adversariale ; traiter le cas multi-classes / extraits divergents comme MALCONFIG ou via scoping per-classe du travail.
- **R7 — Créneau `[1..N]` explicite vs `(null,null)` : invariant §9.3 CONDITIONNEL (relevé, F1).** Un « livre entier » posé à bornes explicites full-range bascule en C si le livre est re-découpé plus long — les trois verrous §9.3 ne le couvrent pas. Mitigation : normalisation authoring `(null,null)` = **dépendance bloquante** listée à l'audit R-EXPO (§9.6), OU garde de détection `estFullRangeExplicite` (§9.3). Ne PAS présenter l'invariant comme inconditionnel.
- **R8 — Créneau pointant une séance sans `texte_extrait`.** Le VF échoue déjà ; un extrait peut inclure une séance non ingérée → à signaler au prof à la pose.
- **R9 — Blocs numérotés du prompt exposant la nature « extrait » (relevé, F10).** Au-delà de l'amont/aval VF, trois blocs restent injectés en ordinal d'ORIGINE dans V1 et VF : `assemblerSynthesesPrecedentes` (retours.ts:~150), `assemblerArchitecturesPrecedentes` (~483), `assemblerTrajectoireDiagnostic` (~1086) formatent « Semaine {semaine_index} ». Pour un extrait `{3,5,7}` avec `semaine_courante_N` repositionné en 1..K, le prompt VF contient simultanément « SEMAINE 2 » (position) et « Semaine 5 » (origine) pour la MÊME séance, et la continuité affiche la lacune 3→5 → incohérence + révélation qu'il s'agit d'un extrait. Le retour V1 n'est donc **pas** « extract-safe sans changement ». Décision à étendre à TOUS les blocs numérotés (Q5) : conserver l'ordinal d'origine partout (cohérent, zéro remap) OU remapper les quatre blocs via `numeroAffiche` de façon homogène. À rendre explicite en §7 ; corrige la sous-estimation de surface IA de §7.1/§7.5.

### Questions PO résiduelles
1. **Repli gate-fermé (§8.4)** : mode B (non-régression, expose le livre entier avant C2 — recommandé, arbitrage A3) ou masquer le livre would-be-C jusqu'à C2 ?
2. **Route / clé capstone mode C (§7.4)** : garder `[livreId]/capstone` en résolvant le parcours gouvernant, ou route parcours-scoped ? (un livre dans 2 parcours = 2 cartes → URL par livre ambiguë ; lié à R3.)
3. **Multi-parcours / normalisation bornes (§4.6, R3, R7)** : **trancher union permissive vs restriction mono-parcours AVANT C2** (R3) ; l'authoring doit-il forcer « livre entier » en `(null,null)` (BLOQUANT, R7) et avertir si 2 parcours exposent des extraits disjoints du même livre ?
4. **Granularité du gate (§8.3)** : colonne `aletheia_params.mode_c_actif` (recommandé, pilotable UI, arbitrage A2) ou variable d'env (0 DDL, revert sans migration) ? global seul ou per-parcours dès C2 ?
5. **Framing prompt VF mode C (§7.3, R9)** : `semaine_courante_N` / `total_semaines` = position/K (mini-livre) ou ordinal d'origine/N ? **et les trois blocs numérotés R9** doivent suivre le même choix (à trancher en C2 avec test-retest).
6. **MALCONFIG (§9.4)** : simple journalisation serveur, ou signal prof visible ? (rappel : MALCONFIG n'est actif que gate ON.)
7. **V1 en mode C (§7.1, A4)** : laisser « séance seule » (recommandé, zéro spoiler) ou l'enrichir de la carte-parcours ?
8. **Affordance prof** : indicateur « ce livre est en mode C pour cette classe (extrait de K/N séances) », ou mode purement déduit et invisible côté prof (risque de misconfig silencieuse, R7) ?
9. **Séance hors extrait accédée par URL (§5.2)** : `notFound()` (recommandé) vs écran « pas débloquée » ? — et rappel que le refus doit aussi couvrir les **trois actions d'écriture** (R2/F7).
10. **Travaux orphelins (R2)** : laisser tels quels (recommandé, 0 réécriture) sous couvert du verrou d'écriture, ou proposer au prof une archive/purge ciblée à l'activation ?
11. **Capture de la classe active à la soumission (R6)** : persister `classe_id` sur la ligne de travail à `soumettreVf` (touche assumée au chemin d'écriture) ou passage en argument à l'`after()` ? Traitement du cas élève multi-classes / extraits divergents (MALCONFIG vs scoping per-classe) ?
