# PROMPT — Session Code ⚙️ : C2.2-ter — Densité de la Discussion (zones mortes · écritoire en ligne · pleine largeur)

> **À coller dans une session Claude Code FRAÎCHE** (règle R4 : une session = un lot).
> Modèle standard.
>
> **Contexte à lire en démarrant, rien de plus :** `PLAN_CHANTIERS_RENTREE.md` §C2 ; les
> garde-fous du handoff `design_handoff_scriptorium_eleve/HANDOFF_scriptorium_eleve.md`
> (voix par typographie jamais par aplat, un seul ornement par écran, aucune animation) ;
> ce fichier.
>
> **Décisions PO du 24/07 au soir** (annotations d'écran sur l'état post-C2.2-bis) —
> encodées telles quelles, elles ne se rediscutent pas en session (R7) :
> 1. **Pleine largeur assumée.** La question R7 « ligne à 95-100 caractères » de la
>    session bis est tranchée : on NE recadre PAS. La cible 65-75 du handoff est
>    officiellement abandonnée sur cet écran — priorité à la densité. La ligne pourra
>    atteindre ~100-105 caractères après suppression des gouttières : c'est voulu.
> 2. **Écritoire sur une seule ligne** (champ + bouton côte à côte).
> 3. **L'en-tête ne bouge pas** (`EnTeteSite` intouché — C10a s'en occupera peut-être).

---

## Mission

Rendre au fil de la Discussion l'espace perdu en zones mortes, sans toucher ni à la
logique ni à l'en-tête. Trois zones (annotations PO sur capture) : la bande vide entre
l'en-tête et le cadre du module (Z1), les gouttières entre rail et feuillet (Z2),
l'écritoire à deux étages (Z3). **Présentation uniquement — zéro logique, zéro SQL.**
En cas de doute : note et stop (R7).

## Pré-vol git

1. `git branch --show-current` → **`feat/rag-ecran-eleve`**, HEAD = `e773ce1` (C2.2-bis).
   Sinon : STOP, demande au PO. Autre session dans le dossier → worktree
   (`WORKTREE_cheatsheet.md`), ne touche jamais à son serveur ni à son `.next`
   (même précaution build/dev que la session bis).
2. Hors commit, comme toujours : `PLAN_CHANTIERS_RENTREE.md`, `PROMPT_*.md`,
   `SUIVI_tests_manuels.md`, `.claude/`.

## Les trois zones

### Z1 — La bande vide au-dessus du cadre (≈ 60-80 px rendus)

Contributeurs connus : `pt-8` du `<main>` (layout élève — **on ne touche pas au layout**,
on le neutralise localement), les paddings hauts internes, et en bas le `pb-8` du
wrapper de `page.tsx` qui DOUBLE le `pb-8` du main.

- `page.tsx`, wrapper de la page (les deux vues le partagent) : supprime son `pb-8`
  redondant ; ajoute la marge négative locale (`lg:-mt-4` ou équivalent) pour ramener la
  bande au-dessus du cadre à **~12-16 px sur `lg+`**. Sous `lg` : rien ne change.
  Vue `?vue=plan` : elle hérite du même wrapper — vérifie qu'elle reste correcte,
  ne la compense pas dans `PlanCours.tsx`.
