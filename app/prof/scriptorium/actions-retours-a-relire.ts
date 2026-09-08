'use server'

import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerLesRetoursARelire, type RetourPorteRelecture } from '@/utils/pilotage/porte-retours-a-relire'

export async function actionBasculerRetoursARelire(
  _precedent: RetourPorteRelecture | null, form: FormData,
): Promise<RetourPorteRelecture> {
  const { admin } = await garderProf(false)
  const actif = form.get('actif')
  const depuis = form.get('depuis')
  if ((actif !== 'oui' && actif !== 'non') || typeof depuis !== 'string'
    || (depuis !== '' && !Number.isFinite(Date.parse(depuis)))) {
    return { ok: false, message: 'Réglage invalide. Recharge la page puis réessaie.' }
  }
  const retour = await basculerLesRetoursARelire(admin, actif === 'oui', depuis || null)
  if (retour.ok) {
    revalidatePath('/prof/scriptorium')
    revalidatePath('/prof/classes/[id]', 'page')
  }
  return retour
}
