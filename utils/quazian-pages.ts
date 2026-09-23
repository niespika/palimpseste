// ============================================================================
// LIRE TOUTES LES PAGES — PostgREST rend 1000 lignes au plus par requête, SANS
// erreur. Les lectures du diagnostic Quazian prenaient toutes les réponses de
// toutes les copies en une fois : un quiz, c'est ~300 lignes (20 élèves × 15
// questions) ; dès le 4e quiz, le diagnostic n'en aurait lu qu'une partie, sans
// un mot (revue finale du 23/09). La fabrique reçoit les bornes d'une page ; la
// requête DOIT être ordonnée sur une clé unique pour que les pages ne se
// chevauchent pas. ⛔ Une page en échec rend l'erreur et AUCUNE ligne : jamais
// un diagnostic bâti sur les premières pages sans le dire (revue du 23/09 soir).
// ============================================================================

export const PAGE_POSTGREST = 1000

export async function toutesLesPages<T>(
  page: (debut: number, fin: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const lignes: T[] = []
  for (let debut = 0; ; debut += PAGE_POSTGREST) {
    const { data, error } = await page(debut, debut + PAGE_POSTGREST - 1)
    if (error) return { data: [], error }
    const lot = data ?? []
    lignes.push(...lot)
    if (lot.length < PAGE_POSTGREST) break
  }
  return { data: lignes, error: null }
}
