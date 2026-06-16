'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { definirClasseFragments } from './actions'

interface Props {
  classes: Array<{ id: string; nom: string }>
  classeActiveId: string | null
}

export default function SelecteurClasseFragments({ classes, classeActiveId }: Props) {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()

  if (classes.length === 0) return null

  function changer(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    demarrer(async () => {
      await definirClasseFragments(id)
      router.refresh()
    })
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-stone-500">Classe</span>
      <select
        value={classeActiveId ?? ''}
        onChange={changer}
        disabled={enCours}
        className="border border-stone-300 rounded-lg px-2 py-1 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50"
      >
        {classes.map((c) => (
          <option key={c.id} value={c.id}>{c.nom}</option>
        ))}
      </select>
    </label>
  )
}
