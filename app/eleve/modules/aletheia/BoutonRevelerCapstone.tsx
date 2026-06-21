'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { revelerCapstone } from './actions'

// Déclenche (ou relance) la génération de la carte d'architecture (capstone)
// quand toutes les semaines sont terminées. La carte se prépare en arrière-plan.
// `discret` : variante texte pour proposer une relance pendant la préparation.
export default function BoutonRevelerCapstone({ livreId, label, discret = false }: { livreId: string; label?: string; discret?: boolean }) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleReveler() {
    setErreur(null)
    setChargement(true)
    try {
      const res = await revelerCapstone(livreId)
      if (res?.error) { setErreur(res.error); return }
      router.refresh()
    } finally {
      setChargement(false)
    }
  }

  const texte = label ?? '✦ Révéler la carte d’architecture du livre'

  return (
    <div className="space-y-2">
      <button
        onClick={handleReveler}
        disabled={chargement}
        className={discret
          ? 'text-xs text-stone-500 hover:text-stone-800 underline disabled:opacity-50'
          : 'w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50'}
      >
        {chargement ? '…' : texte}
      </button>
      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
    </div>
  )
}
