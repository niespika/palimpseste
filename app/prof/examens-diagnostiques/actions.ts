'use server'

// ============================================================================
// C4 · L9 — LE GESTE DE CONCEPTION, POUR LES DEUX MODULES.
// ----------------------------------------------------------------------------
// « Il valide, l'instance naît avec `lieu = classe`, et la ligne de plan passe
//   *conçue*. »                                               — `07-` §2, C4-L9
//
// Un seul geste, deux entrées : ce dossier ne porte AUCUNE page — il n'ouvre
// donc aucune route. Les deux écrans vivent dans leur module
// (`/prof/codex/examen-diagnostique/[planifieId]` et son jumeau Aletheia),
// parce que « les sommatifs se conçoivent CHACUN DANS SON MODULE » (`02-` §6 B).
//
// ⚠️ CE FICHIER NE RÉORGANISE PAS LA NAVIGATION : il ne s'ajoute pas aux
//    sous-onglets de `components/nav/configModules.ts` — « un module = 2-3
//    onglets » (`AGENTS.md`), et les onglets sont C4-L6 et C5-L4.
// ============================================================================

import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/fabrique/acces'
import { concevoirExamenDiagnostique } from '@/utils/examens/conception'
import { MODULES_EXAMEN, type ModuleExamen } from '@/utils/examens/types'

export interface RetourExamen {
  ok: boolean
  message: string
  empechements?: string[]
  exerciceId?: string
  classeId?: string
}

export async function concevoirExamen(
  _prec: RetourExamen | null, form: FormData,
): Promise<RetourExamen> {
  const { admin } = await garderProf(false)

  const planifieId = String(form.get('planifie_id') ?? '')
  const matiereId = String(form.get('matiere_id') ?? '')
  const consigne = String(form.get('consigne') ?? '')
  // `mod` et non `module` : Next.js interdit d'assigner cet identifiant.
  const mod = String(form.get('module') ?? '') as ModuleExamen
  if (!MODULES_EXAMEN.includes(mod)) {
    return { ok: false, message: 'Module inconnu : un examen diagnostique vit dans Codex ou dans Aletheia.' }
  }

  const issue = await concevoirExamenDiagnostique(admin, planifieId, matiereId, consigne, {
    // ⭐ LES DEUX DRAPEAUX D'OPT-IN DE CLASSE (`02-` §5 ; §1.1). L'écran DOIT
    //    les offrir : sans eux, « une passation en classe ne produit AUCUN
    //    signal de Monitoring », et « une année de collecte manquée ne se
    //    rattrape pas ». Ils restent levables jusqu'à l'ouverture du dépôt
    //    (C4-L4, `leverLesDrapeaux`) — ici, c'est la première occasion.
    seJuger: form.get('optin_se_juger') === 'oui',
    confianceRemise: form.get('optin_confiance_remise') === 'oui',
  })
  if (!issue.ok) {
    return { ok: false, message: issue.message, ...(issue.empechements ? { empechements: issue.empechements } : {}) }
  }

  revalidatePath(`/prof/${mod}`)
  revalidatePath(`/prof/${mod}/examen-diagnostique/${planifieId}`)
  revalidatePath('/prof/conception')
  return {
    ok: true,
    exerciceId: issue.data.exerciceId,
    classeId: issue.data.classeId,
    message: 'Examen diagnostique conçu — l’instance porte `lieu = classe`, et la ligne de plan '
      + 'est passée « conçue ». Assignez-la à sa classe pour que les dépôts naissent, '
      + 'puis ouvrez-les le jour de l’épreuve.',
  }
}
