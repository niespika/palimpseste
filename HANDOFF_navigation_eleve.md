# Handoff — Réorganisation de la navigation (espace élève)

> Pour Claude Code. Objectif : appliquer dans le codebase Next.js/Tailwind existant la
> réorganisation validée en maquette. **Pas de refonte fonctionnelle** : on garde la
> logique métier, on change l'agencement et la hiérarchie de l'information.

## Références visuelles
Deux fichiers HTML accompagnent ce document (ouvrir dans un navigateur) :
- **`Palimpseste Navigation Wireframes.dc.html`** — wireframes low-fi : le diagnostic, les 3 pistes comparées, et les écrans repensés annotés (le « pourquoi »).
- **`Palimpseste Rendu Charte.dc.html`** — rendu hi-fi fidèle à la charte (le « quoi », à reproduire). C'est la cible visuelle.

Reproduire le **langage visuel** de ces maquettes avec les composants/conventions du codebase (React, classes Tailwind de `globals.css`, `next/font`). Les couleurs et polices sont déjà définies dans le projet — réutiliser les jetons (`bg-pigment`, `text-encre`, `font-marque`…), ne pas réintroduire de hex en dur.

---

## Décisions validées par le porteur du projet
1. **Modèle mental conservé** : « un monde = une couleur ». On ne range pas par tâche.
2. **Navigation = Piste A « Aujourd'hui »** :
   - **Mobile** : barre d'onglets fixe en bas (4 onglets). Plus de menu déroulant tactile.
   - **Ordi/laptop** : **on garde les menus déroulants** existants (`Modules ▾`) — moins de clics. La barre du bas est masquée.
3. **Problème nº1 = densité** : trop d'infos empilées « une tuile sous l'autre ». On introduit une **hiérarchie** (une action « maintenant » dominante, le reste compact) et surtout le **feedback côte à côte avec la réécriture** (Aletheia + Codex).
4. Écrans prioritaires : **Tableau de bord**, **Aletheia (atelier)**, **écriture + réception de feedback (Aletheia & Codex)**. Quazian traité aussi.

---

## Chantier 1 — Navigation Piste A (responsive)

### Existant
- `components/nav/configNavigation.ts` → `NAV_ELEVE` (3 entrées : Tableau de bord, Calendrier, Modules ▾).
- `components/nav/BarreNavigation.tsx` → barre d'onglets + déroulants (desktop). Bien construite, **à garder pour ≥ `sm`**.
- `app/eleve/layout.tsx` → header `sticky top-0` + `<BarreNavigation tabs={NAV_ELEVE} />`, contenu `max-w-4xl`.

### À faire
**a) Garder `BarreNavigation` sur desktop, la masquer sur mobile.**
Dans `app/eleve/layout.tsx`, le bloc qui contient `<BarreNavigation>` :
```tsx
<div className="hidden sm:block max-w-4xl mx-auto px-4 sm:px-6 pb-2">
  <BarreNavigation tabs={NAV_ELEVE} />
</div>
```

**b) Créer `components/nav/BarreOngletsMobile.tsx`** — barre fixe en bas, visible `sm:hidden` uniquement.
- 4 onglets : **Aujourd'hui** (`/eleve`), **Modules** (`/eleve/modules/...` → ouvre une feuille/liste des 4 mondes, ou route vers une page index modules), **Agenda** (`/eleve/calendrier`), **Moi** (profil/déconnexion).
- `position: fixed; bottom: 0; inset-inline: 0`, `bg-surface border-t border-bordure`, `z-20`, `print:hidden`.
- Onglet actif en `text-encre` + pictogramme plein ; inactif `text-muet`. Réutiliser `usePathname()` comme dans `BarreNavigation`.
- Hauteur cible ~60px + `padding-bottom: env(safe-area-inset-bottom)`. **Cibles tactiles ≥ 44px.**
- Icônes : trait simple (lucide-react si déjà présent, sinon SVG inline). Pas d'emoji.

**c) Compenser la barre** : sur mobile, ajouter `pb-20 sm:pb-8` au `<main>` pour que le contenu ne passe pas sous la barre.

**d) Onglet « Modules » mobile** : comme le déroulant n'existe pas au tactile, soit (i) une page `app/eleve/modules/page.tsx` = grille des 4 mondes (sceau + nom + état), soit (ii) une feuille (bottom-sheet) listant les 4 liens de `NAV_ELEVE`. Option (i) recommandée (réutilise les cartes « Mes mondes » du tableau de bord).

> Acceptation : sur largeur < 640px, barre du bas visible, header déroulant masqué ; sur ≥ 640px, l'inverse. L'onglet actif reflète toujours la route.

---

## Chantier 2 — Tableau de bord : hiérarchie au lieu de pile

