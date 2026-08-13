'use client'

// =========================================================================
// components/nav/EtatFragmentsEleve.tsx
// C8·L3 — l'état des onglets élève de Fragments, chargé UNE FOIS pour les deux
// surfaces qui l'affichent.
//
// Les deux barres d'onglets (Barre 2 desktop et sous-nav mobile) sont montées
// ensemble à tout moment — le responsive les masque en CSS, il ne les démonte
// pas. Chacune chargeant son état, la page élève payait DEUX allers-retours
// serveur identiques (~1 s chacun) à chaque affichage. Le fournisseur est posé
// une fois dans la coquille /eleve, au-dessus des deux.
//
// Hors du module Fragments, il ne déclenche rien (valeur `null`) : les autres
// routes élève ne paient pas cette lecture.
// =========================================================================

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { chargerEtatOngletsFragments } from '@/app/eleve/modules/fragments-erudition/actions'
import type { EtatOngletsFragments } from '@/utils/fragments-etat-eleve'

const PREFIXE_FRAGMENTS = '/eleve/modules/fragments-erudition'

const ContexteEtat = createContext<EtatOngletsFragments | null>(null)

export function FournisseurEtatFragmentsEleve({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const surFragments = pathname === PREFIXE_FRAGMENTS || pathname.startsWith(PREFIXE_FRAGMENTS + '/')
  const [etat, setEtat] = useState<EtatOngletsFragments | null>(null)

  useEffect(() => {
    if (!surFragments) return
    let vivant = true
    chargerEtatOngletsFragments()
      .then((e) => { if (vivant) setEtat(e) })
      .catch(() => { /* l'état n'est qu'un signal : son échec ne casse pas la nav */ })
    return () => { vivant = false }
  }, [surFragments, pathname])

  // Hors module, on masque la valeur au lieu de la remettre à zéro dans l'effet
  // (setState synchrone = rendus en cascade). Au retour dans le module, l'ancien
  // état s'affiche le temps d'un aller-retour, puis se corrige.
  return (
    <ContexteEtat.Provider value={surFragments ? etat : null}>{children}</ContexteEtat.Provider>
  )
}

/** `null` tant que l'état n'est pas chargé, ou hors du module. */
export function useEtatFragmentsEleve(): EtatOngletsFragments | null {
  return useContext(ContexteEtat)
}
