# Handoff — Scriptorium · Discussion élève, bureau : l'en-tête s'efface

> Pour Claude Code. Objectif : **rendre l'espace au fil de la Discussion**. Aujourd'hui, sur
> `/eleve/modules/scriptorium?vue=discussion`, l'en-tête à deux barres (onglets généraux + bande
> seuil avec sceaux, devise, sous-onglets) mange près d'un tiers de la hauteur, et le contenu est
> enfermé dans une colonne `max-width` avec des marges perdues autour et à l'intérieur du chat.
>
> Décision : **sur la Discussion, l'en-tête disparaît**. Il est remplacé par un **ruban vertical
> de 64 px** à gauche qui porte le retour vers Palimpseste, le sceau du Scriptorium, la nouvelle
> conversation, l'historique (en **tiroir qui pousse le fil**) et le Plan de cours. Le fil occupe
> **toute la hauteur** de la fenêtre, avec une **largeur de lecture bornée** (900 px max, centré).
>
> **C'est de la présentation + navigation, pas de la logique.** Streaming, stop, quota,
> `renommer`/`supprimer`, `?conv=`, RAG : inchangés. **Périmètre : bureau uniquement** (≥ 1024 px).
> Le mobile garde son modèle liste ↔ fil (handoff `scriptorium_discussion_mobile`).

---

## Références visuelles

- **`Scriptorium Discussion bureau - Rendu charte.dc.html`** — cible hi-fi, **fait foi**. Mode canvas (pan/zoom).
  - `2a` — **à l'arrivée** : ruban replié, fil seul.
  - `2b` — **tiroir des conversations ouvert** : 360 px, il **pousse** le fil (pas de recouvrement, pas de voile).
- **`Scriptorium Discussion bureau - Wireframes.dc.html`** — les quatre pistes explorées (`1a` sans en-tête, `1b` en-tête replié à gauche, `1c` fine barre, `1d` ruban + tiroir — **retenu**). Ne fait pas foi.

Reproduire le langage visuel avec les composants et jetons existants (`globals.css`, `next/font`,
`configModules`). Aucune couleur ni police en dur hors valeurs déjà nommées.

---

## Architecture concernée (existant)

- **`app/eleve/modules/scriptorium/page.tsx`** — page serveur ; monte `<ChatScriptorium>` sous `?vue=discussion`. Pose `data-module="scriptorium"` et un wrapper `lg:-mt-4 lg:-mb-2`.
- **`app/eleve/modules/scriptorium/ChatScriptorium.tsx`** — rail `<aside>` + fil + écritoire (correspondance continue déjà en place : `Datation`, `Fleuron`, `EnTeteLettre`, `railOuvert`).
- **`components/nav/EnTeteSite.tsx`** — en-tête partagé, deux barres. **C'est lui qu'il faut masquer** sur cette vue.
- **`components/nav/configModules.ts`** — sous-onglets `Plan de cours` / `Discussion` (`?vue=`), couleurs.
- **`components/nav/LibelleSuivi.tsx`** — déjà importé par `ChatScriptorium`.

---

## Décisions validées par le porteur du projet

1. Sur `?vue=discussion` en bureau, **l'en-tête (les deux barres) n'est pas rendu**. Il reste tel quel sur `?vue=plan` et sur tout le reste du site.
2. **Ruban gauche de 64 px**, pleine hauteur, fixe. De haut en bas : médaillon Palimpseste (retour) · sceau Scriptorium · filet · **＋** nouvelle conversation · **≡** conversations · **Plan de cours** · en bas, la classe active.
3. **Le tiroir des conversations pousse le fil** (layout flex, largeur 360 px), il ne le recouvre pas et n'assombrit rien. Il se ferme au choix d'une conversation, au **×**, ou en recliquant **≡**.
4. **Le fil garde une largeur de lecture** : `max-width: 900px`, centré dans l'espace restant, marges latérales 48 px. Il ne s'élargit jamais au-delà, tiroir ouvert ou fermé.
5. **Le fil prend toute la hauteur** : en-tête de lettre en haut, écritoire collé en bas, la correspondance défile entre les deux.

---

## Chantier 1 — Masquer l'en-tête sur la Discussion bureau

