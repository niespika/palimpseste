'use client'

import type { Pos, Semaine, Champ, Cible } from '../NavigateurDecoupe'

const inputCls = 'px-2 py-1 border border-bordure rounded text-xs text-encre bg-surface focus:outline-none focus:ring-2 focus:ring-pigment'

// Rail vertical des semaines (présentation pure). Remplace le mur de cartes : les
// semaines POSÉES tiennent sur une ligne, seule l'ACTIVE est dépliée (titre/chapitres
// + slots début/fin). Les champs cachés decoupe_N_* sont montés pour TOUTES les
// semaines (jamais démontés → aucune perte de saisie à la soumission).
export default function FriseSemaines({
  semaines, nb, cible, totalPages, emettreChamps, posTexte,
  onArme, onEffacer, onMajTexte,
}: {
  semaines: Semaine[]
  nb: number
  cible: Cible | null
  totalPages: number
  emettreChamps: boolean
  posTexte: (q: Pos | null) => string
  onArme: (w: number, champ: Champ) => void
  onEffacer: (w: number, champ: Champ) => void
  onMajTexte: (w: number, champ: 'titre' | 'chapitres', val: string) => void
}) {
  const sem = (i: number): Semaine => semaines[i] ?? { titre: '', chapitres: '', debut: null, fin: null }
  const posees = Array.from({ length: nb }, (_, i) => sem(i)).filter(s => s.debut && s.fin).length

  const plage = (s: Semaine): string => {
    if (!s.debut || !s.fin) return ''
    return totalPages > 1 ? `p.${s.debut.p}–${s.fin.p}` : `l.${s.debut.l}–${s.fin.l}`
  }

  return (
    <div className="lg:w-72 shrink-0 space-y-1.5">
      <div className="flex items-baseline justify-between px-1">
        <p className="font-marque text-[11px] tracking-[0.16em] text-muet uppercase">Semaines · {nb}</p>
        <p className="font-ui text-[11px] text-muet/80">{posees} posée{posees > 1 ? 's' : ''}</p>
      </div>

      {Array.from({ length: nb }, (_, i) => {
        const s = sem(i)
        const posee = !!(s.debut && s.fin)
        const active = cible?.w === i
        const champsCaches = emettreChamps && (
          <>
            <input type="hidden" name={`decoupe_${i + 1}_titre`} value={s.titre} />
            <input type="hidden" name={`decoupe_${i + 1}_chapitres`} value={s.chapitres} />
            <input type="hidden" name={`decoupe_${i + 1}_debutPage`} value={s.debut?.p ?? ''} />
            <input type="hidden" name={`decoupe_${i + 1}_debutLigne`} value={s.debut?.l ?? ''} />
            <input type="hidden" name={`decoupe_${i + 1}_finPage`} value={s.fin?.p ?? ''} />
            <input type="hidden" name={`decoupe_${i + 1}_finLigne`} value={s.fin?.l ?? ''} />
          </>
        )

        // Semaine ACTIVE → carte dépliée
        if (active) {
          const slot = (champ: Champ, label: string) => {
            const val = s[champ]
            const pose = !!val
            const debut = champ === 'debut'
            // Début = vert bouteille, Fin = bordeaux, en teinte translucide (pas un bloc plein).
            // Croix d'effacement = bouton FRÈRE (jamais imbriqué dans le bouton du slot,
            // sinon HTML invalide / warning d'hydratation).
            const cadre = debut
              ? (pose ? 'border-vert-bouteille/35 bg-vert-bouteille/10' : 'border-dashed border-vert-bouteille/45 bg-vert-bouteille/5')
              : (pose ? 'border-rouge-bordeaux/35 bg-rouge-bordeaux/10' : 'border-dashed border-rouge-bordeaux/45 bg-rouge-bordeaux/5')
            const txtAccent = debut ? 'text-vert-bouteille' : 'text-rouge-bordeaux'
            return (
              <div className={`flex-1 flex items-stretch rounded-md border ${cadre}`}>
                <button type="button" onClick={() => onArme(i, champ)} className="flex-1 min-w-0 text-left px-2 py-1.5">
                  <span className={`block font-ui text-[8.5px] tracking-[0.06em] uppercase ${txtAccent}`}>{label}</span>
                  <span className={`block font-ui text-[11px] font-bold ${pose ? 'text-encre' : txtAccent}`}>{pose ? posTexte(val) : 'à placer…'}</span>
                </button>
                {pose && (
                  <button type="button" aria-label={`Effacer ${label} de la semaine ${i + 1}`}
                    onClick={() => onEffacer(i, champ)}
                    className="px-1.5 text-muet hover:text-retard">✕</button>
                )}
              </div>
            )
          }
          return (
            <div key={i} className="rounded-lg border border-pigment/50 bg-surface p-2.5 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-pigment" />
                <span className="font-ui text-[12.5px] font-bold text-encre">Semaine {i + 1}</span>
                <span className="ml-auto font-ui text-[9.5px] tracking-[0.06em] text-attention uppercase">en cours</span>
              </div>
              <input value={s.titre} onChange={e => onMajTexte(i, 'titre', e.target.value)} placeholder="Titre…"
                className={`${inputCls} w-full font-titre !text-sm`} />
              <input value={s.chapitres} onChange={e => onMajTexte(i, 'chapitres', e.target.value)} placeholder="Chapitres (ex. : Chap. 1-4)"
                className={`${inputCls} w-full`} />
              <div className="flex gap-1.5">
                {slot('debut', 'Début')}
                {slot('fin', 'Fin')}
              </div>
              {champsCaches}
            </div>
          )
        }

        // Semaine POSÉE → une ligne compacte
        if (posee) {
          return (
            <button key={i} type="button" onClick={() => onArme(i, 'debut')}
              className="w-full flex items-center gap-2 rounded-lg border border-bordure bg-surface px-2.5 py-1.5 text-left hover:border-pigment/40 transition-colors">
              <span className="text-ok text-xs">✓</span>
              <span className="font-ui text-xs font-bold text-encre">S{i + 1}</span>
              <span className="font-corps text-[13px] text-muet flex-1 truncate">{s.titre || '—'}</span>
              <span className="font-ui text-[10px] text-muet/70 whitespace-nowrap">{plage(s)}</span>
              {champsCaches}
            </button>
          )
        }

        // Semaine À VENIR → ligne atténuée
        return (
          <button key={i} type="button" onClick={() => onArme(i, s.debut ? 'fin' : 'debut')}
            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-pigment-teinte/40 transition-colors">
            <span className="w-3" />
            <span className="font-ui text-xs font-bold text-muet/70">S{i + 1}</span>
            <span className="font-corps text-[13px] text-muet/60 flex-1 truncate">{s.titre || 'à venir'}</span>
            <span className="font-ui text-[10px] text-muet/50 whitespace-nowrap">à placer</span>
            {champsCaches}
          </button>
        )
      })}
    </div>
  )
}
