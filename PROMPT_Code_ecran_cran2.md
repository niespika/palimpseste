# PROMPT — Session Code : l'écran du cran 2, « voici les pièces »

> ⚠️⚠️ **PÉRIMÉ EN PARTIE LE 06/09 (nuit)** — la branche `feat/ecrans-passation` (arbre `../palimpseste-passation`) porte DÉJÀ
> l'écran du cran 2 (commit `0eefe22`), **adapté ensuite à la forme « texte à trou »** décidée par Louis le 06/09 : le devoir
> entier avec un trou (`pieces[]` = morceaux dans l'ordre, un morceau à `texte: null`), la consigne « Lis les documents
> ci-joints : le sujet, et le texte à compléter. Complète … » (`10-` v0.9, `08-` v1.10, `09-` v1.7). **Ce qui reste de ce
> prompt : le SMOKE en bac à sable (24 exercices `ex-gab-…-c2` y sont), les captures aux trois tailles, le diff porte fermée.**
> Le plan n'a plus de cran 2 (écran à concevoir, `IDEES_post_rentree.md` 06/09).

> **À coller dans une session Claude Code fraîche**, dans le dépôt `palimpseste`. Une session, un lot.
>
> Fabriqué le **2026-09-06 (nuit)** par la séance « refonte du routeur à l'heure de la clé », à la demande de
> Louis : *« s'il me faut un écran pour le cran 2 […] il faut que tu me donnes un prompt pour que je le fasse dans
> une session parallèle »*. Règles inchangées : la doctrine fait foi et se lit avant le code, toute fonctionnalité
> vit derrière un flag (ici **`gabarit_actif`**, déjà posé), jamais `git add -A`, **un push est un déploiement**,
> mesurer avant d'affirmer, rien en production sans le « go » de Louis.
>
> ⚠️ **Une autre séance travaille en même temps sur le même dépôt** — celle qui a écrit ce prompt : elle tient la
> doctrine (`01-`, `10-`), la fabrique (`generateur/`, dépôt de conception) et **le lot routeur** (`utils/moteur/`,
> `utils/registre/porte*.ts`, `utils/registre/reussites-serveur.ts`). Le partage des fichiers est écrit plus bas ;
> respecte-le, et lis « Les conventions » avant le premier `git add`.

## La mission, en une phrase

**Servir à l'élève un exercice de cran 2 du gabarit** : les pièces de l'objet à leur place dans le cadre « Les
documents », la place vide de la pièce qu'il écrit, le geste de la fiche comme consigne, un seul champ de rédaction ;
à la remise, **l'objet assemblé** (les pièces servies plus la sienne) part au **juge du cran**, qui tranche contre le
test de la fiche et la pièce qu'on tient pour vraie, et **le retour ne parle que de l'observable du constituant** ;
l'**étalon** (la pièce attendue) se déplie après la vf ; le **registre** lit « cran 2 réussi sur l'objet » sur la
pièce joint. Tout derrière `gabarit_actif`, **aucune migration**.

## Lis d'abord, dans cet ordre

1. `palimpseste-conception/10-Gabarit.md` *(v0.8)* — **§2 bis.1** *(le cran 2 : « voici les pièces », jamais « il
   manque » ; le matériau se dérive ; ⚠️⚠️ le cran 2 ISOLE ; « ce que l'écran fait »)*, **§2 bis.5 (2)** *(la pièce
   par défaut est le constituant qui porte le joint)*, **§3** *(la consigne du 2 : « Lis les documents ci-joints :
   le sujet, et les pièces, chacune à sa place. `<Le geste sur la pièce>`. » — le geste est écrit à la main dans la
   fiche et se **recopie**, il ne se génère pas)*, **§6** *(le juge au cran 2 : l'objet assemblé, la fiche, l'étalon =
   la pièce ; décision 17)*, **§7** *(réussi au 2 : « la pièce écrite passe le test de la fiche — les observables du
   constituant, et eux seuls » ; le registre × constituant)*.
2. `palimpseste-conception/08-FORMAT_IMPORT.md` §5 — les champs `constituant` et `pieces` du cas au cran 2 ;
   `guide` disparaît au cran 2 ; `observable_isole` et `materiau_cible` **nuls** aux crans de production ;
   ⚠️ **`probleme` est nul au cran 2** *(les deux contrôles d'import refusent une clé au cran 2 : « le cran 2 n'isole
   rien »)* — la clé du devoir ne vit que dans la **souche de l'`id_import`** : `ex-gab-<objet>-<clé>-c2`.
3. `palimpseste-conception/09-Objets.md` *(v1.6, validé par Louis le 06/09)* — pour chaque objet : les constituants
   et leur question, **« La pièce du cran 2 » et son geste**, le test, l'exemplaire et le contre-exemple. Ces lignes
   sont **dérivées en base** : `exercices_pieces` *(clé, objet, genre, `piece`, `geste`)*, `exercices_fiches_objets`
   *(la fiche entière, 21 lignes, contre-exemples non nuls depuis le 06/09)*, `exercices_tests`.
4. `palimpseste-conception/07-Implementation.md` §2, chapitre **C7** — `C7-L3` *(la console, jouée le 04/09 :
   « pas encore : les crans 2·6·8 »)*, `C7-L1` *(le juge du cran, aux 4·5·7·9)*, `C7-L2` *(les colonnes
   `constituant` / `pieces`, déjà en base des DEUX côtés)*.
5. Dans l'app : `components/deroule/EcranDeroule.tsx` *(1741 lignes — `ColonneMatiere`, le cadre « Les documents »
   à sections nommées, `FicheDeLObjet` en tête, `ChampDeRedaction`)*, `utils/deroule/vue.ts` *(la vue, dont le
   co-texte des crans de production et le gradient du guide « cran 2 toujours déplié » — **périmé** pour le
   gabarit : au cran 2 le guide disparaît, les pièces le remplacent)*, `utils/gabarit/lecture.ts` *(lectures
   TOLÉRANTES du gabarit — c'est là qu'entrent `constituant` et `pieces`)*, `utils/gabarit/consigne.ts` *(les
   consignes dérivées ; le cran 2 y est « C7 à venir »)*, `utils/chaine/juge-cran.ts` + `juge-cran-serveur.ts`
   *(`JUGE_AUX_CRANS = {4, 5, 7, 9}`)*, `utils/chaine/contexte.ts` *(ce que le juge et Calame reçoivent)*,
   `utils/registre/reussites.ts` *(le registre PUR ; le 2 n'y est pas dérivé)*.

## Ce qui existe, mesuré le 06/09 — ne pas refaire

- **La base** : `exercices_cas.constituant` (text) et `exercices_cas.pieces` (jsonb, `[{nom, texte}]`) existent
  des deux côtés (`c7_l2_gabarit_base.sql`) ; `exercices_pieces` porte le geste des 21 fiches ;
  `exercices_fiches_objets` porte la fiche. **Aucune migration n'est attendue.** S'il t'en fallait une, arrête-toi.
- **L'import** accepte un cran 2 au format 1.5 : `constituant` non vide, `pieces` non vide, chaque pièce `{nom,
  texte}` et rien d'autre *(une clé de plus est REFUSÉE)*, `guide` nul, `materiau_cible` nul, `observable_isole`
  nul, `reponse_attendue` = la pièce, pas de `materiau` au cas.
- **La banque** : `palimpseste-conception/generateur/banque/gabarit-c2.json` — **38 exercices de cran 2**, un par
  clé des sept objets servis *(transition 10 · argument 6 · objection 6 · paragraphe 6 · exemple 4 · phrase 3 ·
  plan 3)*, dérivés en séance le 06/09 des devoirs corrigés (cas A) et relus. ⚠️ **Il est en cours de fabrication
  au moment où ce prompt est écrit** ; s'il n'est pas dans le dépôt de conception ni en bac à sable quand tu
  commences, dis-le et attends-le — **ne le fabrique pas toi-même**. Les pièces sont servies **dans l'ordre du
  geste** *(argument : « ce que l'argument conclut », « ce sur quoi il s'appuie » ; transition : « ce que le
  premier paragraphe a établi », « ce que le second va faire » ; phrase : « ce qui vient avant », « ce qui vient
  après » ; plan : une pièce par thèse, « une thèse », dans le désordre ; objection : trois pièces ; paragraphe :
  quatre ; exemple : deux)*, et leurs **noms sont les mots de la consigne**, jamais les noms de constituants de
  la fiche *(« les noms des constituants sont des mots de concepteur », `09-` §0)*.
- ⛔ **La règle du handoff (`AGENTS.md`)** : avant de dessiner, **mesure dans `gabarit-c2.json` la longueur réelle
  de chaque pièce et de chaque pièce attendue, par objet** — médiane, min, max, en caractères — et donne les
  chiffres. Un devoir du gabarit fait cinq phrases, 440 à 670 caractères ; une pièce peut être une proposition
  de trente caractères ou trois phrases. L'écran se dessine sur ces nombres, pas sur une maquette.
- **L'écran des autres crans** est fait (`C7-L3` + « un écran, une tâche ») : le cadre « Les documents » à sections
  nommées, la fiche en tête, la consigne dérivée, l'étalon déplié après la vf aux crans de production. **Tu ajoutes
  une section « Les pièces » et un cran de plus à la consigne ; tu ne redessines rien.**

## Ce que le lot construit — et ce qu'il tranche seul

1. **La lecture** *(`utils/gabarit/lecture.ts`)* : `constituant` et `pieces` du cas, avec la même tolérance que le
   reste ; le geste du cran 2 lu dans `exercices_pieces` par `(objet, genre)` — **jamais recopié dans le code**.
2. **La vue** *(`utils/deroule/vue.ts`)* : au cran 2 du gabarit, le guide ne se sert pas ; le co-texte non plus si
   le cas n'en nomme pas ; le sujet se sert ; les pièces entrent dans « Les documents ».
3. **L'écran** *(`EcranDeroule.tsx`)* : la section **« Les pièces »**, chaque pièce **à sa place et sous son nom**,
   et **la place vide** de la pièce à écrire, nommée par le geste. ⚠️ **Où va la place vide** : le format ne le
   dit pas *(pièces `{nom, texte}` seulement)*. **Arbitrage proposé** : la place vide se met **à l'endroit du
   constituant dans l'ordre de la fiche** *(argument : conclusion · preuve · **garant** ⇒ en dernier ; transition :
   bilan · **limite** · annonce ⇒ au milieu ; phrase : avant · **la phrase** · après ; exemple : idée · cas ·
   **exploitation** ; objection : en dernier ; paragraphe : en dernier ; plan : l'élève écrit l'ordre entier sous
   les thèses)*. Si tu trouves mieux, dis-le ; **ne demande pas** — c'est un choix d'écran, pas de doctrine.
   La consigne collante du cran 2 : « Lis les documents ci-joints : le sujet, et les pièces, chacune à sa place. »
   puis **le geste, tel quel**. Un seul champ de rédaction. L'exemplaire de la fiche est servi *(déplié en semaine
   de méthode, comme aujourd'hui)* ; le contre-exemple aussi.
4. **La remise** : la production de l'élève reste la pièce seule *(`texte_v1` / `texte_vf`)* — **on n'écrit pas
   l'objet assemblé en base** ; l'assemblage est une dérivation, faite au moment de juger et de montrer.
5. **Le juge** *(`juge-cran.ts`, `juge-cran-serveur.ts`, `contexte.ts`)* : le cran 2 entre dans `JUGE_AUX_CRANS` ;
   il reçoit **l'objet assemblé** *(les pièces servies dans l'ordre, la pièce de l'élève à sa place)*, **le test
   de la fiche**, **la pièce qu'on tient pour vraie** *(`reponse_attendue`)* ; il tranche « la pièce écrite
   fait-elle son travail avec les pièces servies » ; ⛔ **le retour ne parle que de l'observable du constituant**
   *(décision 17 — l'observable se lit dans `exercices_problemes` : les problèmes dont `constituant` est celui de
   la pièce, sur cet objet ; pour le garant : `garant_present`, `garant_circulaire`, `garant_vague`… ;
   `couverture_observables` vaut `isole` au cran 2 dans l'esprit du `10-`, même si la table dérivée dit encore
   `exerce` — **ne change pas la table**, borne le prompt)*. Le verdict s'écrit sur `verdicts_cran` comme aux
   autres crans.
6. **Le registre** *(`utils/registre/reussites.ts` — PUR, à toi ; `reussites-serveur.ts` — à l'autre séance,
   coordonne-toi par un message avant d'y toucher)* : « cran 2 réussi » se lit sur le verdict du juge, **× constituant**
   ; la ligne « élève × objet × 2 × joint » est celle qui ouvre le 6.
7. **L'étalon** après la vf : la pièce attendue, dépliée *(comme aux crans 6 et 8 aujourd'hui)*.

## Le « fait quand »

- `npx tsc --noEmit` et `npx vitest run` verts ; tests purs sur la consigne du 2, l'assemblage, la place vide, le
  registre au 2.
- **Smoke en bac à sable** *(`gabarit_actif` y est ON)* : un dépôt de décor de l'élève de test sur un exercice de
  `gabarit-c2.json` *(le patron : `scripts/recette/decor-gabarit-eleve.mjs` ; la route
  `/eleve/modules/codex/exercice/<depot>`)* ; la remise d'une pièce ; le verdict du juge lu sur `verdicts_cran` ;
  le retour qui ne nomme que l'observable du constituant ; l'étalon après la vf.
- **Les captures aux trois tailles** *(`scripts/recette/capture-page.mjs`, par CDP — jamais `--window-size`)*, avec
  les données réelles, sur au moins **trois objets** : `argument` *(deux pièces, place vide en dernier)*,
  `transition` *(place vide au milieu)*, `plan` *(trois thèses, l'ordre à écrire)*. Aucun débordement sur téléphone.
- Porte fermée (`gabarit_actif` OFF) : l'écran d'hier à l'octet — **prouvé par un diff de rendu**, pas affirmé.

## Ce que tu ne fais pas

- Ni la fabrique des pièces, ni le fichier `gabarit-c2.json`, ni son dépôt en base : l'autre séance.
- Ni le routeur *(`utils/moteur/`, `utils/registre/porte*.ts`)*, ni la doctrine *(`01-`, `10-`)* : l'autre séance y
  écrit en ce moment *(la quarantaine par devoir, la semaine de méthode à deux objets, la séquence fiche → 1 → 3
  → **2** → 4)*. ⚠️ **Le routeur ne servira le cran 2 en méthode que si ton lot est mergé** : dis à Louis, en
  finissant, si l'écran est prêt pour dimanche soir *(la bascule, `scripts/recette/BASCULE_gabarit_lundi_7_septembre.md`)*
  ou non — c'est lui qui décide si `2` entre dans la séquence de lundi.
- Ni le cran 6 *(le test posé avant la remise)* ni le 8 : un autre lot.
- Aucune écriture en production.

## Les conventions — le dépôt est partagé

- ⛔ **Jamais `git add -A`, jamais `git add .`** : nomme tes fichiers un par un. Les tiens : `utils/gabarit/lecture.ts`,
  `utils/gabarit/consigne.ts` (+ tests), `utils/deroule/vue.ts`, `components/deroule/EcranDeroule.tsx` *(et un
  composant `LesPieces.tsx` si tu le sors)*, `utils/chaine/juge-cran.ts`, `juge-cran-serveur.ts`, `contexte.ts`,
  `utils/registre/reussites.ts` (+ test), un script de recette `scripts/recette/smoke-cran2.mjs`. **Pas les autres.**
- **Avant de commiter : `git fetch` puis `git merge --ff-only origin/main`.** L'autre séance commite aussi ; si le
  ff-only échoue, rebase tes commits, ne merge pas.
- ⛔ **Un push EST un déploiement** : `main` va sur Vercel, et des élèves y sont. Porte fermée en prod
  (`gabarit_actif` OFF), ton code doit être **inerte** à l'octet.
- À la fin : une ligne dans `PLAN_DE_CHANTIER.md` *(chapitre C7)*, une mémoire dans
  `~/.claude/projects/-Users-louissagnieres-Documents-GitHub-palimpseste/memory/` *(avec la ligne d'index dans
  `MEMORY.md`)*, et le compte-rendu à Louis : les mesures de longueur, les captures, les arbitrages, et **la
  réponse à « prêt pour dimanche soir ? »**.

## Ce que tu rends à Louis

1. Les longueurs mesurées des pièces, par objet, avant toute ligne de code.
2. Les captures des trois objets aux trois tailles, données réelles, porte ouverte ; le diff vide porte fermée.
3. Le verdict du juge sur un dépôt réel de cran 2, et le retour qui ne nomme que l'observable du constituant.
4. La liste des arbitrages *(la place vide, l'assemblage, ce que reçoit Calame)*.
5. Prêt pour dimanche soir : oui ou non, et ce qui manque si non.
