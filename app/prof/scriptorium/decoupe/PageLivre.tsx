'use client'

import type { Champ, Cible } from '../NavigateurDecoupe'

export interface Repere { w: number; champ: Champ }

// Une PAGE de livre (présentation pure). Remplace l'ancienne liste de lignes
// défilante (max-h-96) : on voit la page entière, comme un vrai livre. Chaque ligne
// reste cliquable (poserLigne) ; un signet la transforme en titre selon son niveau.
export default function PageLivre({
  lignes, page, totalPages, titreCourant, plein, cible,
  reperes, titres, destructives, onPoser,
}: {
  lignes: string[]
  page: number
  totalPages: number
  titreCourant: string
  plein: boolean
  cible: Cible | null
  reperes: Map<number, Repere[]>            // ln (1-based) → marqueurs de borne posés sur cette ligne
  titres: Map<number, { niveau: number; titre: string }>  // ln → signet (rendu en titre)
  destructives: Set<number>                 // ln hors de toute semaine (re-découpe) → barré
  onPoser: (ln: number) => void
}) {
  const labelCible = (ln: number) =>
    cible
      ? `Placer ${cible.champ === 'debut' ? 'début' : 'fin'} de la semaine ${cible.w + 1} à la ligne ${ln}`
      : `Ligne ${ln}`

  return (
    <div className={`relative mx-auto ${plein ? 'max-w-3xl' : 'max-w-2xl'}`}>
      {/* Effet de pile de feuillets */}
      <div aria-hidden className="absolute inset-0 translate-x-[6px] translate-y-[7px] bg-surface border border-bordure rounded-lg opacity-50" />
      <div aria-hidden className="absolute inset-0 translate-x-[3px] translate-y-[3px] bg-surface border border-bordure rounded-lg opacity-75" />

      <div className="relative bg-surface border border-bordure rounded-lg shadow-sm px-10 sm:px-12 py-8">
        {/* En-tête courant */}
        <div className="mb-5 text-center border-b border-bordure pb-2 min-h-[1.25rem]">
          {titreCourant && (
            <span className="font-marque text-[10px] tracking-[0.22em] text-muet/80 uppercase">{titreCourant}</span>
          )}
        </div>

        {/* Corps de la page */}
        <div className="font-corps">
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
                <span className="w-7 shrink-0 text-right font-ui text-[9px] text-muet/50 pt-1 select-none">{ln}</span>
                <span className="flex-1 min-w-0">
                  {sig ? <TitreSignet niveau={sig.niveau} titre={sig.titre} /> : (
                    <span className={`text-[15px] leading-[1.62] ${destruct ? 'line-through decoration-retard/70 text-retard/80' : 'text-encre'}`}>
                      {txt || ' '}
                    </span>
                  )}
                </span>
                {reps && (
                  <span className="shrink-0 self-center font-ui text-[10px] font-bold text-pigment whitespace-nowrap">
                    {reps.map(r => (r.champ === 'debut' ? `▸ S${r.w + 1} · début` : `S${r.w + 1} · fin ◂`)).join('  ')}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Folio */}
        {totalPages > 1 && (
          <div className="mt-6 text-center font-corps text-sm text-muet/70">· {page} ·</div>
        )}
      </div>
    </div>
  )
}

// Un signet rendu en titre, selon son niveau (0 = partie, 1 = chapitre, ≥2 = sous-titre).
function TitreSignet({ niveau, titre }: { niveau: number; titre: string }) {
  if (niveau <= 0) {
    return (
      <span className="block text-center my-2">
        <span className="block font-titre text-[26px] font-semibold text-encre leading-tight">{titre}</span>
        <span className="block w-12 h-px bg-bordure mx-auto mt-2.5" />
      </span>
    )
  }
  if (niveau === 1) {
    return (
      <span className="block text-center mt-4 mb-1">
        <span className="block font-titre text-xl font-semibold text-encre leading-tight">{titre}</span>
        <span className="block text-muet/50 text-sm mt-0.5">❧</span>
      </span>
    )
  }
  return (
    <span className="block font-titre italic text-[17px] text-encre-douce mt-3 mb-1">{titre}</span>
  )
}
