'use server'
// ============================================================================
// L'AGENDA DE CLASSE — L'INTERRUPTEUR `agenda_classe_actif`, sa bascule depuis
// Paramètres de Scriptorium. Patron : `actions-notions.ts`. Le travail vit à
// `utils/calendrier-agenda-porte.ts`.
// ============================================================================
import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerLaPorteAgenda } from '@/utils/calendrier-agenda-porte'

export interface RetourPorteAgenda { ok: boolean; message: string }

export async function actionBasculerAgenda(
  _prec: RetourPorteAgenda | null, form: FormData,
): Promise<RetourPorteAgenda> {
  const { admin } = await garderProf(false)
  const actif = String(form.get('actif') ?? '') === 'oui'
  const r = await basculerLaPorteAgenda(admin, actif)
  if (r.ok) {
    revalidatePath('/prof/scriptorium')
    revalidatePath('/prof/calendrier')
    revalidatePath('/eleve/calendrier')
  }
  return r
}
