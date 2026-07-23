# Handoff — Tableau de bord prof (rendu charte)

> Pour Claude Code. Objectif : appliquer dans le codebase Next.js/Tailwind existant la
> maquette validée du **tableau de bord enseignant**. **Pas de refonte fonctionnelle** :
> on garde la logique métier (santé par inscription, validation fragments, intégrité,
> effacement, coût API) ; on change l'**agencement**, la **hiérarchie**, on branche une
> **nav mobile** et on pose le **logo** partout.

## Références visuelles
Deux fichiers HTML accompagnent ce document (ouvrir dans un navigateur) :
- **`Tableau de bord prof Wireframes.dc.html`** — wireframes low-fi : diagnostic, 3 pistes de nav mobile, 3 pistes de dashboard, drill-down et à-risque, annotés (le « pourquoi »).
- **`Tableau de bord prof Rendu Charte.dc.html`** — rendu hi-fi fidèle à la charte (le « quoi », à reproduire). C'est la cible visuelle : tableau de bord (mobile + ordi), détail de classe, élèves à risque.

Reproduire le **langage visuel** avec les composants/conventions du codebase (React, jetons Tailwind de `globals.css`, `next/font`). **Aucune couleur ni police en dur** — réutiliser les jetons (`bg-surface`, `text-encre`, `font-marque`…) et les composants existants (`Tuile`, `DetailClasse`, `Pastille`, `BarreNavigation`).

---

## Décisions validées par le porteur du projet
1. **Nav = Option A** : barre d'onglets en bas sur **mobile** ; **déroulants conservés** sur ordi (`BarreNavigation` + `NAV_PROF`). La barre du bas reprend les **3 groupes de `NAV_PROF`** + **Moi**.
2. **Tableau de bord = Piste A « file d'actions »** : une action dominante « à traiter maintenant », le reste compact, **le coût API intégré au fil d'action** (plus une section isolée).
3. **Logo Palimpseste** (le **sceau seul, sans le mot dessous**) en **pastille ronde** sur **tous les écrans** : en-tête desktop **et** en-tête de chaque écran mobile.
4. **Drill-down classe → élève** : sur ordi la tuile **se déplie sous la grille** (comportement actuel, à conserver) ; sur mobile, **écran plein** « détail classe », retour en haut.
5. **Élèves à risque** : page dédiée groupée par classe, chaque élève portant **sa raison**.

---

## Chantier 1 — Nav prof responsive (Option A)

### Existant
- `components/nav/configNavigation.ts` → `NAV_PROF` (3 onglets : **Tableau de bord** ; **Pilotage ▾** = Élèves / Classes / Calendrier / Intégrité ; **Modules ▾** = Fragments / Scriptorium / Quazian / Codex / Aletheia / Gérer les accès).
- `components/nav/BarreNavigation.tsx` → barre + déroulants (desktop). **À garder pour ≥ `sm`**.
- `app/prof/layout.tsx` → header `sticky top-0`, `<BarreNavigation tabs={NAV_PROF} />`, contenu `max-w-6xl`.

### À faire
**a) Garder `BarreNavigation` sur desktop, la masquer sur mobile** dans `app/prof/layout.tsx` :
```tsx
<div className="hidden sm:block max-w-6xl mx-auto px-4 sm:px-6 pb-2">
  <BarreNavigation tabs={NAV_PROF} />
</div>
```

**b) Créer `components/nav/BarreOngletsMobileProf.tsx`** — barre fixe en bas, `sm:hidden` uniquement. **4 onglets** alignés sur `NAV_PROF` :
- **Tableau de bord** → `/prof` (lien direct).
- **Pilotage** → ouvre une **feuille (bottom-sheet)** listant les `items` du groupe Pilotage (Élèves, Classes, Calendrier, Intégrité).
- **Modules** → feuille listant les `items` du groupe Modules.
- **Moi** → feuille profil + `deconnexion` (action déjà dans `app/prof/actions.ts`).
- Source de vérité unique : **lire `NAV_PROF`** pour peupler les feuilles (pas de liste dupliquée).
- `position: fixed; bottom:0; inset-inline:0`, `bg-surface border-t border-bordure`, `z-20`, `print:hidden`, hauteur ~60px + `padding-bottom: env(safe-area-inset-bottom)`. **Cibles ≥ 44px.**
- Onglet actif (`usePathname()`, même logique que `BarreNavigation`) en `text-encre` + pictogramme plein ; inactif `text-muet`. Icônes trait simple (lucide-react si présent), **pas d'emoji**.
- Badges d'alerte optionnels sur un onglet (ex. compteur intégrité sur Pilotage) — facultatif.

