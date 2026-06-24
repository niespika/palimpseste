'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { relancerRetour } from './actions'

// Rafraîchit la route tant qu'un retour IA est en cours de génération (after()), jusqu'à ce
// que le statut avance côté serveur (puis `actif` repasse à false). Au-delà d'un délai,
// propose de relancer la génération : si le job after() est mort (process interrompu), le
// travail resterait sinon bloqué en *_SUBMITTED avec un polling infini.
const SEUIL_RELANCE_MS = 90 * 1000

export default function PollStatut({ actif, livreId, semaine }: { actif: boolean; livreId?: string; semaine?: number }) {
  const router = useRouter()
  const [attenteLongue, setAttenteLongue] = useState(false)
  const [enRelance, setEnRelance] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!actif) { setAttenteLongue(false); return }
    const id = setInterval(() => router.refresh(), 4000)
    const t = setTimeout(() => setAttenteLongue(true), SEUIL_RELANCE_MS)
    return () => { clearInterval(id); clearTimeout(t) }
  }, [actif, router])

  // Bouton de relance réservé au cas retour 1/2 (livreId + semaine fournis) ; pour le
  // capstone (planning / page capstone) on se contente du polling.
  if (!actif || !attenteLongue || !livreId || semaine == null) return null

  async function relancer() {
    if (!livreId || semaine == null) return
    setEnRelance(true)
    setMessage(null)
    const res = await relancerRetour(livreId, semaine)
    setEnRelance(false)
    if (res?.error) setMessage(res.error)
    else router.refresh()
  }

  return (
    <div className="mt-2 text-sm text-muet">
      <p className="mb-1">La préparation prend plus de temps que prévu.</p>
      <button
        onClick={relancer}
        disabled={enRelance}
        className="text-encre-douce underline hover:text-encre disabled:opacity-50"
      >
        {enRelance ? 'Relance…' : 'Relancer le retour'}
      </button>
      {message && <span className="ml-2 text-retard">{message}</span>}
    </div>
  )
}
