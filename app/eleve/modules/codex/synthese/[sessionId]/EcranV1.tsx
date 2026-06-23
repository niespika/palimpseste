'use client'

import { useState, useEffect, useCallback } from 'react'
import { chargerEtatTravail, reinitialiserPhotos, type EtatTravail, type SuggestionsV1 } from '../../actions'
import { CaptureManuscrit } from './CaptureManuscrit'

export function EcranV1({ sessionId, initial }: { sessionId: string; initial: EtatTravail }) {
  const [etat, setEtat] = useState(initial)
  const [reset, setReset] = useState(false)

  const statut = etat.analyse_v1_statut
  const enAnalyse = etat.photos_v1_count > 0 && statut === 'en_cours'

  const rafraichir = useCallback(async () => {
    const e = await chargerEtatTravail(sessionId)
    setEtat(e)
  }, [sessionId])

  useEffect(() => {
    if (!enAnalyse) return
    const interval = setInterval(rafraichir, 4000)
    return () => clearInterval(interval)
  }, [enAnalyse, rafraichir])

  async function handleRecommencer() {
    if (!confirm('Recommencer ta V1 ? Les photos et suggestions seront effacées.')) return
    setReset(true)
    await reinitialiserPhotos(sessionId, 'v1')
    await rafraichir()
    setReset(false)
  }

  // 1) Pas encore envoyée → capture
  if (etat.photos_v1_count === 0 || statut === 'vide') {
    return (
      <div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
          Écris ta synthèse <strong>de mémoire</strong>, livre fermé. Quand tu as fini, photographie ta feuille et envoie-la.
        </div>
        <CaptureManuscrit
          sessionId={sessionId}
          phase="v1"
          ctaLabel="Envoyer ma V1"
          onEnvoye={() => setEtat((p) => ({ ...p, photos_v1_count: 1, analyse_v1_statut: 'en_cours' }))}
        />
      </div>
    )
  }

  // 2) Analyse en cours
  if (statut === 'en_cours') {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
        <div className="inline-block w-6 h-6 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin mb-3" />
        <p className="text-sm text-stone-600">Analyse de ta V1 en cours…</p>
        <p className="text-xs text-stone-400 mt-1">Tes suggestions s&apos;afficheront ici dans un instant.</p>
      </div>
    )
  }

  // 3) Erreur
  if (statut === 'erreur') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-sm text-red-700 mb-3">L&apos;analyse n&apos;a pas abouti.</p>
        <button onClick={handleRecommencer} disabled={reset} className="text-sm text-stone-700 underline">
          {reset ? '…' : 'Reprendre la photo'}
        </button>
      </div>
    )
  }

  // 4) Suggestions prêtes
  return (
    <div>
      <SuggestionsAffichage suggestions={etat.suggestions_v1} />
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        Garde ces suggestions <strong>sous les yeux</strong> : quand le professeur lancera la phase 2, tu réécriras ta synthèse en les corrigeant.
      </div>
      <button onClick={handleRecommencer} disabled={reset} className="mt-4 text-xs text-stone-400 hover:text-red-600">
        {reset ? '…' : 'Refaire ma V1'}
      </button>
    </div>
  )
}

export function SuggestionsAffichage({ suggestions }: { suggestions: SuggestionsV1 | null }) {
  if (!suggestions) {
    return <p className="text-sm text-stone-400 text-center py-6">Aucune suggestion.</p>
  }
  const { oublis, erreurs, ortho } = suggestions

  return (
    <div className="space-y-5">
      {oublis.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
            <span className="text-amber-500">○</span> Ce que tu as oublié
          </h3>
          <div className="space-y-2">
            {oublis.map((o, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-xl p-3">
                <p className="text-sm font-medium text-stone-800">{o.titre}</p>
                {o.detail && <p className="text-sm text-stone-600 mt-1 leading-relaxed">{o.detail}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {erreurs.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
            <span className="text-red-500">△</span> Erreurs et ambiguïtés
          </h3>
          <div className="space-y-2">
            {erreurs.map((e, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${e.type === 'factuelle' ? 'bg-red-100 text-red-600' : 'bg-violet-100 text-violet-600'}`}>
                    {e.type === 'factuelle' ? 'erreur' : 'à nuancer'}
                  </span>
                  <p className="text-sm font-medium text-stone-800">{e.titre}</p>
                </div>
                {e.detail && <p className="text-sm text-stone-600 mt-1 leading-relaxed">{e.detail}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {ortho && (
        <section>
          <h3 className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
            <span className="text-stone-400">✎</span> Langue
          </h3>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
            <p className="text-sm text-stone-600 leading-relaxed">{ortho}</p>
          </div>
        </section>
      )}
    </div>
  )
}