**c) Compenser la barre** : `<main>` du layout prof → `pb-20 sm:pb-8`.

> Acceptation : < 640px → barre du bas (4) visible, header déroulant masqué ; ≥ 640px → l'inverse. L'onglet actif reflète toujours la route.

---

## Chantier 2 — Logo Palimpseste sur tous les écrans

### Asset
`public/sceaux/palimpseste.png` contient le **sceau + le mot « PALIMPSESTE » dessous** → ne pas l'utiliser tel quel pour le logo. **Ajouter `public/sceaux/palimpseste_medaillon.png`** = recadrage **carré centré sur le cercle gravé** (sans le mot). Le fichier est déjà produit dans le projet de maquette (`sceaux/palimpseste_medaillon.png`) — le copier dans `public/sceaux/`. Recette si à refaire : crop carré de `palimpseste.png` (≈ côté `0.515·largeur`, origine `x≈0.243·largeur`, centré verticalement sur `≈0.417·hauteur`).

### Composant
Réutiliser la technique de `Pastille` (disque teinté clair + image N&B `mix-blend-mode: multiply`, `filter: brightness(1.05) contrast(1.05)`). Soit un petit composant dédié :
```tsx
// components/nav/LogoPalimpseste.tsx
import Image from 'next/image'
export default function LogoPalimpseste({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-surface border border-bordure overflow-hidden flex-shrink-0"
          style={{ width: size, height: size }}>
      <Image src="/sceaux/palimpseste_medaillon.png" alt="Palimpseste" width={size} height={size}
             style={{ objectFit: 'cover', filter: 'brightness(1.05) contrast(1.05)', mixBlendMode: 'multiply' }} />
    </span>
  )
}
```

### Placement
- **Desktop** (`app/prof/layout.tsx` header) : à **gauche du wordmark** `PALIMPSESTE` (lockup emblème + nom), `size≈32`.
- **Mobile** : pastille en **haut à droite** de l'en-tête de **chaque écran** prof (`size≈28`). Comme chaque page mobile a son propre en-tête (retour + titre), factoriser un **`components/EnTeteMobileProf.tsx`** (props : `retourHref?`, `titre`, `sousTitre?`) rendant `[← retour] … [titre/sousTitre] … [LogoPalimpseste]` et l'utiliser sur le tableau de bord, le détail de classe et la vue à-risque. `sm:hidden` (le header desktop prend le relais ≥ `sm`).

> Acceptation : le **médaillon sans le mot** est visible sur le header desktop **et** sur tous les en-têtes mobiles (tableau de bord, détail classe, à-risque).

---

## Chantier 3 — Tableau de bord Piste A (`app/prof/page.tsx`)

### Existant
Sections empilées de même poids : `TuilesJourSemaine` + `BandeCalendrier` → « À faire » → « Santé de la cohorte » (grille 3 cartes) → `CoutApi` → « Classes » (tuiles) → `DetailClasse`. Les données sont déjà calculées dans la page : `aValider`, `tachesCal`, `rappels`, `sante`/`SanteInscription`, agrégats par classe, `CoutApi`.

### Cible (voir hi-fi)
Réordonner en **3 niveaux de poids** :
1. **Héros « À TRAITER MAINTENANT »** — UNE carte large = l'action la plus urgente. **Priorité** : fragments à valider (`aValider`) > signalement/blocage intégrité > échéance proche (`tachesCal`). Têtière `h-1.5` à la couleur du **contexte** (ex. Fragments via `data-module="fragments"` → `bg-pigment`) ; titre `font-titre` ~24px ; bouton primaire menant à l'action (`/prof/fragments-erudition/analyse/[depotId]` etc.).
2. **« À préparer »** — liste **compacte** (1 ligne/item, pas de grandes cartes) : pastille couleur + libellé + échéance/badge. Y brancher, dans l'ordre, **intégrité** (en `text-retard`/`bg-retard-teinte`), les **échéances** (`tachesCal`), les **rappels d'effacement** (`RappelsClasses`), et **le coût API en dernière ligne** (montant du mois + lien « détail → »). ⇒ **déplacer `CoutApi`** de section isolée vers cette ligne du fil (garder le composant, le rendre « ligne »).
3. **Colonne droite** (`lg:grid-cols-[1.5fr_1fr]`, 1 colonne en mobile) :
   - **Santé de la cohorte** condensée : grand `font-titre` `%` à jour (`pctAJour`, `text-ok`), lien « N à risque → » (`/prof/a-risque`), et les **3 premiers** noms à risque.
   - **Mes classes** : une **`Tuile` compacte par classe**, `couleur` = santé (`vert`/`neutre`/`rouge`), `resume` = nb élèves + « N à risque · N à valider » / « à jour ». (Composant `Tuile` déjà charté.)
