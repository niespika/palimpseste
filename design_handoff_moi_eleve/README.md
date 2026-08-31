# Handoff — « Moi » (élève) · `/eleve/moi`

Dossier prêt pour Claude Code. Tout est relatif : garder la structure telle quelle.

## Contenu
- **`HANDOFF_moi_eleve.md`** — les instructions : existant à lire, structure retenue pour les deux tailles d'écran, **sept garde-fous**, ce qui manque aux données, rappels charte, checklist. **Commencer par là.**
- **`Moi (élève) - Rendu charte.dc.html`** — la cible visuelle : l'écran ordinateur (1040), puis les deux états téléphone (interrupteur des lettres grisé, puis poussé).
- **`Moi (élève) - Wireframes.dc.html`** — le « pourquoi », du plus récent au plus ancien : **tour 4 = `4a` / `4b`, l'option retenue** ; tour 3 = les trois places possibles pour « ta prochaine étape » ; tour 2 = les deux niveaux (tuiles / table) ; tour 1 = les premières découpes. Canvas : glisser / zoomer.
- **`support.js`** — runtime requis par les deux `.dc.html` (chargé en `./support.js`). Ne pas déplacer.
- **`sceaux/`** — `palimpseste_medaillon.png`, la marque de l'en-tête.

## ⚠️ À retenir pour l'intégration
- **C'est de la présentation.** `utils/eleve/profil.ts` (règles pures) et `profil-serveur.ts` (chargeur) ne changent pas. On ré-agence `app/eleve/moi/page.tsx`.
- **Le problème résolu** : les six compétences ne s'empilent plus. Sur ordinateur, une colonne des six à 200 px + le détail en deux colonnes ; sur téléphone, six tuiles qui tiennent dans un viewport 390 × 700, barre tactile comprise.
- **L'explication rejoint le progrès** : « ce qu'on regarde dans ta copie » entre dans la fiche de la compétence — deuxième colonne sur ordinateur, dépliant sur téléphone. La page des six fiches génériques reste en place ; elle n'est plus le seul endroit où l'élève apprend ce qu'on mesure.
- **Un seul changement de comportement**, et il est demandé : l'interrupteur des lettres reste **toujours visible**, **grisé + « Rien à afficher »** quand il ne peut rien lever — au lieu d'être absent comme aujourd'hui (`laBasculeAUnSens`). L'élève n'apprend jamais le nom d'un interrupteur.
- **Le sélecteur de classe sort de la page** : il est déjà dans la chrome (Barre 1 sur ordinateur, bandeau mobile sous 640 px).
- **RR4 tient** : aucun taux, aucun seuil, aucun code d'observable. Le seul nombre est `n` — rendu en jauge de quatre crans, jamais en pourcentage.
- **Deux blocs sont conditionnés aux données** : « les quatre exercices comptés » et le croisement « tous les points regardés × ceux qui sont acquis ». Détail et repli dans le handoff.
- **Boutons estompés** (préférence projet, cf. `CLAUDE.md`) : noyer `#6B5A46`, ocre `#AC8552`, validation `#737F5E` — jamais d'aplat franc.
- **Cibles tactiles ≥ 44 px** partout sur téléphone, interrupteur compris.

## Pour visualiser
Ouvrir les `.dc.html` dans un navigateur (double-clic). La structure `./support.js` +
`./sceaux/*.png` à côté des fichiers est nécessaire à leur rendu.
