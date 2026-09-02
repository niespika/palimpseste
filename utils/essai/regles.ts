// ============================================================================
// C6 · L4 — LE BRANCHEMENT DE L'ESSAI DE FRAGMENTS : LES RÈGLES PURES.
// ----------------------------------------------------------------------------
// « L'essai passe par la même chaîne de mesure que le reste. Il se reconnaît
//   par la chaîne du dépôt — c'est un signal diagnostique dont le `lieu` vaut
//   `classe` (`06-Palimpseste.md` §1) : il n'a besoin d'aucune valeur qui le
//   nomme. »                                                  — `07-` §2, C6-L4
//
// Ce module est PUR : aucune base, aucun réseau, aucun `server-only`. Il porte
// ce que l'assignation d'un essai RECOPIE sur la ligne de plan, sur l'instance
// et sur les dépôts, et rien d'autre — c'est ce qui le rend testable. L'écrivain
// vit à côté, dans `branchement-serveur.ts`.
//
// ⭐ POSER UN ESSAI DANS FRAGMENTS EST LE PLANIFIER (arbitrage 2 de la
//    fabrication, confirmé par Louis le 02/09). L'assignation d'un essai à une
//    classe écrit UNE ligne de plan `essai × fragments × classe × evaluatif` —
//    la seule que la typologie admette pour un essai (`exercices_typologie_chk`,
//    « RÉSERVÉ 0 ligne v1 »), et elle est `evaluatif` PAR CONSTRUCTION — plus
//    UNE instance `examen_diagnostique_essai`, `lieu = classe`. C'est de la ligne
//    que vient la `forme` de la mesure (`07-` §1.2 : « `evaluatif` EST le
//    `sommatif` ») ; c'est de l'instance que vient le `lieu`. **Sans ligne de
//    plan, pas d'ancre — et ce n'est pas un repli.**
//
// ⛔ AUCUNE VALEUR NEUVE : ni colonne sur `exercices_depots`, ni sur
//    `competences_mesures`, ni troisième `origine` (l'essai est `prof` : c'est
//    le professeur qui le pose), ni code de type. Le type est celui de C4-L9.
// ============================================================================

import { lundiDuCycle } from '../deroule/echeance'
import { MODES_MESURES } from '../examens/types'
import type { Photo } from '../passation/photos'

/**
 * Le couple de la typologie, RECOPIÉ — jamais dérivé, jamais étendu. C'est le
 * onzième couple de `exercices_typologie_chk`, celui que `plan_evaluation_phase_a.sql`
 * réservait à zéro ligne.
 */
export const LIGNE_ESSAI = {
  type_exercice: 'essai',
  diagnostique: false,
  nature: 'evaluatif',
  lieu: 'classe',
  module: 'fragments',
  ancrage: 'semaine',
  // `manuel` : c'est un geste du professeur, ni la cadence ni une fenêtre
  // diagnostique. (Les trois examens de production portent aussi `manuel`.)
  origine: 'manuel',
} as const

/** Le code du type de l'instance — celui de C4-L9, réutilisé, jamais recopié. */
export const CODE_TYPE_ESSAI = 'examen_diagnostique_essai'

/**
 * ⭐ CE QUE L'ESSAI MESURE EST ARRÊTÉ, ET ON LE RECOPIE : « l'essai mesure
 *    Expression, Argumentation et Structure, les trois en `composer` » (`01-`
 *    §10, tranché par Louis). C'est l'arrêté de Codex — l'essai de Fragments
 *    est le même essai, écrit dans un autre module. ⛔ Ni Questionnement (« la
 *    question est donnée », `01-` §3), ni Connaissance (R4 ; et `corpus_cours`
 *    n'a aucun fournisseur natif) — même si le retour propre de Fragments juge
 *    des « connaissances » : c'est son affaire.
 */
export const MODES_DE_LESSAI = MODES_MESURES.codex

/** Le lundi (date pure UTC, `YYYY-MM-DD`) de la semaine d'une date pure. */
export function lundiDeLaDate(datePure: string): string {
  // Régime des DATES PURES : UTC (`plan-cadence.ts`, « TOUT est en DATE PURE »).
  // Midi UTC : aucun fuseau ne fait basculer un midi UTC d'un jour à l'autre.
  return lundiDuCycle(new Date(`${datePure}T12:00:00.000Z`), 'UTC').toISOString().slice(0, 10)
}

