import type { ParcoursPilote } from './contrat'

const normaliser = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[’']/g, "'").trim()
export const THEMES_PILOTE = {
  '1HLP': ['Les pouvoirs de la parole', 'L’art de la parole', 'L’autorité de la parole', 'Les séductions de la parole'],
  THLP: ['La recherche de soi', 'Éducation, transmission et émancipation', 'Les expressions de la sensibilité', 'Les métamorphoses du moi'],
  TC: ['la vérité', 'la raison', 'la science', 'le langage', 'la technique'],
} satisfies Record<ParcoursPilote, string[]>

export function parcoursDeClasse(c: { niveau: string; type_pedagogique: string | null }): ParcoursPilote | null {
  if (c.niveau === 'terminale' && c.type_pedagogique === 'tc') return 'TC'
  if (c.type_pedagogique !== 'hlp') return null
  return c.niveau === 'terminale' ? 'THLP' : ['1ere', 'premiere'].includes(c.niveau) ? '1HLP' : null
}

export function admissibiliteSujet(
  parcours: ParcoursPilote,
  sujet: { forme: string; notions: string[]; statut: string; bloque: boolean; cours_etat: string },
  cours: Array<{ id: string; notions: string[] }>,
): { cours_ids: string[]; notions_ouvertes: string[] } | null {
  if (sujet.statut !== 'valide' || sujet.bloque || sujet.cours_etat !== 'notions'
    || sujet.forme !== (parcours === 'TC' ? 'dissertation_tc' : 'essai_hlp')) return null
  const themes = THEMES_PILOTE[parcours]
  const permis = new Set(themes.map(normaliser))
  const pertinents = cours.filter(c => c.notions.some(n => permis.has(normaliser(n))))
  const ouvertes = parcours === 'TC'
    ? [...new Set(pertinents.flatMap(c => c.notions).filter(n => permis.has(normaliser(n))))]
    : pertinents.length ? themes : []
  const intersection = sujet.notions.map(normaliser).filter(n => ouvertes.some(o => normaliser(o) === n))
  if (!intersection.length) return null
  return { cours_ids: pertinents.filter(c => parcours !== 'TC' || c.notions.some(n => intersection.includes(normaliser(n)))).map(c => c.id),
    notions_ouvertes: ouvertes }
}
