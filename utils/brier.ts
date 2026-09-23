// Score de Brier conforme à SPEC_Quazian §6.4

export function calculerScoreBrier(
  jetons: [number, number, number, number],
  indexCorrect: number
): number {
  const total = jetons.reduce((a, b) => a + b, 0)
  const proba = jetons.map((j) => j / (total || 100)) as [number, number, number, number]

  const outcomes = proba.map((_, i) => (i === indexCorrect ? 1 : 0))

  const bs = proba.reduce((acc, p, i) => acc + Math.pow(p - outcomes[i], 2), 0)
  const brut = 1 - bs  // ∈ [-1, +1]
  return Math.round(brut * 10 * 1000) / 1000  // ∈ [-10, +10], arrondi 3 décimales
}

// Vérification : 100% bonne → +10 ; 100% mauvaise → -10 ; 25% partout → +2.5
// BS(100%correct) = (1-1)² + 0 + 0 + 0 = 0 → brut = 1 → score = 10 ✓
// BS(100%wrong)   = (1-0)² + (0-1)² = 1+1 = 2 → brut = -1 → score = -10 ✓
// BS(25%partout)  = (0.25-1)²+(0.25-0)²×3 = 0.5625+0.1875 = 0.75 → brut = 0.25 → score = 2.5 ✓

export const JETONS_NEUTRE: [number, number, number, number] = [25, 25, 25, 25]
export const SCORE_NON_REPONDU = 2.5

/**
 * Mélange déterministe basé sur une graine (id élève + quiz ou question).
 * ⛔ Refait le 22/09 : l'ancien (`hash*31 + i`, `% (i+1)`) ne produisait que 12
 *    ordres sur 24, et la réponse d'origine n°0 tombait en B une fois sur trois
 *    (mesuré sur 100 000 graines). Ici : la graine est brassée (xmur3), un
 *    générateur semé (mulberry32) tire un Fisher-Yates — chaque ordre équiprobable.
 *    Les ordres déjà tirés vivent dans les sessions (`ordre_options`) : rien ne bouge
 *    pour un quiz en cours.
 */
export function shuffleArray<T>(arr: T[], seed: string): T[] {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  let etat = (h ^ (h >>> 16)) >>> 0
  const aleatoire = () => {
    etat = (etat + 0x6d2b79f5) >>> 0
    let t = etat
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(aleatoire() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
