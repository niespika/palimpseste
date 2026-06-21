'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validerLectureRetour2 } from './actions'

interface Props {
  livreId: string
  semaine: number
}

// Validation de lecture du retour 2 (gate de clôture de la semaine, façon Fragments).
export default function BoutonLectureRetour2({ livreId, semaine }: Props) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleValider() {
    setErreur(null)
    setChargement(true)
    try {
      const res = await validerLectureRetour2(livreId, semaine)
      if (res?.error) { setErreur(res.error); return }
      router.refresh()
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleValider}
        disabled={chargement}
        className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50"
      >
        {chargement ? '…' : 'J’ai lu mon retour — clore la semaine'}
      </button>
      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
    </div>
  )
}
