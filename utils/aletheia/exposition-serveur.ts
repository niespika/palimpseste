import 'server-only'
// ============================================================================
// ALETHEIA · E8 — LES SÉANCES EXPOSÉES À UN ÉLÈVE, DEPUIS UN JOB SANS COOKIE.
// ----------------------------------------------------------------------------
// Les retours se génèrent en arrière-plan (`after()`) : pas de session, donc pas de
// classe « active ». On retrouve les classes de l'élève qui exposent ce livre (module
// Aletheia actif, inscription active, lien direct ou parcours) et on prend le verdict
// d'exposition de la première — en mode C (§ 8.5), l'amont et le rappel ne prennent
// que les séances exposées. Aucune classe ⇒ null : les appelants gardent « toutes ».
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { inscriptionsModuleEleve } from '@/utils/acces'
import { livresGouvernesPourClasses, modeExposition } from '@/utils/aletheia-dates'

export async function exposeesPourEleve(admin: SupabaseClient, eleveId: string, livreId: string): Promise<number[] | null> {
  const { data: mod } = await admin.from('modules').select('id, actif').eq('slug', 'aletheia').maybeSingle()
  if (!mod?.actif) return null
  const inscriptions = await inscriptionsModuleEleve(admin, eleveId, mod.id as string)
  if (inscriptions.length === 0) return null
  const classeIds = inscriptions.map(i => i.classe_id)
  const { data: liens } = await admin.from('scriptorium_unite_classes').select('classe_id').eq('unite_id', livreId).in('classe_id', classeIds)
  let classeId = (liens ?? [])[0]?.classe_id as string | undefined
  if (!classeId) {
    for (const cid of classeIds) {
      if ((await livresGouvernesPourClasses(admin, [cid])).includes(livreId)) { classeId = cid; break }
    }
  }
  if (!classeId) return null
  const v = await modeExposition(admin, livreId, classeId)
  return [...v.exposees].sort((a, b) => a - b)
}

/** La séance exposée qui précède `semaine` (mode C : pas la semaine N−1 du livre). */
export function seanceExposeePrecedente(exposees: readonly number[] | null, semaine: number): number | null {
  if (!exposees || exposees.length === 0) return semaine > 1 ? semaine - 1 : null
  const ordre = [...exposees].sort((a, b) => a - b)
  const i = ordre.indexOf(semaine)
  if (i > 0) return ordre[i - 1]
  if (i === 0) return null
  const avant = ordre.filter(s => s < semaine)
  return avant.length ? avant[avant.length - 1] : null
}
