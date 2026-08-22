// ============================================================================
// C4 · L2 — LA MESURE, telle que le routeur la LIT.
// ----------------------------------------------------------------------------
// « Les colonnes que tes règles lisent — `distance_contexte`, `delai_jours`,
//   `delai_mesures`, `delta_v1_vf`, les deux résultats de la paire — SONT ÉCRITES
//   PAR LA CHAÎNE, JAMAIS INTERPRÉTÉES PAR ELLE : le sens est chez toi. »
//
// Ce module ne porte donc AUCUNE règle : il porte la forme d'une ligne de
// `competences_mesures` et les trois lectures élémentaires que toutes les règles
// refont — le groupe de modes, l'ancre, la trajectoire.
//
// Ce fichier est PUR.
// ============================================================================

import { ECHELLE_RECEPTIVE } from './config'
import { PALIERS, type Competence, type Mode, type Palier } from './types'

/** `07-` §1.2 — une ligne de `competences_mesures`, réduite à ce que le routeur lit. */
export interface Mesure {
  id: string
  competence: Competence
  /** `07-` §1.2 — « une LISTE, jamais une valeur ». Les groupes se recouvrent (`01-` §7). */
  modes: Mode[]
  /** `null` tant que l'étape de notation n'est pas validée au banc (`07-` §1.3). */
  lettreEquivalente: Palier | null
  /** Le relevé jugé, observable par observable. La forme fait foi à la fiche. */
  observables: Record<string, unknown> | null
  lieu: 'maison' | 'classe'
  forme: 'formatif' | 'sommatif'
  /** `null` la plupart du temps — renseigné pour les passations en classe (`01-` §3). */
  classeId: string | null
  genre: string | null
  /** `01-` §8.8, M-e — marquée, et NEUTRE pour tout le reste. */
  sondeMontee: boolean
  /** `01-` §11 — calculée par la chaîne ; NULL sans dépôt d'origine, et NULL n'est pas 0. */
  distanceContexte: 'meme_type' | 'meme_famille' | 'transfert' | null
  delaiJours: number | null
  delaiMesures: number | null
  /** `01-` §8.4 — le signal de réceptivité de N2. « NULL n'est pas 0 » (§8.5). */
  deltaV1Vf: number | null
  /** `07-` §1.2 — les deux résultats de la paire ; NULL n'est pas un échec. */
  paireCorrectionJuste: boolean | null
  paireNouveauCasDetecte: boolean | null
  depotId: string | null
  bonus: boolean
  instrumentVersion: string | null
  mesureAt: string
}

// ── Les groupes de modes (`01-` §7, étage 1) ────────────────────────────────

/** `01-` §7 — les trois groupes. Ils SE RECOUVRENT : une mesure compte dans chacun. */
export type GroupeModes = 'receptif' | 'interroger' | 'composition'

/**
 * `01-` §3 — « une mesure appartient à un groupe DÈS QU'ELLE PORTE UN MODE DU
 * GROUPE ». Elle peut donc appartenir à deux groupes à la fois : la condensation
 * est « composer ET restituer », la problématisation nue « composer ET interroger ».
 */
export function appartientAuGroupe(m: Pick<Mesure, 'modes'>, groupe: GroupeModes): boolean {
  switch (groupe) {
    case 'receptif': return m.modes.some((x) => (ECHELLE_RECEPTIVE as readonly string[]).includes(x))
    case 'interroger': return m.modes.includes('interroger')
    case 'composition': return m.modes.includes('composer')
  }
}

/** Les groupes auxquels une mesure appartient — pour le journal, jamais pour élire. */
export function groupesDeLaMesure(m: Pick<Mesure, 'modes'>): GroupeModes[] {
  return (['receptif', 'interroger', 'composition'] as const).filter((g) => appartientAuGroupe(m, g))
}

// ── L'ancre et la trajectoire (`01-` §9 et §10) ─────────────────────────────

/**
 * `01-` §10 — « une ancre est une mesure dont le `lieu` vaut `classe` ET la
 * `forme` vaut `sommatif` ». Les deux, jamais l'une des deux.
 *
 * ⚠️ La `forme` NE T'APPARTIENT PAS : elle se lit à la ligne du plan
 *    d'évaluation (`scriptorium_exercices_planifies.nature`, où `evaluatif` EST
 *    le `sommatif` de ce document), et « SANS LIGNE DE PLAN, LA FORME VAUT
 *    `formatif` » (`07-` §1.2). Un exercice que le routeur assigne n'est donc
 *    JAMAIS une ancre par lui-même.
 */
export function estUneAncre(m: Pick<Mesure, 'lieu' | 'forme'>): boolean {
  return m.lieu === 'classe' && m.forme === 'sommatif'
}

/**
 * `01-` §9 — « LA TRAJECTOIRE, C'EST TOUT CE QUI N'EST PAS UNE ANCRE » : les
 * exercices maison, ET les formatifs passés en classe — la synthèse en classe
 * en est une (`01-` §10).
 */
export function estDeLaTrajectoire(m: Pick<Mesure, 'lieu' | 'forme'>): boolean {
  return !estUneAncre(m)
}

// ── La lettre-équivalente ───────────────────────────────────────────────────

/** Le rang d'une lettre-équivalente, ou `null` quand la mesure n'en porte pas. */
export function rangDeLaMesure(m: Pick<Mesure, 'lettreEquivalente'>): number | null {
  if (!m.lettreEquivalente) return null
  const i = PALIERS.indexOf(m.lettreEquivalente)
  return i < 0 ? null : i
}

/**
 * `01-` §3 — la MÉDIANE des lettres-équivalentes. Sur un nombre pair, on prend la
 * plus basse : c'est la même prudence que « à 2 mesures : la plus basse ».
 */
export function medianeBasse(rangs: readonly number[]): number | null {
  if (rangs.length === 0) return null
  const tries = [...rangs].sort((a, b) => a - b)
  return tries[Math.floor((tries.length - 1) / 2)]
}

// ── Les mesures qui comptent (`01-` §3) ─────────────────────────────────────

/**
 * `01-` §3 — « ENTRENT LES MÊMES MESURES QUE LA LETTRE : postérieures à la
 * recette, LIEUX CONFONDUS, ANCRES COMPRISES —, HORS SONDES DE MONTÉE, qui ne
 * servent qu'à la règle de montée ».
 *
 * La borne de recette est `competences_niveaux.statut_recette_pose_le`, écrite
 * par la fabrique : « `updated_at` ne peut pas en tenir lieu » (`07-` §1.3).
 */
export function mesuresQuiComptent(
  mesures: readonly Mesure[], statutRecettePoseLe: string | null,
): Mesure[] {
  return mesures.filter((m) => {
    if (m.sondeMontee) return false
    if (statutRecettePoseLe && m.mesureAt < statutRecettePoseLe) return false
    return true
  })
}

/** Les mesures d'une compétence, de la plus ancienne à la plus récente. */
export function parDate(mesures: readonly Mesure[]): Mesure[] {
  return [...mesures].sort((a, b) => (a.mesureAt < b.mesureAt ? -1 : a.mesureAt > b.mesureAt ? 1 : 0))
}
