'use client'

import { useState } from 'react'
import { SessionRevision } from './SessionRevision'
import { ConsultationCartes } from './ConsultationCartes'
import type { CarteRevision, CarteConsultation } from './actions'

interface Stats {
  totalCartes: number
  connues: number
  dues: number
  nouvelles: number
  aFaire: number
}

interface Props {
  stats: Stats
  file: CarteRevision[]
  toutesCartes: CarteConsultation[]
  /** Section « Quizz » rendue sous la zone Réviser (uniquement en mode accueil). */
  quizz?: React.ReactNode
}

const SUR_TITRE = 'font-ui text-xs tracking-[0.1em] text-muet uppercase'

export function QuazianDashboard({ stats, file, toutesCartes, quizz }: Props) {
  const [mode, setMode] = useState<'accueil' | 'revision' | 'consultation'>('accueil')
  const [nbRevues, setNbRevues] = useState<number | null>(null)
  const nbNouvelles = toutesCartes.filter((c) => c.nouvelle).length

  function handleTermine(nb: number) {
    setNbRevues(nb)
    setMode('accueil')
  }

  if (mode === 'consultation') {
    return <ConsultationCartes cartes={toutesCartes} onRetour={() => setMode('accueil')} />
  }

  if (mode === 'revision') {
    if (file.length === 0) {
      return (
        <div className="text-center py-16 text-muet">
          <p>Aucune carte à réviser pour l'instant.</p>
          <button onClick={() => setMode('accueil')} className="mt-4 text-sm underline">
            Retour
          </button>
        </div>
      )
    }
    return <SessionRevision cartes={file} onTermine={handleTermine} />
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      {/* Confirmation post-session */}
      {nbRevues !== null && (
        <div className="bg-ok-teinte border border-ok rounded-xl p-4 text-sm text-ok">
          ✓ {nbRevues} carte{nbRevues > 1 ? 's' : ''} révisée{nbRevues > 1 ? 's' : ''} — bien joué !
        </div>
      )}

      {/* ── Zone RÉVISER ──────────────────────────────────────────────────── */}
      <section>
        <h3 className={`${SUR_TITRE} mb-3`}>Réviser</h3>

        {/* 2 stats : à réviser / au total */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`border rounded-xl p-4 text-center ${stats.aFaire > 0 ? 'bg-attention-teinte border-attention' : 'bg-surface border-bordure'}`}>
            <p className={`font-titre text-3xl ${stats.aFaire > 0 ? 'text-attention' : 'text-encre'}`}>{stats.aFaire}</p>
            <p className="text-xs text-muet mt-1">à réviser aujourd'hui</p>
          </div>
          <div className="bg-surface border border-bordure rounded-xl p-4 text-center">
            <p className="font-titre text-3xl text-encre">{stats.totalCartes}</p>
            <p className="text-xs text-muet mt-1">cartes au total</p>
          </div>
        </div>

        {/* CTA + consultation */}
        <div className="space-y-3">
          {stats.aFaire > 0 ? (
            <button
              onClick={() => { setNbRevues(null); setMode('revision') }}
              className="w-full py-4 bg-bouton text-surface rounded-xl hover:opacity-90 transition-colors font-medium"
            >
              Réviser mes {stats.aFaire} carte{stats.aFaire > 1 ? 's' : ''}
            </button>
          ) : (
            <div className="w-full py-4 bg-ok-teinte border border-ok text-ok rounded-xl text-center text-sm">
              ✓ Toutes les cartes sont à jour — reviens demain !
            </div>
          )}

          {toutesCartes.length > 0 && (
            <button
              onClick={() => setMode('consultation')}
              className="w-full py-3 bg-surface border border-bordure text-encre-douce rounded-xl hover:border-pigment transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              Consulter toutes mes cartes
              {nbNouvelles > 0 && (
                <span className="text-xs bg-attention-teinte text-attention px-2 py-0.5 rounded-full">{nbNouvelles} nouvelle{nbNouvelles > 1 ? 's' : ''}</span>
              )}
            </button>
          )}

          {stats.totalCartes === 0 && (
            <p className="text-center text-muet text-sm">
              Ton professeur n'a pas encore publié de cartes.
            </p>
          )}
        </div>
      </section>

      {/* ── Zone QUIZZ ────────────────────────────────────────────────────── */}
      {quizz && (
        <section>
          <h3 className={`${SUR_TITRE} mb-3`}>Quizz</h3>
          {quizz}
        </section>
      )}
    </div>
  )
}
