// ----------------------------------------------------------------------------
// components/PlumeQuiEcrit.tsx
//
// La marque d'attente de Palimpseste : une plume qui trace un trait d'encre,
// s'efface, recommence. Elle répond à une seule question, celle que l'élève se
// pose quand il tape sur son téléphone : « est-ce que mon doigt a été entendu ? »
//
// LE DESSIN EST CELUI DE LOUIS (gravure fournie le 2026-08-29), pas un vectoriel
// approché. Il entre ici en MASQUE : `public/plume/*.png` ne porte aucune
// couleur, seulement la forme ; c'est le <rect fill="currentColor"> dessous qui
// donne la teinte. D'où le fait qu'une image matricielle écrive quand même à
// l'encre du module — vert bouteille sous [data-module="codex"], bleu sous
// Aletheia. Les fichiers sont fabriqués par `scripts/plume-masques.py`.
//
// Grille 24×24, celle des icônes de nav. Le mouvement vit entièrement dans
// globals.css (§ « Plume qui écrit ») : le bec est à l'origine (0,0) du groupe
// `.plume-hampe`, donc la translation des keyframes le pose sur le trait.
// ----------------------------------------------------------------------------

/** Hauteur de la plume en unités de viewBox, et sa largeur au rapport du dessin
 *  (993 × 1514 après détourage → 0.6559). Le bec est au coin bas-gauche de
 *  l'image : posée en (0, −13), elle a donc son bec pile sur l'origine. */
const PLUME_H = 13
const PLUME_L = 8.53

/** En dessous de ce côté, la gravure devient un fil illisible : on bascule sur
 *  la SILHOUETTE pleine du même dessin, qui tient dans un pictogramme d'onglet.
 *  Même objet, deux graisses — comme n'importe quel système d'icônes. */
const SEUIL_DU_GLYPHE = 40

interface Props {
  /** Côté du carré, en pixels (grille 24). Défaut : 24, comme les icônes. */
  taille?: number
  className?: string
}

export default function PlumeQuiEcrit({ taille = 24, className = '' }: Props) {
  // Taille optique du TRAIT d'encre : son épaisseur est en unités de viewBox,
  // donc elle rétrécit avec la marque. À 24 px le trait devenait plus maigre que
  // les pictogrammes voisins de la barre d'onglets (qui sont à 1,7).
  const encre = Math.min(1.6, Math.max(1, 28 / taille))

  const detaille = taille >= SEUIL_DU_GLYPHE
  const variante = detaille ? 'detail' : 'glyphe'
  // Un identifiant fixe par variante : toutes les instances d'une même variante
  // définissent EXACTEMENT le même masque, donc les doublons sont inoffensifs
  // (et le composant reste rendu côté serveur, sans useId).
  const idMasque = `plume-masque-${variante}`
  const cadre = { x: 0, y: -PLUME_H, width: PLUME_L, height: PLUME_H }

  return (
    <svg
      className={`plume ${className}`}
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* Masque de LUMINANCE (le défaut SVG) : d'où des PNG blancs sur
            transparent — le blanc laisse passer, le vide masque. */}
        <mask id={idMasque} maskUnits="userSpaceOnUse" {...cadre}>
          <image href={`/plume/${variante}.png`} {...cadre} />
        </mask>
      </defs>

      {/* Le trait d'encre. Sa longueur est EXACTEMENT 11.5 unités, valeur reprise
          en `stroke-dasharray` dans globals.css : la changer ici casse le tracé. */}
      {/* 1,25 et pas 1,5 : à 88 px, à côté d'une gravure aussi fine, un trait plus
          épais faisait bâton. La taille optique le rattrape en petit. */}
      <path className="plume-encre" d="M3.5 18H15" strokeWidth={+(1.25 * encre).toFixed(2)} />

      {/* La plume. Son bec est à l'origine (0,0) du groupe : la translation de
          `plume-glisse` pose donc le BEC sur le trait, et la rotation pivote
          autour du bec — pas autour du centre de l'image. */}
      <g className="plume-hampe">
        <rect {...cadre} fill="currentColor" stroke="none" mask={`url(#${idMasque})`} />
      </g>
    </svg>
  )
}
