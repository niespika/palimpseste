# BRIEF — Design : les écrans élève d'Aletheia, étayage par niveau

> **Pour la session Design.** Flux habituel : wireframes → rendu charte → dossier
> `design_handoff_aletheia_etayage/` (README + HANDOFF + `.dc.html`). Design ne touche pas au
> code ; Code implémente à partir du handoff, sur la branche `feat/aletheia-etayage`, **avant**
> tout passage en production. Rédigé par Code le 04/09/2026, chiffres mesurés dans la base du
> bac à sable le même jour.

## 0. Ce que Louis demande (04/09)

L'ensemble des écrans de cette partie d'Aletheia doit être :

1. **élégant** ;
2. **lisible facilement sur ordinateur et sur téléphone** ;
3. **pas surchargé** : *un écran = une tâche*, surtout sur téléphone. *Un champ à remplir = une
   tâche ; trois questions à cliquer peuvent être une tâche* ;
4. **compréhensible en un coup d'œil** par quelqu'un qui n'a eu aucune explication préalable.

Et, noté le 03/09 en voyant la liseuse : **éviter l'effet d'empilement** (retour, relances, fenêtres,
cases les uns sous les autres) ; **séparer les moments** du retour ; donner à la partie droite
**l'effet d'une page** de livre.

## 1. Ce qui ne bouge pas

C'est de la **présentation**. Les données, les actions serveur, les règles (formes par niveau,
barème du surlignage, budget des retours, ce que le navigateur reçoit ou non) sont fixées par le
spec `SPEC_Aletheia_Etayage_par_niveau.md` (racine de la branche) et recettées. Trois règles à
garder en tête parce qu'elles contraignent la forme :

- **La pivot n'existe pas dans le navigateur tant qu'elle n'est pas méritée** (formes `fenetre` et
  `demi_section`) : l'écran de surlignage ne peut pas « montrer la réponse en gris ».
- **La liseuse ne montre jamais plus qu'une fenêtre de 400 mots ou une demi-séance** : pas de
  visionneuse du livre, pas de « lire la suite ».
