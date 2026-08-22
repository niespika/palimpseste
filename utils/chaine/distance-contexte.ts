// ============================================================================
// C4 · L5 — `distance_contexte` SE CALCULE, ELLE NE SE JUGE PAS.
// ----------------------------------------------------------------------------
// « L'opérande est le PARTAGE entre les mesures qui portent `composer` et celles
//   qui n'en portent pas, et l'OBJET se lit par la chaîne du dépôt — même
//   partage et même objet → `meme_type` · même partage, objet différent →
//   `meme_famille` · partage différent → `transfert`. Le CRAN n'y entre pas :
//   c'est un axe de difficulté, non de nouveauté […]. Quand la mesure ne remonte
//   à aucun dépôt — les devoirs ingérés —, l'objet est inconnu et la valeur est
//   NULL. »                                        — `01-` §11, point 2
//
// Lue par N2 (`01-` §8.4), qui vit à C4-L2 : ce lot FOURNIT LA DONNÉE, jamais
// les branches (piège 2).
// ============================================================================

import type { DistanceContexte, Mode } from './types'

/** Le partage — l'unique opérande. Deux valeurs, et le cran n'y entre pas. */
export type Partage = 'composition' | 'reception'

/**
 * « La série d'une mesure — `composition` ou `reception` : la mesure porte
 * `composer` → composition ; elle n'a que des modes réceptifs → réception »
 * (`07-` §1, les six valeurs qui ne sont pas des colonnes).
 *
 * ⚠️ AUCUNE colonne `famille` nulle part : la série se DÉRIVE des modes.
 */
export function partageDesModes(modes: readonly Mode[] | readonly string[]): Partage {
  return modes.includes('composer') ? 'composition' : 'reception'
}

/** Ce qu'une mesure doit porter pour qu'on puisse la comparer à une autre. */
export interface ContexteMesure {
  modes: readonly string[]
  /** Le code de l'objet, lu par la chaîne du dépôt. `null` = aucun dépôt d'origine. */
  objet: string | null
}

/**
 * La distance entre la mesure courante et la PRÉCÉDENTE mesure de la même
 * compétence pour le même élève.
 *
 * `null` dans deux cas, et deux seulement :
 *   · la mesure courante ne remonte à aucun dépôt — l'objet est inconnu ;
 *   · il n'existe aucune mesure antérieure à quoi se comparer.
 */
export function distanceContexte(
  courante: ContexteMesure,
  precedente: ContexteMesure | null,
): DistanceContexte | null {
  if (courante.objet == null) return null
  if (precedente == null || precedente.objet == null) return null
  const pc = partageDesModes(courante.modes)
  const pp = partageDesModes(precedente.modes)
  if (pc !== pp) return 'transfert'
  return courante.objet === precedente.objet ? 'meme_type' : 'meme_famille'
}
