'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { repondreRelances, verifierSurlignage } from './actions'
import type { RelanceDetail } from '@/utils/aletheia/retour-v1'
import type { FenetreServie } from '@/utils/aletheia/fenetre-serveur'
import { libelleReponse, ESSAIS_MAX } from '@/utils/aletheia/fenetre'

// ============================================================================
// (E5/E6) RÉPONDRE AUX RELANCES AVANT DE RÉÉCRIRE — avec la forme par niveau.
//  · `montre` (E, D) : le passage est montré sous la relance, pivot en évidence ;
//  · `fenetre` / `demi_section` (C, B, A) : une liseuse par phrases ; l'élève touche
//    les phrases pour les surligner, « Vérifier » demande le barème au serveur ; la
//    pivot n'apparaît qu'une fois méritée ou au second échec (D14) ;
//  · sans passage désigné : la case seule, comme en E5.
// Aucune pivot n'est dans le navigateur avant d'être servie par le serveur.
// ============================================================================

const champClasse =
  'w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre'

type Etat = { selection: string[]; verdict?: string; message?: string; essais: number; pivot?: string[]; busy: boolean }

export default function ReponsesRelances({ livreId, semaine, relances, detail, fenetres = [], surlignagesInitiaux = {} }: {
  livreId: string
  semaine: number
  relances: string[]
  detail?: RelanceDetail[]
  fenetres?: FenetreServie[]
  /** Essais déjà journalisés (rechargement de page) : relance → { verdict_code, essais }. */
  surlignagesInitiaux?: Record<number, { verdict_code?: string; essais?: number; surlignage?: string[] }>
}) {
  const router = useRouter()
  const [reponses, setReponses] = useState<string[]>(relances.map(() => ''))
  const [etats, setEtats] = useState<Record<number, Etat>>(() => Object.fromEntries(relances.map((_, i) => {
    const s = surlignagesInitiaux[i]
    return [i, { selection: s?.surlignage ?? [], verdict: s?.verdict_code, essais: s?.essais ?? 0, busy: false }]
  })))
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const fenetreDe = (i: number) => fenetres.find(f => f.relance === i)
  const majEtat = (i: number, patch: Partial<Etat>) => setEtats(e => ({ ...e, [i]: { ...e[i], ...patch } }))

  const merite = (i: number) => { const e = etats[i]; return e.verdict === 'juste' || e.essais >= ESSAIS_MAX || !!e.pivot }
  const doitSurligner = (i: number) => { const f = fenetreDe(i); return !!f && f.forme !== 'montre' && !merite(i) }

  async function verifier(i: number) {
    const e = etats[i]
    if (e.selection.length === 0) { majEtat(i, { message: 'Touche au moins une phrase avant de vérifier.' }); return }
    majEtat(i, { busy: true })
    try {
      const r = await verifierSurlignage(livreId, semaine, i, e.selection)
      if ('error' in r && r.error) { majEtat(i, { message: r.error, busy: false }); return }
      if (!('verdict' in r)) { majEtat(i, { message: 'La vérification a échoué — réessaie.', busy: false }); return }
      // Pivot servie ⇒ elle seule reste en évidence : le faux surlignage s'efface.
      majEtat(i, { verdict: r.verdict, message: r.message, essais: r.essais ?? e.essais + 1, pivot: r.pivot, busy: false, ...(r.pivot ? { selection: [] } : {}) })
    } catch {
      majEtat(i, { message: 'La vérification a échoué — réessaie.', busy: false })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    const j = relances.findIndex((_, i) => doitSurligner(i))
    if (j >= 0) { setErreur(`Surligne d’abord la phrase qui répond à la relance ${j + 1}, puis vérifie.`); return }
    const i = reponses.findIndex(r => !r.trim())
    if (i >= 0) { setErreur(`Réponds à la relance ${i + 1} avant de passer à la réécriture.`); return }
    setChargement(true)
    try {
      const res = await repondreRelances(livreId, semaine, reponses)
      if (res?.error) { setErreur(res.error); return }
      router.refresh()
    } catch {
      setErreur('L’envoi a échoué — tes réponses sont toujours là. Vérifie ta connexion et réessaie.')
    } finally {
      setChargement(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-encre-douce">
        Avant de réécrire, réponds à chaque relance. Les extraits viennent de notre version du texte ; ton livre peut le dire autrement.
      </p>
      {relances.map((q, i) => {
        const f = fenetreDe(i)
        const e = etats[i]
        const enEvidence = new Set(f?.forme === 'montre' ? (f.enEvidence ?? []) : (e.pivot ?? []))
        const selection = new Set(e.selection)
        const surlignable = doitSurligner(i)
        return (
          <div key={i} className="bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl p-4 space-y-3">
            <p className="text-sm text-encre">{q}</p>
            {detail?.[i]?.libelle && (
              <p className="text-xs text-muet">À chercher : <span className="text-encre-douce">{detail[i].libelle}</span></p>
            )}
            {f && (
              <div className="bg-parchemin border border-bordure rounded-lg px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-muet mb-1.5">
                  {f.forme === 'montre' ? 'Le passage, dans notre version' : f.forme === 'fenetre' ? 'Cherche la phrase dans ces lignes — touche-la pour la surligner' : 'Cherche la phrase dans cette moitié de séance — touche-la pour la surligner'}
                </p>
                <p className="font-corps text-[15px] leading-relaxed text-encre">
                  {f.phrases.map(ph => {
                    const evid = enEvidence.has(ph.id), sel = selection.has(ph.id)
                    const cls = evid ? 'bg-liseret/30 rounded px-0.5' : sel ? 'bg-pigment-teinte rounded px-0.5 shadow-[inset_0_-2px_0_var(--pigment)]' : ''
                    // Un <span> et non un <button> : un bouton est inline-block, une phrase plus longue que la
                    // ligne se retrouverait seule sur la sienne (mesuré : 5 100 px de haut sur téléphone).
                    const basculer = () => majEtat(i, { selection: sel ? e.selection.filter(x => x !== ph.id) : [...e.selection, ph.id], message: undefined })
                    return surlignable
                      ? <span key={ph.id} data-phrase={ph.id} role="button" tabIndex={0} aria-pressed={sel} onClick={basculer}
                          onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); basculer() } }}
                          className={`cursor-pointer ${cls} hover:bg-pigment-teinte/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded`}>{ph.texte} </span>
                      : <span key={ph.id} data-phrase={ph.id} className={cls}>{ph.texte} </span>
                  })}
                </p>
                {f.forme !== 'montre' && (
                  <div className="flex items-center gap-3 flex-wrap mt-2">
                    {surlignable && (
                      <button type="button" onClick={() => verifier(i)} disabled={e.busy}
                        className="bg-bouton text-surface px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
                        {e.busy ? 'Vérification…' : `Vérifier${e.essais ? ` (essai ${e.essais + 1}/${ESSAIS_MAX})` : ''}`}
                      </button>
                    )}
                    {e.message && <p className={`text-xs ${e.verdict === 'juste' ? 'text-ok' : 'text-attention'}`}>{e.message}{e.pivot && e.verdict !== 'juste' ? ' La phrase est maintenant surlignée.' : ''}</p>}
                  </div>
                )}
              </div>
            )}
            {(!f || f.forme === 'montre' || merite(i)) && (
              <>
                <label className="block text-xs font-medium text-muet">{libelleReponse(f?.forme ?? null)}</label>
                <textarea value={reponses[i]} onChange={ev => setReponses(reponses.map((r, j) => (j === i ? ev.target.value : r)))}
                  rows={3} className={champClasse} />
              </>
            )}
          </div>
        )
      })}
      {erreur && <p className="text-retard text-sm">{erreur}</p>}
      <button type="submit" disabled={chargement}
        className="w-full bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
        {chargement ? 'Envoi…' : 'J’ai répondu → passer à la réécriture'}
      </button>
    </form>
  )
}