- **Tout passage montré porte « dans notre version »** (le livre papier de l'élève peut différer).

## 2. La séance, moment par moment — l'état actuel et ce qui coince

Ordre d'écran d'une séance (spec § 6.6). Chaque moment : ce que l'élève fait, le composant, les
données avec leurs longueurs **réelles** (§ 4), la capture dans `captures/`, et le problème.

| # | Moment | Ce que l'élève fait | Composant | Captures | Ce qui coince aujourd'hui |
|---|---|---|---|---|---|
| 1 | **Rappel d'ouverture** (dès la 2ᵉ séance) | « Sans relire, quelle était l'idée de la séance dernière ? » — 3 lignes | `FormulaireV1.tsx` (haut) | 01 | Empilé au-dessus des cinq questions : un 6ᵉ champ sur le même écran |
| 2 | **Les questions du gabarit** (4 à 5 champs) | Répond aux questions du gabarit (argumentatif / dialogué / aphoristique / analytique) ; « Je ne sais pas » possible aux deux premières | `FormulaireV1.tsx` | 01, 02 | Cinq à six champs sur un écran ; le panneau « Je ne sais pas » (ligne de blocage + 3 propositions + pourquoi) s'ouvre DANS le champ et double la hauteur |
| 3 | **Attente** du retour | rien | `TuileAttente` | — | — |
| 4 | **Le retour, et répondre aux relances** | Lit la bulle du rappel, les relances (2 à 3), les réponses à ses questions, le vocabulaire ; pour chaque relance qui désigne un passage : lit le passage (E-D) ou le cherche et le surligne dans une fenêtre (C-B) ou une demi-séance (A), puis répond en une ou deux phrases | `ReponsesRelances.tsx` + `VueRetours.tsx`, atelier deux colonnes | 03 → 06 | ⛔ **L'empilement** : à gauche tout le retour, à droite chaque relance avec sa fenêtre de 400 mots (≈ 1 200 px sur téléphone) et sa case ; deux fenêtres par séance ⇒ une page de 5 000 px sur téléphone |
| 5 | **La réécriture** | Réécrit 3 à 4 champs en regard du retour et de ses réponses | `FormulaireVf.tsx`, atelier deux colonnes | 07 | Le retour entier à gauche, les champs à droite : l'élève doit chercher quelle relance concerne quel champ |
| 6 | **Attente** du retour final | rien | `TuileAttente` | — | — |
| 7 | **Le retour final, partie par partie** (4 parties, une case à cocher chacune) | ① ses ajouts vérifiés ; ② la **nuance prioritaire** : sa phrase à gauche, le texte à droite, la pivot surlignée, une flèche (≥ 1024 px) — à C et au-dessus il surligne d'abord ; ③ l'**architecture** en paires de passages (à C et au-dessus il choisit parmi 4 libellés) ; ④ la **synthèse modèle** à surligner puis comparer | `ValidationLecture` (séquentiel) + `RetourFinalAgi.tsx` | 08 → 11 | Le « partie par partie » est déjà un écran par tâche — mais la partie ② mêle lecture + geste + verdict + autres nuances repliées, et la partie ③ peut porter 3 paires × 2 extraits |
| 8 | **Clôture** | Coche la dernière partie | `ValidationLecture` | 11 | — |
| 9 | **Séance close — la revue** | Relit la synthèse, son chemin V1 → VF, ce que la séance a dévoilé ; le détail replié | `RevueDone` (page) | 12 | Sans étayage visible : les gestes faits (surlignages, choix, comparaison) n'y apparaissent pas |

Les captures sont nommées `NN-moment-taille.png` (1280 = ordinateur, 375 = téléphone).

## 3. Hypothèse de découpe « un écran = une tâche » (à discuter, pas imposée)

Ce que Code sait faire sans changer une donnée :

- **Moment 2** : une question par écran, avec un fil « 2 / 5 » et « suivant » — les champs
  déjà remplis restent accessibles en arrière ; le « Je ne sais pas » devient alors un écran à part
  entière (ligne de blocage, puis les trois propositions à cliquer = une tâche, puis « pourquoi »).
  Le rappel (moment 1) est l'écran 0 de cette suite.
- **Moment 4** : une relance par écran — la question, *puis* la fenêtre à lire ou à surligner,
  *puis* la case. Sur téléphone la fenêtre est le seul contenu défilant. Les réponses aux questions
  et le vocabulaire sont deux écrans de lecture à part (ou repliés).
- **Moment 5** : un champ par écran, avec **en regard la seule relance qui le concerne** et ce que
  l'élève y a répondu (le lien relance → champ existe : `relances_detail[i].passage`, rôle du
  passage `these` / `argument:n`).
- **Moment 7** : garder le partie-par-partie ; découper la partie ② en deux écrans (surligner /
  voir le verdict) à C et au-dessus ; une paire par écran en ③ quand il y en a plus d'une.
- **Moment 9** : montrer ce que l'élève a fait (pivots trouvées, manques repérés) — données
  disponibles (`reponses_relances`, `retour_vf_agi`, `comparaison_synthese`).

Le patron « partie par partie » existe déjà (`components/retours/ValidationLecture.tsx`, mode
`sequentiel`) : parties lues repliées en bandeau, partie courante ouverte, fil de progression.

## 4. Les longueurs réelles (bac à sable, 04/09 — médiane · max · n)

| Donnée | Médiane | Max | n | Remarque |
|---|---|---|---|---|
| Question du gabarit | 67 car | 137 | 3 | la plus longue est celle du dialogué |
| Thèse élève V1 | 197 car | 1 627 | 52 | |
| Arguments élève V1 | 348 car | 3 642 | 52 | |
| Rappel d'ouverture (élève) | 195 car | 207 | 3 | |
| Phrase du rappel jugé | 152 car | 214 | 5 | une phrase |
| Relance (question) | 324 car | 469 | 109 | 2 à 3 par séance |
| Libellé « à chercher » | 58 car | 64 | 12 | |
| Réponse à une relance | 163 car | 218 | 12 | |
| Réponse à une question de l'élève | 445 car | 1 479 | 135 | |
| Bulle de la tournante | 473 car | 660 | 50 | |
| **Fenêtre à surligner** | **≈ 2 400 car** (400 mots) | | | ≈ 1 200 px de haut sur 375 px |
| **Passage montré** (E-D) | ≥ 740 car (dix lignes) | | | pivot ± 1 phrase, étendu |
| **Demi-séance** (A) | ≈ 4 300 car | 26 500 | | moitié d'un texte de séance (médiane 8 562 car, max 53 142) |
| Pivot (la phrase à trouver) | 221 car | 734 | 42 | 1 à 2 phrases |
| Libellé d'un passage | 67 car | 97 | 29 | |
| Proposition « je ne sais pas » (thèse) | 138 car | 157 | 5 | |
| Distracteur | 133 car | 153 | 10 | |
| Nuance — extrait de l'élève | 64 car | 227 | 10 | |
| Nuance — note | 145 car | 184 | 10 | ≤ 40 mots |
| Paire amont — relation | 61 car | 75 | 6 | 1 à 3 paires |
| Ajout vérifié — extrait | 121 car | 525 | 141 | |
| Synthèse modèle | 1 175 car | 1 390 | 50 | 9 à 11 phrases à surligner |

