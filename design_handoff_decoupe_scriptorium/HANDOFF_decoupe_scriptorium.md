# Handoff — Scriptorium · Découper un livre (rendu charte)

> Pour Claude Code. Objectif : **réorganiser l'écran de découpe** du Scriptorium (mode
> « 1 PDF découpé »), partagé entre la **création** d'un livre (à partir d'un PDF) et la
> **re-découpe** d'un livre existant. On ne touche **pas** la logique métier (pose des
> bornes, validation, soumission) : on **refait la présentation** autour d'elle pour régler
> trois gènes — la page ne ressemble pas à un livre et on n'en voit qu'une tranche ; toutes
> les semaines sont empilées d'un coup (clutter) ; l'encart d'import trône au-dessus du livre.
> Bonus validé : se servir des **signets du PDF** (métadonnée déjà extraite) pour dessiner les
> titres. **Ordinateur uniquement** — le mobile est hors périmètre (personne ne découpe un
> livre sur téléphone).

## Références visuelles
Deux fichiers HTML accompagnent ce document (ouvrir dans un navigateur) :
- **`Scriptorium Découpe Rendu Charte.dc.html`** — rendu hi-fi fidèle à la charte (le « quoi », à reproduire) : création (livre + frise), mode plein cadre, re-découpe (texte réassemblé + avertissement destructif), et la correspondance **signets → titres**.
- **`Scriptorium Découpe Wireframes.dc.html`** — wireframes low-fi annotés (le « pourquoi ») : l'écran actuel marqué des 3 problèmes, les deux directions comparées, la re-découpe, le bonus signets.

Reproduire le **langage visuel** avec les composants/conventions du codebase (React, jetons Tailwind de `globals.css`, `next/font`). **Aucune couleur ni police en dur** — réutiliser les jetons (`bg-surface`, `text-encre`, pigment par `data-module="scriptorium"`…) et les composants existants.

---

## Architecture concernée (existant — à lire avant de coder)
Le cœur est un **navigateur de découpe partagé** ; tout le reste l'alimente.

- **`app/prof/scriptorium/NavigateurDecoupe.tsx`** — **le composant central**. Feuillette un texte (`pages: string[]`, une entrée = le texte d'une page, lignes séparées par `\n`) et pose, par semaine, un marqueur de **début** et de **fin** à la ligne près.
  - Types : `Pos { p: number; l: number }` (page, ligne), `Semaine { titre, chapitres, debut: Pos|null, fin: Pos|null }`.
  - Props : `pages`, `nb` (nombre de semaines), `bornesInitiales?`, `emettreChamps?` (rend les `input` cachés `decoupe_N_*` pour la soumission FormData — création), `modeModification?`, `onEtat(semaines, valide)`.
  - Logique à **conserver telle quelle** : `prochaineBorne()` (prochaine borne à poser = la **cible**), `poserLigne(l)` (clic sur une ligne → pose la cible), `effacerBorne()`, `estValide()` (chaque semaine a début **et** fin, `début ≤ fin`, **ordre du livre + non-chevauchement** sur slots consécutifs ; les trous sont tolérés/avertis), `posTexte()` (« p.X l.Y » si plusieurs pages, sinon « l.Y »), et la liste `messages` (erreur/info).
- **`app/prof/scriptorium/DecoupePdf.tsx`** — **création**. Upload du PDF → `pages` (texte par page) + `signets`, puis monte `NavigateurDecoupe` avec `emettreChamps` à l'intérieur de **`FormulaireLivre.tsx`** (titre/durée/date/classes + soumission `creerLivre`).
- **`app/prof/scriptorium/EditeurLivre.tsx`** — **re-découpe**. Pas de PDF : réassemble le texte des semaines existantes, monte `NavigateurDecoupe` avec `modeModification` + `bornesInitiales` (marqueurs pré-posés), `onEtat` → bouton d'enregistrement.
- **`app/prof/scriptorium/decoupe-utils.ts`** — utilitaires de découpe partagés création/modification.
- **`app/prof/scriptorium/actions.ts`** — `extraireSignets(buffer)` renvoie `{ titre, page, niveau }[] | null` (**`niveau` indexé à 0** : racine = 0, chaque sous-niveau `+1`). Les signets sont **déjà parqués** sur le livre (`scriptorium_unites.signets`) — aujourd'hui inutilisés à l'affichage. Champs cachés attendus par `creerLivre` : `decoupe_N_titre`, `decoupe_N_chapitres`, `decoupe_N_debutPage`, `decoupe_N_debutLigne`, `decoupe_N_finPage`, `decoupe_N_finLigne`.

> Règle d'or : **les 6 chantiers ci-dessous sont de la présentation**. `poserLigne`, `prochaineBorne`, `estValide`, `messages`, les champs cachés et `onEtat` ne changent pas de comportement. Le geste utilisateur reste **cliquer une ligne** pour poser la borne active.

---

## Décisions validées par le porteur du projet
1. **Le livre est le héros** : on voit **toute la page** d'un coup, et elle **ressemble à une page de livre** (pas une liste défilante `max-h-96`). Pas besoin d'afficher les numéros de ligne, mais il faut **savoir clairement sur quelle ligne on est**.
2. **Une frise des semaines** remplace l'empilement de toutes les semaines : seules les **posées** restent compactes et seule l'**active** se déplie.
3. **Les infos / l'import passent en barre fine** au-dessus du livre (plus d'encart qui pousse le contenu vers le bas).
4. **Direction A retenue + mode plein cadre emprunté à B** : par défaut frise visible (A) ; un bouton la masque → page maximale + guide pas-à-pas en bas (B).
5. **Geste conservé** : poser début/fin en **cliquant une ligne**.
6. **Signets = métadonnée → mise en page** : on lit le **niveau** du signet pour choisir le style (titre → titre, sous-titre → sous-titre). Vaut en **création et en re-découpe**.
7. **Ordinateur seulement** — pas de rendu mobile.

