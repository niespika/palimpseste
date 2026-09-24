// ============================================================================
// C4 · L4 — LA PASSATION EN CLASSE, côté élève, DANS CODEX.
// ----------------------------------------------------------------------------
// « L'élève dépose LUI-MÊME, DEPUIS SON COMPTE — ce qui règle l'appariement
//   élève ↔ pages sans en-tête pré-imprimé, sans code à scanner et sans journal
//   de réattribution. »                                     — `06-` §1 ; piège 9
//
// Le dépôt est identifié par SON id : c'est le compte connecté qui le lie à
// l'élève, et `chargerVueEleve` refuse un dépôt qui n'est pas le sien.
//
// ⭐ 24/09 — `<div>`, PAS `<main>` (le défaut nommé par C5-L4 : la coquille de
//    l'élève rend déjà un `<main>`), et la colonne s'ÉLARGIT (`max-w-5xl` au
//    lieu de `max-w-2xl`) : la relecture pose la photo à côté du texte quand la
//    place le permet (handoff « Relire »).
// ⭐ 24/09 — LA CONFIRMATION avant « Valider ma copie », sur décision de Louis,
//    derrière la porte de l'épreuve minutée. Posée ICI, dans la page de Codex :
//    `EcranEleve` sert aussi Aletheia et l'essai de Fragments.
// ============================================================================

import { notFound } from 'next/navigation'
import { garderEleve } from '@/utils/passation/garde'
import { chargerVueEleve } from '@/utils/passation/vues'
import { lireDepot } from '@/utils/passation/depots'
import { EcranEleve } from '@/components/passation/EcranEleve'
import { lireLaPorteEpreuve } from '@/utils/examens/epreuve-serveur'
import { CONFIRMATION_AVANT_VALIDATION } from '@/utils/examens/epreuve'

export default async function PassationCodexEleve(
  { params }: { params: Promise<{ depotId: string }> },
) {
  const { depotId } = await params
  const { admin, userId, ouvert } = await garderEleve()
  // ⚠️ La porte de la passation D'ABORD (revue du 24/09) : `chargerVueEleve`
  //    lit l'épreuve, et cette lecture OUVRE le dépôt de toute la classe si
  //    l'heure est passée — elle ne doit pas tourner derrière une porte fermée.
  if (!ouvert) {
    const d = await lireDepot(admin, depotId)
    if (!d || d.eleve_id !== userId || d.exercice.lieu !== 'classe') notFound()
    return (
      <div className="mx-auto max-w-2xl p-4">
        <p className="rounded-lg border border-bordure bg-surface p-4 text-encre">
          Cet écran n’est pas encore ouvert. Ton professeur t’indiquera quand.
        </p>
      </div>
    )
  }
  const epreuveOuverte = await lireLaPorteEpreuve(admin)
  const vue = await chargerVueEleve(admin, depotId, userId, { avecPhotos: epreuveOuverte })
  if (!vue) notFound()
  return (
    <div className={`mx-auto p-4 ${epreuveOuverte ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <EcranEleve vue={vue} refonte={epreuveOuverte}
        confirmation={epreuveOuverte ? CONFIRMATION_AVANT_VALIDATION : undefined} />
    </div>
  )
}
