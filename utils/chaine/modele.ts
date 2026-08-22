// ============================================================================
// C4 · L5 — LE RÉGIME DE MODÈLE.
// ----------------------------------------------------------------------------
// « Deux modèles, et le partage suit la NATURE DE LA MESURE. La trajectoire —
//   tout ce qui n'est pas une ancre : les exercices de la maison ET LES
//   FORMATIFS PASSÉS EN CLASSE — tourne sur le modèle économique. Les ancres —
//   les passations en classe et sommatives, et les diagnostics — sur le modèle
//   fort. […] Les trois étages d'une chaîne prennent LE MÊME MODÈLE : `p1`, `p2`
//   et `retour` ne se séparent pas. […] Ce qui se partage, c'est le `lieu` et la
//   `forme` de la mesure, jamais l'étage. »              — `07-` §6
//
// « La condition de recette du RÉGIME — une contre-épreuve sur squelettes gelés,
//   compétence par compétence, même lettre ou tout passe au modèle fort — n'est
//   pas la recette du lot : construis le partage DÉBRAYABLE (tout-au-fort tant
//   que la contre-épreuve n'a pas tranché). »            — PROMPT, piège 11
//
// D'où le débrayage, et son défaut : TOUT AU FORT. Le partage ne s'allume que
// lorsque la contre-épreuve a tranché, et il s'allume à la configuration.
// ============================================================================

import type { Forme, Lieu } from './types'

/** Ce qui décide, et rien de plus : le `lieu` et la `forme` de la MESURE. */
export interface NatureDeLaMesure {
  lieu: Lieu
  forme: Forme
  /** `07-` §6 les nomme à part des sommatifs en classe : « et les diagnostics ». */
  diagnostic?: boolean
}

export type Regime = 'ancre' | 'trajectoire'
export type Etage = 'p1' | 'p2' | 'retour'

/**
 * « Une ancre est une mesure dont le `lieu` vaut `classe` ET la `forme` vaut
 * `sommatif` » (`01-` §10). Tout le reste est de la trajectoire — y compris un
 * formatif passé en classe (`07-` §6 ; PROMPT, pièges 12 et 47).
 */
export function regimeDeLaMesure(n: NatureDeLaMesure): Regime {
  if (n.diagnostic) return 'ancre'
  return n.lieu === 'classe' && n.forme === 'sommatif' ? 'ancre' : 'trajectoire'
}

export interface ConfigModeles {
  /** L'identifiant du modèle FORT — les ancres et les diagnostics. */
  fort: string
  /** L'identifiant du modèle ÉCONOMIQUE — la trajectoire. */
  economique: string
  /**
   * Le débrayage. `false` (défaut) → tout au fort : la contre-épreuve de `07-` §6
   * n'a pas tranché, et « même lettre, ou le partage tombe ».
   */
  partageActif: boolean
}

/**
 * Le modèle d'UNE CHAÎNE — pas d'un étage. La signature ne prend pas d'étage,
 * et c'est délibéré : « `p1`, `p2` et `retour` ne se séparent jamais ».
 */
export function modeleDeLaChaine(n: NatureDeLaMesure, config: ConfigModeles): string {
  if (!config.partageActif) return config.fort
  return regimeDeLaMesure(n) === 'ancre' ? config.fort : config.economique
}

/**
 * Le contrôle qui empêche la séparation des étages de se glisser par accident :
 * il rend le motif d'un écart, ou `null`. Un appelant qui journalise un modèle
 * par phase passe ici, et la chaîne refuse de partir si les trois divergent.
 */
export function etagesAccordes(parEtage: Record<Etage, string>): string | null {
  const distincts = [...new Set(Object.values(parEtage))]
  if (distincts.length <= 1) return null
  return `Les trois étages d'une chaîne prennent le même modèle (07- §6) — reçu : `
    + Object.entries(parEtage).map(([e, m]) => `${e}=${m}`).join(', ')
}

/**
 * La `forme` de la passation, dérivée de la ligne de plan qui la porte.
 *
 * ⚠️ CE PONT EST DÉDUIT, PAS CITÉ — et il faut le dire ainsi. Le plan
 *    d'évaluation dit `formatif` / `evaluatif`
 *    (`scriptorium_exercices_planifies.nature`) ; la mesure dit `formatif` /
 *    `sommatif` (`07-` §1.2). AUCUNE des huit sources ne met les deux
 *    vocabulaires en regard. Ce qui est cité, c'est un seul point de la
 *    correspondance : `01-` §10 nomme la synthèse en classe « une mesure en
 *    classe qui n'est PAS une ancre : sa `forme` vaut `formatif` », et le plan la
 *    porte en `nature = 'formatif'`. La branche PORTEUSE — `evaluatif` →
 *    `sommatif`, celle qui fabrique les ANCRES, donc la descente des lettres, le
 *    plafond ancre + 2 et le modèle fort — n'est adossée à rien d'écrit. Elle est
 *    au relevé de séance comme question ouverte, et elle y reste.
 *
 * `estSyntheseEnClasse` court-circuite le pont, et CELUI-LÀ est cité : `01-` §10
 * refuse nommément l'ancre à la synthèse en classe. Sans lui, un professeur qui
 * planifierait sa synthèse en `evaluatif` — le vocabulaire du plan ne connaît pas
 * la nuance — en ferait une ancre, porteuse de la descente des lettres.
 *
 * Sans ligne de plan, la mesure est de la trajectoire : un exercice de la maison
 * n'est jamais une ancre (`07-` §6).
 */
export function formeDepuisLePlan(
  nature: string | null | undefined,
  estSyntheseEnClasse = false,
): Forme {
  if (estSyntheseEnClasse) return 'formatif'
  return nature === 'evaluatif' ? 'sommatif' : 'formatif'
}
