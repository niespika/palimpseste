# PROMPT — Session Code : « Un écran, une tâche » — la refonte des écrans de passation

> **À coller dans une session Claude Code fraîche**, dans le dépôt `palimpseste`. Une session, un lot.
>
> Fabriqué le **2026-09-04 au soir** par la séance du gabarit, à la demande de Louis, à partir de ses
> **dix commentaires** sur la galerie des écrans *(artefact « Les écrans de passation »,
> https://claude.ai/code/artifact/62193b79-ca46-48bd-a069-71bd6930a89b)*. Les commentaires sont recopiés
> **mot pour mot** plus bas : ce sont eux qui font foi, pas ma lecture.
>
> ⚠️ **Une autre séance travaille en même temps sur le même dépôt** (le gabarit, `C7`), et une troisième
> sur Aletheia dans un arbre séparé (`../palimpseste-etayage`). Lis « Les conventions » avant le premier
> `git add`.

---

## La mission, en une phrase

**Refaire le déroulé élève (`components/deroule/EcranDeroule.tsx` et ses sous-composants) pour qu'à
chaque moment l'élève n'ait qu'UNE tâche sous les yeux**, sur ordinateur comme sur téléphone, sans
changer une ligne de ce qui se mesure ni de ce qui s'enregistre.

Les principes de Louis, arrêtés pour la refonte d'Aletheia et repris ici tels quels :

1. **élégant** ;
2. **lisible facilement sur ordinateur et sur téléphone** ;
3. **pas surchargé** : *un écran = une tâche*, surtout sur téléphone. *Un champ à remplir = une tâche ;
   trois questions à cliquer peuvent être une tâche* ;
4. **compréhensible en un coup d'œil** par quelqu'un qui n'a eu aucune explication préalable.

Et, noté le 03/09 en voyant la liseuse : **éviter l'effet d'empilement** (retour, relances, fenêtres,
cases les uns sous les autres) ; **séparer les moments** du retour ; donner à la partie droite
**l'effet d'une page** de livre.

---

## Les dix commentaires de Louis — mot pour mot, avec l'écran qu'ils visaient

Les ancres renvoient à la galerie : `c4a` est la paire à écrire du cran 4, `c5` l'exercice à réécrire
du cran 5, `c1a` la paire à candidats du cran 1. Le numéro d'article est le moment capturé.

| Écran visé | Le commentaire |
|---|---|
| c1a, moment 3 — « Le second cas » | *« Je pense que le second cas au cran 1, devrait toujours être un 1b. Deux cas de figure : 1) ⇒ cas 1 : 1a, cas 2 : 1b · 2) cas 1 : 1b, cas 2 : 1b. Sinon, en fait l'élève va comprendre qu'il doit juste répondre la même chose en 1 et en 2 au bout de 3 exercices. »* — ⛔ **PAS TON LOT** : c'est la fabrique et la doctrine, la séance du gabarit s'en charge. Tu n'as rien à y faire, sinon ne pas casser ce que la console montre par cas. |
| c4a, en-tête | *« Je pense qu'on devrait faire la même chose avec le cran 4 que avec le cran 1. 1) cas 1 : 4a, cas 2 : 4b · 2) cas 1 : 4b, cas 2 : 4b. Au plan pédagogique, il me semble que ça fait plus de sens. »* — ⛔ idem, pas ton lot. |
| c4a, moment 2 (ordinateur) — « Le texte est écrit », la crédence sous le champ | *« À mon avis, il faut séparer l'écran Ton écriture (qui doit avoir son bouton "Enregistrer") de l'écran À quel point es-tu sûr ? Soit ce sont 2 écrans différents, l'un se charge quand le premier est enregistré. Soit il y a un toggle entre les deux. 1 tâche par écran, c'est le principe directeur. »* |
| c4a, moment 2 (téléphone) | *« toggle à 3 entrées : Lire, Écrire, Crédence. Un bouton enregistrer pour écrire et pour crédence. Le bouton peut ne rien faire de plus que l'enregistrement automatique du champ, mais ça rassure les élèves. »* |
| c4a, moment 6 — « La seconde chance déclarée », la carte « Avant de rendre » s'ouvre | *« Même commentaire : un écran une tâche. Donc le Comment te sens-tu doit avoir son propre écran. »* |
| c4a, moment 7 — après la confiance | *« Idem. Le Avant de rendre doit avoir son propre écran »* |
| c4a, moment 8 — après les conditions | *« idem. Son propre écran »* |
| c4a, moment 9 — après la thèse en une phrase | *« idem »* |
| c4a, moment 11 — « Le retour », trois points empilés | *« chaque point doit avoir son écran (ou sa partie d'écran) »* |
| c5, moment 1 — « Le premier cas », le champ | *« là aussi. Une tâche, un écran »* |

---

## Ce que ça veut dire, concrètement — ma lecture, à confirmer par les commentaires

Le déroulé devient une **suite d'écrans**, un par tâche, dans l'ordre du geste. Sur ordinateur, les
documents restent à gauche ; **la colonne de droite est la page qui tourne**. Sur téléphone, une bascule
à trois entrées — **Lire · Écrire · Crédence** — quand ces trois-là coexistent, puis les écrans suivants
se succèdent.

Pour un exercice à rédaction (crans 4, 5, 7, 9), la suite :

1. **Lire** — les documents (déjà là : « Les documents », sections nommées).
2. **Écrire** — le champ, **avec un bouton « Enregistrer »** qui peut ne faire que ce que fait déjà
   l'enregistrement automatique, *« mais ça rassure les élèves »*. Au cran 4(b)/7/9, le surlignage se
   fait dans Lire (la sélection retenue, « Garde ce passage »), et Écrire vient après.
3. **Crédence** — « À quel point es-tu sûr ? », seule, avec son bouton.
4. **Comment te sens-tu ?** — la confiance, seule.
5. **Dans quelles conditions as-tu travaillé ?** — seule.
6. **Ta thèse en une phrase ?** — seule.
7. **Rendre** — le bouton, et rien d'autre à faire.
8. **L'attente** — « ton retour est en préparation », et l'écran se met à jour seul (c'est déjà réparé :
   `Attente` suit la vue).
9. **Le retour** — **un point par écran (ou par partie d'écran)**, puis « ce que tu as à reprendre »,
   puis la validation de lecture.

Pour une paire (crans 1, 4, 9) : la même suite pour le premier cas, **puis l'écran de la correction du
premier cas, seul** (déjà fait le 04/09 : `momentDeLaPaire`), puis la suite pour le second cas, puis la
remise. Pour un exercice à candidats (crans 1 et 3) : Lire, puis Répondre (les jetons), puis la
correction.

⭐ **Un écran, c'est aussi un état lisible** : le fil des temps en haut (`FilDesTemps`) dit déjà
Préparer / Écrire / Se juger / Retour ; à toi de voir si les étapes fines (écrire, crédence, les trois
gestes) s'y lisent — ou dans un compteur discret « 3 / 7 » comme le téléphone en a déjà un.

---

## Ce qui existe et que tu réutilises — ne pas refaire

- `components/deroule/EcranDeroule.tsx` (≈ 1 550 lignes) : `EcranDeroule` (états d'écran via
  `ecranDuDeroule`), `PlanDeTravail` (la bascule Lire/Écrire du téléphone, `ColonneMatiere`,
  `ColonneTravail`), `RetourDUnTexte`, `RetourDUnChoix`, `Correction`, `Attente`, `Depliable`, `Carte`.
  **Le 04/09** y sont entrés : un cas à la fois sur les paires (`utils/deroule/paire.ts` :
  `momentDeLaPaire`, `casDuMoment`, `versionDuCas`), la crédence **après** le champ
  (`ChampDeRedaction.avantLaRemise`), la carte « Avant de rendre » sans remise au premier cas
  (`sansRemise`), les deux réponses d'une paire en lecture seule, l'avis « fini sans retour »
  (`vue.fin`), l'encart d'attente qui suit la vue.
- `components/deroule/ChampDeRedaction.tsx` : le champ, l'enregistrement automatique toutes les 15 s
  (`AUTO_MS`), la télémétrie, la carte « Avant de rendre » (les trois gestes + le bouton de remise).
- `components/deroule/GestesDeLaRemise.tsx` : les trois gestes, **dans l'ordre de la doctrine**,
  chacun avec son « Continuer » et son action serveur (`actionConfiance`, `actionConditions`,
  `actionRestitution`) — `vue.gestesRestants[0]` dit lequel vient.
- `components/deroule/CredenceSaisie.tsx` : les jetons (crans 1·3) ou le pourcentage ; `nu` quand
  elle est la réponse.
- `components/deroule/DesignationDansLeMateriau.tsx` : le surlignage — **réparé le 04/09**
  (la sélection retenue par `selectionchange`, cf. mémoire `reference_ios_tap_efface_la_selection`) ;
  ne touche pas à sa mécanique.
- `components/deroule/RetourSegmente.tsx` : le retour par points, « je ne suis pas d'accord »,
  « voir le passage de mon texte », la validation de lecture.
- `utils/deroule/vue.ts` : `VueDuDeroule` — **tout ce que l'écran sait vient de là**, serveur ;
  `chargerLeDeroule`. `utils/deroule/plan-de-travail.ts` : `formeDuTravail`, `ecranDuDeroule`,
  `tempsAffiche`, les libellés.
- `app/deroule/actions.ts` : les actions serveur (brouillon, remise, crédence, désignation, gestes).

⛔ **Ce que tu ne changes pas** : ce qui s'enregistre et quand (les actions), l'ordre des trois gestes
(`06-` §3 : avant tout envoi à l'IA), la crédence **avant** de savoir (jamais après une correction ni un
retour), le `<textarea>` nu du champ (piège 24), le refus du collage, `AUTO_MS`, la doctrine du
marquage et de la désignation, les jetons de `globals.css` (jamais de hex en dur).

---

## Les pièges — payés cette semaine, à ne pas repayer

1. ⛔ **Tester dans un Chrome sans fenêtre ne voit pas un téléphone.** Le smoke du 01/09 disait
   « le surlignage marche » ; sur iPhone il ne marchait pas. Pour une refonte d'écran : **captures aux
   trois tailles (1280 · 768 · 375)** avec des données réelles, et le script de parcours
   `scripts/recette/parcours-deroule.mjs <depot> <nom> <dossier>` qui joue un déroulé de bout en bout
   (jetons, écriture, crédence, second cas, surlignage, trois gestes, remise, retour) et capture chaque
   moment. **Adapte-le à tes écrans** (il lit les boutons par leur texte) plutôt que d'en écrire un
   second.
2. ⛔ **`innerText` rend les majuscules du CSS** : un `/Ton retour/` ne matche pas « TON RETOUR ».
   Les regex du script sont insensibles à la casse.
3. ⛔ **Un `useState(vue.x)` ne suit pas une vue rafraîchie** (`router.refresh()`) : c'est ce qui a
   caché l'encart d'attente pendant des semaines. Un composant monté avant un changement de vue doit
   resynchroniser (`useEffect` sur la prop) ou être remonté (`key`).
4. ⛔ **La carte « Avant de rendre » mettait quinze boutons dans 190 px** parce que le bouton de remise
   était en ligne à côté : « éviter l'effet d'empilement » se mesure en pixels, pas en intention.
5. ⚠️ **« Passer au second cas » est un état d'écran** (`passeAuSecond`), pas une donnée : recharger
   ramène à la correction. Si tu ajoutes des états d'écran (l'étape courante), même règle — et dis-le.
6. ⚠️ **Les paires écrivent la seconde réponse en `texte_vf`** depuis le 04/09 (regime.ts : « la réponse
   au second cas »). `versionEnCours(vue, casAffiche)` le sait ; ne recopie pas la règle.
7. ⚠️ **La route élève est `/eleve/modules/codex/exercice/<depot>`** pour les instances `composer`
   (Aletheia refuse à la porte). Les dépôts de décor : `scripts/recette/decor-gabarit-eleve.mjs <cle>`
   assigne les huit exercices d'une clé du gabarit à l'élève de test ; `gabarit_actif` est à ON en bac
   à sable.
8. ⚠️ Le module hôte peint le pigment (`data-module`) ; les sur-titres sont en Cinzel
   (`font-marque`), le corps en EB Garamond (`font-corps`), l'UI en Alegreya Sans (`font-ui`).
   Réutilise `Carte`, `Encart`, `Depliable`.

---

## Le « fait quand »

- Sur un exercice à rédaction (cran 5) et sur une paire (cran 4), **à aucun moment l'écran de droite ne
  montre deux tâches** : le champ, ou la crédence, ou un geste, ou le bouton de remise, ou un point du
  retour — jamais deux ensemble.
- Sur téléphone, la bascule **Lire · Écrire · Crédence** existe quand ces trois-là coexistent, et le
  champ a un bouton **« Enregistrer »** visible.
- Les captures des moments aux trois tailles, faites avec `parcours-deroule.mjs` sur des données
  réelles du bac à sable, sont **montrées à Louis** (une galerie comme celle du 04/09 :
  `scratchpad/galerie-passation.py` en est le générateur, à reprendre).
- `tsc` propre, `npm test` vert (2 244 tests le 04/09), et **rien n'a changé dans ce qui s'écrit en
  base** : un parcours complet avant/après donne les mêmes lignes dans `exercices_depots`,
  `exercices_metacognition` et `routeur_decisions`.

---

## Les conventions — le dépôt est partagé

- ⛔ **Jamais `git add -A`, jamais `git add .`** : une autre séance écrit dans le même arbre. Nomme tes
  fichiers, un par un, et commite par la plomberie (index temporaire `GIT_INDEX_FILE`, arbre vérifié à
  part par `git archive` + `tsc` + `npm test`, `git commit-tree`, `git update-ref` en compare-and-swap,
  puis `git reset -q`). Le patron est dans les commits du 04/09.
- ⛔ **Un push EST un déploiement** : `main` va sur Vercel. Tout ce que tu pousses doit être vert et
  sûr pour des élèves qui font leurs exercices ce soir.
- **Avant de commiter : `git fetch` puis `git merge --ff-only origin/main`** — la séance Aletheia
  pousse de temps en temps.
- **Aucune migration** n'est attendue de ce lot. S'il t'en fallait une, arrête-toi et dis pourquoi.
- **Pas de flag** : c'est une refonte d'écran, pas une fonctionnalité neuve ; mais si tu doutes de
  livrer d'un coup, une porte `deroule_etapes_actif` sur `scriptorium_params` est acceptable — dis-le.
- À la fin : `PLAN_DE_CHANTIER.md` (une ligne dans le chapitre C7, ou C6 « ce que l'élève voit »),
  une mémoire dans `~/.claude/projects/…/memory/` avec les arbitrages, et **le compte-rendu à Louis** :
  ce qui a changé écran par écran, les captures, ce que tu as tranché sans lui demander.

---

## Ce que tu rends à Louis

1. La galerie des nouveaux écrans, moment par moment, ordinateur et téléphone.
2. La liste des arbitrages : ce que « une tâche » veut dire là où le commentaire ne le disait pas
   (le retour point par point : écran ou partie d'écran ? ; le fil des temps : étapes fines ou non ?).
3. Le diff des écritures en base entre un parcours d'avant et un parcours d'après : **vide**.
