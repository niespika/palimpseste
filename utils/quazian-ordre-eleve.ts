// ============================================================================
// LE RETOUR D'UN QUIZ DANS L'ORDRE OÙ L'ÉLÈVE L'A PASSÉ (22/09/2026).
//
// À la passation, chaque élève reçoit ses questions ET ses réponses mélangées
// (`ordre_questions`, `ordre_options` de sa session). Le retour, lui, servait
// l'ordre de la BASE : la réponse que l'élève avait lue en « B » s'affichait en
// « D », et sa question 1 n'était pas sa question 1 — avec des questions insérées
// en bloc (même `created_at`), l'ordre du retour n'était même pas stable.
// Mélange aléatoire de quatre réponses : une chance sur 24 seulement que les
// lettres coïncident. Le retour se remet donc dans l'ordre de la session.
// ============================================================================

export interface QuestionRetourBase {
  id: string
  enonce: string
  options: string[]
  index_correct: number
}

export interface ReponseRetourBase {
  question_id: string
  p_a: number
  p_b: number
  p_c: number
  p_d: number
  repondu: boolean
  score: number | null
}

export interface QuestionRetourEleve {
  id: string
  enonce: string
  /** Dans l'ordre où l'élève les a vues. */
  options: string[]
  /** Index de la bonne réponse DANS `options` ci-dessus. */
  indexCorrect: number
  /** Ses points, dans le même ordre ; null s'il n'y a aucune ligne de réponse. */
  mesJetons: [number, number, number, number] | null
  score: number | null
  repondu: boolean
}

export function remettreDansOrdreEleve(
  questions: QuestionRetourBase[],
  reponses: ReponseRetourBase[],
  ordreQuestions: string[] | null,
  ordreOptions: Record<string, number[]> | null,
): QuestionRetourEleve[] {
  const parId = new Map(questions.map((q) => [q.id, q]))
  const repParQuestion = new Map(reponses.map((r) => [r.question_id, r]))

  // L'ordre de la session d'abord ; une question qu'il ne connaît pas (ajoutée
  // après coup — impossible sur un quiz passé, mais ne rien perdre) va à la fin.
  const vus = new Set<string>()
  const ids: string[] = []
  for (const id of ordreQuestions ?? []) if (parId.has(id) && !vus.has(id)) { ids.push(id); vus.add(id) }
  for (const q of questions) if (!vus.has(q.id)) { ids.push(q.id); vus.add(q.id) }

  return ids.map((id) => {
    const q = parId.get(id)!
    const brut = ordreOptions?.[id]
    const mapping = brut && brut.length === 4 && new Set(brut).size === 4
      && brut.every((i) => Number.isInteger(i) && i >= 0 && i <= 3) ? brut : [0, 1, 2, 3]
    const rep = repParQuestion.get(id)
    const originaux = rep ? [rep.p_a, rep.p_b, rep.p_c, rep.p_d].map((p) => Math.round(p * 100)) : null
    return {
      id,
      enonce: q.enonce,
      options: mapping.map((i) => q.options[i]),
      indexCorrect: mapping.indexOf(q.index_correct),
      mesJetons: originaux ? (mapping.map((i) => originaux[i]) as [number, number, number, number]) : null,
      score: rep?.score ?? null,
      repondu: rep?.repondu ?? false,
    }
  })
}
