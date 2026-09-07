# Handoff — Fragments d'érudition · espace élève (refactor)

## Aperçu

Ce paquet décrit la **réorganisation côté élève du module `fragments-erudition`** de Palimpseste.
Le module existe déjà et fonctionne ; l'objectif n'est **pas** de le réécrire de zéro mais de
**réagencer ce qui est affiché** pour régler trois problèmes identifiés :

1. **Clutter** — tout s'empile et se lit d'un bloc (thème, graphe de parcours, 3 stats, pistes,
   3-4 tuiles, dernier retour déplié en entier, formulaire de dépôt, historique complet…).
   On veut **une chose à la fois** : une action « maintenant » mise en avant, le reste replié.
2. **Sceau manquant / sous-exploité** — l'en-tête du monde Fragments n'affiche aucun sceau
   (juste le titre texte `Fragments d'érudition`), alors que c'est l'élément d'identité du monde.
   On l'ajoute à l'en-tête, on l'agrandit, et on le déploie en grand sur la synthèse.
3. **Couleur** — la charte définit déjà la bonne couleur du monde (olive `#616E30` +
   bouton terracotta `#B26A4A`). Des maquettes antérieures avaient dérivé vers `#5A6043` et
   réutilisé par erreur le **bleu d'Aletheia** pour des boutons. Canon = la charte du code.

## À propos des fichiers de design

- **`Fragments - Parcours élève.dc.html`** est une **référence de design** (prototype HTML sur
  un canvas pannable). Il montre l'intention visuelle et l'agencement écran par écran ; ce **n'est
  pas** du code à copier. La tâche est de **reproduire cette intention dans le codebase Next.js
  existant**, avec ses patterns (Server Components, Tailwind v4, la charte `globals.css`).
- Le fichier est organisé en bandes : Vue d'ensemble · A Accueil · B Dépôt hebdo · C Retour
  socratique · D Semaines précédentes · E Oral · F Essai · G Synthèse · H États limites.
  Plusieurs bandes montrent un **AVANT (actuel)** vs **APRÈS (proposé)**.

## Fidélité

**Hi-fi pour le traitement visuel** (couleurs, typographie, sceau, espacements fidèles à la charte)
mais il s'agit d'un **refactor d'écrans existants**, pas de nouveaux composants. Reprends les
composants en place et change leur **hiérarchie et leur état d'ouverture par défaut** (replié vs
déplié), pas leur logique métier (dépôt, gate de lecture, analyses publiées… restent identiques).

---

## Codebase concerné (fichiers réels à modifier)

Tout est sous `app/eleve/modules/fragments-erudition/` sauf indication.

| Fichier | Rôle | Nature du changement |
|---|---|---|
| `page.tsx` | Page serveur du module (assemble tout) | **Réagencement principal** : nouvelle hiérarchie, en-tête avec sceau, parcours réduit, dernier retour replié |
| `AnalysePubliee.tsx` | Affiche un retour écrit (notes + 5 sections + pistes + transcription) | **Hiérarchiser** : notes + « en un mot » en tête, 4 sections détaillées repliées |
| `FormulaireDepot.tsx` | Formulaire de dépôt photo (hebdo) | Inchangé sur le fond ; vérifier que le bouton utilise `bg-bouton` (terracotta) |
| `EssaiDepot.tsx` / `EssaiPublie.tsx` | Dépôt + retour de l'essai | `EssaiPublie` : replier les dimensions secondaires |
| `AnalyseOralePubliee.tsx` | Retour d'oral | OK ; aligner la grammaire (notes en tête, transcription repliée) |
| `BilanSemestre.tsx` | Synthèse de semestre | Ajouter le **sceau en grand** en en-tête de la vue synthèse |
| `layout.tsx` | Pose `data-module="fragments"` | **Déjà correct** — c'est lui qui injecte les variables de couleur du monde |
| `app/globals.css` | Charte (tokens couleur par module) | Vérifier le canon (voir Design Tokens) |
| `components/Tuile.tsx` | Tuile d'état (vert/rouge/neutre) | Réutilisée pour la rangée des 4 brins |
| `components/fragments/GraphiqueProgression.tsx` | Graphe du parcours | Déplacé derrière « Voir le détail » (plus en tête de page) |

> ⚠️ Il existe deux copies de `globals.css` : `app/globals.css` (canon, `#616E30`) et
> `design_handoff_charte_palimpseste/code/globals.css` (ancienne, `#5A6043`). **Utiliser `#616E30`.**

