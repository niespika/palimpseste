'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { activerEssaiPourClasse } from '../essai-actions'

// Active / désactive l'essai final pour toute la classe, sur le semestre consulté.
export default function BoutonActiverClasse({ classeId, semestreId }: { classeId: string; semestreId: string }) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleActiver(actif: boolean) {
    setChargement(true)
    const res = await activerEssaiPourClasse(classeId, semestreId, actif)
    setChargement(false)
    setMessage(actif ? `Essai activé (${res.count})` : `Essai désactivé (${res.count})`)
    router.refresh()
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muet">Essai :</span>
      <button
        onClick={() => handleActiver(true)}
        disabled={chargement}
        className="text-xs bg-ok-teinte text-ok px-2 py-1 rounded hover:opacity-90 disabled:opacity-50"
      >
        Activer
      </button>
      <button
        onClick={() => handleActiver(false)}
        disabled={chargement}
        className="text-xs bg-parchemin-fonce text-muet px-2 py-1 rounded hover:opacity-90 disabled:opacity-50"
      >
        Désactiver
      </button>
      {message && <span className="text-xs text-muet">{chargement ? '…' : message}</span>}
    </div>
  )
}
