// ----------------------------------------------------------------------------
// Notation des sections — échelle E → A (Lot 5, Phase 2).
// Niveau 1 (sections / compétences) : lettres E (faible) → A (fort), avec une
// VALEUR 0-4 sous-jacente (E=0 … A=4). Le stockage reste 0-4 (canonique) ; les
// lettres sont une couche d'AFFICHAGE. Source unique consommée partout.
// (Niveau 2 — note finale /20 — reste numérique et ne concerne QUE l'essai et
//  la synthèse ; ni l'écrit ni l'oral.)
// ----------------------------------------------------------------------------

/** Index 0-4 → lettre. E=0 (faible) … A=4 (fort). */
export const LETTRES_SECTIONS = ['E', 'D', 'C', 'B', 'A'] as const
export type LettreSection = (typeof LETTRES_SECTIONS)[number]

/** Valeur 0-4 (éventuellement moyenne) → lettre arrondie, ou null. */
export function noteVersLettre(n: number | null | undefined): LettreSection | null {
  if (n == null || Number.isNaN(n)) return null
  const i = Math.max(0, Math.min(4, Math.round(n)))
  return LETTRES_SECTIONS[i]
}

/** Lettre → valeur 0-4, ou null. */
export function lettreVersNote(l: string | null | undefined): number | null {
  if (!l) return null
  const i = LETTRES_SECTIONS.indexOf(l as LettreSection)
  return i >= 0 ? i : null
}

/** Couleurs de badge par lettre (partagé par tous les affichages). */
export const COULEUR_LETTRE: Record<LettreSection, string> = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-yellow-100 text-yellow-800',
  D: 'bg-orange-100 text-orange-800',
  E: 'bg-red-100 text-red-800',
}
