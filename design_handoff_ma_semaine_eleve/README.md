# Handoff — « Ma semaine » (élève) · `/eleve/semaine`

Dossier prêt pour Claude Code. Tout est relatif : garder la structure telle quelle.

## Contenu
- **`HANDOFF_ma_semaine_eleve.md`** — les instructions : existant à lire, structure retenue pour les trois tailles d'écran, **six garde-fous**, ce qui manque aux données, rappels charte, checklist. **Commencer par là.**
- **`Ma semaine (élève) - Rendu charte.dc.html`** — la cible visuelle : ordinateur/tablette en vue Travail, en vue Bilan, puis les deux vues sur téléphone.
- **`Ma semaine (élève) - Wireframes.dc.html`** — le « pourquoi » : quatre structures comparées (`1a`–`1d`), puis `2a`, puis **`3a` = l'option retenue**. Canvas : glisser/zoomer.
- **`support.js`** — runtime requis par les deux `.dc.html` (chargé en `./support.js`). Ne pas déplacer.
- **`sceaux/`** — `palimpseste_medaillon.png` (marque de l'en-tête), `fragments.png` et `codex.png` (sceaux des modules montrés dans les pastilles).

## ⚠️ À retenir pour l'intégration
- **C'est de la présentation.** `utils/eleve/semaine.ts` (règles pures), `semaine-serveur.ts` (chargeur) et `OffreDEnFairePlus.tsx` ne changent pas. On ré-agence `app/eleve/semaine/page.tsx`.
- **Le segment Travail / Bilan n'est pas une navigation libre** : `momentDeLaSemaine()` commande. Hors du moment `bilan`, l'onglet Bilan est inerte — l'ouvrir pendant la semaine donnerait à l'élève la réponse à la phase « se juger ».
- **Trois points d'attention repris dans la maquette** : plus de durée par exercice, plus de minutes de quota (l'offre porte la phrase de `offreDEnFairePlus()` / `phraseDuRefus()`, avec bouton seulement quand elle s'ouvre), et l'onglet Bilan estompé hors du moment `bilan`. Raisons dans le handoff.
- **Les compétences non mesurées** (lignes grisées du bilan) demandent un référentiel que `bilan[]` ne porte pas ; si l'obtenir coûte une lecture de doctrine, ne pas les rendre. Le 6ᵉ nom de compétence de la maquette (« Lecture ») est un **placeholder à confirmer**.
- **Boutons estompés** (préférence projet, cf. `CLAUDE.md`) : noyer `#6B5A46`, ocre `#AC8552`, validation `#737F5E` — jamais d'aplat franc.
- **Trois écrans** : téléphone, tablette (portrait = une colonne, paysage = comme l'ordinateur), ordinateur. Cibles tactiles ≥ 44 px.

## Pour visualiser
Ouvrir les `.dc.html` dans un navigateur (double-clic). La structure `./support.js` +
`./sceaux/*.png` à côté des fichiers est nécessaire à leur rendu.
