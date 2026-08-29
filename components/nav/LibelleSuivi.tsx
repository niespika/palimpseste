'use client'

// ----------------------------------------------------------------------------
// components/nav/LibelleSuivi.tsx
//
// Le libellé d'un onglet ou d'une bascule, qui laisse place à la plume pendant
// que la vue se charge.
//
// POURQUOI CE COMPOSANT EXISTE — un défaut trouvé par Louis en production :
// taper « Compétences » sur la fiche d'une classe ne produisait AUCUN signal.
// Deux raisons qui se cumulent, et aucune n'était couverte :
//   1. `useLinkStatus` n'existe que sous un <Link> ; un onglet qui n'a pas
//      d'indice à l'intérieur n'accuse rien.
//   2. passer de `?vue=activite` à `?vue=competences` reste LE MÊME segment de
//      route : Next ne remonte pas le segment, donc le `loading.tsx` ne se
//      déclenche pas non plus. Il ne restait rien du tout.
//
// À poser comme enfant d'un <Link> qui a `relative` — la plume se superpose au
// libellé (`absolute inset-0`), donc l'onglet ne change pas de taille et rien ne
// saute à l'écran.
//
// Le libellé s'efface sur la MÊME horloge que la plume paraît (~140 ms) : en
// dessous, ni l'un ni l'autre n'a bougé, et une navigation rapide ne fait pas
// clignoter l'onglet.
// ----------------------------------------------------------------------------

import { useLinkStatus } from 'next/link'
import PlumeQuiEcrit from '@/components/PlumeQuiEcrit'

interface Props {
  children: React.ReactNode
  /** Côté de la plume. Défaut 20 : un onglet fait au moins 44 px de haut. */
  taille?: number
}

export default function LibelleSuivi({ children, taille = 20 }: Props) {
  const { pending } = useLinkStatus()

  return (
    <>
      <span className={pending ? 'libelle-efface' : undefined}>{children}</span>
      <span
        aria-hidden
        className={`indice-nav absolute inset-0 inline-flex items-center justify-center ${
          pending ? 'est-en-attente' : ''
        }`}
      >
        <PlumeQuiEcrit taille={taille} />
      </span>
    </>
  )
}