---

## Chantier 1 — La page de livre (remplace la liste de lignes)

### Existant
Dans `NavigateurDecoupe`, le texte est une liste de `<button>` (une par ligne) dans un conteneur `border rounded-lg p-2 max-h-96 overflow-auto` : numéro de ligne en `font-mono` + texte ; survol/marquage = `bg-pigment-teinte` ; repère (`S{n} début/fin`) en `text-liseret` aligné à droite.

### À faire
- Remplacer ce conteneur par un composant **`PageLivre`** qui rend **une page entière** à la fois, comme un vrai livre :
  - **gabarit page** : surface crème (`bg-surface`/teinte plus claire que `--fond-module`), bord fin, ombre douce, **marges généreuses**, **en-tête courant** (titre du livre en `font-marque` CAPS espacées, atténué, centré), **folio** (numéro de page centré en bas), et un léger effet de **pile de pages** (1–2 feuillets décalés derrière). Cf. la maquette charte.
  - **lignes cliquables** : chaque ligne du texte de la page reste un élément cliquable (garde `poserLigne(ln)`), occupe la **largeur de justification**, en `font-corps`. **Survol** = bande `bg-pigment-teinte` (ligne visée). Conserver l'`aria-label` actuel.
  - **repère « sur quelle ligne »** : numéros de ligne **discrets** dans la gouttière (petit, `text-muet` très atténué) — informatif, pas le focus. Le couple survol + numéros suffit ; **ne pas** ré-afficher une grosse colonne de numéros.
  - **marqueurs de borne** : sur une ligne portant un début/fin, afficher en **bout de ligne** une étiquette compacte `S{n} · début` / `S{n} · fin` (`text-liseret`, jeton pigment `scriptorium`) + bande `bg-pigment-teinte`. Garder le `·` / les flèches comme indices de sens (`▸` début, `◂` fin) si utile.
- **Navigation page** inchangée (`‹ Page [n] / total ›`), au-dessus ou dans la barre fine (Chantier 3).
- La phrase d'invite reste pilotée par `cible` : « À placer : **début/fin de la semaine N** — clique la ligne où elle commence/finit. » et, une fois tout posé, « Toutes les bornes sont placées… ».

> Acceptation : on voit **la page complète** d'un livre ; survoler une ligne montre clairement la ligne visée ; cliquer pose la borne active. Plus de tranche défilante de 10 lignes.

---

## Chantier 2 — La frise des semaines (remplace le mur de cartes)

