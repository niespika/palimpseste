'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { definirJoursCours } from './actions'

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] // 0 = lundi … 6 = dimanche

function LigneClasse({ classe }: { classe: { id: string; nom: string; weekdays: number[] } }) {
  const router = useRouter()
  const [sel, setSel] = useState<number[]>(classe.weekdays)
  const [busy, setBusy] = useState(false)

  async function basculer(w: number) {
    const next = sel.includes(w) ? sel.filter((x) => x !== w) : [...sel, w].sort((a, b) => a - b)
    setSel(next)
    setBusy(true)
    await definirJoursCours(classe.id, next)
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="bg-surface border border-bordure rounded-xl px-5 py-3 flex items-center justify-between gap-3">
      <span className="font-medium text-encre truncate">{classe.nom}</span>
      <div className={`flex gap-1 ${busy ? 'opacity-50' : ''}`}>
        {JOURS.map((lbl, w) => {
          const actif = sel.includes(w)
          return (
            <button
              key={w}
              onClick={() => basculer(w)}
              disabled={busy}
              className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                actif ? 'bg-bouton text-surface' : 'bg-parchemin-fonce text-muet hover:bg-bordure'
              }`}
              title={['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'][w]}
            >
              {lbl}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function GestionJoursCours({
  classes,
}: {
  classes: { id: string; nom: string; weekdays: number[] }[]
}) {
  if (classes.length === 0) {
    return <p className="text-sm text-muet">Aucune classe active.</p>
  }
  return (
    <div className="space-y-2">
      {classes.map((c) => (
        <LigneClasse key={c.id} classe={c} />
      ))}
    </div>
  )
}
