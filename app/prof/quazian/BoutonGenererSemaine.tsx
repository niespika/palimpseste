'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { genererCartesSemaine } from './actions'

export default function BoutonGenererSemaine({ uniteId, semaine, dejaDesCartes }: { uniteId: string; semaine: number; dejaDesCartes: boolean }) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleGenerer() {
    setChargement(true)
    setMessage(null)
    const res = await genererCartesSemaine(uniteId, semaine)
    setChargement(false)
    if (res.error) { setMessage(res.error); return }
    setMessage(`+${res.nb} cartes`)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleGenerer}
        disabled={chargement}
        className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {chargement ? 'Génération…' : dejaDesCartes ? '✦ Régénérer' : '✦ Générer'}
      </button>
      {message && <span className="text-xs text-stone-500">{message}</span>}
    </div>
  )
}
