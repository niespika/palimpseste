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
        className="w-full py-3 bg-bouton text-surface text-sm rounded-xl hover:opacity-90 transition-colors"
      >
        + Créer un nouveau quizz
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-bordure rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-encre-douce">Nouveau quizz</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-muet hover:text-encre-douce text-xs">
          Annuler
        </button>
      </div>

      {/* Unités */}
      <div className="mb-4">
        <p className="text-xs text-muet mb-2">Unités couvertes (périmètre des questions)</p>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {unites.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer py-1">
              <input
                type="checkbox"
                checked={selected.includes(u.id)}
                onChange={() => toggleUnite(u.id)}
                className="accent-pigment"
              />
              <span className="text-encre">{u.label}</span>
              {u.classe && <span className="text-muet text-xs">{u.classe}</span>}
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <p className="text-xs text-muet mt-1">{selected.length} unité{selected.length > 1 ? 's' : ''} sélectionnée{selected.length > 1 ? 's' : ''}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-muet mb-1 block">Classe</label>
          <select
            name="classe_id"
            defaultValue=""
            required
            className="w-full px-3 py-2 text-sm border border-bordure rounded-lg bg-surface"
          >
            <option value="" disabled>Choisir une classe…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muet mb-1 block">Nombre de questions</label>
          <input
            type="number"
            name="nb_questions"
            defaultValue={20}
            min={3}
            max={60}
            className="w-full px-3 py-2 text-sm border border-bordure rounded-lg"
          />
        </div>
        <div>
          <label className="text-xs text-muet mb-1 block">Durée (min)</label>
          <input
            type="number"
            name="duree_min"
            defaultValue={25}
            min={5}
            max={90}
            className="w-full px-3 py-2 text-sm border border-bordure rounded-lg"
          />
        </div>
      </div>

      {erreur && <p className="text-xs text-retard mb-3">{erreur}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-bouton text-surface text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Génération des questions en cours…' : '✦ Générer les questions avec l’IA'}
      </button>
    </form>
  )
}
