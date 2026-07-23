# Handoff — Scriptorium · Découper un livre

Dossier prêt pour Claude Code. Tout est relatif : garder la structure telle quelle.

## Contenu
- **`HANDOFF_decoupe_scriptorium.md`** — les instructions (architecture concernée, 6 chantiers, rappels charte, hors-périmètre, checklist). **Commencer par là.**
- **`Scriptorium Découpe Rendu Charte.dc.html`** — cible visuelle hi-fi (création livre + frise, mode plein cadre, re-découpe destructive, signets → titres). Ouvrir dans un navigateur.
- **`Scriptorium Découpe Wireframes.dc.html`** — le « pourquoi » : écran actuel annoté des 3 problèmes, deux directions comparées, re-découpe, bonus signets.
- **`support.js`** — runtime requis par les deux `.dc.html` (chargé en `./support.js`). Ne pas déplacer.
- **`sceaux/`** — `palimpseste_medaillon.png`, seul sceau utilisé (logo d'en-tête de la maquette charte).

## ⚠️ À retenir pour l'intégration
- **C'est de la présentation, pas de la logique.** Le composant central `NavigateurDecoupe.tsx` garde `poserLigne`, `prochaineBorne`, `estValide`, `messages`, les champs cachés `decoupe_N_*` et `onEtat`. Le geste reste **cliquer une ligne** pour poser début/fin.
- **Écran partagé** : `DecoupePdf.tsx` (création, à partir d'un PDF) **et** `EditeurLivre.tsx` (re-découpe d'un livre existant) montent le même navigateur. Les 6 chantiers valent pour les deux.
- **Signets = métadonnée déjà en main.** `extraireSignets` (`actions.ts`) les extrait à l'import (`{ titre, niveau, page }`, **`niveau` indexé à 0**) et les parque sur `scriptorium_unites.signets`. On les **branche** sur la mise en page (titre/sous-titre selon le niveau) — repli propre si absents.
- **Le rouge est réservé au destructif** (lignes hors-semaine en re-découpe). Les marqueurs de semaine restent en **pigment noyer** (`data-module="scriptorium"` → `#4A3A28`), pas en vert/rouge.
- **Scriptorium n'a pas de sceau** dans les assets : pastille de couleur / vignette livre en attendant. `palimpseste_medaillon.png` doit être dans `public/sceaux/` du projet Next (déjà introduit par un handoff précédent).
- **Ordinateur uniquement** — pas de rendu mobile.

## Pour visualiser
Ouvrir les `.dc.html` dans un navigateur (double-clic). La structure `./support.js` + `./sceaux/*.png` à côté des fichiers est nécessaire à leur rendu.
