'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FUSEAUX } from '@/utils/fuseau'
import { definirFuseau } from './actions'

// Sélecteur du fuseau horaire d'affichage (réglage global, cf. calendrier_params).
// Le fuseau pilote l'affichage des heures (intégrité, quizz, échéances, photos…)
// et le jour des événements du calendrier. Les dates pures (semestres/vacances)
// ne sont pas affectées.
export default function GestionFuseau({ fuseau }: { fuseau: string }) {
  const router = useRouter()
  const [valeur, setValeur] = useState(fuseau)
  const [busy, setBusy] = useState(false)
  const modifie = valeur !== fuseau
  // Garde la valeur courante visible même si elle sort un jour de la liste curée.
  const options = FUSEAUX.some((f) => f.id === fuseau) ? FUSEAUX : [{ id: fuseau, label: fuseau }, ...FUSEAUX]

  async function enregistrer() {
    setBusy(true)
    const res = await definirFuseau(valeur)
    setBusy(false)
    if (res.error) {
      alert(res.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="bg-surface border border-bordure rounded-xl px-5 py-3 flex items-center justify-between gap-3">
      <select
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        aria-label="Fuseau horaire d’affichage"
        className="border border-bordure rounded-lg px-3 py-2 text-sm text-encre bg-surface focus:outline-none focus:ring-2 focus:ring-pigment max-w-full"
      >
        {options.map((f) => (
          <option key={f.id} value={f.id}>{f.label}</option>
        ))}
      </select>
      {modifie && (
        <button
          onClick={enregistrer}
          disabled={busy}
          className="text-xs bg-bouton text-surface px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 flex-shrink-0"
        >
          {busy ? '…' : 'Enregistrer'}
        </button>
      )}
    </div>
  )
}
