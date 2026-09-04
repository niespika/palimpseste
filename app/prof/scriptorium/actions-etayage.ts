'use server'
// ============================================================================
// L'INTERRUPTEUR DE L'ÉTAYAGE PAR NIVEAU (Aletheia, E9) — sa bascule, depuis Paramètres
// de Scriptorium. Patron : `actions-copie-annotee.ts`. Le travail vit à
// `utils/aletheia/decoupage-serveur.ts` (`basculerLaPorteEtayage`).
// ============================================================================
import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerLaPorteEtayage } from '@/utils/aletheia/decoupage-serveur'

export interface RetourPorte { ok: boolean; message: string }

export async function actionBasculerEtayage(_prec: RetourPorte | null, form: FormData): Promise<RetourPorte> {
  const { admin } = await garderProf(false)
  const actif = String(form.get('actif') ?? '') === 'oui'
  const r = await basculerLaPorteEtayage(admin, actif)
  if (r.ok) {
    revalidatePath('/prof/scriptorium')
    revalidatePath('/prof/aletheia', 'layout')
    revalidatePath('/eleve/modules/aletheia', 'layout')
  }
  return r
}
