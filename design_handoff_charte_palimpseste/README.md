# Handoff — Charte graphique « Palimpseste »

## Aperçu
Palimpseste est une plateforme pédagogique (HLP / philosophie, lycée) bâtie en **Next.js (App Router) + Tailwind CSS v4 + Supabase**. Le site fonctionne mais est en noir & blanc. Cette charte lui donne une identité **« humanités / Renaissance »** : une encre sombre sur un parchemin chaud, et **un pigment par module**. Sept modules / espaces : Palimpseste (général), Aletheia, Codex, Fragments, Quazian (élève) + Scriptorium (professeur).

L'objectif de ce handoff : **appliquer la charte au code existant**, sans refonte fonctionnelle.

## À propos des fichiers de design
Les fichiers `.dc.html` du dossier `references/` sont des **références de design créées en HTML** — des prototypes qui montrent l'aspect et le comportement visés, **pas du code de production à copier tel quel**. La tâche est de **reproduire ce langage visuel dans le codebase Next.js/Tailwind existant**, avec ses patterns établis (composants React, classes Tailwind, `next/font`).

Le dossier `code/` contient en revanche de **vrais fichiers prêts à l'emploi** (globals.css, composants .tsx) déjà écrits pour ce codebase — à copier puis adapter.

## Fidélité
**Haute fidélité (hifi).** Couleurs, typographie, espacements et états sont définitifs (valeurs hex exactes ci-dessous). Reproduire fidèlement ; réutiliser les composants et conventions du codebase.

---

## Système de design

### Principes
1. **Encre sur parchemin** — fond parchemin chaud, texte encre sombre. La couleur ponctue, elle n'envahit pas.
2. **Un module = un monde** — chaque module a sa palette ; ce qui unifie l'ensemble, c'est le parchemin, les sceaux et la typographie (pas la couleur).
3. **Dose modérée** — le pigment vit dans les bordures, badges, têtières et boutons ; jamais en grands aplats.

### Typographie (4 rôles, via `next/font/google`)
| Rôle | Police | Classe Tailwind | Usage |
|---|---|---|---|
| Marque | **Cinzel** (capitale lapidaire) | `font-marque` | « PALIMPSESTE », noms de module en CAPITALES espacées |
| Titres | **Cormorant Garamond** | `font-titre` | titres de page/section (« Bonjour, Camille »), grands chiffres |
| Corps | **EB Garamond** | `font-corps` | texte courant, consignes (défaut du `<body>`) |
| Interface | **Alegreya Sans** | `font-ui` | nav, badges, dates, chiffres, boutons, tableaux |

Échelle : Display 46–52 · Titre 30–34 · Corps 18–19 · Interface 14–15 · Étiquette 11–12 (CAPS, letter-spacing .1em).

### Couleurs — base commune (jetons `:root`)
| Jeton | Hex | Tailwind |
|---|---|---|
| Parchemin clair (fond) | `#F4EFE6` | `bg-parchemin` |
| Parchemin foncé | `#ECE4D6` | `bg-parchemin-fonce` |
| Surface (cartes) | `#FBF8F1` | `bg-surface` |
| Encre (texte) | `#221C16` | `text-encre` |
| Encre douce / sépia | `#5A4632` | `text-encre-douce` |
| Muet (légendes) | `#8A6F4E` | `text-muet` |
| Bordure | `#E4DBC9` | `border-bordure` |

### Couleurs — états (indépendants du module)
| État | Pigment | Teinte (fond badge) | Tailwind |
|---|---|---|---|
| Fait / réussi | `#5B6E4A` | `#E4E8D8` | `text-ok` / `bg-ok` |
| À faire / attention | `#9A6A2E` | `#EFE4CF` | `text-attention` |
| En retard / erreur | `#A23E2E` | `#EFD9D2` | `text-retard` |

### Couleurs — un pigment par module
Appliqué via `data-module="…"` sur le conteneur de page → `--pigment`, `--pigment-teinte`, `--fond-module` héritent dans tout le sous-arbre. Utilitaires : `bg-pigment`, `text-pigment`, `border-pigment`, `bg-pigment-teinte`.

