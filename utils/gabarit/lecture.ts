import 'server-only'
// ============================================================================
// C7 · L3 — CE QUE L'ÉCRAN LIT DU GABARIT, avec tolérance.
// ----------------------------------------------------------------------------
// Quatre lectures, toutes SÉPARÉES du `select` principal du déroulé et toutes
// TOLÉRANTES : une colonne ou une table absente (migration `c7_l2_gabarit_base.sql`
// non jouée) rend « pas de gabarit », jamais un écran mort.
//   · la porte `gabarit_actif` (`utils/gabarit/porte.ts`) ;
//   · `exercices.variante` et `exercices_cas.probleme`, par cas ;
//   · les ÉNONCÉS des clés servies (`exercices_problemes`, dérivée du 09-) ;
//   · le marquage par cran × variante (`exercices_marquage_gabarit`, du 10- §5) ;
//   · les devoirs témoins du 1(b) (`exercices_materiaux`, par `id_import`).
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { lireLaPorteGabarit } from './porte'
import { pourquoiDuTemoin } from './candidats'
import type { Variante } from './consigne'

export interface GabaritDuDepot {
  /** La porte est ouverte ET l'exercice est au format 1.5. */
  actif: boolean
  /** L'exercice porte une clé de problème — un exercice 1.5 — même porte fermée. */
  exercice15: boolean
  variante: Variante
  /** La clé du problème par cas (ordre → clé). */
  clesParCas: Map<number, string>
  /** L'énoncé de chaque clé lue — la clé du cas, et les candidats du 1(a). */
  enonces: Map<string, string>
  /** La phrase du 10- §5 pour ce cran × variante (celle du premier cas), `null` = rien à marquer. */
  marquage: string | null
  /** ⭐ 04/09 — la phrase par VARIANTE : le second cas d'une paire est (b). */
  marquageDe: (variante: Variante) => string | null
  /** Les témoins du 1(b), par `id_import` : le texte et son pourquoi. */
  temoins: Map<string, { texte: string; pourquoi: string | null }>
  /** Ce que la base n'a pas rendu — pour le professeur, jamais l'élève. */
  incidents: string[]
}

const VIDE = (exercice15 = false): GabaritDuDepot => ({
  actif: false, exercice15, variante: null, clesParCas: new Map(), enonces: new Map(),
  marquage: null, marquageDe: () => null, temoins: new Map(), incidents: [],
})

export async function lireLeGabaritDuDepot(
  admin: SupabaseClient, exerciceId: string, cran: number | null,
  cas: ReadonlyArray<{ ordre: number; distracteurs: unknown }>,
): Promise<GabaritDuDepot> {
  const { data: lus, error } = await admin.from('exercices_cas')
    .select('ordre, probleme').eq('exercice_id', exerciceId).order('ordre')
  if (error) return VIDE()                       // colonne absente : pas de gabarit
  const clesParCas = new Map<number, string>()
  for (const c of (lus ?? []) as Array<{ ordre: number; probleme: string | null }>) {
    if (typeof c.probleme === 'string' && c.probleme.trim()) clesParCas.set(c.ordre, c.probleme.trim())
  }
  if (!clesParCas.size) return VIDE(false)
  const incidents: string[] = []
  const ouverte = await lireLaPorteGabarit(admin)
  if (!ouverte) return { ...VIDE(true), clesParCas }

  const { data: ex, error: eEx } = await admin.from('exercices')
    .select('variante').eq('id', exerciceId).maybeSingle()
  const variante = (!eEx && (ex?.variante === 'a' || ex?.variante === 'b')) ? ex.variante as Variante : null
  if (eEx) incidents.push(`gabarit : \`variante\` illisible (${eEx.code})`)

  // Les énoncés — la clé de chaque cas, et les candidats du 1(a) (des clés).
  const cles = new Set<string>(clesParCas.values())
  if (cran === 1 && variante === 'a') {
    for (const c of cas) for (const d of (Array.isArray(c.distracteurs) ? c.distracteurs : [])) {
      if (typeof d === 'string') cles.add(d)
    }
  }
  const enonces = new Map<string, string>()
  if (cles.size) {
    const { data: pb, error: ePb } = await admin.from('exercices_problemes')
      .select('cle, enonce').in('cle', [...cles])
    if (ePb) incidents.push(`gabarit : la grille du 09- est illisible (${ePb.code}) — jouer la dérivation`)
    for (const p of (pb ?? []) as Array<{ cle: string; enonce: string }>) enonces.set(p.cle, p.enonce)
    for (const k of cles) if (!enonces.has(k)) incidents.push(`gabarit : la clé « ${k} » n'est pas dans la grille dérivée`)
  }

  // Le marquage, par cran × variante — la table du 10- §5, TOUTES les variantes
  // du cran : le second cas d'une paire lit celle du (b).
  const marquages = new Map<string, string | null>()
  if (cran != null) {
    const { data: ms, error: eM } = await admin.from('exercices_marquage_gabarit')
      .select('variante, marquage').eq('cran', cran)
    if (eM) incidents.push(`gabarit : le marquage du 10- §5 est illisible (${eM.code})`)
    for (const m of (ms ?? []) as Array<{ variante: string; marquage: string | null }>) {
      marquages.set(m.variante, typeof m.marquage === 'string' ? m.marquage : null)
    }
  }
  const marquageDe = (v: Variante): string | null => marquages.get(v ?? '-') ?? null
  const marquage = marquageDe(variante)

  // Les témoins du 1(b) — par `id_import`.
  const temoins = new Map<string, { texte: string; pourquoi: string | null }>()
  // ⭐ 04/09 — les témoins servent au 1(b) ET au second cas d'un 1(a).
  if (cran === 1) {
    const ids = new Set<string>()
    for (const c of cas) for (const d of (Array.isArray(c.distracteurs) ? c.distracteurs : [])) {
      if (typeof d === 'string') ids.add(d)
    }
    if (ids.size) {
      const { data: mats, error: eT } = await admin.from('exercices_materiaux')
        .select('id_import, contenu, defaut').in('id_import', [...ids])
      if (eT) incidents.push(`gabarit : les devoirs témoins sont illisibles (${eT.code})`)
      for (const t of (mats ?? []) as Array<{ id_import: string; contenu: string; defaut: string | null }>) {
        temoins.set(t.id_import, { texte: t.contenu, pourquoi: pourquoiDuTemoin(t.defaut) })
      }
    }
  }
  return { actif: true, exercice15: true, variante, clesParCas, enonces, marquage, marquageDe, temoins, incidents }
}
