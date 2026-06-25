'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { soumettreVf } from './actions'

interface Props {
  livreId: string
  semaine: number
  theseInitial?: string
  argumentsInitial?: string
  accordInitial?: string
}

const champClasse =
  'w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre'

// Réécriture (VF) — 3 champs retravaillés (SPEC §1) : idée principale, arguments,
// accord. Les questions et le vocabulaire ne se réécrivent pas. Pré-rempli avec la V1.
export default function FormulaireVf({ livreId, semaine, theseInitial = '', argumentsInitial = '', accordInitial = '' }: Props) {
  const router = useRouter()
  const [these, setThese] = useState(theseInitial)
  const [args, setArgs] = useState(argumentsInitial)
  const [accord, setAccord] = useState(accordInitial)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [avertissement, setAvertissement] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    if (!these.trim()) { setErreur('Réécris l’idée principale.'); return }
    if (!args.trim()) { setErreur('Réécris les arguments.'); return }
    if (!accord.trim()) { setErreur('Réécris ton accord.'); return }
    setChargement(true)
    try {
      const res = await soumettreVf(livreId, semaine, { these_vf: these, arguments_vf: args, accord_vf: accord })
      if (res?.error) { setErreur(res.error); return }
      if (res?.avertissement) { setAvertissement(res.avertissement); return }
      router.refresh()
    } finally {
      setChargement(false)
    }
  }

  if (avertissement) {
    return (
      <div className="bg-attention-teinte border border-attention rounded-xl p-5 space-y-3">
        <p className="text-sm text-attention">{avertissement}</p>
        <button onClick={() => router.refresh()}
          className="text-sm font-medium text-attention underline hover:opacity-80">
          J’ai compris →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-muet">Reprends tes trois champs en tenant compte du retour : corrige, précise, approfondis.</p>
      <div>
        <label className="block text-xs font-medium text-muet mb-1">Idée principale</label>
        <textarea value={these} onChange={e => setThese(e.target.value)} rows={3} className={champClasse} />
      </div>
      <div>
        <label className="block text-xs font-medium text-muet mb-1">Arguments</label>
        <textarea value={args} onChange={e => setArgs(e.target.value)} rows={4} className={champClasse} />
      </div>
      <div>
        <label className="block text-xs font-medium text-muet mb-1">Ton accord</label>
        <textarea value={accord} onChange={e => setAccord(e.target.value)} rows={3} className={champClasse} />
      </div>
      {erreur && <p className="text-retard text-sm">{erreur}</p>}
      <button type="submit" disabled={chargement}
        className="w-full bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
        {chargement ? 'Envoi…' : 'Soumettre ma version finale'}
      </button>
    </form>
  )
}
