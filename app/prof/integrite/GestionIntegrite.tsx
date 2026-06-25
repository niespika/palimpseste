'use client'

import { useState, useTransition } from 'react'
import {
  actionConfirmerSignalement, actionEcarterSignalement, actionAcquitterSignalement,
  actionDebloquerEleve, sauvegarderParamsIntegrite,
} from './actions'

export interface SignalementVue {
  id: string
  eleveNom: string
  module: string
  type: string
  motif: string | null
  source: 'algo' | 'ia'
  enAttente: boolean
  date: string
}
export interface BloqueVue { eleveId: string; nom: string; strikes: number }
export interface ParamsVue { actif: boolean; seuil: number; messageStrike: string; messageBloque: string }

const carte = 'bg-surface border border-bordure rounded-xl p-5'
const champ = 'w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre'

export default function GestionIntegrite({
  bloques, signalements, params,
}: {
  bloques: BloqueVue[]
  signalements: SignalementVue[]
  params: ParamsVue
}) {
  const [pending, startTransition] = useTransition()
  const exec = (fn: () => Promise<unknown>) => startTransition(() => { void fn() })

  return (
    <div className="space-y-8">
      {/* ── Élèves bloqués ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muet uppercase tracking-wide">Élèves bloqués</h3>
        {bloques.length === 0 ? (
          <p className={`${carte} text-sm text-muet`}>Aucun élève bloqué. 🎉</p>
        ) : (
          <ul className="space-y-2">
            {bloques.map((b) => (
              <li key={b.eleveId} className={`${carte} flex items-center justify-between gap-3`}>
                <span className="text-sm text-encre">
                  {b.nom}
                  <span className="text-muet"> · {b.strikes} strike{b.strikes > 1 ? 's' : ''}</span>
                </span>
                <button
                  disabled={pending}
                  onClick={() => exec(() => actionDebloquerEleve(b.eleveId))}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg bg-ok-teinte text-ok hover:opacity-80 disabled:opacity-50"
                >
                  Débloquer (−1 strike)
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Signalements à traiter ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muet uppercase tracking-wide">Signalements à traiter</h3>
        {signalements.length === 0 ? (
          <p className={`${carte} text-sm text-muet`}>Rien à traiter pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {signalements.map((s) => (
              <li key={s.id} className={carte}>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm">
                    <p className="text-encre">
                      <span className="font-medium">{s.eleveNom}</span>
                      <span className="text-muet"> · {s.module} · {s.type}</span>
                    </p>
                    {s.motif && <p className="text-muet text-xs mt-0.5">{s.motif}</p>}
                    <p className="text-muet text-xs mt-0.5">
                      {s.source === 'ia' ? 'détecté par l’IA' : 'détecté au rendu'} · {s.date}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {s.enAttente ? (
                      <>
                        <button
                          disabled={pending}
                          onClick={() => exec(() => actionConfirmerSignalement(s.id))}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-attention-teinte text-attention hover:opacity-80 disabled:opacity-50"
                        >
                          Confirmer (+1 strike)
                        </button>
                        <button
                          disabled={pending}
                          onClick={() => exec(() => actionEcarterSignalement(s.id))}
                          className="text-xs px-3 py-1.5 rounded-lg text-muet hover:text-encre disabled:opacity-50"
                        >
                          Écarter
                        </button>
                      </>
                    ) : (
                      <button
                        disabled={pending}
                        onClick={() => exec(() => actionAcquitterSignalement(s.id))}
                        className="text-xs px-3 py-1.5 rounded-lg text-muet hover:text-encre disabled:opacity-50"
                      >
                        Vu
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muet">
          Un strike « détecté au rendu » (rendu vide / aveu) est déjà comptabilisé : « Vu » retire simplement l’alerte.
          Un signal « détecté par l’IA » (hors-sujet / bâclé) ne compte que si tu le confirmes.
        </p>
      </section>

      {/* ── Paramètres ─────────────────────────────────────────────────────── */}
      <Parametres params={params} pending={pending} exec={exec} />
    </div>
  )
}

function Parametres({
  params, pending, exec,
}: {
  params: ParamsVue
  pending: boolean
  exec: (fn: () => Promise<unknown>) => void
}) {
  const [actif, setActif] = useState(params.actif)
  const [seuil, setSeuil] = useState(params.seuil)
  const [messageStrike, setMessageStrike] = useState(params.messageStrike)
  const [messageBloque, setMessageBloque] = useState(params.messageBloque)
  const [sauve, setSauve] = useState(false)

  function enregistrer() {
    setSauve(false)
    exec(async () => {
      await sauvegarderParamsIntegrite({ actif, seuil, messageStrike, messageBloque })
      setSauve(true)
    })
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muet uppercase tracking-wide">Paramètres</h3>
      <div className={`${carte} space-y-4`}>
        <label className="flex items-center gap-2 text-sm text-encre">
          <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
          Détection « petits malins » active
        </label>

        <div>
          <label className="block text-sm font-medium text-encre-douce mb-1">Seuil de blocage (nombre de strikes)</label>
          <input
            type="number" min={1} max={20} value={seuil}
            onChange={(e) => setSeuil(Number(e.target.value))}
            className={`${champ} w-24`}
          />
          <p className="text-xs text-muet mt-1">L’élève est bloqué à ce nombre de strikes. Le débloquer en retire 1.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-encre-douce mb-1">Message à l’élève (à chaque strike)</label>
          <textarea value={messageStrike} onChange={(e) => setMessageStrike(e.target.value)} rows={3} className={`${champ} resize-y`} />
        </div>

        <div>
          <label className="block text-sm font-medium text-encre-douce mb-1">Message à l’élève (une fois bloqué)</label>
          <textarea value={messageBloque} onChange={(e) => setMessageBloque(e.target.value)} rows={3} className={`${champ} resize-y`} />
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={pending}
            onClick={enregistrer}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-bouton text-surface hover:opacity-90 disabled:opacity-50"
          >
            Enregistrer
          </button>
          {sauve && <span className="text-sm text-ok">Enregistré ✓</span>}
        </div>
      </div>
    </section>
  )
}
