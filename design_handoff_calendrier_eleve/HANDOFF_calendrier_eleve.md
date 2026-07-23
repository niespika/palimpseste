# Handoff — Calendrier élève : vue « À venir » + mois tactile (mobile)

> Pour Claude Code. Objectif : sur mobile, remplacer la grille « mois » par défaut par une
> **liste « À venir »**, et rendre la grille « mois » réellement **tactile** (points + jour
> sélectionné). **Aucune** modification du contenu ni de la logique d'agrégation : on lit les
> mêmes échéances, on change la mise en page et la vue par défaut sous `640px`.

## Référence visuelle
Ouvrir dans un navigateur : **`Calendrier élève Rendu Charte.dc.html`** (cible à reproduire,
fidèle à la charte). Le diagnostic et les pistes comparées sont dans
**`Calendrier élève Wireframes.dc.html`**.

Reproduire le langage visuel avec les composants/conventions du codebase (React, classes
Tailwind de `globals.css`, `next/font`). **Aucune couleur ni police en dur** : jetons
(`bg-surface`, `text-encre`, `text-muet`, `border-bordure`…) et `font-marque`/`font-titre`/
`font-corps`/`font-ui`. Le code couleur des événements **reste celui en place** (couleur =
classe via `couleursParClasse`, `COULEUR_FRAGMENTS` pour le Fragment à rendre).

---

## Décisions validées par le porteur du projet
1. **Sur ordinateur (≥ 640px) : rien ne change.** Vues `mois` / `semaine` / `jour` conservées
   telles quelles.
2. **Sur mobile (< 640px) : la vue par défaut devient « À venir »** — une liste chronologique
   des échéances groupée par échéance temporelle. Elle répond directement à « qu'est-ce que je
   dois rendre, et quand ».
3. **La grille « Mois » reste accessible** sur mobile via une bascule, mais **repensée tactile** :
   les cases n'affichent que des **points** (pas de libellé), et **taper un jour** ouvre le détail
   dans un panneau **sous la grille** (au lieu de naviguer vers la vue `jour`).
4. Le contenu, l'agrégation (`assemblerEvenements`), la numérotation des semaines
   (`calculerGrilleSemaines`) et le filtrage par classe ne changent pas.

---

## Fichier concerné
- **`app/eleve/calendrier/page.tsx`** — quasi tout se passe ici (server component).
- Aucun nouveau composant client n'est nécessaire si on suit l'approche « tout par querystring »
  ci-dessous (recommandée). Un petit composant client n'est utile que si tu préfères une bascule
  sans rechargement (cf. note en fin).
- `components/nav/BarreOngletsMobile.tsx` : **inchangé** — l'onglet « Agenda » pointe déjà vers
  `/eleve/calendrier` (sans `?vue`), qui rendra désormais « À venir » par défaut sur mobile.

---

## Chantier 1 — Nouvelle vue « À venir » (agenda), défaut sur mobile

### a) Type & résolution de la vue
```ts
type Vue = 'agenda' | 'mois' | 'semaine' | 'jour'
```
Règle de défaut **responsive** (le serveur ne connaît pas la largeur) :
- Si `?vue` est **absent** → on rend **deux blocs** côte à côte et on les bascule en CSS :
  l'agenda en `block sm:hidden`, le mois en `hidden sm:block`. (Défaut = à venir sur mobile,
  mois sur ordi.)
