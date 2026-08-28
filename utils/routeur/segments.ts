// ============================================================================
// C4 · L2 — LES CINQ SEGMENTS : ils se DÉRIVENT du Calendrier, et le calcul est écrit.
// ----------------------------------------------------------------------------
// « L'année se découpe en CINQ SEGMENTS, et leurs bornes se dérivent du
//   Calendrier — CE NE SONT PAS DES CONSTANTES DE CE DOCUMENT » (`01-` §4,
//   couche 1 ; §1, principe 2).
//
// LE CALCUL, tel que la source l'écrit :
//   · C = `semaines de cours − 2` — la première semaine est celle du diagnostic,
//     la dernière est perdue. La valeur SE LIT AU MODULE CALENDRIER (§1, pr. 2) ;
//   · les segments 1 et 2 en prennent QUATRE — le 1 est la semaine 1, le 2 les
//     semaines 2 à 4 ;
//   · R = C − 4, partagé en ⌈R/3⌉ au segment 3, ⌊R/3⌋ au segment 4, LE SOLDE au 5.
//   Pour C = 32 : R = 28, et les trois derniers valent 10, 9 et 9.
//
// ⚠️ « En dessous de C = 5, le reste est nul et les segments 3, 4 et 5 n'ont
//    AUCUNE SEMAINE. Le routeur N'INVENTE AUCUNE BORNE : il émet un SIGNAL NON
//    BLOQUANT vers le professeur, comme pour la cadence d'ancre manquée » (§10).
//
// ⚠️ AUCUNE DATE EN DUR NULLE PART. Ce module ne connaît que la liste des
//    semaines d'enseignement que le Calendrier lui donne — il ne les calcule pas.
//
// Ce fichier est PUR : il reçoit les semaines, il ne va pas les chercher.
// ============================================================================

import type { Segment } from './types'

/**
 * `01-` §4 — les segments 1 et 2 prennent la TÊTE de l'année à eux deux.
 *
 * ⭐ LE SEGMENT 2 EST PASSÉ DE 3 À 2 SEMAINES — décision de Louis, 28/08. La
 *   durée du segment 2 est la SEULE des cinq qui soit écrite en dur ; les autres
 *   se dérivent. C'est ce qui masquait qu'elle était surdimensionnée : la
 *   calibration ne dure pas un nombre de semaines, elle dure LE TEMPS QU'IL Y A
 *   À CALIBRER — « au moins trois mesures chacune » (§6) — et la simulation la
 *   donne close en deux cycles pour les trois populations. La troisième semaine
 *   ne posait plus rien : `ciblesDeCalibration` rendait une liste vide.
 * ⭐ Ce que la semaine rendue devient : `R = C − 3` au lieu de `C − 4`, et le
 *   partage en tiers la donne au segment 4. Sur le calendrier 2026-2027 (32
 *   semaines de cours, C = 30), les segments 3, 4 et 5 passent de 9/8/9 à
 *   **9/9/9**.
 */
export const SEMAINES_SEGMENT_1 = 1
export const SEMAINES_SEGMENT_2 = 2
const TETE = SEMAINES_SEGMENT_1 + SEMAINES_SEGMENT_2 // 3

/** `01-` §1, principe 2 — « la première est celle du diagnostic, la dernière est perdue ». */
export const SEMAINES_RETRANCHEES = 2

/** Ce qu'une semaine doit porter pour qu'on puisse la borner. Sous-ensemble de `SemaineEnseignement`. */
export interface SemaineDeCours {
  dateDebutLundi: string
  dateFinDimanche: string
}

/** Un segment borné : son rang, son régime, et les semaines qu'il prend. */
export interface BorneSegment<S extends SemaineDeCours = SemaineDeCours> {
  segment: Segment
  /** Le nom que le §4 lui donne. */
  regime: 'diagnostic' | 'calibration' | 'amorce' | 'stabilisation' | 'cloture'
  semaines: S[]
  /** `null` quand le segment n'a aucune semaine — jamais une borne inventée. */
  premierLundi: string | null
  dernierDimanche: string | null
}

export interface DecoupeEnSegments<S extends SemaineDeCours = SemaineDeCours> {
  /** Les semaines de cours que le Calendrier rend, avant tout retranchement. */
  semainesDeCours: number
  /** C = `semaines de cours − 2`, jamais négatif. */
  C: number
  /** R = C − 4, jamais négatif. */
  R: number
  segments: [BorneSegment<S>, BorneSegment<S>, BorneSegment<S>, BorneSegment<S>, BorneSegment<S>]
  /** `01-` §4 et §10 — non bloquants, toujours. Le routeur signale, il n'invente pas. */
  signaux: string[]
}

const REGIMES = ['diagnostic', 'calibration', 'amorce', 'stabilisation', 'cloture'] as const

/**
 * `01-` §4, couche 1 — le partage du reste.
 * `⌈R/3⌉` au segment 3, `⌊R/3⌋` au segment 4, **le solde** au segment 5.
 */
export function partageDuReste(R: number): [number, number, number] {
  const r = Math.max(0, R)
  const trois = Math.ceil(r / 3)
  const quatre = Math.floor(r / 3)
  return [trois, quatre, r - trois - quatre]
}

