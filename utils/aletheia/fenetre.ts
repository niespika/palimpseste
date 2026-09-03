// ============================================================================
// ALETHEIA · E6 — LES TROIS FORMES ET LE BARÈME DU SURLIGNAGE. Module PUR.
// ----------------------------------------------------------------------------
// Tailles (D5, calibrées par E0 : dix lignes ≈ 119 mots ≈ 3 phrases ; pivots de 13
// à 128 mots) :
//  · `montre` (E, D)      : la pivot entière + au moins une phrase avant et une après,
//                           et jamais moins de dix lignes (≈ 740 caractères rendus) ;
//  · `fenetre` (C, B)     : 400 mots arrondis à la phrase, la pivot à une position NON
//                           prévisible (graine = identifiant du travail) ;
//  · `demi_section` (A)   : la moitié des phrases de la séance qui contient la pivot.
// On ne coupe JAMAIS une phrase : tout se compte en phrases (§ 7.3).
// Barème (§ 7.3, en phrases) — S = phrases surlignées, P = une pivot, K = le passage :
//  · S couvre une pivot et déborde d'au plus une phrase de chaque côté → juste ;
//  · S chevauche une pivot sans la couvrir → presque ;
//  · S couvre une pivot et déborde de plus d'une phrase d'un côté → trop large ;
//  · S ⊂ K sans toucher P → bon endroit ; sinon → ailleurs.
// ============================================================================
import { rendreTranche, type DecoupeSemaine } from './decoupage'
import type { PassageCle } from './passages'
import type { Forme } from './forme'

export interface PhraseRendue { id: string; texte: string }
export interface FenetreRelance {
  forme: Forme
  phrases: PhraseRendue[]
  /** `montre` seulement : les identifiants à mettre en évidence (la pivot). Jamais servi aux autres formes. */
  enEvidence?: string[]
}

export const LIGNES_MONTRE_MIN_CAR = 740
export const MOTS_FENETRE = 400
export const ESSAIS_MAX = 2

const idx = (d: DecoupeSemaine, id: string) => d.phrases.findIndex(p => p.id === id)
const rendues = (d: DecoupeSemaine, texte: string, a: number, b: number): PhraseRendue[] =>
  d.phrases.slice(a, b + 1).map(p => ({ id: p.id, texte: rendreTranche(texte, p.bornes, d.masques) }))
const motsDe = (s: string) => s.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length

/** Graine déterministe (identifiant du travail) → nombre pseudo-aléatoire dans [0, 1). Pas de LCG semé : Math.imul reste dans 2³². */
export function hasard(graine: string): number {
  let h = 2166136261
  for (let i = 0; i < graine.length; i++) { h ^= graine.charCodeAt(i); h = Math.imul(h, 16777619) }
  return ((h >>> 0) % 10007) / 10007
}

function bornesPivot(d: DecoupeSemaine, p: PassageCle): [number, number] | null {
  const alt = p.pivots[0] ?? []
  const is = alt.map(x => idx(d, x)).filter(i => i >= 0)
  if (is.length === 0) return null
  return [Math.min(...is), Math.max(...is)]
}

/** `montre` : pivot ± 1 phrase, étendue symétriquement jusqu'à dix lignes rendues. */
export function fenetreMontre(d: DecoupeSemaine, texte: string, p: PassageCle): FenetreRelance | null {
  const piv = bornesPivot(d, p)
  if (!piv) return null
  let a = Math.max(0, piv[0] - 1), b = Math.min(d.phrases.length - 1, piv[1] + 1)
  let cote = 0
  while (rendues(d, texte, a, b).reduce((n, x) => n + x.texte.length + 1, 0) < LIGNES_MONTRE_MIN_CAR && (a > 0 || b < d.phrases.length - 1)) {
    if (cote % 2 === 0 ? a > 0 : b >= d.phrases.length - 1) a = Math.max(0, a - 1); else b = Math.min(d.phrases.length - 1, b + 1)
    cote++
  }
  return { forme: 'montre', phrases: rendues(d, texte, a, b), enEvidence: p.pivots[0] ?? [] }
}

