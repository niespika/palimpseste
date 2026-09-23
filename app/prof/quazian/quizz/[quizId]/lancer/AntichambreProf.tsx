'use client'

// ============================================================================
// L'ANTICHAMBRE CÔTÉ PROFESSEUR (retours de classe du 22/09/2026, point 6) :
// combien d'élèves sont là, lesquels, et le bouton qui lance le chrono.
// Sondage toutes les 3 s ; dès que le quiz n'est plus en attente (lancé ici ou
// dans un autre onglet), la page se recharge et montre le tableau en direct.
// ============================================================================

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LigneAntichambre } from '@/utils/quazian-antichambre'
import { fermerAntichambre, lancerQuizz } from './actions'

interface Salle { lignes: LigneAntichambre[]; presents: number; total: number }

const PASTILLE: Record<LigneAntichambre['etat'], { texte: string; classe: string }> = {
  present: { texte: 'présent', classe: 'bg-ok-teinte text-ok' },
  parti: { texte: 'parti', classe: 'bg-attention-teinte text-attention' },
  absent: { texte: 'pas arrivé', classe: 'bg-parchemin-fonce text-muet' },
}

export function AntichambreProf({ quizId, dureeMin, salleInit }: { quizId: string; dureeMin: number; salleInit: Salle }) {
  const router = useRouter()
  const [salle, setSalle] = useState<Salle>(salleInit)
  const [pending, setPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  // Deux sondages ratés d'affilée : le compteur n'est plus à jour, et c'est sur
  // lui que le professeur décide de lancer — ça se dit (revue du 22/09).
  const [echecs, setEchecs] = useState(0)

  const sonder = useCallback(async () => {
    try {
      const res = await fetch(`/api/quazian/antichambre/${quizId}`, { cache: 'no-store' })
      if (!res.ok) { setEchecs((n) => n + 1); return }
      const data = await res.json()
      setEchecs(0)
      if (!data.ouverte) { router.refresh(); return }
      setSalle({ lignes: data.lignes, presents: data.presents, total: data.total })
    } catch { setEchecs((n) => n + 1) }
  }, [quizId, router])

  useEffect(() => {
    const interval = setInterval(sonder, 3000)
    return () => clearInterval(interval)
  }, [sonder])

  async function agir(geste: typeof lancerQuizz | typeof fermerAntichambre) {
    setPending(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('quizId', quizId)
      fd.append('duree_min', String(dureeMin))
      const res = await geste(fd)
      if ('error' in res && res.error) { setErreur(res.error); return }
      router.refresh()
    } catch {
      setErreur('Le geste n’a pas abouti (erreur serveur). Réessaie.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-bordure rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-attention animate-pulse" />
              <span className="font-medium text-encre">Antichambre ouverte</span>
            </div>
            <p className="mt-2 text-3xl font-serif text-encre tabular-nums">
              {salle.presents}<span className="text-lg text-muet"> / {salle.total}</span>
            </p>
            <p className="text-sm text-muet">élève{salle.presents > 1 ? 's' : ''} dans l’antichambre</p>
            {echecs >= 2 && (
              <p role="status" className="mt-1 text-xs text-retard">Actualisation en échec : ce compte n’est peut-être plus à jour.</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => agir(lancerQuizz)}
              disabled={pending}
              className="px-6 py-3 bg-ok text-surface rounded-xl hover:opacity-90 disabled:opacity-50 font-medium"
            >
              {pending ? '…' : 'Lancer le quiz maintenant'}
            </button>
            <button
              type="button"
              onClick={() => agir(fermerAntichambre)}
              disabled={pending}
              className="text-sm text-muet hover:text-encre-douce underline min-h-11"
            >
              Refermer l’antichambre
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-encre-douce leading-relaxed">
          Les élèves lisent les consignes et s’essaient sur une question qui ne compte pas.
          Le chrono de {dureeMin} min ne part qu’au lancement.
        </p>
        {erreur && <p role="alert" className="mt-2 text-sm text-retard">{erreur}</p>}
      </div>

      <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
        <ul className="grid grid-cols-1 sm:grid-cols-2">
          {salle.lignes.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-bordure">
              <span className="text-sm text-encre min-w-0 truncate">{l.display_name}</span>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${PASTILLE[l.etat].classe}`}>
                {PASTILLE[l.etat].texte}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
