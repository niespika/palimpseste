// ============================================================================
// C4 · L12 — LES MINUTES, ET LA LIGNE QU'ON PARTAGE AVEC C4-L13.
// ----------------------------------------------------------------------------
// ⛔⛔ LE PIÈGE LE PLUS CHER DU LOT. `07-` §1.5 : « `C4-L12` remplit les minutes
//    de LA LIGNE QU'IL TROUVE, IL N'EN OUVRE PAS. » Ce n'est pas une politesse,
//    et le mécanisme est lisible dans le code de C4-L13 :
//
//    · la collecte compte LA SEMAINE ÉCOULÉE ; le routeur pose LA SEMAINE QUI
//      COMMENCE — « tout se décide à la construction du cycle, AVANT qu'aucun
//      exercice ne soit servi » (`01-` §5). LE MÊME DÉCLENCHEUR, DEUX LUNDIS ;
//    · quand la semaine comptée est ARRÊTÉE, la collecte lit les lignes déjà
//      posées et SAUTE tout élève qui en a une ;
//    · donc, poser soi-même la ligne de la semaine W éteindrait la collecte de W
//      EN SILENCE : `exercices_assignes` resterait au défaut 0, `completion()`
//      rendrait `null`, `semaineFaite()` rendrait `true` — « faite par
//      construction » —, et LA CLASSE ENTIÈRE SE LIRAIT VERTE POUR TOUJOURS.
//
// ⭐⭐ CE QUE CE LOT A CHOISI, ET IL FAUT LE SAVOIR AVANT DE LIRE LA SUITE :
//    **LES DEUX ISSUES, PARCE QU'UNE SEULE NE SUFFIT PAS.**
//
//    (a) ÉCRIRE PAR `.update()`, JAMAIS PAR `.upsert()` — un `update` sur
//        (`eleve_id`, `cycle_lundi`) touche 0 ligne quand elle n'existe pas, ce
//        qui est LITTÉRALEMENT « la ligne qu'il trouve ». La garde est mécanique,
//        pas une intention.
//    (b) ET DÉCALER D'UN TOUR — parce que (a) SEULE NE POSERAIT JAMAIS AUCUNE
//        MINUTE : la ligne du cycle qu'on pose n'existe pas encore, elle naîtra
//        lundi prochain. À chaque déclenchement, on remplit donc les minutes de
//        LA SEMAINE QUE LA COLLECTE VIENT DE POSER — l'écoulée —, retrouvées
//        dans notre propre journal (`routeur_decisions` de ce cycle-là), PUIS on
//        pose la semaine suivante.
//
//    *Le raisonnement ne se refait pas : (a) est une garde d'API, (b) est la
//     règle de cadence. Les prendre l'une pour l'autre perdrait les minutes en
//     silence, ce qui est le mode de panne que tout ce fichier évite.*
//
// ⛔ LES DEUX FAITS D'API DU PARTAGE — éprouvés en base par C4-L13, valables ici
//    À L'IDENTIQUE, DANS L'AUTRE SENS :
//    (1) une clé qu'on n'envoie pas garde sa valeur ; une clé envoyée à `null`
//        efface sans un mot → ON N'ENVOIE JAMAIS les colonnes de C4-L13 ;
//    (2) un envoi EN LOT unifie les colonnes de son tableau → tout envoi de ce
//        module porte EXACTEMENT le même jeu de clés, et une garde le vérifie.
//
// Ce fichier est PUR. La garde est ici pour que `npm test` l'éprouve.
// ============================================================================

import type { BudgetMinutes } from '../routeur/config'

/**
 * ⛔ LES TROIS COLONNES QUI NE SONT PAS À CE LOT — le miroir exact de
 * `CLES_INTERDITES` de `utils/assiduite/collecte.ts`. Elles vivent sur la même
 * ligne et appartiennent à `C4-L13` : « ce lot pose la LIGNE et ses deux
 * agrégats ; `C4-L12` remplit les minutes de cette même ligne. »
 */
export const CLES_DE_C4L13 = [
  'exercices_assignes', 'exercices_termines', 'semaine_faite',
] as const