| Module | Direction | Pigment ◆ | Teinte | Fond page | Accents secondaires |
|---|---|---|---|---|---|
| **palimpseste** (général) | Parchemin & encre | `#5A4632` | `#E8DFCB` | `#F4EFE6` | — |
| **aletheia** | Manuscrit enluminé | `#2C4A7C` | `#DDE3EC` | `#F3ECDD` | or `#B8893B`, minium `#B4452F` |
| **fragments** | Pierre & laurier | `#5A6043` | `#E2E3D2` | `#EFE9DC` | terracotta `#B26A4A` |
| **codex** | Bibliothèque | `#2E4A3C` | `#DCE6DF` | `#F0EADE` | bordeaux `#6E2A2C`, nuit `#28324A` |
| **quazian** | Fresque florentine | `#3E6B8E` | `#DCE6EC` | `#F2ECE0` | ocre `#C8993F`, rose `#BE8276` |
| **scriptorium** (prof) | Parchemin & encre, sobre | `#4A3A28` | `#E6DDC9` | `#F0EADE` | — |

### Les sceaux (pastille teintée) — IMPORTANT
Les 6 sceaux sont des **images** (gravures N&B sur fond crème), fournies dans `assets/sceaux/`. Ils restent **noir & blanc** ; on les pose sur un **disque de la teinte du module** en `mix-blend-mode: multiply`.

⚠️ **Le piège du « bord carré ».** L'image est un carré (fond crème opaque). En multiply, le crème assombrit légèrement la teinte sous le carré, créant un bord visible avec l'anneau du disque. **Correctif** : `filter: brightness(1.09) contrast(1.04)` sur l'image — cela remonte le papier crème au blanc avant le multiply (blanc × teinte = teinte exacte), sans toucher l'encre sombre. Le disque doit aussi être **un peu plus grand que l'image** (image ≈ 88 % du disque) pour englober le nom du module.

→ Tout ceci est encapsulé dans `code/Pastille.tsx`. **Écrit une fois, utilisé partout.**

Placement des PNG en production : `public/sceaux/{palimpseste,aletheia,codex,fragments,quazian,scriptorium}.png`.

---

## Plan d'intégration (ordre conseillé)

1. **Polices** — remplacer la config de polices dans `app/layout.tsx` par `code/layout.fonts.tsx` (charge les 4 familles via `next/font/google`, expose `--police-*`).
2. **Couleurs + jetons** — remplacer `app/globals.css` par `code/globals.css` (base, états, pigments par module, exposition `@theme`).
3. **Sceaux** — copier `assets/sceaux/*.png` dans `public/sceaux/`, puis ajouter `code/Pastille.tsx` dans `components/`.
4. **data-module** — sur le conteneur de page de chaque module (`app/eleve/modules/[slug]/…`), poser `data-module` + `background: var(--fond-module)`. Voir `code/module-layout.example.tsx`.
5. **Composants partagés** — repeindre (remplacements de classes `stone-*` → jetons) :
   - `components/Tuile.tsx` → version fournie `code/Tuile.tsx` (bord = pigment ou état, option sceau).
   - **En-tête** (`app/eleve/layout.tsx`, `app/prof/layout.tsx`) : marque en `font-marque`, onglet actif `bg-parchemin-fonce`, nav en `font-ui`.
   - **Login** (`app/login/page.tsx`) : `<Pastille module="palimpseste" size={84} />`, titre `font-marque`, champs/bouton en jetons.
   - **Badges & boutons** : voir patterns ci-dessous.

### Patterns badge / bouton / carte (classes Tailwind)
```tsx
// Badge d'état
<span className="font-ui text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--attention-teinte)] text-attention">à déposer</span>
// Badge de module (dans un sous-arbre data-module)
<span className="font-ui text-xs font-medium px-2.5 py-1 rounded-full bg-pigment-teinte text-pigment">12 cartes</span>

// Bouton primaire (pigment du module)
<button className="font-ui text-sm font-semibold px-4 py-2.5 rounded-lg bg-pigment text-surface">Déposer</button>

// Carte de module (têtière colorée + corps surface)
<div className="bg-surface border border-bordure rounded-xl overflow-hidden">
  <div className="h-1.5 bg-pigment" />
  <div className="p-4"> … </div>
</div>

// Tuile élève (bord gauche = pigment)
<div data-module="aletheia" className="bg-surface border border-bordure border-l-4 border-l-pigment rounded-xl p-4"> … </div>
```