---

## Le module en bref (4 brins, pas 2 écrans)

Le module élève est **une page à 4 vues** (param d'URL `?vue=`), pas deux écrans :

- `ecrit` — **Fragments écrits** (cœur) : dépôt hebdo photo → retour socratique → lire/valider (gate) → semaine suivante. + historique.
- `oral` — **Fragment oral** : l'oral se fait en classe ; l'élève consulte le retour (notes, audio, transcription).
- `essai` — **Essai** : épreuve datée par le prof, dépôt photo (≤12), retour par dimension + note /20.
- `synthese` — **Synthèse** : bilan de semestre (apparaît quand publiée).

Transverse : **« Ton parcours »** (graphe par section + stats + pistes du dernier retour) et les **tuiles d'état**.

---

## Écrans / vues — détail

### A · Accueil du monde (vue par défaut, `vue=ecrit`)

**But** : l'élève voit immédiatement quoi faire, sans tout lire.

**Hiérarchie proposée (de haut en bas)** :
1. **En-tête de monde** — sceau (pastille, voir Sceau) **88 px** + sur-titre `FRAGMENTS D'ÉRUDITION`
   (Cinzel, 14px, letter-spacing .2em, `--pigment`) + titre du thème (Cormorant 28-29px) + ligne thème.
   *(Aujourd'hui : pas de sceau, juste un `<h2>` texte → l'ajouter.)*
2. **Carte « À FAIRE MAINTENANT »** unique — bordure `1.5px --pigment`, fond `--surface`, radius 12.
   Sur-label olive 11px, titre Cormorant 21px, sous-texte, **bouton terracotta** « Déposer → » à droite.
   Le contenu dépend de l'état réel (à déposer / retour à lire / à jour / rien).
3. **Rangée des 4 brins** (réutiliser `Tuile`) — 4 cartes égales, chacune : pastille d'état
   (8-9px) + nom + sous-état (`À déposer`, `Retour dispo.`, `Rien de neuf`, `Fin de semestre`).
   La tuile active a un liseré bas `3px --pigment`.
4. **Bande « Ton parcours »** réduite à **une ligne** : `Découvertes B+ · Sources C · Réflexions B`
   + lien `Voir le détail →` (qui déplie le `GraphiqueProgression` + les 3 stats). **Ne plus afficher
   le graphe + 3 cartes + liste de pistes par défaut.**
5. **Dernier retour replié** en **une ligne** : icône 💡 + 1 piste + `déplier`. (Aujourd'hui le bloc
   `AnalysePubliee` complet est rendu en entier ici → le replier.)

**AVANT (à supprimer de l'affichage par défaut)** : thème en pavé + graphe + 3 stats + pistes +
dernier retour entier + formulaire, tout empilé.

### B · Dépôt hebdomadaire (brin écrits) — états

En-tête de semaine constant : pastille sceau (54px) + `SEMAINE EN COURS` + `Semaine N — Titre`
+ date limite + badge d'état à droite.

| État | Affichage |
|---|---|
| **À déposer** | Zone d'upload pointillée (`📷 Ajouter des photos`, JPEG/PNG/HEIC, max 4), vignettes ordonnables (▲▼✕), commentaire optionnel, bouton **terracotta** « Déposer mon compte-rendu ». = `FormulaireDepot` actuel. |
| **Déposé (retour en attente)** | Badge vert `✓ Déposé`, encart `Retour en préparation…`. |
| **En retard** | Même formulaire, badge minium `⚠ En retard` (`--retard`/`--retard-teinte`). |
| **Verrou (retour à lire)** | Encart ambre (`--attention`) : « Lis et valide ton dernier retour pour débloquer le dépôt » + bouton. C'est le **gate de lecture** existant (`BoutonLectureRetour`). |
| **À jour** | Badge vert, message « Rien à faire cette semaine ». |

### C · Retour socratique (`AnalysePubliee.tsx`) — le plus chargé ★

**But** : rendre lisible un retour aujourd'hui composé de 3 notes + 5 sections texte
(commentaire général, progrès, langue, style, contenu) + pistes + note du prof + transcription,
**tous dépliés**.

**Proposé** :
1. **3 notes en grille** (Découvertes · Sources · Réflexions) — chaque carte teintée selon la note
   (`--ok-teinte`/`--ok`, `--attention-teinte`/`--attention`, etc.), lettre Cormorant + label
   (`noteVersLettre` + `LABELS_NOTE` déjà en place).
2. **« ★ EN UN MOT »** — encart `border-left:4px --pigment`, qui remonte la phrase la plus utile
   (mapper sur `commentaire_general`).
3. **Pistes** visibles (actionnables) — 💡 / 🔁 (rappel) comme aujourd'hui.
4. **Détail replié** — `Langue`, `Style`, `Contenu`, `Transcription` deviennent des lignes
   `▸ … déplier` (un `<details>` / accordéon chacun). Plus de 5 pavés de même poids.

### D · Semaines précédentes — archive repliable

Aujourd'hui chaque dépôt passé ré-affiche `AnalysePubliee` complet à la suite. **Proposé** : une
**liste de lignes** : `N° · Titre · (notes B+ C B) · déplier ▾`. Une seule ouverte montre le
« en un mot » + lien vers le détail. Réutilise le composant C pour le contenu déplié.

### E · Fragment oral (`vue=oral`)
Notes (Contenu · Structure · Expression) en grille, stats (durée/mots/min), sections de retour,
**lecteur audio**, transcription repliée. État vide : pastille sceau (opacité .7) + « Aucun retour
d'oral pour l'instant. L'oral se fait en classe. »

### F · Essai (`vue=essai`)
- **Dépôt** : titre épreuve + date + durée + consignes ; zone photo (max 12, recto puis verso) ;
  vignettes ; bouton terracotta « Déposer mon essai ». Après dépôt : « Analyse en cours… ».
- **Retour** (`EssaiPublie`) : 4 lettres par dimension (Structure · Expression · Argumentation ·
  Connaissances) en grille (pastille ronde lettre, teinte selon A/B vert, C/D ambre, E minium) ;
  une dimension ouverte + les autres repliées ; mise en perspective + bilan repliés ;
  **note /20** sur fond `--pigment` (olive) si `note_visible_eleve`.

### G · Synthèse de semestre (`vue=synthese`, `BilanSemestre`)
**Le sceau s'y déploie en grand (≈116px), centré**, sur-titre `FRAGMENTS · BILAN DU SEMESTRE`,
titre du thème. Puis : bilan (`border-left 4px --pigment`), **Points forts** (carte `--ok`),
**Axes de progrès** (carte `--attention`), **note de semestre /20** sur fond olive si visible.

### H · États limites
Module non disponible · Aucune semaine ouverte · Thème non défini (`Ton thème sera défini avec ton
professeur.`) · Échec de l'envoi (encart minium + « Réessayer l'envoi », photos conservées).

---

## Le sceau (asset + intégration)

- Fichier source : `assets/fragments.png` (1448×1086) — médaillon gravé **+ mot « FRAGMENTS » +
  marges crème**. Ne pas l'utiliser tel quel dans un cercle (le mot et les marges débordent).
- **`assets/fragments_medaillon.png`** (777×777) = recadrage carré **centré sur l'emblème**
  (détection automatique du centre de l'emblème, mot retiré). À utiliser dans les pastilles rondes.
- **Pastille** (motif réutilisable) :
  ```html
  <span class="pastille">
    <img src="fragments_medaillon.png" alt="" />
  </span>
  ```
  ```css
  .pastille{
    width:88px;height:88px;border-radius:50%;
    background:var(--pigment-teinte);            /* #E2E3D2 */
    display:inline-flex;align-items:center;justify-content:center;
    overflow:hidden;flex-shrink:0;
    box-shadow:inset 0 0 0 1px rgba(97,110,48,.16);
  }
  .pastille img{
    width:100%;height:100%;object-fit:cover;
    mix-blend-mode:multiply;                      /* la gravure prend la teinte du monde */
    filter:saturate(1.05) contrast(1.03);
  }
  ```
  Tailles utilisées : 116px (synthèse, héros), 88px (en-tête accueil), 54px (en-tête semaine),
  50px (retour), 44-46px (mobile / vide). Toujours **médaillon centré** → pas de décalage.
- Idéalement, **committer le médaillon recadré** comme asset du codebase (ex. `public/sceaux/`),
  ou recadrer à la build. Ne pas tenter de centrer l'emblème via `object-position` sur le PNG complet :
  le recadrage est plus net.

---

## Design Tokens (depuis `app/globals.css`)

**Monde Fragments** (`[data-module="fragments"]`, déjà posé par `layout.tsx`) :
- `--pigment: #616E30` (olive) · `--pigment-teinte: #E2E3D2` · `--fond-module: #EFE9DC`
- `--bouton: #B26A4A` (terracotta) · `--liseret: #616E30`
- `--terracotta: #B26A4A`

**Base / surfaces** : `--parchemin #F4EFE6` · `--parchemin-fonce #ECE4D6` · `--surface #FBF8F1`
· `--encre #221C16` · `--encre-douce #5A4632` · `--muet #8A6F4E` · `--bordure #E4DBC9`

**États** (indépendants du module) : `--ok #5B6E4A`/`--ok-teinte #E4E8D8` ·
`--attention #9A6A2E`/`#EFE4CF` · `--retard #A23E2E`/`#EFD9D2` · `--info #3E5C7E`/`#DCE3EC`

**Typo** (via `next/font`, exposées en tokens) :
- `--font-marque` Cinzel (sur-titres, sceau) — labels 11-14px, letter-spacing .12–.2em
- `--font-titre` Cormorant Garamond (titres, notes) — 18-34px, weight 600
- `--font-corps` EB Garamond (corps) — 13-16px
- `--font-ui` Alegreya Sans (UI, badges, labels) — 10.5-14px

**Radius** : cartes 11-12px, encarts 9-10px, pastilles d'état rondes, badges pill 9px.
**Boutons** : `bg-bouton text-surface`, radius 8px, padding ~11-12px, `font-ui` 600.
> Règle couleur : **ne jamais coder en dur le bleu `#2C4A7C` (Aletheia)** dans Fragments.
> Tout passe par les tokens (`bg-bouton`, `text-pigment`, `border-l-liseret`…), qui prennent
> automatiquement l'olive/terracotta grâce à `data-module="fragments"`.

---

## Comportements / état (inchangés sur le fond)

- **Gate de lecture** : tant que `retour_lu_at` est nul sur le dernier retour, le dépôt est bloqué
  (`BoutonLectureRetour` valide la lecture). Logique conservée — on change juste sa mise en avant.
- **Param `?vue=`** : `ecrit` (défaut) | `oral` | `essai` | `synthese`. Les tuiles/brins y mènent.
- **Anti-triche photo** : EXIF ancien → encart d'avertissement (`FormulaireDepot`). Conservé.
- **Notes visibles** : `note_visible_eleve` conditionne l'affichage de la note /20 (essai, synthèse).
- **Couleurs des tuiles** : calculées dans `page.tsx` (`couleurEcrit/Oral/Essai` vert/rouge/neutre) — réutiliser pour les pastilles d'état des 4 brins.

## Accordéons / repli

Les nombreux « déplier » peuvent être de simples `<details><summary>` (progressive enhancement,
zéro JS) ou des composants client à état local. Comportement : **fermé par défaut**, sauf le brin
actif et le bloc « en un mot ».

## Responsive

Chaque écran clé est fourni en **ordi et mobile**. Mobile : pleine largeur, brins en lignes
empilées (pas en rangée), grilles de notes restent 3 colonnes (compactes). Cibles tactiles ≥ 44px.

## Fichiers de ce paquet

- `Fragments - Parcours élève.dc.html` — la référence de design (ouvrir dans un navigateur ;
  canvas pannable, labels `data-screen-label` par écran).
- `assets/fragments_medaillon.png` — sceau recadré centré (à utiliser dans les pastilles).
- `assets/fragments.png` — sceau source complet (référence ; ne pas utiliser tel quel en cercle).

## Captures (`screenshots/`)

Rendus des écrans clés (état proposé / APRÈS) extraits du canvas :

1. `01-ecran.png` — **Accueil du monde (ordi)** : en-tête + sceau, carte « à faire maintenant », rangée des 4 brins, parcours réduit, dernier retour replié.
2. `02-ecran.png` — **Accueil du monde (mobile)**.
3. `03-ecran.png` — **Dépôt hebdomadaire — à déposer (ordi)** : zone photo, vignettes, bouton terracotta.
4. `04-ecran.png` — **Retour socratique repensé (ordi)** : notes + « en un mot » + pistes + détail replié.
5. `05-ecran.png` — **Semaines précédentes (ordi)** : archive en lignes repliables.
6. `06-ecran.png` — **Fragment oral — retour (ordi)** : notes, sections, lecteur audio.
7. `07-ecran.png` — **Essai — retour noté (ordi)** : lettres par dimension, détail replié, note /20.
8. `08-ecran.png` — **Synthèse de semestre (ordi)** : sceau déployé, bilan, points forts / axes, note /20.
