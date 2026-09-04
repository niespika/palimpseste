// ============================================================================
// C7 · L1 — LE REGISTRE DES RÉUSSITES. « Une ligne par élève × objet × cran ×
// variante : réussites, échecs, dates. Elle SE DÉRIVE de ce qui existe —
// `competences_mesures`, la crédence de `exercices_metacognition`, le verdict
// de zone — et ne se déclare pas » (`10-Gabarit.md` §7 ; `01-` §3 amendé le
// 03/09). Aucune table neuve : ce module est le dériveur, et il est PUR.
// ----------------------------------------------------------------------------
// « Ce qui compte pour réussi » — la table du `10-` §7 :
//   1(a), 1(b), 3 : la majorité des jetons sur le bon candidat (`index_correct`).
//   4(a), 9, 5, 7 : le juge du cran (`juge-cran.ts`), contre ce qu'on tient pour vrai.
//   4(b)          : la zone est la cible ou la contient dans la tolérance (cas 2, 3, 4b).
//   6, 8          : les seuils des observables — ⚠️ NON DÉRIVÉ ICI : c'est le lot
//                   C7-L5 qui le lira au moteur ; ces lignes rendent `null`.
//   toute paire   : LE SECOND CAS est réussi seul ; le premier informe l'escalade.
// « Deux et deux » (décision 19) : deux réussites au cran d'en dessous débloquent
// le cran suivant ; deux échecs de suite au même cran déclenchent les sondes.
// ⚠️ Les deux nombres « se revoient sur corpus, pas avant » : ils vivent ici.
// ============================================================================
import type { Version } from '../chaine/types'
import { issueDesVerdicts, type VerdictCran } from '../chaine/juge-cran'

export type Issue = 'reussi' | 'rate'
export type Variante = 'a' | 'b' | null

export const REUSSITES_POUR_DEBLOQUER = 2
export const ECHECS_POUR_SONDER = 2

/** L'échelle de l'appui, « colonne par colonne du `02-` §2.1 : donné → nommé → absent ». */
export const ECHELLES: ReadonlyArray<readonly [number, number, number]> = [[1, 4, 9], [3, 5, 7], [2, 6, 8]]

/** Ce qu'un dépôt apporte au registre — lu en base, mis à cette forme par le serveur. */
export interface DepotPourLeRegistre {
  depotId: string
  objet: string
  cran: number
  variante: Variante
  /** L'instant qui date le dépôt — la remise de la dernière version. */
  at: string
  verdicts: Partial<Record<Version, VerdictCran>>
  /** Les entrées de la crédence, par cas — telles qu'écrites (`credence.ts`). */
  credence: unknown[]
  /** Le verdict de la porte de zone, par cas — `juste` compte seul (cas 2, 3). */
  zones: Array<{ cas: number; verdict: string | null }>
}

export interface LigneRegistre {
  objet: string
  cran: number
  variante: Variante
  reussites: number
  echecs: number
  /** Les issues dans l'ordre du temps — la fin dit la série en cours. */
  serie: Issue[]
  dernierAt: string | null
}

// ── L'issue d'un dépôt ───────────────────────────────────────────────────────

function jetonsDuCas(c: unknown): { cas: number; reussi: boolean } | null {
  if (!c || typeof c !== 'object') return null
  const o = c as Record<string, unknown>
  if (!Array.isArray(o.jetons) || typeof o.index_correct !== 'number' || typeof o.cas !== 'number') return null
  const j = o.jetons.map((x) => (typeof x === 'number' ? x : 0))
  const max = Math.max(...j)
  const gagnants = j.filter((x) => x === max).length
  // Une égalité ne désigne personne — comme à l'écran de correction (C4-L14).
  return { cas: o.cas, reussi: gagnants === 1 && j[o.index_correct] === max }
}

/**
 * L'issue d'UN dépôt, cran par cran. `null` quand rien ne permet de trancher —
 * un dépôt sans crédence, un juge qui a manqué, un cran que ce lot ne dérive pas.
 */
export function issueDuDepot(d: DepotPourLeRegistre): Issue | null {
  switch (d.cran) {
    case 1: case 3: {
      const cas = d.credence.map(jetonsDuCas).filter((x): x is { cas: number; reussi: boolean } => !!x)
      if (!cas.length) return null
      // « Toute paire : le second cas est réussi seul. »
      const dernier = cas.reduce((a, b) => (b.cas > a.cas ? b : a))
      return dernier.reussi ? 'reussi' : 'rate'
    }
    case 4: {
      if (d.variante === 'b') {
        const dernier = [...d.zones].sort((a, b) => a.cas - b.cas).at(-1)
        if (!dernier || dernier.verdict === null) return null
        return dernier.verdict === 'juste' ? 'reussi' : 'rate'
      }
      return issueDesVerdicts(d.verdicts)
    }
    case 5: case 7: case 9:
      return issueDesVerdicts(d.verdicts)
    default:
      return null
  }
}

