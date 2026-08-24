// ============================================================================
// C4 · L3 — LE RÉGIME, ET LES SIX TEMPS QU'IL SERT.
// Module PUR. Il ne lit rien : on lui DONNE le cran (tel que la doctrine le
// porte) et l'état d'escalade, il rend le régime et la suite des temps.
// ----------------------------------------------------------------------------
// ⚠️ ⭐ `regime_v1vf` N'EST NI UNE COLONNE, NI UNE CONSTANTE D'ÉCRAN. C'est
//    l'une des six valeurs qui NE SE STOCKENT PAS (`07-` §1, table
//    d'ouverture) : elle se DÉRIVE du cran élu — « la table des neuf crans le
//    porte en colonne » —, et **L'ESCALADE ENTRE DANS LA DÉRIVATION**
//    (`01-` §8.5).
//
//    Un écran qui grave « cran → régime » en dur ne servira JAMAIS la vf
//    d'escalade. Le `delta_v1_vf` vaudrait alors NULL — **et NULL n'est pas 0**
//    (`01-` §11 ; `06-` §6) : N2 ne pourrait plus distinguer réception et
//    transfert, il serait AVEUGLE. C'est pour cette raison, et pour elle seule,
//    que `regimeDuDeroule` prend l'escalade en argument et non en option.
// ============================================================================

import { regimeV1Vf } from '../routeur/escalade'
import type { Competence, Geste, RegimeV1vf, Temps, Version } from './types'

/**
 * Le libellé que la doctrine écrit dans `exercices_crans.regime_v1vf`
 * (`02-` §2.3.1, recopié tel quel par `derive-doctrine.py`). ⚠️ On ne le
 * réécrit pas : on le TRADUIT, et la traduction est totale — un libellé
 * inconnu n'a pas de repli, il se signale.
 */
const REGIME_DECLARE: Record<string, RegimeV1vf> = {
  'plein': 'plein',
  'par paires': 'par_paires',
  'pas de vf, sauf escalade': 'sans_vf',
}

export class RegimeInconnu extends Error {}

/**
 * Le régime que le CRAN déclare, avant l'escalade.
 * @param regimeDeclare la valeur brute de `exercices_crans.regime_v1vf`.
 */
export function regimeDuCran(regimeDeclare: string): RegimeV1vf {
  const r = REGIME_DECLARE[regimeDeclare.trim()]
  if (!r) {
    throw new RegimeInconnu(
      `Régime v1→vf inconnu : « ${regimeDeclare} ». La table des neuf crans en déclare trois `
      + `(${Object.keys(REGIME_DECLARE).join(' · ')}). On s'arrête : deviner le régime, c'est `
      + 'décider à la place de la source si l\'élève aura une version finale.')
  }
  return r
}

/** L'état d'escalade qui pèse sur CET exercice, pour CET élève. */
export interface EscaladePesante {
  /** N1, N2 ou N3 sur l'observable que l'instance isole — `null` = régime normal. */
  degre: 'N1' | 'N2' | 'N3' | null
  /** L'observable ciblé par l'escalade, et celui que l'instance isole. */
  observable: string | null
  competence: Competence | null
}

export const SANS_ESCALADE: EscaladePesante = { degre: null, observable: null, competence: null }

/**
 * ⭐ LE RÉGIME EFFECTIF — le cran, PLUS l'escalade.
 *
 * « Pendant une escalade active (N1 et au-delà), le régime "pas de version
 * finale" des crans de transformation devient "plein" POUR LES EXERCICES
 * PORTANT L'OBSERVABLE CIBLÉ » (`01-` §8.5 ; `02-` §2.3.1 b).
 *
 * ⚠️ Trois bornes que la source pose et qu'on ne déborde pas :
 *   · l'exception ne vaut QUE pour les crans de TRANSFORMATION — une paire de
 *     diagnostic reste une paire sous escalade (« on ne re-diagnostique pas
 *     une copie corrigée »), et un cran de production est déjà plein ;
 *   · elle exige que l'exercice PORTE l'observable ciblé — pas seulement la
 *     compétence : l'escalade est indexée PAR OBSERVABLE (`07-` §1.3), « un
 *     élève peut être en N2 sur un observable d'Argumentation et en régime
 *     normal partout ailleurs » ;
 *   · un exercice qui n'isole aucun observable (`observable_isole_code` NULL)
 *     ne porte l'observable de personne : l'exception ne joue pas.
 */