/**
 * Ce que la LIGNE DE PLAN porte pour un essai d'une classe.
 *
 * `semaine_lundi` est une DATE PURE, figée, UTC — le lundi de `date_essai` ;
 * `jour_prevu` est `date_essai` elle-même (`exercices_jour_chk` : dans la
 * semaine du lundi). Le `statut` naît `concu` : l'instance naît dans le même
 * geste, il n'y a jamais d'état « à concevoir » pour un essai.
 */
export function ligneDePlanDeLEssai(essai: {
  titre: string; dateEssai: string; dureeMinutes: number | null
}): {
  type_exercice: string; diagnostique: boolean; nature: string; lieu: string; module: string
  ancrage: string; origine: string; semaine_lundi: string; jour_prevu: string; statut: string
  titre: string; duree_estimee_min: number | null
} {
  const duree = essai.dureeMinutes == null ? null
    : Math.max(1, Math.min(240, Math.round(essai.dureeMinutes)))  // le CHECK de la colonne
  return {
    ...LIGNE_ESSAI,
    semaine_lundi: lundiDeLaDate(essai.dateEssai),
    jour_prevu: essai.dateEssai,
    statut: 'concu',
    titre: essai.titre,
    duree_estimee_min: duree,
  }
}

/**
 * ⭐⭐ LA CONSIGNE DE L'INSTANCE — LE TITRE ET LES CONSIGNES COMMUNES, SANS LE
 *     THÈME DE L'ÉLÈVE (arbitrage 3 de la fabrication, piège 20).
 *
 * L'essai de Fragments se rédige sur le THÈME de chaque élève, mais le juge ne
 * reçoit que six slots et `sujet` EST la consigne instanciée (`chaine.ts`,
 * `contexteExercice`) : il n'existe aucun slot par dépôt. Une instance par
 * (essai × classe), une consigne commune — le juge de l'Expression, de
 * l'Argumentation et de la Structure en `composer` lit la copie, comme il lit
 * déjà toute copie de la banque dont la consigne est déictique.
 * ⛔ Le thème ne se recopie JAMAIS dans la copie : ce serait falsifier la
 *    transcription sur laquelle l'Expression se mesure.
 */
export function consigneDeLEssai(titre: string, consignes: string | null | undefined): string {
  const t = titre.trim()
  const c = (consignes ?? '').trim()
  return c ? `${t}\n\n${c}` : t
}

/**
 * Le `genre` de l'instance : `essai_hlp` quand la classe est HLP, sinon rien.
 * Le type l'admet (`genres_admis`), l'examen ne le pose pas, et il ne sert qu'au
 * filtre de parcours du routeur — hors de propos en classe. On ne l'invente pas
 * pour une classe sans parcours (la classe « Test » du bac à sable n'en a pas).
 */
export function genreDeLEssai(typePedagogique: string | null | undefined): string | null {
  return typePedagogique === 'hlp' ? 'essai_hlp' : null
}

/**
 * ⭐ `assigne_at` COMMANDE LA SEMAINE D'ASSIDUITÉ (`utils/assiduite/` ne lit pas
 *    `lieu` : le dépôt entre au dénominateur de la semaine d'`assigne_at`).
 *
 * On le pose EXPLICITEMENT à midi UTC du lundi de la semaine de `date_essai`,
 * jamais à l'instant du geste : un essai posé le vendredi pour le lundi suivant
 * pèserait sinon sur la mauvaise semaine. Midi UTC : dans le fuseau de l'école
 * (Toronto, UTC−4/−5), c'est encore le lundi.
 */
export function assigneAtDeLEssai(dateEssai: string): string {
  return `${lundiDeLaDate(dateEssai)}T12:00:00.000Z`
}

/**
 * ⭐ « MANUSCRIT → PHOTOS → TRANSCRIPTION » — TROIS ÉTAPES, PAS QUATRE (`06-` §1).
 *
 * Les deux examens diagnostiques ont un « contrôle par l'élève » ; l'essai de
 * Fragments non — le contrôle se fait « en classe, devant le professeur », et le
 * dépôt d'essai se fait depuis l'appareil de l'élève, sans heure de cours.
 * Conséquence mécanique : `v1_remis_at` se pose à l'aboutissement de la
 * transcription, SANS geste de l'élève, sinon `declencherLeLot` écarte la copie.
 *
 * ⚠️ On le reconnaît PAR LA LIGNE DE PLAN — `essai × fragments` —, jamais par une
 *    valeur sur le dépôt : « aucune valeur qui le nomme ».
 */
