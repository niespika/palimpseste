'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { reglerCompterFragments } from './actions'

// Réglage prof du budget (§7.3) : cadence de comptage de la part Fragments dans le budget
// temps de la panoptique. Défaut 'hebdo' (la réalité du module — la chip HLP naît souvent
// saturée) ; 'quinzaine' pour le prof qui alterne fragment/lecture une semaine sur deux.
export default function ReglageFragments({ planId, valeur }: { planId: string; valeur: 'hebdo' | 'quinzaine' | 'non' }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function changer(v: 'hebdo' | 'quinzaine' | 'non') {
    if (v === valeur) return
    setErr(null); setBusy(true)
    const res = await reglerCompterFragments(planId, v)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 flex-wrap font-ui text-[12px]">
      <span className="text-muet">Fragments :</span>
      <select
        value={valeur}
        disabled={busy}
        onChange={(e) => changer(e.target.value as 'hebdo' | 'quinzaine' | 'non')}
        className="border border-bordure-bouton rounded bg-white px-1.5 py-0.5"
        aria-label="Cadence de comptage des fragments dans le budget temps"
      >
        <option value="hebdo">chaque semaine</option>
        <option value="quinzaine">une semaine sur deux</option>
        <option value="non">ne pas compter</option>
      </select>
      {err && <span className="text-retard">{err}</span>}
    </div>
  )
}
