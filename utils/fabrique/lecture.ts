// ============================================================================
// C4 · L8 — UNE LECTURE RATÉE N'EST PAS UNE BASE VIDE.
// ----------------------------------------------------------------------------
// Toutes les pages de la fabrique lisaient avec `?? []` : quand la requête
// échouait, l'écran affichait « Aucune entrée » — exactement ce qu'il affiche
// quand il n'y a rien. Le professeur en concluait qu'il n'avait rien déposé, ou
// que la file était vide, et les gestes suivants partaient de là.
//
// `lire()` rend les lignes ET l'incident. Les pages montrent l'incident.
// ============================================================================

export interface Lecture<T> { lignes: T[]; incident: string | null }

/** Enveloppe une requête Supabase : les lignes d'un côté, l'incident de l'autre. */
export async function lire<T>(
  quoi: string,
  requete: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<Lecture<T>> {
  try {
    const { data, error } = await requete
    if (error) return { lignes: [], incident: `${quoi} : ${error.message}` }
    return { lignes: data ?? [], incident: null }
  } catch (e) {
    return { lignes: [], incident: `${quoi} : ${(e as Error).message}` }
  }
}

/** Ce que les pages affichent en tête quand une lecture a échoué. */
export function incidentsDe(...lectures: Array<Lecture<unknown>>): string[] {
  return lectures.map((l) => l.incident).filter((x): x is string => x !== null)
}
