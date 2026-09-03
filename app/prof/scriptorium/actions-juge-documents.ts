'use server'
// ============================================================================
// C7 · L1 — L'INTERRUPTEUR « LE JUGE REÇOIT LES DOCUMENTS » — sa bascule, depuis
// Paramètres de Scriptorium. Patron : `actions-copie-annotee.ts`. Le travail vit
// à `utils/juge/porte.ts`.
// ============================================================================
import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerLaPorteJugeDocuments } from '@/utils/juge/porte'

export interface RetourPorte { ok: boolean; message: string }

export async function actionBasculerJugeDocuments(
  _prec: RetourPorte | null, form: FormData,
): Promise<RetourPorte> {
  const { admin } = await garderProf(false)
  const actif = String(form.get('actif') ?? '') === 'oui'
  const r = await basculerLaPorteJugeDocuments(admin, actif)
  // La chaîne lit la porte à chaque dépôt (`lireContexte`) : rien d'autre à
  // revalider que l'onglet lui-même.
  if (r.ok) revalidatePath('/prof/scriptorium')
  return r
}