/** `fenetre` : le passage étendu à ≥ 400 mots, la pivot à une position tirée de la graine. */
export function fenetreCherche(d: DecoupeSemaine, texte: string, p: PassageCle, graine: string, mots = MOTS_FENETRE): FenetreRelance | null {
  const piv = bornesPivot(d, p)
  if (!piv) return null
  const ia = Math.max(0, Math.min(idx(d, p.phrase_debut), piv[0])), ib = Math.max(idx(d, p.phrase_fin), piv[1])
  let a = ia === -1 ? piv[0] : ia, b = ib === -1 ? piv[1] : ib
  // Part de l'extension à mettre AVANT la pivot : entre 15 % et 85 %, tirée de la graine.
  const part = 0.15 + 0.7 * hasard(graine)
  const total = () => rendues(d, texte, a, b).reduce((n, x) => n + motsDe(x.texte), 0)
  while (total() < mots && (a > 0 || b < d.phrases.length - 1)) {
    const avant = piv[0] - a, apres = b - piv[1]
    const veutAvant = a > 0 && (b >= d.phrases.length - 1 || avant / Math.max(1, avant + apres) < part)
    if (veutAvant) a--; else b++
  }
  return { forme: 'fenetre', phrases: rendues(d, texte, a, b) }
}

/** `demi_section` : la moitié des phrases de la séance qui contient la pivot. */
export function demiSection(d: DecoupeSemaine, texte: string, p: PassageCle): FenetreRelance | null {
  const piv = bornesPivot(d, p)
  if (!piv) return null
  const n = d.phrases.length, milieu = Math.floor(n / 2)
  const [a, b] = piv[0] < milieu ? [0, Math.max(milieu - 1, piv[1])] : [Math.min(milieu, piv[0]), n - 1]
  return { forme: 'demi_section', phrases: rendues(d, texte, a, b) }
}

export function fenetrePour(forme: Forme, d: DecoupeSemaine, texte: string, p: PassageCle, graine: string): FenetreRelance | null {
  if (forme === 'montre') return fenetreMontre(d, texte, p)
  if (forme === 'fenetre') return fenetreCherche(d, texte, p, graine)
  return demiSection(d, texte, p)
}

// ── Barème ───────────────────────────────────────────────────────────────────

export type Verdict = 'juste' | 'presque' | 'trop_large' | 'bon_endroit' | 'ailleurs'
export interface ResultatBareme { verdict: Verdict; message: string }

export const MESSAGES: Record<Verdict, string> = {
  juste: 'C’est la phrase.',
  presque: 'Tu y es presque : prends la phrase entière.',
  trop_large: 'Tu y es, mais tu as pris trop large.',
  bon_endroit: 'Bon endroit, pas la phrase.',
  ailleurs: 'Ce n’est pas là. Relis à partir du début du passage.',
}

/**
 * Compare un surlignage (identifiants de phrases) aux pivots d'un passage. Les
 * alternatives sont toutes recevables ; on retient le meilleur verdict.
 */
export function bareme(d: DecoupeSemaine, p: PassageCle, selection: readonly string[]): ResultatBareme {
  const S = [...new Set(selection.map(x => idx(d, x)).filter(i => i >= 0))].sort((x, y) => x - y)
  if (S.length === 0) return { verdict: 'ailleurs', message: MESSAGES.ailleurs }
  const sMin = S[0], sMax = S[S.length - 1]
  const ka = idx(d, p.phrase_debut), kb = idx(d, p.phrase_fin)
  const ordre: Verdict[] = ['juste', 'trop_large', 'presque', 'bon_endroit', 'ailleurs']
  let meilleur: Verdict = 'ailleurs'
  for (const alt of p.pivots) {
    const is = alt.map(x => idx(d, x)).filter(i => i >= 0)
    if (is.length === 0) continue
    const pa = Math.min(...is), pb = Math.max(...is)
    const couvre = sMin <= pa && sMax >= pb
    const chevauche = sMax >= pa && sMin <= pb
    let v: Verdict
    if (couvre && pa - sMin <= 1 && sMax - pb <= 1) v = 'juste'
    else if (couvre) v = 'trop_large'
    else if (chevauche) v = 'presque'
    else if (ka !== -1 && kb !== -1 && sMin >= ka && sMax <= kb) v = 'bon_endroit'
    else v = 'ailleurs'
    if (ordre.indexOf(v) < ordre.indexOf(meilleur)) meilleur = v
  }
  return { verdict: meilleur, message: MESSAGES[meilleur] }
}

/** Libellé de la case de réponse, par forme (§ 6.3). */
export function libelleReponse(forme: Forme | null): string {
  if (forme === 'montre') return 'Relis ces lignes, puis réponds à la question en une ou deux phrases.'
  if (forme === 'fenetre' || forme === 'demi_section') return 'Surligne la phrase qui répond, puis dis en une phrase ce qu’elle change à ce que tu avais écrit.'
  return 'Relis ces lignes dans ton livre, puis réponds à la question en une ou deux phrases.'
}
