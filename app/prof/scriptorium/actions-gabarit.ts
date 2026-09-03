'use server'
// C7 — l'interrupteur du gabarit, sa bascule depuis Paramètres de Scriptorium.
// Patron : `actions-copie-annotee.ts`. Le travail vit à `utils/gabarit/porte.ts`.
import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerLaPorteGabarit } from '@/utils/gabarit/porte'

export interface RetourPorte { ok: boolean; message: string }

export async function actionBasculerGabarit(
  _prec: RetourPorte | null, form: FormData,
): Promise<RetourPorte> {
  const { admin } = await garderProf(false)
  const actif = String(form.get('actif') ?? '') === 'oui'
  const r = await basculerLaPorteGabarit(admin, actif)
  if (r.ok) revalidatePath('/prof/scriptorium')
  return r
}