- Si `?vue` est **présent** (l'élève a tapé un segment) → on honore ce choix à toutes les
  largeurs (`block`).

```ts
const sp = await searchParams
const vueExplicite = (['agenda','mois','semaine','jour'] as const).includes(sp.vue as Vue)
  ? (sp.vue as Vue) : null
const vue: Vue = vueExplicite ?? 'mois' // 'mois' = base desktop ; l'agenda mobile est géré par les classes CSS quand vueExplicite === null
```

### b) Fenêtre de données
L'agenda regarde **vers l'avant** ; la grille regarde le mois courant. Calcule une fenêtre
**union** pour ne faire qu'un seul passage d'agrégation :
```ts
const today = jourParis(new Date())
// fenêtre agenda : aujourd'hui → +6 semaines
const finAgenda = toISODate(addDaysUTC(parse(today), 42))
// debut/fin du mois (existant) → union
const debut = min(debutMois, today)
const fin   = max(finMois, finAgenda)
```
Réutilise `assemblerEvenements({ debut, fin })` + la requête `fragments_semaines` existante,
puis le `Map<jour, Evt[]>` `parJour` déjà construit. **Rien de neuf côté données.**

### c) Construction de la liste « À venir »
```ts
// Tous les événements datés >= aujourd'hui, déjà triés par date dans assemblerEvenements.
const aVenir = [...partages, ...fragments]
  .filter(e => e.date >= today)
  .sort((a, b) => a.date.localeCompare(b.date))

// Groupes : 1) aujourd'hui  2) reste de la semaine courante  3) chaque semaine suivante
// On s'appuie sur la grille pédagogique pour les libellés de semaine.
const grilleParJour = (jour: string) => grille.find(w => w.start <= jour && jour <= w.end)
```
Libellés de groupe (cf. maquette) :
- `today` → **« AUJOURD'HUI · JEU 25 SEPT »** (les items du jour même).
- semaine courante (hors aujourd'hui) → **« CETTE SEMAINE »**.
- semaines suivantes → **« SEMAINE {pedagogicalNumber} · {start, ex. 29 SEPT} → »**
  (ou **« (VACANCES) »** si `w.isVacation`, avec `w.vacanceLabel`).

### d) Rendu d'une ligne d'agenda
Carte `bg-surface border border-bordure rounded-xl`, en `flex items-center gap-3`,
**pleine largeur** :
- pastille `w-2.5 h-2.5 rounded-full` à la **couleur de la classe** (`couleurs.get(classe_id)`),
  ou `COULEUR_FRAGMENTS` pour un Fragment ;
- libellé en `font-corps` (`text-encre`) ; sous-titre en `font-ui text-xs text-muet`
  (`classe_nom` + échéance/heure) ;
- chevron `→` `text-muet` ;
- l'item du **jour même** porte un liseré gauche couleur classe : `border-l-4` + la couleur en
  style inline (cf. tuiles `border-l-liseret` existantes).
- **Cible tactile ≥ 44px** (padding `py-2.5`/`px-3.5` minimum).

> Lien : si l'item a une cible naturelle (atelier du module), pointe dessus ; sinon, lien vers
> `?vue=jour&date={e.date}` (le détail du jour). À défaut, ligne non cliquable — ne pas inventer
> de route.

### e) Bascule (segmented) dans l'en-tête
- **Mobile (`sm:hidden`)** : segmented à 2 segments **[À venir | Mois]** → liens
  `?vue=agenda` / `?vue=mois`. Style = bascule de l'atelier Aletheia (fond `bg-parchemin-fonce`,
  segment actif `bg-surface` + ombre légère, `font-ui`).
- **Desktop (`hidden sm:flex`)** : la bascule existante **[Mois | Semaine | Jour]** — inchangée.

---

## Chantier 2 — Grille « Mois » tactile sur mobile

Même bloc `vue === 'mois'`, deux ajustements **responsive** (aucune refonte) :

### a) Cases « points seulement » sur petit écran
Dans `Pastille`, masque le **libellé** sous `sm` et ne garde que le point :
```tsx
const Pastille = ({ e }) => (
  <div className="flex items-center gap-1.5" title={e.sousTitre ? `${e.label} · ${e.sousTitre}` : e.label}>
    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.couleur }} />
    <span className="hidden sm:inline text-[11px] text-encre-douce truncate">{e.label}</span>
  </div>
)
```
Sur mobile, regroupe les points d'une case en une rangée centrée (`flex justify-center gap-0.5`)
plutôt qu'empilés ; cap à ~3 points + `+N`. Réduis `min-h` des cases sous `sm` (`min-h-12`).

### b) Jour sélectionné → panneau de détail SOUS la grille (mobile)
Plutôt que de naviguer vers `vue=jour`, introduis un param **`?jour=YYYY-MM-DD`** (défaut =
`today`) actif en vue mois :
- chaque case du mois est un `<Link href={lien('mois', anchor)}&jour={jour}>` → la grille **reste
  affichée**, seul le panneau se met à jour ;
- la case `jour` sélectionnée prend un fond plein (`bg-encre text-surface rounded-lg` façon
  maquette) ;
- **sous la grille** (`sm:hidden`), un panneau `bg-surface border border-bordure rounded-xl`
  titré **« {jour en toutes lettres} »** liste les événements de `parJour.get(jour)` (même
  rendu de ligne qu'en agenda, sans le chevron). Vide → « Rien à faire ni à rendre ce jour. »

> Sur desktop, le comportement actuel (case = lien vers `vue=jour`) peut rester : le panneau
> sous-grille est `sm:hidden`. Ne change pas la vue `jour` plein écran existante.

---

## Récap des blocs rendus par `page.tsx`
| Bloc | Visibilité | Source |
|---|---|---|
| Segmented **[À venir \| Mois]** | `sm:hidden` | nouveau |
| Bascule **[Mois \| Semaine \| Jour]** | `hidden sm:flex` | existant |
| **Agenda** (liste groupée) | `vueExplicite===null ? 'block sm:hidden' : (vue==='agenda'?'block':'hidden')` | nouveau (Chantier 1) |
| **Mois** (grille) | `vueExplicite===null ? 'hidden sm:block' : (vue==='mois'?'block':'hidden')` | existant + Chantier 2 |
| Panneau jour (sous grille) | `sm:hidden`, en vue mois | nouveau (Chantier 2b) |
| **Semaine** / **Jour** | `vue==='semaine'` / `'jour'` | existant, inchangé |

---

## Responsive (rappel)
- `< 640px` : défaut = **À venir** ; « Mois » = points + panneau jour. Barre d'onglets en bas
  (onglet **Agenda** actif). Cibles ≥ 44px.
- `≥ 640px` : **inchangé** — mois / semaine / jour, libellés dans les cases, bascule à 3 segments.
- `print:hidden` déjà géré au niveau du layout pour les barres de nav.

## Checklist d'acceptation
- [ ] `/eleve/calendrier` sans `?vue` : **liste « À venir »** sur mobile, **grille mois** sur ordi.
- [ ] Mobile : segmented [À venir | Mois] ; taper « Mois » bascule sans perdre le mois courant.
- [ ] « À venir » : groupes Aujourd'hui / Cette semaine / Semaine N ; lignes pleine largeur,
      libellé + classe + échéance lisibles ; couleur = classe (et `COULEUR_FRAGMENTS`).
- [ ] Mois mobile : cases à points seulement ; jour sélectionné mis en évidence ; panneau de
      détail sous la grille se met à jour via `?jour=`.
- [ ] Desktop ≥ 640 : aucune régression (mois/semaine/jour identiques, libellés en clair).
- [ ] Aucune couleur/police en dur ; agrégation et numérotation des semaines inchangées ;
      onglet « Agenda » de la barre du bas toujours actif sur cette route.

## Note (option sans rechargement)
L'approche « querystring » ci-dessus est 100 % server-component (pas de JS, liens uniquement).
Si tu veux une bascule À venir/Mois et une sélection de jour **sans rechargement**, extrais un
petit client component (`'use client'`) qui reçoit en props l'agenda pré-calculé et le
`Map parJour` sérialisé, et gère `useState` pour le segment actif + le jour sélectionné. Non
nécessaire pour l'acceptation — à faire seulement si la latence de navigation gêne à l'usage.
