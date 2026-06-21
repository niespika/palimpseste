'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { soumettreVf } from './actions'

interface Props {
  livreId: string
  semaine: number
  valeurInitiale?: string
}

// Réécriture : version finale du résumé, après le retour 1 → soumission (VF).
export default function FormulaireVf({ livreId, semaine, valeurInitiale = '' }: Props) {
  const router = useRouter()
  const [vf, setVf] = useState(valeurInitiale)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    if (!vf.trim()) { setErreur('Écris ta version finale.'); return }
    setChargement(true)
    try {
      const res = await soumettreVf(livreId, semaine, vf)
      if (res?.error) { setErreur(res.error); return }
      router.refresh()
    } finally {
      setChargement(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Ta version finale <span className="font-normal">(réécris ton résumé en tenant compte du retour 1)</span></label>
        <textarea
          value={vf}
          onChange={e => setVf(e.target.value)}
          rows={7}
          placeholder="Réécris ton résumé : corrige, précise, approfondis."
          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y text-stone-900"
        />
      </div>
      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
      <button type="submit" disabled={chargement} className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50">
        {chargement ? 'Envoi…' : 'Soumettre ma version finale'}
      </button>
    </form>
  )
}
