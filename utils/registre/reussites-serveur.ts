import 'server-only'
// ============================================================================
// C7 · L1 — LE REGISTRE DES RÉUSSITES, lu en base pour UN élève. La règle est à
// `reussites.ts` ; ici, les lectures — et elles sont TOLÉRANTES.
// ⚠️ `verdicts_cran` naît de `c7_l1_juge_documents.sql` : il se lit par une
//    requête SÉPARÉE, jamais dans le `select` principal — une colonne absente
//    ferait échouer la requête entière (`42703`).
// ⚠️ Aucun consommateur encore : le routeur (lot C7-L5) le lira avant la
//    distribution par palier. Ce lecteur existe pour que le registre soit
//    mesurable dès maintenant, sur décor comme sur corpus.
// ============================================================================
import type { createAdminClient } from '@/utils/supabase/admin'
import { cranNumero } from '@/utils/cran'
import { cibleDansLeMateriau, verdictDeLaZone } from '@/utils/deroule/designation'
import { lireLesVerdicts } from '@/utils/chaine/juge-cran'
import { deriverLeRegistre, type DepotPourLeRegistre, type LigneRegistre } from './reussites'

type Admin = ReturnType<typeof createAdminClient>

const STATUTS_JUGES = ['v1_remis', 'retour_publie', 'vf_remis', 'clos'] as const

export async function lireLesDepotsPourLeRegistre(
  admin: Admin, eleveId: string,
): Promise<{ depots: DepotPourLeRegistre[]; incidents: string[] }> {
  const incidents: string[] = []
  const { data, error } = await admin.from('exercices_depots')
    .select('id, statut, v1_remis_at, vf_remis_at, exercices(cran, exercices_types(code), '
      + 'exercices_cas(ordre, exercices_materiaux(contenu, version_corrigee))), '
      + 'exercices_metacognition(credence)')
    .eq('eleve_id', eleveId).in('statut', [...STATUTS_JUGES])
  if (error) return { depots: [], incidents: [`dépôts illisibles : ${error.code} ${error.message}`] }
  const lignes = (data ?? []) as unknown as Array<{
    id: string; v1_remis_at: string | null; vf_remis_at: string | null
    exercices: unknown; exercices_metacognition: unknown
  }>
  if (!lignes.length) return { depots: [], incidents }

  // Les verdicts, à part et tolérants.
  const verdicts = new Map<string, unknown>()
  const { data: v, error: eV } = await admin.from('exercices_depots')
    .select('id, verdicts_cran').in('id', lignes.map((l) => l.id))
  if (eV) incidents.push(`verdicts du cran illisibles (${eV.code}) : le registre se dérive sans le juge`)
  for (const x of (v ?? []) as unknown as Array<{ id: string; verdicts_cran: unknown }>) {
    verdicts.set(x.id, x.verdicts_cran)
  }

  const un = <T,>(x: unknown): T | null => (Array.isArray(x) ? (x[0] ?? null) : (x as T | null))
  const depots: DepotPourLeRegistre[] = []
  for (const l of lignes) {
    const ex = un<{ cran: unknown; exercices_types: unknown; exercices_cas: unknown }>(l.exercices)
    const cran = cranNumero(ex?.cran)
    const objet = un<{ code: string }>(ex?.exercices_types)?.code ?? null
    if (cran == null || !objet) continue
    const meta = un<{ credence: unknown }>(l.exercices_metacognition)
    const credence = Array.isArray(meta?.credence) ? (meta!.credence as unknown[]) : []
    const cas = (Array.isArray(ex?.exercices_cas) ? ex!.exercices_cas : []) as Array<{
      ordre: number; exercices_materiaux: unknown
    }>
    const zones: DepotPourLeRegistre['zones'] = []
    for (const c of cas) {
      const m = un<{ contenu: string | null; version_corrigee: string | null }>(c.exercices_materiaux)
      const entree = credence.find((e) => !!e && typeof e === 'object' && (e as { cas?: unknown }).cas === c.ordre) as
        { zone?: unknown; zone_at?: unknown } | undefined
      if (!entree || typeof entree.zone_at !== 'string') continue
      const cible = cibleDansLeMateriau(m?.contenu, m?.version_corrigee)
      const z = Array.isArray(entree.zone) && entree.zone.length === 2
        ? ([Number(entree.zone[0]), Number(entree.zone[1])] as const) : null
      zones.push({ cas: c.ordre,
        verdict: cible && z && m?.contenu ? verdictDeLaZone(m.contenu, cible, z).verdict : null })
    }
    depots.push({
      depotId: l.id, objet, cran, variante: null,
      at: l.vf_remis_at ?? l.v1_remis_at ?? '',
      verdicts: lireLesVerdicts(verdicts.get(l.id)),
      credence, zones,
    })
  }
  return { depots, incidents }
}

export async function lireLeRegistreDesReussites(
  admin: Admin, eleveId: string,
): Promise<{ registre: LigneRegistre[]; incidents: string[] }> {
  const { depots, incidents } = await lireLesDepotsPourLeRegistre(admin, eleveId)
  return { registre: deriverLeRegistre(depots), incidents }
}
