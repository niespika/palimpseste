// ============================================================================
// C4 · L2 — LE VOCABULAIRE DU ROUTEUR.
// ----------------------------------------------------------------------------
// Rien ici n'est une règle : ce sont les noms que les autres modules partagent.
// Les listes fermées viennent des sources, et chaque constante cite la sienne.
//
// ⚠️ Ce fichier est PUR — aucun `server-only`, aucun accès base. Le moteur du
//    routeur doit rester testable sous `npm test` (utils/chaine/LISEZ-MOI.md).
// ============================================================================

import type { Competence, Grain, Mode, Registre, StatutRecette } from '../chaine/types'

export type { Competence, Grain, Mode, Registre, StatutRecette }
export { COMPETENCES, MODES } from '../chaine/types'

// ── Les paliers ─────────────────────────────────────────────────────────────

/** `00-` §2 — l'échelle commune. `null` = pas de lettre (`01-` §3). */
export const PALIERS = ['E', 'D', 'C', 'B', 'A'] as const
export type Palier = (typeof PALIERS)[number]

/** `01-` §3 — « une compétence sans lettre n'est ni ciblable, ni sondable ». */
export type Lettre = Palier | null

/** `01-` §1, principe 3 — « la majorité atteint B ». Lu sur la lettre AFFICHÉE. */
export const PALIER_CIBLE: Palier = 'B'

/** Le rang d'un palier, pour comparer et pour monter d'un cran de lettre. */
export function rangPalier(p: Palier): number {
  return PALIERS.indexOf(p)
}

/** Le palier d'un rang, borné à l'échelle. */
export function palierDeRang(r: number): Palier {
  return PALIERS[Math.max(0, Math.min(PALIERS.length - 1, Math.round(r)))]
}

// ── Les gestes et les crans ─────────────────────────────────────────────────

/**
 * `02-` §2 — le geste du cran. L'ordre est celui de la phase C (`01-` §5, PC2) :
 * « d'abord le geste — `produire`, puis `transformer`, puis `diagnostiquer` ».
 */
export const GESTES = ['produire', 'transformer', 'diagnostiquer'] as const
export type Geste = (typeof GESTES)[number]

/**
 * `01-` §4, couche 3 — « la table est écrite en NOMS DE CRANS, jamais en
 * numéros — même parade que la table des matériaux du `02-` : elle survit au
 * renumérotage ». Les neuf codes font foi à `exercices_crans.code`.
 */
export const CRANS = [
  'diagnostic_guide', 'production_guidee', 'transformation_guidee',
  'diagnostic_nomme', 'transformation_nommee',
  'production_etayee', 'transformation_aveugle',
  'production_autonome', 'diagnostic_fin',
] as const
export type CodeCran = (typeof CRANS)[number]

/** `01-` §4, couche 3 — les trois zones d'une bande de palier. */
export type ZoneCran = 'sous_la_bande' | 'centre' | 'au_dessus'

// ── Les segments ────────────────────────────────────────────────────────────

/** `01-` §4, couche 1 — l'année en cinq segments. */
export type Segment = 1 | 2 | 3 | 4 | 5

// ── La couverture observable ────────────────────────────────────────────────

/** `02-` §2.3.2 — « la liste borne, la couverture remplit ». */
export type Couverture = 'exerce' | 'isole' | 'observable_seul'

// ── L'escalade ──────────────────────────────────────────────────────────────

/** `01-` §8.4 — les trois degrés. À ne pas confondre avec le `cran`. */
export type Degre = 'N1' | 'N2' | 'N3'

/** `01-` §8.4 — les branches de N2, telles qu'elles se journalisent. */
export type BrancheN2 = 'reception' | 'transfert' | 'creer_le_test' | 'sans_objet'

// ── Le parcours ─────────────────────────────────────────────────────────────

/**
 * `07-` §1.3 — « à valeurs fermées, JAMAIS le libellé de filière ».
 * Les valeurs font foi à `classes.type_pedagogique`.
 */
export const PARCOURS = ['tc', 'hlp', 'autre'] as const
export type Parcours = (typeof PARCOURS)[number]

// ── Les règles, telles qu'elles se journalisent ─────────────────────────────

/**
 * `07-` §1.5 — `routeur_decisions.regle_declenchee`. La calibration est du §6
 * au même titre que R0-R5 : « tout ce que la section porte s'implémente ».
 */
export type RegleCiblage =
  | 'calibration' | 'R1' | 'R2' | 'R3' | 'R5' | 'PA3' | 'PB5'

/** `01-` §8.9 — le motif d'une sonde, tel que le §11 le demande. */
export type MotifSonde =
  | 'entretien_n3'          // priorité 1
  | 'palier_cible_a_verifier' // priorité 2
  | 'plus_anciennement_mesuree' // priorité 3
  | 'tirage'                // priorité 4

/** `01-` §5 — le grain borne le RETOUR, jamais la mesure. */
export const PLAFOND_CIBLES_PAR_GRAIN: Record<Grain, number> = {
  micro: 1, meso: 2, macro: 3,
}
