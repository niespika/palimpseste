'use client'
// ============================================================================
// CODEX — L'ONGLET EXAMENS VEILLE LES ÉPREUVES MINUTÉES. 24/09.
// ----------------------------------------------------------------------------
// Porte ouverte, l'onglet demande toutes les quinze secondes la SIGNATURE des
// épreuves actives de l'élève (une action légère) et ne se recharge que quand
// elle diffère de celle de son rendu : une épreuve lancée apparaît sans que
// l'élève recharge, une épreuve finie disparaît.
// ⚠️ 3ᵉ revue du 24/09 : avant, l'onglet se rechargeait ENTIER toutes les 15 s,
//    et seulement si un dépôt « à venir » existait au moment du rendu — des
//    durées fixées au dernier moment laissaient les tablettes vides après
//    « Lancer ». Onglet caché (tablette en veille, autre application) : rien.
// Rien à afficher : l'écran de l'épreuve lui-même est `EcranEleve`.
// ============================================================================
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { actionSignatureDesEpreuves } from '@/app/passation/actions-epreuve'

export default function VeilleDesEpreuves({ actif, signature }: { actif: boolean; signature: string }) {
  const router = useRouter()
  useEffect(() => {
    if (!actif) return
    let vivant = true
    const id = setInterval(async () => {
      if (document.hidden) return
      const s = await actionSignatureDesEpreuves().catch(() => null)
      if (vivant && s != null && s !== signature) router.refresh()
    }, 15_000)
    return () => { vivant = false; clearInterval(id) }
  }, [actif, signature, router])
  return null
}
