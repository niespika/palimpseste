'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderRetour, validerTravail, type RetourCritique } from '../actions'

interface Props {
  travailId: string
  retourInitial: RetourCritique
  syntheseInitiale: string
  transcriptionVf: string
  dejaValide: boolean
}

const STATUT_SUIVI: Record<string, { label: string; classe: string }> = {
  suivie: { label: 'suivie', classe: 'bg-ok-teinte text-ok' },
  partiellement: { label: 'en partie', classe: 'bg-attention-teinte text-attention' },
  non_suivie: { label: 'non suivie', classe: 'bg-retard-teinte text-retard' },
}

export function EditeurRetour({ travailId, retourInitial, syntheseInitiale, transcriptionVf, dejaValide }: Props) {
  const router = useRouter()
  const [ecran, setEcran] = useState<'erreurs' | 'synthese'>('erreurs')
  const [erreurs, setErreurs] = useState(retourInitial.erreurs_corrections ?? [])
  const [synthese, setSynthese] = useState(syntheseInitiale)
  const [transcriptionOuverte, setTranscriptionOuverte] = useState(false)
  const [pending, setPending] = useState<null | 'save' | 'valider'>(null)
  const [message, setMessage] = useState<string | null>(null)

  function majErreur(i: number, champ: 'correction' | 'importance', valeur: string | number) {
    setErreurs((prev) => prev.map((e, idx) => (idx === i ? { ...e, [champ]: valeur } : e)))
  }

  function supprimerErreur(i: number) {
    setErreurs((prev) => prev.filter((_, idx) => idx !== i))
  }

  function construireRetour(): RetourCritique {
    return { ...retourInitial, erreurs_corrections: erreurs }
  }

  async function enregistrer() {
    setPending('save')
    setMessage(null)
    const res = await sauvegarderRetour(travailId, construireRetour(), synthese)
    setPending(null)
    setMessage(res.error ? res.error : 'Enregistré.')
  }

  async function valider() {
    if (!confirm('Valider ce retour ? L\'élève le recevra, et les erreurs importantes deviendront des cartes.')) return
    setPending('valider')
    setMessage(null)
    await sauvegarderRetour(travailId, construireRetour(), synthese)
    const res = await validerTravail(travailId)
    setPending(null)
    if (res.error) { setMessage(res.error); return }
    router.refresh()
  }

  return (
    <div>
      {/* Onglets écrans */}
      <div className="flex gap-1 mb-5 bg-parchemin-fonce rounded-lg p-1 w-fit">
        <button
          onClick={() => setEcran('erreurs')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${ecran === 'erreurs' ? 'bg-surface text-encre shadow-sm' : 'text-muet'}`}
        >
          Erreurs & corrections
        </button>
        <button
          onClick={() => setEcran('synthese')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${ecran === 'synthese' ? 'bg-surface text-encre shadow-sm' : 'text-muet'}`}
        >
          Synthèse complétée
        </button>
      </div>

      {ecran === 'erreurs' && (
        <div className="space-y-6">
          {/* Erreurs + corrections (éditables) */}
          <section>
            <h4 className="text-sm font-medium text-encre-douce mb-2">Erreurs restantes & corrections</h4>
            {erreurs.length === 0 && <p className="text-sm text-muet">Aucune erreur factuelle relevée.</p>}
            <div className="space-y-3">
              {erreurs.map((e, i) => (
                <div key={i} className="bg-surface border border-bordure rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-1.5 py-0.5 bg-parchemin-fonce text-muet rounded">{e.concept_tag || 'sans tag'}</span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muet">Importance</label>
                      <select
                        value={e.importance}
                        onChange={(ev) => majErreur(i, 'importance', parseInt(ev.target.value))}
                        className="text-xs border border-bordure rounded px-1.5 py-0.5"
                      >
                        <option value={1}>1 — mineure</option>
                        <option value={2}>2 — notable</option>
                        <option value={3}>3 — grave</option>
                      </select>
                      <button onClick={() => supprimerErreur(i)} className="text-retard hover:opacity-80 text-sm" title="Retirer">✕</button>
                    </div>
                  </div>
                  <p className="text-sm text-encre-douce mb-2">{e.description}</p>
                  <label className="text-xs text-muet block mb-1">Correction (validée, adossée au cours)</label>
                  <textarea
                    value={e.correction}
                    onChange={(ev) => majErreur(i, 'correction', ev.target.value)}
                    rows={2}
                    className="w-full text-sm border border-bordure rounded-lg px-3 py-2"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muet mt-2">
              Les {erreurs.length > 0 ? 'plus importantes' : ''} (importance la plus haute) deviendront des cartes de révision de l&apos;élève à la validation.
            </p>
          </section>

          {/* Suivi des suggestions (lecture) */}
          {retourInitial.suivi_suggestions?.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-encre-douce mb-2">Suivi des suggestions de la V1</h4>
              <div className="space-y-2">
                {retourInitial.suivi_suggestions.map((s, i) => {
                  const badge = STATUT_SUIVI[s.statut] ?? { label: s.statut, classe: 'bg-parchemin-fonce text-muet' }
                  return (
                    <div key={i} className="bg-surface border border-bordure rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${badge.classe}`}>{badge.label}</span>
                        <p className="text-sm text-encre-douce">{s.suggestion}</p>
                      </div>
                      {s.commentaire && <p className="text-sm text-muet">{s.commentaire}</p>}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Pouvait aller plus loin / non amélioré (lecture) */}
          {retourInitial.pouvait_aller_plus_loin?.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-encre-douce mb-2">Pouvait aller plus loin</h4>
              <ul className="list-disc list-inside space-y-1">
                {retourInitial.pouvait_aller_plus_loin.map((p, i) => (
                  <li key={i} className="text-sm text-encre-douce">{p}</li>
                ))}
              </ul>
            </section>
          )}
          {retourInitial.non_ameliore?.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-encre-douce mb-2">Signalé en V1, non corrigé</h4>
              <ul className="list-disc list-inside space-y-1">
                {retourInitial.non_ameliore.map((p, i) => (
                  <li key={i} className="text-sm text-encre-douce">{p}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {ecran === 'synthese' && (
        <div className="space-y-5">
          <div className="bg-info-teinte border border-info rounded-xl p-3 text-sm text-info">
            Les ajouts de l&apos;IA sont encadrés par <code className="bg-surface px-1 rounded">[AJOUT] … [/AJOUT]</code>.
            Vérifie-les : ajouter un point omis, c&apos;est du contenu généré — la sélection et la formulation sont sous ta responsabilité.
          </div>

          {transcriptionVf && (
            <div>
              <button
                onClick={() => setTranscriptionOuverte((o) => !o)}
                className="text-xs text-muet hover:text-encre underline"
              >
                {transcriptionOuverte ? 'Masquer' : 'Voir'} la transcription de la V-finale
              </button>
              {transcriptionOuverte && (
                <pre className="mt-2 whitespace-pre-wrap text-sm text-encre-douce bg-parchemin-fonce border border-bordure rounded-xl p-3 font-sans">
                  {transcriptionVf}
                </pre>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-encre-douce block mb-1">Synthèse complétée (ce que l&apos;élève recevra)</label>
            <textarea
              value={synthese}
              onChange={(e) => setSynthese(e.target.value)}
              rows={18}
              className="w-full text-sm border border-bordure rounded-lg px-3 py-2 leading-relaxed font-sans"
            />
          </div>

          {retourInitial.ajouts?.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-encre-douce mb-2">Ajouts générés ({retourInitial.ajouts.length}) — à vérifier</h4>
              <div className="space-y-2">
                {retourInitial.ajouts.map((a, i) => (
                  <div key={i} className="bg-attention-teinte border border-attention rounded-xl p-3">
                    <p className="text-sm font-medium text-attention">{a.titre}</p>
                    <p className="text-sm text-attention mt-0.5">{a.contenu}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Barre d'action */}
      <div className="sticky bottom-0 mt-8 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-surface/90 backdrop-blur border-t border-bordure flex items-center justify-between gap-3">
        <span className="text-xs text-muet">{message}</span>
        <div className="flex gap-2">
          <button
            onClick={enregistrer}
            disabled={pending !== null}
            className="px-4 py-2 text-sm border border-bordure rounded-lg hover:bg-parchemin-fonce disabled:opacity-50"
          >
            {pending === 'save' ? '…' : 'Enregistrer'}
          </button>
          <button
            onClick={valider}
            disabled={pending !== null}
            className="px-5 py-2 text-sm bg-ok text-surface rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {pending === 'valider' ? '…' : dejaValide ? 'Revalider' : 'Valider le retour'}
          </button>
        </div>
      </div>
    </div>
  )
}