/** Les trois colonnes de minutes, et elles seules (`c4_l1_schema.sql`). */
export const CLES_DE_MINUTES = [
  'minutes_assignees', 'minutes_budget_plancher', 'minutes_budget_plafond',
] as const

/**
 * La charge d'une écriture de minutes. ⚠️ `updated_at` N'EST PAS ICI, et c'est
 * volontaire : il appartient au geste de la collecte, qui dit « le cron est
 * passé cette semaine ». Le toucher ferait croire à un passage de collecte.
 */
export interface ChargeDeMinutes {
  minutes_assignees: number
  minutes_budget_plancher?: number
  minutes_budget_plafond?: number
}

export class ChargeDeMinutesInvalide extends Error {}

/**
 * ⭐ LA GARDE SYMÉTRIQUE — celle de `verifierLaCharge()` de C4-L13, écrite dans
 * l'autre sens. Elle LÈVE, elle n'avertit pas.
 *
 *  · aucune clé de C4-L13 ne doit entrer dans une charge de minutes ;
 *  · aucune clé inconnue non plus — une faute de frappe passerait sans bruit ;
 *  · et tous les envois d'un même lot portent EXACTEMENT le même jeu de clés,
 *    parce qu'un envoi groupé unifie ses colonnes et met les autres à `NULL`.
 */
