// ============================================================================
// ALETHEIA · E8 — « JE NE SAIS PAS » ET PETITS MALINS (module PUR).
// ----------------------------------------------------------------------------
// D4 : « je ne sais pas » est une réponse RECEVABLE par champ, à deux conditions : au
// moins un autre champ montre du travail, et l'élève dit en une ligne ce qui le bloque.
// Le formulaire compose alors un texte explicite (ci-dessous) que le retour V1 lit comme
// n'importe quel texte d'élève ; la ligne de blocage devient une question (champ 4).
// § 8.2 : le strike automatique ne frappe plus un champ court. Porte ouverte, il tombe si
// TOUS les emplacements 1 à 3 sont vides ou « je ne sais pas » sans explication, ou sur un
// aveu de NON-LECTURE. Mesuré en prod le 03/09 : « Je sais pas sur quoi commenter »,
// « Je sais pas », « Je ne sais pas avec quoi être en accord ou désaccord », une thèse de
// 26 caractères — quatre rendus réels, aucun ne doit valoir un strike.
// ============================================================================
import { detecterRenduVideTexte, detecterAveuHeuristique, type SignalStrike } from '../detecteur-integrite'

/** Matière minimale d'un emplacement pour compter comme « du travail » (caractères utiles). */
export const SEUIL_MATIERE = 25

export function normaliser(texte: string): string {
  return (texte ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Les tournures « je ne sais pas » (accents et apostrophes indifférents). */
const JNSP = /\b(je (ne )?sais pas|j sais pas|jsp|je (ne )?sais pas trop|aucune idee|je (ne )?comprends pas|j ai pas compris|je n ai pas compris)\b/g
/** Aveu de NON-LECTURE : le seul aveu qui vaut encore un strike porte ouverte. */
const NON_LECTURE = [
  'j ai pas lu', 'je n ai pas lu', 'jai pas lu', 'pas lu le livre', 'pas lu le chapitre', 'pas lu les chapitres',
  'rien lu', 'pas ouvert le livre', 'j ai pas lu le texte', 'je n ai rien lu',
]

/** La matière d'un emplacement une fois les « je ne sais pas » retirés. */
export function matiere(texte: string | null | undefined): number {
  return normaliser(texte ?? '').replace(JNSP, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().length
}

export function estJeNeSaisPas(texte: string | null | undefined): boolean {
  const n = normaliser(texte ?? '')
  return n.length > 0 && JNSP.test(n) && (JNSP.lastIndex = 0, true)
}

/**
 * Le signal d'intégrité algorithmique d'un rendu Aletheia.
 * Porte fermée : la règle d'avant (concaténation des trois champs < 25 caractères, aveux de
 * non-travail). Porte ouverte : strike seulement si les TROIS emplacements sont sans matière,
 * ou sur un aveu de non-lecture dans un texte court.
 */
export function signalRendu(champs: readonly (string | null | undefined)[], porteOuverte: boolean): SignalStrike | null {
  const textes = champs.map(c => (c ?? '').trim())
  if (!porteOuverte) return detecterRenduVideTexte(textes) ?? detecterAveuHeuristique(textes.join('\n'))
  const tout = textes.join('\n')
  if (tout.trim().length === 0) return null   // un rendu réellement vide est refusé en amont
  const n = normaliser(tout)
  if (n.length <= 240) {
    for (const a of NON_LECTURE) if (n.includes(a)) return { type: 'aveu_non_travail', motif: `Le rendu contient « ${a} ».` }
  }
  const matieres = textes.map(matiere)
  if (matieres.every(m => m < SEUIL_MATIERE)) {
    return { type: 'vide', motif: `Aucun des trois emplacements ne porte de matière (${matieres.join(' / ')} caractères utiles).` }
  }
  // Les aveux de non-travail d'avant restent valables, sur un texte court.
  return detecterAveuHeuristique(tout)
}

// ── La composition d'un « je ne sais pas » ─────────────────────────────────

export interface JeNeSaisPas {
  /** « Dis en une ligne ce qui te bloque » — exigé. */
  blocage: string
  /** Emplacement 1 : la proposition choisie et pourquoi. */
  choix?: string
  pourquoi?: string
  /** Emplacement 2 : la phrase recopiée qui a le plus arrêté l'élève. */
  phrase?: string
}

export const MARQUE_JNSP = 'Je ne sais pas.'

/** Le texte stocké dans l'emplacement : explicite, lisible par le retour V1 comme par le prof. */
export function texteJeNeSaisPas(j: JeNeSaisPas): string {
  const l = [MARQUE_JNSP, `Ce qui me bloque : ${j.blocage.trim()}`]
  if (j.choix?.trim()) l.push(`Parmi les propositions, je choisis : « ${j.choix.trim()} »${j.pourquoi?.trim() ? ` — parce que ${j.pourquoi.trim()}` : ''}`)
  if (j.phrase?.trim()) l.push(`La phrase qui m’a le plus arrêté : « ${j.phrase.trim()} »`)
  return l.join('\n')
}

/** La question ajoutée au champ 4 depuis la ligne de blocage (une phrase, point d'interrogation). */
export function questionDeBlocage(blocage: string): string {
  const b = blocage.trim().replace(/[.!\s]+$/u, '')
  if (!b) return ''
  return /\?$/.test(b) ? b : `${b} ?`
}

// ── Les propositions de l'emplacement 1 ────────────────────────────────────

/** Trois propositions (la thèse en registre élève + deux distracteurs), mélangées de façon déterministe. */
export function propositionsChamp1(theseEleve: string, distracteurs: readonly string[], graine: number): string[] {
  const d = distracteurs.map(x => x.trim()).filter(Boolean).slice(0, 2)
  if (!theseEleve.trim() || d.length < 2) return []
  const tous = [theseEleve.trim(), ...d]
  const k = Math.abs(graine) % 3
  return [...tous.slice(k), ...tous.slice(0, k)]
}
