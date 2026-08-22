// ============================================================================
// C4 · L2 — LA PROPORTION DES MODES (§7) et son CONTRÔLE DE TRAJECTOIRE.
// ----------------------------------------------------------------------------
// « LE ROUTEUR N'ÉLIT AUCUN MODE. Il élit une COMPÉTENCE, puis choisit l'exercice
//   dont le mode lui donne ce qui manque. Ce n'est donc pas une élection : c'est
//   une PRÉFÉRENCE DE SÉLECTION, de la même forme que R5 — une contrainte de
//   couverture qui n'élit jamais et rattrape les retards. »
//
// LE CONTRÔLE DE TRAJECTOIRE, et il gouverne LES TROIS TABLES (modes, crans,
// grain) : « X et Y sont des OBJECTIFS DE FIN D'ANNÉE, pas des seuils à tenir en
// permanence — IL N'Y A PAS DE FENÊTRE GLISSANTE ».
//
//     taux requis = (O − q · p) / (1 − p)
//
//   ≤ O        en avance          → il PROPOSE AUTRE CHOSE
//   entre O et T  en retard       → il PEUT
//   > T = 1,5 × O trop en retard  → il DOIT
//   > 100 %    inatteignable      → GARDE-FOU : il CESSE DE FORCER, et ça se journalise
//
// ⚠️ « QUAND LA LETTRE CHANGE, ON NE RÉINITIALISE PAS LE CUMUL : ON REMPLACE LA
//    CIBLE. Seul O change — `q` et `p` sont des faits acquis. »
// ⚠️ LES UNITÉS DIFFÈRENT, ET C'EST STRUCTUREL : les MODES en MESURES sur
//    l'année · les CRANS en EXERCICES sur l'année · le GRAIN en EXERCICES par
//    SEGMENT. « Compter les crans en mesures les multiplierait par N. »
// ⚠️ « Un objectif qu'une compétence NE PEUT PAS ATTEINDRE ne se contrôle pas :
//    il est RETIRÉ du calcul, non journalisé comme manque. »
//
// Ce fichier est PUR.
// ============================================================================

import { FACTEUR_T, X_RECEPTIF, Y_INTERROGER } from './config'
import type { GroupeModes } from './mesure'
import type { Competence } from './types'

/** `01-` §7 — la force que le contrôle donne à une préférence. */
export type Force = 'propose_autre_chose' | 'peut' | 'doit' | 'garde_fou'

export interface Trajectoire {
  /** L'objectif contrôlé — X pour le groupe réceptif, Y pour `interroger`. */
  O: number
  /** La proportion déjà atteinte. */
  q: number
  /** La fraction de la période parcourue. */
  p: number
  tauxRequis: number | null
  force: Force
  /** `01-` §7 — le garde-fou : « le manque se journalise » (§11). */
  manqueJournalise: boolean
}

/**
 * `01-` §7 — le contrôle de trajectoire, tel que la formule l'écrit.
 *
 * À `p = 1` la période est finie et la formule diverge : on rend `null` et on
 * cesse de forcer — c'est le même geste que le garde-fou.
 */
export function controleDeTrajectoire(O: number, q: number, p: number): Trajectoire {
  if (p >= 1) {
    return { O, q, p, tauxRequis: null, force: 'garde_fou', manqueJournalise: q < O }
  }
  const tauxRequis = (O - q * p) / (1 - p)
  const T = FACTEUR_T * O

  if (tauxRequis > 1) {
    // « Inatteignable — garde-fou : il cesse de forcer, et le manque se journalise. »
    return { O, q, p, tauxRequis, force: 'garde_fou', manqueJournalise: true }
  }
  if (tauxRequis > T) return { O, q, p, tauxRequis, force: 'doit', manqueJournalise: false }
  if (tauxRequis > O) return { O, q, p, tauxRequis, force: 'peut', manqueJournalise: false }
  return { O, q, p, tauxRequis, force: 'propose_autre_chose', manqueJournalise: false }
}

// ════════════════════════════════════════════════════════════════════════════
// « OÙ ELLE S'APPLIQUE, ET OÙ ELLE MORD »
// ════════════════════════════════════════════════════════════════════════════

/** Ce qu'une compétence peut réellement se voir contrôler. */
export interface PerimetreDesObjectifs { X: boolean; Y: boolean }

