// Détecteur « petits malins » (T3) — repère, EN AMONT de l'évaluation, les copies
// qui ne « jouent pas le jeu » : hors-sujet, aveu de non-travail, section déclarée
// non applicable. Double passe : cette heuristique (sans IA, stricte) + un champ
// structuré renvoyé par l'éval IA. Signal INDICATIF (le prof tranche), jamais bloquant.

export type TypeSignalIntegrite = 'hors_sujet' | 'aveu_non_travail' | 'section_na'

export interface SignalIntegrite {
  type: TypeSignalIntegrite
  motif: string
  source: 'heuristique' | 'ia'
}

export const LABEL_SIGNAL: Record<TypeSignalIntegrite, string> = {
  hors_sujet: 'Hors-sujet',
  aveu_non_travail: 'Aveu de non-travail',
  section_na: 'Section déclarée non applicable',
}

// Patterns accent- et apostrophe-insensibles (cf. normalisation ci-dessous).
const AVEUX = [
  'pas eu le temps', 'pas pu faire', 'pas fait le travail', 'pas fait ce travail',
  'j ai rien fait', 'je n ai rien fait', 'jai rien fait', 'rien fait cette semaine',
  'j ai pas fait', 'je n ai pas fait', 'jai pas fait',
  'pas travaille cette semaine', 'je n ai pas travaille', 'j ai pas bosse',
]
const SECTION_NA = ['ne s applique pas', 'sans objet', 'non applicable', 'pas concerne']

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // accents
    .replace(/['’]/g, ' ')                    // apostrophes droites/courbes
    .replace(/\s+/g, ' ')
    .trim()
}

// Heuristique STRICTE (seuil élevé) : on ne signale que sur un aveu explicite ET
// dans un texte court. Un aveu noyé dans une copie substantielle n'est pas un
// « petit malin ». On préfère les faux négatifs aux faux positifs.
export function detecterAveuHeuristique(texteBrut: string | null | undefined): SignalIntegrite | null {
  if (!texteBrut) return null
  const brut = texteBrut.trim()
  if (brut.length === 0 || brut.length > 240) return null
  const norm = normaliser(brut)
  for (const a of AVEUX) {
    if (norm.includes(a)) return { type: 'aveu_non_travail', motif: `Le commentaire contient « ${a} ».`, source: 'heuristique' }
  }
  for (const s of SECTION_NA) {
    if (norm.includes(s)) return { type: 'section_na', motif: `Le commentaire mentionne « ${s} ».`, source: 'heuristique' }
  }
  return null
}

// Signal d'intégrité détectable SANS IA, comptabilisable en strike. Réutilise les
// trois types ci-dessus (aveu/section) + un type 'vide' propre à la détection
// algorithmique. (Le type complet `TypeStrike` vit dans utils/integrite.)
export interface SignalStrike {
  type: TypeSignalIntegrite | 'vide'
  motif: string
}

// Rendu de texte « vide / bâclé » détectable SANS IA : champs principaux quasi
// vides (l'élève a saisi « jsp », « . », « azerty »… juste pour valider). On
// concatène les champs et on exige un minimum de matière. STRICT (seuil bas) :
// une vraie réponse, même faible, dépasse largement ce seuil → faux négatifs
// préférés. Renvoie un signal 'vide' ou null.
const SEUIL_VIDE = 25
export function detecterRenduVideTexte(champs: Array<string | null | undefined>): SignalStrike | null {
  const total = champs.map(c => (c ?? '').trim()).join(' ').replace(/\s+/g, ' ').trim()
  if (total.length === 0) return null  // un rendu réellement vide est déjà refusé en amont
  if (total.length < SEUIL_VIDE) {
    return { type: 'vide', motif: `Rendu quasi vide (${total.length} caractères utiles).` }
  }
  return null
}

// Normalise le champ `signal_integrite` renvoyé par l'éval IA (pass 2). `aucun`,
// inconnu ou absent → null (RAS, cas par défaut).
export function signalDepuisIA(brut: unknown): SignalIntegrite | null {
  if (!brut || typeof brut !== 'object') return null
  const o = brut as { type?: unknown; motif?: unknown }
  if (o.type === 'hors_sujet' || o.type === 'aveu_non_travail' || o.type === 'section_na') {
    return { type: o.type, motif: typeof o.motif === 'string' ? o.motif : '', source: 'ia' }
  }
  return null
}
