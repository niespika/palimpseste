/**
 * ⭐⭐ 02/09/2026 — LE CONTRÔLE DE FIDÉLITÉ DES CITATIONS DE P1, pour les six.
 *
 * « Toute citation verbatim rendue par P1 se contrôle contre la production. Le
 * contrôle est OBLIGATOIRE » (`CONTRAT-MODULES.md` §3). Avant ce module, il
 * n'existait que dans l'Expression (`controleExistenceCitations`, par numéro de
 * phrase) et dans la Connaissance (après P2, en `includes` strict). Les quatre
 * autres n'avaient RIEN — et c'est P1 qui dérive : mesuré le 31/08 sur 187
 * squelettes, 5,0 % de citations non verbatim, 18,5 % en argumentation.
 *
 * ⚠️ CE QUE CE CONTRÔLE FAIT, ET NE FAIT PAS. Il ALERTE. Il ne retire rien du
 * relevé, n'ajoute rien au document de P2, ne change aucune lettre — la même
 * décision que l'Expression a prise à sa fiche §8 : « alerte sans retirer », le
 * pari se fermant sur un lot réel. La ligne va au bilan du dépôt et, en abrégé,
 * au `dernier_message` du job que l'écran du professeur lit.
 *
 * ⭐ UN SEUL TOKENISEUR. La comparaison est celle du retour — `citationTient`,
 * donc `aplatir` (apostrophes, guillemets, blancs, casse) et l'élision découpée.
 * Ce que le retour élague, ce contrôle le compte ; les deux ne divergeront pas.
 *
 * ⛔ LE CONTRÔLE SE FAIT SUR LA PRODUCTION BRUTE, jamais sur la copie préparée :
 * la Structure sert à P1 une copie préfixée `[¶1] `, et P1 la recopie parfois
 * avec son repère. Le repère n'est pas de l'élève.
 */
import type { Competence } from './types'
import { citationTient, morceauxControlables } from './citation-verifiee'

/**
 * Les chemins des champs que le PROMPT P1 de chaque fiche déclare verbatim
 * (« mot pour mot », « les mots exacts de l'élève », « verbatim »). `[]` traverse
 * une liste. ⚠️ Un champ qui n'est pas dans cette table n'est pas contrôlé —
 * `these`, `preuve_offerte`, `objet`, `note` sont des REFORMULATIONS par contrat,
 * et les compter en infidèles ferait crier le contrôle à chaque copie.
 *
 * L'Expression n'y figure pas : son branchement porte déjà son contrôle, par
 * numéro de phrase, plus fin que celui-ci — le doubler ferait deux alertes pour
 * une citation.
 */
export const CHAMPS_VERBATIM_P1: Readonly<Record<Competence, readonly string[]>> = {
  expression: [],
  argumentation: ['p1.unites[].garant_cite', 'p1.unites[].liaison_citee'],
  structure: [
    'p1.blocs[].idee_directrice_citee',
    'p1.jointures[].fin_bloc_precedent',
    'p1.jointures[].debut_bloc_suivant',
    'p1.jointures[].texte_cite',
    'p1.promesse.annonce_de_plan',
  ],
  questionnement: ['p1.question_posee', 'p1.reponse_concurrente_citee', 'p1.recadrages[].cite'],
  synthese: [
    'p1a.unites[].citation',
    'p1a.rapports[].citation',
    'p1a.these_citee',
    'p1a.apports[].terme_cite',
    'p1a.apports[].deploiement[]',
  ],
  connaissance: ['p1.unites_mobilisees[].citation'],
}

/**
 * Ce qu'un P1 écrit quand il n'a rien à citer, et qui n'est donc pas une
 * citation : le vide, les crochets (`[absente]`, `[aucune]`), et les mots nus
 * que les prompts autorisent.
 */
const PLACEHOLDERS = new Set(['absent', 'absente', 'absentes', 'aucun', 'aucune', 'n/a', 'sans objet'])

export function estUnPlaceholder(v: string): boolean {
  const t = v.trim()
  if (t === '') return true
  if (t.startsWith('[') && t.endsWith(']')) return true
  return PLACEHOLDERS.has(t.toLowerCase())
}

export interface CitationP1 {
  /** Le chemin instancié — `p1.unites[2].liaison_citee`. */
  ou: string
  citation: string
}

/** Les citations que les artefacts de P1 portent aux champs déclarés verbatim. */
export function citationsDeP1(competence: Competence, artefacts: unknown): CitationP1[] {
  const out: CitationP1[] = []
  for (const chemin of CHAMPS_VERBATIM_P1[competence] ?? []) {
    cueillir(artefacts, chemin.split('.'), chemin.split('.')[0] ?? '', out, 0)
  }
  return out
}

