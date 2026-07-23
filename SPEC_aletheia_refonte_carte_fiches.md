# SPEC — Refonte carte + fiches de lecture Aletheia, et bascule du retour VF sur le contexte structuré

> Statut : proposé — en attente d'implémentation. **2 revues adversariales** (§ 12 : passe 1 = contexte VF ; passe 2 = carte intelligente / Lot C+).
> Périmètre : `utils/aletheia-retours.ts`, `app/prof/scriptorium/actions.ts`, `app/prof/scriptorium/CarteArchitectureLivre.tsx`, `app/eleve/modules/aletheia/types.ts`, `app/eleve/modules/aletheia/[livreId]/capstone/page.tsx`, `app/prof/aletheia/FormulaireParametresAletheia.tsx`, affichage élève VF.
> **Aucun SQL** (`contenu` jsonb → additif). Migration = **régénération** des artefacts existants.

---

## 0. TL;DR

1. **Lot A (Q1)** — La `référence` (prof-only) devient une **fiche de lecture par chapitre** : `+concepts_cles[]` + `+synthese_modele` (≤ 200 mots, registre élève).
2. **Lot B (Q1 — coût, gain marginal)** — `synthese_modele` **pré-générée 1×** et réutilisée par le VF (prompt allégé) quand dispo, sinon générée. **Faible risque** (§ 4) → après mesure du Lot C.
3. **Lot C (Q2 — gros gain)** — Le retour VF n'injecte plus le **livre entier** (~60 k tokens) mais **fiches amont (< N) + texte intégral semaine N + titres aval seuls**. ⚠️ aucune **prose** livre-entier (ni carte, ni `fil_conducteur`). Appel rendu **cachable**.
4. **Lot C+ (option « carte intelligente » — le plus complexe, gain qualité pas coût)** — La carte est enrichie (`+semaine` sur les nœuds) et alimente le VF, **2 volets** : **amont** = `architecture_amont` via des **liens RÉTROSPECTIFS uniquement** (tardif → antérieur, ≤ N), **résolu par les nœuds**, **validé en code** (le *label* encode le livre entier → prospectifs bannis) ; **aval** = `architecture_aval_jalons` via des **pointeurs** (existence d'un lien N→futur + **titre** de destination, **sans** label ni contenu) → jalons « on en reparle à la semaine k ». ⚠️ Contenu aval hors contexte (pas d'invention possible), mais le **couplage point↔chapitre** reste une info de structure → **teaser assumé** : plafonné (≤ 2), sans `idee` holistique, adouci en bord de livre. **Recommandation : livrer C, mesurer, n'implémenter C+ que si le besoin se confirme.**

Gain coût (Lot C) : VF divisé par **~4 garanti**, **jusqu'à ~7×** avec cache. Lot C+ : qualité/cohérence (le même graphe alimente la capstone élève et le retour hebdo), coût ≈ nul. Détail § 8.

---

## 1. État actuel (référence de code)

Fichier central : [`utils/aletheia-retours.ts`](utils/aletheia-retours.ts). Modèle : `claude-sonnet-4-6` (`:12`).

### 1.1 Artefacts livre-niveau (générés 1× par livre)

| Artefact | Génération | Prompt défaut | Table / `contenu` (jsonb) | Audience |
|---|---|---|---|---|
| **Carte** (capstone) | `genererCapstone` (`:578-640`) | `PROMPT_CAPSTONE_DEFAUT` (`:545-571`) | `aletheia_capstone` → `{fil_conducteur, noeuds[{chapitre,idee}], liens[{de,vers,relation}]}` | **Élève** (fin de livre) |
| **Référence** | `genererReferenceLivre` (`:681-716`) | `PROMPT_REFERENCE_DEFAUT` (`:647-663`) | `aletheia_livre_reference` → `[{semaine, titre, these_canonique, arguments_cles[]}]` | **Prof-only** (diagnostic) |

