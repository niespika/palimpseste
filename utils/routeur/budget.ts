// ============================================================================
// C4 · L2 — LE BUDGET (couche 0) : une propriété de l'ÉLÈVE, jamais de la classe.
// ----------------------------------------------------------------------------
// « Un élève inscrit dans DEUX CLASSES — par exemple en Philosophie tronc commun
//   et en HLP — a UN SEUL budget : le profil est unifié, les compétences sont les
//   mêmes, il n'a aucune raison de faire le travail en double » (`01-` §4).
//
// « Le routeur remplit AU MOINS jusqu'au plancher, JAMAIS au-delà du plafond » :
//   le plafond est une borne dure (§5, PB6), le plancher ne l'est pas.
//
// ⚠️ Le PARCOURS d'un élève NE SE STOCKE PAS : il se dérive de l'UNION de ses
//    inscriptions actives (`07-` §1.3), et il se lit sur `classes.type_pedagogique`
//    — à valeurs fermées —, JAMAIS sur `classes.filiere`, qui est un libellé libre :
//    « deux orthographes d'un même libellé, et l'éligibilité devient un jeu de saisie ».
//
// ⚠️ LE PIÈGE DE LA VACUITÉ, condition de recette de ce lot (`07-` §1.3) : un
//    élève dont AUCUNE inscription active ne porte de parcours NE REÇOIT AUCUN
//    exercice routé, ET LE PROFESSEUR EN EST AVERTI. La règle d'exclusion du
//    `02-` §4 — « est exclu l'élève dont TOUS ses parcours figurent dans la
//    liste » — est VRAIE PAR VACUITÉ sur un ensemble vide et l'exclurait de tout,
//    en silence. Jamais un service réduit aux seuls types génériques.
//
// Ce fichier est PUR : il reçoit les inscriptions déjà lues, il ne les lit pas.
// ============================================================================

import { BUDGET_PAR_DEFAUT, type BudgetMinutes, type Situation } from './config'
import type { Parcours } from './types'

/** Une inscription active, réduite à ce que la couche 0 en lit. */
export interface InscriptionActive {
  classeId: string
  classeNom: string
  /** `classes.type_pedagogique` — fermé, nullable. JAMAIS `classes.filiere`. */
  typePedagogique: Parcours | null
}

/** Ce que le professeur a réglé pour cet élève. `null` = le défaut de sa situation. */
export interface ReglageBudget {
  plancher: number | null
  plafond: number | null
  optionnel: number | null
}

/** Pourquoi un élève n'est pas servi — jamais un silence. */
export type MotifNonServi = 'aucune_inscription' | 'aucun_parcours' | 'parcours_hors_dispositif'

export interface BudgetDeLEleve {
  /** L'union des parcours de ses inscriptions actives, `type_pedagogique` non nuls. */
  parcours: Parcours[]
  /** `null` quand la situation n'a pas de ligne au §4 — on n'invente pas de budget. */
  situation: Situation | null
  /** `null` quand l'élève n'est pas servi. */
  budget: BudgetMinutes | null
  /** Vrai quand une valeur au moins a été réglée par le professeur. */
  regle: boolean
  /** `null` quand l'élève est servi. */
  motifNonServi: MotifNonServi | null
  /** `07-` §1.3 — « et le professeur en est averti ». Non bloquant, jamais muet. */
  avertissements: string[]
}

/**
 * `07-` §1.3 — l'union des parcours des inscriptions ACTIVES.
 * Les `type_pedagogique` nuls ne comptent pas : une classe sans parcours ne sert
 * pas le filtre. L'ordre est stable, pour que le journal soit reproductible.
 */
export function parcoursDeLEleve(inscriptions: readonly InscriptionActive[]): Parcours[] {
  const vus = new Set<Parcours>()
  for (const i of inscriptions) if (i.typePedagogique) vus.add(i.typePedagogique)
  return (['tc', 'hlp', 'autre'] as const).filter((p) => vus.has(p))
}

/**
 * `01-` §4, couche 0 — la situation, et elle seule décide du budget par défaut.
 * « Palimpseste n'étant utilisé que par des élèves de philosophie et de HLP, ON
 *   NE TRAITERA QUE DE CES CAS » : `autre` n'a pas de ligne, et on ne lui en
 * invente pas une.
 */
