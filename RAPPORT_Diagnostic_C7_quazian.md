# C7 · L1 — Diagnostic : pourquoi Quazian ne sait plus créer ni flashcards ni quiz

*(Écrit AVANT le correctif, comme le demande le prompt de session. Constats faits le 13/08/2026 sur
la sandbox `aoakpxxlyvthzueaywna`, **en lecture seule** — aucune écriture en base pendant ce
diagnostic. Les numéros de ligne renvoient à l'état de `main` au commit `e983a12`.)*

## 1. Ce qui est cassé, en une phrase

Quazian interroge une **table de contenus qui ne contient plus rien pour lui**. Il demande les
lignes de `scriptorium_unites` où `type = 'unite'` ; la réorganisation du Scriptorium (livres /
auteurs / signets, puis parcours) a déplacé les cours et les textes dans une **autre table**,
`scriptorium_contenus`, et ne laisse dans `scriptorium_unites` que des **livres**. La requête ne
rend donc plus aucune ligne, et l'écran s'arrête net sur « Aucune unité dans le Scriptorium » —
avant même d'avoir un bouton à presser.

Ce n'est pas un bug de rendu ni un cas limite : c'est une **couture jamais refermée** après la
réorganisation. Le dépôt le sait d'ailleurs déjà — `app/prof/codex/validation/actions.ts:135-140`
porte ce commentaire, écrit à un lot précédent :

> « Garde D13 : une session ancrée `contenu_id` (bras parcours) N'A PAS d'unité → pas de carte FSRS
> (sa FK `scriptorium_unite_id` serait null) […] **Recâblage flashcards→contenus = chantier de
> suivi.** »

Ce chantier de suivi, c'est celui-ci.

## 2. Les deux architectures, côte à côte

| | Ce que Quazian croit lire | Ce que le Scriptorium écrit aujourd'hui |
|---|---|---|
| Cours et textes | `scriptorium_unites` (`type = 'unite'`) + ses `scriptorium_documents` | `scriptorium_contenus` (`type = 'texte' \| 'cours'`) + `scriptorium_contenu_sections` |
| Découpage interne | `scriptorium_documents.semaine` | sections d'un cours (`ordre`, `niveau`) ; un texte est atomique |
| Rattachement à une classe | `scriptorium_document_classes` (document → classe) | parcours assigné : `scriptorium_parcours_classe_creneaux` (`ref_type='contenu'`) → `scriptorium_parcours_classes.classe_id` |
| Livres (lecture Aletheia) | — | `scriptorium_unites` (`type = 'livre'`) + `scriptorium_documents` (une séance par `semaine`) |

`scriptorium_unites` **n'a pas été supprimée** : elle a changé d'habitant. C'est ce qui rend la
panne silencieuse — la table existe, la colonne `type` existe, la requête est valide, elle rend
zéro ligne.

## 3. La preuve, en base (13/08, lecture seule)

```
scriptorium_unites                     scriptorium_contenus
  type = 'livre'  → 4 actives            type = 'cours'  → 2
  type = 'unite'  → 0                    type = 'texte'  → 1
                                       (aucune ligne supprimée)

scriptorium_documents  45 lignes, toutes type='texte_source', toutes rattachées à un LIVRE
scriptorium_document_classes   0 ligne          ← table du rattachement que Quazian lit
scriptorium_unite_classes      3 lignes         ← rattachement réellement utilisé (livres)
scriptorium_parcours_classe_creneaux  4 lignes  ← rattachement réellement utilisé (contenus)

quazian_flashcards 0 · quazian_publications 0 · quazian_quizzes 0 · quazian_questions 0
```

Zéro carte, zéro quiz : **rien n'a jamais pu être créé depuis la réorganisation**. Aucune donnée
héritée à sauver, aucune migration de données à écrire.

Le seul contenu réel exploitable en sandbox : le cours **« NAture humaine »** (9 460 caractères),
présent dans l'instance de parcours *active* de la classe **Test** — c'est le support du critère de
sortie.

## 4. Les six points de rupture, dans l'ordre du flux

### 4.1 — L'entrée : la liste des unités est vide *(cause racine)*

| Site | Ce qu'il demande |
|---|---|
| `app/prof/quazian/page.tsx:17` | `scriptorium_unites … eq('type','unite')` → **0 ligne** → « Aucune unité dans le Scriptorium » |
| `app/prof/quazian/quizz/page.tsx:40-44` | idem → le sélecteur d'unités du formulaire de quiz est vide |
| `app/prof/quazian/actions.ts:21-32` (`lireUnitesScriptorium`) | idem — **fonction morte**, plus aucun appelant |
| `app/prof/quazian/diagnostic/actions.ts:98` | idem *(diagnostic = C6, hors périmètre de ce lot)* |

Conséquence immédiate côté quiz : `CreerQuizz.tsx:118-121` affiche « Aucune unité de cours
disponible », et `creerQuizz` refuse de toute façon en `actions.ts:44` (« Sélectionne au moins une
unité »). **Le quiz n'est pas cassé pour une raison propre : il meurt de la même famine.**

### 4.2 — Le corpus : la génération va chercher le texte au mauvais endroit

`genererCartesSemaine` (`app/prof/quazian/actions.ts:96-166`) lit
`scriptorium_documents` filtré par `(unite_id, semaine)`. Or ces documents n'existent plus que sous
les **livres**, précisément le contenu que Quazian s'interdit de servir (règle anti-spoiler,
`actions.ts:269-272` et `quizz/actions.ts:47-56` : le texte extrait d'un livre est un ancrage IA qui
ne doit pas atteindre l'élève). Même si l'entrée n'était pas vide, ce chemin ne pourrait rendre que
du texte interdit.

Second glissement, plus discret, dans le même bloc (`actions.ts:117-118`) : la distinction
cours / texte teste `d.type === 'texte'`. Les documents valent aujourd'hui `'texte_source'` — la
comparaison est donc **toujours fausse**, et tout serait traité comme un cours à décortiquer, y
compris les extraits d'œuvre que la règle F2 plafonne à 1-2 cartes.

### 4.3 — L'ancrage : la carte ne PEUT pas pointer un contenu

`quazian_flashcards.scriptorium_unite_id` est **`not null`**, avec FK vers `scriptorium_unites`. Il
n'existe aucune colonne pour désigner un `scriptorium_contenus`. Autrement dit : même en réparant la
lecture, l'écriture serait refusée par le schéma. Même mur sur `quazian_publications`
(`scriptorium_unite_id` `not null` + `unique`).

C'est exactement l'obstacle que Codex a franchi au lot précédent — `plan_evaluation_phase_a.sql:177-191`
a rendu `codex_sessions.scriptorium_unite_id` nullable, ajouté `contenu_id` et posé un CHECK d'arc
exclusif (`codex_sessions_source_chk`). Le patron existe, il est joué en base, il tient.

### 4.4 — La visibilité élève : filtrée par une table vide

`contexteVisibiliteCartes` (`app/eleve/modules/quazian/actions.ts:26-50`) dérive le périmètre de
l'élève de `scriptorium_document_classes` — **0 ligne en base**. Le jeu de tuples visibles est donc
toujours vide, et le filtre `actions.ts:94-97` ne laisse passer que les cartes à `semaine` nulle.
Traduit : **toute carte portant une semaine serait invisible à tous les élèves**, même publiée,
même validée. Le même filtre gouverne les trois surfaces — file de révision, consultation, et les
compteurs de la page d'accueil (`chargerStatsRevision`) — donc l'incohérence, elle, est au moins
uniforme.

### 4.5 — La publication : elle écrit un libellé texte dans une colonne de classe

`togglePublicationUnite` (`actions.ts:286-299`) alimente `quazian_publications.classe_id` avec
`scriptorium_unites.classe` — une colonne **`text`** héritée (un libellé, pas un `uuid`), dans une
colonne elle-même déclarée `text`. Aucun lecteur ne s'en sert : le périmètre élève ne lit que
`scriptorium_unite_id` + `flashcards_visibles` (`app/eleve/modules/quazian/actions.ts:30-32`). C'est
de la donnée écrite pour personne. Sans gravité aujourd'hui, mais à ne pas reconduire sur le
nouveau bras.

### 4.6 — Les libellés de quiz : résolus dans la mauvaise table

`quazian_quizzes.scope_unites` (`uuid[]`, sans FK) est relu contre `scriptorium_unites` en trois
endroits — `quizz/page.tsx:61`, `quizz/[quizId]/page.tsx:39-45`, `quizz/[quizId]/lancer/page.tsx:91-97`.
Un scope désignant des contenus y afficherait des uuid bruts.

## 5. Item 5 du chantier — le « flashcards gelées » de l'intégrité : **il existe, il marche, il est à assumer**

Le mécanisme est vivant et **indépendant de l'architecture Scriptorium** : il ne lit que
`profiles.integrite_bloque` et `integrite_params.actif` (`utils/integrite.ts`, `messageSiBloque`).
Trois points d'application dans Quazian, tous en place et cohérents avec le message par défaut
(« Tes dépôts et ta révision de flashcards sont gelés […] Le quizz, lui, reste ouvert ») :

| Point | Site | Effet |
|---|---|---|
| Écran élève | `app/eleve/modules/quazian/page.tsx:77, 83-86, 117-125` | bannière + révision masquée, section Quizz conservée |
| File de révision | `app/eleve/modules/quazian/actions.ts:73-74` | rend `[]` |
| Écriture FSRS | `app/eleve/modules/quazian/actions.ts:252-255` | aucune mise à jour |

**Aucun état zombie, aucun arbitrage requis : à assumer, tel quel.**

Une inégalité mineure toutefois, à refermer dans ce lot puisqu'« assumer » veut dire « rendre
entier » : `chargerToutesLesCartes` (mode consultation, `actions.ts:184`) et `chargerStatsRevision`
(`actions.ts:371`) **n'ont pas la garde**. La page ne les appelle pas quand l'élève est bloqué —
donc rien ne fuit par l'interface — mais ce sont des Server Actions exportées, donc des points
d'entrée HTTP à part entière. Les deux sont en lecture seule ; le gel du barème FSRS, lui, est bien
gardé. Correctif : la même ligne que dans `chargerFileRevision`.

## 6. Item 6 — affichages de notes : **le correctif ne passe pas par ces écrans → reporté en L2**

Constat quand même posé, pour que L2 n'ait pas à le refaire. `quazian_quiz_scores.score_moyen` est
un **score de Brier signé**, dans `[-10, +10]` : la note en découle par `10 + score_moyen`, bornée à
`[0, 20]` (`app/eleve/modules/quazian/quizz/[quizId]/actions.ts:304`). Deux écrans élève l'affichent
pourtant comme une note sur 10 :

- `app/eleve/modules/quazian/page.tsx:171` — `{score.toFixed(1)}/10` sur la tuile d'un quiz corrigé ;
- `app/eleve/modules/quazian/quizz/[quizId]/page.tsx:70-71` — « score moyen /10 ».

Un élève sous la moyenne y lit donc une note négative « sur 10 ». Côté prof, tout est en `/20`
(`lancer/TableauLive.tsx:133, 148, 181`, `semestre/page.tsx`). **Ce lot n'ouvre aucun de ces deux
fichiers** — le prompt dit alors de noter pour L2, ce qui est fait ici et dans le §10 de ce rapport.

## 7. Ce que le correctif fait (résumé — le détail est dans le commit)

1. **Migration additive** `c7_quazian_contenus.sql`, patron `plan_evaluation_phase_a.sql` : arc
   bi-source `unité | contenu` sur `quazian_flashcards` et `quazian_publications` (CHECK exclusif),
   plus `quazian_quizzes.scope_contenus`. Aucune ligne existante à convertir (les trois tables sont
   vides), aucune policy touchée.
2. **Lecture** : Quazian liste les **contenus** du Scriptorium (Textes + Cours vivants) au lieu
   d'unités disparues. Les livres restent hors de sa portée (règle anti-spoiler inchangée).
3. **Génération** : une carte se génère depuis **un contenu** — un cours est décortiqué, un texte
   source plafonné à 1-2 cartes (règle F2 restaurée, la comparaison de type cesse d'être toujours
   fausse). Statut `suggere` → file de validation prof, déjà en place.
4. **Visibilité élève** : dérivée de l'instance de parcours de la classe
   (`scriptorium_parcours_classe_creneaux` → `scriptorium_parcours_classes`), l'unique chemin
   contenu → classe qui existe aujourd'hui, et l'idiome déjà employé partout ailleurs
   (`utils/plan-synthese-hooks.ts`, `utils/aletheia-dates.ts`). Le bras hérité (unité + semaine) est
   conservé intact.
5. **Quiz** : périmètre choisi parmi les contenus, libellés résolus des deux côtés de l'arc.
6. **Gel de l'intégrité** : assumé, et rendu entier (§5).

## 8. Hors périmètre — constaté, pas touché

- **Codex a exactement la même fracture côté prof** : `app/prof/codex/actions.ts:20-28`
  (`lireUnitesScriptorium`) filtre `type='unite'` → la création de synthèse depuis l'écran Codex est
  morte de la même cause. Seul le bras `contenu_id` (auto-créé par le plan d'évaluation, gaté) sait
  encore naître. **Ce lot est Quazian ; à porter au chantier Codex.**
- **Diagnostic Quazian** (`app/prof/quazian/diagnostic/actions.ts:98`) : même requête vide → C6,
  comme le dit le prompt.
- **Onglets, commutateur trois états, génération sur « vu »** → L2.

## 9. Ce que le diagnostic n'a pas pu prouver seul

La chaîne complète (génération IA → validation → publication → révision élève → quiz passé) demande
une session prof puis élève dans un vrai navigateur. Ces tests sont posés dans
`SUIVI_tests_manuels.md`, section C7 · L1, avec l'état de départ de la sandbox.

## 10. Questions ouvertes (règle R7 — notées, pas tranchées)

1. **`quazian_publications.classe_id` (colonne `text`) est de la donnée morte** — écrite depuis
   toujours, lue par personne. Le nouveau bras ne l'alimente pas. La retirer proprement (ou lui
   donner un sens : une publication par classe plutôt que globale) est un arbitrage, pas une remise
   en marche. **Pour le soir.**
2. **La publication reste globale, pas par classe.** Une carte validée + publiée est visible de tout
   élève dont une classe a le contenu au parcours. Est-ce l'intention, ou faut-il publier
   classe par classe ? Le lot conserve le comportement d'avant (« remise en marche, pas refonte »).
3. **Item 6 (notes /10 vs /20)** — reporté en L2 par la règle du prompt (§6). Si l'affichage doit
   changer de côté élève, c'est une décision de formulation autant que de code (🎻).
4. **Sections de cours.** Un cours découpé en sections génère aujourd'hui ses cartes depuis le
   **texte entier**. L2 parle d'un bouton « par élément de contenu » : si l'élément visé est la
   *section* et non le cours, c'est L2 qui pose le grain — ce lot ne préempte pas.
