// ============================================================================
// ALETHEIA · E4 — LES PASSAGES CLÉS D'UNE SÉANCE. Module PUR (aucune base, aucune I/O).
// ----------------------------------------------------------------------------
// Un passage clé = un bloc contigu de phrases de la découpe (E1), avec une ou
// plusieurs PIVOTS (1 à 2 phrases contiguës à l'intérieur) : LA phrase qui répond
// au libellé. La fiche en porte 2 à 4 par séance. Le retour V1 les DÉSIGNE par
// identifiant ; l'élève se les voit montrés (E, D) ou les cherche (C, B, A).
//
// ⭐ L'IA NE PRODUIT JAMAIS UN OFFSET, ni du texte : des identifiants de phrases,
//    que ce module VÉRIFIE contre la découpe (existants, contigus, dans la borne).
//    Ce qui ne passe pas est rejeté, jamais réparé (§ 4.2 du spec).
// ⭐ LE TEXTE DES PIVOTS EST GARDÉ (`pivots_texte`) pour le ré-alignement : quand le
//    texte du livre change, on cherche chaque pivot mot pour mot dans la nouvelle
//    version ; retrouvée → ré-alignée ; sinon → « à revoir » (§ 4.3).
// ============================================================================
import { type DecoupeSemaine, type Bornes, rendreTranche } from './decoupage'

export interface PassageCle {
  /** `k{semaine}-{n}` */
  id: string
  /** `these` | `argument:k` | `concept:<terme>` | `reponse` */
  role: string
  /** Ce que l'élève cherche, en clair, ≤ 12 mots, sans donner la réponse. */
  libelle: string
  phrase_debut: string
  phrase_fin: string
  /** Alternatives recevables ; chaque alternative = 1 ou 2 identifiants de phrases contiguës, dans le passage. */
  pivots: string[][]
  /** Le texte RENDU de chaque alternative, pour le ré-alignement. */
  pivots_texte: string[]
  /** Empreinte de la découpe (version du livre) au moment de la génération / du ré-alignement. */
  decoupage_version?: string
  /** Posé par le ré-alignement quand une pivot n'a pas été retrouvée. */
  revoir?: boolean
}

export const MIN_PHRASES_PASSAGE = 2
export const MAX_PHRASES_PASSAGE = 12
export const MAX_PASSAGES = 4

// ── Le prompt (E0 § 13.2 : 12 passages sur 3 semaines, 1 rejet, pivots justes) ─
export const PROMPT_PASSAGES_DEFAUT = `Tu établis, pour un chapitre d'un livre de philosophie lu par des élèves de 1re/Terminale, les PASSAGES CLÉS qu'un bon lecteur doit avoir repérés. Le texte est donné PHRASE PAR PHRASE, chaque phrase précédée de son identifiant entre crochets. Tu ne recopies JAMAIS de texte : tu réponds UNIQUEMENT par des identifiants.

## Fiche canonique du chapitre (thèse et arguments clés — ton guide)
{fiche}

## Texte du chapitre, phrase par phrase
{texte}

## Ta tâche
Produis 2 à 4 passages clés. Pour chacun :
- "role" : "these" (le passage où la thèse est formulée) ou "argument:k" (k = numéro de l'argument clé dans la fiche) ou "concept:<terme>".
- "libelle" : ce que l'élève doit CHERCHER, en ≤ 12 mots. ⛔ Le libellé dit OÙ chercher, jamais CE QU'ON y trouve : « la phrase où l'auteur formule la règle » (bien) ; « la phrase où le dialogue devient modèle du roman » (mal : c'est la réponse).
- "passage" : [premier_id, dernier_id] — un bloc CONTIGU de ${MIN_PHRASES_PASSAGE} à ${MAX_PHRASES_PASSAGE} phrases.
- "pivots" : liste d'ALTERNATIVES ; chaque alternative = liste de 1 ou 2 identifiants CONTIGUS, à l'intérieur du passage. La pivot est LA phrase qui répond au libellé. ⛔ Deux phrases distinctes qui répondent chacune = DEUX alternatives, jamais une pivot à trou.

## Format — UNIQUEMENT un objet JSON valide, sans texte autour :
{ "passages": [ { "role": "these", "libelle": "…", "passage": ["s12-003", "s12-009"], "pivots": [["s12-005"]] } ] }`

// ── Numérotation du texte pour le prompt ─────────────────────────────────────
export function numeroterSemaine(texte: string, d: DecoupeSemaine): string {
  return d.phrases.map(p => `[${p.id}] ${rendreTranche(texte, p.bornes, d.masques)}`).join('\n')
}

