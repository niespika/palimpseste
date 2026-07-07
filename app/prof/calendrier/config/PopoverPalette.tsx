'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PALETTE_CLASSES } from '@/utils/calendrier-couleurs'

// Popover « palette maîtrisée » ancré sous (ou au-dessus de) la pastille couleur.
// Rendu via un portal sur <body> en position:fixed pour échapper au `overflow`
// de la carte (sinon rogné/hors-écran pour les lignes du bas). Bascule vers le
// haut quand la place manque en bas, clamp horizontal. Fermeture voile ou Échap.
const LARGEUR = 284

export default function PopoverPalette({
  anchorEl,
  couleur,
  prises,
  onPick,
  onClose,
}: {
  anchorEl: HTMLElement | null
  couleur: string | null
  prises: Map<string, string[]> // hex minuscule → noms des AUTRES classes qui l'utilisent
  onPick: (hex: string) => void
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    function placer() {
      if (!anchorEl) return
      const r = anchorEl.getBoundingClientRect()
      const h = panelRef.current?.offsetHeight ?? 240
      const marge = 8
      const left = Math.max(8, Math.min(r.left, window.innerWidth - LARGEUR - 8))
      const placeEnBas = window.innerHeight - r.bottom
      const versLeHaut = placeEnBas < h + marge && r.top > h + marge
      const top = versLeHaut ? r.top - h - marge : r.bottom + marge
      setPos({ left, top })
    }
    placer()
    window.addEventListener('scroll', placer, true)
    window.addEventListener('resize', placer)
    return () => {
      window.removeEventListener('scroll', placer, true)
      window.removeEventListener('resize', placer)
    }
  }, [anchorEl])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (typeof document === 'undefined') return null

  const courante = couleur?.toLowerCase() ?? null

  return createPortal(
    <>
      {/* Voile : un clic n'importe où ferme le popover. */}
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Choisir une couleur"
        className="fixed z-50 w-[284px] bg-surface border border-puce rounded-xl p-4"
        style={{
          left: pos?.left ?? -9999,
          top: pos?.top ?? -9999,
          visibility: pos ? 'visible' : 'hidden',
          boxShadow: '0 10px 28px rgba(60,45,25,.22)',
        }}
      >
        <div className="font-ui text-[11px] font-semibold tracking-[0.14em] uppercase text-muet-clair mb-2.5">
          Palette — 12 teintes accordées
        </div>
        <div className="grid grid-cols-6 gap-[7px]">
          {PALETTE_CLASSES.map((hex) => {
            const bas = hex.toLowerCase()
            const selectionnee = courante === bas
            const parAutres = prises.get(bas) ?? []
            const label = parAutres.join(' ')
            return (
              <button
                key={hex}
                type="button"
                onClick={() => onPick(hex)}
                title={parAutres.length ? `Déjà utilisée par ${parAutres.join(', ')}` : hex}
                className="relative h-[26px] rounded-md box-border"
                style={{
                  background: hex,
                  border: selectionnee ? '2px solid #5A4632' : '1px solid rgba(34,28,22,.15)',
                  boxShadow: selectionnee ? '0 0 0 2px #FBF8F1 inset' : 'none',
                }}
              >
                {label && (
                  <span
                    className="absolute inset-0 flex items-center justify-center font-ui font-bold text-[8.5px] text-surface"
                    style={{ textShadow: '0 1px 2px rgba(34,28,22,.35)' }}
                  >
                    {label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="italic text-[12px] text-muet-clair mt-2">
          initiales = teinte déjà prise (reste choisissable)
        </div>
        <div className="border-t border-dashed border-bordure-bouton mt-2.5 pt-2.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-ui text-[13px] font-medium text-muet hover:text-encre"
          >
            ◐ Autre couleur… <span className="text-muet-clair font-normal">(pipette libre)</span>
          </button>
          <input
            ref={inputRef}
            type="color"
            defaultValue={couleur ?? '#7C9CBF'}
            onChange={(e) => onPick(e.target.value)}
            className="sr-only"
            aria-label="Pipette de couleur libre"
          />
        </div>
      </div>
    </>,
    document.body
  )
}
