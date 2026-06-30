'use client'

import { initialesLivre } from '../decoupe-utils'

const btnCls = 'font-ui text-xs text-encre-douce border border-bordure rounded-lg px-3 py-1.5 bg-surface hover:bg-pigment-teinte/50 transition-colors whitespace-nowrap'

// Barre fine en tête de la zone de découpe (présentation pure). Remplace l'encart
// d'import qui repoussait le contenu : méta du livre sur une ligne + navigation page
// + bascule de la frise. Variante création (upload réduit) / re-découpe (sans upload).
export default function BarreInfos({
  mode, titre, auteur, nbPages, nbSignets, texteSelectionnable = false,
  sousTitre, page, totalPages, onPage, friseVisible, onToggleFrise, taille, onTaille, onRemplacer,
}: {
  mode: 'creation' | 'modification'
  titre: string
  auteur?: string | null
  nbPages: number
  nbSignets: number
  texteSelectionnable?: boolean
  sousTitre?: string                 // override (re-découpe) ; sinon construit en création
  page: number
  totalPages: number
  onPage: (p: number) => void
  friseVisible: boolean
  onToggleFrise: () => void
  taille?: number                    // taille du texte de la page (px)
  onTaille?: (delta: number) => void
  onRemplacer?: () => void
}) {
  const initiales = initialesLivre(titre)
  return (
    <div className="flex items-center gap-3 bg-surface border border-bordure rounded-xl px-4 py-2.5">
      {/* Vignette = initiales du titre */}
      <span className="shrink-0 w-9 h-11 rounded-sm bg-pigment shadow-sm flex items-center justify-center">
        <span className="font-marque text-[10px] font-semibold tracking-wide text-pigment-teinte">{initiales}</span>
      </span>

      <div className="min-w-0">
        <div className="font-titre text-lg font-semibold text-encre leading-tight truncate">{titre || 'Sans titre'}</div>
        <div className="font-ui text-[11.5px] text-muet truncate">
          {sousTitre ?? (
            <>
              {auteur ? `${auteur} · ` : ''}{nbPages} pages
              {texteSelectionnable && <> · <span className="text-ok">✓ texte sélectionnable</span></>}
              {nbSignets > 0 && <> · <span className="text-ok">✓ {nbSignets} signet{nbSignets > 1 ? 's' : ''}</span></>}
            </>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 shrink-0">
        {onTaille && (
          <div className="flex items-center gap-0.5 font-ui text-encre-douce" title="Taille du texte de la page">
            <button type="button" aria-label="Réduire la taille du texte" onClick={() => onTaille(-1)}
              className="border border-bordure rounded-md w-7 h-7 bg-surface hover:bg-pigment-teinte/50 text-[11px] leading-none">A−</button>
            {taille != null && <span className="w-5 text-center text-[11px] tabular-nums text-muet">{taille}</span>}
            <button type="button" aria-label="Agrandir la taille du texte" onClick={() => onTaille(1)}
              className="border border-bordure rounded-md w-7 h-7 bg-surface hover:bg-pigment-teinte/50 text-[15px] leading-none">A+</button>
          </div>
        )}
        <button type="button" onClick={onToggleFrise} className={btnCls}>
          ⇆ {friseVisible ? 'Afficher la frise' : 'Masquer la frise'}
        </button>
        {mode === 'creation' && onRemplacer && (
          <button type="button" onClick={onRemplacer} className={btnCls}>↻ Remplacer le PDF</button>
        )}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 font-ui text-xs text-encre-douce">
            <button type="button" aria-label="Page précédente" disabled={page <= 1}
              onClick={() => onPage(Math.max(1, page - 1))}
              className="border border-bordure rounded-md px-2 py-1 bg-surface hover:bg-pigment-teinte/50 disabled:opacity-40">‹</button>
            <span className="whitespace-nowrap">p.<b className="text-encre">{page}</b> / {totalPages}</span>
            <button type="button" aria-label="Page suivante" disabled={page >= totalPages}
              onClick={() => onPage(Math.min(totalPages, page + 1))}
              className="border border-bordure rounded-md px-2 py-1 bg-surface hover:bg-pigment-teinte/50 disabled:opacity-40">›</button>
          </div>
        )}
      </div>
    </div>
  )
}
