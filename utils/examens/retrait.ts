// ============================================================================
// CE QUI EMPÊCHE DE RETIRER UN EXERCICE DU PLAN — la règle, pure et éprouvée.
// ----------------------------------------------------------------------------
// Retirer une ligne de plan CONÇUE suppose de supprimer l'instance qui va avec,
// et `exercices` cascade sur `exercices_depots`, qui cascade lui-même sur
// `exercices_squelettes`, `exercices_retours`, `exercices_metacognition` et
// `exercices_jobs` (FK vérifiées en base le 25/08). Supprimer une instance qui
// porte du travail effacerait donc des copies, des retours et des mesures.
//
// ⚠️ MAIS « UN DÉPÔT EXISTE » N'EST PAS « UN ÉLÈVE A TRAVAILLÉ ». Une ligne
//    d'`exercices_depots` naît à l'ASSIGNATION, avec `statut = 'assigne'` par
//    défaut et tous ses champs de contenu à `null` : assigner un exercice à une
//    classe de 25 en crée 25 d'un coup, avant que personne n'ait rien ouvert.
//    ⭐ Compter les dépôts rendait donc TOUTE assignation irréversible — un
//    examen ouvert par erreur le matin restait au plan pour toujours. C'est le
//    cas réel rencontré sur 1HLP le 25/08 : 25 dépôts, aucune copie.
//
// ⛔ ET LA PRUDENCE VA DANS UN SEUL SENS. Le doute bloque : dès qu'un dépôt
//    porte la moindre trace — un statut qui a dépassé l'assignation, un texte,
//    une photo, une transcription — le retrait est refusé. On préfère refuser
//    un retrait légitime que détruire une copie.
//
// ⚠️ Fichier PUR — aucun `server-only`, aucun accès base : le glob de `npm test`
//    est `utils/**/*.test.ts` (leçon C4-L13).
// ============================================================================

/**
 * Les seuls statuts qui n'ont, par eux-mêmes, jamais rien produit.
 * - `assigne` : posé à la création du dépôt, l'élève n'a pas ouvert l'exercice.
 * - `retire`  : le professeur l'a déjà sorti du dénominateur (`07-` §1.1) ;
 *               il ne redeviendra pas du travail.
 * ⚠️ `ouvert` n'en est PAS : l'élève a ouvert l'exercice, et la télémétrie de
 *    saisie comme le compteur d'aide ont pu commencer à s'écrire.
 */
const STATUTS_SANS_TRAVAIL: ReadonlySet<string> = new Set(['assigne', 'retire'])

/**
 * Ce qu'on lit d'un dépôt pour savoir s'il porte quelque chose.
 * ⚠️ Les champs de contenu sont énumérés ICI et pas ailleurs : en ajouter un à
 * la table sans l'ajouter ici rendrait la garde aveugle à lui.
 */
export interface DepotPourRetrait {
  statut: string
  texte_v1: string | null
  texte_vf: string | null
  transcription_v1: string | null
  transcription_vf: string | null
  photos_v1: unknown | null
  photos_vf: unknown | null
}

/** Une valeur de contenu qui compte comme « quelque chose a été produit ». */
function porteQuelqueChose(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (Array.isArray(v)) return v.length > 0
  return true
}

/**
 * Ce dépôt porte-t-il du travail d'élève ?
 *
 * Vrai dès que l'une des deux conditions tient — le statut a dépassé
 * l'assignation, OU un champ de contenu n'est pas vide. Les deux sont
 * nécessaires : un statut peut rester `assigne` alors qu'un brouillon est là,
 * et un statut avancé peut précéder l'écriture.
 */
export function depotPorteDuTravail(d: DepotPourRetrait): boolean {
  if (!STATUTS_SANS_TRAVAIL.has(d.statut)) return true
  return (
    porteQuelqueChose(d.texte_v1) ||
    porteQuelqueChose(d.texte_vf) ||
    porteQuelqueChose(d.transcription_v1) ||
    porteQuelqueChose(d.transcription_vf) ||
    porteQuelqueChose(d.photos_v1) ||
    porteQuelqueChose(d.photos_vf)
  )
}

/** Combien de dépôts empêchent le retrait. `0` = l'instance est vierge. */
export function depotsQuiBloquent(depots: readonly DepotPourRetrait[]): number {
  return depots.filter(depotPorteDuTravail).length
}
