// ============================================================================
// C4 · L2 — LES DÉRIVÉES DU §3. « Un état se stocke, UNE LECTURE SE RECALCULE. »
// ----------------------------------------------------------------------------
// Le `07-` §1 nomme SIX VALEURS QUI NE SONT PAS DES COLONNES ; quatre sont ici :
//   · le REGISTRE COURANT — recalculé à chaque exercice (§8.7, `escalade.ts`) ;
//   · l'HISTORIQUE DES CIBLES — « une requête sur `routeur_decisions`, QUI PORTE
//     DÉJÀ LA CIBLE — jamais une seconde liste » ;
//   · le SIGNAL DE CIBLAGE, par groupe de modes ;
//   · la VALEUR DE CIBLAGE NON PLAFONNÉE.
//
// ⚠️ « LES VALEURS DES DÉRIVÉES VIVENT AU §3, ET NULLE PART AILLEURS » : la
//    médiane des 3, la fenêtre de quatre. Elles sont au `config.ts`, qui cite.
//
// ⚠️ « L'INCIBLABILITÉ NE SE LIT JAMAIS PAR GROUPE » : elle reste accrochée à la
//    LETTRE UNIQUE (NULL), et une compétence n'est ciblable dans un groupe que si
//    la table des modes admis lui permet d'y produire une mesure.
//
// Ce fichier est PUR.
// ============================================================================

import { FENETRE_EVIDENCE, MESURES_DU_SIGNAL } from './config'
import {
  appartientAuGroupe, medianeBasse, mesuresQuiComptent, parDate, rangDeLaMesure,
  type GroupeModes, type Mesure,
} from './mesure'
import { palierDeRang, type Competence, type Lettre } from './types'

/**
 * `01-` §3 — LA FENÊTRE D'ÉVIDENCE : « les QUATRE DERNIÈRES mesures de la
 * compétence ». Les sondes de MONTÉE en sont exclues (M-e) — `mesuresQuiComptent`
 * les a déjà retirées.
 */
export function fenetreDEvidence(mesuresQuiComptentDeja: readonly Mesure[]): Mesure[] {
  return parDate(mesuresQuiComptentDeja).slice(-FENETRE_EVIDENCE)
}

/**
 * `01-` §3 — LE SIGNAL DE CIBLAGE, par groupe de modes.
 *
 * « La MÉDIANE des lettres-équivalentes des 3 DERNIÈRES mesures de la compétence
 *   APPARTENANT AU CONTEXTE. À 2 mesures : LA PLUS BASSE ; à 1 : ELLE-MÊME ;
 *   à 0 — comme lorsque la proportion ne réclame aucun groupe — LA VALEUR DE
 *   CIBLAGE NON PLAFONNÉE sert de repli. »
 *
 * « L'appartenance est celle des MODES ÉLUS : une mesure appartient à un groupe
 *   dès qu'elle porte un mode du groupe — LES GROUPES SE RECOUVRENT. »
 *
 * « Fait de lettres-équivalentes brutes, LE SIGNAL EST NON PLAFONNÉ PAR
 *   CONSTRUCTION — le plafond du §9 ne borne que l'affichage. »
 */
export function signalDeCiblage(
  mesuresQuiComptentDeja: readonly Mesure[],
  groupe: GroupeModes | null,
  valeurNonPlafonnee: Lettre,
): { signal: Lettre; source: 'mediane' | 'plus_basse' | 'elle_meme' | 'repli'; n: number } {
  // « Ou quand la proportion ne réclame aucun groupe » : le repli, sans détour.
  if (groupe === null) {
    return { signal: valeurNonPlafonnee, source: 'repli', n: 0 }
  }

  const duContexte = parDate(mesuresQuiComptentDeja.filter((m) => appartientAuGroupe(m, groupe)))
    .slice(-MESURES_DU_SIGNAL)
  const rangs = duContexte.map(rangDeLaMesure).filter((r): r is number => r !== null)

  if (rangs.length === 0) return { signal: valeurNonPlafonnee, source: 'repli', n: 0 }
  if (rangs.length === 1) return { signal: palierDeRang(rangs[0]), source: 'elle_meme', n: 1 }
  if (rangs.length === 2) {
    return { signal: palierDeRang(Math.min(...rangs)), source: 'plus_basse', n: 2 }
  }
  return { signal: palierDeRang(medianeBasse(rangs) as number), source: 'mediane', n: rangs.length }
}

