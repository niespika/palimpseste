// ============================================================================
// C8 · L4 — CE QUE FRAGMENTS COMPTE, ET DEPUIS QUAND.
// ----------------------------------------------------------------------------
// Fragments comptait les semaines depuis la PREMIÈRE du semestre. L'élève, lui,
// n'a pas encore de sujet : en semaine 1 on présente le dispositif, en semaine 2
// chacun choisit son thème, et ce n'est qu'ensuite qu'un fragment peut être
// réclamé. Sept sites recomptaient chacun de leur côté, et tous réclamaient donc
// des fragments que personne n'avait demandés.
//
// ⭐ LA RÈGLE VIT ICI, UNE FOIS. Avant ce lot, « quelles semaines comptent »
//    était réécrit à sept endroits, avec trois filtres différents — d'où les
//    deux défauts adjacents que le lot ferme au passage : les vacances comptées
//    comme dépôts manquants, et le pourcentage de l'élève calculé sur les
//    semaines de TOUS les semestres.
//
// ⚠️ CE FICHIER EST PUR — aucun `server-only`, aucun accès base. Le glob de
//    `npm test` est `utils/**/*.test.ts` : une règle posée sous `app/` ne serait
//    JAMAIS éprouvée, sans qu'aucun message ne le dise (leçon C4-L13). Le
//    paramètre arrive donc en argument, jamais lu ici.
//
// ⛔ CE QUE CE FICHIER NE FAIT PAS, ET NE DOIT JAMAIS FAIRE : décider de
//    l'APPARTENANCE d'un dépôt à un semestre. Deux ensembles distincts vivent
//    côte à côte dans les appelants, et c'est volontaire (le patron est écrit à
//    `utils/synthese-semestre.ts`) :
//      • l'APPARTENANCE prend TOUTES les semaines du semestre, vacances
//        comprises — un dépôt fait dans une semaine passée en vacances après
//        coup reste dans le dossier de l'élève, avec son retour et ses notes ;
//      • ce que Fragments A RÉCLAMÉ, ci-dessous, est plus étroit — et c'est lui
//        qui fait le taux de dépôt, les manquants et le budget de charge.
//    Un dépôt fait en semaine 2 garde donc son retour, ses notes entrent dans
//    les moyennes et il reste sur la courbe du parcours : il sort du RATIO,
//    rien d'autre (décision de Louis, 25/08 — « on ne lui a pas demandé ce
//    fragment »).
// ============================================================================

/** Aucun décalage : toutes les semaines de travail comptent, depuis la première. */
export const PREMIERE_SEMAINE_DEFAUT = 1

/**
 * Ce qu'une semaine doit porter pour qu'on puisse dire si Fragments l'a réclamée.
 *
 * ⚠️ `is_vacation` est REQUIS, et ce n'est pas un oubli de commodité : trois des
 * sept sites ne le sélectionnaient pas et comptaient donc les vacances comme des
 * dépôts manquants. Le rendre optionnel rendrait ce défaut réinventable en
 * silence — ici, le compilateur le refuse.
 */
export interface SemaineComptable {
  numero: number | null
  is_vacation: boolean | null
}

/**
 * Normalise le paramètre du semestre. Tout ce qui n'est pas un entier >= 1
 * (colonne absente, `null` d'une base pas encore migrée, valeur aberrante)
 * retombe sur l'état NEUTRE — le comportement d'avant le lot.
 *
 * ⭐ Le repli est neutre, jamais nul : un `0` ou un `NaN` traité comme « tout
 * compte à partir de 0 » donnerait le même résultat, mais un jour où la valeur
 * serait lue de travers on veut que le dispositif se taise, pas qu'il invente.
 */
export function premiereSemaineComptee(valeur: unknown): number {
  const n = typeof valeur === 'number' ? valeur : Number(valeur)
  if (!Number.isInteger(n) || n < 1) return PREMIERE_SEMAINE_DEFAUT
  return n
}

/**
 * Fragments a-t-il réclamé un fragment pour cette semaine ?
 *
 * Deux conditions, dans cet ordre : ce n'est pas une semaine de vacances, et son
 * numéro atteint le seuil du semestre.
 *
 * ⚠️ Le filtre des vacances passe AVANT celui du numéro, et il le doit : une
 * semaine passée en vacances GARDE son ancien `numero` en base
 * (`synchroniserSemaines` ne remet à `null` que `pedagogical_number`, jamais
 * `numero`, qui est `not null`). Comparer d'abord les numéros ferait donc
 * entrer des semaines de vacances dont le numéro est resté au-dessus du seuil.
 *
 * Une semaine sans numéro ne se compare pas : elle ne compte pas.
 */
export function estSemaineComptee(semaine: SemaineComptable, premiere: number): boolean {
  if (semaine.is_vacation) return false
  if (semaine.numero === null || semaine.numero === undefined) return false
  return semaine.numero >= premiereSemaineComptee(premiere)
}

/**
 * Les semaines que Fragments a réclamées, dans l'ordre où elles arrivent.
 *
 * C'est l'unique porte des sept sites de comptage : le dénominateur du taux de
 * dépôt, l'ensemble des semaines « passées » qui fabrique les manquants, et le
 * budget de charge du panoptique.
 */
export function semainesComptees<T extends SemaineComptable>(
  semaines: readonly T[],
  premiere: number,
): T[] {
  const seuil = premiereSemaineComptee(premiere)
  return semaines.filter((s) => estSemaineComptee(s, seuil))
}

/**
 * Phrase courte pour l'écran, quand le semestre porte un décalage.
 * Rend `null` à l'état neutre : il n'y a alors rien à dire.
 */
export function mentionPremiereSemaine(premiere: unknown): string | null {
  const n = premiereSemaineComptee(premiere)
  if (n === PREMIERE_SEMAINE_DEFAUT) return null
  return `Vestigia compte à partir de la semaine ${n}`
}