⚠️ La **carte révèle TOUT le livre** (`:545` : « expliciter PLEINEMENT tous les liens, y compris ce qui n'était esquissé que comme jalons » ; `fil_conducteur` = fil directeur du livre, `:557`). C'est pourquoi la page capstone élève est **verrouillée** jusqu'à toutes semaines DONE ([`capstone/page.tsx:21-23`](app/eleve/modules/aletheia/[livreId]/capstone/page.tsx)). **Conséquence Lot C/C+** : aucune **prose** livre-entier ne doit entrer dans un contexte VF de semaine intermédiaire ; et même un **lien amont↔amont reste sémantiquement global** (son label fut écrit en connaissant la fin) — d'où les gardes du § 5.5.

Génération depuis [`assemblerAncrageLivre`](utils/aletheia-retours.ts:390) = **texte intégral** (un bloc `## Semaine X — titre (chapitres)` par semaine).

### 1.2 Retour VF (par élève × par semaine — appel cher, non caché)

- [`genererRetourVf`](utils/aletheia-retours.ts:445), prompt `PROMPT_FEEDBACK_VF_DEFAUT` (`:320-385`), site `:499-504` (`max_tokens: 4096`, `temperature: 0`, `messages` direct — **pas de cache**).
- Contexte (`:483-496`) : `{livre_entier}` + saisies V1/VF + `assemblerSynthesesPrecedentes` + `assemblerArchitecturesPrecedentes` (relit `aletheia_travaux.devoilement`) + `assemblerTrajectoireDiagnostic` (calibration prof-only).
- Marqueurs `## Semaine X` → amont (≤ N) / aval (> N) ; aval = *teaser sans révéler* (`:327`). `temperature: 0` anti-fuite aval (`:502`).
- Tâches/sorties (`retour_vf` jsonb) : `synthese_modele`, `ajouts_verifies`, `nuances_et_erreurs`, `architecture_amont[]` (tâche 4, `:366`), `architecture_aval_jalons[]` (tâche 5, `:367`). Les 2 dernières → `devoilement` (`:524-530`).
- **Garde** `if (!retourVf.synthese_modele.trim()) throw 'Retour VF vide.'` (`:518`). ⚠️ Lot B (§ 4).
- Affichage : `synthese_modele` via `ValidationLecture` ([`[semaine]/page.tsx:97-101`]) ; bulle **masquée si vide** ([`VueRetours.tsx:88`]).

### 1.3 Caching & coût (existant)

- [`coutMessage`](utils/cout-api.ts:15) **cache-aware** : input ×1, output ×1, cache read ×0,1, write 5 min ×1,25, write 1 h ×2. `PRIX_INPUT = 3/1M`, `PRIX_OUTPUT = 15/1M`. Persistance `enregistrerCoutApi('aletheia', cout)` → `api_couts`.
- `messagesAvecCache(prompt, ttl='1h')` (`:110`) découpe au `CACHE_BREAK` (1 `cache_control`). **TTL `'1h'` → write ×2,0.**
- Seuls **V1** (`:276`) et **Diag phase 1** (`:814`) cachés. **VF/carte/référence injectent le livre entier sans cache.**

### 1.4 Override prompts & régénération

- `aletheia_params` (singleton `id=1`). « `null` = défaut code ». Helper `nullSiDefaut`.
- Carte+référence : `sauvegarderPromptsScriptorium` (`actions.ts:818-842`, garde `{livre_entier}`). `prompt_feedback_2` : `app/prof/aletheia/actions.ts` ; formulaire [`FormulaireParametresAletheia.tsx:99-101`] documente `{livre_entier}` (⚠️ § 5.4).
- `injecter` (`:92-94`) laisse **littéral** tout token inconnu.
- Garde `amende_par_prof` : `regenererCarteLivre`/`regenererReferenceLivre` (`actions.ts:744-763`) → `{needsConfirm:true}` si édité + `!force` ; édition main pose `amende_par_prof:true`.
- **Diagnostic ne lit QUE `these_canonique` + `arguments_cles`** (phase 2, `:820-829`, `parseReference` `:665-677` **ignore les clés inconnues** → ajouts additifs sûrs).

---

## 2. Objectifs & décisions

| # | Décision | Justification |
|---|---|---|
| D1 | **Carte = un seul artefact enrichi** : `+semaine` sur les **nœuds** ; `relation` = label court contrôlé. Rendu **élève concis** (sous-ensemble actuel, inchangé) / **prof détaillé**. | Permet le pilotage VF sans 2ᵉ génération IA, écran élève court conservé. Additif → aucun SQL. |
| D2 | Fiche de lecture dans la **référence prof** : `+concepts_cles[]`, `+synthese_modele`. | Additif jsonb, ne casse pas le diagnostic. |
| D3 | `synthese_modele` pré-générée, réutilisée par le VF si dispo, sinon générée. **Lot B = faible risque, marginal** → après mesure du Lot C. | Gaspillage marginal supprimé + cohérence, filet conservé. |
| D4 | Contexte VF = **fiches amont (< N)** + **texte semaine N** + **titres aval**. **Aucune prose livre-entier.** | Coût ↓, scaling, anti-spoiler renforcé. |
| D5 | VF **cachable** (préfixe livre-niveau identique par semaine). | Économie si ≥ 2 rendus dans le TTL. |
| D6 | **Aucun SQL.** Migration = régénération (référence **et** carte). | jsonb additif. |
| D7 | **La carte alimente le VF** (Lot C+), 2 volets : **amont** = liens **rétrospectifs** (tardif → antérieur, ≤ N), semaine **résolue par les nœuds**, prospectifs **exclus en code** ; **aval** = *pointeurs* (existence d'un lien N→futur + **titre** de destination, **sans** label `relation` ni contenu). | Qualité/cohérence. Amont borné par validation code ; aval = **teaser borné** (contenu aval absent, mais couplage/cardinalité plafonnés, `idee` holistique non injectée). |

**Valeur** : Lot C >> Lot A > Lot C+ > Lot B. **Déploiement** : A → C → (C+) → (B). C+ et B sont des couches **sur** un Lot C fonctionnel. Au sein de C+, le **volet aval (pointeurs)** est moins risqué que le **volet amont (labels)** et peut être priorisé — mais il reste un **teaser** à valider sur pilote (§ 5.5).

---

## 3. Lot A — Enrichir la référence en « fiche de lecture » (Q1)

### 3.1 Schéma JSON (additif, aucun SQL)

```jsonc
[{
  "semaine": 1, "titre": "...",
  "these_canonique": "...",                 // canonique / prof (diagnostic)
  "arguments_cles": ["...", "..."],         // canonique / prof (diagnostic)
  "concepts_cles": ["...", "..."],          // NOUVEAU — 3 à 6 notions (terme + glose courte)
  "synthese_modele": "..."                  // NOUVEAU — ≤ 200 mots, REGISTRE ÉLÈVE + tutoiement (SEUL champ vu par l'élève)
}]
```

> ⚠️ Fiche à **deux registres** : `these_canonique`/`arguments_cles`/`concepts_cles` = **prof (jamais montrés)** ; `synthese_modele` = **seul champ affiché à l'élève** → registre élève + tutoiement.

### 3.2 Points de code à toucher (sinon champs droppés)

1. **Type** `ReferenceChapitre` — [`types.ts:108-113`](app/eleve/modules/aletheia/types.ts:108) : `+concepts_cles`, `+synthese_modele`.
2. **`parseReference`** — [`aletheia-retours.ts:665-677`](utils/aletheia-retours.ts:665) : lire les 2 clés.
3. **`enregistrerReferenceLivre`** — [`actions.ts:790-799`](app/prof/scriptorium/actions.ts:790) : recopier les 2 clés.
4. **UI `EditeurReference`/`SectionReference`** — [`CarteArchitectureLivre.tsx:287-316`] / `:145-245` : champs + affichage. **`synthese_modele` étiquetée « 👁 VU PAR L'ÉLÈVE — registre élève, tutoiement »**, distincte des champs canoniques.

### 3.3 Prompt `PROMPT_REFERENCE_DEFAUT` (`:647-663`)

Produire `concepts_cles` + `synthese_modele`, garder `{livre_entier}` + `{structure_semaines}`. ⚠️ Le prompt référence **ne contient PAS** le bloc REGISTRE → **AJOUTER** une consigne de registre élève + tutoiement **spécifiquement** pour `synthese_modele` (le reste reste canonique).

### 3.4 Carte → voir Lot C+ (§ 5.5). Rendu élève reste concis.

---

## 4. Lot B — Réutiliser la synthèse modèle (faible risque, gain marginal)

Seule casse runtime = `synthese_modele` absente/vide au VF (improbable, couverte). Les autres points = une **modif obligatoire** (garde `:518`) et une **nuance qualité** (registre), traités.

### 4.1 Branchement conditionnel dans `genererRetourVf`

```
fiche = chargerReferenceChapitre(admin, livreId, semaine)   // :718
si fiche?.synthese_modele NON vide :
    prompt = PROMPT_FEEDBACK_VF_SANS_SYNTHESE  // tâche 1 + clé synthese_modele retirées
    retourVf.synthese_modele = fiche.synthese_modele         // réinjection AVANT la garde :518
sinon (fiche absente OU synthese_modele vide) :
    prompt = PROMPT_FEEDBACK_VF_DEFAUT         // variante complète (génère synthese_modele)
```

> ⚠️ **Dépendance Lot A** : `chargerReferenceChapitre`/`parseReference`/`ReferenceChapitre` doivent exposer `synthese_modele` (§ 3.2) — sinon `fiche?.synthese_modele` est `undefined` → **branche complète permanente** (pas de casse, mais le gain B ne se matérialise jamais, silencieusement). L'ordre A→…→B couvre la dépendance ; l'invariant est rappelé ici car le fallback masque l'oubli.

### 4.2 Garde `:518` à réécrire (obligatoire)

En branche allégée le modèle ne produit plus `synthese_modele` → réinjecter la fiche **avant** `:518` **et** changer le critère de « vide » vers un champ réellement produit (`ajouts_verifies`/`nuances_et_erreurs`/`architecture_amont` tous absents).

### 4.3 Override `prompt_feedback_2`

Branchement entre **2 constantes** ; l'override prof ne vaut que pour la variante complète. *(Alternative : un seul prompt gardant la tâche, et on **écrase** `synthese_modele` par la fiche quand elle existe — pas d'économie de tokens output, mais plus simple. À trancher vu le gain marginal.)*

> **Recommandation** : A + C, **mesurer**, puis décider de B.

---

## 5. Lot C — Bascule du contexte VF (Q2)

### 5.1 Nouvel assembleur `assemblerAncrageVf`

```ts
export async function assemblerAncrageVf(
  admin: Admin, livreId: string, semaine: number,
): Promise<{ amont: string; semaineCourante: string; avalTitres: string; liensCarte: string }>
```

- **amont** (semaines **< N**, depuis `aletheia_livre_reference`) : par `k < N`, `## Semaine k — titre`, `Thèse`/`Arguments`/`Concepts`. **Pas de carte, pas de `fil_conducteur`.** *(Option : `synthese_modele` des < N si `architecture_amont` souffre — § 9 #2.)*
- **semaineCourante** : `assemblerAncrageSemaine` (`:133`) = **texte intégral** semaine N.
- **avalTitres** : pour `k > N`, **uniquement** `## Semaine k — titre`.
- **liensCarte** : scaffold dérivé de la carte (Lot C+, § 5.5), **2 sections** — **amont** (liens rétrospectifs validés) + **pointeurs aval** (existence d'un lien N→k + titre de destination, sans label/contenu). **Vide si carte non enrichie** READY.

> **Fallback** : référence pas `READY` → retombe sur `assemblerAncrageLivre`. Journaliser.

### 5.2 Prompt VF (`PROMPT_FEEDBACK_VF_DEFAUT`)

- `{livre_entier}` → **4 zones** : `{amont_structure}`, `{semaine_courante_texte}`, `{aval_titres}`, `{liens_carte}` (= amont rétrospectif **+** pointeurs aval). *(Correspondance 1:1 avec les 4 champs de `assemblerAncrageVf`.)*
- Amont = fiches déjà lues ; aval = titres seuls. `temperature: 0` conservé.
- `genererRetourVf` : remplacer `assemblerAncrageLivre` (`:471`) par `assemblerAncrageVf`, MAJ `injecter(...)` (`:483-496`).
- **Tâche 5** (`:367`) : sans Lot C+, jalons **généraux** (titres seuls). **Avec Lot C+ (pointeurs aval, § 5.5)** : utiliser les pointeurs de `{liens_carte}` pour **nommer la destination** (« ce point, on y revient à la semaine k »), **sans** révéler la résolution.

### 5.3 Caching du retour VF (D5)

- **Réordonner** : livre-niveau (instructions + `{amont_structure}` + `{semaine_courante_texte}` + `{aval_titres}` + `{liens_carte}`) **avant** `CACHE_BREAK` ; par-élève (`{these_*}`…, `{syntheses_precedentes}`, `{architectures_precedentes}`, `{trajectoire_diagnostic}`) **après** (déjà placé après aujourd'hui).
- `CACHE_BREAK` à la frontière puis `messagesAvecCache(prompt)`. Transite par `injecter` comme contenu de variable.
- Préfixe ≈ 8 k > **2 048** (seuil Sonnet 4.6, table Anthropic) ✅. **Byte-identique** entre élèves d'une même semaine — **exige un tri déterministe** de toutes les zones, y compris les **2 sections** de `liens_carte` (amont rétrospectif **et** pointeurs aval) (§ 5.5, étape 5 mutualisée). Sous le seuil = pas d'erreur, juste `cache_read = 0`.
- TTL `'1h'` → write ×2,0.

### 5.4 Migration des overrides prof `prompt_feedback_2`

`injecter` laisse `{livre_entier}` **littéral** → contexte VF **vide** (non ancré + plus d'anti-spoiler). Donc : (1) MAJ hint+warn dans [`FormulaireParametresAletheia.tsx:99-101`] vers les 4 variables ; (2) au chargement, si l'override contient `{livre_entier}` → **retomber sur le défaut** (ou refuser à la sauvegarde) ; (3) prévenir le prof.

### 5.5 Lot C+ (option) — carte intelligente : ancrer `architecture_amont` et les jalons aval sur la carte

> ⚠️ **Le plus complexe et le plus sensible au spoiler, pour un gain de QUALITÉ (pas de coût).** Pour l'amont, la **valeur** (liens étiquetés) **et** le **risque** (labels encodant le livre entier) sont la même chose. **Recommandation : livrer le Lot C, mesurer, n'implémenter C+ que si le besoin se confirme.**

**Deux volets indépendants** : (a) **amont** — liens rétrospectifs nourrissant `architecture_amont` ; (b) **aval** — *pointeurs* nourrissant `architecture_aval_jalons`. Le volet aval est **plus sûr que l'amont** (le modèle n'a pas le texte aval → ne peut pas inventer la résolution) **mais pas exempt de fuite** : c'est un **teaser** qui révèle volontairement « ce point a un écho plus loin » — info de structure neuve, à **plafonner et adoucir** (voir volet aval). Il adresse directement le « donner envie de lire ».

#### Volet amont : liens RÉTROSPECTIFS uniquement, résolus par les nœuds, validés en code

Le filtre « deux extrémités ≤ N » est **nécessaire mais NON suffisant** : le *label* d'une arête amont↔amont a été rédigé en connaissant la fin (« prépare » ⇒ résolution aval). On restreint donc le scaffold à ce qui reste vrai pour un lecteur **arrêté à N** :

- **Orientation rétrospective seule** : on n'injecte qu'un lien « chapitre **tardif** (≤ N) **se rattache à** un chapitre **strictement antérieur** », via une relation d'un **whitelist rétrospectif validé EN CODE** : `approfondit | reprend | répond à | nuance | illustre | prolonge`.
- **Relations prospectives bannies** du scaffold (`prépare | annonce | amorce`, etc.) — non réécrites sans connaître le dénouement → **exclues par le code**, pas seulement par le prompt.
- C'est exactement la matière de la tâche 4 (`architecture_amont`), donnée en **feedback** après la tentative de l'élève (≠ moment socratique, qui est le V1).

#### Semaine résolue par les NŒUDS, jamais stampée sur les liens par le modèle

Risque (revue) : un `semaine_de/_vers` stampé par le modèle peut confondre n° de chapitre et n° de semaine ; une erreur « vers le bas » ferait passer une arête amont↔aval sous le filtre ≤ N. Donc :
- Le modèle stampe `semaine` **sur les nœuds** (vérifié `Number.isInteger` + ∈ semaines connues du livre).
- Les arêtes sont résolues **déterministiquement** : `de`/`vers` → nœud (par libellé) → `semaine`. **Toute arête dont un endpoint ne résout pas à un nœud connu, ou dont la semaine est hors plage, est EXCLUE** (fail-safe vers le non-spoiler).
- Comparaisons `NaN` → `false` : carte non enrichie ⇒ scaffold **vide** (Lot C+ inactif), comportement attendu.

#### Schéma carte enrichi (additif, aucun SQL)

```jsonc
{
  "fil_conducteur": "...",                                  // inchangé (élève, fin de livre)
  "noeuds": [{ "chapitre": "...", "idee": "...", "semaine": 1 }],   // +semaine (vérifié ∈ semaines du livre)
  "liens":  [{ "de": "...", "vers": "...", "relation": "..." }]      // de/vers résolus en semaine VIA les nœuds
}
```

#### Pipeline de normalisation — volet AMONT (étapes 1 & 5 mutualisées avec l'aval)

1. _(mutualisé)_ Résoudre `de`/`vers` → nœud → `semaine` ; **exclure** si non résolu / hors plage. La résolution expose `{semaine, chapitre}` du nœud.
2. Garder les arêtes **incidentes à N** avec **les deux semaines ≤ N**.
3. Exclure : self-loops (`sem_de == sem_vers`) ; arêtes **non rétrospectives** (relation hors whitelist ou orientée vers le futur) ; doublons (clé `{min, max, relation}`).
4. Orienter « chapitre le plus tardif — relation — chapitre antérieur ».
5. **Trier total et déterministe** (`min(sem)`, `max(sem)`, `de`, `vers`) → byte-identique inter-élèves (cache).
6. Émettre un bloc court livre-niveau :
   ```
   ## Connexions d'architecture validées (amont déjà lu)
   - Semaine N « titre » — approfondit — Semaine 2 « titre »
   ```
7. ⚠️ Le **contenu** du label n'a **pas de garde code au-delà du whitelist** : sa non-fuite repose sur le prompt **et** doit être **inspectée au test-retest** (§ 7), pas seulement la liste des arêtes. *(Durcissement possible : whitelist stricte / troncature à l'assemblage.)*

> **Repli** : en cas de doute, **scaffold topologique seul** (« les semaines 2 et 4 se rattachent à la semaine N ») sans relation — sûr, mais à **faible valeur** vs le Lot C (le modèle a déjà toutes les fiches amont). La valeur de C+ tient justement aux **labels rétrospectifs**, d'où le périmètre restreint.

#### Volet aval : jalons par POINTEUR (teaser borné — PAS « sûr par construction »)

> ⚠️ Sûr **uniquement** pour la résolution du contenu aval (le modèle n'a pas le texte de k → ne peut pas l'inventer). Mais les données injectées viennent de la **carte (écrite en connaissant la fin)** → 3 fuites résiduelles à brider : (1) une `idee` de nœud peut être **prospective** ; (2) le **couplage** « point de N ↔ chapitre k » est une info de structure neuve ; (3) le **nombre/cible** des pointeurs trahit la topologie de dénouement. C'est un **teaser assumé**, pas un canal neutre.

Pour donner envie de lire **en bridant** ces fuites :

- **Sélection** : arêtes résolues reliant un nœud **≤ N** (idéalement = N) à un nœud **aval** (semaine k > N). Réutilise résolution + fail-safe + dédup + **tri déterministe mutualisés** (pipeline amont, étapes 1 & 5). Pas de whitelist de `relation` ici (le label n'est pas injecté).
- **Ne PAS injecter l'`idee` du nœud** (générée en connaissant la fin → possiblement prospective). Le **point est nommé par le modèle depuis le texte de la semaine N** (qu'il a en entier via `semaineCourante`) → formulation bornée au vécu d'un lecteur arrêté à N.
- **N'injecter QUE** : l'existence du lien + la **destination** (semaine k + titre, déjà dans `avalTitres`). **Jamais** le `relation` ni le contenu aval.
- **Plafond ≤ 2 pointeurs** par retour (les plus saillants) ; **interdire de révéler une convergence** (≤ 1 pointeur vers une même destination k) — sinon l'agrégat (« 3 fils → le chapitre final ») trahit la structure.
- **Bord de livre** : si l'aval restant est réduit (1-2 semaines) **ou** si la destination est la **conclusion**, basculer en formulation **topologique** (« ce point revient plus loin dans le livre ») **sans nommer la semaine** de dénouement.
- **Vide** si carte non enrichie ou si N = dernière semaine.

```
## Fils à suivre (pointeurs — NE RIEN dire du contenu à venir)
- Un point que tu soulèves cette semaine revient à la semaine k « titre k ».   (le modèle précise le point depuis le texte de la semaine N)
```

Tâche 5 : « À partir de ces pointeurs, formule **au plus deux** jalons : nomme le point (depuis le texte de la semaine courante) et sa destination pour donner envie d'y arriver, **sans** dire comment ça se résout, **sans** révéler que plusieurs fils convergent. »

**Statut** : **moins risqué que l'amont** mais **non exempt** — soumis aux **mêmes** exigences de test-retest (inspecter le **contenu** des pointeurs, pas seulement l'absence de `relation`). Repli toujours dispo : Lot C « titres seuls » (sans pointeur), réellement sûr.

#### Points de code à toucher pour la carte (manquait — analogue au § 3.2)

1. **Type** `CapstoneNoeud` (+`semaine: number`) — [`types.ts:88-89`](app/eleve/modules/aletheia/types.ts:88). (`CapstoneLien` inchangé ; la semaine des liens est **dérivée** des nœuds.)
2. **`genererCapstone`** [`:615-625`](utils/aletheia-retours.ts:615) : **RÉÉCRIRE les deux predicates de filtre** — ils éliminent aujourd'hui les champs additifs par narrowing (`{chapitre,idee}` / `{de,vers,relation}`). Valider/recopier `semaine` sur les nœuds. **Sans cette réécriture, D7 est inopérant** (champs jetés avant écriture en base).
3. **`PROMPT_CAPSTONE_DEFAUT`** [`:545-571`] : produire `semaine` par nœud ; relation ∈ whitelist.
4. **`enregistrerCarteLivre`** [`actions.ts:769-774`] : recopier `semaine` (reconstruit aujourd'hui `{chapitre,idee}` → drop). 
5. **`EditeurCarte`** [`CarteArchitectureLivre.tsx:248-285`] : exposer/figer la `semaine` par nœud (pattern figé de `EditeurReference`, `:295`) ; sinon l'édition main casse le pilotage VF.
6. **Règle de sûreté** : carte `amende_par_prof` sans `semaine` exploitable → scaffold **exclut** ces arêtes (jamais supposées amont).

---

## 6. Migration & rétro-compatibilité

- **Aucun SQL** : jsonb additif. `parseReference` ignore les clés inconnues ; la page capstone élève destructure `{fil_conducteur, noeuds, liens}` et ne lit que `de/vers/relation` → **ignore les nouveaux champs** (vérifié [`capstone/page.tsx:48,92-99`]).
- **Régénération requise** (référence **et** carte) via `regenererReferenceLivre`/`regenererCarteLivre`. ⚠️ Bloquées par `amende_par_prof` → confirmation `force` (perte édition main). Prévenir le prof.
- **Livre non régénéré** : `assemblerAncrageVf` retombe sur le livre entier ; `liensCarte` vide (C+ inactif) ; branche complète du Lot B. → **pas de régression** ; gain après régénération seulement.
- **Ordre** : A → C → C+ → B. Tester sur pilote « NdT » avant partage élève (refonte cassante du schéma JSON ; [[project_aletheia_affinages]], [[project_workflow_deploiement]] : branche + preview).

---

## 7. Anti-spoiler (Q2 + C+)

| Surface | Risque | Traitement |
|---|---|---|
| **Aval** (semaines > N) | réponses à venir | **titres seuls** |
| **Carte / `fil_conducteur`** (prose) | résument le livre entier | **jamais injectés** au VF (D4) |
| **Liens carte — amont** (C+) | le label encode le livre entier (« prépare » ⇒ aval) | **rétrospectifs ≤ N seulement**, **résolus par les nœuds** ; prospectifs/non-résolus/hors-plage/self-loops/doublons **exclus en code** ; label **inspecté au test-retest** (le whitelist seul ne garantit pas la non-fuite) |
| **Liens carte — pointeurs aval** (C+) | couplage point↔k + cardinalité/cible (teaser) | **pointeur seul** : existence + **titre** de destination ; **jamais** `relation`, contenu aval, ni `idee` holistique (point nommé depuis le texte de N) ; **≤ 2**, sans convergence ; bord de livre → topologique sans nommer la semaine ; contenu **inspecté au test-retest** |
| **Fiches amont** (< N) | déjà lues | sûres |
| **Continuité par-élève** (`architectures_precedentes`) | = `devoilement` déjà montré | sûr — inchangé |

- `temperature: 0` conservé.
- **Test-retest obligatoire** ([[project_aletheia_qa_predeploiement]], livre « NdT ») : N retours VF sur semaines **intermédiaires**, compter les fuites aval, **en inspectant le contenu réel des `relation` injectés** (arêtes ET labels prospectifs résiduels). Critère : **0 spoiler** (égaler 0/40).

---

## 8. Coûts — économie réelle (retour VF)

Tarifs (`utils/cout-api.ts`) : input **3 $/M**, output **15 $/M**, cache read **×0,1**, write **1 h ×2,0**.

| Grandeur | Tokens |
|---|---|
| Livre entier (actuel) | ~60 000 |
| Texte semaine | ~4 300 |
| Fiches amont (< N), moyenne | ~1 500 |
| Scaffold liens (C+) | ~200 |
| Titres aval | ~200 |
| Instructions | ~1 500 |
| **Préfixe stable cachable** (instr + amont + scaffold + sem. N + aval) | **~7 700** |
| Par-élève (saisies + continuité + calibration) | ~2 800 |
| Sortie | ~1 200 |

| Scénario | Calcul | Coût/appel |
|---|---|---|
| **Actuel** (livre entier, sans cache) | 64 000 ×3/M + 1 350 ×15/M | **~0,21 $** |
| **Refonte, sans cache** | 10 500 ×3/M + 1 200 ×15/M | **~0,05 $** |
| **Refonte + cache** — 1er élève/sem. (write ×2,0) | 7 700 ×3/M×2 + 2 800 ×3/M + 1 200 ×15/M | ~0,073 $ |
| **Refonte + cache** — suivants (read ×0,1) | 7 700 ×3/M×0,1 + 2 800 ×3/M + 1 200 ×15/M | **~0,029 $** |

**Classe (30 × 14 = 420 retours VF, un livre) :**

| Scénario | Calcul | Total | vs actuel |
|---|---|---|---|
| **Actuel** | 420 × 0,21 | **~89 $** | — |
| **Refonte, sans cache** (garanti) | 420 × 0,05 | **~21 $** | **~4,3×** (~68 $) |
| **Refonte + cache** (chaud/sem.) | 14 × (1 write 0,073 + 29 reads 0,029) | **~13 $** | **~7×** (~76 $) |

- **~4,3×** garanti (contexte ~60 k → ~10 k). **~7×** suppose cache chaud chaque semaine (≥ 2 rendus dans le TTL 1 h ; formule `14 × (1 write + 29 reads)` ; choix TTL ≈ neutre car write amorti).
- **Lot C+** : scaffold ~200 tokens dans le préfixe cachable → **négligeable**. Pré-génération enrichie (fiche + carte) : 1×/livre, négligeable.
- **Par élève / livre** : ~3,0 $ → **~0,7 $ sans cache (garanti)**, **~0,4 $ avec cache**.

> ⚠️ Chiffres dérivés des hypothèses de tokens — **`count_tokens` sur un vrai livre requis avant tout chiffre ferme.** (×0,92 : ~89 $ ≈ ~82 €, ~13 $ ≈ ~12 €.)

---

## 9. Risques & points de vigilance

1. **Édition main perdue à la régénération** (`amende_par_prof`, référence **et** carte) — prévenir le prof.
2. **`architecture_amont` *lossy*** (fiche au lieu du texte). Mitig. : scaffold liens (C+) ; option `synthese_modele` amont ; **QA qualitative** (§ 10).
3. **`architecture_aval_jalons`** : sans C+, jalons généraux (titres seuls). **Avec C+ (pointeurs aval)** : concrétude restaurée, mais c'est un **teaser** révélant de l'info neuve (couplage point↔k, cardinalité). Bridé : pas d'`idee` holistique (point nommé depuis le texte de N), **≤ 2** pointeurs, sans convergence, topologique en bord de livre. Résidus → test-retest (contenu des pointeurs, pas seulement l'absence de label).
4. **C+ — le filtre d'extrémités ne suffit pas** : le label rétrospectif d'une arête ≤ N reste sémantiquement global → **bannir les prospectifs en code** + test-retest sur le contenu des labels (§ 5.5, § 7).
5. **C+ — semaine fiable** : ne jamais utiliser un `semaine` de lien stampé par le modèle → **résoudre via les nœuds**, exclure tout non-résolu (§ 5.5).
6. **C+ — `genererCapstone` DROPPE les nouveaux champs** : réécrire les 2 predicates (`:615-625`), pas seulement « tolérer ». Sinon D7 inopérant.
7. **C+ — édition main carte** : `enregistrerCarteLivre` (`:769-774`) **et** `EditeurCarte` (sans champ semaine) perdent `semaine` → pilotage VF cassé jusqu'à régénération. Étendre les deux (§ 5.5 #4-5).
8. **C+ — cas-limites** : self-loop, N = dernière semaine (relations devenues purement rétrospectives mais maladroites), nœud orphelin, doublons → pipeline de normalisation (§ 5.5).
9. **C+ — byte-identité cache** : exige un **tri total déterministe** des arêtes du scaffold (§ 5.5 #5) — sinon cache miss silencieux (`cache_read = 0`).
10. **Cache froid si rendus étalés** — référence = **~4,3× sans cache**.
11. **Fiche/synthèse absente** — fallbacks (§ 4.1, § 5.1) ; journaliser.
12. **`type`+`parseReference`+`enregistrerReferenceLivre`** étendus **ensemble** (sinon droppés). Idem trio carte (§ 5.5).
13. **Garde `:518`** réécrite avant Lot B (§ 4.2). **Lot B dépend de `parseReference` étendu** (§ 4.1).
14. **Override `prompt_feedback_2` avec `{livre_entier}`** → contexte vide (§ 5.4).
15. **Registre `synthese_modele`** : seul champ vu par l'élève ; label UI + test du chemin d'édition prof.
16. **Réordonnancement prompt VF** : rien de par-élève avant `CACHE_BREAK`.

---

## 10. Plan de test / QA

- [ ] Fiche enrichie (« NdT ») : `concepts_cles` + `synthese_modele` ; synthèse registre élève/tutoiement.
- [ ] Carte enrichie : `semaine` sur **tous** les nœuds, ∈ semaines du livre ; `relation` ∈ whitelist (**vérif manuelle** — pas de garde code de contenu).
- [ ] **Édition main** référence ET carte : champs ajoutés (synthèse/concepts ; semaine) **conservés** après sauvegarde ; `EditeurCarte` a bien un champ semaine.
- [ ] Diagnostic inchangé (phase 2).
- [ ] Capstone élève : rendu **identique** entre livre régénéré (champs enrichis) et non régénéré ; `cap.contenu` lu sans erreur malgré champs en plus.
- [ ] VF branche allégée (fiche pleine) : `synthese_modele` = fiche ; garde `:518` ne bloque pas. Branche complète (fiche absente/vide) : synthèse générée, élève non bloqué.
- [ ] **C+ amont** : section amont de `liensCarte` ne contient **que** des arêtes rétrospectives ≤ N résolues par les nœuds ; **aucune** arête prospective, self-loop, orpheline ou dupliquée ; ordre déterministe (préfixe byte-identique entre 2 élèves, `liens_carte` inclus).
- [ ] **C+ aval (pointeurs)** : section aval = destination (semaine k + titre) **seulement**, **sans** `relation`, contenu aval, ni `idee` holistique (point nommé depuis le texte de N) ; **≤ 2** pointeurs, **pas de convergence** (≤ 1 vers une même k) ; **bord de livre** (N avant-dernière, destination = conclusion) → topologique sans nommer la semaine ; test-retest **inspecte le contenu** des pointeurs.
- [ ] `architecture_amont`/`aval_jalons` produites + persistées (`devoilement`) ; **revue qualitative**.
- [ ] **Anti-spoiler** : test-retest, **0 fuite** (aval + liens carte, contenu des labels inspecté).
- [ ] **Caching** : `cache_read > 0` au 2ᵉ élève ; coût réel via `api_couts`.
- [ ] Override `prompt_feedback_2` avec `{livre_entier}` → fallback défaut. Fallback livre non régénéré : VF ne casse pas.
- [ ] `tsc` propre + build.

---

## 11. Hors scope / différé

- Vue « carte détaillée » exposée à l'**élève** (rendu élève concis ; D1).
- 2ᵉ artefact `carte_prof` à contenu distinct (1 artefact enrichi retenu).
- Mode « scaffold topologique seul » / « liens seuls » (replis, § 5.5).
- Préservation auto des éditions main à la régénération.
- Chunking/retrieval livres très longs.
- Caching carte/référence (1×/livre).

---

## 12. Revue adversariale — findings traités

**Passe 1** (contexte VF — code, anti-spoiler, caching, chiffrage) :

| Sévérité | Finding | Traité |
|---|---|---|
| **Bloquant** | `fil_conducteur`/carte (prose) en amont = conclusion réinjectée | D4, § 1.1, § 5.1, § 7 |
| Majeur | Contradiction Lot B « supprimer la tâche » vs « fallback » | § 4.1 |
| Majeur | Garde `:518` casserait tout VF | § 4.2 |
| Majeur | Fiche présente mais `synthese_modele` vide → VF bloqué | § 4.1, § 6 |
| Majeur | Override prof `{livre_entier}` → contexte vide | § 5.4 |
| Majeur | Écart de registre `synthese_modele` | § 3.1-3.2, § 10 |
| Mineur | TTL/tarif cache, borne coût/élève, amont/aval lossy | § 1.3, § 8, § 9 #2-3 |
| Info / Rejeté | REGISTRE à ajouter ; citation :545 ; **seuil cache = 2 048 (pas 1 024)** | § 3.3, § 1.1, § 5.3 |

**Passe 2** (carte intelligente — Lot C+) :

| Sévérité | Finding | Traité |
|---|---|---|
| Majeur | « 2 extrémités ≤ N » ne neutralise pas la fuite par le **label** (amont↔amont global) | § 5.5 (rétrospectifs seuls), § 7, § 9 #4 |
| Majeur | Label « renverse/répond à/prépare » incident à N peut spoiler la fonction argumentative | § 5.5 (prospectifs bannis, orientation rétrospective), § 9 #4 |
| Majeur | `semaine` de lien stampé par le modèle = non fiable (chapitre ≠ semaine ; erreur basse fuite) | § 5.5 (résolution par les nœuds, fail-safe), § 9 #5 |
| Majeur | `genererCapstone` **DROPPE** les champs (narrowing) — réécriture des 2 filtres | § 5.5 #2, § 9 #6 |
| Majeur | `enregistrerCarteLivre` + `EditeurCarte` perdent `semaine` à l'édition main | § 5.5 #4-5, § 9 #7 |
| Mineur | Cas-limites (self-loop, dernière semaine, orphelin, doublons) | § 5.5 pipeline, § 9 #8 |
| Mineur | Whitelist `relation` non garanti par le code | § 5.5 #7, § 7, § 10 (vérif manuelle) |
| Mineur | Lot B dépend de `parseReference` étendu (sinon fallback silencieux) | § 4.1, § 9 #13 |
| Vérifié OK | 4 zones VF ↔ assembleur ; table coûts ; capstone élève survit ; scaffold livre-niveau cachable | § 5.1-5.2, § 6, § 8 |

**Passe 3** (jalons aval par pointeur, volet aval du Lot C+) :

| Sévérité | Finding | Traité |
|---|---|---|
| Majeur | L'`idee` du nœud est générée en connaissant la fin → peut être prospective → rouvre le canal | § 5.5 volet aval (idee **non injectée**, point nommé depuis le texte de N), § 7, § 9 #3 |
| Majeur | Le **couplage** point↔k est une info neuve (≠ « rien de neuf via `avalTitres` ») | § 5.5, § 7, § 9 #3 (teaser assumé) |
| Majeur | Le **nombre/cible** des pointeurs trahit la topologie (convergence) | § 5.5 (**≤ 2**, pas de convergence), § 10 |
| Majeur | Bord de livre (N avant-dernière, destination = conclusion) divulgue le dénouement | § 5.5 (topologique sans nommer la semaine), § 10 |
| Majeur | Pipeline §5.5 mono-volet : son étape 2 (« 2 ≤ N ») excluait **toutes** les arêtes aval | § 5.5 (pipeline amont + sélection aval propre, étapes 1 & 5 mutualisées) |
| Mineur | « sûr par construction » = surévaluation (garde code inexistante côté aval) | requalifié **teaser borné** partout (§ 0, D7, § 5.5, § 7) |
| Mineur | Orphelins `liens_amont` (§ 5.3) / `liensAmont` (§ 6) après renommage | § 5.3, § 6 → `liens_carte` |
| Info | Priorité non distinguée amont vs aval dans la reco | § 2 (aval priorisable, teaser à valider) |