export function regimeDuDeroule(
  regimeDeclare: string,
  instance: { observableIsoleCode: string | null; observableIsoleCompetence: string | null },
  escalade: EscaladePesante = SANS_ESCALADE,
): { regime: RegimeV1vf; vfRequiseParEscalade: boolean } {
  const base = regimeDuCran(regimeDeclare)
  const active = escalade.degre !== null

  // ⚠️ « L'escalade est indexée PAR OBSERVABLE » (`07-` §1.3) : porter la
  //    COMPÉTENCE ne suffit pas, et un exercice qui n'isole aucun observable
  //    (`observable_isole_code` NULL) ne porte l'observable de personne.
  const porteLObservable =
    instance.observableIsoleCode !== null
    && instance.observableIsoleCode === escalade.observable
    && instance.observableIsoleCompetence === escalade.competence

  // ⚠️⚠️ **L'EXCEPTION NE VAUT QUE SUR LE RÉGIME « SANS VF ».** Le §8.5 la nomme
  //    précisément : « le régime **"pas de version finale" DES CRANS DE
  //    TRANSFORMATION** devient "plein" ». Une PAIRE de diagnostic n'y entre
  //    pas — « on ne re-diagnostique pas une copie corrigée » (`02-` §2.3.1 a)
  //    —, et au régime par paires **c'est LA PAIRE que N2 lit**, pas un delta
  //    (`01-` §8.4) : la promouvoir en `plein` lui retirerait son signal.
  //
  //    ⚠️ Cette garde est ICI, et pas chez C4-L2 : `regimeV1Vf` rend `plein`
  //       dès que l'escalade porte, **quel que soit le régime reçu**. Sa
  //       docstring dit bien « des crans de transformation », son code ne le
  //       vérifie pas, et elle n'avait jusqu'ici aucun appelant — le premier
  //       appelant fixe le contrat. On ne réécrit pas le lot voisin ; on ne lui
  //       passe que ce qu'il sait traiter. *Porté au relevé.*
  if (base !== 'sans_vf') return { regime: base, vfRequiseParEscalade: false }

  // ⭐ La règle du §8.5 a UN SEUL DOMICILE, et c'est C4-L2 : `regimeV1Vf`. On la
  //    lui demande, on ne la réécrit pas — deux copies d'une même règle
  //    finissent par diverger, et celle-ci décide si un élève aura une version
  //    finale. Ce module ne fait que TRADUIRE le libellé de la doctrine.
  const regime = regimeDuCran(regimeV1Vf(regimeDeclare, active, porteLObservable))
  return { regime, vfRequiseParEscalade: regime === 'plein' }
}

/** Le nombre de cas que le geste commande : DEUX en diagnostic, un ailleurs. */
export function nombreDeCas(geste: Geste): 1 | 2 {
  return geste === 'diagnostiquer' ? 2 : 1
}

/**
 * ⭐ LA CRÉDENCE SE COLLECTE AUX SIX CRANS de diagnostiquer et de transformer,
 * **sans condition d'`evaluee` ni de lieu** (`02-` §5 ; la fiche §6, flux 4) —
 * « la vérité y est portée par le défaut injecté, non par un squelette bancé ».
 * Une par diagnostic, donc DEUX sur une paire (`07-` §1.2).
 */
export function credenceDemandee(geste: Geste): boolean {
  return geste === 'diagnostiquer' || geste === 'transformer'
}

/**
 * LES SIX TEMPS, et ceux que le régime sert.
 *
 * « À la maison, les six temps sont ceux du régime PLEIN — les trois crans de
 * production : les temps 5 et 6 suivent le `regime_v1vf` du cran, et NE SONT
 * PAS SERVIS là où il n'y a pas de version finale » (`06-` §2).
 *
 * ⚠️ « Se juger » n'est pas commandé ici : ses conditions sont exactes et
 *    fermées (geste `produire`, grain `meso` ou `macro`, cible `evaluee`) et
 *    vivent dans `juger.ts`. Ce module dit quels temps le RÉGIME sert ; celui-là
 *    dit si le temps 3 a un objet.
 */
export function tempsServis(regime: RegimeV1vf): Temps[] {
  const socle: Temps[] = ['preparer', 'ecrire', 'se_juger', 'retour']
  // Aux crans de diagnostic, l'exercice est une PAIRE et se clôt au retour ;
  // aux crans de transformation, « rien à redéposer : l'exercice se clôt au
  // retour » — sauf escalade, qui a déjà fait basculer le régime à `plein`.
  return regime === 'plein' ? [...socle, 'reviser', 'retour_final'] : socle
}

/** Le régime sert-il une version finale ? La question que le temps 5 pose. */
export function versionFinaleServie(regime: RegimeV1vf): boolean {
  return regime === 'plein'
}

/**
 * ⭐ UNE PAIRE EST **UN** EXERCICE EN DEUX TEMPS, ET **UNE** MESURE.
 * « Un premier cas traité sur indication, puis un cas neuf de la même famille,
 * traité seul. La CORRECTION DU PREMIER CAS EST SERVIE AVANT LE SECOND — c'est
 * elle qui rend l'écart des deux crédences interprétable » (`02-` §2.3.1 a).
 *
 * Les SIX états que l'écran traverse. ⚠️ `correction` est un état À PART
 * ENTIÈRE, et non une donnée du cas 1 : la correction ne se sert qu'une fois
 * la première crédence donnée — sans quoi l'élève déclarerait sa sûreté en
 * connaissant la réponse, et la porte 2 ne mesurerait plus rien.
 *
 * ⭐ C4-L14 — LE SIXIÈME ÉTAT, `correction_2`. La paire s'arrêtait à
 * `credence_2`, et **le second cas ne recevait rien** : or c'est LE CAS DU
 * TRANSFERT, celui qui porte toute la raison d'être de la paire. Aux crans au
 * jugement ALGORITHMIQUE, aucun retour IA ne vient derrière — « le retour
 * s'engendre depuis le squelette » (`06-` §2, temps 4), et il n'y a pas de
 * squelette sans extraction : sans cet état, le second cas restait muet pour
 * toujours. *Décision de Louis, 23/08 : il reçoit LA MÊME CORRECTION que le
 * premier.*
 *
 * ⚠️ Le sixième état obéit à la MÊME règle que le troisième : il vient **après**
 * `credence_2`, jamais avant. La correction ne se sert qu'une fois la crédence
 * de SON cas donnée.
 */
