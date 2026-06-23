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
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center">
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
      className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 disabled:opacity-50 transition-colors text-sm font-medium"
    >
      {pending ? '…' : "J'ai lu mon retour"}
    </button>
  )
}
