// ============================================================================
// C4 · L3 — LE RAPPEL DU TEMPS 1 : les deux ou trois observables les plus
//            faibles, EN LANGUE ÉLÈVE.
// Module PUR. Il reçoit la fenêtre d'évidence et la correspondance ; il ne va
// rien lire.
// ----------------------------------------------------------------------------
// « Aux grains `meso` et `macro`, l'écran d'entrée ajoute LE RAPPEL DES DEUX OU
//   TROIS OBSERVABLES LES PLUS FAIBLES de l'élève sur la compétence cible —
//   nommés EN LANGUE ÉLÈVE, JAMAIS PAR LEUR CODE —, élus par le routeur sur la
//   FENÊTRE D'ÉVIDENCE » (`06-` §2 ; l'élection : `01-` §8.2 ; la fenêtre :
//   `01-` §3).
//
// ⭐ TROIS GARDES QUI NE SE DÉFONT PAS :
//
//  1. LA LANGUE ÉLÈVE NE S'INVENTE PAS. Elle vient de la correspondance
//     observable → formulation, EN BASE, par compétence × observable
//     (`07-` §1.1). Trois écrans la lisent, « et c'est ce qui en fait un
//     verrou » : « se juger », CE RAPPEL, et le retour du temps 4.
//     ⚠️ **Ne fabrique JAMAIS une formulation** — si la base n'en a pas, on
//        SIGNALE et on n'affiche rien. Un observable dont la formulation manque
//        est écarté du rappel, jamais rendu par son code : le code EST la grille
//        (RR4, `01-` §12).
//
//  2. LE DOSAGE PAR LE PALIER. Servi aux paliers ABSENT, FAIBLE et MOYEN
//     (E, D, C — `00-` §3), ABSENT aux paliers BON et ACQUIS. *Le motif est
//     l'effet d'inversion de l'expertise : le rappel aide l'élève en difficulté
//     et FAIT PERDRE SON TEMPS À L'AVANCÉ* (`06-` §2).
//
//  3. LA SEMAINE 1. « Tant qu'aucune mesure n'existe, il n'y a RIEN À
//     RAPPELER : l'écran ne montre que la consigne. » Une fenêtre vide ne
//     produit pas un rappel vide — elle ne produit pas de rappel.
//
// ⚠️ « LE TEMPS 1 PARLE DE CET EXERCICE, JAMAIS DE LA SEMAINE » : le
//    récapitulatif de la semaine et l'« à faire » sont ailleurs (C6-L2).
// ============================================================================

import { etatDesObservables, type EtatObservable, type InstrumentLu }
  from '../routeur/observables'
import type { Mesure } from '../routeur/mesure'
import type { Competence, Grain, Palier } from './types'

/** Combien on en rappelle, au plus — « les DEUX OU TROIS plus faibles ». */
export const RAPPEL_MAX = 3

/**
 * Les paliers auxquels le rappel est SERVI (`06-` §2 ; `00-` §3).
 * ⚠️ Fermé à dessein : ajouter B ou A ici défait l'effet d'inversion de
 *    l'expertise, qui est le motif même de la règle.
 */
export const PALIERS_QUI_RECOIVENT: readonly Palier[] = ['E', 'D', 'C']

/** Les grains auxquels le rappel s'ajoute à la consigne (`06-` §2). */
export const GRAINS_QUI_RECOIVENT: readonly Grain[] = ['meso', 'macro']

/** Une ligne de correspondance, telle que `competences_correspondance` la porte. */
export interface Formulation {
  observable_code: string
  /** ⚠️ La DIMENSION dite à l'élève. C'est le seul mot qui sort à l'écran. */
  dimension_eleve: string
}

/** Un observable rappelé : sa dimension, et rien de la grille. */
export interface ObservableRappele {
  /** Gardé pour la journalisation serveur — ⚠️ JAMAIS affiché. */
  code: string
  dimension_eleve: string
  /** Le taux sur la fenêtre — gardé pour l'ordre et la trace, jamais affiché. */
  taux: number
}

export interface Rappel {
  /** Vide quand le rappel n'a pas lieu d'être — l'écran ne montre que la consigne. */
  observables: ObservableRappele[]
  /** Pourquoi il est vide, quand il l'est. Pour la trace serveur, jamais pour l'élève. */
  motif: string | null
  /**
   * ⚠️ Les observables ÉLUS dont la formulation MANQUE en base. La liste doit
   * rester vide : « correspondance absente → la compétence n'est pas déclarable
   * `evaluee`, donc jamais servie ». Si elle ne l'est pas, **on signale** — on
   * ne fabrique pas.
   */
  formulationsManquantes: string[]
}

const VIDE = (motif: string): Rappel =>
  ({ observables: [], motif, formulationsManquantes: [] })

