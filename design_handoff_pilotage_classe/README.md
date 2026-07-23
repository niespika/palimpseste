# Handoff — Pilotage Classe

Dossier prêt pour Claude Code. Tout est relatif : garder la structure telle quelle.

## Contenu
- **`HANDOFF_pilotage_classe.md`** — les instructions (6 chantiers, rappels charte, responsive, checklist). **Commencer par là.**
- **`Pilotage Classe Rendu Charte.dc.html`** — cible visuelle hi-fi (Activité + Compétences + accès modules, ordi & mobile). Ouvrir dans un navigateur.
- **`Pilotage Classe Wireframes.dc.html`** — le « pourquoi » : liaison carte→section, matrice, bulles, toggle, accès, mobile — annotés.
- **`support.js`** — runtime requis par les deux `.dc.html` (chargé en `./support.js`). Ne pas déplacer.
- **`sceaux/`** — sceaux utilisés par la maquette charte.

## ⚠️ À retenir pour l'intégration
- **La vue Compétences est un placeholder volontaire** : le toggle doit exister et être cliquable, mais la grille Compétences reste « en construction » (pas de données ni de calcul). Voir **Chantier 4** — prévoir les points d'extension (`// TODO compétences`, `PastilleNiveau`) sans figer la mise en page.
- **`sceaux/palimpseste_medaillon.png`** (logo en pastille, sceau sans le mot) doit être dans `public/sceaux/` du projet Next — déjà introduit par le handoff précédent. Les sceaux `aletheia/codex/fragments/quazian.png` sont déjà dans le codebase ; ils ne sont ici que pour le rendu de la maquette.
- **Scriptorium n'a pas de sceau** dans les assets : utiliser la pastille de couleur seule (jeton pigment `scriptorium`) en attendant.

## Pour visualiser
Ouvrir les `.dc.html` dans un navigateur (double-clic). La structure `./support.js` + `./sceaux/*.png` à côté des fichiers est nécessaire à leur rendu.
