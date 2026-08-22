// ============================================================================
// C4 · L4 — LA PASSATION EN CLASSE, côté élève, DANS ALETHEIA.
// ----------------------------------------------------------------------------
// « L'élève dépose LUI-MÊME, DEPUIS SON COMPTE — ce qui règle l'appariement
//   élève ↔ pages sans en-tête pré-imprimé, sans code à scanner et sans journal
//   de réattribution. »                                     — `06-` §1 ; piège 9
//
// Le dépôt est identifié par SON id : c'est le compte connecté qui le lie à
// l'élève, et `chargerVueEleve` refuse un dépôt qui n'est pas le sien.
// ============================================================================

import { notFound } from 'next/navigation'
import { garderEleve } from '@/utils/passation/garde'
import { chargerVueEleve } from '@/utils/passation/vues'
import { EcranEleve } from '@/components/passation/EcranEleve'

export default async function PassationAletheiaEleve(
  { params }: { params: Promise<{ depotId: string }> },
) {
  const { depotId } = await params
  const { admin, userId, ouvert } = await garderEleve()
  const vue = await chargerVueEleve(admin, depotId, userId)
  if (!vue) notFound()
  if (!ouvert) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <p className="rounded-lg border border-bordure bg-surface p-4 text-encre">
          Cet écran n’est pas encore ouvert. Ton professeur t’indiquera quand.
        </p>
      </main>
    )
  }
  return (
    <main className="mx-auto max-w-2xl p-4">
      <EcranEleve vue={vue} />
    </main>
  )
}
