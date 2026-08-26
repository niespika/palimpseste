// ============================================================================
// DÉPLACER UN DÉPÔT D'UN EXERCICE À UN AUTRE — ce qui doit être identique.
// ----------------------------------------------------------------------------
// Il arrive qu'un même examen soit conçu DEUX FOIS pour une classe, et que les
// copies se répartissent entre les deux instances. Les réunir suppose de faire
// changer un dépôt d'exercice — un `update` d'une ligne, en apparence.
//
// ⛔ MAIS UN DÉPÔT N'EST PAS UNE CELLULE DE TABLEUR. Il porte un texte ÉCRIT
//    CONTRE UN SUJET, et toute la chaîne en aval — squelette, mesures, retour —
//    juge la copie contre la référence de SON exercice. Rattacher une copie à
//    un exercice qui n'a pas le même énoncé ne planterait rien : la chaîne
//    mesurerait tranquillement une dissertation contre la mauvaise référence,
//    et l'élève recevrait un retour qui parle d'autre chose. **La faute ne se
//    verrait qu'à la lecture du retour, des semaines plus tard.**
//
// ⭐ D'OÙ CE FICHIER : le déplacement n'est permis qu'entre deux exercices
//    IDENTIQUES POUR LA MESURE. On ne compare pas « le sujet » à l'œil — on
//    compare tout ce qui entre dans le jugement, et on NOMME ce qui diffère.
//
// ⚠️ Fichier PUR — aucun `server-only`, aucun accès base (glob de `npm test`).
// ============================================================================

/**
 * Les champs d'`exercices` qui font l'identité de mesure. Deux exercices qui
 * s'accordent sur TOUS peuvent recevoir la même copie sans en changer le sens.
 *
 * ⚠️ La liste est VOLONTAIREMENT large. Un champ oublié ici, c'est un
 * déplacement autorisé qui change silencieusement ce qu'on mesure — et le coût
 * d'un refus de trop est une question posée à Louis, quand le coût d'une
 * permission de trop est un retour faux.
 *
 * ⛔ `classe_id` en fait partie : un dépôt appartient à un élève, et déplacer
 * une copie vers l'exercice d'une AUTRE classe la sortirait de son périmètre.
 */
export const CHAMPS_IDENTITE = [
  'classe_id',
  'type_id',
  'consigne_instanciee',
  'reference_id',
  'cran',
  'genre',
  'lieu',
  'modes_par_competence',
  'observable_isole_code',
  'observable_isole_competence',
  'cible_primaire',
  'materiau_source_provenance',
  'materiau_source_support',
  'materiau_source_texte_id',
  'materiau_source_sujet_id',
  'materiau_cible_provenance',
  'materiau_cible_support',
  'materiau_cible_texte_id',
  'materiau_cible_sujet_id',
] as const

export type ChampIdentite = (typeof CHAMPS_IDENTITE)[number]
export type ExercicePourDeplacement = Partial<Record<ChampIdentite, unknown>>

/**
 * Forme canonique d'une valeur, pour que deux JSON équivalents se comparent
 * égaux quel que soit l'ordre de leurs clés. `null` et `undefined` se
 * confondent : PostgREST rend l'un ou l'autre selon la colonne.
 */
function canonique(v: unknown): string {
  if (v === null || v === undefined) return '∅'
  if (Array.isArray(v)) return `[${v.map(canonique).join(',')}]`
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    return `{${Object.keys(o).sort().map((k) => `${k}:${canonique(o[k])}`).join(',')}}`
  }
  return `${typeof v}:${String(v)}`
}

/**
 * Les champs sur lesquels les deux exercices NE s'accordent PAS.
 * Tableau vide = ils sont le même pour la mesure, le déplacement est licite.
 */
export function ecartsDIdentite(
  source: ExercicePourDeplacement,
  cible: ExercicePourDeplacement,
): ChampIdentite[] {
  return CHAMPS_IDENTITE.filter((c) => canonique(source[c]) !== canonique(cible[c]))
}

/** Vrai si les deux exercices sont interchangeables du point de vue de la mesure. */
export function memeIdentiteDeMesure(
  source: ExercicePourDeplacement,
  cible: ExercicePourDeplacement,
): boolean {
  return ecartsDIdentite(source, cible).length === 0
}

/**
 * Ce que porte un dépôt et qui interdit de le déplacer : la chaîne a tourné.
 * Déplacer alors laisserait un squelette, une mesure ou un retour rattachés à
 * un dépôt dont l'exercice a changé — donc jugés contre une autre référence
 * que celle qui les a produits.
 */
export interface TracesDeChaine {
  squelettes: number
  mesures: number
  monitoring: number
  retours: number
  /**
   * Les jobs d'ÉTAPE DE MESURE seulement (`mesure_v1`, `mesure_vf`).
   * ⛔ JAMAIS la transcription : `utils/chaine/file.ts` écrit en tête que « la
   *    transcription n'est pas un étage de la chaîne ». L'OCR porte sur la COPIE,
   *    pas sur la référence de l'exercice — une copie transcrite le reste après
   *    le déplacement. Les compter bloquait toute copie manuscrite.
   */
  jobs: number
}

/** Les noms des traces présentes, pour un refus qui dit CE QUI bloque. */
export function tracesPresentes(t: TracesDeChaine): string[] {
  const noms: [keyof TracesDeChaine, string][] = [
    ['squelettes', 'un squelette'],
    ['mesures', 'des mesures de compétence'],
    ['monitoring', 'des mesures de monitoring'],
    ['retours', 'un retour'],
    ['jobs', 'un traitement de mesure en file'],
  ]
  return noms.filter(([k]) => (t[k] ?? 0) > 0).map(([, libelle]) => libelle)
}
