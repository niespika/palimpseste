'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { creerQuizz } from './actions'

interface Unite {
  id: string
  label: string
  classe: string | null
  ordre: number
}

interface ClasseOption {
  id: string
  nom: string
}

export function CreerQuizz({ unites, classes }: { unites: Unite[]; classes: ClasseOption[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  function toggleUnite(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (selected.length === 0) { setErreur('Sélectionne au moins une unité.'); return }
    setLoading(true)
    setErreur(null)

    const fd = new FormData(e.currentTarget)
    selected.forEach((id) => fd.append('scope_unites', id))

    const res = await creerQuizz(fd)
    if (res.error) {
      setErreur(res.error)
      setLoading(false)
    } else {
      router.push(`/prof/quazian/quizz/${res.quizId}`)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 bg-stone-800 text-white text-sm rounded-xl hover:bg-stone-900 transition-colors"
      >
        + Créer un nouveau quizz
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-stone-700">Nouveau quizz</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-600 text-xs">
          Annuler
        </button>
      </div>

      {/* Unités */}
      <div className="mb-4">
        <p className="text-xs text-stone-500 mb-2">Unités couvertes (périmètre des questions)</p>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {unites.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer py-1">
              <input
                type="checkbox"
                checked={selected.includes(u.id)}
                onChange={() => toggleUnite(u.id)}
                className="accent-stone-700"
              />
              <span className="text-stone-800">{u.label}</span>
              {u.classe && <span className="text-stone-400 text-xs">{u.classe}</span>}
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <p className="text-xs text-stone-400 mt-1">{selected.length} unité{selected.length > 1 ? 's' : ''} sélectionnée{selected.length > 1 ? 's' : ''}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-stone-500 mb-1 block">Classe</label>
          <select
            name="classe_id"
            defaultValue=""
            required
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
          >
            <option value="" disabled>Choisir une classe…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-stone-500 mb-1 block">Durée (min)</label>
          <input
            type="number"
            name="duree_min"
            defaultValue={25}
            min={5}
            max={90}
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
          />
        </div>
      </div>

      {erreur && <p className="text-xs text-red-600 mb-3">{erreur}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Génération des questions en cours…' : '✦ Générer les questions avec l’IA'}
      </button>
    </form>
  )
}