export function formaterFichePourPassages(f: { these_canonique: string; arguments_cles: string[] } | null): string {
  if (!f) return '(fiche indisponible)'
  return `Thèse : ${f.these_canonique || '—'}\nArguments clés :\n${f.arguments_cles.map((a, i) => `${i + 1}. ${a}`).join('\n') || '—'}`
}

// ── Vérification par le code ─────────────────────────────────────────────────
export interface Rejet { index: number; motifs: string[] }

const idx = (d: DecoupeSemaine, id: string) => d.phrases.findIndex(p => p.id === id)

export function validerPassages(brut: unknown, d: DecoupeSemaine, texte: string, version?: string): { passages: PassageCle[]; rejets: Rejet[] } {
  const liste = Array.isArray((brut as { passages?: unknown })?.passages) ? (brut as { passages: unknown[] }).passages : []
  const passages: PassageCle[] = []
  const rejets: Rejet[] = []
  liste.slice(0, MAX_PASSAGES + 2).forEach((p, index) => {
    const motifs: string[] = []
    const o = (p ?? {}) as { role?: unknown; libelle?: unknown; passage?: unknown; pivots?: unknown }
    const role = typeof o.role === 'string' && o.role.trim() ? o.role.trim() : 'these'
    const libelle = typeof o.libelle === 'string' ? o.libelle.trim() : ''
    if (!libelle) motifs.push('libelle_vide')
    const [a, b] = Array.isArray(o.passage) ? o.passage as unknown[] : [null, null]
    const ia = typeof a === 'string' ? idx(d, a) : -1
    const ib = typeof b === 'string' ? idx(d, b) : -1
    if (ia === -1 || ib === -1) motifs.push('id_passage_inconnu')
    else if (ib < ia) motifs.push('passage_inverse')
    else if (ib - ia + 1 < MIN_PHRASES_PASSAGE || ib - ia + 1 > MAX_PHRASES_PASSAGE) motifs.push('passage_taille')
    const alts = Array.isArray(o.pivots) ? o.pivots as unknown[] : []
    if (alts.length === 0) motifs.push('pas_de_pivot')
    const pivots: string[][] = []
    for (const alt of alts) {
      if (!Array.isArray(alt) || alt.length < 1 || alt.length > 2 || !alt.every(x => typeof x === 'string')) { motifs.push('pivot_taille'); continue }
      const ids = alt as string[]
      const is = ids.map(x => idx(d, x))
      if (is.some(i => i === -1)) { motifs.push('id_pivot_inconnu'); continue }
      if (is.length === 2 && is[1] !== is[0] + 1) { motifs.push('pivot_non_contigue'); continue }
      if (ia !== -1 && ib !== -1 && !is.every(i => i >= ia && i <= ib)) { motifs.push('pivot_hors_passage'); continue }
      pivots.push(ids)
    }
    if (motifs.length === 0 && pivots.length === 0) motifs.push('pas_de_pivot')
    if (motifs.length > 0) { rejets.push({ index, motifs }); return }
    if (passages.length >= MAX_PASSAGES) { rejets.push({ index, motifs: ['trop_de_passages'] }); return }
    passages.push({
      id: `k${d.semaine}-${passages.length + 1}`,
      role, libelle,
      phrase_debut: a as string, phrase_fin: b as string,
      pivots,
      pivots_texte: pivots.map(ids => textePivot(texte, d, ids)),
      ...(version ? { decoupage_version: version } : {}),
    })
  })
  return { passages, rejets }
}

export function textePivot(texte: string, d: DecoupeSemaine, ids: readonly string[]): string {
  const is = ids.map(x => idx(d, x)).filter(i => i >= 0)
  if (is.length === 0) return ''
  const b: Bornes = [d.phrases[is[0]].bornes[0], d.phrases[is[is.length - 1]].bornes[1]]
  return rendreTranche(texte, b, d.masques)
}

export function bornesPassage(d: DecoupeSemaine, p: Pick<PassageCle, 'phrase_debut' | 'phrase_fin'>): Bornes | null {
  const ia = idx(d, p.phrase_debut), ib = idx(d, p.phrase_fin)
  if (ia === -1 || ib === -1 || ib < ia) return null
  return [d.phrases[ia].bornes[0], d.phrases[ib].bornes[1]]
}

