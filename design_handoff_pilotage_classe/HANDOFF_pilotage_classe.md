# Handoff — Pilotage Classe (rendu charte)

> Pour Claude Code. Objectif : créer la section **Pilotage Classe** — la page qui s'ouvre
> quand on clique une carte-classe. Elle remplace l'ancien dépli illisible « liste d'élèves
> sous la grille ». **Cœur livrable = la vue Activité** (matrice élèves × modules) + le
> réglage des **accès modules**. La vue **Compétences existe mais reste un placeholder non
> câblé** (voir Chantier 4). On réutilise la logique métier existante (santé par inscription,
> dépôts fragments, etc.) — on ajoute une **vue matricielle** et un **toggle**.

## Références visuelles
Deux fichiers HTML accompagnent ce document (ouvrir dans un navigateur) :
- **`Pilotage Classe Rendu Charte.dc.html`** — rendu hi-fi fidèle à la charte (le « quoi », à reproduire) : Activité ordi + mobile, Compétences ordi + mobile (sous ruban « en construction »), panneau d'accès modules ordi + feuille mobile.
- **`Pilotage Classe Wireframes.dc.html`** — wireframes low-fi annotés (le « pourquoi ») : liaison carte→section, matrice, bulles à risque, toggle, accès, mobile à colonne figée.

Reproduire le **langage visuel** avec les composants/conventions du codebase (React, jetons Tailwind de `globals.css`, `next/font`). **Aucune couleur ni police en dur** — réutiliser les jetons (`bg-surface`, `text-encre`, pigments par `data-module`…) et les composants existants (`Tuile`, `Pastille`, `BarreNavigation`, `EnTeteMobileProf`, `LogoPalimpseste`).

---

## Décisions validées par le porteur du projet
1. **La carte-classe ouvre une page Pilotage dédiée** (plein cadre), au lieu de déplier la liste d'élèves sous la grille du tableau de bord. Route cible : `/prof/classes/[classeId]` (ou équivalent existant).
2. **Vue Activité = matrice élèves × modules** : 1 ligne / élève, 1 colonne / module accessible. Chaque case dit **où en est l'élève** + **s'il a une action à faire**.
3. **Bulle « à risque »** : pastille ronde rouge avec « ! » en tête de ligne, sur les deux vues. Cliquable → fiche élève.
4. **Toggle Activité / Compétences** présent sur la page. **La vue Compétences est un placeholder** : architecture visuelle en place, mais **pas de données ni de calcul** — état « en construction » assumé (voir Chantier 4).
5. **Réglage des modules accessibles à la classe** : chips rapides en haut de matrice + panneau « Gérer les accès » (interrupteur par module). Couper un module grise sa colonne (« — »).
6. **Responsive** : sur mobile, colonne élève **figée** à gauche, modules/compétences en **défilement horizontal** ; toggle + accès en **feuille (bottom-sheet)**.

---

## Chantier 1 — Entrée : la carte-classe ouvre le Pilotage

