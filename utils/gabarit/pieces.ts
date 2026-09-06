// ============================================================================
// C7 — LE CRAN 2, « VOICI LES PIÈCES » (`10-Gabarit.md` §2 bis.1, §3, §6, §7).
// Module PUR : ce que l'écran, le juge et le registre dérivent des pièces d'un
// cas de cran 2 — jamais une base, jamais un appel.
// ----------------------------------------------------------------------------
// ⭐ « Les pièces servies s'affichent À LEUR PLACE dans l'objet, la place vide
//    entre elles ; l'élève n'écrit que la pièce ; l'écran assemble, et c'est
//    l'objet assemblé que le juge reçoit » (`10-` §2 bis.1, « ce que l'écran
//    fait »). Les pièces viennent de `exercices_cas.pieces` (`[{nom, texte}]`,
//    format 1.5, `08-` §5) ; le geste vient de `exercices_pieces` (dérivée du
//    `09-`) et se RECOPIE — il ne se génère pas (`10-` §3).
// ⚠️ OÙ VA LA PLACE VIDE — le format ne le dit pas (des pièces `{nom, texte}`
//    seulement). C'est un CHOIX D'ÉCRAN, tranché ici (prompt du 06/09) : la
//    place vide se met à l'endroit du constituant dans l'ordre de la fiche —
//    argument : conclusion · preuve · GARANT ⇒ en dernier ; transition : bilan ·
//    LIMITE · annonce ⇒ au milieu ; phrase : avant · LA PHRASE · après ; exemple,
//    objection, paragraphe ⇒ en dernier ; plan : les thèses, puis l'ordre écrit
//    en dessous. Mesuré sur `gabarit-c2.json` (38 exercices, 06/09) : une
//    `phrase` n'a parfois qu'UNE pièce (« ce qui vient après » seule), et trois
//    `paragraphe` en ont trois au lieu de quatre — la règle lit les NOMS, pas un
//    nombre attendu.
// ⛔ « Les noms des constituants sont des mots de concepteur » (`09-` §0) : ce
//    que l'élève lit sur la place vide est la DEMANDE du geste (« Écris ce qui
//    fait que cet appui-là soutient cette conclusion-là »), jamais « le garant ».
// ============================================================================

export interface Piece {
  nom: string
  texte: string
}

/** Ce que l'écran sert pour un cas de cran 2 — les pièces, et la place vide. */
export interface PiecesServies {
  /** Le constituant, tel que le cas le porte (`exercices_cas.constituant`). */
  constituant: string
  /** La DEMANDE du geste — la phrase à l'impératif, en mots d'élève ; `null` sans geste. */
  demande: string | null
  /** L'index de la place vide parmi les pièces : 0 = avant la première, `pieces.length` = après la dernière. */
  place: number
  pieces: Piece[]
}

/** La fiche dit que la pièce et l'objet se confondent (`mot`, `phrase`). */
const PIECE_EST_L_OBJET = /se confondent/i

// ── Les pièces, lues avec tolérance ─────────────────────────────────────────

/**
 * `exercices_cas.pieces` — un tableau de `{nom, texte}`, les deux non vides ;
 * tout le reste est ignoré. `[]` sur toute autre forme.
 */
export function lireLesPieces(brut: unknown): Piece[] {
  const liste = typeof brut === 'string' ? tenteJson(brut) : brut
  if (!Array.isArray(liste)) return []
  const out: Piece[] = []
  for (const p of liste) {
    if (!p || typeof p !== 'object') continue
    const { nom, texte } = p as { nom?: unknown; texte?: unknown }
    if (typeof nom !== 'string' || typeof texte !== 'string') continue
    if (nom.trim() === '' || texte.trim() === '') continue
    out.push({ nom: nom.trim(), texte: texte.trim() })
  }
  return out
}

function tenteJson(s: string): unknown {
  try { return JSON.parse(s) } catch { return null }
}

// ── Le geste : l'annonce, puis la demande ───────────────────────────────────

/**
 * La demande du geste — ce qui suit la première phrase (« Voici … »). Le geste
 * du `09-` est écrit sur ce patron pour les vingt et une fiches ; s'il ne
 * commence pas par « Voici », il est rendu entier.
 */
export function demandeDuGeste(geste: string | null | undefined): string | null {
  const g = (geste ?? '').trim()
  if (g === '') return null
  const m = /^Voici[^.]*\.\s*/.exec(g)
  const reste = m ? g.slice(m[0].length).trim() : g
  return reste === '' ? g : reste
}

// ── La place vide ───────────────────────────────────────────────────────────

/**
 * L'index de la place vide parmi les pièces servies — le choix d'écran écrit
 * en tête de ce fichier. Il lit l'objet et les NOMS des pièces, jamais un
 * nombre attendu.
 */
export function placeDeLaPieceVide(objet: string, pieces: readonly Piece[]): number {
  const n = pieces.length
  switch (objet) {
    case 'transition':
      // bilan · LIMITE · annonce — entre « ce que le premier a établi » et « ce que le second va faire ».
      return Math.min(1, n)
    case 'phrase': {
      // avant · LA PHRASE · après — devant la pièce « ce qui vient après », s'il y en a une.
      const apres = pieces.findIndex((p) => /\bapr[èe]s\b/i.test(p.nom))
      return apres >= 0 ? apres : n
    }
    default:
      return n
  }
}