### Existant
`app/eleve/page.tsx` — sections empilées « À faire » / « Ta progression » / « Tes modules », toutes de même poids visuel.

### Cible (voir hi-fi, bande A)
Réordonner en **3 niveaux de poids** :
1. **Héros « À faire maintenant »** — UNE carte large = la tâche la plus urgente. Têtière (`h-1.5`) à la couleur du **module concerné** ; titre `font-titre` (Cormorant) ~24px ; bouton primaire `bg-bouton text-surface` (couleur du module). Choisir l'item le plus prioritaire (retard > échéance proche > retour à lire).
2. **« Ensuite cette semaine »** — liste **compacte** de lignes (pas de grandes cartes) : pastille couleur module + libellé + échéance/badge d'état. 1 ligne par item.
3. **Colonne droite (desktop, `lg:grid-cols-[1.5fr_1fr]`)** : **« Mes mondes »** (4 lignes : `<Pastille module size={34}>` + nom `font-marque` en `text-pigment` du module + badge d'état) et **« Progression »** condensée en **une bande** (3 chiffres A/B/C en `font-titre`, couleurs d'état), au lieu de 3 cartes.

Sur mobile, tout passe en une colonne ; la progression reste une seule bande compacte.

> Le but : l'œil voit immédiatement « quoi faire », puis « quoi ensuite », puis l'état des mondes. Plus de 3 blocs équivalents.

---

## Chantier 3 — Aletheia : l'atelier (retour ↔ réécriture côte à côte) ⭐

C'est le correctif central. **Fichier : `app/eleve/modules/aletheia/[livreId]/[semaine]/page.tsx`.**

### Problème actuel
La page empile verticalement (`space-y-5`) : Bloc 1 (lecture) → Bloc 2 (**retour V1**) → Bloc 3 (**réécriture VF**) → Bloc 4 (retour final). Quand l'élève réécrit (Bloc 3), le retour (Bloc 2) est plus haut → scroll incessant entre lire et réécrire.

### Cible
**Quand l'étape de réécriture est active** (`statut === 'FEEDBACK1_READY'`, là où s'affiche `FormulaireVf`), passer en **deux colonnes** :

```tsx
{statut === 'FEEDBACK1_READY' ? (
  <div className="grid gap-4 lg:grid-cols-2 items-start">
    {/* Gauche — retour épinglé */}
    <div className="lg:sticky lg:top-24 space-y-3">
      <p className="font-ui text-xs tracking-[0.1em] text-muet">◆ TON RETOUR — RESTE VISIBLE</p>
      <VueRetourV1 retour={t.retour_v1} montrerRemarque={evalQuestions} />
    </div>
    {/* Droite — réécriture */}
    <div>
      <p className="font-ui text-xs tracking-[0.1em] text-muet mb-2">✎ TA VERSION FINALE</p>
      <FormulaireVf livreId={livreId} semaine={semaine} … />
    </div>
  </div>
) : ( /* …états non-réécriture inchangés… */ )}
```

Points clés :
- La colonne retour est **`lg:sticky lg:top-24`** (top = hauteur du header sticky) → elle reste à l'écran pendant qu'on remplit les champs.
- `VueRetourV1` (dans `components/aletheia/VueRetours.tsx`) est **réutilisé tel quel** — déjà en bulles priorisées avec bords `border-l-liseret/attention/ok/info`.
- **Stepper** en haut (Lecture ✓ · Retour ✓ · **Réécriture** · Retour final) pour situer l'élève — petit composant local, 4 pastilles + libellés, état courant en `text-pigment`.
- **Mobile (`< lg`)** : pas de 2 colonnes. Le retour devient un **bandeau dépliable épinglé** (`<details>` ou état, `sticky top-[header]`) au-dessus du formulaire, + éventuellement une bascule **Réécriture / Retour complet**. Le formulaire reste l'élément principal.
- Les autres états (lecture initiale, attente, retour final Bloc 4) **restent en pile** — seul l'écran de réécriture devient bi-colonne.

> Acceptation : en `FEEDBACK1_READY` sur desktop, le retour V1 reste visible (sticky) pendant qu'on tape la VF, sans scroll pour le relire. Sur mobile, le retour est accessible en 1 tap sans quitter le formulaire.

---

## Chantier 4 — Codex : même geste

**Fichiers : `app/eleve/modules/codex/synthese/[sessionId]/EcranVF.tsx`** (+ `EcranV1.tsx`, `CaptureManuscrit.tsx`).

