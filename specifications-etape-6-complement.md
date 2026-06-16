# Complément à l'étape 6 — Notes suggérées (essai) et synthèse de semestre

> À donner à Claude Code **en même temps que `specifications-etape-6.md`** (ou juste après, si l'étape 6 est déjà construite). Ce document ajoute deux choses : (A) une suggestion de note sur 20 pour l'essai, et (B) une synthèse de fin de semestre des fragments écrits + oraux, avec elle aussi une suggestion de note. Lis d'abord `specifications-etape-6.md`.

## Principe directeur : la note suggérée est une aide au prof, pas un verdict

Dans tout ce qui suit, la note produite par l'IA est **une suggestion, encadrée par une fourchette de ± 2 points, visible par le seul professeur**. Elle ne devient une note que lorsque je la valide. Trois règles non négociables :

1. La suggestion de l'IA (valeur centrale, fourchette, justification) n'est **jamais** montrée à l'élève.
2. La note **validée par moi** n'est montrée à l'élève que si j'active explicitement un interrupteur (par défaut : masquée — je reporte généralement les notes dans le système de l'école).
3. Aucune conversion automatique n'est imposée : je peux valider une note hors de la fourchette suggérée si je le juge bon. La fourchette oriente, elle ne contraint pas.

## A. Note suggérée pour l'essai