## 5. Contraintes charte et techniques

- Jetons de `globals.css` seulement (couleurs, polices par module) ; jamais de hex en dur.
  Aletheia : pigment `--pigment` (bleu), liseret or, minium rouge ; boutons estompés (jamais
  d'aplat franc).
- Trois tailles : téléphone 375, tablette 768, ordinateur 1280. Cibles tactiles ≥ 44 px.
- Le texte d'une fenêtre se surligne **phrase par phrase** : chaque phrase est un `<span
  role="button">` en ligne (un `<button>` est inline-block et met chaque phrase sur sa ligne —
  payé le 03/09 : 5 100 px de haut).
- La **flèche** entre la phrase de l'élève et la pivot n'existe qu'à partir de 1024 px ; en
  dessous, une couleur partagée en tient lieu (patron de la copie annotée du professeur).
- Messages du barème (fixés) : « C'est la phrase. » / « Tu y es presque : prends la phrase
  entière. » / « Tu y es, mais tu as pris trop large. » / « Bon endroit, pas la phrase. » / « Ce
  n'est pas là. Relis à partir du début du passage. » ; deux essais, la pivot est révélée au
  second échec.
- Le retour final se lit **dans l'ordre** ; la clôture est le dernier geste.
- Aucun secret côté navigateur : ce qui n'est pas mérité n'est pas servi.

## 6. Pour voir les écrans

- **Serveur de la branche** : entrée `palimpseste-etayage` du `.claude/launch.json` (port 3100),
  base du bac à sable. Compte élève de test : `TEST_ELEVE_EMAIL` de `.env.local` (Code pose un
  lien magique sur demande).
- **Livres de recette** (classe « Test ») : `[recette E3] Le Banquet` (dialogué, séances 1-3
  closes), `[recette E3] Par-delà bien et mal` (aphoristique, séances 1-2 closes),
  `[recette E3] La Poétique` (analytique, séance 1 close, séance 2 au retour). Code peut remettre
  n'importe quelle séance dans n'importe quel état en dix minutes (scripts de smoke).
- Les captures de ce dossier montrent chaque moment avec des **données réelles**.

## 7. Fichiers concernés (présentation)

`app/eleve/modules/aletheia/[livreId]/[semaine]/page.tsx` (l'ordre des moments, l'atelier deux
colonnes, la revue) · `FormulaireV1.tsx` · `FormulaireVf.tsx` · `ReponsesRelances.tsx` ·
`components/aletheia/VueRetours.tsx` · `components/aletheia/RetourFinalAgi.tsx` ·
`components/retours/ValidationLecture.tsx` (transversal : Codex et Fragments l'utilisent aussi —
le changer, c'est les changer) · `components/aletheia/Steppers.tsx`.

## 8. Ce que le handoff doit permettre

Les règles d'`AGENTS.md` s'appliqueront à l'implémentation : Code **mesurera** les champs contre la
base avant d'écrire (les chiffres du § 4 sont ceux-là), s'arrêtera si la maquette suppose une
donnée qui n'existe pas, et montrera le rendu réel aux trois tailles. Le handoff gagne donc à dire,
pour chaque écran : ce qui s'y lit, ce qui s'y fait, ce qui vient avant et après, et ce qu'on
fait des longueurs maximales du § 4.
