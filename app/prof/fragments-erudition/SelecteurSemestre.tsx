'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { definirSemestreFragments } from './actions'

interface Props {
  semestres: Array<{ id: string; label: string; courant: boolean }>
  semestreActifId: string | null
}

export default function SelecteurSemestre({ semestres, semestreActifId }: Props) {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()

  if (semestres.length === 0) return null

  function changer(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    demarrer(async () => {
      await definirSemestreFragments(id)
      router.refresh()
    })
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-stone-500">Semestre</span>
      <select
        value={semestreActifId ?? ''}
        onChange={changer}
        disabled={enCours}
        className="border border-stone-300 rounded-lg px-2 py-1 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50"
      >
        {semestres.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}{s.courant ? ' · courant' : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