- `ChatScriptorium.tsx` : rail `py-5` → `lg:py-3` (mobile inchangé) ; colonne lettre
  `lg:pt-[26px]` → `lg:pt-3` ; feuillet `pt-[34px]` → `pt-[26px]`, `pb-10` → `pb-7`
  (on resserre, on n'étouffe pas la lettre).
- **Recalcule la constante de hauteur** (`lg:h-[calc(100dvh-291px)]`) après ces
  changements : même méthode que la session bis (mesure réelle, constante commentée),
  respiration basse visée ~24 px au lieu de 64. Mesure le fil avant/après à 1280×800 et
  note le gain en px dans ta réponse finale — l'objectif PO est ≥ 120 px de fil en plus
  toutes zones confondues (Z1+Z3).

### Z2 — Les gouttières entre rail et feuillet

- Colonne lettre : `lg:px-[30px]` → `lg:px-4`.
- **Supprime le cap `max-w-[720px]`** de la colonne lettre : le feuillet remplit la
  colonne (décision « pleine largeur » ci-dessus). L'intérieur du feuillet
  (`sm:px-[46px]`) ne change pas — c'est la marge de la lettre, pas une zone morte.
- Rail : largeur `lg:w-[228px]` et `lg:px-[15px]` inchangés (il est déjà sobre).

### Z3 — L'écritoire sur une seule ligne

`ChatScriptorium.tsx`, bloc écritoire (le bloc quota épuisé ne change pas) :

- Conteneur : garde la feuille (`bg-surface`, filet haut 2 px, ombre) mais resserré :
  `px-4 py-2.5` ; l'écart au feuillet `mt-[22px]` → `mt-3`.
- Une ligne flex (`items-end gap-3`) : **textarea `flex-1`** (auto-rows 1→6 inchangé, il
  s'étire vers le bas en multi-lignes) + **bouton à droite** (`flex-none`). « Stop »
  remplace « Envoyer » dans la même case, sans saut de mise en page.
- La ligne d'état (« le tuteur écrit… » / quota ≤ 10 restants) : petite ligne discrète
  (12.5 px, mêmes textes au mot près, mêmes conditions d'apparition qu'aujourd'hui) SOUS
  le champ — elle n'ajoute de hauteur que lorsqu'elle existe. Aucune rangée permanente.
- Inchangés : Entrée envoie / Shift+Entrée saute une ligne, placeholder au mot près,
  fond transparent du textarea (la règle `globals.css` l'exige en style inline),
  focus-visible, désactivations.

## Périmètre de fichiers (strict)

- **Autorisés** : `app/eleve/modules/scriptorium/ChatScriptorium.tsx` ;
  `app/eleve/modules/scriptorium/page.tsx` (**uniquement** les classes du wrapper —
  ni la logique, ni le SELECT, ni le DTO).
- **Interdits** : tout le reste — `app/eleve/layout.tsx` (le `pt-8` global reste),
  `PlanCours.tsx`, `EnTeteSite.tsx`, `configModules.ts`, `configNavigation.ts`,
  `actions.ts`, `/api/scriptorium/chat`, `globals.css`, `utils/*`, gates, SQL.

## Recette (fin de session)

1. `npm run build` propre, `tsc --noEmit`, tests verts (aucun test modifié).
2. **Desktop 1440×900 ET 1280×800, conversation longue** : bande au-dessus du cadre
   ~12-16 px ; pas de barre de défilement de page ; rail + écritoire visibles ; seul le
   fil défile ; streaming suivi jusqu'en bas ; un seul fleuron. **Note le gain de fil en
   px vs C2.2-bis.**
3. **Écritoire** : une ligne au repos ; 4-5 lignes tapées → le champ s'étire, le bouton
   reste calé en bas à droite, rien ne saute quand « Stop » remplace « Envoyer » ;
   quota ≤ 10 → la petite ligne apparaît sous le champ.
4. **État vide + première utilisation** : flux de page, billet et amorces intacts.
5. **375 px** : rien de changé, rien de cassé (les ajustements sont `lg:` ou neutres).
6. **`?vue=plan`** : le haut de Plan de cours reste correct après le wrapper resserré.
7. Liste de recette utilisateur pour le PO (5 lignes max).

## Fin de session

Commit(s) sur `feat/rag-ecran-eleve` — **ne rien pousser, ne rien merger** (le merge se
décide au check-in du mercredi 29/07). Dernier commit type :
`fix(scriptorium): densité Discussion — zones mortes, écritoire en ligne, pleine largeur (C2.2-ter)`.
**Pas de fichier de journal** (réponse au R7 n°3 de la session bis : le journal, c'est le
PO qui le tient — ta note finale dans ta réponse suffit) + liste sèche des questions R7
rencontrées.
