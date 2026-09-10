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
import { devoirsDeLInstance } from '@/utils/moteur/vivier-serveur'
import { deriverLeRegistre, type DepotPourLeRegistre, type LigneRegistre } from './reussites'

type Admin = ReturnType<typeof createAdminClient>

const STATUTS_JUGES = ['v1_remis', 'retour_publie', 'vf_remis', 'clos'] as const

export async function lireLesDepotsPourLeRegistre(
  admin: Admin, eleveId: string,
  /**
   * ⭐ C7-L9 — UN SEUL dépôt, quand la chaîne dérive l'issue du dépôt qu'elle
   *    traite (« le verdict du cran a DÉJÀ un domicile, ne le recalcule pas » —
   *    piège 1). Même lecture, même forme ; la liste se borne, rien d'autre.
   */
  seulement: { depotId?: string } = {},
): Promise<{ depots: DepotPourLeRegistre[]; incidents: string[] }> {
  const incidents: string[] = []
  // ⭐ C7-L7 — LE DEVOIR entre au registre : `materiau_id` sur la même jointure,
  //    et `id_import` pour la souche du cran 2 (`devoirsDeLInstance`).
  // ⭐ C7-L9 — et la VARIANTE de l'instance (`exercices.variante`, C7-L2) : sans
  //    elle, `issueDuDepot` lit le 4(b) comme un 4(a) et attend un juge qu'il n'a
  //    pas — la porte de zone est son verdict (`10-` §7).
  let q = admin.from('exercices_depots')
    .select('id, statut, v1_remis_at, vf_remis_at, exercices(cran, variante, id_import, exercices_types(code), '
      + 'exercices_cas(ordre, materiau_id, exercices_materiaux(contenu, version_corrigee))), '
      + 'exercices_metacognition(credence)')
    .eq('eleve_id', eleveId).in('statut', [...STATUTS_JUGES])
  if (seulement.depotId) q = q.eq('id', seulement.depotId)
  const { data, error } = await q
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

  // ⭐ C7-L7 — la souche du cran 2 retrouve son devoir par l'`id_import` des
  //    matériaux fabriqués. Tolérant : illisible ⇒ le cran 2 est son propre devoir.
  const parImport = new Map<string, string>()
  const { data: mats, error: eM } = await admin.from('exercices_materiaux')
    .select('id, id_import').not('id_import', 'is', null).limit(10000)
  if (eM) incidents.push(`matériaux fabriqués illisibles (${eM.code}) : le devoir du cran 2 ne se retrouve pas`)
  for (const m of (mats ?? []) as Array<{ id: string; id_import: string | null }>) {
    if (m.id_import) parImport.set(m.id_import, m.id)
  }

  const un = <T,>(x: unknown): T | null => (Array.isArray(x) ? (x[0] ?? null) : (x as T | null))
  const depots: DepotPourLeRegistre[] = []
  for (const l of lignes) {
    const ex = un<{ cran: unknown; variante?: unknown; id_import: string | null; exercices_types: unknown; exercices_cas: unknown }>(l.exercices)
    // Aucun seuil de progression n’a été décidé pour le contrat local du pilote.
    if (typeof ex?.id_import === 'string' && ex.id_import.startsWith('pilote-argument-')) continue
    const cran = cranNumero(ex?.cran)
    const objet = un<{ code: string }>(ex?.exercices_types)?.code ?? null
    if (cran == null || !objet) continue
    const meta = un<{ credence: unknown }>(l.exercices_metacognition)
    const credence = Array.isArray(meta?.credence) ? (meta!.credence as unknown[]) : []
    const cas = (Array.isArray(ex?.exercices_cas) ? ex!.exercices_cas : []) as Array<{
      ordre: number; materiau_id: string | null; exercices_materiaux: unknown
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
    // ⭐ C7-L9 — la variante, telle que la banque 1.5 la porte (`a` / `b`) ; `null` ailleurs.
    const variante = ex?.variante === 'a' || ex?.variante === 'b' ? ex.variante : null
    depots.push({
      depotId: l.id, objet, cran, variante,
      at: l.vf_remis_at ?? l.v1_remis_at ?? '',
      verdicts: lireLesVerdicts(verdicts.get(l.id)),
      credence, zones,
      devoirs: devoirsDeLInstance(ex?.id_import ?? null, cas, parImport),
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
