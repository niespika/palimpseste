'use client'

import { useState } from 'react'
import { soumettreNote, type CarteRevision } from './actions'

const LABELS_RATING: Record<number, { label: string; desc: string; couleur: string }> = {
  1: { label: 'Raté', desc: 'Je ne savais pas', couleur: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' },
  2: { label: 'Difficile', desc: 'Je me souviens à peine', couleur: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200' },
  3: { label: 'Bien', desc: 'Après hésitation', couleur: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' },
  4: { label: 'Facile', desc: 'Immédiatement', couleur: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' },
}

const TYPE_COULEURS: Record<string, string> = {
  philosophe: 'bg-blue-50 text-blue-600',
  concept: 'bg-violet-50 text-violet-600',
  mouvement: 'bg-teal-50 text-teal-600',
  these: 'bg-amber-50 text-amber-600',
}

interface Props {
  cartes: CarteRevision[]
  onTermine: (nbRevues: number) => void
}

export function SessionRevision({ cartes: cartesInitiales, onTermine }: Props) {
  const [cartes, setCartes] = useState(cartesInitiales)
  const [index, setIndex] = useState(0)
  const [retournee, setRetournee] = useState(false)
  const [pending, setPending] = useState(false)
  const [nbRevues, setNbRevues] = useState(0)

  const carte = cartes[index]

  if (!carte) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-lg font-serif text-stone-900 mb-2">Session terminée !</h3>
        <p className="text-sm text-stone-500 mb-6">{nbRevues} carte{nbRevues > 1 ? 's' : ''} révisée{nbRevues > 1 ? 's' : ''}</p>
        <button
          onClick={() => onTermine(nbRevues)}
          className="px-6 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-900"
        >
          Retour au tableau de bord
        </button>
      </div>
    )
  }

  async function handleNote(rating: 1 | 2 | 3 | 4) {
    if (pending) return
    setPending(true)

    await soumettreNote(carte.flashcard_id, carte.card_state_id, rating)

    // Si raté (1) et nouvelle carte ou état "learning", on remet la carte en fin de file
    if (rating === 1 && carte.state <= 1) {
      setCartes((prev) => {
        const reste = prev.filter((_, i) => i !== index)
        return [...reste, { ...carte, card_state_id: carte.card_state_id ?? 'pending' }]
      })
    } else {
      setCartes((prev) => prev.filter((_, i) => i !== index))
      setIndex((i) => Math.min(i, cartes.length - 2))
    }

    setNbRevues((n) => n + 1)
    setRetournee(false)
    setPending(false)
  }

  const progress = Math.round((index / cartesInitiales.length) * 100)

  return (
    <div className="max-w-xl mx-auto">
      {/* Barre de progression */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-stone-700 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-stone-400 shrink-0">{index + 1} / {cartes.length}</span>
      </div>

      {/* Carte */}
      <div
        className="bg-white border border-stone-200 rounded-2xl p-8 min-h-64 flex flex-col cursor-pointer select-none shadow-sm"
        onClick={() => !retournee && setRetournee(true)}
      >
        {/* En-tête */}
        <div className="flex items-center gap-2 mb-6">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COULEURS[carte.type] ?? 'bg-stone-100 text-stone-500'}`}>
            {carte.type}
          </span>
          {carte.concept_tag && (
            <span className="text-xs text-stone-400">{carte.concept_tag}</span>
          )}
          <span className="ml-auto text-xs text-stone-300">{carte.label_unite}</span>
        </div>

        {/* Recto */}
        <p className="text-lg text-stone-900 font-medium flex-1 leading-relaxed">
          {carte.recto}
        </p>

        {/* Verso */}
        {retournee ? (
          <div className="mt-6 pt-6 border-t border-stone-100">
            <p className="text-stone-600 leading-relaxed">{carte.verso}</p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-stone-300 text-center">
            Appuie pour révéler la réponse
          </p>
        )}
      </div>

      {/* Boutons de notation */}
      {retournee ? (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {([1, 2, 3, 4] as const).map((r) => {
            const info = LABELS_RATING[r]
            return (
              <button
                key={r}
                onClick={() => handleNote(r)}
                disabled={pending}
                className={`flex flex-col items-center px-2 py-3 rounded-xl border text-xs font-medium transition-colors disabled:opacity-50 ${info.couleur}`}
              >
                <span className="font-bold text-sm mb-0.5">{info.label}</span>
                <span className="text-xs opacity-70 leading-tight text-center">{info.desc}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setRetournee(true)}
            className="px-6 py-2.5 bg-stone-800 text-white text-sm rounded-xl hover:bg-stone-900 transition-colors"
          >
            Révéler la réponse
          </button>
        </div>
      )}
    </div>
  )
}
