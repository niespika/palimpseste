'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Échap referme le volet Parcours (handoff plan_cours_eleve §5 C3 : « ✕, Échap,
// retour navigateur »). Le volet est ADRESSÉ par l'URL (`?vue=plan&parcours=`) :
// refermer = naviguer vers l'Année seule ; le retour navigateur le fait de lui-même.
// Aucun rendu — un écouteur, rien d'autre.

export const HREF_ANNEE = '/eleve/modules/scriptorium?vue=plan'

export default function FermetureVolet() {
  const router = useRouter()
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      router.push(HREF_ANNEE)
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [router])
  return null
}
