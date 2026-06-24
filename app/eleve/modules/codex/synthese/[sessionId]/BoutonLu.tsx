'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { marquerSyntheseLue } from '../../actions'

export function BoutonLu({ sessionId, luInitial }: { sessionId: string; luInitial: boolean }) {
  const router = useRouter()
  const [lu, setLu] = useState(luInitial)
  const [pending, setPending] = useState(false)

  if (lu) {
    return (
      <div className="bg-ok-teinte border border-ok rounded-xl px-4 py-3 text-sm text-ok text-center">
        ✓ Retour marqué comme lu
      </div>
    )
  }

  async function handleLu() {
    setPending(true)
    const res = await marquerSyntheseLue(sessionId)
    setPending(false)
    if ('success' in res) {
      setLu(true)
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleLu}
      disabled={pending}
      className="w-full py-3 bg-bouton text-surface rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors text-sm font-medium"
    >
      {pending ? '…' : "J'ai lu mon retour"}
    </button>
  )
}
