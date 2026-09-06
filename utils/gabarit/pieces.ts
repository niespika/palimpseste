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
// ⭐⭐ 06/09 (nuit) — LE CRAN 2 EST UN TEXTE À TROU (`10-` v0.9 §2 bis.1, `08-`
//    v1.10 §5, décision de Louis sur la relecture des 38 exercices dérivés) :
//    `exercices_cas.pieces` est le DEVOIR EN MORCEAUX, dans l'ordre du texte, et
//    EXACTEMENT UN morceau a `texte: null` — c'est le trou, son `nom` est la
//    pièce que l'élève écrit, en mots d'élève. La place du trou vient donc des
//    DONNÉES, plus d'un choix d'écran. ⚠️ L'ancienne règle par objet (la place
//    vide « à l'endroit du constituant dans l'ordre de la fiche ») reste en repli
//    pour un cas SANS trou — la première forme, retirée du bac à sable le 06/09.
//    Mesuré sur `gabarit-c2.json` (24 exercices à trou, 06/09) : un morceau fait
//    de 39 à 519 caractères, 21 trous au milieu, 3 en fin de texte, 0 en tête.
//    L'objet assemblé est UN texte continu : les morceaux se recollent par une
//    espace, jamais par un saut de paragraphe.
// ⛔ « Les noms des constituants sont des mots de concepteur » (`09-` §0) : ce
//    que l'élève lit sur la place vide est la DEMANDE du geste (« Écris ce qui
//    fait que cet appui-là soutient cette conclusion-là »), jamais « le garant ».
// ============================================================================

export interface Piece {
  nom: string
  texte: string
}

/** Un morceau tel que la base le porte : `texte: null` est LE TROU (`08-` v1.10 §5). */
export interface Morceau {
  nom: string
  texte: string | null
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
  /** Le nom du trou, en mots d'élève (« ce qui fait que cet appui soutient cette conclusion ») ; `null` sans trou déclaré. */
  trou: string | null
  /**
   * ⭐ 06/09 — LA FORME DU TROU. `trou` : un blanc dans le texte, l'élève écrit
   *    la pièce. `ordre` : le trou est UN ORDRE (`10-` v0.9 : « le plan, dont le
   *    trou est un ordre ») — les pièces sont les thèses, dans le désordre ;
   *    l'élève les met dans l'ordre et écrit entre chacune le mot qui lie
   *    (« car », « mais », « donc »). Sa production est le plan assemblé.
   */
  forme: 'trou' | 'ordre'
}

/** Les objets dont le trou est un ordre — le plan (`10-` v0.9 ; `09-` §7 : « l'ordre, écrit »). */
export function formeDuTrou(objet: string): 'trou' | 'ordre' {
  return objet === 'plan' ? 'ordre' : 'trou'
}

/** La fiche dit que la pièce et l'objet se confondent (`mot`, `phrase`). */
const PIECE_EST_L_OBJET = /se confondent/i

// ── Les pièces, lues avec tolérance ─────────────────────────────────────────

/**
 * `exercices_cas.pieces` — un tableau de `{nom, texte}` : le nom non vide, le
 * texte non vide OU `null` (le trou) ; tout le reste est ignoré. `[]` sur
 * toute autre forme.
 */
export function lireLesPieces(brut: unknown): Morceau[] {
  const liste = typeof brut === 'string' ? tenteJson(brut) : brut
  if (!Array.isArray(liste)) return []
  const out: Morceau[] = []
  for (const p of liste) {
    if (!p || typeof p !== 'object') continue
    const { nom, texte } = p as { nom?: unknown; texte?: unknown }
    if (typeof nom !== 'string' || nom.trim() === '') continue
    if (texte === null) { out.push({ nom: nom.trim(), texte: null }); continue }
    if (typeof texte !== 'string' || texte.trim() === '') continue
    out.push({ nom: nom.trim(), texte: texte.trim() })
  }
  return out
}