export function situationDesParcours(parcours: readonly Parcours[]): Situation | null {
  const tc = parcours.includes('tc')
  const hlp = parcours.includes('hlp')
  if (tc && hlp) return 'bi_classe'
  if (hlp) return 'hlp_seul'
  if (tc) return 'tc_seul'
  return null
}

/**
 * Le budget d'un élève — le défaut de sa situation, écrasé valeur par valeur par
 * ce que le professeur a réglé.
 *
 * « Chiffres *provisoires (réglage empirique)*, RÉGLABLES PAR ÉLÈVE ET PAR LOT »
 * (`01-` §4) : proposés, jamais imposés.
 */
export function budgetDeLEleve(
  inscriptions: readonly InscriptionActive[],
  reglage: ReglageBudget | null = null,
): BudgetDeLEleve {
  const parcours = parcoursDeLEleve(inscriptions)
  const avertissements: string[] = []

  if (inscriptions.length === 0) {
    avertissements.push(
      'Aucune inscription active : cet élève ne reçoit aucun exercice routé. '
      + 'Inscris-le dans une classe.')
    return { parcours, situation: null, budget: null, regle: false,
      motifNonServi: 'aucune_inscription', avertissements }
  }

  if (parcours.length === 0) {
    // LE piège de la vacuité — la condition de recette du `07-` §1.3.
    const noms = inscriptions.map((i) => i.classeNom).join(', ')
    avertissements.push(
      `Aucune des classes de cet élève ne porte de parcours (${noms}) : il ne reçoit AUCUN exercice `
      + 'routé, et rien ne lui est servi à moitié. Renseigne le parcours de sa classe '
      + '(tronc commun ou HLP) pour qu\'il entre dans le ciblage.')
    return { parcours, situation: null, budget: null, regle: false,
      motifNonServi: 'aucun_parcours', avertissements }
  }

  const situation = situationDesParcours(parcours)
  if (situation === null) {
    avertissements.push(
      `Le seul parcours de cet élève est « ${parcours.join(', ')} », qui n'a pas de budget déclaré : `
      + 'le dispositif ne traite que du tronc commun et de HLP. Il ne reçoit aucun exercice routé.')
    return { parcours, situation: null, budget: null, regle: false,
      motifNonServi: 'parcours_hors_dispositif', avertissements }
  }

  const defaut = BUDGET_PAR_DEFAUT[situation]
  const budget: BudgetMinutes = {
    plancher: reglage?.plancher ?? defaut.plancher,
    plafond: reglage?.plafond ?? defaut.plafond,
    optionnel: reglage?.optionnel ?? defaut.optionnel,
  }
  const regle = !!(reglage && (reglage.plancher !== null || reglage.plafond !== null
    || reglage.optionnel !== null))

  if (budget.plafond < budget.plancher) {
    avertissements.push(
      `Le plafond réglé (${budget.plafond} min) est sous le plancher (${budget.plancher} min) : `
      + 'le routeur s\'arrêtera au plafond, et l\'écart au plancher se journalisera à chaque cycle.')
  }

  return { parcours, situation, budget, regle, motifNonServi: null, avertissements }
}

/**
 * `01-` §5 — « Le plafond borne, le plancher signale ».
 * Le plafond est opéré par PB6 ; quand la boucle s'arrête SOUS le plancher,
 * l'écart se JOURNALISE — compteurs *minutes assignées* et *minutes de budget*
 * (§11, point 7) — « et le solde revient au professeur » : c'est la voie mixte,
 * un RÉGIME NORMAL, pas un repli (`07-` §5 ; `PLAN_DE_CHANTIER.md` §4).
 */
export interface EcartAuPlancher {
  minutesAssignees: number
  minutesPlancher: number
  minutesPlafond: number
  /** Ce qui manque au plancher, 0 quand il est atteint. */
  manque: number
  /** Vrai dès que le plancher n'est pas atteint — se journalise, ne bloque rien. */
  souSLePlancher: boolean
}

export function ecartAuPlancher(minutesAssignees: number, budget: BudgetMinutes): EcartAuPlancher {
  const manque = Math.max(0, budget.plancher - minutesAssignees)
  return {
    minutesAssignees,
    minutesPlancher: budget.plancher,
    minutesPlafond: budget.plafond,
    manque,
    souSLePlancher: manque > 0,
  }
}
