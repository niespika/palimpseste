// ============================================================================
// EXPLIQUER LA NOTE D'UN QUIZ À L'ÉLÈVE (retours de classe du 22/09/2026).
//
// Le score d'une question est celui de `utils/brier.ts` : 10 × (1 − Brier), de
// −10 à +10. Il se DÉCOMPOSE exactement, réponse par réponse, en ce que chacune
// a coûté par rapport au maximum (+10) :
//   · la bonne réponse coûte (points qui lui MANQUENT)² / 1000 ;
//   · chaque mauvaise coûte (points posés sur elle)² / 1000.
// Exemple : 75 sur la bonne, 25 sur une autre → 25²/1000 + 25²/1000 = 1,25,
// score 8,75. 100 sur une mauvaise → 10 + 10 = 20, score −10.
// C'est la même formule, écrite pour être lue ; les tests le vérifient contre
// `calculerScoreBrier` sur toutes les répartitions par pas de 5.
// ============================================================================

export interface DetailQuestion {
  /** Coût de chaque réponse, dans l'ordre des jetons reçus. */
  couts: [number, number, number, number]
  /** Somme des coûts : ce que la question a fait perdre par rapport à +10. */
  perdu: number
  /** Le score de la question, 10 − perdu. */
  score: number
}

export function detaillerQuestion(
  jetons: [number, number, number, number],
  indexCorrect: number,
): DetailQuestion {
  const total = jetons.reduce((a, b) => a + b, 0) || 100
  const parts = jetons.map((j) => (j / total) * 100)
  const couts = parts.map((p, i) =>
    i === indexCorrect ? (100 - p) ** 2 / 1000 : p ** 2 / 1000,
  ) as [number, number, number, number]
  const perdu = couts.reduce((a, b) => a + b, 0)
  return { couts, perdu, score: 10 - perdu }
}

/** La note /20 telle que la base l'écrit : 10 + moyenne des scores, bornée. */
export function noteSur20(scoreMoyen: number): number {
  return Math.min(Math.max(10 + scoreMoyen, 0), 20)
}

// ============================================================================
// CE QUE CHAQUE RÉPONSE RAPPORTE OU COÛTE (demande de Louis, 22/09 : « donner
// pour chaque réponse ce que ça a coûté ou rapporté : −0,6 si on perd, +10 ou
// +X si on gagne, 0 si rien — les élèves aiment voir le détail du calcul »).
//
// Le même score, écrit autrement : 10 × (1 − Brier) = 20·p − 10·Σ pᵢ², où p
// est la part posée sur la bonne réponse. D'où, avec P les points (0 à 100) :
//   · la bonne réponse RAPPORTE  P/5 − P²/1000   (toujours ≥ 0 : +10 pour 100) ;
//   · une mauvaise COÛTE           − P²/1000      (toujours ≤ 0 : −10 pour 100) ;
//   · une réponse sans point vaut  0.
// Exact au millième pour des points entiers, et la somme EST le score de la
// question — les tests le vérifient sur toutes les répartitions par pas de 5.
// ============================================================================

export function contributionsQuestion(
  jetons: [number, number, number, number],
  indexCorrect: number,
): [number, number, number, number] {
  const total = jetons.reduce((a, b) => a + b, 0) || 100
  return jetons.map((j, i) => {
    const P = (j / total) * 100
    const v = i === indexCorrect ? P / 5 - (P * P) / 1000 : -(P * P) / 1000
    return Math.round(v * 1000) / 1000 + 0 // `+ 0` : pas de −0 à l'écran
  }) as [number, number, number, number]
}

/** Un nombre signé, exact au millième, à la française : « +9,375 », « −0,625 », « 0 ». */
export function signe(x: number): string {
  const v = Math.round(x * 1000) / 1000
  if (v === 0) return '0'
  return `${v > 0 ? '+' : '−'}${Math.abs(v).toLocaleString('fr-FR', { maximumFractionDigits: 3 })}`
}

/** Un nombre positif à la française, au plus `decimales` chiffres après la virgule. */
export function nombre(x: number, decimales = 2): string {
  return (Math.round(x * 10 ** decimales) / 10 ** decimales).toLocaleString('fr-FR', { maximumFractionDigits: decimales })
}

/** Les six repères de « Pourquoi partager tes points » — CALCULÉS, jamais tapés. */
export const REPERES: { libelle: string; points: number }[] = ([
  ['Tout sur la bonne réponse', [100, 0, 0, 0]],
  ['75 sur la bonne, 25 sur une autre', [75, 25, 0, 0]],
  ['50/50 entre la bonne et une autre', [50, 50, 0, 0]],
  ['« Je ne sais pas » (25 partout)', [25, 25, 25, 25]],
  ['50/50 entre deux mauvaises', [0, 50, 50, 0]],
  ['Tout sur une mauvaise réponse', [0, 100, 0, 0]],
] as [string, [number, number, number, number]][]).map(([libelle, jetons]) => ({
  libelle, points: detaillerQuestion(jetons, 0).score,
}))

/**
 * La phrase personnelle sous la note : ce qui a coûté le plus à CET élève.
 * « Perdu » se compte depuis le maximum (+10 par question).
 */
export function bilanPartage(questions: { jetons: [number, number, number, number]; indexCorrect: number }[]): string {
  const scores = questions.map((q) => contributionsQuestion(q.jetons, q.indexCorrect).reduce((a, b) => a + b, 0))
  const perdu = scores.reduce((a, s) => a + (10 - s), 0)
  const toutFaux = questions.filter((q) => q.jetons.some((j, i) => i !== q.indexCorrect && j === 100)).length
  if (toutFaux > 0) {
    return `Sur ce quiz, tu as mis tous tes points sur une mauvaise réponse ${toutFaux === 1 ? 'une fois' : `${toutFaux} fois`} : `
      + `ça t’a coûté ${nombre(20 * toutFaux)} points, sur les ${nombre(perdu)} que tu as perdus. `
      + `Si tu avais partagé 50/50 avec la bonne, ${toutFaux === 1 ? 'elle t’aurait' : 'chacune t’aurait'} rapporté +5 au lieu de −10.`
  }
  const surs = questions
    .map((q, k) => ({ q, s: scores[k] }))
    .filter(({ q }) => q.jetons.some((j, i) => i !== q.indexCorrect && j >= 50))
  if (surs.length > 0) {
    const cout = surs.reduce((a, { s }) => a + (10 - s), 0)
    return `${surs.length === 1 ? 'Ta réponse' : `Tes ${surs.length} réponses`} où tu as misé 50 points ou plus sur une mauvaise réponse `
      + `t’${surs.length === 1 ? 'a' : 'ont'} coûté ${nombre(cout)} points, sur les ${nombre(perdu)} que tu as perdus.`
  }
  return 'Tu n’as jamais misé gros sur une mauvaise réponse : c’est ce qui protège une note.'
}

/** « +9,375 − 0,625 = +8,75 » : le calcul d'une question, termes non nuls. Vide
 *  s'il n'y a qu'un terme (le score se lit alors tout seul). */
export function ecrireCalcul(parts: readonly number[]): string {
  const termes = parts.filter((v) => Math.round(v * 1000) !== 0)
  if (termes.length < 2) return ''
  const total = termes.reduce((a, b) => a + b, 0)
  const corps = termes.map((v, k) => (k === 0 ? signe(v) : `${v < 0 ? '−' : '+'} ${signe(Math.abs(v)).slice(1)}`)).join(' ')
  return `${corps} = ${signe(total)}`
}
