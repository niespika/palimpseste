# Handoff — Aletheia · fiche élève côté prof (réorganisation)

> Pour Claude Code. Objectif : réorganiser **`app/prof/aletheia/eleve/[eleveId]/page.tsx`** pour
> qu'un élève **multi-livres** (bi-classe, p.ex. en *T1* **et** en *THLP*) reste lisible. Aujourd'hui
> tout s'empile et devient illisible. **Aucune refonte fonctionnelle** : la machine à états
> (`StatutAletheia`), les retours IA, le **diagnostic prof-only**, le déblocage séquentiel et le
> **chargement des données** ne changent pas. On retouche **l'agencement** de la vue prof.

## Référence visuelle
- **`Aletheia Fiche élève prof Rendu Charte.dc.html`** — la **cible**, fidèle à la charte (ordi + mobile).
- **`Aletheia Fiche élève prof Wireframes.dc.html`** — le raisonnement (problème actuel, 3 pistes pour
  l'ouverture du détail, organisation anti-clutter du panneau). Contexte, optionnel.

Reproduire ce langage avec les composants du codebase (jetons `globals.css`, `next/font`, `Pastille`,
`CourbeEvolution`, `AtelierDeuxColonnes`, `VueRetourV1/VF`). Le sous-arbre est déjà sous
`data-module="aletheia"` → **pigment outremer** et **bouton minium `#B4452F`** hérités. Aucun hex en dur.

---

## Le problème (état actuel)
`page.tsx` boucle sur chaque livre de l'élève et **empile**, par livre :
`titre` → `TuileDiagnostic` (**une courbe par livre**) → `SemaineDrill` (**les N semaines listées
d'emblée**, chacune un `<details>` qui **déplie le détail sur place**) → carte d'architecture.
Avec 2 livres : 2 courbes + 2 listes complètes + le détail qui pousse tout vers le bas. Illisible.

Les livres de l'élève = union des livres assignés à ses classes **actives**
(`inscriptions` → `classe_id` → `livresDeClasse`), dédupliqués. C'est cette union qui s'empile.

## Les 3 décisions validées
1. **Un seul graphe** de progression, **tous les livres** confondus.
2. **Livres repliés par défaut**, **regroupés par classe**.
3. **Le détail d'une semaine ne s'empile plus** : **maître-détail** (colonne de droite sur ordi,
   **plein écran** sur mobile). Le détail garde les mêmes blocs, **hiérarchisés**.

---

## Chantier 1 — Le graphe unique « tous les livres » ⭐
Remplacer les `TuileDiagnostic` par livre par **un seul** `CourbeEvolution`.

- **Une série par livre** (`SerieCourbe` : `{ cle: livreId, label: livre.titre, couleur }`), au lieu de
  deux séries (thèse / arguments) par livre.
- **Axe Y** : `axeY="lettres"`, `domaine={[0,4]}` (E→A). **Axe X** : le **temps** (les rythmes T1/THLP
  s'entrelacent) — `cleX` = libellé de période/date. Privilégier la date réelle de la semaine
  (`dateIndicative` du document, à défaut l'horodatage du travail) ; repli acceptable = indice de
  semaine par livre aligné sur une échelle commune.
- **Bascule Arguments / Thèse** (segmented control, état client). La valeur tracée par point =
  `axe === 'arguments' ? niveauArgs(d) : niveauThese(d)`. **Extraire** `niveauThese` / `niveauArgs`
  (aujourd'hui en haut de `page.tsx`) dans un util partagé (p.ex. `app/prof/aletheia/diagnostic.ts`).
  Garder `connectNulls=false` (les semaines « mal définie » = trou dans la courbe).
- **Composant client** (le graphe porte un état) : p.ex.
  `app/prof/aletheia/eleve/[eleveId]/GrapheProgression.tsx` (`'use client'`), reçoit les diagnostics
  sérialisés par livre→semaine + la liste des livres, tient `axe` et construit `data`/`series`.
- **Une couleur par livre**, dans l'ordre de la palette Aletheia (voir § Couleurs), **outremer en
  premier** (couleur prioritaire du monde). `CourbeEvolution` gère déjà le multi-séries — **rien à y
  changer**.
- **Clic sur un point = ouvrir cette semaine.** Réutiliser le champ `href` par point de
  `CourbeEvolution` en pointant sur la **sélection** (voir Chantier 3) : `href: \`?l=${livreId}&s=${s}\``.

> Acceptation : un seul graphe ; les trajectoires des 2 livres d'Elo se comparent d'un coup d'œil ;
> la bascule montre l'autre axe ; cliquer un point sélectionne la semaine.

## Chantier 2 — Les livres repliés, par classe
Sous le graphe, la liste **maître** (colonne gauche sur ordi ; pleine largeur sur mobile).

- **Regrouper par classe.** Conserver la structure par classe au lieu d'aplatir dans un seul
  `livresMap` : charger le **nom des classes** des inscriptions actives et afficher une section par
  classe (« Terminale 1 · T1 », « Terminale HLP · THLP »), ses livres dessous. (Un même livre partagé
  par 2 classes : le rattacher à sa classe d'inscription ; cas rare.)
- **Carte-livre repliée par défaut** : `<Pastille module="aletheia" size={36} />` + `font-marque`
  ALETHEIA + titre (`font-titre`) + « `{done}`/`{total}` terminées » (`progression()`), liseré gauche =
  **couleur du livre**, chevron. **Déplier** = révéler la **liste des semaines** (l'architecture ne
  s'étale plus d'office).
- **Ligne-semaine** (au clic = `Link` vers `?l&s`) : numéro (`font-titre text-muet`), titre +
  `s.chapitres` (`text-pigment`), **micro-stepper 4 points**, badge `STATUT_LABEL[statut]`, et l'état
  sélectionné en `bg-pigment-teinte border-l-liseret`.
- **Micro-stepper** : réutiliser `indexEtape(statut)` / `ETAPES_SEMAINE`
  (extraits dans `app/eleve/modules/aletheia/etapes.ts` lors du chantier élève) — 4 points
  correspondant à Lecture · Retour · Réécriture · Retour final. **En pigment** (voir § Couleurs).
- **Carte d'architecture (capstone)** : ne pas la supprimer — la rattacher **par livre** (p.ex. action
  en pied de carte-livre dépliée, ou entrée dans l'aperçu du livre), avec l'état de génération actuel.

## Chantier 3 — Maître-détail (où s'ouvre la semaine)
La sélection vit dans l'**URL** : `searchParams` `?l=<livreId>&s=<semaine>` (marche pour le clic sur le
graphe, le clic sur une ligne, et le mobile ; en bonus c'est partageable).

- **Défaut** : pré-sélectionner la **dernière semaine rendue** (la plus récente `≠ DRAFT`).
- **Ordi** : deux colonnes — liste (gauche) figée, **panneau de détail** (droite). Le graphe reste
  au-dessus. Jamais de détail inséré sous la ligne.
- **Mobile** : pas de 2 colonnes. Quand `s` est défini, afficher le **détail en plein écran** avec
  « ← retour » (efface `s`) ; sinon la liste. Cibles tactiles ≥ 44px.

## Chantier 4 — Le panneau de détail, hiérarchisé (anti-clutter) ⭐
Ne **pas** redéverser V1 + retours + VF + diagnostic en vrac. Ordre imposé (réutilise l'existant) :

1. **En-tête** : `Pastille` (~56) + `font-marque` ALETHEIA · titre du livre, `Semaine N — {titre}`,
   `{chapitres} · {date}`, le **stepper nommé** (4 étapes ; tout `✓` si `DONE`), un chip d'état à droite.
2. **★ Diagnostic (prof-only)** — **en tête, le signal**. Réutiliser **`DetailDiagChapitre`**
   (`components/aletheia/Diagnostic.tsx` → `NiveauAxe` : thèse V1→VF, arguments V1→VF + note
   d'inventaire). L'envelopper dans une carte `border-l-4 border-l-liseret`, fond légèrement teinté
   pigment, surtitre `font-ui text-pigment` « ◆ Diagnostic de compréhension » + mention
   *« prof — jamais montré à l'élève »*. **Ne jamais rendre côté élève.**
3. **Avant / après (V1 → VF)** — la **preuve**. Réutiliser **`AtelierDeuxColonnes`**
   (labels « Premier jet » / « Version finale ») : gauche = `these`/`arguments` (V1, `text-muet`
   italique) ; droite = `these_vf`/`arguments_vf` (VF, `text-encre`, anneau pigment). Sur mobile :
   **bascule segmentée** (VF par défaut) — même composant que l'atelier élève.
4. **Les retours de l'IA** — **repliés** (`<details>`) : « Retour socratique (V1) » → `VueRetourV1` ;
   « Retour final (VF) » → `VueRetourVF` (`components/aletheia/VueRetours.tsx`).
5. **La saisie complète** — **repliée** (`<details>`) : `Champ`/`ListeChamp` (accord, questions,
   vocabulaire, arguments complets) — les helpers déjà présents dans `page.tsx`.

> Acceptation : le panneau s'ouvre sur **diagnostic → avant/après**, le verbeux est replié ; aucune
> donnée perdue. Plus rien ne s'empile sous la liste.

---

## Couleurs (important — corrige les écarts du 1ᵉʳ jet)
- **Une couleur par livre** (courbe + liseré de carte + légende), dans l'ordre, **outremer prioritaire** :
  `['#2C4A7C' (pigment outremer), '#B8893B' (accent or), '#B4452F' (minium), …]`. Passer par les jetons,
  pas de hex en dur ; n'« ouvrir » une teinte de plus que s'il y a un livre de plus.
- **Pastilles d'avancement et ✓ : en pigment (outremer), JAMAIS le vert `ok`** sur cette vue prof.
  Étape faite/courante = pigment plein ; à venir/verrouillée = creux (`border-bordure`). *(Spécifique à
  la fiche prof ; l'espace élève garde son vert `ok`.)*
- **États conservés** : « à valider » en **ocre** (`text-attention` / `bg-attention-teinte`, statut
  `FEEDBACK2_READY`) ; « à risque » en **rouge** (`text-retard`). Ne pas les passer en bleu.

## Inchangé (ne pas toucher)
- Chargement : `livresDeClasse`, `travauxEleve`, `chargerDiagnostics`, `chargerCapstoneLivre`,
  l'union des livres via `inscriptions` actives.
- Machine à états (`DRAFT`→`DONE`), retours IA, calcul du **diagnostic prof-only**, déblocage
  séquentiel, logique `niveauThese`/`niveauArgs` (seulement **extraite** dans un util).

## Charte (réutiliser, ne pas redéfinir)
- **Polices** : `font-marque` Cinzel · `font-titre` Cormorant Garamond · `font-corps` EB Garamond ·
  `font-ui` Alegreya Sans.
- **Jetons** : `text-pigment` (outremer), `bg-pigment-teinte`, `border-l-liseret`, `bg-surface`,
  `border-bordure`, `text-muet`, `text-attention`/`bg-attention-teinte`, `text-retard`,
  `bg-bouton` (minium). **Sceaux** : `components/Pastille.tsx` (PNG dans `public/sceaux/`).

## Responsive
- `lg` (≥1024) : graphe pleine largeur, puis **2 colonnes** (liste | détail) ; avant/après en 2 colonnes.
- Mobile : graphe + liste ; sélection → **écran plein** ; avant/après en **bascule** ; retour efface `s`.
- `print:hidden` sur les barres de nav.

## Checklist d'acceptation
- [ ] Un **seul graphe**, une **couleur par livre** (outremer d'abord), bascule **Thèse/Arguments**,
      clic sur point = ouvre la semaine.
- [ ] Livres **repliés par défaut**, **groupés par classe** ; déplier révèle les semaines
      (micro-stepper + badge) ; semaine sélectionnée mise en avant.
- [ ] **Maître-détail** : détail à droite (ordi) / plein écran (mobile), **jamais empilé** ;
      pré-sélection de la dernière semaine rendue.
- [ ] Panneau hiérarchisé : **diagnostic** (prof-only) → **avant/après** (`AtelierDeuxColonnes`) →
      retours IA & saisie **repliés**.
- [ ] **Aucune pastille/✓ en vert** ; ocre « à valider » et rouge « à risque » conservés ;
      aucun hex en dur. Données, machine à états et diagnostic **inchangés**.
