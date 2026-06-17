'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { definirSemestreCourant } from '../actions'

// Bascule du semestre « courant » (Lot 5 — 5.0). Un seul courant à la fois.
export default function BoutonCourant({ semestreId, courant }: { semestreId: string; courant: boolean }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  if (courant) {
    return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Courant</span>
  }

  async function definir() {
    setPending(true)
    await definirSemestreCourant(semestreId)
    setPending(false)
    router.refresh()
  }

  return (
    <button
      onClick={definir}
      disabled={pending}
      className="text-xs text-stone-500 hover:text-stone-800 underline disabled:opacity-50"
    >
      {pending ? '…' : 'Définir courant'}
    </button>
  )
}