/**
 * `01-` §7 — le périmètre, compétence par compétence. Il se DÉRIVE de la table
 * des modes admis (`02-` §3) : « un objectif qu'une compétence ne peut pas
 * atteindre ne se contrôle pas ».
 *
 * `modesAdmis` vient de la doctrine dérivée (`competences_modes_admis`) — le
 * routeur la lit, il ne la recopie pas.
 */
export function perimetreDesObjectifs(modesAdmis: readonly string[]): PerimetreDesObjectifs {
  const receptifs = ['restituer', 'expliquer', 'évaluer']
  return {
    X: modesAdmis.some((m) => receptifs.includes(m)),
    Y: modesAdmis.includes('interroger'),
  }
}

/**
 * `01-` §7 — les deux contrôles vivants d'une compétence.
 * « DEUX CONTRAINTES VIVANTES PAR SÉLECTION, PAS DOUZE : une fois la compétence
 *   élue, seuls X et Y de CETTE compétence sont en jeu. »
 */
export interface ControlesDeLaCompetence {
  competence: Competence
  X: Trajectoire | null
  Y: Trajectoire | null
  /** Le groupe que la proportion RÉCLAME, ou `null` quand elle n'en réclame aucun. */
  groupeReclame: GroupeModes | null
  /** Vrai quand plusieurs « doit » tombent ensemble — le tirage se journalise (§11). */
  plusieursDoit: boolean
}

/**
 * `01-` §7 — ce que la proportion réclame pour une compétence, à ce cycle.
 *
 * « Le RESTE VA OÙ LE PROFIL L'APPELLE » : quand ni X ni Y ne réclament, la
 * proportion ne réclame AUCUN groupe — et R2 élit alors sur la VALEUR DE CIBLAGE
 * NON PLAFONNÉE, son repli (§3, §6).
 */
export function controlesDeLaCompetence(
  competence: Competence,
  modesAdmis: readonly string[],
  qReceptif: number, qInterroger: number, p: number,
): ControlesDeLaCompetence {
  const perimetre = perimetreDesObjectifs(modesAdmis)
  const X = perimetre.X ? controleDeTrajectoire(X_RECEPTIF, qReceptif, p) : null
  const Y = perimetre.Y ? controleDeTrajectoire(Y_INTERROGER, qInterroger, p) : null

  const doitX = X?.force === 'doit'
  const doitY = Y?.force === 'doit'
  const peutX = X?.force === 'peut'
  const peutY = Y?.force === 'peut'

  // Le « doit » prime sur le « peut » ; à égalité de force, la source demande un
  // TIRAGE JOURNALISÉ — que ce module signale sans le faire (§11, point 5).
  let groupeReclame: GroupeModes | null = null
  if (doitX && !doitY) groupeReclame = 'receptif'
  else if (doitY && !doitX) groupeReclame = 'interroger'
  else if (!doitX && !doitY) {
    if (peutX && !peutY) groupeReclame = 'receptif'
    else if (peutY && !peutX) groupeReclame = 'interroger'
  }

  return { competence, X, Y, groupeReclame, plusieursDoit: doitX && doitY }
}

/**
 * `01-` §7, étage 2 — le mode DANS le groupe réceptif, « centré sur le palier de
 * la compétence CIBLE », avec le plancher p = 25 % par mode.
 *
 * « Parmi les exercices candidats qui satisfont DÉJÀ compétence, cran et
 *   observable, prendre celui dont le mode est LE PLUS EN RETARD sur son
 *   plancher, avec la force que lui donne sa bande. »
 */
export function modeLePlusEnRetard(
  cibles: Readonly<Record<string, number>>, atteints: Readonly<Record<string, number>>,
): { mode: string; retard: number } | null {
  let meilleur: { mode: string; retard: number } | null = null
  for (const [mode, cible] of Object.entries(cibles)) {
    const retard = cible - (atteints[mode] ?? 0)
    if (retard <= 0) continue
    if (!meilleur || retard > meilleur.retard) meilleur = { mode, retard }
  }
  return meilleur
}

/**
 * `01-` §7 — « QUAND LA LETTRE CHANGE, ON NE RÉINITIALISE PAS LE CUMUL : ON
 * REMPLACE LA CIBLE. Seul O change ; `q` et `p` sont des faits acquis. »
 *
 * D'où cette fonction, qui existe pour que la règle soit LISIBLE dans le code :
 * elle ne touche ni `q` ni `p`.
 */
export function remplacerLObjectif(t: Trajectoire, nouvelO: number): Trajectoire {
  return controleDeTrajectoire(nouvelO, t.q, t.p)
}
