'use client'

import { useState, type ReactNode } from 'react'

// Un TIROIR replié sur sa ligne d'état (13/09). Pas de <details> natif : Chrome restaure
// l'état `open` d'un <details> basculé par l'utilisateur au rechargement, et React crie à
// l'hydratation (mémoire du 30/08). Ici un bouton + un état client, rien à restaurer.
export default function Tiroir({ titre, etat, ouvertParDefaut = false, children }: {
  titre: string
  etat?: ReactNode
  ouvertParDefaut?: boolean
  children: ReactNode
}) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut)
  return (
    <div className="rounded-lg border border-bordure bg-surface">
      <button
        type="button"
        onClick={() => setOuvert(o => !o)}
        aria-expanded={ouvert}
        className="w-full text-left px-3 py-2 min-h-[44px] sm:min-h-0 flex items-center gap-2 flex-wrap font-ui text-sm"
      >
        <span
          aria-hidden
          className={`inline-block w-0 h-0 border-y-4 border-y-transparent border-l-[5px] border-l-muet transition-transform ${ouvert ? 'rotate-90' : ''}`}
        />
        <span className="font-semibold text-encre">{titre}</span>
        {etat}
      </button>
      {ouvert && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}
