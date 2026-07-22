'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { regenererSyntheseRag } from './actions'

// Secours du cron (RAG L7, §15.8) : (re)génère la synthèse de la SEMAINE ÉCOULÉE
// pour la classe. Un re-run écrase proprement (unique classe × semaine).
export default function BoutonRegenererSynthese({ classeId }: { classeId: string }) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function lancer() {
    if (!confirm('(Re)générer la synthèse de la semaine écoulée ? (un appel IA est facturé s’il y a eu de l’activité)')) return
    setErreur(null)
    setChargement(true)
    const res = await regenererSyntheseRag(classeId)
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={lancer}
        disabled={chargement}
        className="text-xs border border-bordure rounded px-2 py-1 text-encre-douce hover:bg-parchemin-fonce disabled:opacity-50"
      >
        {chargement ? 'Génération…' : '(Re)générer la semaine écoulée'}
      </button>
      {erreur && <span className="text-xs text-retard">⚠ {erreur}</span>}
    </div>
  )
}
