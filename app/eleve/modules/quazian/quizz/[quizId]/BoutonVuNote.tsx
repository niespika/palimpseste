'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { marquerNoteVue } from './actions'

// Validation de lecture de la note de quizz (source transversale, sans case par
// tuile : juste « J'ai vu ma note »). Tant que non validé, l'élève ne peut rien
// rendre dans les autres modules — mais Quazian lui-même reste ouvert.
export default function BoutonVuNote({ quizId, dejaVu }: { quizId: string; dejaVu: boolean }) {
  const router = useRouter()
  const [vu, setVu] = useState(dejaVu)
  const [pending, setPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  if (vu) {
    return (
      <div className="bg-ok-teinte border border-ok rounded-xl px-4 py-3 text-sm text-ok text-center">
        ✓ Note vue
      </div>
    )
  }

  async function valider() {
    setErreur(null)
    setPending(true)
    try {
      const res = await marquerNoteVue(quizId)
      if ('error' in res) {
        setErreur(res.error)
        return
      }
      setVu(true)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={valider}
        disabled={pending}
        className="w-full bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
      >
        {pending ? '…' : 'J’ai vu ma note'}
      </button>
      <p className="text-xs text-muet text-center">
        Tant que tu n’as pas validé, tu ne peux rien rendre dans les autres modules.
      </p>
      {erreur && <p className="text-retard text-sm">{erreur}</p>}
    </div>
  )
}
