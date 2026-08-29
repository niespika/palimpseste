// ----------------------------------------------------------------------------
// components/EcranDAttente.tsx
//
// Ce que l'on montre pendant qu'une page se rend côté serveur. Utilisé par tous
// les `loading.tsx` : la coquille du rôle (en-tête, barre d'onglets, sous-nav du
// module) reste en place, seul le contenu laisse place à la plume.
//
// LA PLUME ÉCRIT LE MOT — choix de Louis (29/08), et c'est sa toute première
// image de référence, où la plume écrivait « Palimpseste ». Le mot se dévoile
// sous le bec pendant qu'il avance ; la pointe est posée sur la ligne
// d'écriture, donc le mot SORT de la plume au lieu d'être posé à côté d'elle.
// Le mouvement vit dans globals.css (§ « La plume écrit le mot »).
//
// Pas de squelette gris : un faux contenu qui ne ressemble pas à la vraie page
// est plus déroutant qu'une marque seule. `text-pigment` prend l'encre du module
// quand la frontière est posée sous un [data-module] — la plume d'un écran Codex
// écrit en vert bouteille.
//
// L'apparition est différée d'environ 140 ms (`attente-differee`) : une
// navigation rapide ne doit pas produire un clignotement.
//
// ⚠️ Le mot ne convient qu'ici, où il y a la place. Dans un onglet, voir
// <LibelleSuivi> ; dans un pictogramme, <PlumeQuiEcrit> via <IndiceDeNavigation>.
// ----------------------------------------------------------------------------

interface Props {
  /** Mot écrit par la plume, et lu par les lecteurs d'écran. */
  libelle?: string
}

export default function EcranDAttente({ libelle = 'chargement' }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="attente-differee flex items-center justify-center min-h-[45vh] text-pigment"
    >
      <span className="attente-ecriture" aria-hidden>
        <span className="attente-mot font-titre italic">{libelle}</span>
        <span className="attente-bec" />
      </span>
      <span className="sr-only">{libelle}</span>
    </div>
  )
}
