# Handoff : Calendrier › Configuration (réorganisation)

## Overview
Refonte de la page **Configuration du calendrier** (`/prof/calendrier/config`) du projet Palimpseste.

Objectif : la page actuelle empile 5 sections en pleine largeur (Fuseau, Semestres, Vacances, Couleurs des classes, Jours de cours). Avec beaucoup de classes et beaucoup de couleurs, ça devient long à parcourir. La refonte :

1. **Conserve** les deux onglets de module existants « Vue » / « Configuration » (`SousNavModule`).
2. **Remplace l'empilement** par un **maître-détail** : une colonne étroite à gauche (4 catégories) + un volet de détail à droite qui affiche l'écran de la catégorie sélectionnée.
3. **Fusionne** « Couleurs des classes » + « Jours de cours » en **un seul écran « Classes »** (1 ligne = 1 classe : couleur + jours + aperçu).
4. **Remplace la pipette de couleur libre** par une **palette maîtrisée** (12 teintes accordées), avec indication des teintes déjà prises.
5. **Ajoute une UX d'archivage** aux semestres (année scolaire courante en avant, semestres terminés archivables).
6. **Ajoute un écran Vacances** avec une bande de « semaines du semestre » qui visualise la numérotation pédagogique continue sautant les vacances.

Ordre de la colonne de gauche : **Classes → Semestres → Vacances → Fuseau**.

## About the Design Files
Les fichiers de ce dossier sont des **références de design réalisées en HTML** — des prototypes qui montrent l'apparence et le comportement voulus, **pas du code de production à copier tel quel**.

La tâche est de **recréer ces écrans dans le codebase existant** (`palimpseste`, Next.js App Router + React + Tailwind v4), en réutilisant ses composants, ses tokens et ses conventions déjà en place — et non d'intégrer le HTML directement. Les valeurs codées en dur dans le prototype (hex, polices) correspondent **exactement** aux tokens de `app/globals.css` : utilisez les tokens, pas les hex.

Le fichier `.dc.html` s'ouvre dans un navigateur (garder `support.js` à côté). C'est **interactif** : cliquez dans la colonne de gauche pour changer de volet.

## Fidelity
**Haute-fidélité (hifi).** Couleurs, typographies, espacements et états sont ceux de la charte Palimpseste. À recréer fidèlement avec les utilitaires Tailwind existants (`bg-surface`, `text-encre`, `border-bordure`, `bg-pigment-teinte`, `text-muet`, `text-muet-clair`, `text-encre-douce`, `bg-ok-teinte`/`text-ok`, `bg-attention-teinte`/`text-attention`, `text-retard`, `font-serif` = Cormorant, `font-sans` = Alegreya Sans, corps = EB Garamond).

---

## Codebase — état actuel (à modifier)
- **Route / page** : `app/prof/calendrier/config/page.tsx` — server component. Charge :
  - `semesters` (id, name, start_date, end_date, is_active, created_at) → `Semestre[]`
  - `holidays` du semestre sélectionné (id, semester_id, label, start_date, end_date) → `Holiday[]`
  - `classes` actives (id, nom, couleur) + `teaching_patterns` (classe_id, weekday) → jours par classe
  - `fuseau` via `lireFuseau()`
- **Layout / onglets** : `app/prof/calendrier/layout.tsx` monte `SousNavModule` avec `[{href:'/prof/calendrier', label:'Vue'}, {href:'/prof/calendrier/config', label:'Configuration'}]`. **À conserver tel quel.**
- **Composants clients existants** (à réorganiser / fusionner, pas à jeter) :
  - `GestionFuseau.tsx` → volet **Fuseau** (quasi inchangé)
  - `GestionSemestres.tsx` → volet **Semestres** (+ archivage, voir plus bas)
  - `GestionHolidays.tsx` → volet **Vacances** (déjà la liste + « Régénérer les semaines »)
  - `CouleursClasses.tsx` + `GestionJoursCours.tsx` → **à fusionner** en un volet **Classes**
