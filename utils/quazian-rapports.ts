// ============================================================================
// LE TEXTE D'UN RAPPORT DE FRAGILITÉS, LISIBLE TEL QUEL (23/09/2026).
// Mesuré au bac à sable : le modèle rend du Markdown (« ## Rapport… »,
// « **Diagnostic général :** ») et l'écran l'affiche brut — l'ancien rapport
// aussi. La consigne lui demande du texte simple ; ceci retire ce qui passe
// quand même, à l'écriture comme à l'affichage (idempotent).
// ============================================================================

export function texteSansMarkdown(texte: string): string {
  return texte
    .split('\n')
    .map((ligne) => ligne
      .replace(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/, '') // filets (avant l'italique, qui mangerait « *** »)
      .replace(/^\s{0,3}#{1,6}\s+/, '')          // titres
      .replace(/^\s{0,3}>\s?/, '')               // citations
      .replace(/^(\s*)[-*+]\s+/, '$1• ')          // puces
      .replace(/\*\*(.+?)\*\*/g, '$1')            // gras
      .replace(/__(.+?)__/g, '$1')
      .replace(/(^|[\s(])\*(?![\s)])(.+?)(?<![\s(])\*(?=[\s).,;:!?]|$)/g, '$1$2')) // italique, jamais « (*) »
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Une classe a-t-elle de quoi nourrir un rapport ? Sans idée fausse ni lacune, l'appel ne dirait que « rien à signaler ». */
export function aDesFragilites(concepts: Record<string, { idee_fausse: number; lacune: number }>): boolean {
  return Object.values(concepts).some((v) => v.idee_fausse > 0 || v.lacune > 0)
}
