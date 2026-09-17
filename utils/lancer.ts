// ============================================================================
// FAIRE PARTIR UNE LECTURE SANS L'ATTENDRE (17/09).
//
// Mesuré en prod : les fonctions tournent à côté de la base, mais chaque lecture
// coûte encore ~70 ms, et les écrans élève en enchaînaient 25 à 70 l'une
// derrière l'autre alors que presque aucune ne dépend d'une autre. Le patron :
// les lectures indépendantes PARTENT ensemble, et le code les ATTEND à l'endroit,
// et dans l'ordre, où il les lisait — mêmes refus, mêmes messages, même résultat.
//
// ⚠️ Un constructeur de requête supabase est PARESSEUX : il ne part qu'au `then`.
//    `Promise.resolve` le déclenche.
// ⚠️ Le `catch` muet ne cache rien : il évite qu'une lecture partie en avance,
//    puis jamais attendue parce qu'un refus est tombé avant elle, ne remonte en
//    rejet non géré. Qui l'attend reçoit toujours son rejet.
// ⛔ DES LECTURES, JAMAIS UNE ÉCRITURE : une écriture lancée en avance aurait
//    lieu même quand la garde qui suit refuse.
// ============================================================================
export function lancer<T>(lecture: PromiseLike<T>): Promise<T> {
  const p = Promise.resolve(lecture)
  p.catch(() => {})
  return p
}
