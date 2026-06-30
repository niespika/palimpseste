'use client'

import { useEffect, useRef, useState } from 'react'
import type { Champ, Cible } from '../NavigateurDecoupe'

export interface Repere { w: number; champ: Champ }

// Une PAGE de livre (présentation pure). Le corps de la page défile EN INTERNE (la
// frise et la barre restent figées) et sa hauteur s'ajuste à la fenêtre ; la taille du
// texte (`taille`) est pilotée par le prof (A− / A+). En-tête courant et folio restent
// toujours visibles. Tailles internes en `em` → tout se met à l'échelle avec `taille`.
export default function PageLivre({
  lignes, page, totalPages, titreCourant, plein, taille, cible,
  reperes, titres, destructives, onPoser,
}: {
  lignes: string[]
  page: number
  totalPages: number
  titreCourant: string
  plein: boolean
  taille: number
  cible: Cible | null
  reperes: Map<number, Repere[]>            // ln (1-based) → marqueurs de borne posés sur cette ligne
  titres: Map<number, { niveau: number; titre: string }>  // ln → signet (rendu en titre)
  destructives: Set<number>                 // ln hors de toute semaine (re-découpe) → barré
  onPoser: (ln: number) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [maxH, setMaxH] = useState<number | undefined>(undefined)

  // Hauteur du feuillet = fenêtre − haut de la page − réserve (guide bas en plein cadre).
  // Au-delà, le corps défile en interne. Recalcul au redimensionnement / changement de mode.
  useEffect(() => {
    const calc = () => {
      const el = wrapRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      const reserve = plein ? 150 : 32
      setMaxH(Math.max(260, window.innerHeight - top - reserve))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [plein, page])

  const labelCible = (ln: number) =>
    cible
      ? `Placer ${cible.champ === 'debut' ? 'début' : 'fin'} de la semaine ${cible.w + 1} à la ligne ${ln}`
      : `Ligne ${ln}`

  return (
    <div ref={wrapRef} className={`relative mx-auto ${plein ? 'max-w-3xl' : 'max-w-2xl'}`}>
      {/* Effet de pile de feuillets */}
      <div aria-hidden className="absolute inset-0 translate-x-[6px] translate-y-[7px] bg-parchemin border border-bordure rounded-lg opacity-50" />
      <div aria-hidden className="absolute inset-0 translate-x-[3px] translate-y-[3px] bg-parchemin border border-bordure rounded-lg opacity-75" />

      <div className="relative flex flex-col bg-parchemin border border-bordure rounded-lg shadow-sm" style={{ maxHeight: maxH }}>
        {/* En-tête courant (fixe) */}
        <div className="shrink-0 px-8 sm:px-10 pt-6 pb-2 text-center border-b border-bordure min-h-[1.25rem]">
          {titreCourant && (
            <span className="font-marque text-[10px] tracking-[0.22em] text-muet/80 uppercase">{titreCourant}</span>
          )}
        </div>

        {/* Corps de la page (défile en interne) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-8 sm:px-10 py-4 font-corps" style={{ fontSize: `${taille}px` }}>
          {lignes.length === 0 && <p className="text-sm text-muet text-center py-6">Page vide.</p>}
          {lignes.map((txt, idx) => {
            const ln = idx + 1
            const sig = titres.get(ln)
            const reps = reperes.get(ln)
            const destruct = destructives.has(ln)
            return (
              <button
                type="button"
                key={ln}
                onClick={() => onPoser(ln)}
                aria-label={labelCible(ln)}
                className={`group w-full text-left flex gap-3 items-baseline rounded px-1 -mx-1 transition-colors hover:bg-pigment-teinte ${reps ? 'bg-pigment-teinte/70' : ''}`}
              >
                <span className="w-7 shrink-0 text-right font-ui text-[0.7em] text-muet/50 pt-1 select-none">{ln}</span>
                <span className="flex-1 min-w-0">
                  {sig ? <TitreSignet niveau={sig.niveau} titre={sig.titre} /> : (
                    <span className={`leading-[1.5] ${destruct ? 'line-through decoration-retard/70 text-retard/80' : 'text-encre'}`}>
                      {txt || ' '}
                    </span>
                  )}
                </span>
                {reps && (
                  <span className="shrink-0 self-center font-ui text-[0.78em] font-bold text-pigment whitespace-nowrap">
                    {reps.map(r => (r.champ === 'debut' ? `▸ S${r.w + 1} · début` : `S${r.w + 1} · fin ◂`)).join('  ')}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Folio (fixe) */}
        {totalPages > 1 && (
          <div className="shrink-0 px-8 py-2.5 text-center font-corps text-sm text-muet/70 border-t border-bordure">· {page} ·</div>
        )}
      </div>
    </div>
  )
}

// Un signet rendu en titre, selon son niveau (0 = partie, 1 = chapitre, ≥2 = sous-titre).
// Tailles en `em` → suivent la taille de texte choisie par le prof.
function TitreSignet({ niveau, titre }: { niveau: number; titre: string }) {
  if (niveau <= 0) {
    return (
      <span className="block text-center my-1.5">
        <span className="block font-titre text-[1.7em] font-semibold text-encre leading-tight">{titre}</span>
        <span className="block w-10 h-px bg-bordure mx-auto mt-2" />
      </span>
    )
  }
  if (niveau === 1) {
    return (
      <span className="block text-center mt-3 mb-1">
        <span className="block font-titre text-[1.4em] font-semibold text-encre leading-tight">{titre}</span>
        <span className="block text-muet/50 text-[0.85em] mt-0.5">❧</span>
      </span>
    )
  }
  return (
    <span className="block font-titre italic text-[1.15em] text-encre-douce mt-2.5 mb-0.5">{titre}</span>
  )
}
