'use server'
// ============================================================================
// L'ALLUMAGE — LE GESTE, ET LUI SEUL.
// ----------------------------------------------------------------------------
// « Les trois sont à OFF jusqu'à la recette, et ils s'ouvrent DANS L'ORDRE QUE
//   LE PROFESSEUR DÉCIDE » (`07-` §5). Cet écran n'impose donc aucune séquence,
//   ne grise rien, et ne refuse aucune combinaison : il bascule ce qu'on lui
//   demande, et il DIT ce que la combinaison produit.
//
// ⛔ CE FICHIER NE POSE PAS DE SEPTIÈME INTERRUPTEUR et n'en invente aucun :
//    `estUnInterrupteur` referme la porte sur les six déclarés au §5.
// ============================================================================

import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerLInterrupteur, estUnInterrupteur } from '@/utils/allumage'

export interface Retour {
  ok: boolean
  message: string
  /** L'interrupteur touché, pour que l'écran sache de qui l'on parle. */
  nom: string | null
}

/**
 * Basculer UN interrupteur. Le formulaire porte son nom et l'état VOULU —
 * jamais « l'inverse de ce que je crois voir » : deux onglets ouverts sur cet
 * écran se contrediraient, et le dernier clic gagnerait sur une valeur périmée.
 */
export async function basculer(_prec: Retour | null, form: FormData): Promise<Retour> {
  // ⚠️ `false` : une action serveur JETTE, elle ne redirige pas (patron C4-L2).
  const { admin } = await garderProf(false)

  const nom = String(form.get('interrupteur') ?? '')
  if (!estUnInterrupteur(nom)) {
    return { ok: false, message: `« ${nom} » n’est pas l’un des six interrupteurs.`, nom: null }
  }

  const brut = String(form.get('vers') ?? '')
  if (brut !== 'on' && brut !== 'off') {
    return { ok: false, message: 'État demandé illisible — attendu « on » ou « off ».', nom }
  }
  const actif = brut === 'on'

  const r = await basculerLInterrupteur(admin, nom, actif)
  if (!r.ok) {
    return { ok: false, message: `Non basculé — ${r.erreur}`, nom }
  }

  // ⚠️ LES DEUX FACES, PAS SEULEMENT CELLE DU PROFESSEUR. Ces six booléens
  //    commandent d'abord des écrans ÉLÈVE — `exercices_actif` ouvre le déroulé
  //    à la maison et la tuile Codex. Ne revalider que `/prof` laisserait
  //    l'élève sur une page cachée d'avant la bascule, et le professeur
  //    conclurait que l'interrupteur n'a rien fait. Le patron des deux côtés est
  //    celui de `sauvegarderReglagesRag`.
  revalidatePath('/prof', 'layout')
  revalidatePath('/eleve', 'layout')

  return { ok: true, message: actif ? 'Ouvert.' : 'Refermé.', nom }
}
