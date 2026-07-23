# Handoff — Aletheia · fiche élève (côté prof)

Réorganisation de `app/prof/aletheia/eleve/[eleveId]/page.tsx` pour les élèves **multi-livres**
(bi-classe). On ne change que l'**agencement** : un seul graphe, livres repliés par classe, détail
en maître-détail (jamais empilé).

## Contenu du dossier
- **`HANDOFF_aletheia_fiche_eleve_prof.md`** — les instructions. **À lire en premier.**
- **`Aletheia Fiche élève prof Rendu Charte.dc.html`** — la **cible visuelle** (ordi + mobile).
- **`Aletheia Fiche élève prof Wireframes.dc.html`** — le raisonnement (problème + 3 pistes). Optionnel.
- **`support.js`** — runtime des maquettes `.dc.html` (à garder **à côté** des `.dc.html`).
- **`sceaux/aletheia.png`, `sceaux/palimpseste_medaillon.png`** — sceaux utilisés par la maquette.

## Ouvrir les maquettes
Ouvre un `.dc.html` directement dans un navigateur — les chemins `./support.js` et `./sceaux/*.png`
sont relatifs et fournis à côté. Mode canvas : **glisser** pour se déplacer, **zoom** pour les détails.

## En une phrase
Un seul **graphe** (une couleur par livre — outremer d'abord, or ensuite ; bascule Thèse/Arguments) ·
**livres repliés** par classe (T1, THLP) · **détail** d'une semaine en maître-détail, **hiérarchisé** :
diagnostic prof-only → avant/après V1→VF → retours IA & saisie repliés. Pastilles d'avancement et ✓
**en pigment, jamais en vert**.
