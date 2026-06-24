'use client'

import { useState } from 'react'
import { genererRapportFragilites } from './actions'

export function RapportIA() {
  const [loading, setLoading] = useState(false)
  const [rapport, setRapport] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleGenerer() {
    setLoading(true)
    setErreur(null)
    const res = await genererRapportFragilites()
    if ('error' in res) setErreur(res.error)
    else setRapport(res.rapport)
    setLoading(false)
  }

  return (
    <div className="bg-surface border border-bordure rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-encre-douce">Rapport de fragilités</h4>
        <button
          onClick={handleGenerer}
          disabled={loading}
          className="px-3 py-1.5 text-xs bg-bouton text-surface rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Analyse en cours…' : '✦ Générer avec l’IA'}
        </button>
      </div>
      {erreur && <p className="text-xs text-retard">{erreur}</p>}
      {rapport && (
        <p className="text-sm text-encre-douce leading-relaxed whitespace-pre-wrap">{rapport}</p>
      )}
      {!rapport && !loading && (
        <p className="text-xs text-muet">
          Analyse les idées fausses et lacunes de la classe pour proposer des priorités pédagogiques.
        </p>
      )}
    </div>
  )
}
