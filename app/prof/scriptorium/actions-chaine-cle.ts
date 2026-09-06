'use server'
// ============================================================================
// C7 · L8 — L'INTERRUPTEUR « LA CHAÎNE À L'HEURE DE LA CLÉ » — sa bascule, depuis
// Paramètres de Scriptorium. Patron : `actions-juge-documents.ts`. Le travail
// vit à `utils/chaine/porte-cle.ts`.
// ============================================================================
import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerLaPorteChaineCle } from '@/utils/chaine/porte-cle'

export interface RetourPorteCle { ok: boolean; message: string }

export async function actionBasculerChaineCle(
  _prec: RetourPorteCle | null, form: FormData,
): Promise<RetourPorteCle> {
  const { admin } = await garderProf(false)
  const actif = String(form.get('actif') ?? '') === 'oui'
  const r = await basculerLaPorteChaineCle(admin, actif)
  // La chaîne lit la porte à chaque dépôt (`lireContexte`) : rien d'autre à
  // revalider que l'onglet lui-même.
  if (r.ok) revalidatePath('/prof/scriptorium')
  return r
}
