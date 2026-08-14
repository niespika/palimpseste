'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { CarteConsultation } from './actions'

// Mode consultation (Lot 11) : parcourir ses cartes avec leur réponse, sans
// impact sur la révision. Les cartes récemment ajoutées sont repérables.
//
// C7·L3 — la consultation s'ouvre PAR COURS (une tuile = un cours) : le titre
// n'est plus un intertitre répété au-dessus de chaque groupe, c'est l'en-tête de
// l'écran. Le retour est un lien (l'état vit dans l'URL, `?cours=`), pour que
// l'élève retrouve son cours en revenant en arrière.
export function ConsultationCartes({
  cartes, titre, retourHref,
}: {
  cartes: CarteConsultation[]
  titre: string
  retourHref: string
}) {
  const [filtreNouvelles, setFiltreNouvelles] = useState(false)
  const nbNouvelles = cartes.filter((c) => c.nouvelle).length
  const visibles = filtreNouvelles ? cartes.filter((c) => c.nouvelle) : cartes

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link href={retourHref} className="text-sm text-encre-douce hover:text-encre">← Retour</Link>
        <span className="text-xs text-muet">{cartes.length} carte{cartes.length > 1 ? 's' : ''}</span>
      </div>

      <h3 className="font-ui font-medium text-encre">{titre}</h3>

      {nbNouvelles > 0 && (
        <button
          onClick={() => setFiltreNouvelles((v) => !v)}
          className="w-full rounded-xl px-4 py-3 text-sm border bg-attention-teinte border-attention text-attention transition-colors hover:opacity-90"
        >
          ✦ {nbNouvelles} carte{nbNouvelles > 1 ? 's' : ''} ajoutée{nbNouvelles > 1 ? 's' : ''} récemment
          <span className="text-xs ml-1">— {filtreNouvelles ? 'tout afficher' : 'voir seulement celles-ci'}</span>
        </button>
      )}

      {visibles.length === 0 ? (
        <p className="text-center text-muet text-sm py-10">Aucune carte pour l&apos;instant.</p>
      ) : (
        <div className="space-y-2">
          {visibles.map((c) => (
            <div key={c.flashcard_id} className="bg-surface border border-bordure rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-encre">{c.recto}</p>
                {c.nouvelle && <span className="text-xs bg-attention-teinte text-attention px-1.5 py-0.5 rounded-full flex-shrink-0">Nouvelle</span>}
              </div>
              <p className="text-sm text-encre-douce mt-2 border-t border-bordure pt-2 whitespace-pre-wrap">{c.verso}</p>
              {c.concept_tag && <p className="text-xs text-muet mt-2">{c.concept_tag}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
