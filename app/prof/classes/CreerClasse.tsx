'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { creerClasse } from './actions'

export function CreerClasse() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErreur(null)
    const res = await creerClasse(new FormData(e.currentTarget))
    if (res?.error) {
      setErreur(res.error)
      setLoading(false)
    } else {
      setOpen(false)
      setLoading(false)
      router.refresh()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 bg-bouton text-surface text-sm rounded-xl hover:opacity-90 transition-colors"
      >
        + Créer une classe
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-bordure rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-encre-douce">Nouvelle classe</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-muet hover:text-encre-douce text-xs">
          Annuler
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muet mb-1 block">Nom *</label>
          <input name="nom" required placeholder="Ex. Terminale HLP" className="w-full px-3 py-2 text-sm border border-bordure rounded-lg" />
        </div>
        <div>
          <label className="text-xs text-muet mb-1 block">Année scolaire *</label>
          <input name="annee_scolaire" required placeholder="Ex. 2025-2026" className="w-full px-3 py-2 text-sm border border-bordure rounded-lg" />
        </div>
        <div>
          <label className="text-xs text-muet mb-1 block">Niveau</label>
          <select name="niveau" defaultValue="" className="w-full px-3 py-2 text-sm border border-bordure rounded-lg bg-surface">
            <option value="">—</option>
            <option value="1ere">Première</option>
            <option value="terminale">Terminale</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muet mb-1 block">Filière</label>
          <input name="filiere" placeholder="Ex. HLP, Philo tronc commun" className="w-full px-3 py-2 text-sm border border-bordure rounded-lg" />
        </div>
      </div>

      {erreur && <p className="text-xs text-retard mt-3">{erreur}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 px-4 py-2 bg-bouton text-surface text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Création…' : 'Créer la classe'}
      </button>
    </form>
  )
}
