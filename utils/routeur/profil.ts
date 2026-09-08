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
export function fenetreDEvidence<M extends Pick<Mesure, 'mesureAt'>>(
  mesuresQuiComptentDeja: readonly M[],
): M[] {
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
  /** ⭐ `routeur_decisions.bonus` — « en faire plus » n'est pas la semaine ; la garde d'idempotence l'ignore. */
  bonus: boolean
  /**
   * `routeur_decisions.regle_declenchee` — ⭐⭐ LE DISCRIMINANT D'UNE LIGNE
   * D'OVERRIDE, et c'est LUI qu'il faut lire, jamais la nullité de l'exercice.
   *
   * ⛔⛔ POURQUOI PAS `exercice_id`, QUI SEMBLAIT ÉVIDENT ET QUI EST FAUX.
   *    Mesuré en base le 08/09 : `routeur_decisions_exercice_id_fkey` est
   *    **`ON DELETE SET NULL`**. Une VRAIE décision de routeur dont l'exercice
   *    est supprimé porte donc `exercice_id` NULL elle aussi — et devient
   *    indiscernable d'un override. Discriminer sur la nullité, c'est traiter
   *    une semaine réellement servie comme si elle ne l'avait pas été :
   *    `exercicesParCycle` la cesserait de compter *(K de R5 baisse — la
   *    régression que C10-L2 répare, retournée)*, et la garde d'idempotence
   *    déclarerait l'élève NON servi, si bien qu'un second passage du cron
   *    pourrait REPOSER une semaine déjà posée.
   *    ⭐ `regle_declenchee` ne ment pas : seul l'override l'écrit
   *    `'override_prof'`, et il l'écrit toujours.
   */
  regleDeclenchee: string | null
  /**
   * ⭐ C10 · L2 — `routeur_decisions.exercice_id`. Conservé pour ce qu'il DIT
   * vraiment — quel exercice cette décision a posé —, jamais comme discriminant.
   *
   * Le journal porte deux natures de ligne. Celles du ROUTEUR nomment l'exercice
   * qu'elles ont posé. Celles de l'OVERRIDE DU PROFESSEUR — le retrait
   * (`app/prof/routeur/actions.ts`) et, depuis C10-L2, la clôture d'une
   * passation (`app/passation/actions.ts`) — sont ORPHELINES par construction :
   * `exercice_id` NULL, `cible_retenue` NULL, `regle_declenchee = 'override_prof'`.
   *
   * ⛔ SANS CE CHAMP, TROIS LECTEURS COMPTAIENT UN OVERRIDE POUR UN EXERCICE
   *    SERVI. Le journal n'avait jamais reçu une seule ligne en cinq mois de
   *    production (480 décisions, ZÉRO `override_prof`), donc rien ne s'était vu.
   *    `utils/moteur/bonus-serveur.ts` (`decisionsDuCycle`) filtrait déjà
   *    `!!l.exercice_id` de son côté : ce champ ne fait qu'aligner les autres.
   */
  exerciceId: string | null
}

/**
 * ⭐⭐ La règle que le professeur écrit quand il passe outre le routeur — retrait
 * *(`app/prof/routeur/actions.ts`)* et clôture d'une passation
 * *(`app/passation/actions.ts`, C10-L2)*. **Un seul domicile pour la chaîne.**
 */
export const REGLE_OVERRIDE_PROF = 'override_prof'

/**
 * ⭐⭐ CETTE DÉCISION A-T-ELLE SERVI UNE SEMAINE ? — le prédicat que les lecteurs
 * du journal partagent, et il n'y en a qu'un.
 *
 * ⛔ Il se lit sur `regleDeclenchee`, PAS sur la nullité de `exerciceId` : la
 *    clé étrangère est `ON DELETE SET NULL` *(mesuré en base le 08/09)*, donc
 *    une vraie décision dont l'exercice a été supprimé porte `exerciceId` NULL
 *    sans cesser d'avoir servi. Seul l'override n'a jamais rien servi.
 *
 * ⚠️ Et il refuse par la POSITIVE : tout ce qui n'est pas explicitement un
 *    override compte comme servi. Une règle inconnue — ou nulle — penche donc
 *    du côté « servi », qui est le côté PRUDENT : au pire on ne ferme pas une
 *    semaine, jamais on n'en efface une.
 */
export function aServiUneSemaine(d: { regleDeclenchee: string | null }): boolean {
  return d.regleDeclenchee !== REGLE_OVERRIDE_PROF
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
