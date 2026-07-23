# Handoff — Scriptorium · Onglet « Parcours »

Dossier prêt pour Claude Code. Tout est relatif : garder la structure telle quelle.

## Contenu
- **`HANDOFF_scriptorium_parcours.md`** — les instructions (architecture concernée, 4 chantiers = 4 écrans, rappels charte, hors-périmètre, checklist). **Commencer par là.**
- **`Scriptorium Parcours - Rendu charte.dc.html`** — cible visuelle hi-fi, fidèle à la charte (les 4 écrans retenus : accueil, parcours, création de plan, plan d'une classe). Ouvrir dans un navigateur.
- **`Scriptorium Parcours - Wireframes.dc.html`** — le « pourquoi » : chaque écran en « réf. actuel » annotée + les pistes explorées (canvas, glisser/zoomer). Les options retenues sont **1f · 2d · 3d · 4e**.
- **`support.js`** — runtime requis par les deux `.dc.html` (chargé en `./support.js`). Ne pas déplacer.
- **`sceaux/`** — `palimpseste_medaillon.png` (marque de l'en-tête) et `pastille-scriptorium.png` (sceau du module, recadré au cercle).

## ⚠️ À retenir pour l'intégration
- **C'est de la présentation, pas de la logique.** On réorganise l'onglet Parcours ; on ne touche pas aux Server Actions (création/assignation de parcours, gabarits de modèle, génération/validation de plan, publication d'horaire). Les composants existants gardent leur comportement.
- **Trois objets, ne pas les confondre** : un **parcours** (orchestration hebdo de contenus) · un **modèle** de plan d'évaluation (gabarit d'année, class-agnostic) · un **plan** (instance d'une classe, née **uniquement** de l'assignation d'un modèle). L'onglet réunit les cinq portes : voir parcours · voir plans par classe · voir modèles · créer parcours · créer plan.
- **Fil couleur des deux familles** (constant sur tout l'onglet) : **Parcours = noyer** `#4A3A28` · **Plans d'évaluation = ocre** `#9A6A2E`. Dans le plan d'une classe, l'enseignement **issu du parcours** est teinté noyer pour relier les deux mondes.
- **En-tête** : les écrans commencent **sous** le nouvel en-tête à deux barres (voir le handoff `handoff_en_tete/`). Ne **pas** remettre de fil d'Ariane ni de bouton retour dans l'en-tête — les retours (« ← Tous les parcours »…) vivent en tête du **contenu**.
- **Boutons estompés** : plus d'aplats francs. Même teinte, désaturée/éclaircie (préférence projet, cf. `CLAUDE.md`) — noyer `#6B5A46`, ocre `#AC8552`, validation `#737F5E`.
- **Ordinateur uniquement** (≥ ~1024 px, non tactile) — pas de rendu mobile.

## Pour visualiser
Ouvrir les `.dc.html` dans un navigateur (double-clic). La structure `./support.js` + `./sceaux/*.png` à côté des fichiers est nécessaire à leur rendu.
