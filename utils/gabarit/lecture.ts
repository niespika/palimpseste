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
// ⭐ 06/09 — LE CRAN 2 (`lireLeCran2`) : `constituant` et `pieces` du cas, le
//    GESTE lu dans `exercices_pieces` par (objet, genre) — jamais recopié dans
//    le code —, le test et les constituants de la fiche, et les observables
//    du constituant dans `exercices_problemes` (décision 17). ⚠️ Au cran 2
//    `probleme` est NUL (« le cran 2 n'isole rien », les deux contrôles
//    d'import) : un exercice 1.5 s'y reconnaît à `constituant` + `pieces`.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { lireLaPorteGabarit } from './porte'
import { pourquoiDuTemoin } from './candidats'
import type { Variante } from './consigne'
import { constituantDeLaGrille, lireLesPieces, observablesDuConstituant, type Piece } from './pieces'

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
    .select('ordre, probleme, constituant, pieces').eq('exercice_id', exerciceId).order('ordre')
  if (error) return VIDE()                       // colonne absente : pas de gabarit
  const clesParCas = new Map<number, string>()
  // ⭐ 06/09 — un cas de cran 2 n'a pas de clé : il porte un constituant et des pièces.
  let aDesPieces = false
  for (const c of (lus ?? []) as Array<{ ordre: number; probleme: string | null; constituant: unknown; pieces: unknown }>) {
    if (typeof c.probleme === 'string' && c.probleme.trim()) clesParCas.set(c.ordre, c.probleme.trim())
    if (typeof c.constituant === 'string' && c.constituant.trim() && lireLesPieces(c.pieces).length) aDesPieces = true
  }
  if (!clesParCas.size && !aDesPieces) return VIDE(false)
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

// ── ⭐ 06/09 — LE CRAN 2 : les pièces, le geste, le test, les observables ────

export interface CasDuCran2 {
  constituant: string
  pieces: Piece[]
}

export interface Cran2DuDepot {
  /** Par `ordre` du cas — un seul cas au cran 2, mais la forme reste celle des autres lectures. */
  parCas: Map<number, CasDuCran2>
  /** Le geste sur la pièce, écrit à la main dans la fiche (`exercices_pieces.geste`). */
  geste: string | null
  /** Le test de la fiche (`exercices_fiches_objets.test`) — la grille du juge (`10-` §6). */
  test: string | null
  /** Les constituants de la fiche, par leur nom — pour trouver celui de la pièce par élimination. */
  ficheConstituants: string[]
  /** Le constituant tel que la grille l'écrit ; `null` = la pièce est l'objet (tous les observables). */
  constituantGrille: string | null
  /** Les observables que la pièce engage — et eux seuls (décision 17). */
  observables: Array<{ code: string; competence: string | null }>
  incidents: string[]
}

/**
 * Tout ce que le cran 2 lit du gabarit, TOLÉRANT : une table absente rend
 * `null` là où elle manque, jamais un écran mort. `null` quand aucun cas ne
 * porte de pièces — un cran 2 de la banque 1.4, qui n'est pas du gabarit.
 */
export async function lireLeCran2(
  admin: SupabaseClient,
  a: { exerciceId: string; typeId: string | null; objet: string | null; genre: string | null },
): Promise<Cran2DuDepot | null> {
  const incidents: string[] = []
  const { data: lus, error } = await admin.from('exercices_cas')
    .select('ordre, constituant, pieces').eq('exercice_id', a.exerciceId).order('ordre')
  if (error) return null
  const parCas = new Map<number, CasDuCran2>()
  for (const c of (lus ?? []) as Array<{ ordre: number; constituant: unknown; pieces: unknown }>) {
    const pieces = lireLesPieces(c.pieces)
    if (typeof c.constituant === 'string' && c.constituant.trim() && pieces.length) {
      parCas.set(c.ordre, { constituant: c.constituant.trim(), pieces })
    }
  }
  if (!parCas.size) return null

  // Le geste — par (objet, genre), la fiche du genre d'abord.
  let geste: string | null = null
  if (a.objet) {
    const { data: gs, error: eG } = await admin.from('exercices_pieces')
      .select('genre, geste').eq('objet_code', a.objet)
    if (eG) incidents.push(`cran 2 : le geste de la pièce est illisible (${eG.code}) — jouer la dérivation`)
    const lignes = (gs ?? []) as Array<{ genre: string | null; geste: string | null }>
    const g = lignes.find((l) => l.genre === (a.genre ?? null)) ?? lignes.find((l) => l.genre === null) ?? lignes[0]
    geste = typeof g?.geste === 'string' && g.geste.trim() ? g.geste.trim() : null
    if (!geste) incidents.push(`cran 2 : aucun geste dérivé pour « ${a.objet} » — la consigne du dépôt est servie`)
  }

  // La fiche — le test, et les constituants.
  let test: string | null = null
  const ficheConstituants: string[] = []
  if (a.typeId) {
    const { data: fs, error: eF } = await admin.from('exercices_fiches_objets')
      .select('genre, test, constituants').eq('type_id', a.typeId)
    if (eF) incidents.push(`cran 2 : la fiche de l'objet est illisible (${eF.code})`)
    const lignes = (fs ?? []) as Array<{ genre: string | null; test: string | null; constituants: unknown }>
    const f = lignes.find((l) => l.genre === (a.genre ?? null)) ?? lignes.find((l) => l.genre === null) ?? lignes[0]
    test = typeof f?.test === 'string' && f.test.trim() ? f.test.trim() : null
    const brut = typeof f?.constituants === 'string' ? tenteJson(f.constituants) : f?.constituants
    if (Array.isArray(brut)) {
      for (const c of brut) {
        const nom = (c as { nom?: unknown })?.nom
        if (typeof nom === 'string' && nom.trim()) ficheConstituants.push(nom.trim())
      }
    }
  }

  // Les observables du constituant — la grille du `09-`, sur cet objet.
  let constituantGrille: string | null = null
  let observables: Cran2DuDepot['observables'] = []
  const premier = [...parCas.values()][0]!
  if (a.objet) {
    const { data: pb, error: ePb } = await admin.from('exercices_problemes')
      .select('constituant, observable_code, observable_competence').eq('objet_code', a.objet)
    if (ePb) incidents.push(`cran 2 : la grille du 09- est illisible (${ePb.code}) — le retour n'est pas borné`)
    const problemes = ((pb ?? []) as Array<{ constituant: unknown; observable_code: unknown; observable_competence: unknown }>)
      .map((p) => ({
        constituant: typeof p.constituant === 'string' ? p.constituant : '',
        code: typeof p.observable_code === 'string' && p.observable_code ? p.observable_code : null,
        competence: typeof p.observable_competence === 'string' ? p.observable_competence : null,
      }))
    const grille = [...new Set(problemes.map((p) => p.constituant).filter(Boolean))]
    constituantGrille = constituantDeLaGrille(premier.constituant, grille, ficheConstituants)
    if (constituantGrille === null && !/se confondent/i.test(premier.constituant)) {
      incidents.push(`cran 2 : le constituant « ${premier.constituant} » n'a pas d'entrée dans la grille de « ${a.objet} » — le retour se borne à l'objet entier`)
    }
    observables = observablesDuConstituant(problemes, constituantGrille)
  }
  return { parCas, geste, test, ficheConstituants, constituantGrille, observables, incidents }
}

function tenteJson(s: string): unknown {
  try { return JSON.parse(s) } catch { return null }
}
