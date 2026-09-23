'use server'
// ============================================================================
// L'INTERRUPTEUR DE L'ANTICHAMBRE — sa bascule, depuis Paramètres de Quazian.
// Patron : `app/prof/scriptorium/actions-copie-annotee.ts`. Le travail vit à
// `utils/quazian-antichambre-serveur.ts`. ⛔ Aucun type exporté d'ici.
// ============================================================================
import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerPorteAntichambre } from '@/utils/quazian-antichambre-serveur'

export async function actionBasculerAntichambre(
  _prec: { ok: boolean; message: string } | null, form: FormData,
): Promise<{ ok: boolean; message: string }> {
  const { admin } = await garderProf(false)
  const actif = String(form.get('actif') ?? '') === 'oui'
  const r = await basculerPorteAntichambre(admin, actif)
  if (r.ok) {
    revalidatePath('/prof/quazian', 'layout')
    revalidatePath('/eleve/modules/quazian', 'layout')
    revalidatePath('/eleve')
  }
  return r
}
