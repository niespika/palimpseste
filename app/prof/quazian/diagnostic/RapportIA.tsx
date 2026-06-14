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
    <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-stone-700">Rapport de fragilités</h4>
        <button
          onClick={handleGenerer}
          disabled={loading}
          className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Analyse en cours…' : '✦ Générer avec l’IA'}
        </button>
      </div>
      {erreur && <p className="text-xs text-red-600">{erreur}</p>}
      {rapport && (
        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{rapport}</p>
      )}
      {!rapport && !loading && (
        <p className="text-xs text-stone-400">
          Analyse les idées fausses et lacunes de la classe pour proposer des priorités pédagogiques.
        </p>
      )}
    </div>
  )
}
