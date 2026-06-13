'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { creerSemestre } from '../essai-actions'

export default function FormulaireNouveauSemestre() {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    setErreur(null)
    const f = new FormData(e.currentTarget)
    const res = await creerSemestre({
      label: f.get('label') as string,
      date_debut: f.get('date_debut') as string,
      date_fin: f.get('date_fin') as string,
    })
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    setOuvert(false)
    router.push(`/prof/fragments-erudition/semestres/${res.data!.semestreId}`)
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors"
      >
        + Nouveau semestre
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
      <h4 className="text-sm font-medium text-stone-900">Nouveau semestre</h4>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Label</label>
        <input name="label" required placeholder="Ex. : Semestre 1" className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Date début</label>
          <input name="date_debut" type="date" required className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Date fin</label>
          <input name="date_fin" type="date" required className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
      </div>
      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={chargement} className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50">
          {chargement ? '…' : 'Créer'}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">Annuler</button>
      </div>
    </form>
  )
}
