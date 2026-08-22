// ============================================================================
// C4 · L4 — LE JOURNAL DES COLLAGES BLOQUÉS, ET SA LECTURE.
// ----------------------------------------------------------------------------
// « Les champs de rédaction refusent le collage — raccourci clavier,
//   glisser-déposer, menu contextuel », et « CHAQUE TENTATIVE BLOQUÉE EST
//   JOURNALISÉE. »                                          — `06-` §1, 29/07
//
// ⭐ DÉCISION DE LOUIS, 22/08 : LES TROIS VECTEURS SE RAPPORTENT AU PROFESSEUR.
//    Le lot avait tenu la journalisation pour une trace serveur — un
//    `console.warn` que personne ne lit et que le professeur ne voit jamais.
//    Ce n'est pas un journal.
//
// ⚠️ CE N'EST PAS UN VERDICT, ET L'ÉCRAN DOIT LE DIRE. Le §7 de la SPEC ne fait
//    jamais d'un signal isolé un drapeau : c'est la CONVERGENCE qui part au
//    professeur, par `signalerEnAttenteIA`, avec confirmation humaine — « tous
//    tagués, aucun bloquant, jamais un verdict ». Ici, rien n'est écrit dans
//    `integrite_signalements` : « la journalisation d'une tentative alimente le
//    faisceau, QUI NE REGARDE QUE LA MAISON » (`06-` §6 ; piège 37). En classe,
//    elle INFORME le professeur, elle ne l'accuse pas.
//
// ⚠️ LA RÉSERVE DE LA SOURCE SE PORTE JUSQU'À L'ÉCRAN, écrite noir sur blanc :
//    « ce blocage est CÔTÉ NAVIGATEUR SEULEMENT. Il arrête le geste paresseux,
//    qui est le geste majoritaire ; il n'arrête pas l'élève déterminé qui
//    recopie à l'écran ce que son téléphone affiche. » Un zéro ne prouve donc
//    rien, et le professeur doit lire ce compte en le sachant.
//
// Fichier PUR : aucun `server-only`, aucun accès base — il est testé sous
// `npm test`.
// ============================================================================

/** Les trois vecteurs que la source nomme, et eux seuls. */
export const MOYENS_DE_COLLAGE = ['raccourci', 'glisser-deposer', 'menu-contextuel'] as const

export type MoyenDeCollage = (typeof MOYENS_DE_COLLAGE)[number]

/**
 * Le nom que le professeur lit. ⚠️ Le code du moyen est en ASCII — il voyage
 * jusqu'à une garde en base (`depots_collages_chk`) ; le nom, lui, est du
 * français, et il vit ici seul.
 */
export const NOM_DU_MOYEN: Record<MoyenDeCollage, string> = {
  raccourci: 'raccourci clavier',
  'glisser-deposer': 'glisser-déposer',
  'menu-contextuel': 'menu contextuel',
}

export interface CollageBloque {
  moyen: MoyenDeCollage
  /** L'instant du SERVEUR — l'horloge du navigateur de l'élève n'est pas une source. */
  at: string
}

export function estUnMoyen(v: unknown): v is MoyenDeCollage {
  return typeof v === 'string' && (MOYENS_DE_COLLAGE as readonly string[]).includes(v)
}

/**
 * Ce que la colonne rend, rendu sûr.
 *
 * ⚠️ TOLÉRANT À LA LECTURE, STRICT À L'ÉCRITURE : la garde en base ferme le
 *    domaine, mais une colonne `jsonb` lue par du code qui suppose sa forme est
 *    exactement ce qui fait tomber un écran de correction en pleine classe. Une
 *    entrée qu'on ne sait pas lire est écartée, elle n'emporte pas les autres.
 */
export function lireLesCollages(brut: unknown): CollageBloque[] {
  if (!Array.isArray(brut)) return []
  const out: CollageBloque[] = []
  for (const e of brut) {
    if (!e || typeof e !== 'object') continue
    const { moyen, at } = e as Record<string, unknown>
    if (!estUnMoyen(moyen)) continue
    if (typeof at !== 'string' || at.trim() === '') continue
    out.push({ moyen, at })
  }
  return out
}

export interface ResumeDesCollages {
  total: number
  /** Les moyens EFFECTIVEMENT tentés, du plus fréquent au moins fréquent. */
  parMoyen: Array<{ moyen: MoyenDeCollage; nom: string; n: number }>
  /** L'instant de la dernière tentative — `null` s'il n'y en a aucune. */
  dernier: string | null
}

export function resumerCollages(collages: readonly CollageBloque[]): ResumeDesCollages {
  const par = new Map<MoyenDeCollage, number>()
  let dernier: string | null = null
  for (const c of collages) {
    par.set(c.moyen, (par.get(c.moyen) ?? 0) + 1)
    if (dernier == null || c.at > dernier) dernier = c.at
  }
  const parMoyen = [...par.entries()]
    .map(([moyen, n]) => ({ moyen, nom: NOM_DU_MOYEN[moyen], n }))
    // Le plus fréquent d'abord ; à égalité, l'ordre de la source — il est stable
    // et il se lit toujours dans le même sens.
    .sort((a, b) => b.n - a.n
      || MOYENS_DE_COLLAGE.indexOf(a.moyen) - MOYENS_DE_COLLAGE.indexOf(b.moyen))
  return { total: collages.length, parMoyen, dernier }
}

/**
 * La phrase que le professeur lit — ou `null` quand il n'y a rien à dire.
 *
 * ⚠️ `null` ET PAS « 0 tentative » : « un écran n'affiche un nombre que si ce
 *    nombre compte quelque chose » (`06-` §5), et un zéro afficherait surtout
 *    une garantie que le blocage ne donne pas (cf. la réserve, en tête).
 */
export function phraseDesCollages(r: ResumeDesCollages): string | null {
  if (r.total === 0) return null
  const detail = r.parMoyen.map(({ nom, n }) => `${n} au ${nom}`).join(', ')
  return `${r.total} tentative${r.total > 1 ? 's' : ''} de collage bloquée${r.total > 1 ? 's' : ''}`
    + ` — ${detail}`
}