/**
 * ⭐ LE RAPPEL — l'élection, le dosage, et la mise en langue élève.
 *
 * @param cible        la compétence cible de l'exercice.
 * @param grain        le grain de l'exercice : `micro` n'en reçoit pas.
 * @param palier       la lettre courante de l'élève sur la cible, ou `null`.
 * @param fenetre      les quatre dernières mesures de la compétence (`01-` §3),
 *                     sondes de montée exclues — la chaîne les exclut déjà
 *                     (`mesures.ts:fenetreDEvidence`). Ce module ne la fabrique
 *                     pas : « la fenêtre a un domicile, et ce n'est pas ici ».
 * @param instrument   ce que la fiche déclare, pour lire les taux ; `null` quand
 *                     la compétence n'est pas entrée dans la chaîne.
 * @param formulations la correspondance en base, pour CETTE compétence.
 */
export function rappelDuTemps1(
  cible: Competence,
  grain: Grain,
  palier: Palier | null,
  fenetre: readonly Mesure[],
  instrument: InstrumentLu | null,
  formulations: readonly Formulation[],
): Rappel {
  // ── Le grain. « Aux grains meso et macro s'y ajoute… » — au micro, jamais.
  if (!GRAINS_QUI_RECOIVENT.includes(grain)) {
    return VIDE(`grain ${grain} : le rappel ne s'ajoute qu'aux grains meso et macro`)
  }

  // ── Le dosage par le palier. Une compétence SANS LETTRE n'est ni ciblable ni
  //    plafonnée (`01-` §3) : sans palier, le dosage n'a rien à doser, et il
  //    n'y a de toute façon aucune mesure à rappeler.
  if (palier === null) {
    return VIDE('aucune lettre sur la cible : rien à doser, et rien à rappeler')
  }
  if (!PALIERS_QUI_RECOIVENT.includes(palier)) {
    return VIDE(`palier ${palier} : le rappel est absent à Bon et à Acquis `
      + '(effet d\'inversion de l\'expertise)')
  }

  // ── La semaine 1. « Tant qu'aucune mesure n'existe, il n'y a rien à rappeler. »
  if (fenetre.length === 0) {
    return VIDE('aucune mesure sur la fenêtre d\'évidence : semaine 1, l\'écran ne montre '
      + 'que la consigne')
  }

  // ── L'instrument. Sans lui, aucun taux ne se calcule : « un observable sans
  //    taux NE SE CLASSE PAS » (`01-` §8.2), donc aucun n'est « le plus faible ».
  //    On ne devine pas un classement — on s'abstient.
  if (!instrument || Object.keys(instrument.observablesMesure).length === 0) {
    return VIDE(`aucun instrument ouvert pour ${cible} : les taux ne se calculent pas, `
      + 'et un observable sans taux ne se classe pas (clause granulaire)')
  }

  // ── L'élection. Les plus faibles = les non acquis, au taux le plus bas.
  //    « Un observable sans taux ne se classe pas » : il est écarté, pas mis à 0.
  const etats = etatDesObservables(fenetre, instrument, [])
  const classables = etats
    .filter((e: EtatObservable) => !e.acquis && !e.sansTaux)
    .sort((a, b) => (a.taux as number) - (b.taux as number) || a.code.localeCompare(b.code))

  if (classables.length === 0) {
    return VIDE('aucun observable non acquis n\'a de taux sur la fenêtre : rien à rappeler')
  }

  // ── La mise en langue élève. ⚠️ Un observable sans formulation est ÉCARTÉ et
  //    SIGNALÉ — jamais rendu par son code, qui est la grille.
  const parCode = new Map(formulations.map((f) => [f.observable_code, f.dimension_eleve]))
  const manquantes: string[] = []
  const observables: ObservableRappele[] = []

  for (const e of classables) {
    if (observables.length >= RAPPEL_MAX) break
    const dimension = parCode.get(e.code)
    if (!dimension || dimension.trim() === '') { manquantes.push(e.code); continue }
    observables.push({ code: e.code, dimension_eleve: dimension, taux: e.taux as number })
  }

  return {
    observables,
    motif: observables.length === 0
      ? 'les observables élus n\'ont aucune formulation en base — RIEN N\'EST AFFICHÉ, '
        + 'et une formulation ne se fabrique pas'
      : null,
    formulationsManquantes: manquantes,
  }
}

/**
 * ⭐ LA DÉMONSTRATION VIENT-ELLE AVANT, OU EN RETOUR ?
 *
 * « Compétence JAMAIS TRAVAILLÉE → la démonstration vient AVANT. CONSOLIDATION
 * → LA TENTATIVE D'ABORD, et la démonstration en retour si elle manque —
 * *l'échec productif*. Le routeur distingue les deux cas SUR L'HISTORIQUE DES
 * CIBLES » (`06-` §2).
 *
 * ⚠️ L'historique des cibles est une valeur DÉRIVÉE, jamais stockée : « elle se
 *    lit sur `routeur_decisions`, qui porte déjà la cible » (`01-` §3 ;
 *    `07-` §1). Ce module reçoit le compte, il ne le calcule pas.
 *
 * @param foisCiblee le nombre de fois où cette compétence a déjà été cible
 *                   primaire, lu sur le journal des décisions.
 */
export function momentDeLaDemonstration(foisCiblee: number): 'avant' | 'en_retour' {
  return foisCiblee === 0 ? 'avant' : 'en_retour'
}
