'use server'
// L'INTERRUPTEUR DES RAPPORTS DE FRAGILITÉS CONSERVÉS — sa bascule, depuis
// Paramètres de Quazian. Patron : `actions-tuteur.ts`. ⛔ Aucun type exporté d'ici.
import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerPorteRapport } from '@/utils/quazian-rapports-serveur'

export async function actionBasculerRapport(
  _prec: { ok: boolean; message: string } | null, form: FormData,
): Promise<{ ok: boolean; message: string }> {
  const { admin } = await garderProf(false)
  const actif = String(form.get('actif') ?? '') === 'oui'
  const r = await basculerPorteRapport(admin, actif)
  if (r.ok) revalidatePath('/prof/quazian', 'layout')
  return r
}
