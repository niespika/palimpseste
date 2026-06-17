'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { creerEpreuve } from '../essai-actions'

interface ClasseRef { id: string; nom: string }

export default function FormulaireNouvelleEpreuve({ classes, semestreId }: { classes: ClasseRef[]; semestreId: string }) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  // Sélection de classes + date propre à chacune.
  const [dates, setDates] = useState<Record<string, string>>({})

  function toggleClasse(id: string) {
    setDates(prev => {
      const n = { ...prev }
      if (id in n) delete n[id]
      else n[id] = ''
      return n
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(null)
    const f = new FormData(e.currentTarget)
    const classesChoisies = Object.entries(dates).map(([classe_id, date_epreuve]) => ({ classe_id, date_epreuve }))
    if (classesChoisies.length === 0) { setErreur('Choisis au moins une classe.'); return }
    if (classesChoisies.some(c => !c.date_epreuve)) { setErreur('Renseigne une date pour chaque classe choisie.'); return }

    setChargement(true)
    const res = await creerEpreuve({
      titre: f.get('titre') as string,
      duree_minutes: Number(f.get('duree_minutes')),
      consignes: (f.get('consignes') as string) || undefined,
      semestreId,
      classes: classesChoisies,
    })
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    setOuvert(false)
    setDates({})
    router.refresh()
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

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Durée (min)</label>
        <input
          name="duree_minutes"
          type="number"
          required
          defaultValue={60}
          min={15}
          max={240}
          className="w-40 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Consignes <span className="font-normal">(optionnel — affiché à l&apos;élève)</span></label>
        <textarea
          name="consignes"
          rows={3}
          placeholder="Ex. : Réponds à ta question en mobilisant les connaissances acquises dans tes fragments…"
          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-2">
          Classes concernées <span className="font-normal">(une date par classe)</span>
        </label>
        {classes.length === 0 ? (
          <p className="text-sm text-stone-400">Aucune classe avec le module sur ce semestre.</p>
        ) : (
          <div className="space-y-2">
            {classes.map(c => {
              const choisie = c.id in dates
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer w-40">
                    <input type="checkbox" checked={choisie} onChange={() => toggleClasse(c.id)} className="rounded" />
                    <span className="text-sm text-stone-700">{c.nom}</span>
                  </label>
                  <input
                    type="date"
                    value={dates[c.id] ?? ''}
                    onChange={e => setDates(prev => ({ ...prev, [c.id]: e.target.value }))}
                    disabled={!choisie}
                    className="px-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-stone-50 disabled:text-stone-300"
                  />
                </div>
              )
            })}
          </div>
        )}
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
