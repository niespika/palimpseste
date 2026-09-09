import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { moduleIdsDesClasses } from '@/utils/acces'
import { lireReglagesRag } from '@/utils/scriptorium-rag'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { jourDansFuseau } from '@/utils/fuseau'
import { lundiOnOrBefore, toISODate } from '@/utils/calendrier-grille'
import { retoursDExamenALire } from '@/utils/codex-onglets/liste'
import { signalDeLaSemaine } from './semaine-serveur'
import { signalDuPush } from './bonus-serveur'
import { fichesDejaServies } from './fiche-serveur'

type ModuleInfo = { id: string; slug: string; nom: string; description: string | null; actif: boolean }
type InscriptionEnContexte = { classe_id: string; classe_nom: string }

/** Lectures indépendantes du tableau de bord, sans écriture ni cache persistant.
 * Chaque lecteur conserve ses propres portes : une tuile ne promet pas un écran
 * fermé. Les semaines sont par classe ; le push et les examens sont par élève.
 * Les lettres de Fragments restent dans leur module, jamais dans ce tableau.
 */
export async function chargerSignauxTableau(
  admin: SupabaseClient, supabase: SupabaseClient, eleveId: string,
  enContexte: readonly InscriptionEnContexte[],
) {
  const classeIds = enContexte.map((i) => i.classe_id)
  const fuseau = lireFuseau()
  const [semaines, push, fichesVues, examensALire, modulesActifs] = await Promise.all([
    (async () => {
      const tz = await fuseau
      const maintenant = new Date()
      const lundi = toISODate(lundiOnOrBefore(jourDansFuseau(maintenant, tz)))
      return Promise.all(enContexte.map(async (i) => ({
        classe: i.classe_nom,
        signal: await signalDeLaSemaine(admin, eleveId, i.classe_id, lundi, tz, maintenant),
      })))
    })(),
    (async () => {
      const tz = await fuseau
      const lundi = toISODate(lundiOnOrBefore(jourDansFuseau(new Date(), tz)))
      // Le push est une suggestion par élève, jamais une assignation.
      return classeIds.length ? signalDuPush(admin, eleveId, classeIds, lundi, tz) : null
    })(),
    // La fiche est rappelée jusqu'à son ouverture, sans marquer sa lecture ici.
    classeIds.length ? fichesDejaServies(admin, eleveId) : true,
    classeIds.length ? retoursDExamenALire(admin, eleveId) : [],
    (async () => {
      const [mods, rag] = await Promise.all([
        (async () => {
          const ids = await moduleIdsDesClasses(supabase, classeIds)
          if (!ids.size) return [] as ModuleInfo[]
          const { data } = await supabase.from('modules')
            .select('id, slug, nom, description, actif').in('id', [...ids])
          return (data ?? []) as ModuleInfo[]
        })(),
        lireReglagesRag(admin),
      ])
      // « Mes mondes » reste limité aux classes EN CONTEXTE et à rag_actif.
      return mods.filter((m) => m.actif === true && (rag.actif || m.slug !== 'scriptorium'))
    })(),
  ])
  return { semaines, push, fichesVues, examensALire, modulesActifs }
}
