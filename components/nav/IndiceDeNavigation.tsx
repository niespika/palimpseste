'use client'

// ----------------------------------------------------------------------------
// components/nav/IndiceDeNavigation.tsx
//
// L'accusé de réception du CLIC, avant même que la page d'attente existe.
//
// Pourquoi les deux : un `loading.tsx` ne s'affiche instantanément que si sa
// coquille a été préchargée. Sur la 4G d'une salle de classe, le préchargement
// n'a souvent pas eu le temps de finir — il reste alors une fenêtre où l'ancien
// écran est encore là, intact. `useLinkStatus` couvre exactement cette fenêtre :
// c'est l'élément TAPÉ qui accuse réception, ce qui est le signal le plus lisible
// (« celui-là, je t'ai entendu »).
//
// Contraintes (doc Next, `use-link-status`) :
//   • le hook DOIT être appelé dans un descendant d'un <Link> ;
//   • l'indice est toujours monté et de taille fixe — on ne bascule que la
//     visibilité, jamais la mise en page (sinon l'écran saute au moment précis
//     où l'élève attend qu'il se stabilise).
// ----------------------------------------------------------------------------

import { useLinkStatus } from 'next/link'
import PlumeQuiEcrit from '@/components/PlumeQuiEcrit'

interface Props {
  /** Côté de la plume en pixels. Défaut : 20. */
  taille?: number
  /** Positionnement fourni par l'appelant (souvent `absolute inset-0 …`). */
  className?: string
}

export default function IndiceDeNavigation({ taille = 20, className = '' }: Props) {
  const { pending } = useLinkStatus()

  return (
    <span
      aria-hidden
      className={`indice-nav inline-flex items-center justify-center ${pending ? 'est-en-attente' : ''} ${className}`}
    >
      <PlumeQuiEcrit taille={taille} />
    </span>
  )
}
