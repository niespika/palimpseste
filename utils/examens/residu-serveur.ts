import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { etatDeConception, type EtatDeConception, type LignePourResidu } from './residu'

// Le LECTEUR de la règle de `residu.ts` — deux lectures, aucune décision.
// (Patron `utils/assiduite/collecte.ts` / `collecte-serveur.ts` : la règle est
// pure et testée, l'accès base vit à côté.)

/** L'état d'une conception : rattachée à une ligne vivante, ou résidu. */
export async function lireEtatDeConception(
  admin: SupabaseClient, exerciceId: string,
): Promise<EtatDeConception> {
  const { data: exo } = await admin
    .from('exercices').select('exercice_planifie_id').eq('id', exerciceId).maybeSingle()
  const planifieId = (exo as { exercice_planifie_id: string | null } | null)?.exercice_planifie_id
  if (!planifieId) return etatDeConception(null)

  const { data: ligne } = await admin
    .from('scriptorium_exercices_planifies')
    .select('statut, supprime_at').eq('id', planifieId).maybeSingle()
  return etatDeConception((ligne as LignePourResidu | null) ?? null)
}
