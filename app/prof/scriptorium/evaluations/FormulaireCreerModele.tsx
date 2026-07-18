'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChampDate from '@/app/prof/calendrier/config/ChampDate'
import { creerModele } from './modele-actions'

const GABARITS = [
  { v: 'tc', label: 'Tronc commun', desc: '1 exercice/sem — cycle écriture → écriture → lecture' },
  { v: 'hlp', label: 'HLP', desc: 'même cycle (fragments / lecture de livre suivent leur propre échéancier)' },
  { v: 'vierge', label: 'Vierge', desc: 'aucun exercice généré — tout à la main' },
] as const

export default function FormulaireCreerModele({ defautDate }: { defautDate: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(null)
    setLoading(true)
    const res = await creerModele(new FormData(e.currentTarget))
    setLoading(false)
    if (res.error) {
      setErreur(res.error)
      return
    }
    if (res.id) router.push(`/prof/scriptorium?vue=modeles&modele=${res.id}`)
    else router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-bordure rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-encre">Nouveau modèle de plan (sans classe)</h3>
        <p className="text-xs text-muet mt-1">
          Un modèle est un gabarit d’année, conçu une fois, puis assigné à une ou plusieurs classes.
        </p>
      </div>

      <div className="w-full max-w-md">
        <label className="block text-xs text-muet mb-1">Titre</label>
        <input
          name="titre"
          required
          placeholder="ex. Terminale tronc commun — 2026"
          className="w-full border border-bordure rounded-lg bg-surface px-2 py-1.5 text-sm text-encre"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs text-muet mb-1">Gabarit de cadence</legend>
        {GABARITS.map((g) => (
          <label
            key={g.v}
            className="flex items-start gap-2 border border-bordure rounded-lg p-2 cursor-pointer hover:border-encre-douce"
          >
            <input type="radio" name="gabarit" value={g.v} required className="mt-1" />
            <span>
              <span className="text-sm text-encre">{g.label}</span>
              <span className="block text-xs text-muet">{g.desc}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="w-56">
        <label className="block text-xs text-muet mb-1">Date de début (ancre par défaut)</label>
        <ChampDate name="date_debut" defaultValue={defautDate ?? ''} ariaLabel="Date de début du modèle" />
        {!defautDate && (
          <p className="text-xs text-attention mt-1">
            Aucun semestre à venir défini — définis les semestres de la rentrée dans le Calendrier.
          </p>
        )}
      </div>

      {erreur && <p className="text-xs text-retard">{erreur}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-bouton text-surface text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Création…' : 'Créer le modèle (brouillon)'}
      </button>
    </form>
  )
}
