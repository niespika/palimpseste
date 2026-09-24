'use client'
// ============================================================================
// CODEX — L'ONGLET EXAMENS SE RELIT SEUL LE JOUR D'UNE ÉPREUVE MINUTÉE. 24/09.
// ----------------------------------------------------------------------------
// Tant qu'une épreuve préparée attend son lancement (le jour prévu) ou qu'une
// épreuve est active, l'onglet se redessine toutes les quinze secondes : l'élève
// posé sur l'onglet voit l'écran de l'épreuve apparaître au lancement, sans
// recharger. Rien à afficher : l'écran de l'épreuve lui-même est `EcranEleve`.
// ============================================================================
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VeilleDesEpreuves({ veille }: { veille: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (!veille) return
    const id = setInterval(() => router.refresh(), 15_000)
    return () => clearInterval(id)
  }, [veille, router])
  return null
}
