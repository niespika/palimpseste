// ============================================================================
// CODEX — LA PAGE PROJETÉE DE L'ÉPREUVE. 24/09/2026.
// ----------------------------------------------------------------------------
// « Je voudrais que ce sujet (et les consignes) puisse être projeté à l'écran,
//   donc il me faudrait une page spécifique (comme l'écran de tirage au sort
//   dans Vestigia). » — Louis, 24/09. Et le `02-` §6.D, étape 2, le prévoyait :
//   « le professeur affiche le sujet au tableau ».
//
// ⭐ PATRON : le tirage de Vestigia (`app/prof/fragments-erudition/tirage/`), en
//    plus couvrant — la scène se pose en `fixed inset-0` au-dessus de l'en-tête
//    du site (patron `app/prof/scriptorium/presentation/`) : à 1280 × 720, le
//    tirage passait sous le pli à cause de l'en-tête (`SUIVI_tests_manuels`).
//
// Route MINCE : elle garde, elle lit, elle ouvre le dépôt si l'heure est venue,
// elle rend la scène. Sous `/prof/codex/passation` : l'onglet reste allumé
// (`components/nav/configModules.ts`), aucun onglet n'est ajouté.
// ============================================================================

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { garderProf } from '@/utils/passation/garde'
import { lireLaPorteEpreuve, lireEtOuvrirSiVenue, compterLesCopies } from '@/utils/examens/epreuve-serveur'
import { lireFuseau } from '@/utils/fuseau-serveur'
import SceneEpreuve from '@/components/examens/SceneEpreuve'

export const dynamic = 'force-dynamic'

export default async function ProjectionEpreuve(
  { params }: { params: Promise<{ exerciceId: string }> },
) {
  const { exerciceId } = await params
  const { admin, actif } = await garderProf()
  // (`actif` = `passation_classe_actif` : la scène avertit s'il est fermé.)

  if (!(await lireLaPorteEpreuve(admin))) {
    return (
      <main className="mx-auto max-w-2xl space-y-3 p-4">
        <p className="rounded-lg border border-bordure bg-surface p-4 font-ui text-sm text-encre">
          L’épreuve minutée est fermée. Elle s’ouvre dans <strong>Codex → Paramètres</strong>.
        </p>
        <Link href={`/prof/codex/passation/${exerciceId}`} className="font-ui text-sm text-pigment underline">
          ← L’écran de passation
        </Link>
      </main>
    )
  }

  const [{ epreuve }, compte, fuseau] = await Promise.all([
    lireEtOuvrirSiVenue(admin, exerciceId),
    compterLesCopies(admin, exerciceId),
    lireFuseau(),
  ])
  if (!epreuve || epreuve.lieu !== 'classe' || !epreuve.estUnEssaiCodex) notFound()

  const { data: classe } = epreuve.classeId
    ? await admin.from('classes').select('nom').eq('id', epreuve.classeId).maybeSingle()
    : { data: null }

  // L'heure du SERVEUR fait foi : la scène s'en sert pour corriger celle du poste.
  const maintenant = new Date().toISOString()

  return (
    <SceneEpreuve
      exerciceId={exerciceId}
      classeNom={String((classe as { nom?: string } | null)?.nom ?? '')}
      sujet={epreuve.consigne}
      statut={epreuve.statut}
      fuseau={fuseau}
      maintenantServeur={maintenant}
      initial={{
        maintenant,
        debut: epreuve.debut,
        redactionMin: epreuve.redactionMin,
        relectureMin: epreuve.relectureMin,
        consignesPratiques: epreuve.consignesPratiques,
        ouverture: epreuve.ouverture,
        compte,
        passationActive: actif,
      }}
    />
  )
}
