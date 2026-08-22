// ============================================================================
// C4 · L3 — L'ÉCRAN DE L'ÉLÈVE, À LA MAISON.
// ----------------------------------------------------------------------------
// ⚠️ **CET ÉCRAN EST CELUI DE L'ÉCRITURE** — Codex. « La lecture — même
//    déroulé, retour ancré au texte — est **C5-L2** » (`07-` §2 ; piège 3) :
//    on ne route pas ce déroulé sous Aletheia, et on ne le rend pas générique
//    « au cas où ». Le lot qui en aura besoin le fera sien.
//
// ⚠️ **PAS DE `<main>` IMBRIQUÉ.** Le layout élève en fournit déjà un, avec sa
//    colonne (`app/eleve/layout.tsx` : `max-w-[1040px]`). Les pages de passation
//    de C4-L4 en rouvrent un second, avec une autre largeur — on ne reproduit
//    pas cet écart.
//
// ⚠️ **LES ONGLETS SONT C4-L6** (piège 3) : cet écran n'en déclare aucun, et il
//    ne touche pas à `configModules.ts`.
// ============================================================================

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { garderEleveDeroule } from '@/utils/deroule/acces'
import { chargerLeDeroule } from '@/utils/deroule/vue'
import { EcranDeroule } from '@/components/deroule/EcranDeroule'

export default async function ExerciceMaison(
  { params }: { params: Promise<{ depotId: string }> },
) {
  const { depotId } = await params
  const { admin, userId, ouvert, delaiVfJours } = await garderEleveDeroule()

  const vue = await chargerLeDeroule(admin, depotId, userId, { ouvert, delaiVfJours })
  // ⚠️ Trois refus se ressemblent volontairement ici — pas à cet élève, pas de
  //    la maison, ou `retire` : « introuvable » ne dit pas lequel.
  if (!vue) notFound()

  // ⭐ Les avertissements sont pour le PROFESSEUR, pas pour l'élève : une trace
  //    serveur en tient lieu (`07-` §1.1 et §1.2) — « rien ne s'engendre à sa
  //    place », et rien ne s'affiche à l'élève non plus.
  for (const a of vue.avertissements) {
    console.warn(`[deroule] dépôt ${depotId} — ${a}`)
  }

  return (
    <div>
      <Link href="/eleve/modules/codex" className="text-sm text-muet hover:text-encre-douce">
        ← Retour
      </Link>
      <div className="mt-4">
        <EcranDeroule vue={vue} />
      </div>
    </div>
  )
}
