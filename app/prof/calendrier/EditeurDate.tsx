'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { modifierDateEvenement } from './actions'

// Édition légère de la date d'un événement (réécrite dans le module propriétaire).
export default function EditeurDate({
  sourceModule,
  sourceId,
  classeId,
  dateActuelle,
}: {
  sourceModule: string
  sourceId: string
  classeId: string | null
  dateActuelle: string
}) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [valeur, setValeur] = useState(dateActuelle)
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  if (!ouvert) {
    return (
      <button onClick={() => setOuvert(true)} className="text-xs text-stone-400 hover:text-stone-700 underline">
        modifier la date
      </button>
    )
  }

  async function enregistrer() {
    setBusy(true)
    setErreur(null)
    const res = await modifierDateEvenement({
      source_module: sourceModule,
      source_id: sourceId,
      classe_id: classeId,
      date: valeur,
    })
    setBusy(false)
    if (res.error) return setErreur(res.error)
    setOuvert(false)
    router.refresh()
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        type="date"
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        className="px-2 py-0.5 text-xs border border-stone-300 rounded"
      />
      <button onClick={enregistrer} disabled={busy} className="text-xs bg-stone-800 text-white px-2 py-0.5 rounded hover:bg-stone-700 disabled:opacity-50">
        {busy ? '…' : 'OK'}
      </button>
      <button onClick={() => { setOuvert(false); setValeur(dateActuelle) }} className="text-xs text-stone-400 hover:text-stone-600">
        annuler
      </button>
      {erreur && <span className="text-xs text-red-600">{erreur}</span>}
    </span>
  )
}
