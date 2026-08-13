# C8 · L2 — Diagnostic : le bug « Expression comptée deux fois »

*(Item 4 du chantier C8. Constats faits le 13/08/2026 sur le code de `main` et sur la sandbox
`aoakpxxlyvthzueaywna`, en lecture seule. Aucune écriture en base pendant ce diagnostic. Établi par
une lecture principale puis **trois contre-épreuves adversariales indépendantes**, chargées de le
réfuter plutôt que de le confirmer — deux des trois ont entamé le cadrage, aucune n'a renversé le
fait central.)*

## 1. Le résultat, en une phrase

**Le bug n'est pas là où l'énoncé le place, et sa prémisse est fausse.** L'item 4 vient de
`SPEC_Lot5_Fragments.md:154` — « *l'écrit liste aujourd'hui Expression comme section **et** l'inclut
dans Découverte → Expression comptée deux fois* ». Or **le fragment hebdomadaire écrit n'a jamais eu
de section Expression** : ses trois sections notées sont **Découvertes, Sources, Réflexions**. La
ligne qui fonde l'avertissement (`SPEC_Lot5_Fragments.md:47`, « Écrit (fragment hebdo) | Découverte,
Sources, **Expression** ») décrit un écrit qui n'existe ni en code, ni en base, ni dans l'historique.

Il reste néanmoins **un défaut réel de la même famille**, trouvé par la contre-épreuve — mais il est
dans l'**essai**, pas dans l'écrit, et c'est un défaut de **rédaction de prompt**, pas d'arithmétique.

## 2. Ce qui est vérifié, et par quoi

| Affirmation | Vérification |
|---|---|
| L'écrit n'a pas de section Expression | `types/fragments.ts` (`note_decouvertes` / `note_sources` / `note_reflexions`) ; `fragments_analyses` en base : 20 colonnes, aucune « expression » ; le prompt réel en base ne contient **pas une seule fois** la chaîne « expression » (`prompt_evaluation ilike '%expression%'` → `false`) |
| Expression n'est notée qu'à deux endroits, disjoints | `fragments_analyses_orales.note_expression` (oral, 0-4) et `fragments_essai_depot_analyses.lettre_expression` (essai, A-E) |
| Aucun agrégat ne mélange les types de travaux | `utils/sante.ts`, `utils/matrice-pilotage.ts`, `vue-ensemble/page.tsx`, `app/eleve/page.tsx`, `eleve/[eleveId]/page.tsx` : tous ne moyennent que D/S/R. Les notes orales sont délibérément hors de la série « moyenne » (`GraphiqueProgression.tsx`, points isolés) |
| Le seul croisement écrit + oral n'est pas arithmétique | `utils/synthese-semestre.ts` : le /20 est produit holistiquement, le prompt interdit explicitement « une moyenne mécanique des notes 0-4 » |
| La couche d'axes de compétences n'existe pas | 16 tables `fragments_*`, toutes des tables de base ; `pg_matviews` vide ; aucune table/colonne/fonction axe ou compétence ; `components/pilotage/MatriceCompetences.tsx` est un placeholder étiqueté « EN CONSTRUCTION », niveaux à `null` |

## 3. Le vrai défaut, et il est ailleurs

La contre-épreuve a posé la bonne objection : **un double-comptage n'a pas besoin d'une couche
d'agrégation.** Dans ces quatre modules, l'agrégateur est le modèle lui-même, et le double-comptage
peut se produire à l'intérieur d'un seul appel. Sur ce terrain, un cas tient :

**L'essai note deux fois le même construit.** `utils/analyse-essai.ts:32` fait porter à la lettre
**EXPRESSION** la « *qualité de la langue (syntaxe, vocabulaire, **précision conceptuelle**)* » ;
`utils/analyse-essai.ts:36` fait porter à la lettre **CONNAISSANCES** des savoirs « *exacts,
**précis**, et au service de l'argument* ». La précision conceptuelle est pesée dans les deux, sur
deux dimensions **toutes deux notées**. Que ce soit un défaut et non une sur-lecture est prouvé par
le prompt lui-même : il pose une garde explicite sur la paire voisine — « *Distingue bien
argumentation et récitation de connaissances* » (`:34`) — et **aucune** sur celle-ci.

C'est exactement la forme décrite par l'item 4 (« une dimension évaluée à la fois comme section et à
l'intérieur d'une autre section »), et elle porte bien sur Expression. Simplement, elle vit dans
l'essai.

**Et à l'écrit, le déséquilibre est inverse de celui qu'annonce la spec.** La matière « Expression »
y est demandée **deux fois** — `b) LANGUE` et `c) STYLE` — mais en **texte libre**
(`retour_langue`, `retour_style`) : elle est **notée zéro fois**. À l'écrit, Expression est
sous-comptée, pas sur-comptée. Une lecture de la contre-épreuve mérite d'être retenue : une fois la
ligne 47 corrigée, l'avertissement de la ligne 154 **reste valide sur le fond**, car **Réflexions
charge sur Expression tout autant que Découverte** — c'est le mapping section → axes qui est à
écrire, pas une ligne de code à changer.

