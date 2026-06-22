'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { lancerDiagnosticClasse } from './actions'

// Lance le diagnostic batch d'une classe (idempotent, plafonné, reprenable).
export default function BoutonLancerDiagnostic({ classeId, enAttente, aFaire }: { classeId: string; enAttente: number; aFaire: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function lancer() {
    setBusy(true); setMsg(null)
    try {
      const res = await lancerDiagnosticClasse(classeId)
      if (res.error) { setMsg(res.error); return }
      const lances = res.lances ?? 0
      setMsg(lances === 0
        ? 'Rien à diagnostiquer.'
        : `Diagnostic lancé pour ${lances} ${lances > 1 ? 'travaux' : 'travail'}${res.restants ? ` — ${res.restants} en attente, reclique dans un instant.` : '. Les niveaux apparaîtront d’ici peu (recharge la page).'}`)
      router.refresh()
    } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={lancer} disabled={busy || enAttente === 0}
        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
          aFaire ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
        }`}>
        {busy ? 'Lancement…' : aFaire ? `⚠ Diagnostic à faire (${enAttente})` : enAttente > 0 ? `Lancer le diagnostic (${enAttente})` : 'Diagnostic à jour'}
      </button>
      {msg && <span className="text-xs text-stone-500">{msg}</span>}
    </div>
  )
}
