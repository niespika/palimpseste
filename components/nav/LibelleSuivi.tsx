'use client'

// ----------------------------------------------------------------------------
// components/nav/LibelleSuivi.tsx
//
// Le libellé d'un onglet ou d'une bascule, qui laisse place au mot
// « Chargement… » pendant que la vue se charge.
//
// POURQUOI PAS LA PLUME ICI — Louis l'a vue en production dans la bascule
// Activité/Compétences : à 20 px de haut dans un segment large, la plume se
// réduit à un pâté sombre. Elle a besoin d'espace pour se lire ; un onglet ne
// lui en donne pas. Le MOT, lui, se lit à toutes les tailles et dit exactement
// la même chose. La plume reste pour l'écran d'attente, où elle a la place.
//
// POURQUOI CE COMPOSANT EXISTE — taper « Compétences » ne produisait aucun
// signal. Deux raisons qui se cumulaient :
//   1. `useLinkStatus` n'existe que sous un <Link> ; un onglet sans indice à
//      l'intérieur n'accuse rien.
//   2. passer de `?vue=activite` à `?vue=competences` reste LE MÊME segment de
//      route : Next ne remonte pas le segment.
// ⚠️ `useLinkStatus` ne passe JAMAIS à `pending` sur un lien déjà préchargé —
//    c'est documenté, et ça rend une reproduction locale trompeuse. Pour
//    l'éprouver : `prefetch={false}` temporaire sur le lien.
//
// À poser comme enfant d'un <Link> qui a `relative` : le mot se superpose au
// libellé (`absolute inset-0`), donc l'onglet ne change pas de taille.
//
// Le libellé s'efface sur la MÊME horloge que le mot paraît (~140 ms) : en
// dessous, ni l'un ni l'autre n'a bougé, et une navigation rapide ne fait pas
// clignoter l'onglet.
// ----------------------------------------------------------------------------

import { useLinkStatus } from 'next/link'

interface Props {
  children: React.ReactNode
  /** Mot affiché pendant l'attente. */
  mention?: string
}

export default function LibelleSuivi({ children, mention = 'Chargement…' }: Props) {
  const { pending } = useLinkStatus()

  return (
    <>
      <span className={pending ? 'libelle-efface' : undefined}>{children}</span>
      <span
        aria-hidden
        className={`indice-nav absolute inset-0 inline-flex items-center justify-center font-titre italic ${
          pending ? 'est-en-attente' : ''
        }`}
      >
        {mention}
      </span>
    </>
  )
}
