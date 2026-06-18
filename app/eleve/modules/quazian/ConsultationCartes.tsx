'use client'

import { useMemo, useState } from 'react'
import type { CarteConsultation } from './actions'

// Mode consultation (Lot 11) : parcourir TOUTES ses cartes avec leur réponse,
// sans impact sur la révision. Les cartes récemment ajoutées sont repérables.
export function ConsultationCartes({ cartes, onRetour }: { cartes: CarteConsultation[]; onRetour: () => void }) {
  const [filtreNouvelles, setFiltreNouvelles] = useState(false)
  const nbNouvelles = cartes.filter((c) => c.nouvelle).length

  const groupes = useMemo(() => {
    const visibles = filtreNouvelles ? cartes.filter((c) => c.nouvelle) : cartes
    const m = new Map<string, CarteConsultation[]>()
    for (const c of visibles) {
      const arr = m.get(c.label_unite) ?? []
      arr.push(c)
      m.set(c.label_unite, arr)
    }
    return [...m.entries()]
  }, [cartes, filtreNouvelles])

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onRetour} className="text-sm text-stone-500 hover:text-stone-700">← Retour</button>
        <span className="text-xs text-stone-400">{cartes.length} carte{cartes.length > 1 ? 's' : ''}</span>
      </div>

      {nbNouvelles > 0 && (
        <button
          onClick={() => setFiltreNouvelles((v) => !v)}
          className={`w-full rounded-xl px-4 py-3 text-sm border transition-colors ${
            filtreNouvelles ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
          }`}
        >
          ✦ {nbNouvelles} carte{nbNouvelles > 1 ? 's' : ''} ajoutée{nbNouvelles > 1 ? 's' : ''} récemment
          <span className="text-xs ml-1">— {filtreNouvelles ? 'tout afficher' : 'voir seulement celles-ci'}</span>
        </button>
      )}

      {cartes.length === 0 ? (
        <p className="text-center text-stone-400 text-sm py-10">Aucune carte pour l&apos;instant.</p>
      ) : (
        groupes.map(([unite, cs]) => (
          <div key={unite} className="space-y-2">
            <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide">{unite}</h3>
            {cs.map((c) => (
              <div key={c.flashcard_id} className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-stone-900">{c.recto}</p>
                  {c.nouvelle && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">Nouvelle</span>}
                </div>
                <p className="text-sm text-stone-600 mt-2 border-t border-stone-100 pt-2 whitespace-pre-wrap">{c.verso}</p>
                {c.concept_tag && <p className="text-xs text-stone-300 mt-2">{c.concept_tag}</p>}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
