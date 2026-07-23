# Dossier de handoff — Intégrité (« petits malins »)

Tout le nécessaire pour implémenter la refonte de la page `/prof/integrite` dans le codebase
Next.js / Tailwind de Palimpseste. Structure relative conservée (`./support.js`, `./sceaux/*.png`
à côté des `.dc.html`).

## Contenu
- **`HANDOFF_integrite.md`** — instructions développeur (décisions validées, chantiers, checklist). **À lire en premier.**
- **`Intégrité Rendu Charte.dc.html`** — maquette hi-fi à reproduire (le « quoi »). Ouvrir dans un navigateur.
- **`Intégrité Wireframes.dc.html`** — wireframes low-fi annotés (le « pourquoi » : pistes comparées).
- **`support.js`** — runtime requis par les `.dc.html` (ne pas modifier).
- **`sceaux/`** — assets : `palimpseste_medaillon.png` (logo), `fragments.png`, `aletheia.png`, `codex.png`. À copier dans `public/sceaux/` côté app si absents.

## En bref
La page passe d'une **liste muette** (seul « Vu » possible) à un atelier **file + preuve** :
on clique un signalement → sa **preuve** s'ouvre (photo déposée, y compris vide + retranscription
avec passage problématique surligné + motif/type), puis on agit — **Vu** ou **Confirmer / Écarter**
selon la source, **Bloquer / Débloquer**. La logique métier (strikes, seuil, blocage, dédup) est
**conservée** ; les pièces neuves sont le **résolveur de preuve par module** (`chargerPreuve`),
le composant **`PanneauPreuve`** et l'action de **blocage manuel**.

## Ouvrir les maquettes
Ce sont des Design Components ; ouvrir le fichier `.dc.html` dans un navigateur (il charge
`./support.js` et les images `./sceaux/`). Mode canvas : glisser pour se déplacer, molette/zoom
pour les détails.