---

## Écrans de référence (`references/`)
Sept écrans, dans deux espaces. Ouvrir les `.dc.html` dans un navigateur (depuis ce dossier) pour les voir.

**`Maquettes Palimpseste.dc.html`** (canvas — glisser pour naviguer) :
- *Espace élève* — **Connexion**, **Tableau de bord** (tous les mondes réunis, accents par module), **Aletheia** (page module, outremer), **Fragments** (Pierre & laurier, olive), **Codex** (Bibliothèque, vert bouteille + bleu nuit).
- *Espace professeur* — **Tableau de bord** (parchemin sobre : « à valider », santé de la cohorte avec grands chiffres Cormorant, tuiles de classe par état) et **Scriptorium** (atelier d'écriture délibérément sobre, noyer).

**`Charte Palimpseste.dc.html`** : la charte complète (principes, base, six mondes avec composants appliqués, typographie, sceaux, jetons).

### Détail des écrans
- **Connexion** — carte centrée 368px sur parchemin ; sceau Palimpseste 84px ; marque Cinzel 24px ; 2 champs + bouton sépia `#5A4632`.
- **Tableau de bord élève** — en-tête (marque + sélecteur de classe + déconnexion) + nav (Tableau de bord / Calendrier / Modules ▾) ; contenu centré `max-w-4xl`. Sections : « À faire » (cartes à bord gauche = couleur du module concerné), « Ta progression » (3 cartes, badges-lettres en couleurs d'état), « Tes modules » (grille 2 col, chaque carte = sceau + nom Cinzel + description).
- **Pages de module** — fond = `--fond-module` ; en-tête monde (sceau 88px + nom Cinzel en pigment + accroche Cormorant) ; grille 1.5fr/1fr ; têtières de carte en pigment ; accents secondaires (or/minium pour Aletheia, terracotta pour Fragments, bordeaux/nuit pour Codex).
- **Tableau de bord prof** — parchemin neutre/sépia ; « X fragments à valider » ; « Santé de la cohorte » (3 cartes : grand % Cormorant `text-ok`, nombre en difficulté `text-retard`, liste à risque) ; tuiles de classe (bord gauche état vert/neutre/rouge).
- **Scriptorium** — sobre, noyer `#4A3A28` ; barre latérale « Ouvrages » + éditeur de manuscrit (titre Cormorant, corps EB Garamond, surlignage `#EAE0CC`). « L'outil s'efface ».

---

## Fichiers de ce handoff
```
design_handoff_charte_palimpseste/
├── README.md                      ← ce fichier (auto-suffisant)
├── code/
│   ├── globals.css                ← remplace app/globals.css
│   ├── layout.fonts.tsx           ← setup next/font à intégrer dans app/layout.tsx
│   ├── Pastille.tsx               ← composant sceau → components/Pastille.tsx
│   ├── Tuile.tsx                  ← components/Tuile.tsx repeint (drop-in)
│   └── module-layout.example.tsx  ← exemple data-module + en-tête de monde
├── assets/sceaux/                 ← 6 PNG → public/sceaux/ (renommés en minuscules)
└── references/                    ← prototypes HTML (ouvrir dans un navigateur)
    ├── Charte Palimpseste.dc.html
    ├── Maquettes Palimpseste.dc.html
    ├── support.js
    └── uploads/                   ← sceaux utilisés par les prototypes
```

## Assets
Sceaux fournis dans `assets/sceaux/` (PNG ~1448×1086, gravures N&B sur fond crème). Origine : créés par le porteur du projet. À déposer dans `public/sceaux/` sous les noms : `palimpseste.png`, `aletheia.png`, `codex.png`, `fragments.png`, `quazian.png`, `scriptorium.png`.

## Notes
- **Compatibilité « stone »** : les neutres Tailwind existants restent valables (`stone-50/100` ≈ parchemin, `stone-800/900` ≈ encre). Migration progressive possible, écran par écran.
- **Mode clair forcé** : conserver le comportement actuel (le site est toujours en mode clair) — déjà géré dans `globals.css` (champs de saisie).
- Ne pas recolorer l'encre des sceaux ; ne pas mélanger deux pigments de module sur un même écran ; ne pas déformer les sceaux.
