// ============================================================================
// C4 · L3 — LA DURÉE INDICATIVE, LA MICRO-QUESTION DU DOUBLE, ET LE TAG.
// Module PUR : on lui DONNE la durée et le temps écoulé. Aucun `Date.now()`
// implicite, aucune lecture de base, aucune I/O.
// ----------------------------------------------------------------------------
// ⭐ L'ENTIER, JAMAIS L'INTERVALLE. « `duree_exercice_min` ne se déclare plus :
//    elle se dérive du GESTE et du GRAIN […] **La valeur initiale d'un type est
//    la BORNE HAUTE de sa cellule** — un entier, jamais un intervalle : c'est
//    lui que le budget décompte et QUE LE DOUBLE DÉCLENCHE. **La fourchette
//    reste l'information ; l'entier est la valeur** » (`02-` §2.4).
//
// ⚠️ LA TABLE DES NEUF CELLULES N'EST PAS RECOPIÉE ICI. La doctrine la porte
//    déjà en base — `exercices_durees` (geste, grain, borne_min, borne_max,
//    duree_min, avec la garde `duree_min = borne_max`) —, et
//    `utils/fabrique/doctrine.ts:dureeExercice` la lit. Une seconde copie en
//    TypeScript serait un SECOND DOMICILE, et deux domiciles finissent par
//    diverger. Ce module reçoit la durée EN ARGUMENT ; il sait seulement dériver
//    l'entier de bornes qu'on lui donne, pour que la règle « l'entier est la
//    borne haute » reste éprouvable sans la base.
//
// ⚠️ LE TEMPS RÉEL NE CORRIGE JAMAIS LE CYCLE EN COURS — IL CORRIGE LE SUIVANT
//    (`02-` §2.4 ; `01-` §11) : **rien à recalculer à l'écran**. La durée
//    affichée ne bouge pas parce que l'élève dépasse. **Aucune fonction de
//    recalibration ne vit ici** : « les réponses "difficulté" recalibrent les
//    valeurs PAR TYPE », ailleurs et plus tard — ce lot ne la porte pas, et
//    l'ajouter ici ferait corriger le cycle en cours par accident.
//
// ⚠️ IL N'Y A PAS DE BUDGET-TEMPS HEBDOMADAIRE (`06-` §2). En début de semaine
//    l'élève voit LA QUANTITÉ d'exercices, et sur chaque exercice une durée
//    indicative, « qui reste AFFICHÉE À L'ÉLÈVE, qui en a besoin pour organiser
//    sa semaine » (`02-` §2.4). Les minutes assignées et les minutes de budget
//    sont une affaire de ROUTEUR (`utils/routeur/budget.ts` ; `01-` §11) :
//    n'ajoute jamais ici un total hebdomadaire, une jauge, ni un décompte.
//
// ⚠️ LE TAG DE DURÉE EST UN TAG, JAMAIS UN VERDICT. Le premier des sept signaux
//    du faisceau est « la durée, TRÈS INFÉRIEURE à la durée indicative du type »
//    (`06-` §6) — « tous tagués, AUCUN BLOQUANT », et « aucun signal, aucune
//    convergence, ne produit de verdict ». Ce module POSE une étiquette dans
//    `exercices_depots.duree_taguee` (`07-` §1.1) ; c'est LA LECTURE, en aval,
//    qui en fera un signal. Rien ici ne bloque, ne note, ni n'accuse — et rien
//    ici n'est renvoyé à l'élève.
// ============================================================================

import {
  MOTIFS_DEPASSEMENT, TAGS_DUREE,
  type Geste, type Grain, type MotifDepassement, type TagDuree,
} from './types'

/** Une minute en millisecondes. Les durées sont en MINUTES, les temps en ms. */
export const MS_PAR_MINUTE = 60_000

// ── 1. L'entier d'un type : la borne haute de sa cellule ────────────────────

/**
 * La cellule geste × grain de la table du `02-` §2.4, telle que
 * `exercices_durees` la porte : une FOURCHETTE, en minutes.
 * ⚠️ La fourchette reste l'information ; elle n'est jamais la valeur.
 */
