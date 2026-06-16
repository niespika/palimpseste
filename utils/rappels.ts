import type { SupabaseClient } from '@supabase/supabase-js'

// ----------------------------------------------------------------------------
// Rappels de fin d'année (Lot 2) — calculés à l'ouverture du dashboard, sans
// cron. Une classe non encore effacée déclenche un rappel à partir du 30/06
// (et 30/08), tant que le prof ne l'a pas écarté (« cette classe continue »).
// L'écartement est persistant jusqu'à l'effacement (décision Lot 2 → booléen
// classes.rappel_ecarte).
// ----------------------------------------------------------------------------

export interface ClasseRappel {
  id: string
  nom: string
  niveau: string | null
  filiere: string | null
  annee_scolaire: string
}

/**
 * Période de rappel : à partir du 30 juin (le « ≥ 30/08 » du spec est subsumé
 * par « ≥ 30/06 », l'écartement étant un one-shot).
 */
export function estPeriodeRappel(now: Date = new Date()): boolean {
  const mois = now.getMonth() + 1 // 1-12
  const jour = now.getDate()
  return mois > 6 || (mois === 6 && jour >= 30)
}

/**
 * Classes pour lesquelles afficher un rappel : non effacées (toujours en base),
 * non écartées, dans la période. Vide hors période.
 */
export async function classesAvecRappel(
  supabase: SupabaseClient
): Promise<ClasseRappel[]> {
  if (!estPeriodeRappel()) return []
  const { data } = await supabase
    .from('classes')
    .select('id, nom, niveau, filiere, annee_scolaire')
    .eq('rappel_ecarte', false)
    .order('nom')
  return (data ?? []) as ClasseRappel[]
}
