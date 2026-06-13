'use client'

import { useState } from 'react'
import { lancerExtractionIA } from '../actions'

export function ExtractionIA({ uniteId, aDesTextes }: { uniteId: string; aDesTextes: boolean }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleExtraction() {
    if (!aDesTextes) return
    setLoading(true)
    setMessage(null)
    setErreur(null)

    const fd = new FormData()
    fd.append('uniteId', uniteId)
    const res = await lancerExtractionIA(fd)

    if (res.error) {
      setErreur(res.error)
    } else {
      setMessage(`${res.nb} carte${res.nb! > 1 ? 's' : ''} générée${res.nb! > 1 ? 's' : ''} — à valider ci-dessous.`)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleExtraction}
        disabled={loading || !aDesTextes}
        className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Extraction en cours…' : '✦ Générer des cartes avec l’IA'}
      </button>
      {!aDesTextes && (
        <p className="text-xs text-stone-400">
          Aucun texte extrait dans le Scriptorium pour cette unité.
        </p>
      )}
      {message && <p className="text-xs text-green-700">{message}</p>}
      {erreur && <p className="text-xs text-red-600">{erreur}</p>}
    </div>
  )
}
