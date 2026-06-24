'use client'

import { useState } from 'react'
import { lancerExtractionIA } from '../actions'

type Doc = { id: string; titre: string; auteur: string | null }

export function ExtractionIA({
  uniteId,
  docs,
}: {
  uniteId: string
  docs: Doc[]
}) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [documentId, setDocumentId] = useState<string>('tous')

  const aDesTextes = docs.length > 0

  async function handleExtraction() {
    if (!aDesTextes) return
    setLoading(true)
    setMessage(null)
    setErreur(null)

    const fd = new FormData()
    fd.append('uniteId', uniteId)
    if (documentId !== 'tous') fd.append('documentId', documentId)
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
      {docs.length > 1 && (
        <select
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
          className="px-3 py-2 text-sm border border-bordure rounded-lg text-encre-douce bg-surface focus:outline-none focus:ring-2 focus:ring-pigment"
        >
          <option value="tous">Tous les documents</option>
          {docs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.titre}{d.auteur ? ` — ${d.auteur}` : ''}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={handleExtraction}
        disabled={loading || !aDesTextes}
        className="px-4 py-2 bg-bouton text-surface text-sm rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Extraction en cours…' : '✦ Générer des cartes avec l’IA'}
      </button>
      {!aDesTextes && (
        <p className="text-xs text-muet">
          Aucun texte extrait dans le Scriptorium pour cette unité.
        </p>
      )}
      {message && <p className="text-xs text-ok">{message}</p>}
      {erreur && <p className="text-xs text-retard">{erreur}</p>}
    </div>
  )
}
