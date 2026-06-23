'use client'

import { useState } from 'react'
import { type EtatTravail } from '../../actions'
import { CaptureManuscrit } from './CaptureManuscrit'
import { SuggestionsAffichage } from './EcranV1'

export function EcranVF({ sessionId, initial }: { sessionId: string; initial: EtatTravail }) {
  const [envoyee, setEnvoyee] = useState(initial.photos_vf_count > 0)

  if (envoyee) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h3 className="text-base font-medium text-stone-800 mb-1">V-finale envoyée</h3>
        <p className="text-sm text-stone-500">
          Ton retour sera disponible une fois que ton professeur l&apos;aura validé.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rappel des suggestions V1, sous les yeux */}
      <div>
        <h3 className="text-sm font-medium text-stone-700 mb-2">Tes suggestions de la V1 — à corriger</h3>
        {initial.suggestions_v1 ? (
          <SuggestionsAffichage suggestions={initial.suggestions_v1} />
        ) : (
          <p className="text-sm text-stone-400">Aucune suggestion enregistrée pour la V1.</p>
        )}
      </div>

      <div className="border-t border-stone-200 pt-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
          Réécris ta synthèse <strong>en entier</strong> en tenant compte des suggestions ci-dessus, puis photographie-la.
        </div>
        <CaptureManuscrit
          sessionId={sessionId}
          phase="vf"
          ctaLabel="Envoyer ma V-finale"
          onEnvoye={() => setEnvoyee(true)}
        />
      </div>
    </div>
  )
}
