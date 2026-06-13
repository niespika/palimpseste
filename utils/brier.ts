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

export function shuffleArray<T>(arr: T[], seed: string): T[] {
  // Mélange déterministe basé sur une graine (id élève)
  const result = [...arr]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  for (let i = result.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash) + i
    hash |= 0
    const j = Math.abs(hash) % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
