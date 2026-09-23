'use client'

// ============================================================================
// LA QUESTION D'ESSAI DE L'ANTICHAMBRE — elle ne compte pas, rien n'est écrit en
// base. L'élève place ses points avec les VRAIS curseurs du quiz, puis voit ce
// que ça lui aurait rapporté, réponse par réponse (décision de Louis, 22/09 :
// « Quelle est la capitale de l'Australie ? »).
// ============================================================================

import { useState } from 'react'
import { CurseurPoints } from './CurseurPoints'
import { ESSAI, expliquerEssai } from '@/utils/quazian-antichambre'

const LETTRES = ['A', 'B', 'C', 'D']
type Jetons = [number, number, number, number]

export function EssaiAntichambre() {
  const [jetons, setJetons] = useState<Jetons>([0, 0, 0, 0])
  const [vu, setVu] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const total = jetons.reduce((a, b) => a + b, 0)
  const reste = 100 - total

  function poser(i: number, v: number) {
    setVu(false)
    setErreur(null)
    setJetons((prev) => {
      const autres = prev.reduce((a, x, k) => (k === i ? a : a + x), 0)
      return prev.map((x, k) => (k === i ? Math.max(0, Math.min(Math.round(v), 100 - autres)) : x)) as Jetons
    })
  }

  function voir() {
    if (reste !== 0) { setErreur(`Place d’abord tes 100 points (il en reste ${reste}).`); return }
    setVu(true)
  }

  const resultat = vu ? expliquerEssai(jetons) : null

  return (
    <div className="bg-surface border border-bordure rounded-2xl p-4 sm:p-5 shadow-sm">
      <p className="text-xs text-muet">Essai — ne compte pas</p>
      <p className="mt-1 text-base font-medium text-encre leading-relaxed">{ESSAI.enonce}</p>

      <div className="mt-3 flex flex-col gap-2.5">
        {ESSAI.options.map((opt, i) => (
          <CurseurPoints
            key={opt}
            id={`essai-${i}`}
            lettre={LETTRES[i]}
            libelle={opt}
            valeur={jetons[i]}
            plafond={jetons[i] + Math.max(0, reste)}
            gele={false}
            retenu={false}
            surValeur={(v) => poser(i, v)}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] bg-parchemin-fonce px-4 py-3">
        <span className="text-sm text-encre-douce">Points placés</span>
        <span className={`text-[15px] font-semibold tabular-nums ${reste === 0 ? 'text-ok' : 'text-encre'}`}>
          {total} sur 100{reste === 0 ? ' ✓' : ''}
        </span>
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => { setVu(false); setErreur(null); setJetons([25, 25, 25, 25]) }}
          className="text-sm text-muet hover:text-encre-douce underline min-h-11"
        >
          Je ne sais pas (25 partout)
        </button>
      </div>

      <button
        type="button"
        onClick={voir}
        className="mt-3 w-full min-h-11 py-2.5 text-sm bg-bouton text-surface rounded-xl hover:opacity-90"
      >
        Voir ce que ça rapporterait
      </button>
      {erreur && <p role="alert" className="mt-2 text-sm text-attention">{erreur}</p>}

      {resultat && (
        <div role="status" className="mt-3 rounded-xl border border-bordure bg-parchemin p-3 text-sm leading-relaxed">
          <p className="text-encre">La bonne réponse était <strong>Canberra</strong>.</p>
          <ul className="mt-1.5 text-encre-douce tabular-nums">
            {resultat.lignes.map((l) => <li key={l}>{l}</li>)}
          </ul>
          {resultat.calcul && <p className="mt-1 text-encre-douce tabular-nums">Calcul : {resultat.calcul}</p>}
          <p className="mt-1 text-encre">
            Tu aurais eu <strong className="tabular-nums">{resultat.score}</strong> point{['+1', '−1', '0'].includes(resultat.score) ? '' : 's'} — le maximum est +10.
          </p>
          <button
            type="button"
            onClick={() => { setJetons([0, 0, 0, 0]); setVu(false) }}
            className="mt-2 text-sm text-muet hover:text-encre-douce underline min-h-11"
          >
            Recommencer l’essai
          </button>
        </div>
      )}
    </div>
  )
}
