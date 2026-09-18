# Handoff — Scriptorium · Discussion élève, bureau

Dossier prêt pour Claude Code. Tout est relatif : garder la structure telle quelle.

## Contenu
- **`HANDOFF_scriptorium_discussion_bureau.md`** — les instructions (décisions, 4 chantiers, rappels charte, hors-périmètre, checklist). **Commencer par là.**
- **`Scriptorium Discussion bureau - Rendu charte.dc.html`** — **cible visuelle qui fait foi** (canvas, pan/zoom) : `2a` à l'arrivée (ruban replié) · `2b` tiroir des conversations ouvert, qui **pousse** le fil.
- **`Scriptorium Discussion bureau - Wireframes.dc.html`** — les quatre pistes (`1a`–`1d`), `1d` retenue. Ne fait pas foi.
- **`support.js`** — runtime des `.dc.html`. Ne pas déplacer.
- **`sceaux/`** — `palimpseste_medaillon.png`, `pastille-scriptorium.png`.

## À retenir
- Sur `?vue=discussion` en bureau, **l'en-tête à deux barres n'est pas rendu**. Remplacé par un **ruban de 64 px** : retour Palimpseste (médaillon), sceau Scriptorium (anneau ocre), ＋ nouvelle conversation, ≡ conversations, Plan de cours, classe en bas.
- Le **tiroir des conversations (360 px) pousse le fil**, pas de recouvrement ni de voile. Fermé à l'arrivée.
- Le **fil garde une largeur de lecture** (900 px max, centré) et prend **toute la hauteur** ; seule la correspondance défile, l'écritoire reste en bas.
- Rendu épistolaire existant inchangé ; logique inchangée ; `?vue=plan` et le mobile inchangés.

## Pour visualiser
Ouvrir les `.dc.html` dans un navigateur (double-clic), avec `./support.js` et `./sceaux/*.png` à côté.