- Dans le layout élève (ou `EnTeteSite`), **ne pas rendre** l'en-tête quand `pathname === '/eleve/modules/scriptorium'` **et** `vue` résolu = `discussion` (défaut). Le plus simple : `page.tsx` connaît déjà `vue` ; exposer un flag (prop, contexte, ou `data-sans-en-tete` sur le wrapper lu par un CSS `has()`) plutôt que dupliquer la résolution de `searchParams` dans l'en-tête.
- Retirer, pour cette vue seulement, le wrapper `lg:-mt-4 lg:-mb-2` et **tout `max-width` de page** : la Discussion occupe `100vw × 100dvh`.
- **Sous `lg` (< 1024 px)** : rien ne change — en-tête mobile compact et modèle liste ↔ fil existants.

> Acceptation : à 1280 px, `?vue=discussion` n'affiche ni barre d'onglets généraux ni bande seuil ; `?vue=plan` les affiche encore ; le retour à Palimpseste se fait par le médaillon du ruban.

## Chantier 2 — Le ruban (64 px)

Fond `surface #FBF8F1`, filet droit `#E4DBC9`, `padding: 14px 0 16px`, colonne centrée, `gap: 14px`. Cibles **40 × 40 px** minimum. Chaque élément porte un `title` / `aria-label`.

