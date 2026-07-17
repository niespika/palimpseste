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
    <div className="flex items-center gap-2 flex-wrap text-xs">
      <span className="text-muet">Budget — part Fragments :</span>
      <select
        value={valeur}
        disabled={busy}
        onChange={(e) => changer(e.target.value as 'hebdo' | 'quinzaine' | 'non')}
        className="border border-bordure rounded bg-surface px-1 py-0.5"
        aria-label="Cadence de comptage des fragments dans le budget"
      >
        <option value="hebdo">chaque semaine</option>
        <option value="quinzaine">une semaine sur deux</option>
        <option value="non">ne pas compter</option>
      </select>
      {err && <span className="text-retard">{err}</span>}
    </div>
  )
}
