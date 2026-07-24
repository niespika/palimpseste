// Neutralise les redirections ouvertes (« open redirect ») : à partir d'un `next`
// venu d'un paramètre d'URL, ne renvoie JAMAIS qu'un chemin INTERNE (même origine).
//
// Le piège classique : `next.startsWith('/')` laisse passer « //evil.com » (URL
// protocol-relative) et « /\evil.com » (le parseur WHATWG normalise « \ » en « / »
// pour les schémas web) — deux formes qui, une fois passées à `new URL(next, origin)`,
// pointent hors du site. On rejette donc explicitement « // » et « /\ » en tête, PUIS
// on vérifie que la cible résolue reste sur NOTRE origine (filet contre les variantes
// exotiques : tabulations/retours insérés que le parseur supprime, etc.). Au moindre
// doute → le chemin `defaut`.
export function cibleInterneSure(
  next: string | null | undefined,
  origin: string,
  defaut: string,
): string {
  if (!next) return defaut
  // Chemin absolu interne exigé : un seul « / » en tête, jamais « // » ni « /\ ».
  if (!interne(next)) return defaut
  try {
    const resolue = new URL(next, origin)
    // Après normalisation WHATWG, la cible DOIT rester sur notre origine.
    if (resolue.origin !== origin) return defaut
    // ⚠️ La normalisation de CHEMIN peut reproduire une forme protocol-relative sans
    // changer l'origine : « /.//evil.com » garde origin=nous mais pathname=« //evil.com ».
    // Réinjecté dans `new URL(cible, origin)` par l'appelant, « //evil.com » redevient
    // externe. On REVALIDE donc la chaîne reconstruite avant de la renvoyer.
    const cible = resolue.pathname + resolue.search + resolue.hash
    return interne(cible) ? cible : defaut
  } catch {
    return defaut
  }
}

// Un chemin est « interne » s'il commence par un seul « / » (ni « // » protocol-relative,
// ni « /\ » que le parseur WHATWG normalise en « // »).
function interne(chemin: string): boolean {
  return chemin.startsWith('/') && !chemin.startsWith('//') && !chemin.startsWith('/\\')
}