- Le **calendrier** (`TuilesJourSemaine`/`BandeCalendrier`) passe **sous le pli** (ou rejoint Pilotage › Calendrier — à confirmer avec le porteur). Ne plus le mettre en tête.

> But : l'œil voit « quoi traiter », puis « quoi préparer » (coût API compris), puis l'état des classes. Plus de cinq sections équivalentes.

---

## Chantier 4 — Détail classe (drill-down) — `DetailClasse` + `Tuile`

### Existant
`components/classes/DetailClasse.tsx` (shell tuile → liste élèves, `statut` + `actions` injectés) ; sur le dashboard, `?classe=<id>` ouvre le `DetailClasse` sous la grille. `StatutEleve` affiche déjà dépôts/manquants/moyenne/backlog/badge.

### À faire
- **Ligne élève — réordonner le `statut`** : mettre **en tête** le **badge à risque / à jour** + les **dépôts fragments** (`N/M dépôts`, `K manquants` en `text-retard`) ; reléguer en gris discret (`text-muet`) le reste (moyenne en lettres, backlog révision, essai, Codex). C'est la hiérarchie demandée sur la ligne.
- **Desktop** : conserver le **dépli sous la grille** (les autres classes restent en contexte). Garder `action` = `ConfirmationEffacement` (effacer la classe) et `actions` de ligne = `BoutonRetirerEleve`.
- **Mobile** : la tuile pousse un **écran plein** « détail classe » (utiliser `EnTeteMobileProf` avec `retourHref="/prof"` ou `/prof/classes`). Le détail plein écran masque la grille (`sm:` rétablit le dépli). Garder « Effacer la classe » en bas et « Retirer » par ligne.

---

## Chantier 5 — Élèves à risque (`app/prof/a-risque/page.tsx`)

### Existant
Page dédiée alimentée par `calculerSante` (`SanteInscription` : `nbManquants`, `moyenne`, `backlogRevision`, `enDifficulte`, scopé par **inscription**).

### Cible (voir hi-fi)
- **Titre** « N élèves à risque » + définition courte (au moins un signal : fragment manquant / moyenne sous seuil / retard de révision).
- **Groupé par classe** (`TERMINALE HLP · 4`, …). Chaque ligne : nom + **sa raison en chips colorées** :
  - fragment(s) manquant(s) → `text-retard` / `bg-retard-teinte`.
  - moyenne sous le seuil (en **lettres**) → `text-attention` / `bg-attention-teinte`.
  - retard de révision → `text-info` / `bg-info-teinte`.
  - + lien « Ouvrir la fiche → » (`/prof/eleves/[eleveId]`).
- **Par inscription** : un élève bi-classe n'apparaît qu'au titre du **contexte** où il décroche.

---

## Chantier 6 — Fiche élève (le hub) — `app/prof/eleves/[eleveId]/page.tsx`

### Existant
Hub transverse déjà en place : en-tête (nom, email, **chips de classes** actives) + section **« Par module »** = grille de `Tuile` (Fragments, Quazian, Codex, Aletheia) liant vers les vues détaillées par module ; `couleur='vert'` si le module est **assigné à sa classe**, `'neutre'` sinon (« Module non assigné à sa classe »). C'est le point d'entrée derrière « Ouvrir la fiche → ».

