'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { genererCartes } from './actions'

export default function BoutonGenererCartes({ cibleId, dejaDesCartes }: { cibleId: string; dejaDesCartes: boolean }) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState(false)

  async function handleGenerer() {
    setChargement(true)
    setMessage(null)
    setErreur(false)
    try {
      const res = await genererCartes(cibleId)
      if ('error' in res && res.error) { setErreur(true); setMessage(res.error); return }
      const nb = res.nb ?? 0
      // Dire le plafond quand il a mordu : sinon « +25 » ressemble à un hasard.
      const atteint = res.plafond != null && nb >= res.plafond
      setMessage(`+${nb} carte${nb > 1 ? 's' : ''} à valider${atteint ? ` — plafond de ${res.plafond} atteint` : ''}`)
      router.refresh()
    } catch {
      // Fail-visible : une action serveur qui lève rend la main au lieu de figer
      // le bouton sur « Génération… » (patron C8·L1).
      setErreur(true)
      setMessage('La génération n’a pas abouti. Réessaie.')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleGenerer}
        disabled={chargement}
        className="text-xs px-3 py-1.5 bg-bouton text-surface rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
      >
        {chargement ? 'Génération…' : dejaDesCartes ? '✦ Régénérer' : '✦ Générer les cartes'}
      </button>
      {message && <span className={`text-xs ${erreur ? 'text-retard' : 'text-muet'}`}>{message}</span>}
    </div>
  )
}