### Existant
Sur le tableau de bord (`app/prof/page.tsx`), la grille « Mes classes » utilise `Tuile` ; un `?classe=<id>` ouvrait un `DetailClasse` **déplié sous la grille** (liste d'élèves). Cf. handoff Tableau de bord, Chantier 4.

### À faire
- **Rendre la carte-classe cliquable vers une page** `/prof/classes/[classeId]` (Pilotage Classe), **au lieu** du dépli sous la grille. Conserver le composant `Tuile` (santé en bord gauche, résumé) ; la carte entière devient un lien.
- Le « détail classe » historique (liste d'élèves simple) peut être **retiré du tableau de bord** au profit de cette page — à confirmer avec le porteur si une vue intermédiaire reste utile.
- En haut de la page : fil d'ariane `Pilotage · Classes › <Nom classe>`, titre `font-titre`, méta (`Niveau · N élèves · année · N à risque`).

---

## Chantier 2 — Vue Activité (matrice élèves × modules) — **le cœur**

### Données (déjà calculées, à agréger par élève × module)
Par **inscription** (un élève dans une classe) on dispose déjà, selon le module :
- **Quazian** : backlog de révision FSRS → `N à réviser` (action si > seuil) / `à jour`.
- **Aletheia** : avancement lecture (`lecture k/n`), diagnostic à faire → action.
- **Fragments** : dépôts (`nbDeposes/nbSemaines`, `nbManquants`) → `6/8 · 2 à faire` (action si manquants) / `à jour`.
- **Codex** : écrits en cours / à rendre → action si `à rendre`.
- **Scriptorium** : idem une fois le module présent (ici coupé pour la classe).

### Construire
- Un composant **`MatricePilotage`** (table sémantique : `role="table"` ou `<table>`).
  - **Colonne 1 = élève** : largeur fixe (~180px), nom `font-corps`, précédé de la **bulle à risque** si `enDifficulte` (cf. Chantier 5). Triable. Cliquable → `/prof/eleves/[eleveId]`.
  - **Une colonne par module accessible** (en-tête : pastille couleur `bg-pigment` + nom `font-marque` via `data-module`). L'ordre suit `NAV_PROF`/`Modules`.
  - **Cellule = statut élève×module** : un petit composant `CelluleModule` qui rend, selon l'état :
    - **action attendue** → chip `bg-retard-teinte text-retard` (ex. « 2 à faire », « 12 à réviser », « 1 à rendre », « diagnostic à faire »).
    - **en cours / position** → texte `text-encre-douce` (ex. « lecture 3/5 », « 2 en cours »).
    - **rien à faire** → « à jour » en `text-ok`.
    - **module non accessible** → « — » en `text-muet` sur fond légèrement teinté (`bg-parchemin`/atténué).
- **Tri** : par défaut « à risque d'abord », puis options « nom » / « par module ». Pied de table : `+ N autres élèves…`.
- **Cellule cliquable (optionnel, à confirmer)** : ouvrir le détail élève×module (vue module existante filtrée sur l'élève). Si non retenu pour l'instant, garder la cellule non interactive.

> Acceptation : une classe de N élèves se lit comme un tableau ; on repère en un coup d'œil qui a une action (chips rouges) et qui est à risque (bulles).

---

## Chantier 3 — Accès modules (par classe)

### À faire
- **Barre « Modules accessibles »** au-dessus de la matrice : une chip par module (pastille + nom + ✓ actif / ☐ inactif). Clic = bascule rapide on/off.
- **Bouton « ⚙ Gérer les accès »** → panneau (desktop : popover/dialog ; mobile : bottom-sheet) listant tous les modules avec **un interrupteur (`Switch`) + sceau (`Pastille`) + description**. Boutons « Annuler » / « Enregistrer ».
- **Effet** : un module **coupé** disparaît du parcours élève **et** sa **colonne se grise** dans la matrice (cellules « — », en-tête atténué « non activé »). **Réactivable sans perte de données.**
- **Source de vérité** : un réglage `accesModules` **par classe** (persisté). Lire la même liste pour peupler les chips, le panneau et les colonnes de la matrice (pas de duplication).

> À trancher avec le porteur (laissé en question dans la maquette) : accès aussi réglable **par élève** ? Et **qui** peut couper un module (prof vs admin) ?

---

## Chantier 4 — Toggle Activité / Compétences — **Compétences = placeholder non câblé**

### Intention (validée)
Le **toggle doit exister et être visible** dès maintenant (segmented control `Activité | Compétences`, près du titre sur desktop, pleine largeur sur mobile). **Mais la vue Compétences n'est pas alimentée** : il n'y a pas encore de référentiel de compétences ni de calcul de niveau. On **prépare l'emplacement** pour que ce soit rempli plus tard, sans le faire vivre.

### À faire
- **Implémenter le toggle** (état d'URL recommandé : `?vue=activite|competences`, défaut `activite`). Les deux segments sont cliquables, l'actif est en `bg-encre text-surface`.
- **Vue Activité** : pleinement fonctionnelle (Chantier 2).
- **Vue Compétences** : rendre une **coquille `MatriceCompetences`** reprenant **exactement le même squelette** (colonne élève figée + bulles ; colonnes = compétences ; cellule = pastille-lettre A→D), mais :
  - **Aucune donnée réelle** : afficher un **état « en construction »** — bandeau `border-dashed` ton attention + **ruban d'angle « EN CONSTRUCTION »**, et soit des cellules vides/`–`, soit des données de démonstration **clairement marquées fictives**. Ne **pas** brancher de calcul.
  - **Laisser des points d'extension explicites dans le code** (commentaires `// TODO compétences :`), prêts à recevoir : la **liste des compétences** (libellés + ordre), l'**échelle** (A→D ou acquis/en cours/fragile), la **source** du niveau (auto par module ou saisie prof). Idéalement, typer une interface `Competence` / `NiveauCompetence` vide à compléter.
- **Pastille-lettre** (`PastilleNiveau`) à créer même si non câblée : rond/carré arrondi, lettre `font-titre`, couleurs par niveau via jetons — A `ok`, B `neutre/muet`, C `attention`, D `retard`, `–` `muet`. Réutilisable quand les données arriveront.

> Acceptation : le prof voit et peut activer l'onglet **Compétences** ; il atterrit sur une grille **visuellement prête mais explicitement « en construction »**, sans donnée trompeuse. Brancher les vraies données sera un lot ultérieur **sans retoucher la mise en page**.

---

## Chantier 5 — Bulle « à risque »

- Composant **`BulleRisque`** : pastille ronde ~18px, `bg-retard`, « ! » blanc `font-ui` bold, `aria-label="élève à risque"`. Rendue en tête de la **colonne élève**, sur **les deux vues**.
- Affichée si l'inscription est `enDifficulte` (même calcul que la page « à risque » : fragment manquant / moyenne sous seuil / retard de révision). Cliquable → `/prof/eleves/[eleveId]` (ou tooltip de la/les raison(s)).
- Sert aussi de **clé de tri** « à risque d'abord ».

---

## Chantier 6 — Responsive (mobile)

- **Colonne élève figée** à gauche (nom + bulle), **modules/compétences en défilement horizontal** : `overflow-x:auto` sur la zone des colonnes, première colonne `sticky left-0` avec ombre portée. Indice « glisser → » sous la table. Lignes à hauteur fixe pour aligner les deux zones.
- **Toggle** Activité/Compétences pleine largeur sous l'en-tête. **Chips d'accès** en rangée scrollable + bouton `⚙` ouvrant la **feuille « Modules accessibles »** (bottom-sheet).
- **En-tête mobile** via `EnTeteMobileProf` (retour `← Classes`, titre, **logo médaillon en pastille** à droite). `<main>` `pb-20` pour la barre d'onglets.
- Cibles tactiles ≥ 44px ; `print:hidden` sur barres de nav.

---

## Rappels charte (déjà dans le codebase — réutiliser, ne pas redéfinir)
- **Polices** : `font-marque` Cinzel (CAPS espacées, noms de module) · `font-titre` Cormorant (titres, lettres de niveau) · `font-corps` EB Garamond (`<body>`, noms d'élèves) · `font-ui` Alegreya Sans (nav, badges, chips, dates).
- **Couleurs (jetons, jamais de hex)** : `bg-parchemin`/`parchemin-fonce`, `bg-surface`, `text-encre`/`encre-douce`/`muet`, `border-bordure`. États : `ok`/`attention`/`retard`/`info` + `-teinte`. Pigments par monde via `data-module="aletheia|fragments|codex|quazian|scriptorium"` → `bg-pigment`, `text-pigment`, `bg-pigment-teinte`.
- **Sceaux** : composant `Pastille` (disque teinté + PNG N&B `mix-blend-multiply`). Logo = `palimpseste_medaillon.png`. ⚠️ **Scriptorium n'a pas encore de sceau** dans les assets — utiliser la **pastille de couleur seule** (jeton pigment `scriptorium`) en attendant, ou en produire un sur le même gabarit.
- **Cartes / table** : `bg-surface border border-bordure rounded-xl` ; en-tête de table `bg-parchemin` ; séparateurs `border-bordure` discrets.

## Checklist d'acceptation
- [ ] Cliquer une carte-classe ouvre la page **Pilotage Classe** (plus de dépli liste sous la grille).
- [ ] **Vue Activité** : matrice élèves × modules ; cellules = position / action (chip rouge) / « à jour » / « — » si non accessible ; tri « à risque d'abord ».
- [ ] **Bulles à risque** en tête de ligne sur les deux vues ; cliquables.
- [ ] **Accès modules** : chips rapides + panneau (desktop) / feuille (mobile) ; couper un module grise sa colonne ; réglage **par classe**, source unique.
- [ ] **Toggle Activité/Compétences** présent et fonctionnel ; **Compétences = coquille « en construction »**, sans données câblées, avec `// TODO compétences` et `PastilleNiveau` prêts.
- [ ] **Mobile** : colonne élève figée + défilement horizontal ; toggle + accès en feuille ; logo en pastille ; cibles ≥ 44px.
- [ ] Aucune couleur/police en dur ; **aucune régression** (santé, dépôts, intégrité, accès existants).