export type EtapePaire =
  'cas_1' | 'credence_1' | 'correction' | 'cas_2' | 'credence_2' | 'correction_2'

export const ETAPES_PAIRE: EtapePaire[] = [
  'cas_1', 'credence_1', 'correction', 'cas_2', 'credence_2', 'correction_2',
]

/**
 * L'étape courante d'une paire, lue sur ce que l'élève a déjà déposé.
 * @param reponses les réponses déposées, une par cas, dans l'ordre.
 * @param credences les crédences déjà données, une par cas.
 * @param laCredenceEstLaReponse aux crans à CANDIDATS, l'élève ne rédige pas :
 *        répartir ses jetons EST sa réponse. Voir ci-dessous.
 *
 * ⭐⭐ AUX CRANS À CANDIDATS, LA CRÉDENCE EST LA RÉPONSE — trouvé au smoke élève
 *    du 24/08, tranché par Louis le jour même : « la réponse c'est la crédence,
 *    il n'y a pas de retour IA, c'est juste de l'algo ».
 *
 * ⛔ CE QUE CE PARAMÈTRE RÉPARE. Aux crans 1 et 3 le jugement est algorithmique
 *    et l'élève ne rédige RIEN : `texte_v1` et `texte_vf` restent `null` pour
 *    toujours. Sans ce drapeau, `repondu(0)` était donc toujours faux, la
 *    fonction s'arrêtait à sa PREMIÈRE ligne — avant même de regarder la
 *    crédence —, l'étape ne dépassait jamais `cas_1`, et **la correction
 *    n'était JAMAIS servie** : un élève pouvait poser ses cent jetons sur un
 *    mauvais candidat et ne rien recevoir en retour.
 *
 * ⚠️ Aux autres crans, rien ne change : l'élève écrit, et au régime `par_paires`
 *    `texte_v1` porte sa réponse au cas 1, `texte_vf` celle au cas 2.
 *
 * ⚠️ Quand la crédence EST la réponse, `credence_1` et `credence_2` deviennent
 *    inatteignables, et c'est JUSTE : il n'y a pas d'étape de réponse distincte
 *    de la crédence. Aucun écran ne lit ces états — `etapePaire` ne sert qu'à
 *    `correctionDue`.
 */
export function etapeDeLaPaire(
  reponses: ReadonlyArray<string | null>,
  credences: ReadonlyArray<unknown>,
  laCredenceEstLaReponse = false,
): EtapePaire {
  const credencee = (i: number) => credences[i] != null
  const repondu = (i: number) => (laCredenceEstLaReponse
    ? credencee(i)
    : (reponses[i] ?? '').trim() !== '')

  if (!repondu(0)) return 'cas_1'
  if (!credencee(0)) return 'credence_1'
  if (!repondu(1)) return 'correction'   // la correction se sert AVANT le cas 2
  if (!credencee(1)) return 'credence_2'
  // ⚠️⚠️ C4-L14 — C'EST LE CAS TERMINAL QUI A CHANGÉ, PAS UNE BRANCHE DE PLUS.
  //    Cette fonction ne rendait JAMAIS `cas_2`, et son dernier `return` valait
  //    `credence_2` : ajouter un sixième état à la fin de la liste sans toucher
  //    ici l'aurait rendu INATTEIGNABLE, et rien ne serait tombé.
  return 'correction_2'
}

/**
 * Le statut vers lequel la remise de CETTE version fait avancer le dépôt
 * (`07-` §1.1, le fil du statut). ⚠️ « Aux crans SANS version finale, le
 * déroulé SE CLÔT AU RETOUR — ne force pas un `vf_remis` qui n'existe pas. »
 */
export function statutApresRemise(version: Version): 'v1_remis' | 'vf_remis' {
  return version === 'v1' ? 'v1_remis' : 'vf_remis'
}

/**
 * Le déroulé est-il terminé ? Au régime plein, la validation « lu » du retour
 * final le clôt ; aux deux autres, le retour est le dernier temps.
 */
export function deroulTermine(
  regime: RegimeV1vf,
  etat: { retourFinalLu: boolean; retourChaudLu: boolean },
): boolean {
  return regime === 'plein' ? etat.retourFinalLu : etat.retourChaudLu
}
