// ============================================================================
// C6 · L4 — LA PASSATION EN CLASSE, côté professeur, DANS FRAGMENTS.
// ----------------------------------------------------------------------------
// « C'est le lieu qui commande, jamais le module » (C4-L9) : la troisième porte
// du MÊME écran (`EcranProf`, `chargerVueProf`) — jamais une copie. Elle ne sert
// QUE les instances qu'un essai de Fragments a fait naître (lecture inverse par
// le lien) : un examen de Codex ne s'atteint pas par ici.
//
// ⚠️ AUCUN ONGLET NEUF : la page se pose sous « Évaluations » par `prefixes`
//    (`components/nav/configModules.ts`).
//
// ⚠️⚠️ DEUX RETOURS POUR UNE COPIE, ET L'ÉCRAN LE DIT (piège 44) : les lettres
//    et le /20 de Fragments restent dans leur module (arbitrage ④ de C6-L2) ; la
//    correction de la chaîne se fait ici. Rien n'est fusionné, rien n'est caché.
// ============================================================================

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { garderProf } from '@/utils/passation/garde'
import { chargerVueProf } from '@/utils/passation/vues'
import { EcranProf } from '@/components/passation/EcranProf'
import { essaiDeLInstance } from '@/utils/essai/branchement-serveur'
import { formatJour } from '@/utils/fuseau'

export default async function PassationFragmentsProf(
  { params }: { params: Promise<{ exerciceId: string }> },
) {
  const { exerciceId } = await params
  const { admin, actif } = await garderProf()
  const essai = await essaiDeLInstance(admin, exerciceId)
  if (!essai) notFound()
  const vue = await chargerVueProf(admin, exerciceId, actif)
  if (!vue) notFound()
  const retourEssai = `/prof/fragments-erudition/essais/${essai.essaiId}?classe=${essai.classeId}`
  return (
    <main className="mx-auto max-w-4xl p-4">
      <Link href={retourEssai} className="text-sm text-muet hover:text-encre-douce">← {essai.titre}</Link>
      <h1 className="mt-2 font-cinzel text-xl text-encre">Passation en classe</h1>
      <p className="mt-1 text-sm text-muet">
        Fragments — l’essai · {essai.titre} · {essai.classeNom}
        {' · '}{formatJour(essai.dateEssai, { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <div className="mt-4 rounded-lg border border-bordure bg-parchemin-fonce p-3 text-sm text-encre-douce">
        <strong className="text-encre">Cet essai a deux retours.</strong> Les lettres et la note
        sur 20 de Fragments se corrigent et se publient sur{' '}
        <Link href={retourEssai} className="underline">la page de l’essai</Link>. Ici, c’est la
        correction de la chaîne de mesure — Expression, Argumentation, Structure — que tu publies
        pour l’élève ; elle porte son profil de compétences, pas sa note.
      </div>
      <div className="mt-6">
        <EcranProf vue={vue} />
      </div>
    </main>
  )
}