### À faire (charté, sans casser le hub)
- **Mettre l'en-tête à la charte** : nom `font-titre`, email `text-muet`, chips de classes en `bg-info-teinte text-info` (déjà le cas). Sur mobile, utiliser `EnTeteMobileProf` (retour + nom + logo).
- **Cartes par module en variante sceau** : `Tuile` supporte `module` + `avecSceau` → afficher la **`Pastille` du module** + le nom en `font-marque` `text-pigment`, le bord gauche au pigment ; garder l'état « non assigné » (carte atténuée, `border` pointillé, pas de lien).
- **Encart « Signaux » (PROPOSITION — à valider avant implémentation)** : juste sous l'en-tête, une carte `border-l-4 border-l-retard` qui explique le « à risque » **dans le contexte de la classe** : la/les **raison(s)** en chips (mêmes codes que le Chantier 5) + une bande de 3 chiffres (**dépôts fragments**, **moyenne en lettres**, **révision Quazian**). Données déjà disponibles via `SanteInscription` (`nbDeposes`/`nbSemainesPassees`, `nbManquants`, `moyenne`, `backlogRevision`). Si l'élève est multi-classe, montrer les signaux **par inscription** (un encart par classe, ou un sélecteur de contexte). Ne pas l'ajouter tant que le porteur n'a pas tranché — le hub reste fonctionnel sans lui.

> Acceptation : la fiche garde son rôle de hub (accès par module corrects + état d'assignation) ; en arrivant depuis « à risque », la raison et les chiffres clés sont visibles d'emblée (si l'encart Signaux est retenu).

---

## Rappels charte (déjà dans le codebase — réutiliser, ne pas redéfinir)
- **Polices** : `font-marque` Cinzel (CAPS espacées, marque/noms de module) · `font-titre` Cormorant (titres, grands chiffres) · `font-corps` EB Garamond (`<body>`) · `font-ui` Alegreya Sans (nav, badges, boutons, dates).
- **Couleurs (jetons, jamais de hex)** : `bg-parchemin` / `parchemin-fonce`, `bg-surface`, `text-encre` / `text-encre-douce` / `text-muet`, `border-bordure`. États : `text-ok`/`bg-ok-teinte`, `text-attention`/`bg-attention-teinte`, `text-retard`/`bg-retard-teinte`, `text-info`/`bg-info-teinte`. Pigments par monde via `data-module="aletheia|fragments|codex|quazian"` → `bg-pigment`, `text-pigment`, `bg-pigment-teinte`.
- **Sceaux** : composant `Pastille` (disque teinté + PNG N&B `mix-blend-multiply`). Logo = `palimpseste_medaillon.png` (cf. Chantier 2).
- **Cartes** : `bg-surface border border-bordure rounded-xl` ; têtière colorée = `<div className="h-1.5 bg-pigment" />` ; tuile à bord gauche = `border-l-4` (état ou pigment).

## Responsive
- Mobile (< 640) : 1 colonne ; barre d'onglets en bas ; header desktop masqué ; `<main>` `pb-20` ; en-têtes via `EnTeteMobileProf` (retour + titre + logo) ; détail classe en écran plein.
- `sm` (≥ 640) : `BarreNavigation` (déroulants) réapparaît ; barre du bas masquée.
- `lg` (≥ 1024) : dashboard `1.5fr / 1fr` ; détail classe déplié sous la grille.
- Toujours : cibles tactiles ≥ 44px ; `print:hidden` sur les barres de nav.

## Checklist d'acceptation
- [ ] Mobile < 640 : barre d'onglets bas (4 ; Pilotage/Modules ouvrent une feuille issue de `NAV_PROF`) ; header déroulant masqué ; `<main>` non masqué par la barre.
- [ ] Desktop ≥ 640 : `BarreNavigation` conservée ; barre du bas masquée.
- [ ] **Logo médaillon (sans le mot)** visible sur **tous** les écrans : header desktop + chaque en-tête mobile (tableau de bord, détail classe, à-risque).
- [ ] Tableau de bord : 1 héros « à traiter maintenant » dominant + « à préparer » compact **incluant le coût API en ligne** + santé/classes condensés ; calendrier sous le pli.
- [ ] Ligne élève (détail classe) : **badge à risque/à jour + dépôts fragments en tête** ; reste en gris.
- [ ] Détail classe : déplié (desktop) / écran plein (mobile) ; « Retirer » et « Effacer la classe » accessibles.
- [ ] À-risque : groupé par classe, **raison en chips** colorées, calcul **par inscription**.
- [ ] Fiche élève : hub « par module » charté (sceaux + état d'assignation) ; encart Signaux **si retenu** (raison + dépôts/moyenne/révision, par inscription) ; logo en en-tête mobile.
- [ ] Aucune couleur/police en dur ; **aucune régression fonctionnelle** (santé, validation fragments, intégrité, effacement, coût API).
