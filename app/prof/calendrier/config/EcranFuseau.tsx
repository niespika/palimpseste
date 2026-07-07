'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FUSEAUX } from '@/utils/fuseau'
import { definirFuseau } from './actions'

// Volet Fuseau : fuseau d'affichage des heures (échéances, quizz, photos,
// intégrité) et du jour des événements du calendrier. Réglage global unique
// (calendrier_params). Les dates pures (semestres/vacances) n'en dépendent pas.
export default function EcranFuseau({ fuseau }: { fuseau: string }) {
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
    <div className="bg-surface border border-bordure rounded-xl p-5 max-w-[520px]">
      <div className="flex items-center gap-4">
        <span className="text-[15px] font-semibold text-encre flex-none">Fuseau</span>
        <select
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          aria-label="Fuseau horaire d’affichage"
          className="flex-1 min-w-0 bg-white border border-bordure-bouton rounded-lg px-3.5 py-2 text-[15px] text-encre focus:outline-none focus:ring-2 focus:ring-pigment"
        >
          {options.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        {modifie && (
          <button
            onClick={enregistrer}
            disabled={busy}
            className="font-ui text-[13px] font-semibold bg-bouton text-surface px-3.5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 flex-none"
          >
            {busy ? '…' : 'Enregistrer'}
          </button>
        )}
      </div>
      <p className="text-sm text-muet mt-3.5 leading-relaxed">
        Les dates de semestre et de vacances ne dépendent pas du fuseau — seules les heures des
        événements s&apos;y ajustent.
      </p>
    </div>
  )
}
