# Handoff : Refonte de l'en-tête du site (prof + élève)

## Vue d'ensemble

Refonte du « haut du site » de **Palimpseste** : l'ancien empilement de trois bandes
(marque / onglets généraux / bandeau de module avec lien retour) est remplacé par
**deux barres compactes** :

1. **Barre de navigation générale** — onglets seuls, centrés ; actions de session à droite.
2. **Bande « seuil du module »** — un dégradé horizontal vers la couleur du module, portant
   à parité la marque (gauche) et le module courant (droite), avec la devise du monde et les
   sous-onglets du module au centre.

Objectifs : récupérer de la hauteur d'écran, mettre en avant les sceaux (médaillons),
homogénéiser leur traitement (sceau seul, sans nom gravé en dessous), supprimer le lien
redondant « ← Tableau de bord ».

## À propos des fichiers de ce dossier

Les fichiers de ce dossier sont des **références de design réalisées en HTML** — des
maquettes montrant l'apparence et le comportement voulus, PAS du code de production à
copier tel quel. La tâche consiste à **recréer ces designs dans la codebase Next.js
existante** (App Router, Tailwind, composants existants `BarreNavigation`, `Pastille`,
`SousNavModule`…), en suivant ses conventions.

- `maquette-en-tete-tous-contextes.dc.html` — la maquette (ouvrir dans un navigateur ;
  `support.js` doit rester à côté). C'est un canevas libre (pan/zoom). **Seule la section
  en haut, « Déclinaison 3A · tous les contextes » (blocs 4A–4L), fait foi.** Tout ce qui
  est en dessous (Actuel, pistes A/B/C, options 2A/2B/2C, 3A) est l'historique
  d'exploration conservé pour contexte.
- `assets/sceaux/` — **nouveaux assets** : les sceaux recadrés au cercle (voir § Assets).

## Fidélité

**Haute fidélité (hifi).** Couleurs, typographies, tailles et espacements sont définitifs
et doivent être reproduits au pixel près, en réutilisant les polices et variables déjà
présentes dans `globals.css` (charte Palimpseste).

## Anatomie du nouvel en-tête

### Barre 1 — navigation générale (`role`-dépendante)

- Fond `#FBF8F1` (parchemin clair), `border-bottom: 1px solid #E4DBC9`.
- Contenu dans un conteneur `max-width: 1040px`, centré, `padding: 11px 28px`.
- **Onglets centrés horizontalement** (flex, `gap: 6px`) :
  - Prof : `Tableau de bord` · `Pilotage ▾` · `Modules ▾`
  - Élève : `Tableau de bord` · `Calendrier` · `Intégrité` · `Modules ▾`
  - Typo : Alegreya Sans 14px, `padding: 7px 14px`, `border-radius: 8px`.
  - Onglet actif : `font-weight: 500`, fond `#ECE4D6`, texte `#221C16`.
  - Onglet inactif : texte `#6E5A3E`. Hover suggéré : fond `#ECE4D6` à ~50 % d'opacité.
  - Les menus déroulants `Pilotage ▾` / `Modules ▾` conservent leur comportement actuel.
- **Zone droite** (positionnée `right: 22px`, centrée verticalement, `gap: 12px`) :
  - Élève seulement : **sélecteur de classe** (ex. `2de B ▾`) — 13px, fond `#F6F1E7`,
    `border: 1px solid #E4DBC9`, `border-radius: 7px`, `padding: 4px 10px`, texte `#5A4632`.
  - Filet vertical `1px × 20px`, `#E4DBC9`.
  - `Se déconnecter` — Alegreya Sans 13px, `#9A836A`. Plus d'affichage du nom/prénom ici.
- **La marque ne figure plus dans cette barre** (ni logo, ni nom).

### Barre 2 — bande « seuil du module »

Conteneur `max-width: 1040px`, `padding: 14px 28px 16px`, flex `align-items: center`,
`gap: 22px`. `border-bottom: 1px solid #E4DBC9`.