/** Les pièces d'un cas, composées pour l'écran. */
export function composerLesPieces(
  objet: string, cas: { constituant: string; pieces: readonly Piece[] }, geste: string | null,
): PiecesServies {
  const pieces = [...cas.pieces]
  return {
    constituant: cas.constituant,
    demande: demandeDuGeste(geste),
    place: placeDeLaPieceVide(objet, pieces),
    pieces,
  }
}

// ── L'assemblage — ce que le juge reçoit ────────────────────────────────────

/**
 * L'objet ASSEMBLÉ : les pièces servies dans l'ordre, la pièce de l'élève à sa
 * place — une pièce par paragraphe. C'est une DÉRIVATION, faite au moment de
 * juger et de montrer : rien de tout cela ne s'écrit en base (la production de
 * l'élève reste la pièce seule, `texte_v1` / `texte_vf`).
 * @param marque entoure la pièce de l'élève — pour que le juge sache laquelle est la sienne.
 */
export function assemblerLObjet(
  pieces: readonly Piece[], place: number, pieceDeLEleve: string,
  marque: { avant: string; apres: string } = { avant: '', apres: '' },
): string {
  const p = Math.max(0, Math.min(place, pieces.length))
  const textes = pieces.map((x) => x.texte)
  const sienne = `${marque.avant}${pieceDeLEleve.trim()}${marque.apres}`
  return [...textes.slice(0, p), sienne, ...textes.slice(p)].filter((t) => t.trim() !== '').join('\n\n')
}

// ── Le constituant de la grille — pour l'observable (décision 17) ───────────

/**
 * Le nom NU d'un constituant : sans article ni tournure (« le garant » →
 * « garant », « l'ordre, écrit » → « ordre », « Ce qu'on accorde » → « accorde »).
 */
export function nomDuConstituant(c: string): string {
  let s = c.trim().toLowerCase().replace(/[’]/g, "'")
  for (let i = 0; i < 3; i++) {
    s = s.replace(/^(?:ce qu'on|ce que|ce qu'|ce qui|ce|le|la|les|l'|un|une|des|du|de la|d'|on)\s+/, '')
    s = s.replace(/^(?:l'|d'|qu')/, '')
  }
  s = s.split(/[,—–(:;]/)[0] ?? s
  return s.trim()
}

function correspond(a: string, b: string): boolean {
  if (a === '' || b === '') return false
  return a === b || a.startsWith(b) || b.startsWith(a)
}

/**
 * ⭐ DÉCISION 17 — « le retour ne parle que de l'observable du constituant »,
 *    et « l'observable se lit dans `exercices_problemes` : les problèmes dont
 *    `constituant` est celui de la pièce, sur cet objet ». Ce module rend LE
 *    NOM du constituant tel que la grille l'écrit, ou `null` quand la pièce
 *    engage l'objet entier (« la pièce et l'objet se confondent »).
 *
 * Trois chemins, tous dérivés des données, jamais d'une table écrite ici :
 *   1. le nom nu de la pièce correspond à un constituant de la grille
 *      (« le garant » → `garant`, « la limite » → `limite`, « l'ordre, écrit » → `ordre`) ;
 *   2. sinon, PAR ÉLIMINATION sur la fiche : quand tous les autres constituants
 *      de la fiche trouvent leur entrée dans la grille et qu'il n'en reste
 *      qu'une, c'est celle de la pièce (« ce que cela change » → `traitement`,
 *      sur l'objection — mesuré en bac à sable le 06/09) ;
 *   3. sinon `null` : l'appelant borne sur l'objet entier, et le dit.
 */
export function constituantDeLaGrille(
  constituant: string, grille: readonly string[], fiche: readonly string[] = [],
): string | null {
  if (PIECE_EST_L_OBJET.test(constituant)) return null
  const nu = nomDuConstituant(constituant)
  const direct = grille.find((g) => correspond(nu, nomDuConstituant(g)))
  if (direct) return direct
  // Par élimination.
  const pris = new Set<string>()
  for (const f of fiche) {
    const nf = nomDuConstituant(f)
    if (correspond(nu, nf)) continue                      // la pièce elle-même
    const g = grille.find((x) => !pris.has(x) && correspond(nf, nomDuConstituant(x)))
    if (g) pris.add(g)
  }
  const restants = grille.filter((g) => !pris.has(g))
  return restants.length === 1 ? restants[0]! : null
}

/**
 * Les observables que la pièce engage : ceux des problèmes de la grille dont
 * le constituant est celui de la pièce — TOUS ceux de l'objet quand la pièce
 * est l'objet. Dédoublonnés, dans l'ordre de la grille, sans les entrées sans
 * observable.
 */
export function observablesDuConstituant(
  problemes: ReadonlyArray<{ constituant: string; code: string | null; competence: string | null }>,
  constituantGrille: string | null,
): Array<{ code: string; competence: string | null }> {
  const vus = new Set<string>()
  const out: Array<{ code: string; competence: string | null }> = []
  for (const p of problemes) {
    if (constituantGrille !== null && p.constituant !== constituantGrille) continue
    if (!p.code || vus.has(p.code)) continue
    vus.add(p.code)
    out.push({ code: p.code, competence: p.competence })
  }
  return out
}
