// ============================================================================
// LA PAIRE À L'ÉCRAN — UN CAS À LA FOIS (Louis, 04/09/2026).
// Module PUR : aucune base, aucune I/O.
// ----------------------------------------------------------------------------
// « Pour les exercices à deux cas, les deux cas sont affichés en même temps. Il
// faut un cas par écran. » Le `02-` §2.3.1 a dit l'ordre : le premier cas, sa
// correction, puis le second. L'ÉTAPE (`etapeDeLaPaire`, regime.ts) dit où en
// est l'élève ; ce module dit quel MOMENT l'écran montre, et quel cas.
//
// ⚠️ Le passage de la correction du premier cas au second est un GESTE de
//    l'élève (« Passer au second cas ») : il n'est pas déduit d'une donnée, et
//    il ne s'écrit nulle part. Recharger la page ramène à la correction — elle
//    est courte, et c'est elle qu'il faut avoir lue avant le second cas.
// ============================================================================

import type { EtapePaire } from './regime'
import type { Version } from './types'

/**
 * Les quatre moments d'une paire :
 *   · `cas_1`        — le premier cas, sa réponse et sa crédence ;
 *   · `correction_1` — la correction du premier cas, seule à l'écran ;
 *   · `cas_2`        — le second cas, sa réponse, sa crédence, et la remise ;
 *   · `fin`          — les deux crédences sont données : il ne reste que la
 *                      remise (rédaction) ou le retour (candidats).
 */
export type MomentDeLaPaire = 'cas_1' | 'correction_1' | 'cas_2' | 'fin'

export function momentDeLaPaire(etape: EtapePaire | null, passeAuSecond: boolean): MomentDeLaPaire {
  if (etape === null || etape === 'cas_1' || etape === 'credence_1') return 'cas_1'
  if (etape === 'correction') return passeAuSecond ? 'cas_2' : 'correction_1'
  if (etape === 'cas_2' || etape === 'credence_2') return 'cas_2'
  return 'fin'
}

/** Le cas que le moment montre. */
export function casDuMoment(moment: MomentDeLaPaire): 1 | 2 {
  return moment === 'cas_1' || moment === 'correction_1' ? 1 : 2
}

/**
 * ⭐ La VERSION que le champ de rédaction écrit. « Au régime par paires,
 *    `texte_v1` porte sa réponse au cas 1, `texte_vf` celle au cas 2 »
 *    (regime.ts) — jusqu'ici aucun écran n'écrivait la seconde : mesuré en
 *    production le 04/09, 0 `texte_vf` sur 28 paires aux crans 4 et 9.
 */
export function versionDuCas(estUnePaire: boolean, cas: 1 | 2 | null): Version {
  return estUnePaire && cas === 2 ? 'vf' : 'v1'
}
