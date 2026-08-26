// ============================================================================
// C4 · L4 — LA PASSATION EN CLASSE, côté professeur, DANS CODEX.
// ----------------------------------------------------------------------------
// « Ses écrans vivent dans Codex (l'écriture diagnostique) et Aletheia (la
//   lecture diagnostique) — c'est le MÊME FLUX dans deux modules. »
//
// ⚠️ CETTE PAGE NE RÉORGANISE PAS LA NAVIGATION (piège 55) : elle ne s'ajoute
//    pas aux sous-onglets de `components/nav/configModules.ts` — Codex en porte
//    déjà trois, et « un module = 2-3 onglets » (`AGENTS.md`). Les onglets sont
//    C4-L6 et C5-L4 ; on s'y pose tel quel.
// ============================================================================

import { notFound } from 'next/navigation'
import { garderProf } from '@/utils/passation/garde'
import { chargerVueProf } from '@/utils/passation/vues'
import { EcranProf } from '@/components/passation/EcranProf'
import { chargerEntretienDeConception } from '@/utils/examens/entretien-serveur'
import EntretienConception from '@/components/passation/EntretienConception'

export default async function PassationCodexProf(
  { params }: { params: Promise<{ exerciceId: string }> },
) {
  const { exerciceId } = await params
  const { admin, actif } = await garderProf()
  const vue = await chargerVueProf(admin, exerciceId, actif)
  if (!vue) notFound()
  const entretien = await chargerEntretienDeConception(admin, exerciceId, vue.copies)
  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="font-cinzel text-xl text-encre">Passation en classe</h1>
      <p className="mt-1 text-sm text-muet">Codex — l’écriture diagnostique</p>
      <div className="mt-6">
        <EntretienConception exerciceId={exerciceId} entretien={entretien} />
        <EcranProf vue={vue} />
      </div>
    </main>
  )
}