export interface CelluleDuree {
  borneMin: number
  borneMax: number
}

/** Une cellule qu'on refuse de lire : deviner une durée, c'est inventer un seuil. */
export class CelluleDureeInvalide extends Error {}

/**
 * ⭐ L'ENTIER D'UN TYPE — la BORNE HAUTE de sa cellule (`02-` §2.4).
 *
 * « La valeur initiale d'un type est la borne HAUTE de sa cellule — un entier,
 * jamais un intervalle : c'est lui que le budget décompte et que le double
 * déclenche. »
 *
 * ⚠️ Jamais la moyenne, jamais la borne basse, jamais un intervalle rendu à
 *    l'écran. `geste` et `grain` ne servent pas au calcul : ils SONT l'index de
 *    la cellule, et ils nomment le fautif quand la cellule est illisible.
 *
 * @param cellule les bornes de la cellule, telles que la doctrine les porte.
 *                On ne les recopie pas ici : on les reçoit.
 */
export function dureeIndicativeDeLaCellule(
  geste: Geste, grain: Grain, cellule: CelluleDuree,
): number {
  const { borneMin, borneMax } = cellule
  const refus = (pourquoi: string): never => {
    throw new CelluleDureeInvalide(
      `Cellule ${geste} × ${grain} : ${pourquoi} (reçu ${borneMin}-${borneMax}). `
      + 'On s\'arrête : une durée devinée devient un seuil de micro-question deviné, '
      + 'puis un tag de durée deviné — le premier signal du faisceau (`06-` §6).')
  }
  if (!Number.isInteger(borneMin) || !Number.isInteger(borneMax)) {
    refus('les deux bornes sont des ENTIERS de minutes')
  }
  if (borneMin <= 0) refus('la borne basse est strictement positive')
  if (borneMax < borneMin) refus('la borne haute ne descend pas sous la borne basse')
  return borneMax
}

/**
 * La garde que la base tient déjà — `duree_min = borne_max` —, relue en code.
 * Elle sert à CONSTATER une divergence entre la valeur stockée d'un type et la
 * cellule dont elle est dérivée ; ⚠️ elle ne la corrige pas : « signale, ne
 * complète pas ».
 */
export function dureeConformeALaBorneHaute(
  cellule: CelluleDuree, dureeDeclareeMin: number,
): boolean {
  return Number.isInteger(dureeDeclareeMin) && dureeDeclareeMin === cellule.borneMax
}

/**
 * La durée indicative telle qu'on ose s'en servir : un ENTIER STRICTEMENT
 * POSITIF de minutes, ou `null`.
 *
 * ⚠️ **Une durée absente ne devient JAMAIS 0** — « NULL n'est pas 0 »
 *    (`01-` §11). Un 0 poserait le double à 0, donc la micro-question à la
 *    première seconde, et le tag `tres_courte` sur tout dépôt : un faux signal
 *    du faisceau fabriqué par un champ manquant. On rend `null`, et rien ne se
 *    déclenche.
 */
export function dureeIndicativeLisible(brut: unknown): number | null {
  if (typeof brut !== 'number' || !Number.isInteger(brut) || brut <= 0) return null
  return brut
}

// ── 2. Le chronomètre ouverture → dépôt ─────────────────────────────────────

/**
 * Le temps réel, « mesuré par le chronomètre OUVERTURE → DÉPÔT » (`02-` §2.4 ;
 * les horodatages : `07-` §1.1, `01-` §11).
 *
 * ⚠️ Un horodatage illisible, manquant, ou À L'ENVERS rend `null` — jamais 0.
 *    Un 0 se taguerait `tres_courte`, c'est-à-dire le premier signal du
 *    faisceau : une horloge de travers ne doit pas accuser un élève.
 */
export function dureeReelleMs(ouvertAt: string | null, deposeAt: string | null): number | null {
  if (!ouvertAt || !deposeAt) return null
  const debut = Date.parse(ouvertAt)
  const fin = Date.parse(deposeAt)
  if (Number.isNaN(debut) || Number.isNaN(fin)) return null
  const ecoule = fin - debut
  return ecoule < 0 ? null : ecoule
}

