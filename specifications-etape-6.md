# Spécifications — Étape 6 : L'essai final (module Fragments d'érudition, volet optionnel)

## 1. Contexte

Les étapes 1 à 5 sont en production : fragments écrits hebdomadaires analysés avec mémoire, validation prof, graphiques, tirage au sort et présentations orales évaluées. Lis `ARCHITECTURE.md` et les spécifications précédentes avant de commencer.

Cette étape 6 clôt le module avec un volet **optionnel, activé élève par élève** : l'essai final. Dans mes classes de philosophie (mais pas en HLP), les fragments de chaque élève portent sur une **question** et non un simple thème. En fin de parcours, lors d'une épreuve en classe de 1 h à 2 h, l'élève rédige un essai qui apporte une réponse à sa question, en mobilisant tout ce qu'il a appris depuis le début de ses fragments.

L'essai manuscrit est photographié (par l'élève ou par moi), et l'IA produit une évaluation par **lettres** sur quatre dimensions, plus un recoupement avec le dossier de fragments et une synthèse.

### Vision à plus long terme (à garder en tête dans la conception, sans le construire)
J'envisage un futur module indépendant d'apprentissage de l'essai et de la dissertation de philosophie. Les analyses d'essais produites ici devront pouvoir être lues par ce futur module (et réciproquement). Conséquence pour cette étape : les analyses d'essais vivent dans leurs propres tables, propres et bien nommées, avec `eleve_id` — pas enfouies dans une structure spécifique aux fragments. Documenter ce point dans `ARCHITECTURE.md`.

## 2. Activation par élève