### Existant
Colonne de droite : **une carte par semaine** (jusqu'à `nb`, potentiellement ~52), chacune avec `S{n}` + `titre` + `chapitres` + slots `Début`/`Fin`. Tout est ouvert en même temps → mur de champs.

### À faire
- **Rail vertical à gauche** (`Matrice… → FriseSemaines`) :
  - **semaines posées** (début **et** fin) → **une seule ligne** : `✓` (`text-ok`) + `S{n}` + titre tronqué + plage (`p.1–18` ou `l.1–22`).
  - **semaine active** (= celle qui contient `cible`, via `prochaineBorne`) → **carte dépliée** : pastille pigment + « Semaine N », champ **titre** (`input`, `font-titre`), champ **chapitres** (`input`, ex. « Chap. II »), puis deux slots **Début** / **Fin** (le posé en `ok-teinte`, celui à poser en `border-dashed` ton `attention`). C'est le seul endroit avec des champs ouverts.
  - **semaines à venir** → lignes atténuées « à venir » ; au-delà d'un seuil, replier en « + S7 · S8 ».
  - En-tête du rail : « SEMAINES · N » + compteur « k posées ».
- **Conserver tous les inputs** (`titre`, `chapitres`) et, en création, **les champs cachés** `decoupe_N_*` (peuvent rester montés/masqués hors carte active — ne pas les démonter, sinon perte de la saisie à la soumission). `effacerBorne` reste accessible (clic sur un repère / petit ✕ du slot).

> Acceptation : on lit l'avancement des N semaines d'un coup d'œil ; une seule semaine est « ouverte » à la fois ; rien n'est perdu à la soumission.

---

## Chantier 3 — La barre fine d'infos (remplace l'encart d'import)

### Existant
Un encart « Choisir un fichier » + « PDF de N pages » **au-dessus** du livre, qui repousse le contenu.

### À faire
- **Barre fine** en tête de la zone de découpe :
  - **création** : vignette livre (pastille pigment `scriptorium`, **pas de sceau** — Scriptorium n'en a pas, cf. charte) + **titre** + **auteur** + **N pages** + `✓ texte sélectionnable` + `✓ N signets` ; à droite **navigation page** et un discret **« ↻ Remplacer le PDF »**. L'upload initial (quand aucun PDF) peut rester une étape pleine ; **une fois le PDF lu, il se réduit à cette barre**.
  - **re-découpe** : pas d'upload — « Texte réassemblé des N semaines · re-paginé en pages de lecture · signets conservés » + navigation page.
- Mettre la zone de page sous `data-module="scriptorium"` pour hériter pigment/fond du monde.

> Acceptation : l'import ne masque plus le livre ; les méta tiennent sur une ligne ; le livre commence haut dans l'écran.

---

## Chantier 4 — Mode plein cadre (A + B)

### Intention (validée)
Par défaut **frise visible** (A). Un bouton **« ⇆ Masquer la frise »** bascule en lecture immersive (B) : le rail disparaît, **la page s'agrandit**, et un **guide pas-à-pas** de la semaine active descend en bas. **Le geste clic-ligne est identique** dans les deux modes — seul le bouton bascule.

### À faire
- **Toggle** d'affichage de la frise (état d'URL recommandé `?frise=1|0`, défaut `1`). Bouton dans la barre fine / en tête de la zone page.
- **Mode plein cadre** : masquer le rail, **élargir `PageLivre`**, et afficher en bas une **barre-guide** de la semaine active : « Semaine N / total » + titre + chapitres + chips **Début** (`ok-teinte`) / **Fin** (`border-dashed` `attention`) + navigation ‹ S(n-1) | S(n+1) ›, plus une **frise-progression** en segments (posées = `ok`, active = pigment foncé, à venir = atténué) avec, idéalement, des **repères de chapitres** (signets).
- La barre-guide lit les mêmes données que la frise (pas de duplication d'état).

> Acceptation : un clic masque la frise → page maximale + guide bas ; re-clic la ramène ; aucune autre régression de comportement.

---

## Chantier 5 — Les signets dessinent les titres (création **et** re-découpe)

### Intention (validée — le bonus)
Le PDF nous livre déjà sa **table des signets** (`extraireSignets` → `{ titre, niveau, page }`, parquée sur `scriptorium_unites.signets`). On **lit le `niveau`** pour rendre la bonne hiérarchie de titre **dans `PageLivre`** : un titre reste un titre, un sous-titre reste un sous-titre.

### À faire
- Au rendu d'une page, **rapprocher les lignes des signets** (par page + position). Une ligne qui **coïncide avec un signet** est rendue **comme un titre** au lieu du texte courant, selon `niveau` :
  - **`niveau 0`** → **titre de partie** : sur-titre `font-marque` CAPS espacées (ex. « SECONDE PARTIE ») + grand titre `font-titre` centré + filet.
  - **`niveau 1`** → **titre de chapitre** : « CHAPITRE … » `font-marque` + titre `font-titre` centré + ornement (❧).
  - **`niveau ≥ 2`** → **sous-titre** : `font-titre` italique, plus petit.
  - (Optionnel, page d'ouverture) **lettrine** sur le premier paragraphe.
- **La ligne reste cliquable** : poser le **début d'une semaine** sur un début de chapitre est le cas courant — bonus UX, le marqueur de borne s'affiche **en plus** du titre (cf. maquette, ligne « ▸ S3 · début » sur le chapitre).
- **Repli** : `signets === null` (aucun signet) → page lisible **sans titres mis en valeur** (paragraphes seuls). **Aucune dépendance dure** au signet.
- **Re-découpe** : mêmes signets (conservés sur l'unité) → même mise en page. Si la pagination de re-découpe (Chantier 6) déplace les positions, mapper le signet par **titre/ordre** plutôt que par page absolue.

> Acceptation : sur un PDF avec signets, les titres apparaissent stylés selon leur niveau ; sans signets, la page reste propre ; identique en re-découpe.

---

## Chantier 6 — Re-découpe : pages de lecture + avertissement destructif

### Existant
`EditeurLivre` réassemble le texte en **une seule « page »** (`modeModification`, `bornesInitiales`). Les lignes hors de toute semaine sont signalées **destructives** par `NavigateurDecoupe` (`messages` : « N ligne(s) seront DÉFINITIVEMENT retirées du livre… »), là où en création c'est un simple info.

### À faire
- **Re-paginer** le texte réassemblé en **pages de lecture** (≈ N lignes/page) pour que la re-découpe offre **le même confort « page de livre »** que la création (`totalPages > 1` → navigation + folio). Garder un mapping ligne-global cohérent pour `estValide`/`posTexte`.
- **Surligner le destructif sur la page** : les lignes **hors de toute semaine** (texte non couvert) en **barré** ton `retard`, plus une **bannière** `bg-retard-teinte` en bas : « **N lignes hors de toute semaine seront DÉFINITIVEMENT retirées du livre** ». Conserver le distinguo création (info) vs modification (destructif) déjà porté par `messages`.
- Marqueurs **pré-posés** (depuis `bornesInitiales`) visibles d'emblée ; on les **déplace** (re-clic) au lieu de repartir de zéro.

> Acceptation : la re-découpe se feuillette comme un livre ; le prof voit exactement quelles lignes seront perdues avant d'enregistrer.

---

## Rappels charte (déjà dans le codebase — réutiliser, ne pas redéfinir)
- **Monde Scriptorium** : poser `data-module="scriptorium"` sur le conteneur → pigment `#4A3A28` (`bg-pigment`/`text-pigment`/`border-pigment`), `--pigment-teinte` `#E6DDC9` (bande de ligne visée/marquée), `--fond-module` `#F0EADE`. **Jamais de hex en dur.**
- **Polices** : `font-marque` Cinzel (CAPS espacées : en-tête courant, sur-titres de chapitre) · `font-titre` Cormorant (titres de signets, titre du livre) · `font-corps` EB Garamond (`<body>`, texte du livre) · `font-ui` Alegreya Sans (UI, étiquettes, chips, numéros de ligne).
- **États (jetons)** : `ok`/`attention`/`retard`/`info` + `-teinte`. Ici : **début posé** → `ok` ; **borne à poser** → `attention` (`border-dashed`) ; **destructif** (hors-semaine en re-découpe) → `retard`. **Le rouge est réservé au destructif** — les marqueurs de semaine restent en pigment (noyer), pas en vert/rouge.
- **Pas de sceau Scriptorium** dans les assets : utiliser la **pastille de couleur** (jeton pigment) / une vignette livre. Le logo d'en-tête plateforme = `palimpseste_medaillon.png` (déjà dans `public/sceaux/`).
- **Cartes / surfaces** : `bg-surface border border-bordure rounded-xl`, séparateurs `border-bordure` discrets.

## Hors périmètre
- **Mobile** : aucun rendu mobile attendu (desktop only).
- **Logique métier** : pas de changement à la validation, à la pose des bornes, ni à la soumission (`creerLivre` / enregistrement re-découpe). On ne refait que la présentation.

## Checklist d'acceptation
- [ ] **Page de livre** : page entière visible (en-tête courant, marges, folio, pile) ; lignes cliquables ; ligne visée claire au survol ; numéros discrets ; plus de `max-h-96`.
- [ ] **Frise** : semaines posées sur une ligne, **seule l'active dépliée** (titre/chapitres/début/fin) ; inputs + champs cachés `decoupe_N_*` préservés.
- [ ] **Barre fine** : import/infos réduits à une ligne ; navigation page ; « Remplacer le PDF » ; variante re-découpe sans upload.
- [ ] **Plein cadre** : toggle « Masquer/Afficher la frise » ; page agrandie + guide bas + frise-progression ; clic-ligne identique.
- [ ] **Signets → titres** : niveau 0/1/2 rendus en partie/chapitre/sous-titre ; repli propre sans signets ; idem en re-découpe.
- [ ] **Re-découpe** : texte réassemblé re-paginé en pages ; lignes hors-semaine barrées `retard` + bannière destructive ; marqueurs pré-posés déplaçables.
- [ ] Aucune couleur/police en dur ; `poserLigne`/`estValide`/`messages`/champs cachés inchangés ; aucune régression de soumission.
