# Handoff — Scriptorium : vue prof d'un livre (refonte anti-clutter)

## Aperçu

Refonte de la vue « Par unité » de Scriptorium quand l'unité est un **livre**
(`/prof/scriptorium?vue=unites&unite=<id>`). Aujourd'hui, cette vue empile :
tuiles d'unités → entête → liste des semaines (EditeurLivre) → carte
d'architecture → 12 fiches détaillées. Résultat : ~8–10 écrans de scroll.

La refonte transforme le livre en **page à part entière** (on quitte la grille
des tuiles, lien retour « ← Toutes les unités ») organisée en **trois
colonnes** :

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Toutes les unités                                               │
│ LIVRE · ANCRAGE IA — NON VISIBLE PAR L'ÉLÈVE                      │
│ Le Gai Savoir  Friedrich Nietzsche      [Modifier la découpe]     │
│ 12 semaines · début… · TG1 TG3 ✎        [Supprimer l'unité…]      │
├───────────┬────────────────────────────────┬─────────────────────┤
│ RAIL      │ FICHE de la semaine            │ CARTE d'architecture│
│ S1…S12    │ sélectionnée                   │ (sticky)            │
│ (sticky,  │ thèse · arguments · concepts   │ fil conducteur      │
│ pastilles │ synthèse élève · texte replié  │ liens S→S cliquables│
│ d'état)   │                                │                     │
└───────────┴────────────────────────────────┴─────────────────────┘
```

**Cible : laptop uniquement (≥ ~1240 px).** Pas de responsive mobile demandé.

## À propos des fichiers de design

Les fichiers de `references/` sont des **références de design en HTML**
(prototype interactif : rail cliquable, liens de carte cliquables, états
simulés). Ce ne sont PAS des fichiers à copier en production. La tâche est de
**recréer cet écran dans le codebase Next.js/React/Tailwind existant**
(`app/prof/scriptorium/`), avec ses patterns : composants serveur + client,
actions serveur existantes, tokens Tailwind de `app/globals.css`.

Ouvrir `references/Scriptorium - Vue livre (2a).dc.html` dans un navigateur
(garder `support.js` à côté). Panneau « Tweaks » (si dispo) : états de la
carte (prête / en cours / non générée) et fiches manquantes on/off.

## Fidélité

**Hi-fi.** Couleurs, typo, espacements et états sont voulus et alignés sur la
charte Palimpseste (voir tokens ci-dessous — quasi tout existe déjà dans
`globals.css`). Recréer fidèlement, en Tailwind, avec les utilitaires du
projet (`bg-surface`, `border-bordure`, `text-muet`, `bg-pigment-teinte`…).

## Où ça s'insère dans le codebase

- **Page** : `app/prof/scriptorium/page.tsx`, branche `vue === 'unites'` avec
  `unite` sélectionnée de `type === 'livre'`. Aujourd'hui elle rend :
  entête + `EditeurClassesLivre` + `EditeurLivre` + `CarteArchitectureLivre`
  empilés sous la grille de tuiles. → Remplacer par la nouvelle page livre
  (la grille de tuiles ne s'affiche plus quand un livre est ouvert ; seul le
  lien « ← Toutes les unités » ramène à `?vue=unites`).
- **Données déjà chargées par la page** (rien de nouveau côté requêtes) :
  - `scriptorium_documents` filtrés par `unite_id` → semaines
    (`{ id, semaine, titre, chapitres, texte_extrait }`).
  - `capstoneLivre: CapstoneProf` → carte (`contenu: { fil_conducteur,
    noeuds[], liens[] }`, `statut: 'PENDING'|'READY'|'ERROR'`,
    `amende_par_prof`).
  - `referenceLivre: LivreReferenceProf` → fiches (`contenu:
    ReferenceChapitre[]` avec `{ semaine, titre, these_canonique,
    arguments_cles[], concepts_cles[], synthese_modele }`).
  - Types : `app/eleve/modules/aletheia/types.ts`.
- **Composants existants à réutiliser tels quels** :
  - `EditeurClassesLivre` → chips TG1/TG3 + ✎ de l'entête.
  - `EditeurLivre` (+ `NavigateurDecoupe`) → derrière le bouton
    « Modifier la découpe » (plein écran ou section dédiée, plus inline).
  - `BoutonSupprimerUnite` → derrière « Supprimer l'unité… » (garde son flux
    de confirmation en 3 étapes).
  - Les actions IA existantes de `CarteArchitectureLivre` / actions.ts
    (génération carte, génération référence) → boutons « ↻ Régénérer (IA) »,
    « ✎ Amender ».
- **`CarteArchitectureLivre.tsx`** : à éclater — la partie « carte » va dans
  la colonne droite, la partie « fiches » devient le panneau central
  (une fiche à la fois, pilotée par le rail). Les formulaires d'amendement
  existants (textarea thèse, listes arguments/concepts) restent le mode
  « ✎ Amender » du panneau.

## Layout (valeurs exactes)

- Conteneur page : `max-width: 1240px`, centré, padding latéral 24 px,
  fond `--fond-module` scriptorium `#F0EADE` (`data-module="scriptorium"`).
- Grille : `grid-template-columns: 238px minmax(0,1fr) 300px; gap: 16px;
  align-items: start`.
- Rail et colonne carte : `position: sticky; top: 16px` (la page scrolle,
  eux restent).
- Cartes (rail, fiche, carte) : fond `--surface #FBF8F1`, bordure 1px
  `--bordure #E4DBC9`, radius **10px**.
- Le panneau fiche a un **liseré haut de 6 px** plein `#4A3A28`
  (pigment scriptorium), puis padding `20px 26px 24px`, sections espacées
  de 18 px (`flex-direction: column; gap: 18px`).

### Entête livre

- Fil de retour : « ← Toutes les unités » — Alegreya Sans 500 13.5px,
  `--muet`, hover `--pigment`.
- Surtitre : « LIVRE · ANCRAGE IA — NON VISIBLE PAR L'ÉLÈVE » — Alegreya Sans
  600 11px, uppercase, letter-spacing .12em, couleur `#A8906A`.
- Titre : Cormorant Garamond 600 34px `--encre` ; auteur à côté en Cormorant
  italique 500 19px `#6E5A3E`.
- Sous-ligne : « 12 semaines · début le 05/01/2026 · classes » + chips
  classes (`bg-pigment-teinte #E6DDC9`, texte `#4A3A28`, radius 999px,
  12px 500) + « ✎ modifier » (ouvre EditeurClassesLivre).
- Boutons à droite (alignés bas d'entête) :
  - « Modifier la découpe » — bouton secondaire : Alegreya Sans 600 12.5px,
    texte `--encre-douce`, fond `--surface`, bordure `#D8CCB4`,
    padding 7px 14px, radius 7px, hover fond `#ECE4D6`.
  - « Supprimer l'unité… » — même gabarit, texte `--retard #A23E2E`,
    bordure `#DCC3B4`, hover fond `#F3E4DC`.

### Rail (colonne gauche, 238 px)

- Titre de section : « FICHES PAR SEMAINE » — 600 11px uppercase,
  letter-spacing .1em, `#A8906A`, padding 0 16px 8px.
- Ligne : `flex; align-items:center; gap:8px; padding:6.5px 16px 6.5px 13px;
  border-left:3px solid transparent; cursor:pointer`.
  - N° : « S1 »… — Alegreya Sans 600 11px, `#A8906A`, largeur fixe 25px.
  - Titre court : EB Garamond 15px `--encre-douce`, ellipsis 1 ligne.
  - Pastille d'état 7px (droite) — voir États.
  - Hover : fond `#ECE4D6`. Sélection : fond `#E6DDC9`,
    border-left `#4A3A28`, n° `#4A3A28`, titre 600 `--encre`.
- Légende sous le rail (11px `#A8906A`, séparée par un trait pointillé
  `#D8CCB4`) : ● prête (`#5B6E4A`) · ● amendée (`#3E5C7E`) ·
  ○ à générer (contour `#C9BBA0`).

### Panneau fiche (colonne centrale)

- Étiquette : « SEMAINE 6 · LIVRE TROISIÈME, §108–125 » — 600 11px uppercase
  `#A8906A`. Titre : Cormorant Garamond 600 27px `--encre`.
- Boutons « ↻ Régénérer (IA) » / « ✎ Amender » en haut à droite (gabarit
  bouton secondaire, 12px).
- Badge d'état (pill, 600 11.5px) + sous-statut en EB Garamond italique
  13.5px `--muet` (« générée le 12/06 », « générée le … · amendée le … »,
  « aucun contenu pour l'instant »).
- Sections, chacune avec un intitulé 600 11px uppercase `#A8906A` :
  - **Thèse canonique** — EB Garamond 17px/1.55 `#2A2017`.
  - **Arguments clés** — liste à puces losange (carré 6px `#C9BBA0` tourné
    45°), EB Garamond 16px/1.5 `#3A2E22`, gap 7px.
  - **Concepts clés** — chips `bg #E6DDC9`, texte `#4A3A28`, 12.5px 500.
  - **👁 Synthèse modèle — vue par l'élève** — encart distinct : fond
    `--parchemin #F4EFE6`, bordure `--bordure`, radius 9px, padding 14px
    17px ; intitulé en `--info #3E5C7E` ; corps EB Garamond 16px/1.6.
    (C'est le SEUL champ montré à l'élève — d'où le marquage visuel.)
  - **Texte de la semaine** — rangée repliable (chevron ▸/▾, bordure
    `--bordure`, radius 8px, hover fond parchemin) ; mention « lecture
    seule — la découpe se modifie en tête de page » ; contenu déplié : fond
    `#FDFBF5`, EB Garamond 16.5px/1.65. Replié par défaut. Source :
    `texte_extrait` du document.

### Colonne carte (droite, 300 px, sticky)

- Titre : « ✦ Carte d'architecture » 600 14px + chip d'état à droite.
- Sous-titre italique 13px `--muet` : « partagée aux élèves en fin de
  lecture ».
- **Fil conducteur** (intitulé 600 10.5px uppercase) — EB Garamond
  14.5px/1.5.
- **Liens entre semaines** + note italique « S6 en évidence » :
  - Rangée lien : « S2 → S6 · l'erreur utile prépare la mort de Dieu » —
    Alegreya Sans 12.5px/1.4, padding 4px 9px, radius 6px, cursor pointer.
  - Liens touchant la semaine sélectionnée : fond `#E6DDC9`, texte
    `#4A3A28`, « S2 → S6 » en 700. Autres : texte `--encre-douce`,
    hover fond `--parchemin`.
  - Note sous la liste, italique 12px : « cliquer un lien ouvre la semaine
    visée ».
- Boutons « ↻ Régénérer (IA) » / « ✎ Amender » (gabarit secondaire 12px).

## États

### Fiche, par semaine (pastille rail + badge panneau)

| État | Pastille | Badge | Condition (données) |
|---|---|---|---|
| prête | ● `#5B6E4A` (`--ok`) | « fiche prête », `bg #E4E8D8` / texte `#5B6E4A` | entrée `ReferenceChapitre` non vide pour cette semaine |
| amendée | ● `#3E5C7E` (`--info`) | « amendée à la main », `bg #DCE3EC` / texte `#3E5C7E` | amendement prof (voir « Décisions » ci-dessous) |
| à générer | ○ contour `#C9BBA0` | « à générer », `bg #EFE4CF` / texte `#9A6A2E` (`--attention`) | pas d'entrée, ou `these_canonique` vide |

- Fiche « à générer » : panneau central = encart en pointillés
  (bordure 1.5px dashed `#D8CCB4`, fond `#F7F2E8`, radius 10px, texte
  italique centré expliquant que le diagnostic Aletheia s'appuiera dessus)
  + 2 boutons : « ↻ Générer la fiche (IA) » (primaire : fond `#4A3A28`,
  texte `--surface`) et « ✎ Rédiger à la main » (secondaire). Le
  « Texte de la semaine » reste accessible en dessous.

### Carte (colonne droite)

| État | Chip | Contenu |
|---|---|---|
| prête (`READY`) | « prête » vert ok | fil conducteur + liens + boutons |
| en cours (`PENDING`) | « en cours… » attention | message italique + 3 barres squelette `#ECE4D6` + « la page se mettra à jour automatiquement » (la page fait déjà du polling côté `CarteArchitectureLivre` — conserver) |
| non générée / `ERROR` | « non générée » neutre (`bg #ECE4D6`, texte `--muet`) | message italique + bouton primaire « ↻ Générer la carte (IA) » |

## Interactions & comportement

- **Sélection de semaine** : clic sur une ligne du rail → le panneau central
  affiche cette fiche ; le rail marque la ligne ; les liens de la carte se
  re-surlignent. Refléter la sélection dans l'URL
  (`?vue=unites&unite=<id>&semaine=6`) pour partage/retour arrière.
  Défaut à l'ouverture : semaine courante du calendrier si le livre est en
  cours (sinon S1).
- **Clic sur un lien de la carte** : navigue vers l'autre extrémité du lien
  (si la semaine sélectionnée est `de`, aller à `vers`, et inversement ;
  si le lien ne touche pas la sélection, aller à `de`).
- **« Texte de la semaine »** : toggle replié/déplié ; se referme quand on
  change de semaine.
- **Hovers** : toutes les surfaces cliquables ont un hover (voir specs) ;
  transitions CSS ~120ms suffisent, pas d'animation au-delà.
- **↻ Régénérer / Générer (IA)** : brancher sur les actions serveur
  existantes ; pendant la génération, réutiliser l'état « en cours »
  (squelette) du panneau concerné.
- **✎ Amender** : réutiliser les formulaires d'édition existants de
  `CarteArchitectureLivre` (à réhabiller aux gabarits ci-dessus), en place
  dans le panneau concerné.

## State management

- `semaineSelectionnee: number` (URL + état client), `texteOuvert: boolean`.
- Le reste vient des données serveur déjà chargées (`docsAffiches`,
  `capstoneLivre`, `referenceLivre`) ; polling existant pour `PENDING`.

## Décisions à prendre (écarts données ↔ design)

1. **Statut « amendée » par semaine** : `LivreReferenceProf.amende_par_prof`
   est aujourd'hui **global** au livre. Le design montre un état **par
   semaine**. Option A (minimale) : dériver — global `amende_par_prof` ⇒
   badge « amendée » sur toutes les fiches non vides (approximation).
   Option B (propre, recommandée) : ajouter un marquage par chapitre
   (ex. `amende: boolean` ou `updated_at` dans chaque `ReferenceChapitre`)
   lors d'un amendement.
2. **Liens de la carte** : `CapstoneLien.de/vers` sont des **chaînes**
   (noms de chapitres), pas des numéros de semaine. Résoudre vers la semaine
   par correspondance avec `noeuds[].chapitre` / titres de semaines ;
   afficher « S2 → S6 » quand la résolution réussit, sinon le libellé brut
   non cliquable.
3. **`noeuds` de la carte** : le design ne les affiche pas (l'idée par
   chapitre vit déjà dans la fiche). S'assurer que rien d'important n'est
   perdu — sinon, les exposer derrière « ✎ Amender ».
4. **Documents sans `semaine`** : conserver l'encart d'avertissement
   existant (bordure `--attention`) au-dessus de la grille 3 colonnes.
5. **< 1240 px** : hors scope (laptop only). Simplement laisser la grille
   se compresser ; pas de breakpoint mobile à construire.

## Design tokens (tous déjà dans `app/globals.css`)

- Surfaces : fond page `--fond-module` scriptorium `#F0EADE` · cartes
  `--surface #FBF8F1` · encarts `--parchemin #F4EFE6` / `#F7F2E8` /
  `#FDFBF5` (texte déplié).
- Encre : `--encre #221C16` · `--encre-douce #5A4632` · `--muet #8A6F4E` ·
  intitulés de section `#A8906A` (entre muet et bordure — pas de var ;
  garder tel quel ou créer `--muet-clair`).
- Bordures : `--bordure #E4DBC9` · bordure de bouton `#D8CCB4` · puces /
  contours vides `#C9BBA0`.
- Pigment scriptorium : `--pigment #4A3A28` · `--pigment-teinte #E6DDC9`
  (sélection, chips).
- États : `--ok #5B6E4A` / `--ok-teinte #E4E8D8` · `--attention #9A6A2E` /
  `--attention-teinte #EFE4CF` · `--info #3E5C7E` / `--info-teinte #DCE3EC`
  · `--retard #A23E2E` (bordure bouton suppr. `#DCC3B4`, hover `#F3E4DC`).
- Radius : cartes 10px · encarts 8–9px · boutons 7px · chips 999px.

## Typographie (fonts déjà chargées via `next/font`, cf. `layout.tsx`)

- Cormorant Garamond (`--font-titre` / `font-serif`) : titre livre 600 34px,
  auteur italique 500 19px, titre de fiche 600 27px.
- EB Garamond (`--font-corps`, défaut body) : corps de fiche 16–17px,
  interlignage 1.5–1.65, notes en italique 12–13.5px.
- Alegreya Sans (`--font-ui` / `font-sans`) : boutons 600 12–13px, chips
  500 12px, rail 11–15px, intitulés uppercase 600 10.5–11px
  (letter-spacing .08–.12em).

## Assets

Aucun asset image. Glyphes texte : ✦ (carte), ↻, ✎, 👁, ▸/▾, ●/○, →.

## Fichiers

- `references/Scriptorium - Vue livre (2a).dc.html` — prototype interactif
  hi-fi (ouvrir dans un navigateur avec `support.js` à côté). Contient les
  12 semaines du Gai Savoir en données d'exemple, la logique de sélection,
  le surlignage des liens et les 3 états de carte.
- `references/support.js` — runtime nécessaire au prototype (ne pas porter
  en production).
