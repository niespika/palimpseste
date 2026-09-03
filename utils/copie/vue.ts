import 'server-only'
// ============================================================================
// LA COPIE ANNOTÉE — LE LOADER. Une page, un dépôt, tout ce que la base en sait.
// ----------------------------------------------------------------------------
// Rien n'est regénéré : la copie, les squelettes (P1 + P2), les mesures
// (lettres), le retour. Le placement et la mise en forme sont dans le module
// PUR `annotations.ts` ; ici on LIT, et on assemble.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { lireDepot } from '../passation/depots'
import { lireLesRetours, pointsAAfficher } from '../passation/retours'
import { enTexte } from '../passation/vues'
import { annoterLaCopie, type CopieAnnotee } from './annotations'
import type { Competence, PointRetour } from '../chaine/types'

type Admin = SupabaseClient

export interface VueCopieAnnotee {
  depotId: string
  exerciceId: string
  eleve: string
  consigne: string
  lieu: string
  statut: string
  /** La copie telle que la CHAÎNE l'a lue — `texte_v1` d'abord, `transcription_v1` sinon. */
  production: string | null
  auClavier: boolean
  version: 'v1' | 'vf'
  /** Une vf existe-t-elle (squelettes vf) ? L'écran offre alors le second onglet. */
  versions: Array<'v1' | 'vf'>
  annote: CopieAnnotee
  commentaire: string | null
  messageReporte: string | null
  remiseLe: string | null
}

function production(texte: unknown, transcription: unknown): string | null {
  const t = typeof texte === 'string' && texte.trim() !== '' ? texte : null
  if (t) return t
  return typeof transcription === 'string' && transcription.trim() !== '' ? transcription : null
}

export async function chargerLaCopieAnnotee(
  admin: Admin, depotId: string, version: 'v1' | 'vf' = 'v1',
): Promise<VueCopieAnnotee | null> {
  const d = await lireDepot(admin, depotId)
  if (!d) return null

  const [{ data: sq }, { data: mes }, { data: prof }, retours, { data: vf }] = await Promise.all([
    admin.from('exercices_squelettes')
      .select('competence, version, artefact_extraction, artefact_jugement')
      .eq('depot_id', depotId),
    admin.from('competences_mesures').select('competence, lettre_equivalente').eq('depot_id', depotId),
    admin.from('profiles').select('display_name').eq('id', d.eleve_id).maybeSingle(),
    lireLesRetours(admin, depotId),
    admin.from('exercices_depots').select('texte_vf, transcription_vf').eq('id', depotId).maybeSingle(),
  ])

  const squelettes = (sq ?? []) as Array<{ competence: string; version: string; artefact_extraction: unknown; artefact_jugement: unknown }>
  const versions: Array<'v1' | 'vf'> = ['v1']
  if (squelettes.some((s) => s.version === 'vf')) versions.push('vf')
  const v = versions.includes(version) ? version : 'v1'

  const prod = v === 'vf'
    ? production((vf as { texte_vf?: unknown } | null)?.texte_vf, (vf as { transcription_vf?: unknown } | null)?.transcription_vf)
    : production(d.texte_v1, d.transcription_v1)

  const lettres: Partial<Record<Competence, string | null>> = {}
  for (const m of (mes ?? []) as Array<{ competence: string; lettre_equivalente: string | null }>) {
    lettres[m.competence as Competence] = m.lettre_equivalente
  }

  // Le retour de la version : « chaud » pour la v1, « final » pour la vf.
  const r = retours.find((x) => x.moment === (v === 'vf' ? 'final' : 'chaud')) ?? (v === 'v1' ? retours[0] : undefined) ?? null

  const annote = annoterLaCopie({
    production: prod ?? '',
    squelettes: squelettes.filter((s) => s.version === v)
      .map((s) => ({ competence: s.competence, extraction: s.artefact_extraction, jugement: s.artefact_jugement })),
    lettres,
    retour: r ? {
      moment: r.moment,
      points: pointsAAfficher(r) as PointRetour[],
      publie: r.published_at != null,
      edite: r.texte_edite_par_prof != null,
      feedForward: r.feed_forward,
    } : null,
  })

  return {
    depotId: d.id,
    exerciceId: d.exercice.id,
    eleve: String((prof as { display_name?: string } | null)?.display_name ?? '') || d.eleve_id.slice(0, 8),
    consigne: enTexte(d.exercice.consigne_instanciee),
    lieu: String(d.exercice.lieu),
    statut: d.statut,
    production: prod,
    auClavier: d.transcription_v1 == null && d.texte_v1 != null,
    version: v,
    versions,
    annote,
    commentaire: d.commentaire_general,
    messageReporte: d.message_lisibilite_reporte,
    remiseLe: d.v1_remis_at,
  }
}