## 4. Pourquoi ce lot s'arrête ici (règle R7)

Corriger suppose de trancher **ce que Palimpseste mesure**, pas comment il le calcule :

- soit on corrige `SPEC_Lot5_Fragments.md:47` pour qu'il dise la réalité (Découvertes, Sources,
  Réflexions) — et l'item 4, tel qu'il est formulé, se dissout ;
- soit on tient la spec pour la cible, et l'écrit gagne une **section Expression notée** — ce qui
  change ce que l'élève voit, ce qui entre dans toutes les moyennes, et ce que le module déclare
  évaluer ;
- soit on requalifie l'item 4 sur l'essai et l'on **réécrit deux prompts d'évaluation** pour séparer
  la précision conceptuelle de la qualité de langue.

Les trois sont défendables et **aucune n'est technique**. Le plan de rentrée place d'ailleurs
« **tous les prompts IA pédagogiques** » en 🎻 Fable (§5), explicitement hors du modèle standard qui
exécute cette session. La règle R7 dit le reste : « *les décisions se prennent ici ou dans une spec,
jamais en cours de session Code* ».

**Le diagnostic est donc rendu complet ; le correctif attend un arbitrage.** Aucune ligne de code
n'a été modifiée au titre de l'item 4.

## 5. Trouvailles de plomberie, faites au passage

Corrigées dans ce lot (elles relèvent de l'item 6, « la personnalisation n'est plus obligatoire ») :

1. **Trois points d'injection laissaient passer une échelle vide.** `analyse-orale.ts`,
   `analyse-essai.ts` et `synthese-semestre.ts` écrivaient `config?.rubrique ?? RUBRIQUE_DEFAUT` :
   or la colonne accepte la **chaîne vide**, qu'un prof produit en vidant le champ dans l'écran
   Paramètres. Un `??` la laissait passer et envoyait une échelle **vide** au modèle. Passés en
   `.trim() ? … : …`, comme le prompt hebdomadaire.
2. **L'écran Paramètres se trompait sur ses propres variables.** L'aide du prompt **oral**
   n'annonçait pas `{{rubrique}}` alors que le défaut oral l'utilise et n'utilise jamais
   `{{bareme}}`. Et le texte de la rubrique affirmait qu'elle est « importée par les 4 prompts » —
   vrai des **défauts**, faux d'un prompt personnalisé qui ne porte pas le jeton (c'est le cas du
   prompt hebdo réellement en base). Formulations corrigées.

Non corrigées — parquées dans `IDEES_post_rentree.md` :

3. `RUBRIQUE_DEFAUT` et `BAREME_DEFAUT` **sont le même texte**, à l'étiquette près (A-E vs 0-4) : la
   « rubrique partagée » n'apporte rien par-dessus le barème legacy.
4. La même consigne d'exigence est injectée **deux fois dans un même appel** hebdomadaire (une fois
   par l'échelle, une fois en clair dans le prompt), en deux notations concurrentes.
5. `{{echelle_lettres}}` est **du code mort** : le jeton est absent de `PROMPT_ESSAI_DEFAUT` et la
   colonne est `NULL` en base — le champ prof « Échelle de lettres » n'atteint aucun prompt. *(Déjà
   signalé par l'audit du 02/07, toujours ouvert.)*
6. `{{rubrique}}` n'atteint **pas** le prompt hebdo réellement en base (qui porte `{{bareme}}`) : la
   rubrique partagée est, pour l'écrit en production, sans effet.
7. La moyenne de classe de `vue-ensemble` est **poolée** (`moyenne([...d, ...s, ...r])`) et non la
   moyenne des trois moyennes de section : une section moins renseignée pèse moins.

## 6. Ce que la contre-épreuve a corrigé dans la première lecture

Par honnêteté de méthode, les points où le premier relevé était fautif — tous rectifiés ci-dessus :

- son titre affirmait qu'une couche d'agrégation par axes est **la seule** manière de produire un
  double-comptage : **faux**, et c'est ce qui lui a fait manquer le cas de l'essai ;
- il écartait le crochet du barème par un raisonnement invalide (« il s'applique identiquement aux
  trois sections, donc il ne privilégie pas Découvertes ») : appliquer uniformément un descripteur
  **non neutre** ne le neutralise pas ;
- sa preuve historique (`git log -S "note_expression" -- "*.sql"` sans résultat) était une **sonde
  vide** : aucun des 62 `.sql` du dépôt ne contient les noms de notes de Fragments, le schéma initial
  du module n'ayant jamais été commité comme migration. L'absence portait sur le corpus SQL, pas sur
  l'histoire de l'écrit ;
- sa requête catalogue sur « express » remontait **trois** colonnes, pas deux.

Le fait central — pas de section Expression à l'écrit, aucun double-comptage arithmétique — a été
rétabli sur d'autres preuves, dont la plus forte : le prompt réel en base ne contient pas le mot.
