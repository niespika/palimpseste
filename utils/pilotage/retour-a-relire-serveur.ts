import 'server-only'
import type { createAdminClient } from '../supabase/admin'
import { lireContexte } from '../chaine/contexte'
import { codesDeLInstrument } from '../chaine/chaine'
import { regimeJugeMesure } from '../chaine/juge-mesure'
import { lireLesVerdicts } from '../chaine/juge-cran'
import type { RetourSegmente } from '../chaine/types'
import { drapeauDuRetourARelire } from './retour-a-relire'
import type { Drapeau } from './attention'

type Admin = ReturnType<typeof createAdminClient>
interface RetourLu {
  id: string; depot_id: string; moment: 'chaud' | 'final'; texte: unknown
  action_revision: { texte?: string } | null; feed_forward: string | null
  created_at: string; published_at: string | null; lu_at: string | null
  texte_edite_par_prof: unknown
  exercices_depots: { eleve_id: string; verdicts_cran: unknown }
}

/** Relecture uniquement : ni job rejoué, ni retour modifié, ni signal persisté. */
export async function drapeauxDeRetourARelire(
  admin: Admin, eleveIds: string[], nomDe: Map<string, string>, incidents: string[],
): Promise<Drapeau[]> {
  const porte = await admin.from('scriptorium_params')
    .select('retours_a_relire_depuis').eq('id', 1).maybeSingle()
  // Une migration absente ferme sa porte sans casser le panneau existant.
  if (porte.error) {
    if (!['42703', 'PGRST204'].includes(porte.error.code)) {
      incidents.push(`l’ouverture des retours à relire : ${porte.error.message}`)
    }
    return []
  }
  const depuis = porte.data?.retours_a_relire_depuis as string | null
  if (!depuis || eleveIds.length === 0) return []
  if (!Number.isFinite(Date.parse(depuis))) {
    incidents.push('l’ouverture des retours à relire : date illisible')
    return []
  }
  const drapeaux: Drapeau[] = []
  const ids = [...new Set(eleveIds)]
  for (let debut = 0; debut < ids.length; debut += 200) {
    const retours: RetourLu[] = []
    let total: number | null = null
    let complet = true
    for (let page = 0; ; page += 500) {
      const r = await admin.from('exercices_retours')
        .select('id, depot_id, moment, texte, action_revision, feed_forward, created_at, '
          + 'published_at, lu_at, texte_edite_par_prof, exercices_depots!inner(eleve_id, verdicts_cran)',
        { count: 'exact' })
        .in('exercices_depots.eleve_id', ids.slice(debut, debut + 200))
        .gte('created_at', depuis).not('published_at', 'is', null).is('lu_at', null)
        .order('id').range(page, page + 499)
      if (r.error || r.count === null || (total !== null && total !== r.count)) {
        incidents.push(`les retours à relire : ${r.error?.message ?? 'le compte a changé pendant la lecture ; actualiser le panneau'}`)
        complet = false
        break
      }
      total = r.count
      const lignes = r.data as unknown as RetourLu[]
      retours.push(...lignes)
      if (lignes.length < 500) break
    }
    if (!complet) continue
    if (retours.length !== total) {
      incidents.push('les retours à relire : lecture tronquée ; aucun résultat de ce groupe affiché')
      continue
    }
    for (const r of retours) {
      if (r.texte_edite_par_prof) continue
      try {
        if (!Array.isArray(r.texte) || r.texte.length === 0
            || r.texte.some((p) => !p || !['reussite', 'point_de_travail'].includes(p.nature))) {
          throw new Error('les points du retour sont illisibles')
        }
        const ctx = await lireContexte(admin, r.depot_id)
        const version = r.moment === 'chaud' ? 'v1' : 'vf'
        const verdict = lireLesVerdicts(r.exercices_depots.verdicts_cran)[version]
        // Le même périmètre que la chaîne, pas la porte seule ni un cran deviné.
        const regime = regimeJugeMesure(ctx, codesDeLInstrument)
        const drapeau = drapeauDuRetourARelire({
          depotId: r.depot_id, eleveId: r.exercices_depots.eleve_id,
          eleveNom: nomDe.get(r.exercices_depots.eleve_id) ?? '?',
          moment: r.moment, creeLe: r.created_at, publieLe: r.published_at, luLe: r.lu_at,
          editeParProf: !!r.texte_edite_par_prof, grain: ctx.grain,
          sansReussiteAdmise: regime.actif && verdict?.reussi === false,
          retour: { points: r.texte as RetourSegmente['points'],
            action_revision: r.action_revision?.texte ?? null, feed_forward: r.feed_forward },
        }, depuis)
        if (drapeau) drapeaux.push(drapeau)
      } catch (e) {
        incidents.push(`le retour à relire du dépôt ${r.depot_id} : ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }
  return drapeaux
}
