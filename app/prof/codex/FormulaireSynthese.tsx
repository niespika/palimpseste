'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { creerSynthese } from './actions'

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

export function FormulaireSynthese({ unites, classes }: { unites: Unite[]; classes: ClasseOption[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErreur(null)

    const fd = new FormData(e.currentTarget)
    const res = await creerSynthese(fd)
    if (res.error) {
      setErreur(res.error)
      setLoading(false)
    } else {
      setOpen(false)
      setLoading(false)
      router.refresh()
    }
  }

  if (unites.length === 0) {
    return (
      <div className="bg-attention-teinte border border-attention rounded-xl p-4 text-sm text-attention">
        Aucune unité dans le Scriptorium. Crée d&apos;abord une unité et dépose le cours avant de lancer une synthèse.
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 bg-bouton text-surface text-sm rounded-xl hover:opacity-90 transition-colors"
      >
        + Nouvelle synthèse
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-bordure rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-encre-douce">Nouvelle synthèse</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-muet hover:text-encre-douce text-xs">
          Annuler
        </button>
      </div>

      <div className="mb-4">
        <label className="text-xs text-muet mb-1 block">Unité du Scriptorium (le sujet de la synthèse)</label>
        <select
          name="scriptorium_unite_id"
          required
          defaultValue=""
          className="w-full px-3 py-2 text-sm border border-bordure rounded-lg bg-surface"
        >
          <option value="" disabled>Choisir une unité…</option>
          {unites.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}{u.classe ? ` — ${u.classe}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
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
          <label className="text-xs text-muet mb-1 block">Durée par phase (min)</label>
          <input
            type="number"
            name="duree_phase_min"
            defaultValue={25}
            min={5}
            max={60}
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
        {loading ? 'Création…' : 'Créer la synthèse (brouillon)'}
      </button>
    </form>
  )
}
