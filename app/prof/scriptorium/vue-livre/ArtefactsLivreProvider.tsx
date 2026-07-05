'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// Au-delà de ce délai, un PENDING est considéré « bloqué » (job after() mort) :
// on rouvre la régénération au lieu de laisser l'artefact figé.
const DELAI_BLOCAGE_MS = 2 * 60 * 1000

interface EtatArtefacts {
  carteEnCours: boolean
  refEnCours: boolean
  carteBloquee: boolean
  refBloquee: boolean
}

const Ctx = createContext<EtatArtefacts>({ carteEnCours: false, refEnCours: false, carteBloquee: false, refBloquee: false })

export function useArtefactsLivre(): EtatArtefacts {
  return useContext(Ctx)
}

// Polling UNIQUE de la page livre (ex-useEffect de CarteArchitectureLivre) : tant
// qu'un artefact (carte ou fiches) est PENDING, auto-refresh toutes les 4 s pour
// basculer → READY sans rechargement manuel ; un PENDING trop ancien est marqué
// « bloqué » par artefact (entête/panneau/colonne lisent le contexte).
export default function ArtefactsLivreProvider({ carteEnCours, refEnCours, tsCarte, tsRef, children }: {
  carteEnCours: boolean
  refEnCours: boolean
  tsCarte: number
  tsRef: number
  children: ReactNode
}) {
  const router = useRouter()
  const [carteBloquee, setCarteBloquee] = useState(false)
  const [refBloquee, setRefBloquee] = useState(false)
  const enCours = carteEnCours || refEnCours

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!enCours) { setCarteBloquee(false); setRefBloquee(false); return }
    const tick = () => {
      const cMort = carteEnCours && tsCarte > 0 && Date.now() - tsCarte > DELAI_BLOCAGE_MS
      const rMort = refEnCours && tsRef > 0 && Date.now() - tsRef > DELAI_BLOCAGE_MS
      setCarteBloquee(cMort)
      setRefBloquee(rMort)
      if ((carteEnCours && !cMort) || (refEnCours && !rMort)) router.refresh()
    }
    tick()
    const id = setInterval(tick, 4000)
    return () => clearInterval(id)
  }, [enCours, carteEnCours, refEnCours, tsCarte, tsRef, router])
  /* eslint-enable react-hooks/set-state-in-effect */

  return <Ctx.Provider value={{ carteEnCours, refEnCours, carteBloquee, refBloquee }}>{children}</Ctx.Provider>
}
