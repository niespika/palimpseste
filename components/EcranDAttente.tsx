// ----------------------------------------------------------------------------
// components/EcranDAttente.tsx
//
// Ce que l'on montre pendant qu'une page se rend côté serveur. Utilisé par tous
// les `loading.tsx` : la coquille du rôle (en-tête, barre d'onglets, sous-nav du
// module) reste en place, seul le contenu laisse place à la plume.
//
// Pas de squelette gris : un faux contenu qui ne ressemble pas à la vraie page
// est plus déroutant qu'une plume seule, et le parchemin de la charte s'y prête
// mal. `text-pigment` prend l'encre du module quand la frontière est posée sous
// un [data-module] — la plume d'un écran Codex écrit en vert bouteille.
//
// L'apparition est différée d'environ 140 ms (`attente-differee`) : une
// navigation rapide ne doit pas produire un clignotement.
// ----------------------------------------------------------------------------

import PlumeQuiEcrit from './PlumeQuiEcrit'

interface Props {
  /** Texte lu par les lecteurs d'écran (jamais affiché). */
  libelle?: string
}

export default function EcranDAttente({ libelle = 'Chargement en cours' }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="attente-differee flex items-center justify-center min-h-[45vh] text-pigment"
    >
      {/* 88 et pas 44 : photographié en situation, une marque de 44 px se perdait
          dans les ~360 px de vide laissés par le contenu — et la gravure a besoin
          de place pour que ses barbes se lisent (la plume occupe 13 des 24 unités
          du carré, donc ~48 px de haut ici). */}
      <PlumeQuiEcrit taille={88} />
      <span className="sr-only">{libelle}</span>
    </div>
  )
}