// ── Le registre ──────────────────────────────────────────────────────────────

const cle = (objet: string, cran: number, variante: Variante) => `${objet}|${cran}|${variante ?? ''}`

/** Les lignes d'UN élève, dérivées de ses dépôts. Les dépôts sans issue ne comptent pas. */
export function deriverLeRegistre(depots: readonly DepotPourLeRegistre[]): LigneRegistre[] {
  const lignes = new Map<string, LigneRegistre>()
  const tries = [...depots].sort((a, b) => a.at.localeCompare(b.at))
  for (const d of tries) {
    const issue = issueDuDepot(d)
    if (!issue) continue
    const k = cle(d.objet, d.cran, d.variante)
    const l = lignes.get(k) ?? {
      objet: d.objet, cran: d.cran, variante: d.variante, reussites: 0, echecs: 0, serie: [], dernierAt: null,
    }
    if (issue === 'reussi') l.reussites += 1; else l.echecs += 1
    l.serie.push(issue)
    l.dernierAt = d.at
    lignes.set(k, l)
  }
  return [...lignes.values()]
}

function reussitesAuCran(registre: readonly LigneRegistre[], objet: string, cran: number): number {
  // Les variantes (a) et (b) d'un cran comptent ensemble.
  return registre.filter((l) => l.objet === objet && l.cran === cran)
    .reduce((n, l) => n + l.reussites, 0)
}

/**
 * Les crans DÉBLOQUÉS sur un objet — « un cran ne se sert sur un objet que si le
 * cran d'en dessous, sur le même geste et le même objet, a été réussi deux fois ».
 * Le bas de chaque échelle est toujours ouvert.
 *
 * ⚠️ La règle se lit PAR PAIRE, cran contre le cran d'en dessous — pas comme une
 *    chaîne depuis le bas : un élève qui a réussi deux fois au 4 a le 9 ouvert,
 *    même sans réussite inscrite au 1 (servi avant la porte, ou par le professeur).
 *    Le 4 lui-même n'est alors pas « débloqué » par le registre ; il est déjà
 *    réussi, et le routeur (C7-L5) lit les deux.
 */
export function cransDebloques(registre: readonly LigneRegistre[], objet: string): number[] {
  const out: number[] = []
  for (const echelle of ECHELLES) {
    out.push(echelle[0])
    for (let i = 1; i < echelle.length; i++) {
      // ⭐ C7-L5 — un cran s'ouvre aussi par SES PROPRES deux réussites : ce sont
      //    les sondes de montée réussies (`10-` §7, décision 14) — « le cran d'en
      //    dessous est tenu pour acquis et la porte s'ouvre ».
      if (reussitesAuCran(registre, objet, echelle[i - 1]!) >= REUSSITES_POUR_DEBLOQUER
        || reussitesAuCran(registre, objet, echelle[i]!) >= REUSSITES_POUR_DEBLOQUER) out.push(echelle[i]!)
    }
  }
  return out.sort((a, b) => a - b)
}

/**
 * Les crans où une SONDE DE MONTÉE est due — deux échecs DE SUITE, à la fin de la
 * série, sur le même objet et le même cran (`10-` §7, décisions 14 et 19). La
 * sonde se sert au cran d'au-dessus de l'échelle ; ce module dit seulement OÙ
 * l'élève stagne.
 */
export function cransOuLEleveStagne(registre: readonly LigneRegistre[], objet: string): number[] {
  const crans = new Set<number>()
  for (const l of registre) {
    if (l.objet !== objet) continue
    const fin = l.serie.slice(-ECHECS_POUR_SONDER)
    if (fin.length === ECHECS_POUR_SONDER && fin.every((x) => x === 'rate')) crans.add(l.cran)
  }
  return [...crans].sort((a, b) => a - b)
}

/** Le cran d'au-dessus dans l'échelle, ou `null` en haut. */
export function cranSuivant(cran: number): number | null {
  for (const e of ECHELLES) {
    const i = e.indexOf(cran)
    if (i >= 0) return e[i + 1] ?? null
  }
  return null
}
