import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { TravailAletheia } from '@/app/eleve/modules/aletheia/types'

export type CopieReservee = TravailAletheia & {
  retour_generation: string
  v1_revision: string
  vf_revision: string
}

/** La base réserve et lit la copie atomiquement. Aucune génération sans réservation. */
export async function reclamerRetour(admin: SupabaseClient, travailId: string, phase: 'v1' | 'vf'): Promise<CopieReservee | null> {
  const { data, error } = await admin.rpc('aletheia_reclamer_retour', { p_travail: travailId, p_phase: phase })
  if (error) throw new Error(`Réservation du retour ${phase} : ${error.message}`)
  return data as CopieReservee | null
}