L'écran VF demande déjà de « garder les suggestions sous les yeux » mais les place **au-dessus** de la zone de capture photo. Appliquer **exactement le même pattern** que le Chantier 3 :
- 2 colonnes `lg:grid-cols-2 items-start` : **gauche = suggestions V1** (`lg:sticky lg:top-24`), **droite = capture du manuscrit + bouton « Envoyer ma V-finale »**.
- Mobile : suggestions en bandeau dépliable épinglé au-dessus de la zone photo.
- Réutiliser le composant de rendu des suggestions existant (équivalent `VueRetours` côté Codex) ; ne pas réécrire le contenu.

> Bénéfice transverse : Aletheia et Codex partagent **une seule disposition d'atelier** → un seul geste à apprendre pour l'élève. Envisager d'extraire un wrapper commun `components/AtelierDeuxColonnes.tsx` (props : `retour`, `formulaire`) si la duplication gêne.

---

## Chantier 5 — Quazian : séparer révision et quizz

**Fichiers : `app/eleve/modules/quazian/page.tsx`, `QuazianDashboard.tsx`, `SessionRevision.tsx`, `quizz/[quizId]/…`.**

L'accueil mélange aujourd'hui flashcards et quizz. Cible (voir hi-fi, bande D) :
- **Écran d'entrée** = 2 zones nettes : en haut **Réviser** (2 stats « à réviser » / « au total » + CTA primaire `Réviser mes N cartes` + lien `Consulter toutes mes cartes`) ; en dessous section **QUIZZ** = liste de quizz avec **statut** (`ouvert` en `bg-pigment-teinte text-pigment`, `corrigé` + note `/10`).
- **Flashcard (`SessionRevision`)** : déjà bien (carte plein écran, barre de progression `N/total`, 4 boutons Raté/Difficile/Bien/Facile). À conserver ; veiller au plein cadre et aux cibles ≥ 44px sur mobile.
- **Quizz jetons (`PassationJetons`)** : déjà « une question à la fois » + pastilles de progression. S'assurer que le **total 100/100** est toujours visible et que les +/− (ou glisseur tactile) sont confortables au doigt.

Ce chantier est surtout de la **clarification de mise en page**, pas de logique.

---

## Rappels charte (déjà dans le codebase — réutiliser, ne pas redéfinir)
- **Polices** : `font-marque` Cinzel (CAPS espacées, noms de module/marque) · `font-titre` Cormorant (titres, grands chiffres) · `font-corps` EB Garamond (`<body>`) · `font-ui` Alegreya Sans (nav, badges, boutons, dates).
- **Pigment par monde** via `data-module="aletheia|fragments|codex|quazian"` sur le conteneur de page → `bg-pigment`, `text-pigment`, `bg-pigment-teinte`, `bg-bouton`. (⚠ Aletheia : `--bouton` = minium `#B4452F`, pas le bleu.)
- **États** : `text-ok`/`bg-ok-teinte` (fait), `text-attention`/`bg-attention-teinte` (à faire), `text-retard`/`bg-retard-teinte` (retard), `text-info`/`bg-info-teinte`.
- **Sceaux** : composant `Pastille` (`components/Pastille.tsx`, disque teinté + image N&B `mix-blend-multiply`, `filter:brightness(1.09) contrast(1.04)`). PNG dans `public/sceaux/`.
- **Cartes** : `bg-surface border border-bordure rounded-xl` ; têtière colorée = `<div className="h-1.5 bg-pigment" />` ; tuile à bord gauche = `border-l-4 border-l-pigment`.

## Responsive (mobile / tablette / laptop)
- Mobile : 1 colonne, barre d'onglets en bas, ateliers en bandeau dépliable.
- `sm` (≥640) : header déroulant réapparaît, barre du bas disparaît.
- `lg` (≥1024) : ateliers Aletheia/Codex en 2 colonnes, retour `sticky`; tableau de bord en `1.5fr / 1fr`.
- Toujours : cibles tactiles ≥ 44px, `print:hidden` sur les barres de nav.

## Checklist d'acceptation
- [ ] Mobile < 640 : barre d'onglets bas (4) ; header nav masqué ; `<main>` non masqué par la barre.
- [ ] Desktop ≥ 640 : `BarreNavigation` (déroulants) conservée ; barre du bas masquée.
- [ ] Tableau de bord : 1 héros « À faire maintenant » dominant + « Ensuite » compact + « Mes mondes »/progression condensés.
- [ ] Aletheia `FEEDBACK1_READY` : retour V1 sticky à gauche, VF à droite (desktop) ; bandeau dépliable (mobile). Stepper présent.
- [ ] Codex VF : suggestions sticky à gauche, capture à droite ; même pattern.
- [ ] Quazian : écran d'entrée sépare Réviser / Quizz ; flashcard et quizz plein cadre.
- [ ] Aucune couleur/police en dur : tout via jetons et `font-*`. Aucune régression fonctionnelle (statuts Aletheia, FSRS Quazian, Brier quizz inchangés).
