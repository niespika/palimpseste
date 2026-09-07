'use server'
// ============================================================================
// C7 · L9 — L'INTERRUPTEUR « SUR UN CRAN QUI ISOLE, LE JUGE EST LA MESURE » — sa
// bascule, depuis Paramètres de Scriptorium. Patron : `actions-chaine-cle.ts`.
// Le travail vit à `utils/chaine/porte-mesure.ts`.
// ============================================================================
import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { basculerLaPorteJugeMesure } from '@/utils/chaine/porte-mesure'

export interface RetourPorteMesure { ok: boolean; message: string }

export async function actionBasculerJugeMesure(
  _prec: RetourPorteMesure | null, form: FormData,
): Promise<RetourPorteMesure> {
  const { admin } = await garderProf(false)
  const actif = String(form.get('actif') ?? '') === 'oui'
  const r = await basculerLaPorteJugeMesure(admin, actif)
  // La chaîne lit la porte à chaque dépôt (`lireContexte`), le routeur à chaque
  // cycle : rien d'autre à revalider que l'onglet lui-même.
  if (r.ok) revalidatePath('/prof/scriptorium')
  return r
}