/** Nettoie un passage édité à la main : ids existants, bornes ordonnées, pivots dans le passage. `null` si irrécupérable. */
export function normaliserPassage(p: PassageCle, d: DecoupeSemaine, texte: string): PassageCle | null {
  let ia = idx(d, p.phrase_debut), ib = idx(d, p.phrase_fin)
  if (ia === -1 || ib === -1) return null
  if (ib < ia) [ia, ib] = [ib, ia]
  const pivots = (p.pivots ?? []).map(alt => alt.filter(x => { const i = idx(d, x); return i >= ia && i <= ib }).slice(0, 2)).filter(alt => alt.length > 0)
  return {
    ...p,
    libelle: (p.libelle ?? '').trim(),
    phrase_debut: d.phrases[ia].id, phrase_fin: d.phrases[ib].id,
    pivots, pivots_texte: pivots.map(ids => textePivot(texte, d, ids)),
  }
}

// ── Ré-alignement après changement de version du texte (§ 4.3) ───────────────
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[’']/g, "'").trim()

/**
 * Cherche chaque pivot (par son texte) dans la nouvelle version ; recale les bornes du
 * passage à la même distance qu'avant. Une pivot introuvable ⇒ `revoir: true`.
 */
export function realignerPassage(p: PassageCle, texte: string, d: DecoupeSemaine, version?: string): PassageCle {
  const rendu = norm(d.phrases.map(ph => rendreTranche(texte, ph.bornes, d.masques)).join(' '))
  // Table offset-rendu → index de phrase : on reconstruit par phrase.
  const debuts: number[] = []
  let acc = 0
  for (const ph of d.phrases) { debuts.push(acc); acc += norm(rendreTranche(texte, ph.bornes, d.masques)).length + 1 }
  const phraseDeRendu = (pos: number) => { let i = 0; while (i + 1 < debuts.length && debuts[i + 1] <= pos) i++; return i }

  const ancienDebut = Number(p.phrase_debut.split('-')[1]), ancienFin = Number(p.phrase_fin.split('-')[1])
  const nouveauxPivots: string[][] = []
  let manque = false
  p.pivots_texte.forEach((t, i) => {
    const cible = norm(t)
    const pos = cible ? rendu.indexOf(cible) : -1
    if (pos === -1) { manque = true; return }
    const a = phraseDeRendu(pos), b = phraseDeRendu(pos + cible.length - 1)
    const ids = d.phrases.slice(a, Math.min(b, a + 1) + 1).map(ph => ph.id)
    if (ids.length === 0) { manque = true; return }
    nouveauxPivots.push(ids)
    void i
  })
  if (nouveauxPivots.length === 0) return { ...p, revoir: true, ...(version ? { decoupage_version: version } : {}) }
  // Bornes : la première pivot garde sa distance au début du passage, la dernière au sa fin.
  const premiere = idx(d, nouveauxPivots[0][0])
  const ancienPremierPivot = Number((p.pivots[0]?.[0] ?? p.phrase_debut).split('-')[1])
  const avant = Math.max(0, ancienPremierPivot - ancienDebut), apres = Math.max(0, ancienFin - ancienPremierPivot)
  const ia = Math.max(0, premiere - avant), ib = Math.min(d.phrases.length - 1, premiere + apres)
  return {
    ...p,
    phrase_debut: d.phrases[ia].id, phrase_fin: d.phrases[ib].id,
    pivots: nouveauxPivots, pivots_texte: nouveauxPivots.map(ids => textePivot(texte, d, ids)),
    revoir: manque || undefined,
    ...(version ? { decoupage_version: version } : {}),
  }
}

/** Forme tolérante d'un `passages_cles` lu depuis le jsonb. */
export function parsePassages(x: unknown): PassageCle[] {
  if (!Array.isArray(x)) return []
  return x.flatMap(p => {
    const o = p as Partial<PassageCle> | null
    if (!o || typeof o.phrase_debut !== 'string' || typeof o.phrase_fin !== 'string') return []
    const pivots = Array.isArray(o.pivots) ? o.pivots.filter(a => Array.isArray(a) && a.every(s => typeof s === 'string')) as string[][] : []
    return [{
      id: typeof o.id === 'string' ? o.id : '',
      role: typeof o.role === 'string' ? o.role : 'these',
      libelle: typeof o.libelle === 'string' ? o.libelle : '',
      phrase_debut: o.phrase_debut, phrase_fin: o.phrase_fin,
      pivots,
      pivots_texte: Array.isArray(o.pivots_texte) ? o.pivots_texte.filter((s): s is string => typeof s === 'string') : [],
      ...(typeof o.decoupage_version === 'string' ? { decoupage_version: o.decoupage_version } : {}),
      ...(o.revoir === true ? { revoir: true } : {}),
    }]
  })
}