function cueillir(noeud: unknown, segments: string[], ou: string, out: CitationP1[], i: number): void {
  if (i >= segments.length) {
    if (typeof noeud === 'string' && !estUnPlaceholder(noeud)) out.push({ ou, citation: noeud })
    return
  }
  const seg = segments[i]!
  const cle = seg.endsWith('[]') ? seg.slice(0, -2) : seg
  const enfant = cle === '' ? noeud
    : (noeud !== null && typeof noeud === 'object' && !Array.isArray(noeud))
      ? (noeud as Record<string, unknown>)[cle] : undefined
  const suffixe = i === 0 ? '' : `.${cle}`
  if (seg.endsWith('[]')) {
    if (!Array.isArray(enfant)) return
    enfant.forEach((e, k) => cueillir(e, segments, `${ou}${suffixe}[${k}]`, out, i + 1))
  } else {
    cueillir(enfant, segments, `${ou}${suffixe}`, out, i + 1)
  }
}

export interface FideliteP1 {
  /** Les citations trouvées aux champs verbatim. */
  total: number
  /** Celles qu'on a pu confronter à la production (au moins un morceau au plancher). */
  controlees: number
  /** Trop courtes pour prouver quoi que ce soit — ni fidèles, ni infidèles. */
  nonControlables: number
  infideles: CitationP1[]
  /** La ligne du bilan, `null` s'il n'y a rien à dire. */
  alerte: string | null
}

/** Le préfixe que le résumé du job reconnaît. Une forme, un lecteur. */
export const PREFIXE_FIDELITE_P1 = 'FIDÉLITÉ P1'

export function controlerFideliteP1(
  competence: Competence, artefacts: unknown, production: string | null | undefined,
): FideliteP1 {
  const citations = citationsDeP1(competence, artefacts)
  const vide: FideliteP1 = { total: citations.length, controlees: 0, nonControlables: 0, infideles: [], alerte: null }
  if (!citations.length) return vide
  if (production == null || production.trim() === '') {
    // « Un module qui n'a pas la production sous la main le déclare : il rend une
    //   alerte de contrôle non exécuté, il ne se tait jamais » (`CONTRAT` §3).
    return { ...vide, alerte: `${PREFIXE_FIDELITE_P1} : contrôle NON EXÉCUTÉ sur ${citations.length} `
      + 'citation(s) — production absente' }
  }
  let controlees = 0
  let nonControlables = 0
  const infideles: CitationP1[] = []
  for (const c of citations) {
    if (morceauxControlables(c.citation).length === 0) { nonControlables += 1; continue }
    controlees += 1
    if (!citationTient(production, c.citation)) infideles.push(c)
  }
  if (!infideles.length) return { total: citations.length, controlees, nonControlables, infideles, alerte: null }
  const exemples = infideles.slice(0, 3)
    .map((c) => `${c.ou} « ${c.citation.length > 60 ? `${c.citation.slice(0, 60)}…` : c.citation} »`)
    .join(' · ')
  return {
    total: citations.length, controlees, nonControlables, infideles,
    alerte: `${PREFIXE_FIDELITE_P1} ${infideles.length}/${controlees} : citation(s) introuvable(s) dans `
      + `la copie — ${exemples}${infideles.length > 3 ? ` · +${infideles.length - 3}` : ''} `
      + '(alerte seule — rien retiré, rien ajouté au document de P2)',
  }
}

/**
 * L'abrégé pour le `dernier_message` du job : « fidélité P1 — argumentation 3/12,
 * structure 1/9 ». Lit les alertes du bilan, qui arrivent préfixées du nom de la
 * compétence ; ne dit rien quand tout tient.
 */
export function motifDeFidelite(alertes: readonly string[]): string {
  const motif = new RegExp(`^([a-z]+) : (?:.*? · )?${PREFIXE_FIDELITE_P1} (\\d+)/(\\d+)`)
  const parts: string[] = []
  for (const a of alertes) {
    // Une alerte de compétence joint plusieurs lignes par « · » ; on cherche la nôtre.
    for (const ligne of a.split(' · ')) {
      const m = ligne.match(motif) ?? a.match(motif)
      if (m && !parts.some((p) => p.startsWith(m[1]!))) { parts.push(`${m[1]} ${m[2]}/${m[3]}`); break }
    }
  }
  return parts.length ? `, fidélité P1 — ${parts.join(', ')}` : ''
}