export function verifierLaChargeDeMinutes(charges: readonly ChargeDeMinutes[]): void {
  if (charges.length === 0) return
  const connues = new Set<string>(CLES_DE_MINUTES)
  const reference = Object.keys(charges[0]).sort()
  for (const cle of CLES_DE_C4L13) {
    if (reference.includes(cle)) {
      throw new ChargeDeMinutesInvalide(
        `\`${cle}\` est une colonne de C4-L13 : le routeur ne l'écrit jamais — « une clé `
        + 'envoyée à `null` efface sans un mot ».')
    }
  }
  for (const c of charges) {
    const cles = Object.keys(c).sort()
    for (const k of cles) {
      if (!connues.has(k)) {
        throw new ChargeDeMinutesInvalide(
          `clé inconnue « ${k} » dans une charge de minutes : seules ${CLES_DE_MINUTES.join(', ')} `
          + 'sont à ce lot.')
      }
    }
    if (cles.length !== reference.length || cles.some((k, i) => k !== reference[i])) {
      throw new ChargeDeMinutesInvalide(
        'jeux de clés HÉTÉROGÈNES dans un même envoi — un envoi groupé les unifie, et les '
        + `manquantes partiraient à NULL. Attendu [${reference.join(', ')}], reçu [${cles.join(', ')}].`)
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LE BUDGET EN BASE — et la contrainte que l'écran ne refuse pas
// ════════════════════════════════════════════════════════════════════════════

export interface BudgetEcrivable {
  ecrivable: boolean
  motif: string | null
}

/**
 * ⚠️ `assiduite_budget_ordre_chk` exige `plafond >= plancher`
 * (`c4_l1_schema.sql`). Or `budgetDeLEleve` **AVERTIT SANS REFUSER** quand le
 * professeur règle un plafond sous le plancher, et `reglerLeBudget` fait de
 * même : **un réglage parfaitement accepté à l'écran fera échouer l'écriture.**
 * Et supabase-js NE LÈVE PAS — il rend `{ error }`.
 *
 * ⭐ CE QUE CE LOT EN FAIT, et c'est une décision qui se dit : **on n'écrase
 * rien et on n'invente rien.** Un budget inversé ne se corrige pas en écrivant
 * une valeur que personne n'a réglée ; il ne se tait pas non plus. Les deux
 * colonnes de budget ne partent PAS pour cet élève, `minutes_assignees` part
 * quand même — elle est vraie et indépendante —, et **le bilan nomme l'élève**.
 * *Un budget que la base refuse est un réglage à corriger à l'écran, pas une
 * donnée à maquiller.*
 */
export function budgetEcrivable(budget: BudgetMinutes | null): BudgetEcrivable {
  if (!budget) {
    return { ecrivable: false,
      motif: 'aucun budget : l\'élève n\'est pas servi (parcours absent ou hors dispositif).' }
  }
  if (budget.plancher < 0 || budget.plafond < 0) {
    return { ecrivable: false,
      motif: `budget négatif (${budget.plancher} / ${budget.plafond}) : les trois colonnes sont `
        + 'sous `CHECK >= 0`.' }
  }
  if (budget.plafond < budget.plancher) {
    return { ecrivable: false,
      motif: `plafond (${budget.plafond} min) SOUS le plancher (${budget.plancher} min) : `
        + '`assiduite_budget_ordre_chk` refuserait la ligne. L\'écran, lui, avertit sans refuser — '
        + 'le réglage est à corriger au pilotage. Les minutes assignées partent quand même.' }
  }
  return { ecrivable: true, motif: null }
}

/**
 * La charge d'un élève pour un cycle. `minutes_assignees` est TOUJOURS là — c'est
 * la clé de référence du lot ; les deux colonnes de budget n'y entrent que si la
 * base peut les accepter.
 *
 * ⚠️ Le jeu de clés doit rester HOMOGÈNE dans un envoi : cette fonction rend deux
 *    formes possibles, et l'appelant les envoie SÉPARÉMENT (`grouperParFormeDeCle`).
 */
export function chargeDeMinutes(
  minutesAssignees: number, budget: BudgetMinutes | null,
): { charge: ChargeDeMinutes; budgetEcarte: string | null } {
  const v = budgetEcrivable(budget)
  if (!v.ecrivable || !budget) {
    return { charge: { minutes_assignees: minutesAssignees }, budgetEcarte: v.motif }
  }
  return {
    charge: {
      minutes_assignees: minutesAssignees,
      minutes_budget_plancher: budget.plancher,
      minutes_budget_plafond: budget.plafond,
    },
    budgetEcarte: null,
  }
}

/**
 * Les charges, groupées par jeu de clés. « Un envoi groupé unifie ses colonnes » :
 * deux formes de charge ne partent JAMAIS ensemble.
 */
export function grouperParFormeDeCle<T extends { charge: ChargeDeMinutes }>(
  lignes: readonly T[],
): T[][] {
  const par = new Map<string, T[]>()
  for (const l of lignes) {
    const cle = Object.keys(l.charge).sort().join('|')
    par.set(cle, [...(par.get(cle) ?? []), l])
  }
  return [...par.values()]
}

// ════════════════════════════════════════════════════════════════════════════
// CE QUE LES MINUTES COMPTENT
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §11, point 7 — « les MINUTES ASSIGNÉES : la somme des durées des
 * exercices que le routeur a posés », par élève et par cycle.
 *
 * ⚠️ Elle se recompte SUR LE JOURNAL, jamais sur une valeur mémorisée : c'est le
 *    décalage d'un tour qui l'exige, et c'est aussi ce qui rend le compte juste
 *    après un retrait de professeur ou une reprise.
 * ⚠️ `duree_exercice_min` ne se saisit jamais à la main : chaque durée vient de
 *    la doctrine, dérivée du geste du cran et du grain de l'objet.
 */
export function minutesAssignees(dureesDesExercicesPoses: readonly (number | null)[]): number {
  return dureesDesExercicesPoses.reduce<number>((s, d) => s + (d ?? 0), 0)
}

/**
 * `01-` §5 — « LE PLAFOND BORNE, LE PLANCHER SIGNALE. » L'écart au plancher se
 * journalise, « et le solde revient au professeur » : la voie mixte est un
 * RÉGIME NORMAL, pas un repli.
 *
 * Le couple (minutes assignées, minutes de budget) EST cette journalisation :
 * les deux nombres sur la même ligne se comparent, et l'écart se lit.
 */
export function ecartJournalise(
  minutes: number, budget: BudgetMinutes | null,
): { souSLePlancher: boolean; manque: number; soldeALaVoieMixte: number } {
  if (!budget) return { souSLePlancher: false, manque: 0, soldeALaVoieMixte: 0 }
  const manque = Math.max(0, budget.plancher - minutes)
  return { souSLePlancher: manque > 0, manque, soldeALaVoieMixte: manque }
}