/**
 * ⭐ Le trou, séparé des morceaux : les pièces (texte non nul), la place du
 *    trou parmi elles, et son nom. Sans trou déclaré, la place vient de la
 *    règle par objet (repli), et `trou` vaut `null`.
 */
export function separerLeTrou(objet: string, morceaux: readonly Morceau[]): { pieces: Piece[]; place: number; trou: string | null } {
  const pieces: Piece[] = []
  let place = -1
  let trou: string | null = null
  for (const m of morceaux) {
    if (m.texte === null) { if (place < 0) { place = pieces.length; trou = m.nom }; continue }
    pieces.push({ nom: m.nom, texte: m.texte })
  }
  if (place < 0) place = placeDeLaPieceVide(objet, pieces)
  return { pieces, place, trou }
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

/** Les pièces d'un cas, composées pour l'écran — le trou lu dans les données. */
export function composerLesPieces(
  objet: string, cas: { constituant: string; pieces: readonly Morceau[] }, geste: string | null,
): PiecesServies {
  const { pieces, place, trou } = separerLeTrou(objet, cas.pieces)
  return { constituant: cas.constituant, demande: demandeDuGeste(geste), place, pieces, trou, forme: formeDuTrou(objet) }
}

// ── Le plan : l'ordre et les mots qui lient ─────────────────────────────────

/** L'état du plan à l'écran : l'ordre des thèses (indices dans `pieces`) et le mot qui lie devant chacune (vide devant la première). */
export interface EtatDuPlan {
  ordre: number[]
  liaisons: string[]
}

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const sansPointFinal = (s: string) => s.trim().replace(/[.]+$/, '')

/**
 * ⭐ LE PLAN ASSEMBLÉ — la production de l'élève, dérivée de l'ordre et des mots
 *    qui lient : « Thèse A. Mais thèse B. Donc thèse C. » — une phrase par
 *    partie, le mot qui lie en tête, une majuscule, un point. C'est CE TEXTE qui
 *    s'enregistre (`texte_v1` / `texte_vf`) et que le juge lit ; l'ordre et les
 *    mots n'ont pas d'autre domicile.
 */
export function composerLePlan(theses: readonly Piece[], etat: EtatDuPlan): string {
  const phrases: string[] = []
  etat.ordre.forEach((idx, pos) => {
    const these = theses[idx]
    if (!these) return
    const mot = (etat.liaisons[pos] ?? '').trim()
    const corps = sansPointFinal(these.texte)
    phrases.push(`${majuscule(mot === '' ? corps : `${mot} ${corps}`)}.`)
  })
  return phrases.join(' ')
}

/**
 * ⭐ LE PLAN RELU — l'ordre et les mots retrouvés dans un texte enregistré, pour
 *    reprendre l'écran là où il en était. Chaque thèse se cherche telle quelle
 *    (à la majuscule initiale près) ; le mot qui lie est ce qui précède la thèse
 *    dans sa phrase. `null` si une thèse manque : le texte n'est pas un plan
 *    composé par l'écran, et l'écran repart de zéro.
 */
export function lireLePlan(texte: string, theses: readonly Piece[]): EtatDuPlan | null {
  const t = texte ?? ''
  const trouvees: Array<{ idx: number; debut: number }> = []
  theses.forEach((these, idx) => {
    const corps = sansPointFinal(these.texte)
    const bas = t.toLowerCase().indexOf(corps.toLowerCase())
    if (bas < 0) return
    trouvees.push({ idx, debut: bas })
  })
  if (trouvees.length !== theses.length || theses.length === 0) return null
  trouvees.sort((a, b) => a.debut - b.debut)
  const ordre = trouvees.map((x) => x.idx)
  const liaisons = trouvees.map((x, pos) => {
    if (pos === 0) return ''
    const prec = trouvees[pos - 1]!
    const finPrec = prec.debut + sansPointFinal(theses[prec.idx]!.texte).length
    // Entre la fin de la thèse précédente et le début de celle-ci : « . Mais » → « mais ».
    return t.slice(finPrec, x.debut).replace(/^[\s.]+/, '').trim().toLowerCase()
  })
  return { ordre, liaisons }
}

// ── L'assemblage — ce que le juge reçoit ────────────────────────────────────

/**
 * L'objet ASSEMBLÉ : les morceaux servis dans l'ordre, la pièce de l'élève à sa
 * place — UN texte continu, les morceaux recollés par une espace (le cran 2 est
 * un texte à trou). C'est une DÉRIVATION, faite au moment de juger et de
 * montrer : rien de tout cela ne s'écrit en base (la production de l'élève
 * reste la pièce seule, `texte_v1` / `texte_vf`).
 * @param marque entoure la pièce de l'élève — pour que le juge sache laquelle est la sienne.
 */
export function assemblerLObjet(
  pieces: readonly Piece[], place: number, pieceDeLEleve: string,
  marque: { avant: string; apres: string } = { avant: '', apres: '' },
): string {
  const p = Math.max(0, Math.min(place, pieces.length))
  const textes = pieces.map((x) => x.texte)
  const sienne = `${marque.avant}${pieceDeLEleve.trim()}${marque.apres}`
  return [...textes.slice(0, p), sienne, ...textes.slice(p)].filter((t) => t.trim() !== '').join(' ')
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

// ── ⭐ Le cran 5 en texte à trou (`10-` v0.12 §2 bis.6, validé par Louis le 06/09) ──

/** Ce que le texte à trou du cran 5 dit du trou, en mots d'élève. */
export const TROU_DU_CRAN_5 = {
  passage: 'le passage à réécrire, sans ce problème',
  insertion: 'ce qui manque à cet endroit',
  avant: 'le devoir, avant le passage',
  apres: 'le devoir, après le passage',
} as const

/**
 * ⭐ LE TROU DU CRAN 5 — dérivé des segments que l'écran MARQUE déjà en gras
 *    (`marquerLeMateriau`, la règle du `10-` §5 : le passage étendu aux bornes
 *    de sa phrase) : un seul domicile pour les bornes, celui du marquage. Le
 *    passage marqué devient le trou ; ce qui le précède et ce qui le suit sont
 *    les deux morceaux servis. ⚠️ Sur une INSERTION, le marquage n'est pas un
 *    passage à retirer mais « le dernier mot avant et le premier après » : le
 *    trou se glisse entre les deux, à la première espace de la zone marquée, et
 *    rien n'est retiré. `null` quand rien n'est marqué : pas de trou à servir,
 *    l'écran reste celui d'hier.
 */
export function morceauxDuPassage(
  segments: ReadonlyArray<{ texte: string; marque: boolean }>, insertion: boolean,
): PiecesServies | null {
  const contenu = segments.map((s) => s.texte).join('')
  let debut = -1, fin = -1, curseur = 0
  for (const s of segments) {
    if (s.marque) { if (debut < 0) debut = curseur; fin = curseur + s.texte.length }
    curseur += s.texte.length
  }
  if (debut < 0) return null
  let avant: string, apres: string
  if (insertion) {
    const zone = contenu.slice(debut, fin)
    const m = /\s+/.exec(zone)
    const coupe = m ? debut + m.index + m[0].length : fin
    avant = contenu.slice(0, coupe)
    apres = contenu.slice(coupe)
  } else {
    avant = contenu.slice(0, debut)
    apres = contenu.slice(fin)
  }
  const pieces: Piece[] = []
  if (avant.trim() !== '') pieces.push({ nom: TROU_DU_CRAN_5.avant, texte: avant.trim() })
  const place = pieces.length
  if (apres.trim() !== '') pieces.push({ nom: TROU_DU_CRAN_5.apres, texte: apres.trim() })
  return {
    constituant: 'le passage', demande: null, place, pieces,
    trou: insertion ? TROU_DU_CRAN_5.insertion : TROU_DU_CRAN_5.passage, forme: 'trou',
  }
}