- Nouveau champ booléen `essai_actif` (défaut : `false`) sur `fragments_themes`, et champ texte `question` (la question de l'élève ; pour mes élèves de philo, le thème EST une question — ce champ permet de la formuler précisément, ex. « La technique nous libère-t-elle ? »).
- Côté prof, dans la gestion des thèmes : une colonne « Essai final » (interrupteur) et le champ question. Activation possible en masse par classe (« Activer pour toute la Terminale A »).
- Un élève dont `essai_actif = false` ne voit jamais rien de ce volet. Pour les autres, une section « Essai final » apparaît sur leur page de module le moment venu.

## 3. Les épreuves

### `fragments_essais_epreuves`
Une épreuve = une session d'écriture en classe, créée par le prof.
- `id` (uuid)
- `titre` (texte, ex. « Essai de mi-année », « Essai final — juin »)
- `date_epreuve` (date)
- `duree_minutes` (entier, ex. 60 ou 120)
- `consignes` (texte, optionnel — affiché à l'élève)
- `depots_ouverts` (booléen — j'ouvre le dépôt après l'épreuve, je le ferme quand tout est rentré)
- `created_at`

Il peut y avoir plusieurs épreuves dans l'année (mi-année, fin d'année).

### `fragments_essais`
- `id` (uuid)
- `epreuve_id` (uuid → fragments_essais_epreuves)
- `eleve_id` (uuid → profiles)
- `depose_par` (enum : `eleve` | `prof`)
- `created_at`, `updated_at`
- unicité (epreuve_id, eleve_id)

### `fragments_essais_photos`
Identique à `fragments_photos` (chemin de stockage, ordre), bucket privé `essais`. **Jusqu'à 12 photos** par essai (une épreuve de 2 h peut produire 3 copies doubles) ; réutiliser intégralement le pipeline de compression et de réordonnancement de l'étape 2 — l'ordre des pages est crucial pour un essai, l'interface de réordonnancement doit être très claire (numéros de page visibles).

### Dépôt par l'élève OU par le prof
- L'élève, depuis sa page : « Déposer ton essai » quand les dépôts de l'épreuve sont ouverts.
- Le prof, depuis la vue de l'épreuve : « Déposer pour cet élève » (je ramasse les copies et je les photographie moi-même). Le champ `depose_par` en garde trace.

## 4. L'analyse

### 4.1 Échelle par lettres
Nouvelle entrée `echelle_lettres` dans `fragments_config` (éditable depuis l'interface) :
```
A — Excellent : maîtrise remarquable, dépasse ce qu'on attend d'un lycéen.
B — Bien : travail solide, les attentes sont clairement remplies.
C — Correct : les bases sont là, mais l'ensemble reste limité ou inégal.
D — Insuffisant : des éléments existent, mais l'essentiel n'est pas atteint.
E — Très insuffisant : la dimension évaluée est absente ou défaillante.
```
(Avec les intermédiaires A-, B+, etc. ? Non : lettres pleines uniquement, l'échelle reste lisible.)

### 4.2 Table `essais_analyses`
(Nommage volontairement générique, cf. §1 vision long terme.)
- `id` (uuid), `essai_id` (uuid → fragments_essais, unique), `eleve_id` (uuid)
- `statut` (enum : `en_cours` | `generee` | `erreur` | `publiee`)
- `transcription` (texte)
- `lettre_structure`, `lettre_expression`, `lettre_argumentation`, `lettre_connaissances` (enum A–E)
- `retour_structure` (texte), `retour_expression` (texte), `retour_argumentation` (texte), `retour_connaissances` (texte)
- `retour_parcours` (texte — le recoupement avec les fragments : retours intégrés ou non, richesse mobilisée ou laissée de côté)
- `synthese` (texte — le paragraphe de synthèse)
- `notes_prof` (texte optionnel), `modifie_par_prof` (booléen), `cout_api` (numérique)
- `created_at`, `updated_at`, `publiee_at`

RLS : comme toujours — prof tout, élève uniquement ses analyses publiées.

### 4.3 Contexte envoyé à l'IA
- La question de l'élève, les consignes et la durée de l'épreuve ;
- les photos de l'essai ;
- le dossier de fragments : transcriptions des fragments publiés (toutes si possible, sinon les 8 dernières tronquées à ~2000 caractères + les commentaires généraux des plus anciennes), tous les `retour_langue`, `retour_style` et `retour_contenu` passés (pour vérifier si les défauts récurrents signalés toute l'année sont corrigés), les pistes et leurs statuts, l'analyse orale si elle existe ;
- l'échelle de lettres.

### 4.4 Déclenchement et workflow
Identiques à l'étape 3 : analyse automatique au dépôt, garde-fou 3/jour, écran de validation prof (photos zoomables / analyse éditable / transcription), publication explicite, dépublication possible. Rien n'atteint l'élève sans validation.

## 5. Interfaces

### 5.1 Prof — vue de l'épreuve
- Tableau des élèves avec `essai_actif` : déposé / manquant, statut d'analyse, les quatre lettres une fois l'analyse générée.
- Navigation « élève suivant » pour enchaîner les validations.
- Vue d'ensemble des lettres de l'épreuve : répartition par dimension (combien de A, B, C… en argumentation, etc.) — pour voir d'un coup d'œil la dimension faible de la classe.
- Export CSV de l'épreuve (élève, quatre lettres, statut).

### 5.2 Prof — fiche élève
- L'analyse d'essai rejoint l'historique de l'élève, avec une icône distincte. (Ne pas l'intégrer au graphique de progression des fragments : lettres et notes 0–4 ne se mélangent pas.)

### 5.3 Élève
- Section « Essai final » : la consigne de l'épreuve, le dépôt, puis — après publication — son retour : les quatre lettres avec l'intitulé de l'échelle, les retours par dimension, le retour « ton parcours » (recoupement fragments), la synthèse, la note du prof, la transcription repliée.
- Présentation soignée : c'est l'aboutissement de son année, le retour doit avoir une forme un peu solennelle (sobre, pas de confettis).

## 6. Hors périmètre
- Le futur module « apprendre l'essai/la dissertation » (seule la compatibilité des données est exigée, cf. §1).
- Toute conversion automatique lettres ↔ note chiffrée /20.
- Comparaisons entre élèves visibles par les élèves.

## 7. Critères d'acceptation

1. J'active l'essai pour une classe entière ; un élève HLP (essai inactif) ne voit rien de nouveau ; un élève philo voit la section « Essai final ».
2. Je crée une épreuve, j'ouvre les dépôts ; un élève de test dépose 6 photos dans l'ordre, et moi je dépose à sa place pour un second élève (`depose_par` correct dans les deux cas).
3. L'analyse générée pour un élève ayant un vrai dossier (≥ 5 fragments publiés) : la transcription est fidèle, les quatre lettres sont attribuées, et le retour « parcours » fait explicitement référence à des éléments précis des fragments (au moins : un défaut récurrent signalé dans l'année — corrigé ou non — et un contenu de fragment mobilisé ou oublié dans l'essai).
4. Je modifie une lettre et une section, je publie : l'élève voit la version modifiée, présentée avec l'échelle.
5. La répartition des lettres de l'épreuve s'affiche correctement ; l'export CSV s'ouvre dans Excel.
6. Aucun accès croisé entre élèves (manipulation d'URL) ; un élève ne voit jamais une analyse non publiée.
7. `ARCHITECTURE.md` est à jour, avec la note sur la réutilisabilité des tables `essais_analyses` par un futur module.

## 8. Méthode de travail
Comme toujours : plan d'abord, petites étapes, explications simples, mini-guide final (activer l'essai pour une classe, créer une épreuve, déposer pour un élève, valider, lire la répartition des lettres).

---

# Annexe A — Prompt d'évaluation de l'essai (valeur par défaut, `fragments_config.prompt_evaluation_essai`, éditable depuis l'interface)

```
Tu es l'assistant pédagogique d'un professeur de philosophie dans un lycée français. Un élève vient de rédiger en classe, en temps limité, un essai manuscrit qui répond à la question sur laquelle il travaille depuis le début de l'année à travers ses « fragments d'érudition » hebdomadaires. Tu disposes des photos de l'essai ET de son dossier complet de fragments. Ta force est ce recoupement : tu sais exactement ce que cet élève a appris cette année, et quels retours il a reçus.

## L'élève et l'épreuve
- Question travaillée : {{question}}
- Épreuve : {{titre_epreuve}}, durée {{duree}} minutes. Consignes : {{consignes}}
- IMPORTANT : c'est un travail en temps limité, manuscrit, sans documents. Tes attentes doivent être celles d'un essai de lycéen en {{duree}} minutes, pas d'une copie parfaite rédigée à la maison.

## Dossier de fragments de l'élève
{{dossier}}

## Tes tâches

### 1. Transcription
Transcris intégralement et fidèlement l'essai, pages dans l'ordre. Conserve les erreurs de langue. [illisible] pour les mots indéchiffrables.

### 2. Évaluation par lettres — échelle : {{echelle_lettres}}
Attribue une lettre par dimension, en justifiant chacune dans le retour correspondant. Tu t'adresses à l'élève en le tutoyant ; ton bienveillant, exigeant, précis. Chaque retour fait 1 à 2 paragraphes et cite des passages précis de la copie.

a) STRUCTURE (lettre_structure, retour_structure) : y a-t-il une introduction qui pose le problème, un développement organisé en moments distincts qui progressent, une conclusion qui répond ? Le plan sert-il la question ou est-il une juxtaposition ? Les transitions existent-elles ?

b) EXPRESSION (lettre_expression, retour_expression) : qualité de la langue (syntaxe, vocabulaire, précision conceptuelle), en tenant compte du temps limité. Relève les erreurs récurrentes avec corrections (les 5-8 plus importantes). Si un défaut de langue signalé plusieurs fois dans les fragments de l'année persiste ici, signale la persistance ; s'il a disparu, félicite explicitement.

c) ARGUMENTATION (lettre_argumentation, retour_argumentation) : l'essai répond-il vraiment à la question ? Les affirmations sont-elles soutenues par des raisons ? Y a-t-il un examen d'objections ou de positions adverses, ou un propos unilatéral ? La réponse finale est-elle conquise par le raisonnement ou plaquée ? Distingue bien argumentation et récitation de connaissances.

d) CONNAISSANCES (lettre_connaissances, retour_connaissances) : les savoirs mobilisés (exemples, références, faits, distinctions) sont-ils exacts, précis, et au service de l'argument ? Juge AU REGARD DU DOSSIER : cet élève a accumulé des connaissances précises toute l'année — l'essai en est-il à la hauteur ?

### 3. TON PARCOURS (retour_parcours) — le recoupement avec l'année
Deux à trois paragraphes, en t'appuyant explicitement sur le dossier :
- les retours reçus toute l'année (langue, style, contenu) ont-ils porté leurs fruits dans cet essai ? Donne des exemples précis (« on te signalait depuis novembre X ; ici, ... ») ;
- la richesse de ses fragments est-elle mobilisée ? Nomme ce qu'il a eu raison d'utiliser, et 2-3 éléments forts de ses fragments qui auraient servi sa réponse et qu'il a laissés de côté (sois spécifique : semaine, contenu) ;
- les pistes suivies pendant l'année se retrouvent-elles dans l'essai ?
Garde à l'esprit qu'en temps limité, sélectionner est une vertu : ne reproche pas une absence si l'essai est déjà dense et cohérent ; reproche les absences qui affaiblissent la réponse.

### 4. SYNTHÈSE (synthese)
Un paragraphe de 4 à 6 phrases : le geste d'ensemble de l'essai, son principal mérite, son principal axe de progrès, et une phrase qui relie cet essai au chemin parcouru depuis le premier fragment. C'est la conclusion d'une année de travail : elle doit être juste, et donner à l'élève la mesure de ce qu'il a accompli.

## Format de réponse
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après :
{
  "transcription": "...",
  "lettres": { "structure": "A-E", "expression": "A-E", "argumentation": "A-E", "connaissances": "A-E" },
  "retour_structure": "...",
  "retour_expression": "...",
  "retour_argumentation": "...",
  "retour_connaissances": "...",
  "retour_parcours": "...",
  "synthese": "..."
}
```
