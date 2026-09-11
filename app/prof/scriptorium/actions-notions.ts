'use server'
// ============================================================================
// LA TROISIÈME VOIE DU RATTACHEMENT — L'INTERRUPTEUR `notions_actif`, sa bascule
// depuis Paramètres de Scriptorium. Patron : `actions-chaine-cle.ts`. Le travail
// vit à `utils/moteur/porte-notions.ts`.
// ============================================================================
import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerLaPorteNotions } from '@/utils/moteur/porte-notions'

export interface RetourPorteNotions { ok: boolean; message: string }

export async function actionBasculerNotions(
  _prec: RetourPorteNotions | null, form: FormData,
): Promise<RetourPorteNotions> {
  const { admin } = await garderProf(false)
  const actif = String(form.get('actif') ?? '') === 'oui'
  const r = await basculerLaPorteNotions(admin, actif)
  // Le routeur lit la porte à chaque cycle et à chaque pull : rien d'autre à revalider.
  if (r.ok) revalidatePath('/prof/scriptorium')
  return r
}