export function sansControleDeLEleve(
  ligne: { type_exercice: string | null; module: string | null } | null,
): boolean {
  return ligne?.type_exercice === LIGNE_ESSAI.type_exercice && ligne?.module === LIGNE_ESSAI.module
}

/** Le bucket de Fragments — celui où les photos d'un essai vivent DÉJÀ. */
export const BUCKET_ESSAIS = 'essais'

export interface PhotoDeFragments {
  storage_path: string
  ordre: number
  /** La taille et l'empreinte, telles que le stockage les rend. */
  taille?: number | null
  etag?: string | null
}

/**
 * ⭐ LES PAGES DE L'ESSAI, SOUS LA FORME QUE LA CHAÎNE EXIGE — sans copier un
 *    seul fichier (piège 27).
 *
 * `photos_bien_formees` exige `ordre`, `rotation` (un quart de tour),
 * `somme_controle` (non vide) et `page_manquante`, et tolère les clés en plus :
 * `chemin` (le chemin de la page) et `bucket` (celui de Fragments). La lecture de
 * la chaîne est bucket-aware (`utils/passation/transcription.ts`) : une page = un
 * bucket + un chemin, la forme ne change pas.
 *
 * ⚠️ LA FORME DIT VRAI : `rotation` 0 (on ne sait pas mieux — Fragments ne la
 *    garde pas), `somme_controle` = la taille et l'empreinte que le stockage
 *    rend (jamais une valeur posée pour passer la garde), `page_manquante`
 *    false (l'élève de Fragments ne déclare pas de page manquante).
 * ⚠️ L'ordre est RENUMÉROTÉ de 1 à n dans l'ordre de Fragments : la chaîne lit
 *    l'ordre dans le rang, et un trou serait lu comme une page manquante.
 */
export function pagesDeLEssai(photos: readonly PhotoDeFragments[]): Photo[] {
  return [...photos]
    .sort((a, b) => a.ordre - b.ordre || a.storage_path.localeCompare(b.storage_path))
    .map((p, i) => ({
      ordre: i + 1,
      rotation: 0,
      somme_controle: sommeDeControle(p),
      page_manquante: false,
      chemin: p.storage_path,
      bucket: BUCKET_ESSAIS,
    }))
}

function sommeDeControle(p: PhotoDeFragments): string {
  const etag = (p.etag ?? '').replace(/"/g, '').trim()
  if (p.taille != null && etag) return `${p.taille}-${etag}`
  if (etag) return etag
  // Le stockage n'a rien rendu : le chemin reste une empreinte NON VIDE de la
  // page — deux dépôts qui écrivent le même chemin remplacent la même page.
  return p.storage_path
}

/**
 * Ce que le RETRAIT d'un essai d'une classe peut défaire, et ce qu'il refuse.
 * Le motif est celui de C4-L9 : rien ne part si un élève a ÉCRIT quelque chose.
 */
export function motifDeRefusDuRetrait(bloquants: number): string | null {
  if (bloquants <= 0) return null
  return `${bloquants} élève${bloquants > 1 ? 's ont' : ' a'} déjà une copie sur cet essai dans la `
    + 'chaîne de mesure : le retirer de la classe effacerait leurs copies, leurs retours et '
    + 'leurs mesures. Il reste assigné.'
}

/** Le message du refus quand la classe n'a pas de plan d'évaluation validé. */
export function motifSansPlan(nomsDeClasses: readonly string[]): string {
  const n = nomsDeClasses.length
  const liste = nomsDeClasses.join(', ')
  return n <= 1
    ? `La classe ${liste} n’a pas de plan d’évaluation validé : un essai ne peut pas lui être `
      + 'assigné. Crée et valide son plan d’évaluation (Scriptorium), puis reviens.'
    : `Les classes ${liste} n’ont pas de plan d’évaluation validé : un essai ne peut pas leur `
      + 'être assigné. Crée et valide leur plan d’évaluation (Scriptorium), puis reviens.'
}
