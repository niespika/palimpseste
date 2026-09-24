// Pur : aucun import. Les phrases de la confirmation de « ✓ Tout valider »
// (page d'un quiz, côté professeur).
//
// ⛔ 23/09 — un clic validait d'un coup, sans confirmation, toutes les questions
//    « à valider » : celles que le professeur n'avait pas relues passaient en ✓,
//    et « Lancer le quizz » apparaissait. La confirmation dit combien il en reste.

/** « 14 questions sur 17 ne sont pas encore validées. Les valider sans les relire une à une ? » */
export function phraseToutValider(n: number, total: number): string {
  if (n === 1) {
    return total === 1
      ? 'La question n’est pas encore validée. La valider sans la relire ?'
      : `1 question sur ${total} n’est pas encore validée. La valider sans la relire ?`
  }
  return n === total
    ? `Aucune des ${n} questions n’est encore validée. Les valider toutes sans les relire une à une ?`
    : `${n} questions sur ${total} ne sont pas encore validées. Les valider sans les relire une à une ?`
}

/** Le bouton qui confirme : il dit ce qu'il fait. */
export function libelleConfirmerToutValider(n: number): string {
  return n === 1 ? 'Valider la question' : `Valider les ${n}`
}

/**
 * Une question ouverte en modification serait validée dans sa version
 * ENREGISTRÉE, sans la correction en cours (revue du 23/09) : la confirmation
 * le dit — un avis, pas un refus.
 */
export function phraseEditionsOuvertes(numeros: readonly number[]): string {
  if (numeros.length === 0) return ''
  const qs = numeros.map((n) => `Q${n}`)
  const liste = qs.length === 1 ? qs[0] : `${qs.slice(0, -1).join(', ')} et ${qs[qs.length - 1]}`
  return numeros.length === 1
    ? `${liste} est ouverte en modification : sa correction n’est pas enregistrée, c’est la version enregistrée qui sera validée.`
    : `${liste} sont ouvertes en modification : leurs corrections ne sont pas enregistrées, ce sont les versions enregistrées qui seront validées.`
}
