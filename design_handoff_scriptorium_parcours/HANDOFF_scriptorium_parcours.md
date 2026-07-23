# Handoff — Scriptorium · Onglet « Parcours » (rendu charte)

> Pour Claude Code. Objectif : **réorganiser l'onglet « Parcours » du Scriptorium**, qui a
> beaucoup bougé et souffre de clutter. Aujourd'hui, en arrivant sur l'onglet : une longue
> tuile « Plan d'évaluation » en tête, puis un bouton « Nouveau parcours », puis la grille
> des parcours ; parcours et évaluations sont mêlés, les vues empilent les informations, les
> zones de choix sont floues, l'écriture est petite. On **refait la présentation** de quatre
> écrans **sans toucher à la logique métier** (création/assignation de parcours, gabarits de
> modèle, génération/validation de plan, publication d'horaire).
> **Ordinateur uniquement** — le mobile est hors périmètre.

## Références visuelles
Deux fichiers HTML accompagnent ce document (ouvrir dans un navigateur) :
- **`Scriptorium Parcours - Rendu charte.dc.html`** — rendu hi-fi fidèle à la charte (le « quoi », à reproduire) : les 4 écrans retenus, habillés (Cinzel/Cormorant/EB Garamond/Alegreya Sans, pigment noyer, sceau, états).
- **`Scriptorium Parcours - Wireframes.dc.html`** — wireframes low-fi annotés (le « pourquoi ») : chaque écran en **« réf. actuel »** + les pistes comparées. **Options retenues : 1f · 2d · 3d · 4e.**

Reproduire le **langage visuel** avec les composants/conventions du codebase (React, jetons Tailwind de `globals.css`, `next/font`). **Aucune couleur ni police en dur** — réutiliser les jetons (`bg-surface`, `text-encre`, pigment par `data-module="scriptorium"`…) et les composants existants.

---

## Architecture concernée (existant — à lire avant de coder)
Point d'entrée : **`app/prof/scriptorium/page.tsx`** — une seule page pilotée par `?vue=`
(`parcours`, `evaluations`, `modeles`, `classes`, `ressources`…). L'onglet « Parcours » de la
Barre 2 regroupe **parcours + evaluations + modeles**. C'est cette famille qu'on ré-agence.

- **Parcours**
  - `parcours/donnees.ts` — `chargerListeParcours()`, `chargerParcoursDetail()`, `chargerCiblesPicker()`.
  - `parcours/FormulaireParcours.tsx` — création (titre + nb semaines) → ouvre le détail.
  - `parcours/GrilleParcours.tsx` — **le builder** : semaines 1..N, chaque semaine ses **créneaux** (Texte / Cours / Livre), monter/descendre, déplacer, retirer.
  - `parcours/PickerContenu.tsx` — panneau « + Ajouter » d'une semaine (onglets Textes/Cours/Livres + recherche ; livre entier ou en tranche).
  - `parcours/AssignationClasses.tsx` + `parcours/frise-serveur.ts` — assignation **par classe** : date de début propre à la classe, **aperçu des échéances** (semaine → date réelle), **publication de l'horaire** (fige les dates, signale les décalages).
- **Plans d'évaluation (modèles + instances)**
  - `evaluations/FormulaireCreerModele.tsx` — création d'un **modèle** (titre, **gabarit** `tc`/`hlp`/`vierge`, date d'ancre).
  - `evaluations/GrilleModele.tsx` + `modele-serveur.ts` — le modèle : exercices posés par semaine d'enseignement, changement de gabarit, recalage.
  - `evaluations/AssignationModeleClasses.tsx` — assigner le modèle à des classes → **chaque assignation matérialise un plan indépendant**.
  - `evaluations/GrillePlan.tsx` + `plan-serveur.ts` + `panoptique-serveur.ts` + `panoptique-bandes.tsx` — **le plan d'une classe** : semaines, exercices (statut `conçu`/`à concevoir`/`en retard`, caler le jour, déplacer, retirer), **bandes panoptique** (enseignements du parcours, lectures, reflets, budget, synthèses), validation.
