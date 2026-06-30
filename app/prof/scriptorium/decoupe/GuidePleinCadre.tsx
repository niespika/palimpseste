'use client'

import type { Pos, Semaine, Champ, Cible } from '../NavigateurDecoupe'

// Guide pas-à-pas affiché EN BAS quand la frise est masquée (mode plein cadre).
// Lit les MÊMES données que la frise (aucun état dupliqué) : semaine active, ses
// bornes début/fin, navigation entre semaines, et une frise-progression en segments.
export default function GuidePleinCadre({
  semaines, nb, cible, posTexte, onArme,
}: {
  semaines: Semaine[]
  nb: number
  cible: Cible | null
  posTexte: (q: Pos | null) => string
  onArme: (w: number, champ: Champ) => void
}) {
  const sem = (i: number): Semaine => semaines[i] ?? { titre: '', chapitres: '', debut: null, fin: null }
  const active = cible?.w ?? null

  // Focalise une semaine : arme sa 1re borne non posée (sinon le début, re-plaçable).
  const focusSemaine = (w: number) => {
    const s = sem(w)
    onArme(w, !s.debut ? 'debut' : !s.fin ? 'fin' : 'debut')
  }

  const progression = (
    <div className="flex gap-1 items-end mt-2.5">
      {Array.from({ length: nb }, (_, i) => {
        const s = sem(i)
        const posee = !!(s.debut && s.fin)
        const estActive = i === active
        return (
          <div key={i} className="relative flex-1">
            {estActive && <span className="absolute -top-3.5 left-0 font-ui text-[8px] text-encre-douce">S{i + 1}</span>}
            {/* en cours → encre-douce (#5A4632) ; saisi → muet (#8A6F4E) ; à venir → bordure. */}
            <div className={`rounded-full ${estActive ? 'h-2.5 bg-encre-douce' : posee ? 'h-1.5 bg-muet' : 'h-1.5 bg-bordure'}`} />
          </div>
        )
      })}
    </div>
  )

  if (active === null) {
    return (
      <div className="bg-surface border-t border-bordure rounded-b-xl px-5 py-3">
        <p className="font-ui text-xs text-ok">✓ Toutes les bornes sont placées. Clique un repère sur la page pour ajuster.</p>
        {progression}
      </div>
    )
  }

  const s = sem(active)
  const chip = (champ: Champ, label: string) => {
    const val = s[champ]
    const pose = !!val
    const debut = champ === 'debut'
    // Début = vert bouteille, Fin = bordeaux, en teinte translucide (cf. la frise).
    const cadre = debut
      ? (pose ? 'border-vert-bouteille/35 bg-vert-bouteille/10 text-encre' : 'border-dashed border-vert-bouteille/45 bg-vert-bouteille/5 text-vert-bouteille')
      : (pose ? 'border-rouge-bordeaux/35 bg-rouge-bordeaux/10 text-encre' : 'border-dashed border-rouge-bordeaux/45 bg-rouge-bordeaux/5 text-rouge-bordeaux')
    const puce = debut ? 'text-vert-bouteille' : 'text-rouge-bordeaux'
    return (
      <button type="button" onClick={() => onArme(active, champ)}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-ui text-[11px] ${cadre}`}>
        <span className={`font-bold ${puce}`}>{pose ? '●' : '○'}</span>
        {label} {pose ? posTexte(val) : '— à placer'}
      </button>
    )
  }

  return (
    <div className="bg-surface border-t border-bordure rounded-b-xl px-5 py-3">
      <div className="flex items-center gap-3.5 flex-wrap">
        <div className="font-titre text-[17px] font-bold text-encre whitespace-nowrap leading-none">
          Semaine {active + 1} <span className="font-ui text-[11px] font-normal text-muet/70">/ {nb}</span>
        </div>
        <div className="flex flex-col gap-px min-w-0">
          <span className="font-titre text-sm text-encre-douce truncate">{s.titre || '—'}</span>
          {s.chapitres && <span className="font-ui text-[9.5px] text-muet/70 truncate">{s.chapitres}</span>}
        </div>
        <div className="w-px h-7 bg-bordure" />
        {chip('debut', 'Début')}
        {chip('fin', 'Fin')}
        <div className="ml-auto flex items-center gap-1.5 font-ui text-[11px] text-encre-douce">
          <button type="button" disabled={active <= 0} onClick={() => focusSemaine(active - 1)}
            className="border border-bordure rounded-md px-2.5 py-1 bg-surface hover:bg-pigment-teinte/50 disabled:opacity-40">‹ S{active}</button>
          <button type="button" disabled={active >= nb - 1} onClick={() => focusSemaine(active + 1)}
            className="border border-bordure rounded-md px-2.5 py-1 bg-surface hover:bg-pigment-teinte/50 disabled:opacity-40">S{active + 2} ›</button>
        </div>
      </div>
      {progression}
    </div>
  )
}
