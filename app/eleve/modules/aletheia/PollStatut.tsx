'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { etatDuRetourAletheia, relancerRetour } from './actions'

// Sonde le serveur tant qu'un retour IA est en cours de génération (after()), jusqu'à ce
// que le statut avance (la page se rafraîchit alors, et `actif` repasse à false). Sur une
// séance, le tic lit le SEUL statut (17/09) ; le capstone rafraîchit la route. Au-delà d'un délai,
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
    // ⭐ 17/09 — sur une séance, le tic ne re-rend plus la page : il lit le statut
    //    (`etatDuRetourAletheia`, une lecture) et ne rafraîchit qu'UNE fois, quand
    //    l'attente est finie. Les tics s'ENCHAÎNENT (le suivant part quand le
    //    précédent a répondu) : ils ne peuvent plus se chevaucher.
    // Le capstone n'a ni livre ni séance à nommer ici : il garde le rafraîchissement.
    let arrete = false
    let prochain: ReturnType<typeof setTimeout> | null = null
    const tic = async () => {
      if (arrete) return
      if (livreId && semaine != null) {
        try {
          const { enAttente } = await etatDuRetourAletheia(livreId, semaine)
          if (arrete) return
          // ⚠️ PAS de `return` : si ce rafraîchissement se perd (wifi coupé, téléphone
          //    qui sort de veille), le tic suivant le redemande. Quand la page fraîche
          //    arrive, `actif` repasse à false et le nettoyage coupe la boucle.
          if (!enAttente) router.refresh()
        } catch {
          // ⚠️ L'action a LEVÉ : session perdue, site passé en travaux, déploiement en
          //    cours d'attente. Sonder en silence figerait l'écran ; on rend la main au
          //    rendu, comme avant — c'est lui qui sait rediriger vers /login ou recharger.
          router.refresh()
        }
      } else {
        router.refresh()
      }
      if (!arrete) prochain = setTimeout(tic, 4000)
    }
    prochain = setTimeout(tic, 4000)
    const t = setTimeout(() => setAttenteLongue(true), SEUIL_RELANCE_MS)
    return () => { arrete = true; if (prochain) clearTimeout(prochain); clearTimeout(t) }
  }, [actif, router, livreId, semaine])

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
