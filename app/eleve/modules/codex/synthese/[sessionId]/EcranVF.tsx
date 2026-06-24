'use client'

import { useState } from 'react'
import { type EtatTravail } from '../../actions'
import { CaptureManuscrit } from './CaptureManuscrit'
import { SuggestionsAffichage } from './EcranV1'

export function EcranVF({ sessionId, initial, consigne }: { sessionId: string; initial: EtatTravail; consigne: string }) {
  const [envoyee, setEnvoyee] = useState(initial.photos_vf_count > 0)

  if (envoyee) {
    return (
      <div className="bg-surface border border-bordure rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h3 className="text-base font-medium text-encre mb-1">V-finale envoyée</h3>
        <p className="text-sm text-muet">
          Ton retour sera disponible une fois que ton professeur l&apos;aura validé.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rappel des suggestions V1, sous les yeux */}
      <div>
        <h3 className="text-sm font-medium text-encre-douce mb-2">Tes suggestions de la V1 — à corriger</h3>
        {initial.suggestions_v1 ? (
          <SuggestionsAffichage suggestions={initial.suggestions_v1} />
        ) : (
          <p className="text-sm text-muet">Aucune suggestion enregistrée pour la V1.</p>
        )}
      </div>

      <div className="border-t border-bordure pt-6">
        <div className="bg-attention-teinte border border-attention rounded-xl p-4 mb-4 text-sm text-attention whitespace-pre-wrap">
          {consigne}
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
