'use server'
// L'INTERRUPTEUR « EN PARLER AVEC LE TUTEUR » — sa bascule, depuis Paramètres de
// Quazian. Patron : `actions-antichambre.ts`. ⛔ Aucun type exporté d'ici.
import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerPorteTuteur } from '@/utils/quazian-tuteur-serveur'

export async function actionBasculerTuteur(
  _prec: { ok: boolean; message: string } | null, form: FormData,
): Promise<{ ok: boolean; message: string }> {
  const { admin } = await garderProf(false)
  const actif = String(form.get('actif') ?? '') === 'oui'
  const r = await basculerPorteTuteur(admin, actif)
  if (r.ok) {
    revalidatePath('/prof/quazian', 'layout')
    revalidatePath('/eleve/modules/quazian', 'layout')
    revalidatePath('/eleve/modules/scriptorium')
  }
  return r
}
