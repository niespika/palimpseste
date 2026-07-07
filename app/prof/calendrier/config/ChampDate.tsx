'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Champ de date à calendrier PERSONNALISÉ (le sélecteur natif <input type="date">
// suit la locale du navigateur/OS, pas le lang de la page → initiales anglaises /
// semaine commençant le dimanche). Ici : locale FR forcée, en-tête L M M J V S D,
// semaine lundi→dimanche. Émet une valeur YYYY-MM-DD via un <input hidden name=…>
// pour rester compatible avec les formulaires FormData existants. Dates pures
// manipulées en UTC (aucune dérive de fuseau).
const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const fmtFr = (v: string) => {
  const d = new Date(v + 'T00:00:00Z')
  return `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
const LARGEUR = 268

export default function ChampDate({
  name,
  defaultValue = '',
  ariaLabel,
}: {
  name: string
  defaultValue?: string
  ariaLabel?: string
}) {
  const [value, setValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [ym, setYm] = useState(() => {
    if (defaultValue) {
      const d = new Date(defaultValue + 'T00:00:00Z')
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() }
    }
    const t = new Date()
    return { y: t.getFullYear(), m: t.getMonth() }
  })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    function placer() {
      const el = btnRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const h = panelRef.current?.offsetHeight ?? 300
      const marge = 6
      const left = Math.max(8, Math.min(r.left, window.innerWidth - LARGEUR - 8))
      const versLeHaut = window.innerHeight - r.bottom < h + marge && r.top > h + marge
      setPos({ left, top: versLeHaut ? r.top - h - marge : r.bottom + marge })
    }
    placer()
    window.addEventListener('scroll', placer, true)
    window.addEventListener('resize', placer)
    return () => {
      window.removeEventListener('scroll', placer, true)
      window.removeEventListener('resize', placer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function ouvrir() {
    // Recale le mois visible sur la valeur courante à chaque ouverture.
    if (value) {
      const d = new Date(value + 'T00:00:00Z')
      setYm({ y: d.getUTCFullYear(), m: d.getUTCMonth() })
    }
    setPos(null)
    setOpen(true)
  }

  function choisir(d: number) {
    setValue(iso(ym.y, ym.m, d))
    setOpen(false)
  }

  const prev = () => setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))
  const next = () => setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))

  // Grille du mois visible, lundi→dimanche.
  const startCol = (new Date(Date.UTC(ym.y, ym.m, 1)).getUTCDay() + 6) % 7
  const nDays = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startCol; i++) cells.push(null)
  for (let d = 1; d <= nDays; d++) cells.push(d)

  return (
    <>
      <input type="hidden" name={name} value={value} readOnly />
      <button
        ref={btnRef}
        type="button"
        onClick={ouvrir}
        aria-label={ariaLabel}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-bordure rounded-lg text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-pigment"
      >
        <span className={value ? 'text-encre' : 'text-muet-clair'}>
          {value ? fmtFr(value) : 'Choisir une date'}
        </span>
        <span className="text-muet-clair text-xs">▾</span>
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Choisir une date"
              className="fixed z-50 bg-surface border border-puce rounded-xl p-3"
              style={{
                left: pos?.left ?? -9999,
                top: pos?.top ?? -9999,
                width: LARGEUR,
                visibility: pos ? 'visible' : 'hidden',
                boxShadow: '0 10px 28px rgba(60,45,25,.22)',
              }}
            >
              {/* En-tête : mois + navigation */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Mois précédent"
                  className="w-7 h-7 rounded-md text-encre-douce hover:bg-parchemin-fonce flex items-center justify-center"
                >
                  ‹
                </button>
                <span className="text-sm font-semibold text-encre">
                  {MOIS[ym.m]} {ym.y}
                </span>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Mois suivant"
                  className="w-7 h-7 rounded-md text-encre-douce hover:bg-parchemin-fonce flex items-center justify-center"
                >
                  ›
                </button>
              </div>

              {/* En-tête des jours (lundi→dimanche) */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {JOURS.map((j, k) => (
                  <span
                    key={k}
                    className="h-6 flex items-center justify-center font-ui text-[11px] font-semibold text-muet-clair"
                  >
                    {j}
                  </span>
                ))}
              </div>

              {/* Grille des jours */}
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((d, k) => {
                  if (d === null) return <span key={k} className="h-8" />
                  const v = iso(ym.y, ym.m, d)
                  const sel = v === value
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => choisir(d)}
                      className={`h-8 rounded-md text-[13px] flex items-center justify-center transition-colors ${
                        sel
                          ? 'bg-bouton text-surface font-semibold'
                          : 'text-encre hover:bg-parchemin-fonce'
                      }`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  )
}
