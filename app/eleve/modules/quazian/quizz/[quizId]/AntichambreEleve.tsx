'use client'

// ============================================================================
// L'ÉCRAN D'ATTENTE DE L'ÉLÈVE (retours de classe du 22/09/2026, point 5) : les
// consignes, la question d'essai, et le passage AUTOMATIQUE à la première
// question quand le professeur lance. Aucun autre écran élève ne se rafraîchit
// seul : c'est le sondage ci-dessous qui le fait, toutes les 4 s.
// ============================================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SONDAGE_ELEVE_MS } from '@/utils/quazian-antichambre'
import { signalerPresence } from './actions-antichambre'
import { Consignes } from './Consignes'
import { EssaiAntichambre } from './EssaiAntichambre'

export function AntichambreEleve({ quizId }: { quizId: string }) {
  const router = useRouter()
  const [refermee, setRefermee] = useState(false)

  useEffect(() => {
    let actif = true
    const sonder = async () => {
      try {
        const r = await signalerPresence(quizId)
        if (!actif) return
        // `?commencer=1` : il était là, il n'a pas à relire les consignes.
        if (r.etat === 'lance') router.replace(`/eleve/modules/quazian/quizz/${quizId}?commencer=1`)
        else setRefermee(r.etat !== 'attente')
        // Quiz supprimé, ou plus de sa classe : inutile de sonder encore.
        if (r.etat === 'introuvable') clearInterval(id)
      } catch { /* un sondage raté : le suivant rattrapera */ }
    }
    // Déclaré AVANT le premier sondage, qui peut l'arrêter (quiz introuvable).
    const id = setInterval(sonder, SONDAGE_ELEVE_MS)
    void sonder()
    return () => { actif = false; clearInterval(id) }
  }, [quizId, router])

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div>
        <p className="text-sm text-muet flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${refermee ? 'bg-muet' : 'bg-attention animate-pulse'}`} />
          {refermee ? 'L’antichambre est refermée' : 'En attente du lancement par ton professeur'}
        </p>
        <h2 className="mt-1 text-xl font-serif text-encre">Le quiz va commencer</h2>
        {refermee && (
          <p role="status" className="mt-2 text-sm text-attention">
            Ton professeur a refermé l’antichambre. Cet écran reprendra tout seul s’il la rouvre.
          </p>
        )}
      </div>
      <Consignes />
      <EssaiAntichambre />
      <p className="text-center text-sm text-muet">
        L’écran passe tout seul à la première question quand ton professeur lance le quiz.
      </p>
    </div>
  )
}
