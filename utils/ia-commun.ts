// Briques IA COMMUNES aux modules (RAG L5, SPEC §9.3) — EXTRACTION à
// comportement constant depuis utils/aletheia-retours.ts : le REGISTRE et les
// helpers d'injection/neutralisation y étaient locaux ; le chat Scriptorium les
// partage désormais. Aucun changement de contenu : le `git diff` des prompts
// Aletheia rendus est vide (même chaîne REGISTRE, mêmes remplacements).

// Le texte élève est inséré entre des balises <<<…>>>. On neutralise toute tentative
// de "fermer" une balise pour injecter de fausses consignes (défense en profondeur :
// le contexte IA contient du texte du livre — amont déjà lu + texte de la semaine).
export const sansDelims = (s: string): string => s.replace(/<<<|>>>/g, '·')

// ── Registre — rappel transversal injecté dans TOUS les prompts (SPEC §2.3) ───
export const REGISTRE = `## Registre (RÈGLE TRANSVERSALE)
Tu écris pour des élèves de 1ère / Terminale, pas toujours à l'aise avec la langue ni dotés d'une grande culture. Donc : phrases COURTES, mots SIMPLES, tout terme difficile explicité entre parenthèses. Rends les nuances saisissables SANS niveler la philosophie : la nuance reste là, mais accessible. Pas de jargon gratuit, pas de longues périodes.`

// Remplace {var} en UNE seule passe : un {placeholder} présent dans le texte de
// l'élève n'est donc jamais ré-interprété comme une autre variable injectée ensuite
// (et les « $ » du contenu restent littéraux). Un {token} inconnu est laissé tel quel.
export function injecter(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, cle: string) => (cle in vars ? vars[cle] : match))
}

export function extraireJSON(texte: string): string {
  return texte.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
}
