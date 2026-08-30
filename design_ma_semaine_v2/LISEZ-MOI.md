# « Ma semaine » (élève) — les organisations comparées

Sources du canevas de design publié pour arbitrer l'organisation de
`app/eleve/semaine/page.tsx`. **La page publiée n'est pas versionnée** : elle est
régénérée depuis ces sources et embarque l'éditeur (2,6 Mo). Voir `.gitignore`.

## Pourquoi ce dossier existe

Le premier handoff (`design_handoff_ma_semaine_eleve/`, option `3a`) avait été
dessiné sur des données qui n'existent pas — « Commentaire — Rousseau, *Émile* »,
31 caractères. Or **le « titre » d'un exercice est la première ligne de sa
consigne** (`titreDeLaConsigne`) : médiane **129 caractères**, p90 179, max 298,
et 41 titres sur 452 seulement tiennent en 60. Le récapitulatif, lui, porte cinq
compétences et leurs 51 dimensions. L'implémentation fidèle à `3a` empilait donc
encore, et le rail était plus haut que le travail.

⭐ **La leçon, avant de redessiner cet écran : mesurer la longueur réelle des
champs affichés.** Tout ce dossier est dessiné sur le texte réel d'un élève de
la base bac à sable.

## Les artboards

| Fichier | Ce que c'est |
| --- | --- |
| `Main.dc.html` | **C — retenu**, ordinateur, vue Travail |
| `Bilan.dc.html` | C, ordinateur, vue Bilan |
| `Tablette.dc.html` | C, tablette portrait |
| `Telephone.dc.html` | C, téléphone, vue Travail |
| `BilanTelephone.dc.html` | C, téléphone, vue Bilan |
| `OptionA.dc.html` | A · le prochain en grand *(écartée)* |
| `OptionB.dc.html` | B · grille de cartes *(écartée)* |
| `OptionC.dc.html` | C · esquisse d'origine, avant le téléphone et le Bilan |
| `OptionD.dc.html` | D · colonne unique *(écartée)* |

`canvas.json` porte la mise en page du canevas et ses deux pages
(« C — retenu » / « Écartées »).

## Régénérer

Les cinq artboards de `C` sont **produits par `_build.py`** (avec `_style.txt` et
`_fonts.txt`) : éditer le script, pas les `.dc.html`, sans quoi la prochaine
génération écrase l'édition. Les quatre `Option*.dc.html` sont écrites à la main.

```
python3 _build.py     # réécrit Main, Bilan, Tablette, Telephone, BilanTelephone
```

Puis, depuis ce dossier, le canevas se réassemble avec `seed-canvas.mjs` du skill
`design` (`--template payload.template.html`, un `--artboard` par fichier,
`--image codex.png`, `--canvas canvas.json`) et se republie à la même URL.
