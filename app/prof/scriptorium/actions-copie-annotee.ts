'use server'
// ============================================================================
// L'INTERRUPTEUR DE LA COPIE ANNOTÉE — sa bascule, depuis Paramètres de Scriptorium.
// Patron : `app/prof/signalements/actions.ts`. Le travail vit à `utils/copie/porte.ts`.
// ⚠️ Fichier à part : `actions.ts` de Scriptorium fait 2 800 lignes.
// ============================================================================
import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerLaPorteCopieAnnotee } from '@/utils/copie/porte'

export interface RetourPorte { ok: boolean; message: string }

export async function actionBasculerCopieAnnotee(
  _prec: RetourPorte | null, form: FormData,
): Promise<RetourPorte> {
  const { admin } = await garderProf(false)
  const actif = String(form.get('actif') ?? '') === 'oui'
  const r = await basculerLaPorteCopieAnnotee(admin, actif)
  if (r.ok) {
    revalidatePath('/prof/scriptorium')
    // Les trois passations lisent la porte, et les pages de copie aussi.
    revalidatePath('/prof/codex', 'layout')
    revalidatePath('/prof/aletheia', 'layout')
    revalidatePath('/prof/fragments-erudition', 'layout')
  }
  return r
}