- **Fond** : dégradé `linear-gradient(90deg, #FBF8F1 26%, <mi-teinte> 62%, <teinte-module> 100%)`
  (valeurs par module dans le tableau ci-dessous).
- **Filet or de clôture** : pseudo-élément en bas de bande, `height: 2px`,
  `background: linear-gradient(90deg, rgba(184,137,59,0), rgba(184,137,59,.55), #B8893B)`.
- **Zone gauche — marque** (colonne centrée, `gap: 7px`, `flex-shrink: 0`) :
  - Médaillon Palimpseste : disque 64 px, fond `#EDE6D6`, `border: 1px solid #E4DBC9`,
    image `palimpseste_medaillon.png` en `object-fit: cover`,
    `filter: brightness(1.05) contrast(1.05)`, `mix-blend-mode: multiply`.
  - Nom `Palimpseste` : Cinzel 600, 23px, `letter-spacing: .05em`, `#221C16`.
  - L'ensemble est un lien vers le tableau de bord (c'est lui qui remplace « ← Tableau de bord »).
- **Filets verticaux** de part et d'autre du centre : `width: 1px`, `align-self: stretch`,
  `background: linear-gradient(transparent, rgba(60,50,40,.16), transparent)`.
- **Zone centrale** (flex: 1, colonne centrée, `gap: 10px`) :
  - **Devise du monde** : Cormorant Garamond 18px, `#6E5A3E`, centrée — partie latine en
    petites capitales (`font-variant: small-caps`, `letter-spacing: .05em`, non italique),
    tiret cadratin, partie française en italique.
  - **Sous-onglets du module** (prof seulement) : Alegreya Sans 14px,
    `padding: 7px 15px`, `border-radius: 8px` ; actif : `font-weight: 500`,
    fond + texte aux couleurs du module (tableau) ; inactif : gris-encre du module.
  - Cas particuliers : voir § Contextes.
- **Zone droite — module courant** (colonne centrée, `gap: 7px`, `flex-shrink: 0`) :
  - Sceau du module : disque 64 px, fond = teinte du module, `border: 1px` bordure module,
    image `pastille-<module>.png`, `filter: brightness(1.06) contrast(1.04)`,
    `mix-blend-mode: multiply`.
  - **Anneau d'or** par-dessus (overlay absolu, `inset: 0`) : `border: 3px solid #B8893B`,
    `border-radius: 50%`, `box-shadow: 0 3px 12px rgba(<encre-module>, .30)`.
  - Nom du module : Cinzel 600, 23px, `letter-spacing: .05em`, couleur = encre du module.

### Ce qui disparaît