/**
 * `01-` §3 — L'HISTORIQUE DES CIBLES : « la liste ordonnée des cibles primaires
 * des derniers EXERCICES, pour R5 — qui compte EN EXERCICES, la suite se lisant
 * À CHEVAL SUR LES CYCLES. Elle SE LIT SUR `routeur_decisions`, qui porte déjà
 * la cible. »
 *
 * ⚠️ « Ce journal NE REDOUBLE AUCUNE LISTE » (`07-` §1.5) : jamais une seconde
 *    table des mêmes cibles.
 */
export interface DecisionLue {
  cibleRetenue: Competence | null
  cycleLundi: string
  createdAt: string
}

export function historiqueDesCibles(decisions: readonly DecisionLue[]): Competence[] {
  return [...decisions]
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0))
    .map((d) => d.cibleRetenue)
    .filter((c): c is Competence => c !== null)
}

/**
 * `01-` §6, R5 — « L'ANCIENNETÉ D'UNE COMPÉTENCE SE COMPTE SUR **TOUS** LES
 * EXERCICES » : combien d'exercices se sont écoulés depuis qu'elle a été ciblée.
 * `null` quand elle ne l'a jamais été — et c'est la dette la plus ancienne qui soit.
 */
export function ancienneteEnExercices(
  historique: readonly Competence[], competence: Competence,
): number | null {
  for (let i = historique.length - 1; i >= 0; i--) {
    if (historique[i] === competence) return historique.length - 1 - i
  }
  return null
}

/**
 * `01-` §6, R2 et R5 — le départage « la moins récemment ciblée ».
 * Une compétence JAMAIS ciblée passe devant toutes les autres : sa dette est
 * infinie, pas nulle.
 */
export function moinsRecemmentCiblee(
  historique: readonly Competence[], candidates: readonly Competence[],
): Competence[] {
  const score = (c: Competence) => ancienneteEnExercices(historique, c) ?? Number.POSITIVE_INFINITY
  const max = Math.max(...candidates.map(score))
  return candidates.filter((c) => score(c) === max)
}

/**
 * `01-` §3 — l'inciblabilité. « Une compétence SANS LETTRE n'est ni ciblable, ni
 * sondable, ni plafonnée, ET N'ENTRE DANS AUCUN DÉPARTAGE. »
 *
 * ⚠️ « Elle ne se lit JAMAIS par groupe » : c'est la lettre unique qui décide.
 */
export function estInciblable(lettre: Lettre): boolean {
  return lettre === null
}

/**
 * Tout ce qu'une compétence rend au routeur, en un seul objet — pour que le
 * journal et les écrans lisent la même chose que les règles.
 */
export interface ProfilCompetence {
  competence: Competence
  lettre: Lettre
  valeurNonPlafonnee: Lettre
  signal: Lettre
  sourceDuSignal: 'mediane' | 'plus_basse' | 'elle_meme' | 'repli'
  /** Le nombre de mesures — « un décompte RÉEL » ; aucune « confiance » agrégée (`06-` §5). */
  n: number
  fenetre: Mesure[]
  inciblable: boolean
}

export function profilDeLaCompetence(
  competence: Competence,
  toutesLesMesures: readonly Mesure[],
  statutRecettePoseLe: string | null,
  lettre: Lettre,
  valeurNonPlafonnee: Lettre,
  groupeReclame: GroupeModes | null,
): ProfilCompetence {
  const comptent = mesuresQuiComptent(toutesLesMesures, statutRecettePoseLe)
  const s = signalDeCiblage(comptent, groupeReclame, valeurNonPlafonnee)
  return {
    competence, lettre, valeurNonPlafonnee,
    signal: s.signal, sourceDuSignal: s.source,
    n: comptent.length,
    fenetre: fenetreDEvidence(comptent),
    inciblable: estInciblable(lettre),
  }
}
