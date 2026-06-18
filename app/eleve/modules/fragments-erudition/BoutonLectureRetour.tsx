'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validerLectureRetour } from './actions'

// Gate de lecture (Lot 10) : tant que l'élève n'a pas validé avoir lu son
// dernier retour, il ne peut pas déposer un nouveau fragment.
export default function BoutonLectureRetour({ analyseId }: { analyseId: string }) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)

  async function handleValider() {
    setChargement(true)
    await validerLectureRetour(analyseId)
    router.refresh()
    setChargement(false)
  }

  return (
    <button
      onClick={handleValider}
      disabled={chargement}
      className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
    >
      {chargement ? '…' : 'J’ai lu mon retour — je peux déposer'}
    </button>
  )
}
