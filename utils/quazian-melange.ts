// Pur : aucun import. Appelé par `utils/generer-questions.ts` à chaque question
// générée, avant qu'elle n'entre en base.

interface QuestionMelangeable { options: [string, string, string, string]; index_correct: number }

/**
 * ⛔ LA BONNE RÉPONSE NE RESTE PAS EN TÊTE (revue du 22/09, mesuré en prod : les
 *    15 questions du quiz de T5 avaient TOUTES `index_correct = 0`, le modèle
 *    suivant l'exemple de son prompt). Tant que la position d'origine prédit la
 *    bonne réponse, tout ce qui laisse voir le mélange de l'élève la trahit. Les
 *    quatre réponses sont donc remêlées AU HASARD avant d'entrer en base, et
 *    `index_correct` suit. Fisher-Yates : chacun des 24 ordres est équiprobable.
 */
export function melangerReponses<Q extends QuestionMelangeable>(q: Q, aleatoire: () => number = Math.random): Q {
  const ordre = [0, 1, 2, 3]
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(aleatoire() * (i + 1))
    ;[ordre[i], ordre[j]] = [ordre[j], ordre[i]]
  }
  return {
    ...q,
    options: ordre.map((i) => q.options[i]) as Q['options'],
    index_correct: ordre.indexOf(q.index_correct),
  }
}
