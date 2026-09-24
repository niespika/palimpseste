# design_handoff_codex_examens_eleve

Handoff design — **Codex · onglet Examens (côté élève)** : le seuil du bi-classe,
l'écran de l'onglet, et les quatre temps de la passation en classe (déposer,
relire, se juger, le retour).

## Contenu

| Fichier | Rôle |
|---|---|
| `HANDOFF_codex_examens_eleve.md` | **À lire en premier** : périmètre, jetons, écran par écran, recette |
| `Codex Examens (élève) - Rendu charte.dc.html` | Les 6 écrans à l'échelle réelle (ordi 1040 + téléphone 390) — référence de couleurs, tailles et libellés |
| `Codex Examens (élève) - Wireframes.dc.html` | Les structures, et la variante d'organisation écartée (`2b`, trois bandes) |
| `sceaux/codex.png` | Sceau du module, utilisé dans l'en-tête |
| `support.js` | Runtime nécessaire pour ouvrir les deux `.dc.html` |

## Ouvrir les maquettes

Les deux fichiers `.dc.html` s'ouvrent directement dans un navigateur, à côté de
`support.js` et du dossier `sceaux/` (garder l'arborescence de ce dossier).

## Périmètre

Présentation uniquement. Aucune Server Action, aucun contrat de données, aucune
règle de doctrine ne change : l'ordre des étapes 5 à 10 du `02-` §6.D, le
`<textarea>` qui préserve le découpage, l'absence de tout chiffre de confiance à
l'écran, l'obligation de lecture sur `lu_at`, les cibles de 44 px.

Deux points touchent au câblage et sont signalés comme **à trancher** dans le
handoff (§9) : les cases à cocher du retour, et le regroupement de « se juger »
avec « comment te sens-tu » sur un seul écran.

Côté professeur (correction, publication du retour) : hors périmètre.