- Le lien « ← Tableau de bord » en haut des pages module.
- Le bandeau marque (logo + PALIMPSESTE + « Se déconnecter ») au-dessus des onglets.
- La pastille + titre de module dans le corps de page (l'en-tête porte désormais
  l'identité du module) — la page commence directement à son contenu.
- Le nom gravé sous les sceaux : **tous les sceaux sont désormais le disque seul**.

## Contextes (12 écrans de référence dans la maquette)

### Côté professeur

| Bloc | Contexte | Centre de la bande |
|---|---|---|
| 4A | Hors module (tableau de bord, pilotage…) | Devise de la maison (voir ci-dessous) |
| 4B | Aletheia | Devise « Ars Legendi — Dévoiler ce qui se cache » + onglets `Classe` · `Paramètres` |
| 4C | Codex | Devise « Ars Scribendi — Écrire pour penser » + `Synthèses` · `Validation` · `Paramètres` |
| 4D | Fragments d'érudition | Devise « Ars Quaerendi — Que rien ne se perde » + **sélecteur de semestre** (`2025–2026 · Semestre 1 ▾`) sur la même ligne ; dessous, 6 onglets : `Semaine` · `Vue d'ensemble` · `Thèmes` · `Essais` · `Synthèses` · `Paramètres` |
| 4E | Quazian | Devise « Ars Memoriae — Contre l'oubli » + `Flashcards` · `Quizz` · `Diagnostic` · `Semestre` · `Paramètres` |
| 4F | Scriptorium | Devise seule (pas de sous-onglets) : « Ars Docendi — D'une main à l'autre » |

- **4A hors module** : marque (zone gauche), un filet vertical, puis la **devise de la
  maison** centrée — « Verba Volant, Scripta Manent, Sapientia Permanet » (Cormorant 18px,
  tout en petites capitales, `#8A6F4E`, `letter-spacing: .07em`). Fond **plat** `#F8F4EA`
  (pas de dégradé), filet bas discret `rgba(184,137,59,.32)` (2px, uni). Pas de zone droite.
- **4D Fragments** : le sélecteur de semestre partage la ligne de la devise (rangée flex
  centrée, `gap: 14px`, `flex-wrap: wrap`) ;
  style : 13px `#5A6043`, fond `rgba(255,255,255,.55)`, `border: 1px solid #CDCFB6`,
  radius 7px, `padding: 4px 11px`. Les 6 onglets passent en 13.5px / `padding: 6px 12px`
  pour tenir. Nom court **« Fragments »** à droite (le titre complet « Fragments
  d'érudition » vit dans la page).

### Côté élève

| Bloc | Contexte | Centre de la bande |
|---|---|---|
| 4G | Hors module | — (identique à 4A, mais barre 1 élève + sélecteur de classe) |
| 4H | Aletheia | Devise : « Ars Legendi — Dévoiler ce qui se cache » |
| 4I | Codex | Devise : « Ars Scribendi — Écrire pour penser » |
| 4J | Fragments | Devise : « Ars Quaerendi — Que rien ne se perde » |
| 4K | Quazian | Devise : « Ars Memoriae — Contre l'oubli » |
| 4L | Scriptorium (à venir côté élève) | Devise : « Ars Docendi — D'une main à l'autre » |

- Côté élève, **aucun sous-onglet** : le centre porte la devise seule.
- **Scriptorium côté élève** n'est pas encore lancé — l'en-tête (4L) est prêt pour son arrivée ;
  même gabarit que les autres modules élève, couleurs Scriptorium.

## Devises des mondes (sous-titres définitifs)

- Palimpseste (hors module) : **Verba Volant, Scripta Manent, Sapientia Permanet**
- Aletheia : **Ars Legendi** — Dévoiler ce qui se cache
- Codex : **Ars Scribendi** — Écrire pour penser
- Fragments d'Érudition : **Ars Quaerendi** — Que rien ne se perde
- Quazian : **Ars Memoriae** — Contre l'oubli
- Scriptorium : **Ars Docendi** — D'une main à l'autre

Elles remplacent partout les anciens sous-titres descriptifs. Rendu : latin en petites
capitales (non italique), tiret cadratin, français en italique (voir § Anatomie).

## Couleurs par module

| Module | Teinte (fond sceau) | Encre (nom) | Dégradé 62 % | Dégradé 100 % | Bordure sceau | Onglet actif (fond / texte) | Onglet inactif |
|---|---|---|---|---|---|---|---|
| Aletheia | `#DDE3EC` | `#2C4A7C` | `#E7ECF4` | `#CFDBEC` | `#CBD3E0` | `#D5DEEE` / `#2C4A7C` | `#5B6685` |
| Codex | `#DCE6DF` | `#2E4A3C` | `#E9F0EA` | `#C9DCD0` | `#C6D5CB` | `#D0DED5` / `#2E4A3C` | `#56685E` |
| Fragments | `#E2E3D2` | `#5A6043` | `#ECEDDF` | `#D2D4BD` | `#CDCFB6` | `#D8DAC4` / `#5A6043` | `#6C7058` |
| Quazian | `#DCE6EC` | `#3E6B8E` | `#E8EFF3` | `#C7DAE5` | `#C4D3DD` | `#D2E0E9` / `#3E6B8E` | `#587082` |
| Scriptorium | `#E6DDC9` | `#4A3A28` | `#EFE8D6` | `#D9CCAE` | `#D3C6AA` | — | — |
| Palimpseste (marque) | `#EDE6D6` | `#221C16` | — | — | `#E4DBC9` | — | — |

Ombre de l'anneau d'or : `0 3px 12px rgba(<encre du module en rgb>, .30)`.

## Jetons de design globaux

- Parchemin clair (fond barres) : `#FBF8F1` · hors module : `#F8F4EA`
- Encre : `#221C16` · encre douce : `#6E5A3E` · brun discret : `#9A836A`
- Séparateurs : `#E4DBC9` · filets verticaux : `rgba(60,50,40,.16)`
- Or : `#B8893B` (anneau 3px, filets de clôture)
- Onglet actif barre 1 : fond `#ECE4D6`
- Rayons : 8px (onglets), 7px (sélecteurs), 50 % (sceaux)
- Typos (déjà dans la charte / `globals.css`) : **Cinzel** (noms de mondes),
  **Cormorant Garamond** (descriptions italiques), **Alegreya Sans** (UI/onglets),
  **EB Garamond** (corps).

## Comportement & états

- Toute la coquille est **partagée prof/élève** : mêmes composants, nourris par la
  config de navigation par rôle (comme l'actuel `configNavigation.ts`).
- Le bloc marque (gauche de la bande) est cliquable → tableau de bord du rôle.
- Sous-onglets : même logique d'actif que l'actuel `SousNavModule` (pathname).
- Sceau du module : non cliquable (repère). Les dégradés et couleurs changent avec le
  module courant, déterminé par la route (comme `TuileAccentModule` aujourd'hui).
- Pas de sticky défini — conserver le comportement de scroll actuel.
- **Mobile / petites largeurs : hors périmètre de cette maquette.** Conserver les barres
  mobiles existantes (`BarreOngletsMobile*`) ; ne pas tenter d'adapter ce layout desktop
  en dessous de ~900px sans nouvelle maquette.

## Fichiers de la codebase concernés (indicatif)

- `components/nav/BarreNavigation.tsx` — devient la barre 1 (onglets centrés, zone droite).
- `components/nav/configNavigation.ts` — inchangé sur le fond (libellés/routes par rôle).
- `components/nav/LogoPalimpseste.tsx` — se déplace dans la bande 2 (zone gauche, 64px + nom).
- `components/SousNavModule.tsx` — se fond dans la bande 2 (zone centrale).
- `components/Pastille.tsx` — pointer vers les **nouveaux assets recadrés** ; supprimer
  tout traitement destiné à masquer/afficher le nom gravé.
- `app/prof/layout.tsx`, `app/eleve/layout.tsx` — intègrent la nouvelle coquille.
- `app/prof/<module>/layout.tsx`, `app/eleve/modules/<module>/layout.tsx` — retirer
  pastille/titre/retour du corps de page ; fournir devise + sous-onglets à la bande.

## Assets

`assets/sceaux/` contient les **six sceaux recadrés au cercle** (512×512 px, PNG, fond
crème) — c'est l'homogénéisation demandée : plus aucun nom sous le disque.

- `palimpseste_medaillon.png` (identique à l'existant `public/sceaux/palimpseste_medaillon.png`)
- `pastille-aletheia.png` · `pastille-codex.png` · `pastille-fragments.png`
  · `pastille-quazian.png` · `pastille-scriptorium.png` — **nouveaux**, recadrés depuis
  les sceaux complets de `public/sceaux/`.

À copier dans `public/sceaux/` de l'app. Les fichiers d'origine (avec nom gravé) peuvent
rester pour les usages pleine-page, mais l'en-tête et toute pastille utilisent les
versions recadrées. Rendu : toujours sur disque teinté, `object-fit: cover`,
`brightness(1.06) contrast(1.04)`, `mix-blend-mode: multiply`.

## Fichiers du dossier

- `README.md` — ce document (source de vérité).
- `maquette-en-tete-tous-contextes.dc.html` + `support.js` — maquette navigable
  (blocs 4A–4K en haut = design retenu ; le reste = historique).
- `assets/sceaux/*.png` — les 6 sceaux recadrés.