- **Tuiles** : `components/Tuile.tsx` (nom + sous-titre + bord d'état) — réutilisées partout dans les listes.

> Règle d'or : les 4 chantiers ci-dessous sont de la **présentation**. Les Server Actions
> (`creerParcours`, `ajouterCreneau`, `assignerParcoursClasse`, `publierHoraire`,
> `creerModele`, `assignerModeleClasse`, `ajouterExercice`, `validerPlan`…) et leurs contrats
> ne changent pas.

---

## Décisions validées par le porteur du projet
1. **Un accueil clair à cinq portes** (option **1f**) : deux mondes côte à côte — **Parcours** (noyer) et **Plans d'évaluation** (ocre) — chacun avec son bouton *créer*, une recherche, des **groupes repliables** (Assignés / Sans classe · Validés / Brouillons / Sans plan) et un **repli de colonne entière** (l'autre s'étale sur 2 colonnes). Le segment **Par classe / Modèles** loge la 5ᵉ porte.
2. **Builder de parcours aéré + repliable** (option **2d**) : semaines en liste, **une seule dépliée** à la fois (survol de tout le parcours d'un coup d'œil) ; **assignation par classe à droite**, chaque classe repliable (dépliée = date + aperçu des échéances + état de publication).
3. **Création de plan sur un écran** (option **3d**) : formulaire en haut-gauche (**date de début à côté du titre**), **aperçu vivant de la cadence** à droite (ce que le gabarit va générer, semaine par semaine), **assigner des classes** en bas-gauche. Plus d'espace mort à droite.
4. **Plan d'une classe lisible** (option **4e**) : à gauche le **bilan d'avancement** (grand chiffre + barre + légende conçus/à concevoir/en retard) puis la **liste des semaines** ; à droite le **détail d'une semaine** — d'abord ce qu'on **évalue** (exercices éditables), le **contexte du parcours** en une ligne teintée noyer. Sépare « ce que j'évalue » de « ce que la classe vit ».
5. **Fil couleur constant** : Parcours = noyer `#4A3A28` · Plans d'évaluation = ocre `#9A6A2E`, sur toute la famille d'écrans.
6. **Boutons estompés** (préférence projet) : même teinte, désaturée/éclaircie.
7. **Ordinateur seulement** (≥ ~1024 px, non tactile).

---

## Chantier 1 — Accueil de l'onglet (remplace la barre + bouton + grille empilés)

### Existant
`?vue=parcours` sans parcours sélectionné : une barre gatée « 📋 Plan d'évaluation · Modèles · Par classe », puis `FormulaireParcours` (« + Nouveau parcours »), puis la grille des parcours. Les modèles et les plans par classe vivent dans des vues séparées (`?vue=modeles`, `?vue=evaluations`). Résultat : on ne sait pas d'un coup d'œil où aller.

### À faire (option 1f)
- **Deux colonnes côte à côte**, chacune une carte `bg-surface border border-bordure rounded-xl` avec **têtière colorée** (`border-top: 3px`) :
  - **◆ Parcours** (noyer) — titre `font-titre`, compteur, `⟨` de repli de colonne. Dedans : bouton **＋ Nouveau parcours** (estompé), champ de recherche, groupe **▾ Assignés** (liste), groupe replié **▸ Sans classe · N**.
  - **◆ Plans d'évaluation** (ocre) — segment **Par classe / Modèles**, `⟩` de repli. Dedans : bouton **＋ Nouveau plan d'évaluation** (estompé), recherche, **▾ Validés** (liste), **▸ Brouillons**, **▸ Sans plan**.
- **Lignes compactes en tableau bordé** (une par item) : pastille d'état (assigné/validé = `text-ok`) + nom (`font-corps` 15px) + méta (`font-ui`, ex. « 12 sem · 2 cl. » / « validé »). ~10 tiennent sans scroll ; les items actifs remontent, le reste se plie.
- **Repli de colonne** : `⟨`/`⟩` réduit une colonne à un **rail vertical** (nom du monde + compteur en `writing-mode:vertical-rl`) ; l'autre colonne récupère la largeur et passe **sur 2 colonnes**. Fonctionne dans les deux sens.
- Titre de page **« Parcours & plans d'évaluation »** (`font-titre`) **centré** + sous-titre italique centré.
- Les cibles restent les mêmes que les vues actuelles (créer = ancien `FormulaireParcours` / `FormulaireCreerModele` ; item = détail existant).

> Acceptation : les cinq portes sont lisibles d'un coup d'œil ; parcours et évaluations ne se mélangent plus ; la liste tient l'échelle (25+ parcours) sans lourdeur.

---

## Chantier 2 — Parcours : composer & assigner (remplace la liste empilée + assignation en pied)

### Existant
`GrilleParcours` empile toutes les semaines ouvertes (badges + titres + selects minuscules `▲▼`), puis `AssignationClasses` en dessous (cartes par classe). Tout en une colonne.

### À faire (option 2d)
- **Deux colonnes** sous une barre de contenu (retour **« ← Tous les parcours »** + titre du parcours en `font-titre`).
  - **Gauche — builder** (parchemin chaud) : semaines en **liste repliable**. Une semaine **repliée** = une ligne (`▸ S{n}` + résumé « 2 contenus » / « vide »). Une semaine **dépliée** = carte bordée pigment, ses **créneaux** (poignée `⠿` + **badge de type** + titre + « Retirer ») et **＋ Ajouter un contenu** (ouvre le picker existant). Une seule ouverte à la fois ; bouton **⊟ Tout replier**.
  - **Droite — assignation** (surface claire) : « Assigner à une classe » ; **chaque classe repliable** — dépliée = date de début + **aperçu des échéances** (Sem. → date) + état **publié ✓** ; repliée = une ligne (nom + « sans date » / bouton **Assigner** estompé).
- **Badges de type de créneau** (jetons) : **Texte** → `ok-teinte`/`ok` ; **Livre** → `info`/aletheia bleu (`#DDE3EC`/`#2C4A7C`) ; **Cours** → parchemin/muet neutre. (Aligner sur `badgeClasse()` existant.)
- Conserver monter/descendre/déplacer/retirer et le picker Textes/Cours/Livres (entier ou tranche) — seule la **mise en forme** change.

> Acceptation : on survole tout le parcours d'un coup d'œil, on déplie la semaine qu'on édite ; l'assignation vit à droite sans quitter l'écran ; l'aperçu des échéances est visible dès qu'une date est posée.

---

## Chantier 3 — Créer un plan d'évaluation (remplace le formulaire étroit à moitié vide)

### Existant
`FormulaireCreerModele` : formulaire étroit (`max-w-md`) — titre, gabarit (radios), date — avec **toute la moitié droite de l'écran vide**.

### À faire (option 3d)
- **Colonne gauche — formulaire** (parchemin chaud) : titre de page **« Nouveau plan d'évaluation »** avec le champ **Date de début à côté du titre** (rangée `space-between`) ; puis **Titre** ; puis **Gabarit de cadence** (les 3 options `tc`/`hlp`/`vierge` en cartes radio, la sélectionnée bordée ocre). En bas de la même colonne, **« Assigner à des classes »** : une ligne par classe (nom + date + bouton **Assigner** estompé) + le rappel « chaque assignation crée un plan indépendant ».
- **Colonne droite — aperçu de la cadence** (surface claire, pleine hauteur) : liste semaine par semaine de ce que le gabarit **va générer** (date de lundi + **chip de type** : Écriture = `ok`, Lecture = `info`/bleu + « maison »/« classe »), + « ≈ N exercices sur l'année ». Change avec le gabarit (TC/HLP/Vierge).
- L'écran combine **création** (`creerModele`) **et** l'**assignation** (`assignerModeleClasse`) — deux Server Actions existantes, aucune nouvelle.

> Acceptation : plus d'espace mort ; on voit ce que la cadence va poser ; on peut créer **et** assigner sur un seul écran.

---

## Chantier 4 — Organiser un plan assigné à une classe (remplace les 5-6 bandes empilées)

### Existant
`GrillePlan` : par semaine, on empile enseignements + exercices + lectures + reflets + budget + synthèses ; contrôles minuscules. Chaque semaine devient un mur.

### À faire (option 4e)
- Barre de contenu : retour **« ← Toutes les classes »** + **« TG1 — Plan 2026–2027 · TC · brouillon »** + bouton **Valider le plan** (estompé, vert) à droite.
- **Colonne gauche** (parchemin chaud) :
  - **Bilan d'avancement** : grand chiffre `font-titre` (ex. « 18 exercices »), **barre segmentée** (conçus `ok` / à concevoir doré / en retard `retard`), et **légende sur une seule rangée, 3 colonnes** (● 5 conçus · ● 11 à concevoir · ● 2 en retard).
  - **Liste des semaines** : une ligne par semaine (date + résumé « Écriture · Quiz » + pastille(s) d'état) ; la semaine ouverte surlignée pigment/ocre.
- **Colonne droite — détail de la semaine** (surface claire) :
  - En-tête « Semaine du … » + chip **budget** si dépassé (`retard`).
  - **Contexte parcours** en **une ligne teintée noyer** (`border-left` pigment) : « Enseigné cette semaine · via le parcours — Cours … · Lecture … ». C'est le lien visuel avec l'onglet Parcours.
  - **Exercices à évaluer** : lignes éditables (type + lieu + échéance + **pastille de statut** conçu `ok` / en retard `retard` / à concevoir `attention` ; « caler le jour » pour les exercices en classe ; « Déplacer ») + **＋ Ajouter un exercice**.
  - Pied discret : « 🕮 Lecture Aletheia attendue · ✍ Fragment attendu ».
- Séparer visuellement **« ce que j'évalue »** (exercices, devant, éditables) de **« ce que la classe vit »** (contexte, en retrait). Conserver `ChangerGabarit`, `Recalage`, `ReglageFragments`, les bandes de `panoptique-bandes.tsx` — reskin, pas de refonte logique.

> Acceptation : chaque semaine est une carte calme ; le contexte du parcours tient sur une ligne ; le bilan du plan reste sous les yeux.

---

## Rappels charte (déjà dans le codebase — réutiliser, ne pas redéfinir)
- **Monde Scriptorium** : `data-module="scriptorium"` → pigment `#4A3A28` (`bg-pigment`/`text-pigment`/`border-pigment`), `--pigment-teinte` `#E6DDC9`, `--fond-module` `#F0EADE`. **Jamais de hex en dur.**
- **Fil des deux familles** : **Parcours = pigment noyer** `#4A3A28` · **Plans d'évaluation = ocre** `#9A6A2E` (têtières, boutons, eyebrows). L'ocre sert de **cadre de famille**, pas de statut ; les statuts gardent les jetons d'état.
- **Boutons estompés** (préférence projet, cf. `CLAUDE.md`) — mêmes teintes, désaturées/éclaircies ; à porter en jetons dédiés dans `globals.css` :
  - Parcours (noyer estompé) : fond `#6B5A46`, texte `#F1EADD`.
  - Plans / évaluation (ocre estompé) : fond `#AC8552`, texte `#FBF5EA`.
  - Validation (vert estompé) : fond `#737F5E`, texte `#F1F3E9`.
  - Vaut pour les boutons pleins **et les segments actifs** (ex. « Par classe »).
- **Polices** : `font-marque` Cinzel (marque/module) · `font-titre` Cormorant (titres de page/section, **grands chiffres** du bilan) · `font-corps` EB Garamond (`<body>`, noms d'items) · `font-ui` Alegreya Sans (nav, badges, dates, boutons, tableaux).
- **États (jetons)** : `ok` `#5B6E4A`/`#E4E8D8` · `attention` `#9A6A2E`/`#EFE4CF` · `retard` `#A23E2E`/`#EFD9D2`. Ici : assigné/validé/conçu → `ok` ; brouillon/à concevoir → `attention` ; en retard/budget dépassé → `retard`.
- **En-tête** : le nouvel en-tête à deux barres (`handoff_en_tete/`) porte l'identité (marque + Scriptorium + devise « Ars Docendi — D'une main à l'autre » + sous-onglets `Classes · Parcours · Ressources · Paramètres`). Ces écrans commencent **sous** lui ; **aucun** fil d'Ariane ni bouton retour dans l'en-tête — les retours vivent en tête du contenu.
- **Cartes / surfaces** : `bg-surface border border-bordure rounded-xl`, séparateurs `border-bordure` discrets. Colonnes des écrans 2/3/4 : gauche parchemin chaud, droite surface claire (mêmes deux tons partout).

## Hors périmètre
- **Mobile** : aucun rendu mobile attendu (desktop only).
- **Logique métier** : pas de changement aux Server Actions ni aux contrats de données (parcours/créneaux, modèle/exercices, plan/panoptique, assignation, publication d'horaire). On ne refait que la présentation.
- **En-tête du site** : traité par son propre handoff (`handoff_en_tete/`) — ne pas le refaire ici.

## Checklist d'acceptation
- [ ] **Accueil (1f)** : deux mondes noyer/ocre, boutons *créer*, recherche, groupes repliables, repli de colonne → l'autre sur 2 colonnes ; lignes compactes en tableau bordé ; titre centré ; les 5 portes lisibles.
- [ ] **Parcours (2d)** : semaines repliables (une ouverte), badges de type, picker conservé ; assignation à droite avec classes repliables + aperçu des échéances + publication.
- [ ] **Création de plan (3d)** : date à côté du titre ; gabarit en cartes ; aperçu de la cadence à droite (plein) ; assignation des classes sur le même écran.
- [ ] **Plan d'une classe (4e)** : bilan (grand chiffre + barre + légende 3 colonnes) + liste des semaines à gauche ; détail à droite (contexte parcours teinté noyer + exercices éditables + statuts) ; « Valider le plan » dans le contenu.
- [ ] **Fil couleur** noyer/ocre constant ; **boutons estompés** (jetons) ; **aucune couleur/police en dur** ; Server Actions et contrats inchangés ; pas de retour dans l'en-tête ; desktop only.