- **Types** : `types/calendrier.ts` (`Semestre`, `Holiday`, `Semaine`)
- **Palette classes** : `utils/calendrier-couleurs.ts` → `PALETTE_CLASSES` (7 teintes aujourd'hui) + `couleursParClasse()`
- **Tokens** : `app/globals.css` (`@theme` Tailwind v4)

---

## Shell (commun à tous les volets)
Reprend le chrome de module existant :
- `← Tableau de bord` (lien `text-muet`), puis `Calendrier` (`h2`, `font-serif`).
- `SousNavModule` inchangé — onglet **Configuration** actif (halo `bg-pigment-teinte` + filet `border-liseret` dessous).
- Sous les onglets : conteneur flex, `gap: 26px`, `align-items: flex-start`.
  - **Colonne gauche** `width: 236px; flex: none;` — `position: sticky; top: 20px`.
  - **Volet droit** `flex: 1; min-width: 0`.

### Colonne gauche (rail des catégories)
- Sur-titre `PARAMÈTRES` — Alegreya Sans, 11px, `letter-spacing:.16em`, uppercase, `text-muet-clair` (#A8906A).
- 4 items dans l'ordre **Classes, Semestres, Vacances, Fuseau**. Chaque item :
  - Conteneur cliquable : `display:flex; flex-direction:column; gap:3px; padding:11px 14px; border-radius:10px`.
  - **Actif** : `background:#EDE6D6` (parchemin foncé), `border:1px solid #E4DBC9`, `border-left:3px solid #5A4632` (liseré sépia).
  - **Inactif** : bordures transparentes, fond transparent.
  - Ligne 1 = **label** : EB Garamond 16px/600, `text-encre` (#221C16).
  - Ligne 2 = **sous-texte** : Alegreya Sans 13px, `text-muet` (#8A6F4E). Résumés :
    - Classes → `9 classes` + **badge** `1 à configurer` (Alegreya Sans 11px/600, `text-attention` #9A6A2E sur `bg-attention-teinte` #EFE4CF, pilule)
    - Semestres → `S2 2025-2026 · actif`
    - Vacances → `3 périodes · 18 sem.`
    - Fuseau → `Europe/Paris`
- Note bas de rail (EB Garamond italique 12.5px, `text-muet-clair`) : « Fil de configuration : Fuseau → Semestres → Vacances → Classes. »
- **État** : `active: 'classes' | 'semestres' | 'vacances' | 'fuseau'` (le prototype ouvre par défaut sur `semestres` ; libre de démarrer sur `classes`). Cliquer un item met à jour `active`, le volet droit affiche l'écran correspondant. Dans le codebase, préférer l'URL (`?section=classes`) pour rester lié-able, à la manière du `?sem=` déjà utilisé par `GestionHolidays`.

---

## Écran 1 — Classes  (fusion Couleurs + Jours de cours)
**But** : régler, par classe, sa couleur et ses jours de cours ; voir tout de suite le rendu sur le calendrier.

**En-tête** : titre `Classes` (`font-serif` 24px, `text-encre`) + sous-titre italique (EB Garamond 15px, `text-muet`) « couleur et jours de cours — la couleur signe la classe sur tout le calendrier ».

**Carte tableau** (`bg-surface` #FBF8F1, `border` #E4DBC9, `border-radius:12px`) :
- **Barre d'outils** (padding 14px 20px, `border-bottom` #E4DBC9) :
  - Champ « 🔍 Filtrer les classes… » (input, `border` #D8CCB4, `border-radius:8px`, fond blanc, ~220px).
  - Texte `9 classes actives · 1 à configurer` (Alegreya Sans 13px, `text-muet`).
  - Bouton secondaire à droite `🎨 Couleurs auto` (`text-encre-douce`, fond blanc, `border` #C9BBA0) → répartit des teintes espacées automatiquement.
- **En-tête de grille** (Alegreya Sans 11px/600, uppercase, `letter-spacing:.14em`, `text-muet-clair`) — 4 colonnes : `grid-template-columns: 110px 74px 236px 1fr; gap:14px` → **Classe · Couleur · Jours de cours · Aperçu calendrier**.
- **Une ligne par classe** (même gabarit de grille, `padding:9px 20px`, `border-bottom` #EFE7D6, `position:relative`) :
  - **Classe** : EB Garamond 16px/600, `text-encre`.
  - **Couleur** : pastille 30×20, `border-radius:5px`, `border:1px solid rgba(34,28,22,.18)` + chevron ▾. Cliquer ouvre le **popover palette** (voir plus bas). La pastille sélectionnée y est cerclée `2px solid #5A4632`. Classe sans couleur = pastille `border:1.5px dashed #C9BBA0` sur fond blanc.
  - **Jours de cours** : 7 tuiles L M M J V S D, 28×28, `border-radius:7px`.
    - Jour **actif** = fond = **couleur de la classe**, texte #FBF8F1, 12px/600, `box-shadow: inset 0 0 0 1px rgba(34,28,22,.12)`.
    - Jour **inactif** = fond blanc, `border:1px solid #D8CCB4`, texte #C9BBA0.
    - `weekday` 0=Lundi … 6=Dimanche (aligné sur `teaching_patterns.weekday`).
  - **Aperçu calendrier** : pilule « {classe} · {exemple d'événement} » = pastille telle qu'elle sort sur le calendrier — `background: rgba(couleur, .15)`, `border-left:3px solid {couleur}`, `border-radius:5px`, EB Garamond 13.5px, `text` #3A2E22, `white-space:nowrap`. Classe non configurée = message `⚠ à configurer — couleur par défaut utilisée` (`text-attention` sur `bg-attention-teinte`).
- **Pied de carte** (`bg-parchemin` #F4EFE6, `border-top` #EFE7D6) : « ✔ Enregistré automatiquement à chaque clic. » (le ✔ en `text-ok` #5B6E4A). **Plus de bouton “Enregistrer” par ligne** — chaque clic (couleur / jour) persiste immédiatement.

**Popover palette** (ancré sous la pastille cliquée) : carte `bg-surface`, `border:1px solid #C9BBA0`, `border-radius:12px`, `box-shadow:0 10px 28px rgba(60,45,25,.22)`, largeur ~284px.
- Titre `PALETTE — 12 TEINTES ACCORDÉES` (Alegreya Sans 11px/600 uppercase, `text-muet-clair`).
- Grille `repeat(6, 1fr); gap:7px` de 12 échantillons (hauteur 26px, `border-radius:6px`).
- **Teinte déjà prise** = initiales de la/les classe(s) qui l'utilisent, imprimées en blanc 8.5px/700 (`text-shadow` léger). **Reste choisissable** — c'est un avertissement, pas une interdiction.
- Teinte **sélectionnée** = cerclée `2px solid #5A4632` + `box-shadow:0 0 0 2px #FBF8F1 inset`.
- Pied : « ◐ Autre couleur… (pipette libre) » — repli vers un color picker libre pour les cas hors palette.

**Palette (12 teintes accordées)** — étend l'actuelle `PALETTE_CLASSES` (7 → 12) :
```
#7C9CBF  #C08552  #7FA67F  #B07FA6  #C0A35E  #6FA8A8
#B5736B  #5C8A9E  #8B9556  #9C7BB5  #C77E9E  #7E7EB8
```
`couleursParClasse()` continue d'attribuer une teinte par position quand `classes.couleur` est null.

**Données / actions** : lit `classes(id, nom, couleur)` + `teaching_patterns(classe_id, weekday)`. Écritures : maj `classes.couleur` (au clic couleur/palette) ; insert/delete `teaching_patterns` (au clic jour). Le bouton « Couleurs auto » réattribue des teintes espacées à toutes les classes.

---

## Écran 2 — Semestres  (+ archivage)
**But** : ne garder en avant que les semestres de l'**année scolaire courante** ; archiver ceux qui sont terminés.

**En-tête** : titre `Semestres` + sous-titre italique « communs à toutes les classes — ancrent la numérotation des semaines ». À droite, **segmenté** (`bg-parchemin-fonce` #ECE4D6, `border` #D8CCB4, `border-radius:9px`, padding 3px) : `[ 2025-2026 ]` actif (pilule `bg-surface`, `border` #D8CCB4) · `Archives · 3` (inactif, `text-muet`). L'onglet Archives regroupe les semestres archivés **par année scolaire**.

**Bandeau d'archivage proposé** (n'apparaît que si un semestre est terminé et non archivé) : `bg-attention-teinte` #EFE4CF, `border:1px solid #D9BE8C`, `border-radius:12px`, padding 12px 18px.
- `🗄` + texte EB Garamond 15px `text` #6B5436 : « « S1 2025-2026 » est terminé depuis le 23 janvier. »
- Bouton `Archiver` (secondaire, fond `bg-surface`, `border` #C9BBA0, `white-space:nowrap`) + lien discret `plus tard` (`text-muet`, souligné pointillé).

**Semestre actif** : carte `bg-surface`, `border:1.5px solid #5B6E4A` (vert ok), `border-radius:12px`, padding 16px 20px.
- Nom `S2 2025-2026` (EB Garamond 17px/600) + badge `ACTIF` (Alegreya Sans 11px/700 uppercase, `text-ok` sur `bg-ok-teinte` #E4E8D8, pilule).
- **Barre de progression** (max-width 440px, hauteur 6px, `border-radius:99px`) : segment fait = `#5B6E4A`, reste = `#E4DBC9` (ratio semaine courante / total, ex. 7/20).
- Ligne d'info (EB Garamond 13px, `text-muet`) : « semaine 7 / 20 · 26 janv. → 27 juin 2026 · 3 périodes de vacances ». Lien `Éditer` à droite.

**Semestre terminé** (non archivé) : même carte, `border` #E4DBC9, `opacity:.8`. Nom + badge `TERMINÉ` (`bg-parchemin-fonce`, `text-muet`). Dates + « 18 semaines ». Lien `Éditer`.

**Archives** (dans l'onglet Archives) : accordéon **par année scolaire** (`2024-2025`, `2023-2024`…), chaque semestre listé avec un lien `Restaurer`. Un semestre archivé est **exclu des listes du reste de l'app** mais restaurable ici.

**Bouton** `+ Nouveau semestre` (primaire `bg-bouton` #5A4632, texte #FBF8F1, `border-radius:10px`).

**Dérivation de l'année scolaire (important)** : l'année scolaire se **déduit des dates** (rentrée septembre → août), **aucun champ à saisir**. Règle : `anneeScolaire(d) = mois(d) >= 8 (sept) ? annee(d)/annee(d)+1 : annee(d)-1/annee(d)`. « En avant » = semestres dont l'année scolaire = année scolaire de `today`. Le reste est **archivable**.

**Schéma — évolution nécessaire** : ajouter un marqueur d'archivage à `semesters`, ex. `archived_at timestamptz null` (ou `is_archived boolean default false`). Filtres : liste principale = `archived_at is null`, onglet Archives = `archived_at is not null`. `types/calendrier.ts › Semestre` reçoit le champ. Actions à ajouter dans `config/actions.ts` : `archiverSemestre(id)`, `restaurerSemestre(id)` (+ garde-fou : ne pas archiver le semestre `is_active`).

---

## Écran 3 — Vacances  (nouveau)
**But** : saisir les périodes de vacances **par semestre** ; visualiser leur effet sur la numérotation des semaines.

**En-tête** : titre `Vacances` + sous-titre italique « saisies par semestre — une semaine en vacances ne reçoit pas de numéro ». À droite, **sélecteur de semestre** (`bg-surface`, `border` #D8CCB4, `border-radius:8px`) `S2 2025-2026 ▾` (n'apparaît que si >1 semestre — comportement déjà présent dans `GestionHolidays`).

**Liste des périodes** — une carte par `holiday` (`bg-surface`, `border` #E4DBC9, `border-radius:12px`, padding 13px 20px, flex) :
- Libellé (EB Garamond 15.5px/600, `text-encre`) + dates (13px, `text-muet`) « 16 févr. → 1 mars · 2 semaines ».
- Liens `Éditer` (`text-muet`) et `Supprimer` (`text-retard` #A23E2E), soulignés.
- Exemples du prototype : *Vacances d'hiver* (16 févr → 1 mars, 2 sem.) · *Vacances de printemps* (13 avr → 26 avr, 2 sem.) · *Pont de l'Ascension* (14 → 17 mai, avec la mention italique « n'enlève aucune semaine pédagogique »).

**Ajouter une période** : ligne pointillée (`border:1.5px dashed #C9BBA0`, `bg` #F9F5EC) « ＋ Ajouter une période » + rappel des champs « libellé · début · fin ». Ouvre le formulaire de `GestionHolidays` (`creerHoliday`).

**Bloc « Semaines du semestre »** (`bg-parchemin-fonce` #ECE4D6, `border` #E4DBC9, `border-radius:12px`, padding 18px 20px) :
- Ligne titre : « Semaines du semestre » (EB Garamond 15px/600) + statut « 18 semaines générées ✔ » (`text-ok`, 13px/600) + note italique à droite « numérotées en continu, en sautant les vacances ».
- **Bande des semaines** : flex `wrap`, `gap:6px`. Séquence de jetons dans l'ordre calendaire :
  - **Semaine pédagogique** = jeton 30×30, `border-radius:7px`, `bg-surface`, `border` #E4DBC9, numéro Alegreya Sans 12.5px/600 `text-encre-douce`. Numérotation **continue** 1…N.
  - **Vacances** = pilule hachurée `background: repeating-linear-gradient(45deg,#E4D9C4 0 4px,#F1EADB 4px 8px)`, `border:1px dashed #C9BBA0`, libellé EB Garamond italique 12.5px `text-muet` (« Vac. hiver », « Vac. printemps »). Les semaines couvertes **ne reçoivent pas de numéro**.
  - Prototype : `1 2 3 · [Vac. hiver] · 4 5 6 7 8 9 · [Vac. printemps] · 10 … 18`.
- Bouton `Régénérer les semaines` (secondaire) + **légende** (semaine pédagogique / vacances).

**Données / actions** : réutilise `GestionHolidays` — `creerHoliday`, `modifierHoliday`, `supprimerHoliday`, `regenererSemaines(semesterId)`. La bande lit les `Semaine` générées (`numero` calendaire, `pedagogical_number` null si `is_vacation`). Afficher `pedagogical_number` sur les jetons ; grouper les `is_vacation` consécutives en une pilule (libellé = `holiday.label` recouvrant).

---

## Écran 4 — Fuseau horaire
**But** : fuseau d'affichage des heures (échéances, quizz, photos). Quasi inchangé — juste replié dans un volet.

- Titre `Fuseau horaire` + sous-titre italique « heure des échéances, quizz et photos ».
- Carte `bg-surface` (max-width 520px) : label `Fuseau` + contrôle type select `Europe/Paris ▾` (`border` #D8CCB4, fond blanc). Réutiliser `GestionFuseau.tsx`.
- Note (EB Garamond 14px, `text-muet`) : « Les dates de semestre et de vacances ne dépendent pas du fuseau — seules les heures des événements s'y ajustent. »

---

## Design tokens (rappel — utiliser ceux de `app/globals.css`)
- **Surfaces** : parchemin `#F4EFE6`, parchemin-foncé `#ECE4D6`, surface/carte `#FBF8F1`, blanc champ `#FFFFFF`.
- **Encre / texte** : encre `#221C16`, encre-douce/sépia `#5A4632`, muet `#8A6F4E`, muet-clair `#A8906A`, valeur secondaire `#3A2E22`, sépia clair `#6B5436`.
- **Traits** : bordure `#E4DBC9`, bordure-bouton `#D8CCB4`, puce/pointillé `#C9BBA0`, séparateur clair `#EFE7D6`.
- **États** : ok `#5B6E4A` / ok-teinte `#E4E8D8` · attention `#9A6A2E` / attention-teinte `#EFE4CF` / bordure attention `#D9BE8C` · retard `#A23E2E`.
- **Pigment (module Palimpseste)** : pigment/bouton/liseré `#5A4632`, pigment-teinte `#E8DFCB`, fond-module `#F4EFE6`.
- **Palette classes (12)** : voir écran Classes.
- **Rayons** : cartes 12px · pilules/inputs 8px · pastilles 5–7px · badges 99px.
- **Typo** : titres `Cormorant Garamond` (`font-serif`, 24–26px/600) · corps `EB Garamond` (13–16px) · interface/labels `Alegreya Sans` (`font-sans`, 11–14px ; uppercase `letter-spacing:.14–.16em` pour les sur-titres).
- **Espacement** : gouttière rail/détail 26px · padding carte 14–20px · gap listes 9–10px.

## Interactions & comportements
- **Navigation volets** : clic sur un item du rail → change `active` → affiche l'écran. Persister via query param (`?section=`).
- **Classes** : clic couleur → popover palette → clic teinte = maj immédiate ; clic jour = toggle immédiat (insert/delete `teaching_patterns`). Aucun bouton Enregistrer. « Couleurs auto » = réattribution en masse.
- **Semestres** : bandeau d'archivage visible seulement si `end_date < today` et non archivé ; `Archiver`/`Restaurer` ; onglet Archives groupé par année scolaire ; garde-fou sur le semestre actif.
- **Vacances** : CRUD périodes + `Régénérer les semaines` ; la bande reflète l'effet des vacances sur `pedagogical_number`.
- **États vides** : « Aucun semestre » (création guidée du 1er, nom pré-rempli d'après la date) ; « Aucune période de vacances pour ce semestre » ; classe non configurée = pastille défaut + mention d'avertissement.

## Fichiers de ce dossier
- `Calendrier Config - Rendu charte v2.dc.html` — **écran de référence hifi** (maître-détail, 4 volets, interactif). `support.js` doit rester à côté pour l'ouvrir.
- `Calendrier Config - Wireframes.dc.html` — wireframes basse-fidélité explorés en amont : registre des classes (1a) et pistes semestres (2a = archives repliées, **2b = rangement proposé, retenu**, 2c = état vide). Utile pour comprendre les alternatives et les états.
- `support.js` — runtime nécessaire pour ouvrir les `.dc.html` dans un navigateur (référence uniquement, pas à porter).

## Assets
Aucun asset binaire. Icônes = glyphes/emoji du prototype (🔍 🎨 🗄 ✔ ⚠ ◐ ＋ ▾) — les remplacer par le jeu d'icônes du codebase. Le sceau Palimpseste (`uploads/Logo-Palimpseste.png`) n'est pas utilisé sur ces écrans.