/**
 * Les cinq segments d'une année, dérivés des semaines de cours qu'on lui donne.
 *
 * `semainesDeCours` est la liste que le Calendrier rend — les semaines
 * d'enseignement, vacances déjà sautées (`utils/frise-enseignement.ts`). Ce
 * module n'en retire que les deux du principe 2, et ne borne rien d'autre.
 */
export function decouperEnSegments<S extends SemaineDeCours>(
  semainesDeCours: readonly S[],
): DecoupeEnSegments<S> {
  const total = semainesDeCours.length
  const C = Math.max(0, total - SEMAINES_RETRANCHEES)
  const R = Math.max(0, C - TETE)
  const [t3, t4, t5] = partageDuReste(R)

  // Les semaines que les segments se partagent : les C premières des semaines de
  // cours — la semaine 1 est le diagnostic, et la dernière de l'année est perdue.
  const utiles = semainesDeCours.slice(0, C)
  const tailles = [Math.min(SEMAINES_SEGMENT_1, C), 0, t3, t4, t5]
  tailles[1] = Math.max(0, Math.min(SEMAINES_SEGMENT_2, C - tailles[0]))

  const segments = [] as unknown as DecoupeEnSegments<S>['segments']
  let curseur = 0
  for (let i = 0; i < 5; i++) {
    const tranche = utiles.slice(curseur, curseur + tailles[i])
    curseur += tailles[i]
    segments.push({
      segment: (i + 1) as Segment,
      regime: REGIMES[i],
      semaines: tranche,
      premierLundi: tranche[0]?.dateDebutLundi ?? null,
      dernierDimanche: tranche[tranche.length - 1]?.dateFinDimanche ?? null,
    })
  }

  const signaux: string[] = []
  if (total === 0) {
    signaux.push(
      'Le Calendrier ne rend aucune semaine de cours : aucun segment ne se borne. '
      + 'Renseigne l\'année et les vacances avant de concevoir le plan.')
  } else if (R <= 0) {
    // ⚠️ La source nomme la clause « en dessous de C = 5 », mais elle la chiffrait
    //    sur une tête de QUATRE semaines. La tête vaut 3 depuis le 28/08 : le
    //    seuil est descendu à C = 4. Le message donne `C`, il ne le suppose pas.
    signaux.push(
      `Calendrier trop court : ${total} semaine(s) de cours, donc C = ${C} — les segments 3, 4 et 5 `
      + 'n\'ont aucune semaine. Le routeur n\'invente aucune borne ; rien n\'est bloqué.')
  } else {
    // R > 0 mais le partage laisse un segment vide (C vaut 5 ou 6). La source ne
    // nomme que le cas ci-dessus ; celui-ci se dit quand même — un segment sans
    // semaine est un calendrier trop court, et le signal ne bloque rien.
    const vides = segments.slice(2).filter((s) => s.semaines.length === 0).map((s) => s.segment)
    if (vides.length > 0) {
      signaux.push(
        `Calendrier court : C = ${C}, donc le reste vaut ${R} — le(s) segment(s) `
        + `${vides.join(' et ')} n'ont aucune semaine. Rien n'est bloqué.`)
    }
  }

  return { semainesDeCours: total, C, R, segments, signaux }
}

/**
 * Le segment dont relève un lundi donné, ou `null` s'il tombe hors des bornes.
 * `01-` §8.1 — les compteurs d'escalade ne démarrent qu'au segment 3 ; §6 — la
 * règle de calibration ne vaut qu'au segment 2. Les deux lisent d'ici.
 */
export function segmentDuLundi<S extends SemaineDeCours>(
  decoupe: DecoupeEnSegments<S>, lundi: string,
): Segment | null {
  for (const s of decoupe.segments) {
    if (s.semaines.some((w) => w.dateDebutLundi === lundi)) return s.segment
  }
  return null
}

/**
 * `01-` §7 — « p, la fraction de l'année parcourue », et « L'ANNÉE COURT À PARTIR
 * DU SEGMENT 3 » : `profil_provisoire` tient jusqu'à la clôture du segment 2, et
 * les compteurs d'escalade ne démarrent que là.
 *
 * Elle se compte en CYCLES écoulés sur les cycles de la période, « donc identique
 * pour tous les élèves ». Rendue dans [0, 1[ ; `null` quand la période est vide —
 * un taux requis sans dénominateur ne se calcule pas.
 */
export function fractionDAnneeParcourue<S extends SemaineDeCours>(
  decoupe: DecoupeEnSegments<S>, lundi: string,
): number | null {
  const apresCalibration = decoupe.segments.slice(2).flatMap((s) => s.semaines)
  if (apresCalibration.length === 0) return null
  const i = apresCalibration.findIndex((w) => w.dateDebutLundi === lundi)
  if (i < 0) return null
  // Au premier cycle de la période, rien n'est encore parcouru : p = 0.
  return i / apresCalibration.length
}

/**
 * `01-` §7 — la même fraction, bornée au SEGMENT courant : c'est la période de la
 * table du grain, « dont les lignes changent d'un segment à l'autre ».
 */
export function fractionDeSegmentParcourue<S extends SemaineDeCours>(
  decoupe: DecoupeEnSegments<S>, lundi: string,
): number | null {
  for (const s of decoupe.segments) {
    const i = s.semaines.findIndex((w) => w.dateDebutLundi === lundi)
    if (i >= 0) return s.semaines.length === 0 ? null : i / s.semaines.length
  }
  return null
}