| Ordre | Élément | Rendu | Action |
|---|---|---|---|
| 1 | **Retour à Palimpseste** | médaillon `palimpseste_medaillon.png` 40 px, N&B `multiply`, fond `#EDE6D6`, bord `#E4DBC9` ; petit disque `#4A3A28` 16 px collé à gauche portant « ‹ » en `#F1EADD` | `<Link href="/eleve">` |
| 2 | **Scriptorium** | sceau `pastille-scriptorium.png` 40 px, `multiply`, fond `pigment-teinte #E6DDC9`, bord `#D3C6AA`, **anneau 2 px `#B8893B`** + ombre douce (signe « tu es ici », comme dans la bande seuil) | inerte (ou `?vue=plan`) |
| — | filet | 28 px, dégradé transparent → `rgba(60,50,40,.25)` → transparent | — |
| 3 | **＋ Nouvelle conversation** | 40 px, `radius 10`, **noyer estompé** `bg-bouton #6B5A46` / `#F1EADD`, glyphe 22 px | comportement existant de `+ Nouvelle conversation` |
| 4 | **≡ Conversations** | 40 px, `radius 10`, fond `#fff`, bord `#E4DBC9`, trois traits `#6B5A46` (le 3ᵉ court, aligné à gauche). **Ouvert** : fond `#E6DDC9`, bord `#C9B896`, traits `#4A3A28` | bascule le tiroir (état `railOuvert`, déjà présent) |
| 5 | **Plan de cours** | 40 px, `radius 10`, fond `#fff`, bord `#E4DBC9` ; trois barrettes 14 × 5 px : verte `ok #5B6E4A`, ocre `attention #9A6A2E`, vide bord `#C9BBA0` (rappel des trois statuts du plan) | `<Link href="?vue=plan">` |
| 6 | **Classe** | `margin-top: auto` ; pastille Alegreya Sans 11 px `#5A4632`, fond `#F6F1E7`, bord `#E4DBC9`, `radius 7` — « 2de B » | inerte (le changement de classe reste dans l'en-tête des autres pages) |

Pas de libellés texte dans le ruban : les `title` suffisent, le tiroir et le fil portent les mots.

## Chantier 3 — Le tiroir des conversations (360 px)

- **Dans le flux** : `flex: none; width: 360px`, fond `#FBF8F1`, filet droit `#E4DBC9`. **Pas de `position: absolute`, pas de voile, pas d'ombre** — le fil se recale à droite (transition `width` 200 ms acceptable, aucune autre animation).
- **En-tête** : « Conversations » en Cinzel 16 px `#4A3A28`, sous-ligne « Tes échanges avec le tuteur — {classe}. » EB Garamond 13 px `#8A6F4E` ; **×** à droite (Alegreya Sans 20 px `#8A6F4E`). Filet bas `#E4DBC9`.
- **Liste** : reprendre le rail existant tel quel (cartes 9 px, active à liseré gauche `#6B5A46` + fond `#F4EEE2` + bord `#C9B896`, `Renommer` / `Supprimer` au survol, `Supprimer` seul en rouge `#A25B4A`). Label « RÉCENTES » Alegreya Sans 11 px `.11em` `#A8906A`.
- **Fermeture** : au clic sur une conversation, sur **×**, sur **≡**. **État par défaut à l'arrivée : fermé.** Mémoriser l'ouverture en `sessionStorage` est acceptable, pas obligatoire.
- Le `+ Nouvelle conversation` du rail actuel **disparaît du tiroir** : il est dans le ruban.

## Chantier 4 — Le fil pleine hauteur

- Conteneur : `flex: 1; min-width: 0; display: flex; flex-direction: column; height: 100dvh`.
- Colonne de lecture : `width: 100%; max-width: 900px; margin: 0 auto; padding: 28px 48px 0` (box-sizing border-box). La même colonne borne l'écritoire.
- **En-tête de lettre** (`EnTeteLettre`, existant) en haut, complété à droite par le **titre de la conversation** en Cormorant italique 15 px `#6E5A3E` et la pastille quota « N messages restants » (existant, `#8A6F4E` sur `#F1EBDE`). Filet bas `#E4DBC9`.
- Corps : **inchangé** — `Datation`, tuteur pleine colonne EB Garamond 17-18 px / 1,65 `#221C16`, élève en retrait `margin-left: 96px`, filet `2px rgba(74,58,40,.35)`, label « TOI », italique `#3A2E22` ; `Fleuron` unique après la dernière réponse achevée ; `pre-wrap`.
- La zone de messages est **la seule boîte défilante** (`flex: 1; min-height: 0; overflow-y: auto`) — régime `filDefilant` existant. L'écritoire reste visible en bas : `padding: 16px 48px 24px`, champ `#fff` bord `#D8CCB4` `radius 11`, bouton `Envoyer` `bg-bouton`.

---

## Rappels charte

- Polices : `font-marque` Cinzel · `font-titre` Cormorant Garamond · `font-corps` EB Garamond · `font-ui` Alegreya Sans.
- Encres : `#221C16` encre · `#3A2E22` / `#5A4632` encre douce · `#4A3A28` pigment · `#6E5A3E` méta (AA) · `#8A6F4E` / `#A8906A` atténué. Aucun pigment nouveau.
- Boutons estompés (`CLAUDE.md`) : noyer `#6B5A46` / `#F1EADD`. Rouge réservé à `Supprimer`.
- Anneau ocre `#B8893B` = module actif (repris de la bande seuil). Sceaux en N&B `multiply`.

## Hors périmètre

- Logique : streaming, stop, quota, actions, `?conv=`, RAG.
- `?vue=plan` : garde l'en-tête complet et sa mise en page actuelle.
- Mobile / iPad portrait (< 1024 px) : modèle existant, inchangé.
- Changement de classe active : reste dans l'en-tête des autres pages.

## Checklist d'acceptation

- [ ] Bureau, `?vue=discussion` : aucune barre d'en-tête ; ruban 64 px + fil pleine hauteur. `?vue=plan` : en-tête intact.
- [ ] Ruban : 6 éléments dans l'ordre, cibles ≥ 40 px, `title`/`aria-label`, retour Palimpseste par le médaillon, Plan de cours par la barrette, ＋ en noyer estompé.
- [ ] Tiroir 360 px **dans le flux** (pousse le fil), fermé à l'arrivée, fermeture au choix / × / ≡ ; liste et actions du rail existant reprises ; `+ Nouvelle conversation` retiré du tiroir.
- [ ] Fil : `max-width: 900px` centré, jamais plus large ; en-tête de lettre + titre + quota en haut ; écritoire collé en bas ; seule la correspondance défile.
- [ ] Rendu épistolaire inchangé (voix par mise en page, un fleuron, datation, `pre-wrap`) ; aucune animation hors transition de largeur du tiroir.
- [ ] Aucune couleur/police en dur hors valeurs nommées ; aucune fonctionnalité nouvelle ; aucune régression d'envoi.
