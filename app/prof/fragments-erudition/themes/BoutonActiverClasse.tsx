'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { activerEssaiPourClasse } from '../essai-actions'

export default function BoutonActiverClasse({ classeId, classeNom }: { classeId: string; classeNom: string }) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleActiver(actif: boolean) {
    setChargement(true)
    const res = await activerEssaiPourClasse(classeId, actif)
    setChargement(false)
    setMessage(actif ? `Essai activé (${res.count})` : `Essai désactivé (${res.count})`)
    router.refresh()
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium text-stone-700">{classeNom}</span>
      <button
        onClick={() => handleActiver(true)}
        disabled={chargement}
        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 disabled:opacity-50"
      >
        Activer
      </button>
      <button
        onClick={() => handleActiver(false)}
        disabled={chargement}
        className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded hover:bg-stone-200 disabled:opacity-50"
      >
        Désactiver
      </button>
      {message && <span className="text-xs text-stone-500">{chargement ? '…' : message}</span>}
    </div>
  )
}
