'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { repondreRelances } from './actions'
import type { RelanceDetail } from '@/utils/aletheia/retour-v1'

// ============================================================================
// (E5) RÉPONDRE AUX RELANCES AVANT DE RÉÉCRIRE. Une case sous chaque relance ; la
// réécriture n'apparaît qu'après. C'est le changement qui règle les 30 % d'ajouts non
// ancrés : les réponses ne finissent plus collées dans le champ « arguments ».
// Porte ouverte seulement (la page ne monte ce composant que dans ce cas).
// ============================================================================

const champClasse =
  'w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre'

export default function ReponsesRelances({ livreId, semaine, relances, detail }: {
  livreId: string
  semaine: number
  relances: string[]
  /** Le passage désigné par chaque relance (E6 le montrera ou le fera chercher). */
  detail?: RelanceDetail[]
}) {
  const router = useRouter()
  const [reponses, setReponses] = useState<string[]>(relances.map(() => ''))
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
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
        Avant de réécrire, réponds à chaque relance. Relis le passage dans ton livre, puis écris une ou deux phrases.
      </p>
      {relances.map((q, i) => (
        <div key={i} className="bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl p-4 space-y-2">
          <p className="text-sm text-encre">{q}</p>
          {detail?.[i]?.libelle && (
            <p className="text-xs text-muet">À chercher dans ton livre : <span className="text-encre-douce">{detail[i].libelle}</span></p>
          )}
          <label className="block text-xs font-medium text-muet">
            Relis ces lignes dans ton livre, puis réponds à la question en une ou deux phrases.
          </label>
          <textarea value={reponses[i]} onChange={e => setReponses(reponses.map((r, j) => (j === i ? e.target.value : r)))}
            rows={3} className={champClasse} />
        </div>
      ))}
      {erreur && <p className="text-retard text-sm">{erreur}</p>}
      <button type="submit" disabled={chargement}
        className="w-full bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
        {chargement ? 'Envoi…' : 'J’ai répondu → passer à la réécriture'}
      </button>
    </form>
  )
}