### A.1 Champs ajoutés à `essais_analyses`
- `note20_suggeree` (numérique, pas de 0,5 — la valeur centrale proposée par l'IA)
- `note20_min`, `note20_max` (numériques — la fourchette ; calculées par l'application, voir A.2)
- `note20_justification` (texte — pourquoi cette fourchette, en lien avec les quatre lettres)
- `note20_validee` (numérique, nullable — ma note finale)
- `note_visible_eleve` (booléen, défaut `false`)

### A.2 Comment la fourchette est construite
- Nouveau champ `fourchette_points` dans `fragments_config` (numérique, défaut `2`, éditable depuis l'interface).
- L'IA propose **une valeur centrale** sur 20 et la justifie. L'application calcule `note20_min = max(0, centrale − fourchette_points)` et `note20_max = min(20, centrale + fourchette_points)`. Ainsi la largeur de la fourchette est cohérente d'un essai à l'autre et reste sous mon contrôle (je peux la régler à 1,5 ou 2,5 si je veux).
- La note centrale n'est **pas** une moyenne mécanique des quatre lettres : le prompt demande à l'IA une appréciation d'ensemble (une copie peut avoir une argumentation faible mais tenir par ailleurs, etc.).

### A.3 Sur l'écran de validation de l'essai (prof)
- Afficher : les quatre lettres, puis « Note suggérée : **13/20** (fourchette 11–15) » avec la justification dépliable.
- Un champ « Note validée » (curseur ou saisie, pas de 0,5), pré-rempli avec la valeur centrale, que je modifie librement — y compris hors fourchette, avec dans ce cas une discrète demande de confirmation (« hors de la fourchette suggérée, confirmer ? »).
- Interrupteur « Montrer la note à l'élève » (défaut : off).
- La note suggérée et sa fourchette ne sont **jamais** incluses dans ce qui est publié à l'élève ; seule la note validée l'est, et seulement si l'interrupteur est activé.

### A.4 Ajout au prompt de l'essai (annexe A de l'étape 6)
Ajouter une tâche, et un champ au JSON de sortie :

```
### Note suggérée (en plus des quatre lettres)
Propose une note sur 20 (entiers ou demi-points) qui reflète ton appréciation GLOBALE de l'essai, en gardant à l'esprit qu'il s'agit d'un travail manuscrit en temps limité de lycéen. Cette note n'est PAS une moyenne arithmétique des quatre lettres : pondère selon ce qui fait la valeur réelle de cette copie. Justifie-la en 2-3 phrases. Le professeur la traitera comme une simple suggestion qu'il validera lui-même ; ne la présente jamais comme définitive.
```
Champ JSON ajouté :
```
  "note20_suggeree": 0-20,
  "note20_justification": "..."
```

## B. Synthèse de semestre (fragments écrits + oraux) avec note suggérée

But : à la fin de chaque semestre, obtenir pour chaque élève (1) une synthèse rédigée de son travail de fragments — écrits **et** oral — et (2) une suggestion de note sur 20 à ± 2 points que je validerai. C'est la seconde des deux notes que je donne pour les fragments (la première étant celle de l'essai).

### B.1 Table `fragments_semestres`
Créée par le prof.
- `id` (uuid), `label` (texte, ex. « Semestre 1 »), `date_debut` (date), `date_fin` (date), `created_at`.

### B.2 Table `fragments_syntheses`
- `id` (uuid), `eleve_id` (uuid → profiles), `semestre_id` (uuid → fragments_semestres) ; unicité (eleve_id, semestre_id)
- `statut` (enum : `en_cours` | `generee` | `erreur` | `publiee`)
- `synthese` (texte — le bilan rédigé, adressé à l'élève)
- `points_forts` (texte), `axes_progres` (texte)
- `note20_suggeree` (numérique), `note20_min`, `note20_max`, `note20_justification` (texte)
- `note20_validee` (numérique, nullable)
- `notes_prof` (texte, optionnel)
- `note_visible_eleve` (booléen, défaut `false`)
- `perimetre` (texte/jsonb — trace des analyses incluses : quelles semaines écrites, quel oral — pour que je sache sur quoi l'IA s'est appuyée)
- `cout_api` (numérique), `created_at`, `updated_at`, `publiee_at`

RLS : prof tout ; l'élève ne lit sa synthèse que si `statut = publiee` ET `note_visible_eleve` ne conditionne QUE l'affichage de la note (le texte de la synthèse peut être publié sans la note).

### B.3 Périmètre envoyé à l'IA
Pour un élève et un semestre, rassembler **toutes les analyses publiées dont la semaine tombe dans l'intervalle de dates du semestre** :
- le thème / la question ;
- pour chaque fragment écrit du semestre : les trois notes 0–4, le commentaire général, et les retours (langue/style/contenu) ;
- l'analyse orale du semestre si elle existe (notes et retours) ;
- les pistes et leurs statuts ;
- le taux de dépôt sur le semestre (déposés / attendus) et le nombre de retards.

### B.4 Déclenchement (prof)
- Depuis un nouvel écran « Synthèses de semestre » : choisir un semestre, voir la liste des élèves du module, générer la synthèse **élève par élève** ou **pour toute une classe en lot**.
- Mêmes garde-fous qu'ailleurs (relance possible, plafond 3/jour/élève, statut `erreur` géré).

### B.5 Écran de validation (prof)
- Affichage : la synthèse rédigée, points forts, axes de progrès, puis « Note suggérée : **14/20** (fourchette 12–16) » + justification dépliable + rappel chiffré (moyenne des notes 0–4 par section sur le semestre, taux de dépôt, note orale) pour que je situe la suggestion.
- Champ « Note validée » (pré-rempli à la valeur centrale, modifiable, confirmation si hors fourchette).
- Deux interrupteurs distincts : « Publier la synthèse à l'élève » et « Montrer la note à l'élève » (tous deux off par défaut).
- Bouton de publication ; rien n'atteint l'élève avant.

### B.6 Côté élève
- Si la synthèse est publiée : une section « Bilan du semestre » avec le texte de la synthèse, les points forts et les axes de progrès — et la note **uniquement** si je l'ai rendue visible. Présentation sobre et soignée.

### B.7 Prompt de la synthèse de semestre (`fragments_config.prompt_synthese_semestre`, éditable)

```
Tu es l'assistant pédagogique d'un professeur de philosophie et d'humanités dans un lycée français. Tu rédiges le bilan de fin de semestre du travail de « fragments d'érudition » d'un élève : son travail écrit hebdomadaire ET, le cas échéant, sa présentation orale. Tu disposes de toutes les analyses du semestre.

## L'élève
- Thème / question : {{theme}}
- Semestre : {{label_semestre}} ({{date_debut}} – {{date_fin}})
- Taux de dépôt : {{taux_depot}} ; retards : {{nb_retards}}

## Dossier du semestre
{{dossier}}
(Notes 0-4 par fragment, commentaires et retours, analyse orale si présente, pistes et statuts.)

## Tes tâches — tu t'adresses à l'élève en le tutoyant, ton bienveillant et exigeant

### 1. SYNTHÈSE (synthese)
Deux à trois paragraphes qui racontent le chemin du semestre : d'où l'élève est parti, comment son travail a évolué (régularité, qualité des découvertes, des sources, des réflexions), ce que l'oral a montré. Appuie-toi sur des éléments précis et datés. Pas de langue de bois : si le travail a été irrégulier ou en baisse, dis-le avec mesure.

### 2. POINTS FORTS (points_forts) et AXES DE PROGRÈS (axes_progres)
Quelques lignes chacun, concrets et actionnables.

### 3. NOTE SUGGÉRÉE (note20_suggeree, note20_justification)
Propose une note sur 20 (entiers ou demi-points) qui reflète la VALEUR D'ENSEMBLE du travail de fragments sur le semestre — pas une moyenne mécanique des notes 0-4. Pondère selon : la régularité (un travail rendu chaque semaine vaut mieux qu'un sursaut tardif), la trajectoire (un élève qui progresse nettement mérite d'en être crédité), la qualité de fond, et l'oral. Justifie en 2-4 phrases. Cette note est une SUGGESTION que le professeur validera ; ne la présente jamais comme définitive, et n'écris pas la note dans la synthèse adressée à l'élève (elle va uniquement dans le champ prévu).

## Format de réponse — JSON valide uniquement, rien avant ni après :
{
  "synthese": "...",
  "points_forts": "...",
  "axes_progres": "...",
  "note20_suggeree": 0-20,
  "note20_justification": "..."
}
```

## C. Critères d'acceptation (en plus de ceux de l'étape 6)

1. L'analyse d'un essai affiche, côté prof uniquement, une note suggérée et sa fourchette ± 2 ; je peux valider une note différente, y compris hors fourchette (avec confirmation).
2. Tant que je n'active pas « Montrer la note à l'élève », l'élève ne voit aucune note d'essai — ni la suggestion, ni la validée ; quand je l'active, il voit ma note validée et **jamais** la suggestion de l'IA.
3. Je crée « Semestre 1 », je génère en lot les synthèses de la classe ; chaque synthèse s'appuie sur les fragments écrits ET l'oral du semestre (vérifiable via le champ `perimetre`) et propose une note + fourchette.
4. Je peux publier la synthèse d'un élève sans publier la note, ou avec ; les deux interrupteurs sont indépendants.
5. La suggestion de note de l'IA n'apparaît jamais dans une vue élève, pour l'essai comme pour la synthèse (vérifier par manipulation d'URL et inspection des données envoyées au navigateur).
6. Régler `fourchette_points` à 1,5 modifie bien la largeur des fourchettes affichées.
7. `ARCHITECTURE.md` est à jour (champs de note, tables semestre/synthèses, règle de visibilité des notes).

## D. Méthode de travail
Comme toujours : plan d'abord, petites étapes, explications simples. Mini-guide final : valider une note d'essai, créer un semestre, générer et valider les synthèses, gérer la visibilité des notes.