// ── 3. La micro-question du double ──────────────────────────────────────────

/**
 * ⭐ LE DOUBLE, et rien d'autre. « Un dépassement de plus du DOUBLE déclenche
 * une micro-question » (`02-` §2.4) ; « déclenchée à ×2 la durée indicative de
 * l'exercice — *provisoire, réglage empirique* » (`01-` §11).
 */
export const FACTEUR_MICRO_QUESTION = 2

/**
 * ⭐ LA MICRO-QUESTION EST-ELLE DUE ? — « pause, ou difficulté ? », **jamais
 * notée, jamais renvoyée comme jugement** (`02-` §2.4).
 *
 * Le seuil est STRICTEMENT au-delà du double : « un dépassement de PLUS du
 * double ». Atteindre exactement le double, ce n'est pas le dépasser.
 *
 * ⚠️ Elle porte sur LE TEMPS, et ne se confond pas avec les conditions de
 *    travail, qui portent sur L'EFFORT (`06-` §3).
 *
 * @param dureeIndicativeMin la durée du type, EN MINUTES (l'entier, `02-` §2.4).
 * @param ecouleMs           le temps écoulé depuis l'ouverture, EN MILLISECONDES.
 *                           ⚠️ On le PASSE : ce module ne lit aucune horloge.
 */
export function microQuestionDue(dureeIndicativeMin: number, ecouleMs: number): boolean {
  const indicative = dureeIndicativeLisible(dureeIndicativeMin)
  if (indicative === null) return false
  if (!Number.isFinite(ecouleMs) || ecouleMs < 0) return false
  return ecouleMs > indicative * FACTEUR_MICRO_QUESTION * MS_PAR_MINUTE
}

/** Une valeur est-elle l'un des DEUX motifs licites ? (`07-` §1.1) */
export function estMotifLicite(valeur: unknown): valeur is MotifDepassement {
  return typeof valeur === 'string' && (MOTIFS_DEPASSEMENT as readonly string[]).includes(valeur)
}

/**
 * ⭐ LE MOTIF À ÉCRIRE dans `exercices_depots.motif_depassement` — « `pause` ou
 * `difficulte`, et **NULL quand la micro-question n'a pas été déclenchée ou pas
 * répondue** » (`07-` §1.1).
 *
 * ⚠️ **L'ABSENCE N'EST PAS UNE VALEUR**, et les deux absences ne se distinguent
 *    pas en base : un dépôt sous le double et un dépôt dépassé mais laissé sans
 *    réponse écrivent tous deux NULL. Ne fabrique jamais un troisième motif
 *    (« pas_repondu », « non_declenchee ») pour les séparer : la liste est
 *    fermée à deux valeurs, et le lecteur retrouve le déclenchement en
 *    recalculant le double sur les horodatages.
 *
 * ⚠️ Une réponse hors des deux valeurs licites rend `null` : on ne l'écrit pas.
 *    « Signale, ne complète pas » — mais ici il n'y a rien à compléter, la
 *    micro-question n'est ni notée ni renvoyée.
 *
 * @param declenchee ce que `microQuestionDue` a rendu au moment de la remise.
 * @param reponse    ce que l'élève a répondu, ou `null` s'il a passé outre.
 */
export function motifDepassementAEcrire(
  declenchee: boolean, reponse: unknown,
): MotifDepassement | null {
  if (!declenchee) return null
  if (!estMotifLicite(reponse)) return null
  return reponse
}

// ── 4. Le tag de durée (`exercices_depots.duree_taguee`) ────────────────────

// ⚠️ LES QUATRE BORNES QUI SUIVENT SONT DES RATIOS (temps réel ÷ durée
//    indicative), ET **LA SOURCE NE LES FIXE PAS** : elle dit seulement « la
//    durée, TRÈS INFÉRIEURE à la durée indicative du type » (`06-` §6). Elles
//    sont donc ICI, NOMMÉES ET EXPORTÉES, pour qu'on puisse LES DISCUTER et les
//    régler — pas enfouies dans un `if`. Le tag n'est qu'un tag : les bouger
//    déplace une étiquette, jamais un verdict.

