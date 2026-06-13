'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { creerEpreuve } from '../essai-actions'

export default function FormulaireNouvelleEpreuve() {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    setErreur(null)
    const f = new FormData(e.currentTarget)
    const res = await creerEpreuve({
      titre: f.get('titre') as string,
      date_epreuve: f.get('date_epreuve') as string,
      duree_minutes: Number(f.get('duree_minutes')),
      consignes: (f.get('consignes') as string) || undefined,
    })
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    setOuvert(false)
    router.push(`/prof/fragments-erudition/epreuves/${res.data!.epreuveId}`)
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors"
      >
        + Nouvelle épreuve
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
      <h4 className="text-sm font-medium text-stone-900">Nouvelle épreuve</h4>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Titre</label>
        <input
          name="titre"
          required
          placeholder="Ex. : Essai final — juin"
          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Date</label>
          <input
            name="date_epreuve"
            type="date"
            required
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Durée (min)</label>
          <input
            name="duree_minutes"
            type="number"
            required
            defaultValue={60}
            min={15}
            max={240}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Consignes <span className="font-normal">(optionnel — affiché à l'élève)</span></label>
        <textarea
          name="consignes"
          rows={3}
          placeholder="Ex. : Réponds à ta question en mobilisant les connaissances acquises dans tes fragments…"
          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
        />
      </div>

      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={chargement}
          className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50"
        >
          {chargement ? '…' : 'Créer'}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">
          Annuler
        </button>
      </div>
    </form>
  )
}
