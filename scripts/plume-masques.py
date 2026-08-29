#!/usr/bin/env python3
"""Fabrique les masques de la plume d'attente à partir du dessin source.

    python3 scripts/plume-masques.py <dessin.png>

Produit `public/plume/detail.png` et `public/plume/glyphe.png`, consommés par
`components/PlumeQuiEcrit.tsx` via un <mask> SVG.

Pourquoi un masque et pas l'image elle-même : un masque ne porte AUCUNE couleur,
seulement la forme. C'est le <rect fill="currentColor"> dessous qui donne la
teinte — la plume écrit donc à l'encre du module (vert bouteille sous Codex,
bleu sous Aletheia) alors que la source est un PNG.

Le dessin source attendu (cf. la spec donnée à l'illustrateur) :
  • la plume SEULE, bec en bas à gauche, pointe en haut à droite ;
  • pas de trait écrit, pas de texte, pas d'ombre portée, pas de cadre ;
  • corps clair, traits sombres — sur fond sombre OU clair, les deux marchent.

⚠️ Le détourage ne peut PAS se faire à la couleur seule quand le fond est noir :
les traits de la gravure sont EXACTEMENT de la même valeur que le fond. On part
donc du corps clair de la plume, qu'on dilate pour ravaler ses propres contours.
"""

import os
import sys

from PIL import Image, ImageChops, ImageFilter

HAUTEUR = 160          # px ; couvre du 3× pour une plume affichée ~53 px de haut
SEUIL_CORPS = 140      # au-dessus : c'est le corps clair de la plume
TEINTE_CORPS = 0.22    # part du corps gardée dans la variante « detail »
SORTIE = "public/plume"


def masques(chemin_source: str) -> None:
    src = Image.open(chemin_source).convert("L")

    corps = src.point(lambda v: 255 if v > SEUIL_CORPS else 0)
    # Deux dilatations pour englober les contours, puis une fermeture pour
    # reboucher les trous laissés entre les barbes.
    region = corps.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.MaxFilter(15))
    region = region.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))

    boite = region.getbbox()
    if boite is None:
        sys.exit("Aucune plume trouvée : le corps du dessin est-il bien clair ?")

    # « detail » : la gravure (traits sombres) + un corps très léger, pour que la
    # plume ait une masse sans noyer les barbes.
    trait = ImageChops.multiply(ImageChops.invert(src), region)
    detail = ImageChops.lighter(trait, region.point(lambda v: int(v * TEINTE_CORPS)))

    os.makedirs(SORTIE, exist_ok=True)
    for canal, nom in ((detail, "detail"), (region, "glyphe")):
        rogne = canal.crop(boite)
        larg = round(rogne.width * HAUTEUR / rogne.height)
        m = rogne.resize((larg, HAUTEUR), Image.LANCZOS)
        # Masque de LUMINANCE côté SVG : on écrit du BLANC sur transparent.
        blanc = Image.new("L", m.size, 255)
        fichier = f"{SORTIE}/{nom}.png"
        Image.merge("RGBA", (blanc, blanc, blanc, m)).save(fichier, optimize=True)
        print(f"{fichier} : {larg}×{HAUTEUR}, {os.path.getsize(fichier) // 1024} Ko")

    larg_boite, haut_boite = boite[2] - boite[0], boite[3] - boite[1]
    rapport = larg_boite / haut_boite
    print(
        f"\nboîte détourée : {larg_boite}×{haut_boite} (rapport {rapport:.4f})\n"
        f"⚠️ Reporter dans PlumeQuiEcrit.tsx : PLUME_L = {13 * rapport:.2f} "
        f"(pour PLUME_H = 13). Un rapport faux étire le dessin."
    )


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    masques(sys.argv[1])
