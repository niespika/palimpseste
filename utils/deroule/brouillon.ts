// Brouillon LOCAL du déroulé des exercices — la CLÉ, et rien d'autre : lecture, écriture, fusion
// sont celles de `utils/aletheia/brouillon.ts`, branchées par `useBrouillonLocalParCle`.
//
// ⭐ 15/09 — un élève a perdu son texte comme celui d'Aletheia le 13/09 : la porte « retour non
//    lu » refusait aussi l'enregistrement automatique du brouillon (en silence), il est parti
//    lire son retour, l'onglet a emporté son texte. Le filet local survit à toute porte.
//
// La clé porte l'ÉLÈVE (un poste partagé ne sert jamais le brouillon d'un autre), le DÉPÔT, la
// VERSION (v1 ou vf), et le CAS d'une paire — deux cas sont deux champs.

export function cleBrouillonDeroule(
  eleveId: string, depotId: string, version: 'v1' | 'vf', cas: 1 | 2 | null = null,
): string {
  return `deroule:brouillon:${eleveId}:${depotId}:${version}${cas ? `:${cas}` : ''}`
}
