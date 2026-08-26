'use client'

import ReunirCopies from './ReunirCopies'
import SupprimerConception from './SupprimerConception'
import type { EntretienDeConception } from '@/utils/examens/entretien-serveur'

// ---------------------------------------------------------------------------
// L'ENTRETIEN D'UNE CONCEPTION, en tête de passation — pour les DEUX modules.
//
// Deux gestes qui ne se présentent jamais ensemble :
//  · RÉUNIR, quand une jumelle identique existe et qu'il reste des copies ici ;
//  · SUPPRIMER, quand il n'y a plus aucune copie.
//
// ⚠️ Le second s'affiche même quand il ne peut pas s'exécuter, et DIT pourquoi.
//    Un bouton qui disparaît en silence ne laisse que la déduction — et le
//    26/08, cherchant pourquoi il manquait, on ne pouvait que deviner entre
//    « pas déployé », « rattachée au plan » et « une copie traîne ».
// ---------------------------------------------------------------------------

export default function EntretienConception({
  exerciceId,
  entretien,
}: {
  exerciceId: string
  entretien: EntretienDeConception
}) {
  const { etat, jumelleId, copiesRemises, aucuneCopie } = entretien
  const aReunir = jumelleId !== null && copiesRemises.some((c) => c.remise)

  return (
    <>
      {aReunir && <ReunirCopies copies={copiesRemises} cibleId={jumelleId!} />}
      {aucuneCopie && <SupprimerConception exerciceId={exerciceId} etat={etat} />}
    </>
  )
}
