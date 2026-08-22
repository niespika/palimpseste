// ============================================================================
// C4 · L9 — LA CONCEPTION D'UN EXAMEN DIAGNOSTIQUE, dans ALETHEIA.
// ----------------------------------------------------------------------------
// « Les sommatifs se conçoivent CHACUN DANS SON MODULE » (`02-` §6 B, citant le
//   `01-` §2). Cette route est MINCE — elle garde, elle appelle le chargeur
//   commun, elle rend le composant commun : un seul chargeur, un seul composant,
//   DEUX ENTRÉES, et le seul écart est ce que le professeur y choisit.
//
// ⚠️ ELLE EST CLÉE PAR LA LIGNE DE PLAN, pas par l'instance — « la ligne de plan
//    PRÉCÈDE l'exercice : elle porte la date, elle naît *à concevoir*, et c'est
//    ELLE qui appelle la conception » (`07-` §2, C4-L9).
//
// ⚠️ ELLE NE RÉORGANISE PAS LA NAVIGATION : elle ne s'ajoute pas aux
//    sous-onglets de `components/nav/configModules.ts` — « un module = 2-3
//    onglets » (`AGENTS.md`). Les onglets sont C4-L6 et C5-L4.
// ============================================================================

import { notFound } from 'next/navigation'
import { garderProf } from '@/utils/fabrique/acces'
import { chargerConception } from '@/utils/examens/conception'
import EcranConceptionExamen from '@/components/examens/EcranConceptionExamen'

export const dynamic = 'force-dynamic'

export default async function ConceptionExamenAletheia(
  { params }: { params: Promise<{ planifieId: string }> },
) {
  const { planifieId } = await params
  const { admin, actif } = await garderProf()
  const vue = await chargerConception(admin, planifieId)
  // Une ligne d'un AUTRE module n'est pas « introuvable » par hasard : chaque
  // module ne conçoit que le sien.
  if (!vue || vue.module !== 'aletheia') notFound()
  return (
    <main className="mx-auto max-w-3xl p-4">
      <EcranConceptionExamen vue={vue} actif={actif} />
    </main>
  )
}
