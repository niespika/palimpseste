'use client'

import { useEffect, useRef } from 'react'

// Conteneur responsive partagé : feuille (bottom-sheet) sur mobile, dialog centré
// sur desktop. Même langage que la feuille de BarreOngletsMobileProf (overlay
// bg-encre/30, poignée, rounded-t-2xl). Réutilisé par AccesModules / GestionEleves.
// A11y : fermeture au clavier (Échap), focus initial dans le panneau, focus rendu
// à l'élément déclencheur à la fermeture.

interface Props {
  titre: string
  sousTitre?: string
  onFermer: () => void
  children: React.ReactNode
}

export default function FeuillePanneau({ titre, sousTitre, onFermer, children }: Props) {
  const paneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer() }
    document.addEventListener('keydown', onKey)
    paneRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      precedent?.focus?.()
    }
  }, [onFermer])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={titre}
      onClick={onFermer}
    >
      <div className="absolute inset-0 bg-encre/30" />
      <div
        ref={paneRef}
        tabIndex={-1}
        className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-surface border-t sm:border border-bordure rounded-t-2xl sm:rounded-2xl shadow-lg pb-[env(safe-area-inset-bottom)] focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-bordure" aria-hidden />
        </div>
        <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-2">
          <div>
            <h3 className="font-titre text-xl text-encre leading-tight">{titre}</h3>
            {sousTitre && <p className="font-ui text-xs text-muet mt-0.5">{sousTitre}</p>}
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="font-ui text-muet hover:text-encre text-lg leading-none p-2 -m-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
          >
            ✕
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  )
}
