'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { creerParcours } from '../actions'

// Création d'un parcours (titre + nb de semaines) → ouvre directement son détail.
// `triggerClassName` / `triggerLabel` permettent à l'accueil charte de poser le
// bouton estompé noyer ; le comportement (creerParcours → détail) est inchangé.
export default function FormulaireParcours({
  triggerClassName = 'w-full bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-colors',
  triggerLabel = '+ Nouveau parcours',
}: {
  triggerClassName?: string
  triggerLabel?: string
} = {}) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(null)
    const fd = new FormData(e.currentTarget)
    setChargement(true)
    const res = await creerParcours(fd)
    setChargement(false)
    if (res.error || !res.id) { setErreur(res.error ?? 'Création impossible.'); return }
    setOuvert(false)
    router.push(`/prof/scriptorium?vue=parcours&parcours=${res.id}`)
  }

  if (!ouvert) {
    return (
      <button onClick={() => setOuvert(true)} className={triggerClassName}>
        {triggerLabel}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-bordure rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-medium text-encre">Nouveau parcours</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          name="titre"
          required
          placeholder="Titre (ex. : Le bonheur — T. HLP)"
          className="sm:col-span-2 px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
        />
        <input
          name="nbSemaines"
          type="number"
          min={1}
          max={52}
          required
          placeholder="Nb de semaines"
          className="px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
        />
      </div>
      {erreur && <p className="text-retard text-sm">{erreur}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={chargement} className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
          {chargement ? '…' : 'Créer'}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">
          Annuler
        </button>
      </div>
    </form>
  )
}