/** En dessous de ce ratio, la durée est « très inférieure » — le signal du §6. */
export const RATIO_TRES_COURTE = 1 / 4

/** En dessous de ce ratio, courte sans l'être « très ». */
export const RATIO_COURTE = 1 / 2

/**
 * Le haut du nominal — le DOUBLE inclus.
 * ⭐ Volontairement égal à `FACTEUR_MICRO_QUESTION` : « longue » commence
 *    exactement là où la micro-question se déclenche (`02-` §2.4). Deux seuils
 *    qui disent la même chose ne doivent pas pouvoir diverger.
 */
export const RATIO_LONGUE = FACTEUR_MICRO_QUESTION

/** Au-delà du quadruple, l'exercice est resté ouvert : « très longue ». */
export const RATIO_TRES_LONGUE = 4

/**
 * L'échelle, DANS L'ORDRE DE `TAGS_DUREE`. `borneHaute: null` ferme l'échelle ;
 * `borneExclue` dit si la borne appartient au tag suivant.
 * ⚠️ Construite depuis `TAGS_DUREE` pour que les cinq tags y soient tous, et
 *    dans l'ordre de la source — un `Record` exhaustif l'impose au compilateur.
 */
const BORNES_PAR_TAG: Record<TagDuree, { borneHaute: number | null; borneExclue: boolean }> = {
  tres_courte: { borneHaute: RATIO_TRES_COURTE, borneExclue: true },   // ratio < 1/4
  courte: { borneHaute: RATIO_COURTE, borneExclue: true },             // ratio < 1/2
  nominale: { borneHaute: RATIO_LONGUE, borneExclue: false },          // jusqu'au double INCLUS
  longue: { borneHaute: RATIO_TRES_LONGUE, borneExclue: false },       // jusqu'au quadruple INCLUS
  tres_longue: { borneHaute: null, borneExclue: false },               // au-delà
}

export const ECHELLE_DES_TAGS: ReadonlyArray<{
  tag: TagDuree
  borneHaute: number | null
  borneExclue: boolean
}> = TAGS_DUREE.map((tag) => ({ tag, ...BORNES_PAR_TAG[tag] }))

/**
 * ⭐ LE TAG DE DURÉE — `exercices_depots.duree_taguee` (`07-` §1.1).
 *
 * ⚠️ **UN TAG, JAMAIS UN VERDICT** (`06-` §6). Le premier signal du faisceau
 *    est « la durée, TRÈS INFÉRIEURE à la durée indicative du type » : ce tag
 *    est la trace brute qui rendra ce signal LISIBLE en aval, quand plusieurs
 *    signaux convergeront et qu'un drapeau partira au professeur, **qui exige
 *    une confirmation humaine**. Ici, rien ne bloque, rien ne note, rien ne
 *    remonte à l'élève.
 *
 * ⚠️ Le tag est `null` quand le ratio n'a pas d'objet — durée indicative
 *    illisible, temps réel illisible ou négatif. **Jamais `nominale` par
 *    défaut** : un défaut fabriquerait une observation qui n'a pas eu lieu, et
 *    « NULL n'est pas 0 » (`01-` §11).
 *
 * @param dureeIndicativeMin la durée du type, EN MINUTES.
 * @param reelMs             le chronomètre ouverture → dépôt, EN MILLISECONDES.
 */
export function tagDeDuree(dureeIndicativeMin: number, reelMs: number): TagDuree | null {
  const indicative = dureeIndicativeLisible(dureeIndicativeMin)
  if (indicative === null) return null
  if (!Number.isFinite(reelMs) || reelMs < 0) return null

  const ratio = reelMs / (indicative * MS_PAR_MINUTE)
  for (const palier of ECHELLE_DES_TAGS) {
    if (palier.borneHaute === null) return palier.tag
    if (palier.borneExclue ? ratio < palier.borneHaute : ratio <= palier.borneHaute) {
      return palier.tag
    }
  }
  // Inatteignable : la dernière borne de l'échelle est ouverte.
  return ECHELLE_DES_TAGS[ECHELLE_DES_TAGS.length - 1].tag
}
