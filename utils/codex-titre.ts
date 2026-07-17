import 'server-only'
// Résolution BI-SOURCE des titres de session Codex (§6.2), SÉPARÉE de la requête
// principale pour la garder STATIQUE et byte-identique à l'avant-lot-5 (les selects
// dynamiques cassent l'inférence de types Supabase, et un embed direct casse quand
// plan_evaluation_phase_a.sql n'est pas jouée). GATÉE : gate OFF/absent → map vide
// (aucune session ancrée contenu n'existe alors). L'embed `scriptorium_contenus(titre)`
// ne s'exécute donc QUE gate ON (⟺ phase_a jouée ⟺ FK présente). Le `client` doit
// pouvoir lire scriptorium_contenus (admin, ou client prof — RLS prof-only).

import type { SupabaseClient } from '@supabase/supabase-js'
import { lireGatePlanActif } from './plan-exercices'

export async function titresCoursParSession(client: SupabaseClient, sessionIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (sessionIds.length === 0) return out
  if (!(await lireGatePlanActif(client))) return out
  const { data } = await client
    .from('codex_sessions')
    .select('id, scriptorium_contenus(titre)')
    .in('id', sessionIds)
    .not('contenu_id', 'is', null)
  for (const r of data ?? []) {
    const rel = r.scriptorium_contenus
    const c = (Array.isArray(rel) ? rel[0] : rel) as { titre?: string } | null | undefined
    if (c?.titre) out.set(r.id as string, c.titre)
  }
  return out
}
